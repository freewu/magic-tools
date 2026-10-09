import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ZucCrypto from './index';
import { LocaleProvider } from '../../hook/locale-context';

// jest 没有 Vite 的 `?url` 模块映射 (import wasmUrl from './wasm/zuc.wasm?url' 解析不了),
// 所以在这里替换 ./zuc —— 但用的是 **真实 zuc.wasm**: wasm 是纯计算模块 (零导入),
// jest 环境 (jsdom) 里可以直接实例化, 于是页面测试跑的就是真算法。
jest.mock('./zuc', () => {
  const fs = jest.requireActual('fs') as { readFileSync: (p :string) => Uint8Array };
  const path = jest.requireActual('path') as { join: (...p :string[]) => string };
  const engineModule = jest.requireActual('./zuc-engine') as {
    createZucEngine: (exports :any) => { apply: (...args :any[]) => Uint8Array };
  };
  const bytes = new Uint8Array(fs.readFileSync(path.join(__dirname, 'wasm', 'zuc.wasm')));
  const instance = new WebAssembly.Instance(new WebAssembly.Module(bytes), {});
  const engine = engineModule.createZucEngine(instance.exports);
  return {
    initZuc: jest.fn(async () => engine),
    zucApply: jest.fn(async (...args :any[]) => engine.apply(...args)),
  };
});

const KEY = '000102030405060708090a0b0c0d0e0f';
const IV = '0f0e0d0c0b0a09080706050403020100';

/** 渲染页面并等待 wasm 引擎就绪, 返回 container (查询一律限定在组件树内, 避开 antd 挂在 body 上的隐藏节点) */
const setup = async () => {
  const utils = render(<LocaleProvider><ZucCrypto /></LocaleProvider>);
  await waitFor(() => expect(screen.getByText(/引擎就绪/)).toBeInTheDocument());
  return utils;
};

const flat = (el :Element | null) :string => (el?.textContent ?? '').replace(/\s+/g, '');
const inputAt = (c :HTMLElement, i :number) => c.querySelectorAll('.ant-input')[i] as HTMLInputElement;
const keyInput = (c :HTMLElement) => inputAt(c, 0);
const ivInput = (c :HTMLElement) => inputAt(c, 1);
const areas = (c :HTMLElement) => Array.from(c.querySelectorAll('textarea')) as HTMLTextAreaElement[];
const plainArea = (c :HTMLElement) => areas(c)[0];
const cipherArea = (c :HTMLElement) => areas(c)[1];

const btn = (c :HTMLElement, name :string) :HTMLButtonElement => {
  const found = Array.from(c.querySelectorAll('button')).find((b) => flat(b) === name);
  if (!found) throw new Error('未找到按钮: ' + name);
  return found;
};

/** 打开第 n 个 antd Select 并选中指定文案的选项 (0 = 算法, 1 = 编码) */
const selectOption = (c :HTMLElement, index :number, optionText :string) => {
  fireEvent.mouseDown(c.querySelectorAll('.ant-select-selector')[index]);
  const option = screen.getAllByText(optionText).find((el) => el.closest('.ant-select-item'));
  if (!option) throw new Error('未找到选项: ' + optionText);
  fireEvent.click(option);
};

const fillKeyIV = (c :HTMLElement, key = KEY, iv = IV) => {
  fireEvent.change(keyInput(c), { target: { value: key } });
  fireEvent.change(ivInput(c), { target: { value: iv } });
};

beforeEach(() => {
  localStorage.clear();
  Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });
});
afterEach(() => cleanup());

describe('祖冲之序列密码 页面', () => {
  test('渲染算法 / 编码 / 密钥 / IV 与加密解密按钮, 并显示引擎状态', async () => {
    const { container } = await setup();
    expect(container.querySelectorAll('.ant-select').length).toBe(2);
    expect(screen.getByText('算法:')).toBeInTheDocument();
    expect(screen.getByText('编码:')).toBeInTheDocument();
    expect(screen.getByText('密钥:')).toBeInTheDocument();
    expect(screen.getByText('偏移量(IV):')).toBeInTheDocument();
    // 加密 / 解密 / 清除 / 随机 (antd 会在两个汉字的按钮文案中间插空格, 这里比较时去掉空白)
    const labels = Array.from(container.querySelectorAll('button')).map((b) => flat(b));
    for (const name of [ '随机', '加密', '解密', '清除' ]) {
      expect(labels).toContain(name);
    }
    // 密钥 / IV 长度提示 (ZUC-128: 16 字节), 并标注所依据的标准
    expect(screen.getAllByText('0 / 16').length).toBe(2);
    expect(screen.getByText(/GB\/T 33133.1-2016/)).toBeInTheDocument();
  });

  test('密钥 / IV 未填或长度不对时给出提示, 且不产生密文', async () => {
    const { container } = await setup();

    // 空密钥
    fireEvent.change(plainArea(container), { target: { value: 'hello' } });
    fireEvent.click(btn(container, '加密'));
    await waitFor(() => expect(screen.getByText('请输入密钥')).toBeInTheDocument());

    // 密钥长度不足 (30 个 HEX 字符 = 15 字节)
    fireEvent.change(keyInput(container), { target: { value: '00'.repeat(15) } });
    fireEvent.click(btn(container, '加密'));
    await waitFor(() => expect(screen.getByText('密钥需为 32 位 HEX (16 字节), 当前 15 字节')).toBeInTheDocument());

    // 密钥合法但 IV 未填
    fireEvent.change(keyInput(container), { target: { value: KEY } });
    fireEvent.click(btn(container, '加密'));
    await waitFor(() => expect(screen.getByText('请输入偏移量 IV')).toBeInTheDocument());

    // 含非十六进制字符
    fireEvent.change(ivInput(container), { target: { value: 'zz'.repeat(16) } });
    fireEvent.click(btn(container, '加密'));
    await waitFor(() => expect(screen.getByText('偏移量 IV 只能包含十六进制字符 0-9 / a-f')).toBeInTheDocument());

    expect(cipherArea(container).value).toBe('');

    // 明文为空 (密钥 / IV 合法) 时也要拦下
    fillKeyIV(container);
    fireEvent.change(plainArea(container), { target: { value: '' } });
    fireEvent.click(btn(container, '加密'));
    await waitFor(() => expect(screen.getByText('请输入需要加密的内容')).toBeInTheDocument());
    expect(cipherArea(container).value).toBe('');
  });

  test('加密 / 解密往返 (HEX): 明文 -> 密文 -> 还原明文', async () => {
    const { container } = await setup();

    // ZUC-128 附录 A.1: 密钥 / IV 全 0 时, 密钥流前 8 字节为 27bede74018082da
    fillKeyIV(container, '00'.repeat(16), '00'.repeat(16));
    const plain = 'ZUC 祖冲之序列密码 hello';
    fireEvent.change(plainArea(container), { target: { value: plain } });
    fireEvent.click(btn(container, '加密'));

    const cipher = await waitFor(() => {
      const v = cipherArea(container).value;
      expect(v).not.toBe('');
      return v;
    });
    expect(/^[0-9a-f]+$/.test(cipher)).toBe(true);
    expect(cipher).toHaveLength(new TextEncoder().encode(plain).length * 2);
    // 密钥流不为 0, 密文首 8 字节必与「附录 A.1 标准密钥流」一致 (明文首字节 Z = 0x5a)
    expect(cipher.slice(0, 2)).toBe((new TextEncoder().encode(plain)[0] ^ 0x27).toString(16).padStart(2, '0'));

    // 同一组密钥 / IV 解密回来
    fireEvent.click(btn(container, '解密'));
    await waitFor(() => expect(plainArea(container).value).toBe(plain));
  });

  test('编码切到 Base64 时密文为 Base64, 且能解回明文', async () => {
    const { container } = await setup();
    selectOption(container, 1, 'Base64');

    fillKeyIV(container);
    fireEvent.change(plainArea(container), { target: { value: 'base64 往返' } });
    fireEvent.click(btn(container, '加密'));
    const cipher = await waitFor(() => {
      const v = cipherArea(container).value;
      expect(v).not.toBe('');
      return v;
    });
    expect(/^[A-Za-z0-9+/]+={0,2}$/.test(cipher)).toBe(true);

    fireEvent.click(btn(container, '解密'));
    await waitFor(() => expect(plainArea(container).value).toBe('base64 往返'));
  });

  test('密文内容不合法时提示失败 (不会崩溃)', async () => {
    const { container } = await setup();
    fillKeyIV(container);
    fireEvent.change(cipherArea(container), { target: { value: 'not-hex' } });
    fireEvent.click(btn(container, '解密'));
    await waitFor(() => expect(screen.getByText('加解密失败: hex 内容不合法')).toBeInTheDocument());
    // 引擎仍可用, 后续正常操作不受影响
    expect(screen.getByText(/引擎就绪/)).toBeInTheDocument();
  });

  test('「随机」按钮生成定长 HEX 密钥 / IV', async () => {
    const { container } = await setup();
    const buttons = Array.from(container.querySelectorAll('button')).filter((b) => flat(b) === '随机');
    expect(buttons.length).toBe(2);

    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    expect(/^[0-9a-f]{32}$/.test(keyInput(container).value)).toBe(true);
    expect(/^[0-9a-f]{32}$/.test(ivInput(container).value)).toBe(true);
    expect(keyInput(container).value).not.toBe(ivInput(container).value);
    // 长度计数同步显示
    expect(screen.getAllByText('16 / 16').length).toBe(2);
  });

  test('「清除」清空明文与密文 (不清空密钥 / IV)', async () => {
    const { container } = await setup();
    fillKeyIV(container);
    fireEvent.change(plainArea(container), { target: { value: 'abc' } });
    fireEvent.change(cipherArea(container), { target: { value: '00ff' } });
    expect(plainArea(container).value).toBe('abc');

    fireEvent.click(btn(container, '清除'));
    expect(plainArea(container).value).toBe('');
    expect(cipherArea(container).value).toBe('');
    expect(keyInput(container).value).toBe(KEY);
    expect(ivInput(container).value).toBe(IV);
  });

  test('切到 ZUC-256 后密钥 / IV 长度要求变为 32 / 23 字节', async () => {
    const { container } = await setup();
    selectOption(container, 0, 'ZUC-256');

    expect(keyInput(container).maxLength).toBe(64);
    expect(ivInput(container).maxLength).toBe(46);
    expect(screen.getByText('0 / 32')).toBeInTheDocument();
    expect(screen.getByText('0 / 23')).toBeInTheDocument();
    expect(screen.getByText(/ZUC256-version1.1/)).toBeInTheDocument();

    // ZUC-256 标准向量往返
    fillKeyIV(container, '00'.repeat(32), '00'.repeat(23));
    fireEvent.change(plainArea(container), { target: { value: '256 往返' } });
    fireEvent.click(btn(container, '加密'));
    await waitFor(() => expect(cipherArea(container).value).not.toBe(''));
    fireEvent.click(btn(container, '解密'));
    await waitFor(() => expect(plainArea(container).value).toBe('256 往返'));
  });

  test('密钥 / IV 长度不匹配时输入框标红, 且默认算法取自设置页', async () => {
    localStorage.setItem('zuc-crypto:default-algorithm', 'ZUC-256');
    localStorage.setItem('zuc-crypto:default-key', 'ab'.repeat(32));
    localStorage.setItem('zuc-crypto:default-iv', 'cd'.repeat(23));
    const { container } = await setup();

    expect(keyInput(container).value).toBe('ab'.repeat(32));
    expect(ivInput(container).value).toBe('cd'.repeat(23));
    expect(container.querySelectorAll('.ant-input-status-error').length).toBe(0);

    // 手工改成定长不符 -> 输入框进入 error 状态
    fireEvent.change(keyInput(container), { target: { value: 'ab'.repeat(15) } });
    expect(container.querySelectorAll('.ant-input-status-error').length).toBe(1);
    // 空值不标红 (只是还没填)
    fireEvent.change(keyInput(container), { target: { value: '' } });
    expect(container.querySelectorAll('.ant-input-status-error').length).toBe(0);
  });
});
