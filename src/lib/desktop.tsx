// 桌面版 (Tauri) 专属能力的通用提示
//
// 浏览器演示版 (GitHub Pages) 缺少应用内网络能力 (ICMP 探测 / 原始 DNS / TCP Whois),
// 相关工具在浏览器里只能提示"仅桌面版可用"并引导下载桌面版。
// 文案由各工具自己提供 (多语言), 这里只负责统一的展示形态与下载入口。
import { Alert, Button, theme } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { openUrl } from './tauri';
import { LATEST_PAGE_URL } from './update';

/** 桌面版下载地址 (GitHub Releases 最新版本页) */
export const DESKTOP_DOWNLOAD_URL = LATEST_PAGE_URL;

export type DesktopOnlyNoticeProps = {
  /** 主提示, 如「该功能仅在桌面应用中可用」 */
  text: string;
  /** 下载按钮文案, 如「下载桌面版」 */
  download: string;
  /** 补充说明 (可选), 如「浏览器版无法发起 ICMP 探测」 */
  hint?: string;
};

/**
 * 桌面版专属功能提示条
 * 浏览器环境下渲染; 桌面环境下调用方应自行跳过渲染
 */
const DesktopOnlyNotice = ({ text, download, hint }: DesktopOnlyNoticeProps) => {
  const { token } = theme.useToken();
  return (
    <Alert
      className="desktop-only-notice"
      type="warning"
      showIcon
      style={ { margin: '12px 0', maxWidth: 720 } }
      message={ <span>{ text }</span> }
      description={ hint === undefined ? undefined : (
        <span style={ { fontSize: 12, color: token.colorTextSecondary } }>{ hint }</span>
      ) }
      action={
        <Button
          size="small"
          type="primary"
          icon={ <DownloadOutlined /> }
          onClick={ () => { void openUrl(DESKTOP_DOWNLOAD_URL); } }
        >{ download }</Button>
      }
    />
  );
}

export default DesktopOnlyNotice;
