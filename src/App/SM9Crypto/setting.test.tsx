import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SM9CryptoSetting } from './setting';
import { LocaleProvider } from '../../hook/locale-context';
import * as gmssl from './gmssl';

// wasm 无法在 jest 里运行: 替掉 GmSSL 封装, 固定返回可预期的 HEX (结构/长度与真实一致)
jest.mock('./gmssl', () => {
  const fromHex = (h :string) => Uint8Array.from((h.match(/../g) ?? []).map((x) => parseInt(x, 16)));
  return {
    encMasterPublicKey: jest.fn(async () => fromHex('04' + 'ab'.repeat(64))),
    encExtractUserKey: jest.fn(async () => fromHex('30' + 'cd'.repeat(101))),
    signMasterPublicKey: jest.fn(async () => fromHex('04' + 'ef'.repeat(128))),
    signExtractUserKey: jest.fn(async () => fromHex('30' + '11'.repeat(101))),
  };
});

const MSK = '3066' + '22'.repeat(50);          // 任意偶数长度 HEX (gmssl 已 mock)
const MPK = '04' + 'ab'.repeat(64);            // 加密主公钥 65 字节
const USK = '30' + 'cd'.repeat(101);           // 加密用户私钥 204 字节
const SMSK = '3081a7' + '33'.repeat(80);
const SMPK = '04' + 'ef'.repeat(128);          // 签名主公钥 129 字节
const SSK = '30' + '11'.repeat(101);           // 签名用户私钥 204 字节

const setup = () => render(<LocaleProvider><SM9CryptoSetting /></LocaleProvider>);

const areas = (c :HTMLElement) => Array.from(c.querySelectorAll('textarea')) as HTMLTextAreaElement[];
const idInput = (c :HTMLElement) => c.querySelector('input.ant-input') as HTMLInputElement;

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});
afterEach(() => cleanup());

describe('SM9 加解密 设置项', () => {
  test('渲染 默认用户 ID / 主私钥 / 主公钥 / 用户私钥 各项与两个按 ID 生成按钮', () => {
    const { container } = setup();
    expect(screen.getByText('SM9 加解密')).toBeInTheDocument();
    for (const label of [
      '默认用户 ID',
      '默认加密主私钥 (DER HEX)', '默认加密主公钥 (HEX)', '默认加密用户私钥 (DER HEX)',
      '默认签名主私钥 (DER HEX)', '默认签名主公钥 (HEX)', '默认签名用户私钥 (DER HEX)',
    ]) expect(screen.getByText(label)).toBeInTheDocument();
    expect(areas(container).length).toBe(6);
    expect(screen.getByRole('button', { name: '按此 ID 生成加密公钥 / 私钥' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '按此 ID 生成签名公钥 / 私钥' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '清空默认密钥' })).toBeInTheDocument();
  });

  test('已保存的默认值会回显', () => {
    localStorage.setItem('sm9-crypto:default-id', 'alice@example.com');
    localStorage.setItem('sm9-crypto:default-enc-master-key', MSK);
    localStorage.setItem('sm9-crypto:default-enc-public-key', MPK);
    localStorage.setItem('sm9-crypto:default-sign-public-key', SMPK);
    const { container } = setup();
    expect(idInput(container).value).toBe('alice@example.com');
    expect(areas(container)[0].value).toBe(MSK);
    expect(areas(container)[1].value).toBe(MPK);
    expect(areas(container)[4].value).toBe(SMPK);
  });

  test('修改即持久化; 非法 HEX 标红且不落库', () => {
    const { container } = setup();
    fireEvent.change(idInput(container), { target: { value: 'bob' } });
    expect(localStorage.getItem('sm9-crypto:default-id')).toBe('bob');

    fireEvent.change(areas(container)[0], { target: { value: MSK } });
    expect(localStorage.getItem('sm9-crypto:default-enc-master-key')).toBe(MSK);

    // 主公钥同样可手动粘贴 (例如他人的主公钥, 用于本机加密)
    fireEvent.change(areas(container)[1], { target: { value: MPK } });
    expect(localStorage.getItem('sm9-crypto:default-enc-public-key')).toBe(MPK);

    // 奇数长度: 不落库 + 标红
    fireEvent.change(areas(container)[2], { target: { value: 'abc' } });
    expect(localStorage.getItem('sm9-crypto:default-enc-user-key')).toBeNull();
    expect(container.querySelectorAll('.ant-input-status-error').length).toBe(1);
  });

  test('按用户 ID 生成加密主公钥与用户私钥, 并保存为默认值', async () => {
    const { container } = setup();
    fireEvent.change(idInput(container), { target: { value: 'alice@example.com' } });
    fireEvent.change(areas(container)[0], { target: { value: MSK } });

    fireEvent.click(screen.getByRole('button', { name: '按此 ID 生成加密公钥 / 私钥' }));
    await waitFor(() => expect(localStorage.getItem('sm9-crypto:default-enc-public-key')).toBe(MPK));
    expect(localStorage.getItem('sm9-crypto:default-enc-user-key')).toBe(USK);
    expect(areas(container)[1].value).toBe(MPK);
    expect(areas(container)[2].value).toBe(USK);
    expect(gmssl.encMasterPublicKey).toHaveBeenCalledTimes(1);
    expect(gmssl.encExtractUserKey).toHaveBeenCalledWith(expect.any(Uint8Array), 'alice@example.com');
    expect(gmssl.signExtractUserKey).not.toHaveBeenCalled();
    expect(await screen.findByText('已按用户 ID「alice@example.com」生成加密主公钥与用户私钥')).toBeInTheDocument();
  });

  test('按用户 ID 生成签名主公钥与用户私钥', async () => {
    const { container } = setup();
    fireEvent.change(idInput(container), { target: { value: 'bob' } });
    fireEvent.change(areas(container)[3], { target: { value: SMSK } });

    fireEvent.click(screen.getByRole('button', { name: '按此 ID 生成签名公钥 / 私钥' }));
    await waitFor(() => expect(localStorage.getItem('sm9-crypto:default-sign-public-key')).toBe(SMPK));
    expect(localStorage.getItem('sm9-crypto:default-sign-user-key')).toBe(SSK);
    expect(areas(container)[4].value).toBe(SMPK);
    expect(areas(container)[5].value).toBe(SSK);
    expect(gmssl.signExtractUserKey).toHaveBeenCalledWith(expect.any(Uint8Array), 'bob');
    expect(gmssl.encExtractUserKey).not.toHaveBeenCalled();
  });

  test('ID 或主私钥缺失时提示, 不调用引擎', async () => {
    const { container } = setup();

    // 未填 ID
    fireEvent.click(screen.getByRole('button', { name: '按此 ID 生成加密公钥 / 私钥' }));
    expect(await screen.findByText('请先填写用户 ID')).toBeInTheDocument();

    // 填了 ID 但没有加密主私钥
    fireEvent.change(idInput(container), { target: { value: 'bob' } });
    fireEvent.click(screen.getByRole('button', { name: '按此 ID 生成加密公钥 / 私钥' }));
    expect(await screen.findByText('请先填写「默认加密主私钥」')).toBeInTheDocument();

    // 签名侧同理
    fireEvent.click(screen.getByRole('button', { name: '按此 ID 生成签名公钥 / 私钥' }));
    expect(await screen.findByText('请先填写「默认签名主私钥」')).toBeInTheDocument();
    expect(gmssl.encMasterPublicKey).not.toHaveBeenCalled();
    expect(gmssl.signMasterPublicKey).not.toHaveBeenCalled();
  });

  test('清空默认密钥: 清 localStorage 与界面', () => {
    localStorage.setItem('sm9-crypto:default-id', 'bob');
    localStorage.setItem('sm9-crypto:default-enc-public-key', MPK);
    const { container } = setup();
    expect(idInput(container).value).toBe('bob');

    fireEvent.click(screen.getByRole('button', { name: '清空默认密钥' }));
    expect(localStorage.getItem('sm9-crypto:default-id')).toBeNull();
    expect(localStorage.getItem('sm9-crypto:default-enc-public-key')).toBeNull();
    expect(idInput(container).value).toBe('');
    expect(areas(container).every((el) => el.value === '')).toBe(true);
  });
});
