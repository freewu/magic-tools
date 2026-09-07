// 启动后检查 GitHub Releases 是否有新版本:
// 有新版且本机从未提示过该版本 -> 右下角 notification, 点击打开 Release 页面。
// 提示过 (点击或自动关闭) 后记入 localStorage, 该版本不再重复打扰;
// 网络失败 / 已是新版 / 已是本地最新一律静默。
import { notification } from 'antd';
import React, { useEffect } from 'react';
import { openUrl } from '../lib/tauri';
import { compareVersions, fetchLatestRelease } from '../lib/update';
import { getVersion } from '../version';

/** 已提示过的最新远端 tag (不含 v), 用于避免同一版本反复弹窗 */
const LS_KEY = 'magic-tools-last-update-tag';

const DELAY_MS = 2500; // 等窗口/主界面就绪后再请求
const NOTIFY_DURATION = 8; // 秒, 自动关闭也视为"已提示"

const UpdateChecker: React.FC = () => {
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    let disposed = false;
    const timer = window.setTimeout(async () => {
      const latest = await fetchLatestRelease();
      if (disposed || !latest) return;

      // 本地已是新版 (或同版) 不提示
      if (compareVersions(latest.version, getVersion()) <= 0) return;

      // 该版本已提示过不再打扰
      const seenTag = window.localStorage.getItem(LS_KEY);
      if (seenTag === latest.tag) return;

      const markSeen = () => {
        window.localStorage.setItem(LS_KEY, latest.tag);
      };
      api.open({
        message: `发现新版本 v${latest.version}`,
        description: '点击查看更新内容并下载 👇',
        placement: 'bottomRight',
        duration: NOTIFY_DURATION,
        onClick: () => {
          markSeen();
          void openUrl(latest.url);
        },
        onClose: markSeen,
      });
    }, DELAY_MS);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
    };
  }, [api]);

  return <>{contextHolder}</>;
};

export default UpdateChecker;
