// GameBoy 模拟器: 画面渲染 (160×144 RGB 帧缓冲 -> canvas)
// boytacean 的 frame_buffer_eager() 每帧给一个 Uint8Array (每像素 3 字节 RGB), 需要补上 alpha 再 putImageData
import { SCREEN_HEIGHT, SCREEN_WIDTH } from './data';
import { writeRgba } from './lib';

export interface GbRenderer {
  /** 用一帧像素数据刷新画面 */
  draw(frame: Uint8Array): void;
  /** 导出当前画面为 PNG data URL (截屏); 失败返回 null */
  snapshot(): string | null;
  /** 清空画面 (未加载 ROM / 停止时) */
  clear(): void;
}

/**
 * 创建渲染器
 * canvas 取不到 2D 上下文 (如测试环境的 jsdom) 时返回 null, 调用方需容忍无画面
 */
export const createRenderer = (
  canvas: HTMLCanvasElement | null,
  width: number = SCREEN_WIDTH,
  height: number = SCREEN_HEIGHT,
): GbRenderer | null => {
  if (!canvas || typeof canvas.getContext !== 'function') return null;
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = canvas.getContext('2d');
  } catch {
    return null;
  }
  if (!ctx) return null;
  canvas.width = width;
  canvas.height = height;
  const image = ctx.createImageData(width, height);
  return {
    draw(frame: Uint8Array): void {
      if (!frame || frame.length === 0) return;
      writeRgba(frame, image.data);
      ctx.putImageData(image, 0, 0);
    },
    snapshot(): string | null {
      try {
        return canvas.toDataURL('image/png');
      } catch {
        return null;
      }
    },
    clear(): void {
      ctx.clearRect(0, 0, width, height);
    },
  };
};

export default createRenderer;
