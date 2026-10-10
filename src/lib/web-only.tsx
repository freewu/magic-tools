// Web 版 (浏览器) 专属能力的通用提示
//
// 少数工具依赖浏览器原生能力 (如屏幕采集 getDisplayMedia) 才能工作:
// 桌面版内嵌的 WebView 里没有系统共享选择器, 这些工具只在浏览器 (Web 版) 可用。
// 文案由各工具自己提供 (多语言), 这里只负责统一的展示形态与 Web 版入口。
import { Alert, Button, theme } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { openUrl } from './tauri';

/** Web 版地址 (GitHub Pages 演示站, 与仓库 homepage 一致) */
export const WEB_APP_URL = 'https://freewu.github.io/magic-tools/tools/';

/** 某个工具在 Web 版里的深链 (Web 版用 HashRouter, 形如 .../tools/#/ScreenRecorder) */
export const webAppUrl = (appKey :string) :string => `${WEB_APP_URL}#/${appKey}`;

export type WebOnlyNoticeProps = {
  /** 主提示, 如「该功能仅在浏览器 (Web 版) 中可用」 */
  text: string;
  /** 补充说明 (可选), 如「桌面版内嵌 WebView 没有屏幕共享选择器」 */
  hint?: string;
  /** 按钮文案, 如「打开 Web 版」 */
  action: string;
  /** 按钮跳转地址 (缺省为 Web 版首页), 传 webAppUrl(appKey) 可直达对应工具 */
  url?: string;
};

/**
 * Web 版专属功能提示条
 * 桌面环境下渲染; 浏览器环境下调用方应自行跳过渲染
 */
const WebOnlyNotice = ({ text, hint, action, url }: WebOnlyNoticeProps) => {
  const { token } = theme.useToken();
  return (
    <Alert
      className="web-only-notice"
      type="info"
      showIcon
      style={ { margin: '0 0 12px', maxWidth: 860 } }
      message={ <span>{ text }</span> }
      description={ hint === undefined ? undefined : (
        <span style={ { fontSize: 12, color: token.colorTextSecondary } }>{ hint }</span>
      ) }
      action={
        <Button
          size="small"
          type="primary"
          icon={ <LinkOutlined /> }
          onClick={ () => { void openUrl(url ?? WEB_APP_URL); } }
        >{ action }</Button>
      }
    />
  );
}

export default WebOnlyNotice;
