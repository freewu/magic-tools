import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import CSRGenerator from './index';
import { saveTextFile } from '../../lib/tauri';
import { csrAvailable, generateCsr } from './lib';

// generateCsr 会真的生成 RSA 密钥 (慢), 交互测试改为打桩; csrAvailable 逐用例控制
jest.mock('./lib', () => ({
  ...(jest.requireActual('./lib') as Record<string, unknown>),
  generateCsr: jest.fn(),
  csrAvailable: jest.fn(() => true),
}));

// 桌面环境: 保存走系统保存对话框 (saveTextFile)
jest.mock('../../lib/tauri', () => ({
  isTauri: () => true,
  saveTextFile: jest.fn().mockResolvedValue(true),
}));

const mockGenerate = generateCsr as jest.Mock;
const mockAvailable = csrAvailable as jest.Mock;

const RESULT = {
  privateKeyPem: '-----BEGIN PRIVATE KEY-----\nMIIabc\n-----END PRIVATE KEY-----\n',
  csrPem: '-----BEGIN CERTIFICATE REQUEST-----\nMIIdef\n-----END CERTIFICATE REQUEST-----\n',
  keyBits: 2048,
  keyFormat: 'pkcs8' as const,
  subjectLine: 'C=CN, CN=example.com',
  san: [ 'DNS:example.com' ],
  fingerprint: 'AB:CD',
  signatureAlgorithm: 'sha256WithRSAEncryption',
};

/** 按按钮文案定位 (antd 会在两个汉字间插空格, 故比较去掉空白后的文本) */
const btn = (name: string): HTMLButtonElement => {
  const target = name.replace(/\s+/g, '');
  const hit = screen
    .getAllByText((_, el) => (el?.textContent ?? '').replace(/\s+/g, '') === target)
    .find((el) => el.closest('button'));
  if (!hit) throw new Error(`未找到按钮: ${name}`);
  return hit.closest('button') as HTMLButtonElement;
};
const btns = (name: string): HTMLButtonElement[] => {
  const target = name.replace(/\s+/g, '');
  const hits = screen
    .getAllByText((_, el) => (el?.textContent ?? '').replace(/\s+/g, '') === target)
    .map((el) => el.closest('button'))
    .filter((b): b is HTMLButtonElement => !!b);
  return Array.from(new Set(hits)); // 按钮与其内部 <span> 文案都会被命中, 去重
};
const click = (name: string) => fireEvent.click(btn(name));
const cnInput = () => screen.getByPlaceholderText('example.com 或 公司名 (必填)') as HTMLInputElement;
const sanInput = () => screen.getByPlaceholderText(/IP 自动识别/) as HTMLTextAreaElement;

/** 打开第 n 个 antd Select (0 = 密钥算法, 1 = 私钥格式) 并选中某文案的选项 */
const selectOption = (index: number, optionText: string) => {
  const selectors = document.querySelectorAll('.ant-select-selector');
  fireEvent.mouseDown(selectors[index]);
  const option = screen.getAllByText(optionText).find((el) => el.closest('.ant-select-item'));
  if (!option) throw new Error(`未找到选项: ${optionText}`);
  fireEvent.click(option);
};

describe('CSRGenerator 初始界面', () => {
  beforeEach(() => {
    mockGenerate.mockReset();
    mockAvailable.mockReturnValue(true);
    (saveTextFile as jest.Mock).mockClear();
    Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });
  });

  test('渲染主体表单 / 密钥选项 / 生成按钮, 未生成时展示占位提示', () => {
    render(<CSRGenerator />);
    expect(screen.getByText('主体信息 (Subject)')).toBeInTheDocument();
    for (const label of [ '通用名称 (CN)', '组织 (O)', '部门 (OU)', '城市 (L)', '省份 (ST)', '国家代码 (C)', '邮箱 (Email)', 'SAN (备用名称)', '密钥算法', '私钥格式' ]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0); // 说明区也会出现同名 <b>, 故用 AllBy
    }
    expect(cnInput().value).toBe('');
    expect(sanInput().value).toBe('');
    expect(screen.getByText('还没生成, 填写上方信息后点「生成密钥与 CSR」')).toBeInTheDocument();
    expect(btn('生成密钥与 CSR')).toBeEnabled();
    expect(screen.getByText(/OpenSSL 3\.x 默认格式/)).toBeInTheDocument(); // 私钥格式说明随选项展示
  });

  test('不支持的浏览器: 显示告警并禁用生成', () => {
    mockAvailable.mockReturnValue(false);
    render(<CSRGenerator />);
    expect(screen.getByText('当前环境不支持 WebCrypto (crypto.subtle), 无法生成密钥')).toBeInTheDocument();
    expect(btn('生成密钥与 CSR')).toBeDisabled();
  });

  test('CN 为空时点生成只提示, 不调用生成逻辑', async () => {
    render(<CSRGenerator />);
    click('生成密钥与 CSR');
    await waitFor(() => expect(screen.getByText('通用名称 (CN) 不能为空')).toBeInTheDocument());
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  test('SAN 里有非法条目时提示具体值', async () => {
    render(<CSRGenerator />);
    fireEvent.change(cnInput(), { target: { value: 'example.com' } });
    fireEvent.change(sanInput(), { target: { value: 'ok.com\nhttp://x' } });
    click('生成密钥与 CSR');
    await waitFor(() => expect(screen.getByText('SAN 中的 http://x 不是合法的域名或 IP')).toBeInTheDocument());
    expect(mockGenerate).not.toHaveBeenCalled();
  });
});

describe('CSRGenerator 生成与保存', () => {
  beforeEach(() => {
    mockGenerate.mockReset();
    mockAvailable.mockReturnValue(true);
    (saveTextFile as jest.Mock).mockClear();
    Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });
  });

  test('填写后生成: 展示摘要与私钥 / CSR 两块结果', async () => {
    mockGenerate.mockResolvedValue(RESULT);
    const { container } = render(<CSRGenerator />);
    fireEvent.change(cnInput(), { target: { value: 'example.com' } });
    fireEvent.change(sanInput(), { target: { value: 'example.com' } });
    click('生成密钥与 CSR');

    await waitFor(() => expect(mockGenerate).toHaveBeenCalledTimes(1));
    expect(mockGenerate.mock.calls[0][0]).toMatchObject({
      subject: { commonName: 'example.com', country: 'CN' },
      san: 'example.com',
      keyBits: 2048,
      keyFormat: 'pkcs8',
    });

    await waitFor(() => expect(screen.getByText('已生成 2048 位 RSA 私钥与 CSR')).toBeInTheDocument());
    expect(screen.getByText('生成结果摘要')).toBeInTheDocument();
    expect(screen.getAllByText('RSA-2048').length).toBeGreaterThan(0); // 摘要值与算法下拉选项同名
    expect(screen.getByText('sha256WithRSAEncryption')).toBeInTheDocument();
    expect(screen.getByText('C=CN, CN=example.com')).toBeInTheDocument();
    expect(screen.getByText('DNS:example.com')).toBeInTheDocument();
    expect(screen.getByText('AB:CD')).toBeInTheDocument();

    expect(screen.getByText('server.key (私钥, 请务必保密)')).toBeInTheDocument();
    expect(screen.getByText('server.csr (提交给 CA 的证书签名请求)')).toBeInTheDocument();
    const areas = container.querySelectorAll('textarea');
    const values = Array.from(areas).map((a) => (a as HTMLTextAreaElement).value);
    expect(values).toContain(RESULT.privateKeyPem);
    expect(values).toContain(RESULT.csrPem);
    expect(screen.queryByText('还没生成, 填写上方信息后点「生成密钥与 CSR」')).toBeNull();
  });

  test('私钥格式 / 密钥位数可切换并传入生成逻辑', async () => {
    mockGenerate.mockResolvedValue({ ...RESULT, keyBits: 4096, keyFormat: 'pkcs1' as const });
    render(<CSRGenerator />);
    fireEvent.change(cnInput(), { target: { value: 'a.com' } });
    selectOption(0, 'RSA-4096');
    selectOption(1, 'PKCS#1 (RSA PRIVATE KEY)');
    click('生成密钥与 CSR');

    await waitFor(() => expect(mockGenerate).toHaveBeenCalledTimes(1));
    expect(mockGenerate.mock.calls[0][0]).toMatchObject({ keyBits: 4096, keyFormat: 'pkcs1' });
    await waitFor(() => expect(screen.getByText('已生成 4096 位 RSA 私钥与 CSR')).toBeInTheDocument());
  });

  test('复制私钥 / 复制 CSR 分别写入粘贴板', async () => {
    mockGenerate.mockResolvedValue(RESULT);
    render(<CSRGenerator />);
    fireEvent.change(cnInput(), { target: { value: 'example.com' } });
    click('生成密钥与 CSR');
    await waitFor(() => expect(screen.getByText('生成结果摘要')).toBeInTheDocument());

    const copyBtns = btns('复制');
    expect(copyBtns).toHaveLength(2);
    fireEvent.click(copyBtns[0]);
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(RESULT.privateKeyPem));
    expect(screen.getByText('私钥 已复制到粘贴板')).toBeInTheDocument();

    fireEvent.click(copyBtns[1]);
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(RESULT.csrPem));
    expect(screen.getByText('证书签名请求 已复制到粘贴板')).toBeInTheDocument();
  });

  test('双击结果文本域触发复制', async () => {
    mockGenerate.mockResolvedValue(RESULT);
    const { container } = render(<CSRGenerator />);
    fireEvent.change(cnInput(), { target: { value: 'example.com' } });
    click('生成密钥与 CSR');
    await waitFor(() => expect(screen.getByText('生成结果摘要')).toBeInTheDocument());

    const areas = Array.from(container.querySelectorAll('textarea')) as HTMLTextAreaElement[];
    const keyArea = areas.find((a) => a.value === RESULT.privateKeyPem)!;
    fireEvent.doubleClick(keyArea);
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(RESULT.privateKeyPem));
  });

  test('保存私钥 / CSR: 走系统保存对话框, 文件名与内容正确', async () => {
    mockGenerate.mockResolvedValue(RESULT);
    render(<CSRGenerator />);
    fireEvent.change(cnInput(), { target: { value: 'example.com' } });
    click('生成密钥与 CSR');
    await waitFor(() => expect(screen.getByText('生成结果摘要')).toBeInTheDocument());

    click('保存为 server.key');
    await waitFor(() => expect(saveTextFile).toHaveBeenCalledTimes(1));
    expect((saveTextFile as jest.Mock).mock.calls[0][0]).toBe('server.key');
    expect((saveTextFile as jest.Mock).mock.calls[0][1]).toBe(RESULT.privateKeyPem);
    expect((saveTextFile as jest.Mock).mock.calls[0][3]).toMatchObject({ extensions: [ 'key', 'pem' ] });
    await waitFor(() => expect(screen.getByText('已保存 server.key')).toBeInTheDocument());

    click('保存为 server.csr');
    await waitFor(() => expect(saveTextFile).toHaveBeenCalledTimes(2));
    expect((saveTextFile as jest.Mock).mock.calls[1][0]).toBe('server.csr');
    expect((saveTextFile as jest.Mock).mock.calls[1][1]).toBe(RESULT.csrPem);
    expect((saveTextFile as jest.Mock).mock.calls[1][3]).toMatchObject({ extensions: [ 'csr', 'pem' ] });
  });

  test('保存失败时给出错误提示 (不静默)', async () => {
    mockGenerate.mockResolvedValue(RESULT);
    (saveTextFile as jest.Mock).mockRejectedValueOnce(new Error('磁盘已满'));
    render(<CSRGenerator />);
    fireEvent.change(cnInput(), { target: { value: 'example.com' } });
    click('生成密钥与 CSR');
    await waitFor(() => expect(screen.getByText('生成结果摘要')).toBeInTheDocument());

    click('保存为 server.key');
    await waitFor(() => expect(screen.getByText('保存失败: 磁盘已满')).toBeInTheDocument());
  });

  test('生成失败时提示错误信息', async () => {
    mockGenerate.mockRejectedValue(new Error('生成器异常'));
    render(<CSRGenerator />);
    fireEvent.change(cnInput(), { target: { value: 'example.com' } });
    click('生成密钥与 CSR');
    await waitFor(() => expect(screen.getByText('生成失败: 生成器异常')).toBeInTheDocument());
    expect(screen.getByText('还没生成, 填写上方信息后点「生成密钥与 CSR」')).toBeInTheDocument();
  });

  test('清除结果 / 重置 分别清空结果与表单', async () => {
    mockGenerate.mockResolvedValue(RESULT);
    render(<CSRGenerator />);
    fireEvent.change(cnInput(), { target: { value: 'example.com' } });
    fireEvent.change(sanInput(), { target: { value: 'example.com' } });
    click('生成密钥与 CSR');
    await waitFor(() => expect(screen.getByText('生成结果摘要')).toBeInTheDocument());

    click('清除结果');
    expect(screen.queryByText('生成结果摘要')).toBeNull();
    expect(screen.getByText('还没生成, 填写上方信息后点「生成密钥与 CSR」')).toBeInTheDocument();
    expect(cnInput().value).toBe('example.com'); // 表单保留

    click('重置');
    expect(cnInput().value).toBe('');
    expect(sanInput().value).toBe('');
  });

  test('国家代码输入自动转大写', () => {
    render(<CSRGenerator />);
    const cInput = screen.getByPlaceholderText('CN') as HTMLInputElement;
    fireEvent.change(cInput, { target: { value: 'us' } });
    expect(cInput.value).toBe('US');
  });
});

describe('CSRGenerator 说明区', () => {
  test('渲染说明标题与关键结论', () => {
    const { container } = render(<CSRGenerator />);
    expect(screen.getByText('CSR 申请文件说明')).toBeInTheDocument(); // Divider 文本查询不做归一化, 这里用去掉首尾空格的写法
    const intro = container.querySelector('.intro')!;
    expect(within(intro as HTMLElement).getByText('这个工具做什么')).toBeInTheDocument();
    expect(intro.textContent).toContain('server.csr');
    expect(intro.textContent).toContain('sha256WithRSAEncryption');
  });
});
