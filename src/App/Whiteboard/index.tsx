// 白板: Excalidraw 无限画布 · 仅本地功能 (不联网协作 / 不上传, 画布自动保存在本机浏览器)
// 说明: Excalidraw 体积较大, 动态加载并缓存: 只在打开本页时才拉取对应 chunk
import { Button, Card, Divider, Space, Spin, Tooltip, Typography } from 'antd';
import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useLocale } from '../../hook/locale-context';
import { useTheme } from '../../hook/theme-context';
// Excalidraw 样式在 src/index.tsx 入口级引入 (懒加载 chunk 内静态 import CSS 不会注入, 见该处注释)
import { BOARD_HEIGHT } from './data';
import { excalidrawLangOf, readScene, storeScene } from './lib';
import { u } from './lang';
import WhiteboardIntro from './intro';

const { Text } = Typography;

/** Excalidraw 模块动态加载 (缓存 promise, 避免重复拉取) */
type ExcalidrawModule = typeof import('@excalidraw/excalidraw');
let excalidrawPromise: Promise<ExcalidrawModule> | null = null;
const loadExcalidraw = (): Promise<ExcalidrawModule> => {
  excalidrawPromise ??= import('@excalidraw/excalidraw')
    .catch((err) => { excalidrawPromise = null; throw err; });
  return excalidrawPromise;
};

/**
 * 懒加载的白板 (含本地菜单): 独立 chunk, 只打开本页时加载
 * 菜单只保留「打开文件 / 导出图片 / 导出文件 / 命令面板 / 搜索元素 / 清除画布 /
 * 画布背景 / 主题」等本地操作, 去掉帮助、社交链接与在线协作入口
 * 画布需要父级确定高度 (Excalidraw 为 height:100%), 由下方 wb-stage 容器提供
 */
const LazyWhiteboard = lazy(async () => {
  const m = await loadExcalidraw();
  const LocalBoard = (props: React.ComponentPropsWithoutRef<typeof m.Excalidraw>) => (
    <m.Excalidraw {...props}>
      <m.MainMenu>
        <m.MainMenu.DefaultItems.LoadScene />
        <m.MainMenu.DefaultItems.SaveAsImage />
        <m.MainMenu.DefaultItems.Export />
        <m.MainMenu.DefaultItems.CommandPalette />
        <m.MainMenu.DefaultItems.SearchMenu />
        <m.MainMenu.DefaultItems.ClearCanvas />
        <m.MainMenu.DefaultItems.ChangeCanvasBackground />
        <m.MainMenu.DefaultItems.ToggleTheme />
      </m.MainMenu>
    </m.Excalidraw>
  );
  return { default: LocalBoard };
});

// 舞台样式: 全屏时 position:fixed 铺满窗口 (原生全屏失败的窗口内全屏兜底)
const STAGE_CSS = `
.wb-stage { position: relative; width: 100%; }
.wb-stage.wb-stage-full { position: fixed; inset: 0; z-index: 1000; background: #fff; }
@media (prefers-color-scheme: dark) { .wb-stage.wb-stage-full { background: #1b1b1f; } }
`;

/** 全屏 API 在部分内嵌 webview / 老浏览器上不存在, 统一按可选处理 */
type FullscreenElement = HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type BinaryFiles = Record<string, { mimeType: string; dataURL: string }>;
/** 画布变化的回调参数 (unknown 保持与懒加载库解耦; 序列化时按实际签名调用) */
type OnSceneChange = (elements: readonly unknown[], appState: unknown, files: BinaryFiles) => void;

/** 读取并恢复上次的本地场景 (无 / 损坏时返回空画布) */
const loadScene = async () => {
  const scene = readScene();
  if (!scene) return null;
  try {
    const { restore } = await loadExcalidraw();
    const restored = restore(JSON.parse(scene), null, null);
    return { elements: restored.elements, appState: restored.appState };
  } catch {
    return null;
  }
};

const Whiteboard: React.FC = () => {
  const { locale } = useLocale();
  const { isDark } = useTheme();
  const t = (zh: string) => u(locale, zh);

  // ---- 全屏: 先请求原生全屏, 失败 (内嵌 webview / 非用户手势) 时用窗口内全屏兜底 ----
  const [ full, setFull ] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const enterFull = useCallback(() => {
    setFull(true);
    const el = stageRef.current as FullscreenElement | null;
    const request = el?.requestFullscreen?.bind(el) ?? el?.webkitRequestFullscreen?.bind(el);
    if (!request) return;
    try {
      Promise.resolve(request()).catch(() => undefined);
    } catch {
      /* 忽略: 已有 CSS 全屏兜底 */
    }
  }, []);
  const exitFull = useCallback(() => {
    setFull(false);
    const doc = document as FullscreenDocument;
    const active = doc.fullscreenElement ?? doc.webkitFullscreenElement;
    if (!active) return;
    try {
      Promise.resolve(doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.()).catch(() => undefined);
    } catch {
      /* 忽略 */
    }
  }, []);
  // 用户按 Esc / 系统快捷键退出原生全屏时同步状态
  useEffect(() => {
    const onChange = () => { if (!document.fullscreenElement) setFull(false); };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  // 窗口内全屏 (兜底) 时按 Esc 退出
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && full && !document.fullscreenElement) exitFull();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [ full, exitFull ]);

  // 自动保存: 停止绘画片刻后把场景写入 localStorage (卸载时清掉未触发的定时器)
  const saveTimerRef = useRef(0);
  const onChange: OnSceneChange = useCallback(async (elements, appState, files) => {
    window.clearTimeout(saveTimerRef.current);
    const { serializeAsJSON } = await loadExcalidraw();
    const json = (serializeAsJSON as unknown as (e: readonly unknown[], s: unknown, f: unknown, t: 'local') => string)(elements, appState, files, 'local');
    saveTimerRef.current = window.setTimeout(() => storeScene(json), 600);
  }, []);
  useEffect(() => () => window.clearTimeout(saveTimerRef.current), []);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <style>{STAGE_CSS}</style>
      <Card
        size="small"
        title={t('白板')}
        extra={
          <Space size={12}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('画布自动保存在本机浏览器 (localStorage), 不联网、不上传; 菜单栏可导出 PNG / SVG / 画布文件, 也可打开已有文件')}
            </Text>
            <Tooltip title={t(full ? '退出全屏' : '全屏')}>
              <Button
                size="small"
                icon={full ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={full ? exitFull : enterFull}
              >
                {t(full ? '退出全屏' : '全屏')}
              </Button>
            </Tooltip>
          </Space>
        }
      >
        <div
          ref={stageRef}
          className={`wb-stage${full ? ' wb-stage-full' : ''}`}
          style={{ height: full ? '100vh' : BOARD_HEIGHT }}
        >
          <Suspense
            fallback={
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin size="large" />
              </div>
            }
          >
            <LazyWhiteboard
              langCode={excalidrawLangOf(locale)}
              theme={isDark ? 'dark' : 'light'}
              initialData={loadScene}
              onChange={onChange}
            />
          </Suspense>
        </div>
      </Card>

      <Divider>{t(' 白板说明 ')}</Divider>
      <WhiteboardIntro />
    </Space>
  );
};

export default Whiteboard;