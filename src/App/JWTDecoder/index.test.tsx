import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import JWTDecoder from './index';
import { LocaleProvider } from '../../hook/locale-context';

// jwt.io 官方示例 token (HS256)
const SAMPLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const renderPage = () => render(
  <LocaleProvider>
    <JWTDecoder />
  </LocaleProvider>
);

describe('JWTDecoder 页面', () => {

  it('默认展示「解析」页签', async () => {
    renderPage();
    expect(screen.getByRole('tab', { name: '解析' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: '生成' })).toBeTruthy();
    expect(screen.getByPlaceholderText(/粘贴 JWT/)).toBeTruthy();
  });

  it('解析页签粘贴 token 后可看到头部 / 负载 / 签名', async () => {
    renderPage();
    const box = screen.getByPlaceholderText(/粘贴 JWT/);
    fireEvent.change(box, { target: { value: SAMPLE } });
    expect(await screen.findByText(/"sub": "1234567890"/)).toBeTruthy();
    expect(screen.getByText(/Header 元信息: alg: HS256\s+typ: JWT/)).toBeTruthy();
    expect(screen.getByDisplayValue(/^[0-9A-F]{64}$/)).toBeTruthy(); // 签名 HEX
    expect(screen.getByText(/base64url: SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c/)).toBeTruthy();
  });

  it('生成页签用默认值一键生成 jwt.io 示例 token', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: '生成' }));
    const btn = await screen.findByRole('button', { name: /生成 JWT/ });
    fireEvent.click(btn);
    expect(await screen.findByDisplayValue(SAMPLE)).toBeTruthy();
  });

  it('生成页签切换到 none 算法时无需密钥并输出空签名', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: '生成' }));

    // 直接把头部 JSON 改为 alg=none (会同步下拉框)
    const headerBox = screen.getByDisplayValue(/"alg": "HS256"/);
    fireEvent.change(headerBox, { target: { value: '{"alg":"none","typ":"JWT"}' } });

    const secret = screen.getByPlaceholderText(/HMAC 签名密钥/) as HTMLInputElement;
    expect(secret.disabled).toBe(true);

    fireEvent.click(await screen.findByRole('button', { name: /生成 JWT/ }));
    expect(await screen.findByDisplayValue(/^\S+\.\S+\.$/)).toBeTruthy();
    expect(screen.getByDisplayValue('(空签名, alg=none)')).toBeTruthy();
  });

  it('生成页签头部 JSON 非法时给出错误提示', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: '生成' }));
    fireEvent.change(screen.getByDisplayValue(/"alg": "HS256"/), { target: { value: 'oops' } });
    fireEvent.click(await screen.findByRole('button', { name: /生成 JWT/ }));
    expect(await screen.findByText(/不是合法 JSON/)).toBeTruthy();
  });
});
