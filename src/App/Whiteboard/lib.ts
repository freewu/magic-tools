// 白板: 纯逻辑 —— 画布场景的本地持久化 (localStorage) 与语言映射
// 设计: 不依赖 Excalidraw 库 (只存取序列化后的字符串), 便于单元测试与懒加载解耦
import { AUTOSAVE_DELAY_MS, SCENE_STORAGE_KEY } from './data';

/**
 * 本地场景的落盘结构:
 *  - scene 是 Excalidraw serializeAsJSON 的输出 (可被 restore 原样解析)
 *  - 包一层版本号与时间戳, 未来格式变化可平滑迁移
 */
interface StoredScene {
  v: 1;
  ts: number;
  scene: string;
}

const serialize = (scene: string): StoredScene => ({ v: 1, ts: Date.now(), scene });

/** 写入本地场景 (localStorage 不可用 / 写入失败时静默忽略, 不影响使用) */
export const storeScene = (serializedScene: string): boolean => {
  if (typeof serializedScene !== 'string' || serializedScene.trim() === '') return false;
  try {
    localStorage.setItem(SCENE_STORAGE_KEY, JSON.stringify(serialize(serializedScene)));
    return true;
  } catch {
    return false;
  }
};

/** 读取本地场景 (无存储 / JSON 损坏 / 空场景均返回 null) */
export const readScene = (): string | null => {
  try {
    const raw = localStorage.getItem(SCENE_STORAGE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw) as Partial<StoredScene>;
    if (obj?.v !== 1 || typeof obj.scene !== 'string' || obj.scene.trim() === '') return null;
    return obj.scene;
  } catch {
    return null;
  }
};

/** 清空本地场景 */
export const clearScene = (): void => {
  try {
    localStorage.removeItem(SCENE_STORAGE_KEY);
  } catch {
    /* 忽略 */
  }
};

/** 两次连续写入的最小间隔也有意义 (节流在组件层), 这里只暴露间隔常量便于测试 */
export const autosaveDelay = (): number => AUTOSAVE_DELAY_MS;

/** 界面语言 → Excalidraw 语言代码 (zh-CN / zh-TW / en, 其余回退英文) */
export const excalidrawLangOf = (locale: string): string => {
  if (locale === 'zh-TW') return 'zh-TW';
  if (locale === 'en') return 'en';
  return 'zh-CN';
};