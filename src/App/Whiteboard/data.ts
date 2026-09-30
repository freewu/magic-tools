// 白板: 画布高度 / 自动保存间隔等常量
// 说明: Excalidraw 组件需要明确高度的容器, 数值集中在此便于调整

/** 画布容器高度 (px) */
export const BOARD_HEIGHT = 700;

/** 自动保存间隔 (ms): 停止绘画后这么久写入 localStorage */
export const AUTOSAVE_DELAY_MS = 600;

/**
 * 本地场景存储 key
 * 画布内容会序列化后保存在浏览器本地, 再次打开自动恢复; 不上传、不联网
 */
export const SCENE_STORAGE_KEY = 'whiteboard-scene-v1';