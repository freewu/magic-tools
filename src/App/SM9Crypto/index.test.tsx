import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SM9Crypto from './index';
import { LocaleProvider } from '../../hook/locale-context';
import { copyTextToClipboard } from '../../lib';
import * as gmssl from './gmssl';

// wasm 无法在 jest 里运行: 用 GmSSL v3.2.0 真实输出 (hex 与 lib.test.ts 同一批) 替掉封装,
// 这样密钥/密文/签名的结构、长度与识别提示都与真实运行一致
const mockMsk = '3066022013e34f5e44a36f833c2bd6eaf755c5a38f7fb9e362bc0d6597fa4f9f6511b0a1034200047c83c2860f283c515d36bc7971383522e5cc37faa555abecafd74f2cc3ed82dc56344a55bdca33dd5ed319025b0579e4ea412748a603f6b3fb30aaabfcc59181';
const mockMpk = '047c83c2860f283c515d36bc7971383522e5cc37faa555abecafd74f2cc3ed82dc56344a55bdca33dd5ed319025b0579e4ea412748a603f6b3fb30aaabfcc59181';
const mockUsk = '3081c90381820004432cef656e7373d0ba33cf4e5ac060487a528dea0414dba5fd3bb0613a57ad987c0f89f3742c8298fb754fd3a6aea7d3273d0d0c1125d604279d5ba025cae9bca6c482375b73eb4db3628df0c7947be0b4cee800dc7a6bcfb964f4c28f1629fd527fc60b73348d15b0e75b1a6fedb1dd973526339478ccd45c01566eee2cd703034200047c83c2860f283c515d36bc7971383522e5cc37faa555abecafd74f2cc3ed82dc56344a55bdca33dd5ed319025b0579e4ea412748a603f6b3fb30aaabfcc59181';
const mockCipher = '308188020100034200046723b25e8ecb83f909fe1fe1bcd194de320ce47a9296dfe985168fb879a48ca96da058bb825e474df743e22d19427b7cedd55a650da8b93d0c592931d4e9f2420420f14dbcba21c19defd28913f94dcf56dee6f98718e9e254f4595080a78abf801a041d3a89e1644240fbe27ba06e1082adc87af202dd41eedc4f273100ca1705';
const mockSmsk = '3081a702206c3f6b003554f15576338dbaaa97c34037d75111ad302dd6065295901691d12103818200043ff1e5a7724598ef5199f73ed6b7a1e3d11de3d0ca1133b1e5d0dcd864bacb48a6aa5eb60880031729175353b5e2c5b1c7a453d2c2483f04816a57f8c7c962fd6f7ee4bd242383b73fb1bdd2dd13bdeb39c56590aeb32e118716b9cbbdf2bd793107898b2a1ecb207971c2caa87d1c300d7897d8e459d827c1b0ba07dfa87ef0';
const mockSmpk = '043ff1e5a7724598ef5199f73ed6b7a1e3d11de3d0ca1133b1e5d0dcd864bacb48a6aa5eb60880031729175353b5e2c5b1c7a453d2c2483f04816a57f8c7c962fd6f7ee4bd242383b73fb1bdd2dd13bdeb39c56590aeb32e118716b9cbbdf2bd793107898b2a1ecb207971c2caa87d1c300d7897d8e459d827c1b0ba07dfa87ef0';
const mockSsk = '3081c90342000434be0afb49270de83a27a5433b09093000fd736471801f940b3bbafd3ccc06f25448ea087a9c4256cdbaa469332407eb22ac6e4ef5a6cb600ad0c2f693d6b4a603818200043ff1e5a7724598ef5199f73ed6b7a1e3d11de3d0ca1133b1e5d0dcd864bacb48a6aa5eb60880031729175353b5e2c5b1c7a453d2c2483f04816a57f8c7c962fd6f7ee4bd242383b73fb1bdd2dd13bdeb39c56590aeb32e118716b9cbbdf2bd793107898b2a1ecb207971c2caa87d1c300d7897d8e459d827c1b0ba07dfa87ef0';
const mockSig = '306604208093b2065c23aa76bdda3db1a9fd8ec8a3892e80628ea5d5ece5de2668e6318903420004964361d4918958243500ec0523dcef8c0dafbdc9b018a62115a70a16ed74f7014a8b87aed2b1a06bff1eb6450d0a5512bd44275108157d222c41545b70908f3b';
const mockPlain = 'Hello SM9 国密标识密码!';
const toBytes = (hex :string) => Uint8Array.from((hex.match(/../g) ?? []).map((h) => parseInt(h, 16)));

jest.mock('./gmssl', () => ({
  initSm9: jest.fn(async () => ({})),
  resetSm9: jest.fn(),
  engineAvailable: jest.fn(async () => true),
  encGenerateMasterKey: jest.fn(async () => toBytes(mockMsk)),
  encMasterPublicKey: jest.fn(async () => toBytes(mockMpk)),
  encExtractUserKey: jest.fn(async () => toBytes(mockUsk)),  encryptWithMasterKey: jest.fn(async () => toBytes(mockCipher)),
  encryptWithPublicKey: jest.fn(async () => toBytes(mockCipher)),
  decrypt: jest.fn(async () => new TextEncoder().encode(mockPlain)),
  signGenerateMasterKey: jest.fn(async () => toBytes(mockSmsk)),
  signMasterPublicKey: jest.fn(async () => toBytes(mockSmpk)),
  signExtractUserKey: jest.fn(async () => toBytes(mockSsk)),
  sign: jest.fn(async () => toBytes(mockSig)),
  verifyWithMasterKey: jest.fn(async () => true),
  verifyWithPublicKey: jest.fn(async () => true),
}));

jest.mock('../../lib', () => ({
  ...jest.requireActual('../../lib'),
  copyTextToClipboard: jest.fn().mockResolvedValue(undefined),
}));

const renderPage = () => render(
  <LocaleProvider>
    <SM9Crypto />
  </LocaleProvider>
);

// antd 组件渲染 + wasm 封装 mock 下的异步更新较慢, 放宽单测超时 (仅本文件)
jest.setTimeout(30000);

const valueOf = (el :HTMLElement) => (el as HTMLTextAreaElement).value;

describe('SM9Crypto 页面', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('四个页签齐全, 默认带出默认 ID', () => {
    renderPage();
    for (const name of [ '密钥生成', '加密', '解密', '签名验签' ]) {
      expect(screen.getByRole('tab', { name })).toBeTruthy();
    }
    expect(screen.getAllByDisplayValue('alice@example.com').length).toBeGreaterThan(0);
  });

  it('生成加密主密钥 -> 导出主公钥 -> 提取用户私钥, 并显示识别结果', async () => {
    renderPage();
    const masterArea = screen.getAllByPlaceholderText(/生成后自动填充/)[0];
    const pubArea = screen.getAllByPlaceholderText(/点「导出主公钥」得到 \(04 开头 65 字节\)/)[0];
    const uskArea = screen.getAllByPlaceholderText(/输入 ID 后点「提取用户私钥」得到/)[0];

    fireEvent.click(screen.getAllByRole('button', { name: /生成主密钥对/ })[0]);
    expect(await screen.findByDisplayValue(mockMsk)).toBeTruthy();
    expect(screen.getAllByText('识别为: SM9-Enc 主私钥 (104 字节)').length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole('button', { name: /导出主公钥/ })[0]);
    expect(await screen.findByDisplayValue(mockMpk)).toBeTruthy();
    expect(screen.getAllByText('识别为: SM9-Enc 主公钥 (65 字节)').length).toBeGreaterThan(0);
    expect(gmssl.encMasterPublicKey).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getAllByRole('button', { name: /提取用户私钥/ })[0]);
    expect(await screen.findByDisplayValue(mockUsk)).toBeTruthy();
    expect(gmssl.encExtractUserKey).toHaveBeenCalledWith(expect.anything(), 'alice@example.com');
    expect(valueOf(masterArea)).toBe(mockMsk);
    expect(valueOf(pubArea)).toBe(mockMpk);
    expect(valueOf(uskArea)).toBe(mockUsk);
    expect(screen.getAllByText('识别为: SM9-Enc 用户私钥 (204 字节)').length).toBeGreaterThan(0);
  });

  it('签名主密钥块生成并识别出签名主公钥', async () => {
    renderPage();
    fireEvent.click(screen.getAllByRole('button', { name: /生成主密钥对/ })[1]);
    expect(await screen.findByDisplayValue(mockSmsk)).toBeTruthy();
    expect(screen.getAllByText('识别为: SM9-Sign 主私钥 (170 字节)').length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole('button', { name: /导出主公钥/ })[1]);
    expect(await screen.findByDisplayValue(mockSmpk)).toBeTruthy();
    expect(screen.getAllByText('识别为: SM9-Sign 主公钥 (129 字节)').length).toBeGreaterThan(0);
  });

  it('加密: 主公钥 + ID + 明文 -> 密文', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: '加密' }));
    fireEvent.change(await screen.findByPlaceholderText(/04 开头 130 位 HEX/), { target: { value: mockMpk } });
    fireEvent.change(screen.getByPlaceholderText(/输入需要加密的明文/), { target: { value: 'SM9 测试' } });
    fireEvent.click(screen.getByRole('button', { name: /加密$/ }));
    expect(await screen.findByDisplayValue(mockCipher)).toBeTruthy();
    expect(gmssl.encryptWithPublicKey).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/加密成功/)).toBeTruthy();
  });

  it('加密: 明文超过 255 字节时拒绝并提示', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: '加密' }));
    fireEvent.change(await screen.findByPlaceholderText(/04 开头 130 位 HEX/), { target: { value: mockMpk } });
    fireEvent.change(screen.getByPlaceholderText(/输入需要加密的明文/), { target: { value: 'a'.repeat(256) } });
    fireEvent.click(screen.getByRole('button', { name: /加密$/ }));
    expect(await screen.findByText(/单组明文上限为 255 字节, 当前 256 字节/)).toBeTruthy();
    expect(gmssl.encryptWithPublicKey).not.toHaveBeenCalled();
  });

  it('加密: 未配置主公钥 / 主私钥时提示先配置', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: '加密' }));
    fireEvent.change(await screen.findByPlaceholderText(/输入需要加密的明文/), { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: /加密$/ }));
    expect(await screen.findByText(/未配置加密主公钥\/主私钥/)).toBeTruthy();
    expect(gmssl.encryptWithPublicKey).not.toHaveBeenCalled();
  });

  it('解密: 用户私钥 + ID + 密文 -> 明文; 非法 HEX 给出提示', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: '解密' }));
    fireEvent.change(await screen.findByPlaceholderText(/粘贴用户私钥/), { target: { value: mockUsk } });
    fireEvent.change(screen.getByPlaceholderText(/粘贴密文/), { target: { value: mockCipher } });
    fireEvent.click(screen.getByRole('button', { name: /解密$/ }));
    expect(await screen.findByDisplayValue(mockPlain)).toBeTruthy();
    expect(gmssl.decrypt).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByPlaceholderText(/粘贴密文/), { target: { value: 'zz11' } });
    fireEvent.click(screen.getByRole('button', { name: /解密$/ }));
    expect(await screen.findByText(/内容含非十六进制字符/)).toBeTruthy();
  });

  it('解密: 用户私钥为空时提示先填写', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: '解密' }));
    fireEvent.change(await screen.findByPlaceholderText(/粘贴密文/), { target: { value: mockCipher } });
    fireEvent.click(screen.getByRole('button', { name: /解密$/ }));
    expect(await screen.findByText(/请先填写加密用户私钥/)).toBeTruthy();
    expect(gmssl.decrypt).not.toHaveBeenCalled();
  });

  it('签名验签: 签名 -> 主公钥验签通过; 篡改后验签失败', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: '签名验签' }));
    fireEvent.change(await screen.findByPlaceholderText(/粘贴签名用户私钥/), { target: { value: mockSsk } });
    fireEvent.change(screen.getByPlaceholderText(/输入数据/), { target: { value: 'MagicTools SM9' } });
    fireEvent.click(screen.getByRole('button', { name: /签名 \(用户私钥\)/ }));
    expect(await screen.findByDisplayValue(mockSig)).toBeTruthy();
    expect(gmssl.sign).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText('识别为: SM9 签名值 (DER) (104 字节)').length).toBeGreaterThan(0);

    fireEvent.change(screen.getByPlaceholderText(/04 开头 258 位 HEX/), { target: { value: mockSmpk } });
    const verifyBtn = screen.getByRole('button', { name: /验签 \(主公钥 \+ ID\)/ });
    fireEvent.click(verifyBtn);
    expect(await screen.findByText('验签通过')).toBeTruthy();
    expect(gmssl.verifyWithPublicKey).toHaveBeenCalledWith(expect.anything(), 'alice@example.com', expect.anything(), expect.anything());
    expect(gmssl.verifyWithMasterKey).not.toHaveBeenCalled();

    await waitFor(() => expect(verifyBtn).not.toHaveClass('ant-btn-loading'));
    (gmssl.verifyWithPublicKey as jest.Mock).mockResolvedValueOnce(false);
    fireEvent.click(verifyBtn);
    expect(await screen.findByText('验签失败')).toBeTruthy();
  });

  it('验签: 主公钥留空时回退用签名主私钥', async () => {
    renderPage();
    fireEvent.click(screen.getAllByRole('button', { name: /生成主密钥对/ })[1]);
    await screen.findByDisplayValue(mockSmsk);
    fireEvent.click(screen.getByRole('tab', { name: '签名验签' }));
    fireEvent.change(await screen.findByPlaceholderText(/输入数据/), { target: { value: 'abc' } });
    fireEvent.change(screen.getByPlaceholderText(/签名后自动显示在此/), { target: { value: mockSig } });
    fireEvent.click(screen.getByRole('button', { name: /验签 \(主公钥 \+ ID\)/ }));
    expect(await screen.findByText('验签通过')).toBeTruthy();
    expect(gmssl.verifyWithMasterKey).toHaveBeenCalledTimes(1);
    expect(gmssl.verifyWithPublicKey).not.toHaveBeenCalled();
  });

  it('验签: 未填签名值时提示先填写', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: '签名验签' }));
    fireEvent.change(await screen.findByPlaceholderText(/输入数据/), { target: { value: 'abc' } });
    fireEvent.change(screen.getByPlaceholderText(/04 开头 258 位 HEX/), { target: { value: mockSmpk } });
    fireEvent.click(screen.getByRole('button', { name: /验签 \(主公钥 \+ ID\)/ }));
    expect(await screen.findByText(/请先填写签名值/)).toBeTruthy();
  });

  it('保存为默认密钥 / 清空默认密钥 写入与清除 localStorage', async () => {
    renderPage();
    fireEvent.click(screen.getAllByRole('button', { name: /生成主密钥对/ })[0]);
    await screen.findByDisplayValue(mockMsk);
    fireEvent.click(screen.getByRole('button', { name: /保存为默认密钥/ }));
    expect(localStorage.getItem('sm9-crypto:default-enc-master-key')).toBe(mockMsk);
    expect(localStorage.getItem('sm9-crypto:default-id')).toBe('alice@example.com');

    fireEvent.click(screen.getByRole('button', { name: /清空默认密钥/ }));
    expect(localStorage.getItem('sm9-crypto:default-enc-master-key')).toBeNull();
    expect(localStorage.getItem('sm9-crypto:default-id')).toBeNull();
    expect(screen.queryByDisplayValue(mockMsk)).toBeNull(); // 界面密钥也被清空
  });

  it('双击密钥框复制到粘贴板', async () => {
    renderPage();
    fireEvent.click(screen.getAllByRole('button', { name: /生成主密钥对/ })[0]);
    fireEvent.doubleClick(await screen.findByDisplayValue(mockMsk));
    expect(copyTextToClipboard).toHaveBeenCalledWith(mockMsk);
  });

  it('无法识别的内容给出字节数提示', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: '加密' }));
    fireEvent.change(await screen.findByPlaceholderText(/04 开头 130 位 HEX/), { target: { value: '00'.repeat(10) } });
    expect((await screen.findAllByText('无法识别为 SM9 数据 (10 字节)')).length).toBeGreaterThan(0);
  });
});
