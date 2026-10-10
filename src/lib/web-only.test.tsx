import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import WebOnlyNotice, { WEB_APP_URL, webAppUrl } from './web-only';
import { openUrl } from './tauri';

jest.mock('./tauri', () => ({
  openUrl: jest.fn().mockResolvedValue(undefined),
}));
afterEach(() => cleanup());

const mockOpenUrl = openUrl as jest.Mock;
// 按钮带 LinkOutlined 图标, 可访问名称为 "link 打开 Web 版"
const openButton = () => screen.getByRole('button', { name: /打开 Web 版/ });

describe('webAppUrl', () => {
  test('按工具 key 拼出 Web 版深链 (HashRouter)', () => {
    expect(WEB_APP_URL).toBe('https://freewu.github.io/magic-tools/tools/');
    expect(webAppUrl('ScreenRecorder')).toBe('https://freewu.github.io/magic-tools/tools/#/ScreenRecorder');
    expect(webAppUrl('MindMap')).toBe('https://freewu.github.io/magic-tools/tools/#/MindMap');
  });
});

describe('WebOnlyNotice', () => {
  beforeEach(() => mockOpenUrl.mockClear());

  test('缺省跳转 Web 版首页', () => {
    render(<WebOnlyNotice text="仅浏览器可用" hint="桌面版无此能力" action="打开 Web 版" />);
    expect(screen.getByText('仅浏览器可用')).toBeInTheDocument();
    expect(screen.getByText('桌面版无此能力')).toBeInTheDocument();
    fireEvent.click(openButton());
    expect(mockOpenUrl).toHaveBeenCalledWith(WEB_APP_URL);
  });

  test('传 url 时跳转指定地址 (工具深链)', () => {
    render(
      <WebOnlyNotice
        text="仅浏览器可用"
        action="打开 Web 版"
        url={ webAppUrl('ScreenRecorder') }
      />
    );
    fireEvent.click(openButton());
    expect(mockOpenUrl).toHaveBeenCalledWith('https://freewu.github.io/magic-tools/tools/#/ScreenRecorder');
  });
});
