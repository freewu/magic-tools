// 更新检查共享上下文: 启动后查询一次 GitHub Releases,
// 同时供 右下角通知 (提示过不再打扰) 与 侧栏底部版本号呼吸角标 (点击打开) 使用。
// 网络失败 / 已是新版 / 已是本地最新一律静默。
import { notification } from 'antd';
import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { openUrl } from '../lib/tauri';
import { compareVersions, fetchLatestRelease, type UpdateInfo } from '../lib/update';
import { getVersion } from '../version';

/** 已弹窗提示过的最新远端 tag (不含 v): 避免同一版本反复打扰 */
const LS_SEEN = 'magic-tools-last-update-tag';
/** 用户已点开处理过的最新 tag: 同版本不再显示呼吸角标 */
const LS_DISMISS = 'magic-tools-update-badge-dismissed';

export interface UpdateState {
  /** 拉取到的最新 Release (网络失败为 null) */
  latest: UpdateInfo | null;
  /** 远端有更新 且 当前版本角标未被忽略 */
  hasUpdate: boolean;
  /** 点击角标后忽略该版本提示 */
  dismiss: () => void;
}

const UpdateContext = createContext<UpdateState>({
  latest: null,
  hasUpdate: false,
  dismiss: () => undefined,
});

export const useUpdate = () => useContext(UpdateContext);

const DELAY_MS = 2500; // 等窗口/主界面就绪后再请求
const NOTIFY_DURATION = 8; // 秒, 自动关闭也视为"已提示"

const readLS = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeLS = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
};

export const UpdateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [api, contextHolder] = notification.useNotification();
  const [latest, setLatest] = useState<UpdateInfo | null>(null);
  const [dismissedTag, setDismissedTag] = useState<string | null>(() => readLS(LS_DISMISS));

  useEffect(() => {
    let disposed = false;
    const timer = window.setTimeout(async () => {
      const info = await fetchLatestRelease();
      if (disposed || !info) return;
      setLatest(info);

      // 本地已是新版 (或同版) 不提示
      if (compareVersions(info.version, getVersion()) <= 0) return;

      // 该版本已提示过不再打扰
      if (readLS(LS_SEEN) === info.tag) return;

      api.open({
        message: `发现新版本 v${info.version}`,
        description: '点击查看更新内容并下载 👇',
        placement: 'bottomRight',
        duration: NOTIFY_DURATION,
        onClick: () => {
          writeLS(LS_SEEN, info.tag);
          setDismissedTag(info.tag); // 用户已打开更新页, 角标随之消失
          void openUrl(info.url);
        },
        onClose: () => writeLS(LS_SEEN, info.tag),
      });
    }, DELAY_MS);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
    };
  }, [api]);

  const value = useMemo<UpdateState>(() => {
    const hasUpdate =
      !!latest &&
      compareVersions(latest.version, getVersion()) > 0 &&
      latest.tag !== dismissedTag;
    return {
      latest,
      hasUpdate,
      dismiss: () => {
        if (latest) {
          setDismissedTag(latest.tag);
          writeLS(LS_DISMISS, latest.tag);
        }
      },
    };
  }, [latest, dismissedTag]);

  return (
    <UpdateContext.Provider value={value}>
      {children}
      {contextHolder}
    </UpdateContext.Provider>
  );
};
