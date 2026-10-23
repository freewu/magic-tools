// NES 模拟器: 画面渲染 (256×240 帧缓冲 -> canvas)
// jsnes 的 onFrame 每帧给一个 Uint32Array (每像素 0x00RRGGBB, 不含 alpha), 需补 alpha 并交换 R/B 再 putImageData
import { SCREEN_HEIGHT, SCREEN_WIDTH } from './data';

export interface NesRenderer {
  /** 用一帧像素数据刷新画面 */
  draw(frame: Uint32Array): void;
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
): NesRenderer | null => {
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
  const view = new Uint32Array(image.data.buffer as ArrayBuffer);
  const size = view.length;
  return {
    draw(frame: Uint32Array): void {
      if (!frame || frame.length < size) return;
      // jsnes 2.x 的帧缓冲是「无 alpha 的 0x00RRGGBB」, 而 ImageData 在内存里是 R,G,B,A 四字节
      // (浏览器按小端解释 Uint32, 即 0xAABBGGRR)。直接整块拷贝有两个问题:
      //   ① alpha 位是 0 → 画出来全透明, 看起来就是黑屏;
      //   ② R / B 通道颠倒 → 红蓝互换。
      // 所以逐像素补不透明 alpha (0xFF000000) 并交换 R / B。
      for (let i = 0; i < size; i += 1) {
        const c = frame[i];
        view[i] = 0xff000000 | ((c & 0x0000ff) << 16) | (c & 0x00ff00) | ((c & 0xff0000) >> 16);
      }
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
