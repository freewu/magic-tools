import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import DesktopOnlyNotice, { DESKTOP_DOWNLOAD_URL } from './desktop';
import { openUrl } from './tauri';
import { LATEST_PAGE_URL } from './update';

jest.mock('./tauri', () => ({
  openUrl: jest.fn(),
  isTauri: () => false,
}));

const mockOpenUrl = openUrl as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('DesktopOnlyNotice', () => {
  test('展示提示文案 / 下载按钮 / 补充说明', () => {
    render(
      <DesktopOnlyNotice
        text="该功能仅在桌面应用中可用"
        download="下载桌面版"
        hint="浏览器版无法发起 ICMP 探测"
      />,
    );
    expect(screen.getByText('该功能仅在桌面应用中可用')).toBeInTheDocument();
    expect(screen.getByText('浏览器版无法发起 ICMP 探测')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /下载桌面版/ })).toBeInTheDocument();
  });

  test('无补充说明时不渲染描述行', () => {
    const { container } = render(<DesktopOnlyNotice text="提示" download="下载桌面版" />);
    expect(container.querySelector('.ant-alert-description')).toBeNull();
  });

  test('点击下载按钮打开 Releases 最新版本页', () => {
    render(<DesktopOnlyNotice text="提示" download="下载桌面版" />);
    fireEvent.click(screen.getByRole('button', { name: /下载桌面版/ }));
    expect(mockOpenUrl).toHaveBeenCalledWith(LATEST_PAGE_URL);
    expect(DESKTOP_DOWNLOAD_URL).toBe(LATEST_PAGE_URL);
  });
});
