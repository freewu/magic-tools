import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { saveBytesFile } from '../../lib/tauri';
import BOMCheck from './index';

jest.mock('../../lib/tauri', () => ({
  ...jest.requireActual('../../lib/tauri'),
  saveBytesFile: jest.fn().mockResolvedValue(true),
}));

const mockSave = saveBytesFile as jest.Mock;

const UTF8_BOM = [ 0xEF, 0xBB, 0xBF ];
const UTF16LE_BOM = [ 0xFF, 0xFE ];

/** 构造测试文件 (可指定修改时间) */
const fileOf = (name: string, bytes: number[], lastModified = 1767222245000) =>
  new File([ new Uint8Array(bytes) ], name, { type: 'text/plain', lastModified });

/** 通过隐藏的 file input 选择文件 */
const pick = (files: File[]) => {
  const input = document.querySelector('#bomFileInput') as HTMLInputElement;
  fireEvent.change(input, { target: { files } });
};

/** 拖拽载入文件 */
const drop = (files: File[]) => {
  const zone = screen.getByText(/点击左侧按钮选择文件/);
  fireEvent.drop(zone, { dataTransfer: { files } });
};

/** 提示信息文本 */
const noticeText = (): string => document.querySelector('.ant-message')?.textContent ?? '';

/** 中文按钮名 (antd 会在恰好两个汉字间插入空格) */
const btn = (name: string): HTMLElement =>
  screen.getByRole('button', { name: new RegExp(name.length === 2 ? name.split('').join('\\s*') : name) });

/** 切换「BOM 类型」下拉框 */
const pickBomType = (label: string) => {
  const selector = document.querySelector('.ant-select-selector') as HTMLElement;
  fireEvent.mouseDown(selector);
  const option = screen.getAllByText(label).find((el) => el.closest('.ant-select-item'));
  if (!option) throw new Error(`未找到下拉项: ${label}`);
  fireEvent.click(option);
};

/** 保存时传给 saveBytesFile 的字节 */
const savedBytes = (call = 0): number[] => Array.from(mockSave.mock.calls[call][1] as Uint8Array);

describe('BOM 检查 页面交互', () => {
  beforeEach(() => {
    message.destroy();
    mockSave.mockClear();
    localStorage.clear();
    Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });
  });

  test('初始状态: 只有选择按钮与拖拽提示, 不展示结果区', () => {
    render(<BOMCheck />);
    expect(btn('选择文件')).toBeInTheDocument();
    expect(btn('清除')).toBeDisabled();
    expect(screen.getByText(/点击左侧按钮选择文件/)).toBeInTheDocument();
    expect(screen.queryByText('未检测到 BOM')).toBeNull();
    expect(screen.queryByText('检测到 BOM')).toBeNull();
    // 使用说明默认折叠, 但标题可见
    expect(screen.getByText('使用说明')).toBeInTheDocument();
  });

  test('载入无 BOM 的 UTF-8 文件: 展示文件信息 / 编码推测 / 文本预览', async () => {
    render(<BOMCheck />);
    pick([ fileOf('a.txt', [ 0x68, 0x65, 0x6C, 0x6C, 0x6F ]) ]);

    expect(await screen.findByText('未检测到 BOM')).toBeInTheDocument();
    expect(screen.getByText('hello')).toBeInTheDocument();          // 文件名
    expect(screen.getByText('68 65 6C 6C 6F')).toBeInTheDocument(); // 首部字节
    expect(screen.getByText('UTF-8')).toBeInTheDocument();           // 编码推测
    expect(screen.getByRole('textbox')).toHaveValue('hello');        // 文本预览
    // 无 BOM 时「去除」不可点击
    expect(btn('去除 BOM 并下载')).toBeDisabled();
  });

  test('载入带 UTF-8 BOM 的文件: 提示检测到 BOM 并给出类型 / 字节 / 长度', async () => {
    render(<BOMCheck />);
    pick([ fileOf('a.txt', [ ...UTF8_BOM, 0x61, 0x62, 0x63 ]) ]);

    expect(await screen.findByText('检测到 BOM')).toBeInTheDocument();
    expect(screen.getByText(/可能导致 PHP/)).toBeInTheDocument();
    expect(screen.getByText('UTF-8')).toBeInTheDocument();
    expect(screen.getByText('EF BB BF')).toBeInTheDocument();
    expect(screen.getByText('3 字节')).toBeInTheDocument();
    expect(screen.getByText('文件大小 (含 BOM 3 字节)')).toBeInTheDocument();
    // 文本预览不含 BOM 字符 (自动按 BOM 类型解码)
    expect(screen.getByRole('textbox')).toHaveValue('abc');
    expect(btn('去除 BOM 并下载')).toBeEnabled();
  });

  test('去除 BOM 并下载: 文件名不变, 内容去掉 BOM 字节', async () => {
    render(<BOMCheck />);
    pick([ fileOf('index.php', [ ...UTF8_BOM, 0x3C, 0x3F, 0x70, 0x68, 0x70 ]) ]);
    await screen.findByText('检测到 BOM');

    fireEvent.click(btn('去除 BOM 并下载'));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    expect(mockSave.mock.calls[0][0]).toBe('index.php');
    expect(savedBytes()).toEqual([ 0x3C, 0x3F, 0x70, 0x68, 0x70 ]);
    expect(mockSave.mock.calls[0][2]).toMatchObject({ extensions: [ 'php' ] });
    await waitFor(() => expect(noticeText()).toContain('已下载去除 BOM 的文件 index.php (减少 3 字节)'));
  });

  test('无 BOM 文件不能去除 BOM (按钮禁用)', async () => {
    render(<BOMCheck />);
    pick([ fileOf('a.txt', [ 0x61 ]) ]);
    await screen.findByText('未检测到 BOM');
    expect(btn('去除 BOM 并下载')).toBeDisabled();
    expect(mockSave).not.toHaveBeenCalled();
  });

  test('添加 BOM: 无 BOM 文件按所选类型写入 BOM', async () => {
    render(<BOMCheck />);
    pick([ fileOf('a.txt', [ 0x61, 0x62 ]) ]);
    await screen.findByText('未检测到 BOM');

    pickBomType('UTF-16 LE (FF FE)');
    fireEvent.click(btn('添加 / 替换 BOM 并下载'));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    expect(savedBytes()).toEqual([ ...UTF16LE_BOM, 0x61, 0x62 ]);
    await waitFor(() => expect(noticeText()).toContain('已下载添加 BOM 的文件 a.txt (UTF-16 LE, 增加 2 字节)'));
  });

  test('替换 BOM: 先移除已有 BOM 再写入新类型 (不出现双重 BOM)', async () => {
    render(<BOMCheck />);
    pick([ fileOf('a.txt', [ ...UTF8_BOM, 0x61 ]) ]);
    await screen.findByText('检测到 BOM');

    // 下拉框默认跟随识别结果
    expect(screen.getAllByText('UTF-8 (EF BB BF)').length).toBeGreaterThan(0);
    pickBomType('UTF-16 BE (FE FF)');
    fireEvent.click(btn('添加 / 替换 BOM 并下载'));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    expect(savedBytes()).toEqual([ 0xFE, 0xFF, 0x61 ]);
    await waitFor(() => expect(noticeText()).toContain('(UTF-8 → UTF-16 BE, 3 字节 → 2 字节)'));
  });

  test('UTF-16 LE 文件: 正确识别并解码预览', async () => {
    render(<BOMCheck />);
    pick([ fileOf('u.txt', [ ...UTF16LE_BOM, 0x41, 0x00, 0x42, 0x00 ]) ]);

    await screen.findByText('检测到 BOM');
    expect(screen.getByText('UTF-16 LE')).toBeInTheDocument();
    expect(screen.getByText('FF FE')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('AB');
  });

  test('FF FE 00 00 同时符合 UTF-32 LE 与 UTF-16 LE, 给出提示', async () => {
    render(<BOMCheck />);
    pick([ fileOf('u32.txt', [ 0xFF, 0xFE, 0x00, 0x00, 0x41, 0x00, 0x00, 0x00 ]) ]);

    await screen.findByText('检测到 BOM');
    expect(screen.getByText(/同时符合 UTF-32 LE \/ UTF-16 LE 的字节特征/)).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('A');
  });

  test('二进制文件: 不显示文本预览', async () => {
    render(<BOMCheck />);
    pick([ fileOf('a.png', [ 0x89, 0x50, 0x4E, 0x47, 0x00, 0x01, 0x02, 0x03 ]) ]);

    await screen.findByText('未检测到 BOM');
    expect(screen.getByText('二进制文件')).toBeInTheDocument();
    expect(screen.getByText('二进制文件, 不显示文本预览')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  test('空文件: 提示没有可预览的内容', async () => {
    render(<BOMCheck />);
    pick([ fileOf('empty.txt', []) ]);

    await screen.findByText('未检测到 BOM');
    expect(screen.getByText('文件内容为空, 没有可预览的文本')).toBeInTheDocument();
    expect(screen.getByText('0 B')).toBeInTheDocument();
  });

  test('GBK 文件 (无 BOM) 也能正常预览', async () => {
    render(<BOMCheck />);
    pick([ fileOf('gbk.txt', [ 0xD6, 0xD0, 0xCE, 0xC4 ]) ]);

    await screen.findByText('未检测到 BOM');
    expect(document.body.textContent).toContain('GBK / Big5 等本地编码');
    expect(screen.getByRole('textbox')).toHaveValue('中文');
  });

  test('拖拽文件到拖拽区即可载入', async () => {
    render(<BOMCheck />);
    drop([ fileOf('drop.txt', [ ...UTF8_BOM, 0x61 ]) ]);

    expect(await screen.findByText('检测到 BOM')).toBeInTheDocument();
    expect(screen.getAllByText('drop.txt').length).toBeGreaterThan(0);
  });

  test('点击首部字节复制到粘贴板', async () => {
    render(<BOMCheck />);
    pick([ fileOf('a.txt', [ ...UTF8_BOM, 0x61 ]) ]);
    await screen.findByText('检测到 BOM');

    fireEvent.click(screen.getByText('EF BB BF 61'));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith('EF BB BF 61'));
    await waitFor(() => expect(noticeText()).toContain('复制到粘贴板成功！！！'));
  });

  test('清除按钮回到初始状态', async () => {
    render(<BOMCheck />);
    pick([ fileOf('a.txt', [ ...UTF8_BOM, 0x61 ]) ]);
    await screen.findByText('检测到 BOM');

    fireEvent.click(btn('清除'));
    expect(screen.queryByText('检测到 BOM')).toBeNull();
    expect(screen.getByText(/点击左侧按钮选择文件/)).toBeInTheDocument();
    expect(btn('清除')).toBeDisabled();
  });

  test('超过大小上限的文件给出提示且不载入', async () => {
    render(<BOMCheck />);
    const big = fileOf('big.bin', [ 0x61 ]);
    Object.defineProperty(big, 'size', { value: 2 * 1024 * 1024 * 1024 });
    pick([ big ]);

    await waitFor(() => expect(noticeText()).toContain('文件过大'));
    expect(screen.queryByText('未检测到 BOM')).toBeNull();
  });

  test('读取失败时给出错误提示', async () => {
    render(<BOMCheck />);
    const bad = fileOf('bad.txt', [ 0x61 ]);
    Object.defineProperty(bad, 'arrayBuffer', { value: () => Promise.reject(new Error('boom')) });
    pick([ bad ]);

    await waitFor(() => expect(noticeText()).toContain('读取文件失败: boom'));
    expect(screen.queryByText('未检测到 BOM')).toBeNull();
  });

  test('设置里的默认 BOM 类型会作为初始下拉值', async () => {
    localStorage.setItem('bom-check:default-bom', 'utf32be');
    render(<BOMCheck />);
    pick([ fileOf('a.txt', [ 0x61 ]) ]);
    await screen.findByText('未检测到 BOM');

    fireEvent.click(btn('添加 / 替换 BOM 并下载'));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    expect(savedBytes()).toEqual([ 0x00, 0x00, 0xFE, 0xFF, 0x61 ]);
  });
});
