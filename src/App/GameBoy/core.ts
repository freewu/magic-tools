// GameBoy 模拟器: 模拟核心封装 (boytacean → WebAssembly)
// 说明: wasm 核心体积较大 (约 430KB), 这里按需动态加载, 首次进入页面时才初始化;
//       页面只与本文件暴露的 GbMachine 交互, 单测里直接 mock 掉本模块即可
import { FRAME_CYCLES, PAD_CODES, type PadButton } from './data';

type BoytaceanModule = typeof import('boytacean');
type GameBoyCore = import('boytacean').GameBoy;

/** 核心模块的加载 Promise (整个页面共享一份 wasm 实例) */
let corePromise: Promise<BoytaceanModule> | null = null;

/** 加载并初始化 wasm 核心 (幂等; 失败后允许重试) */
export const loadCore = (): Promise<BoytaceanModule> => {
  if (corePromise) return corePromise;
  corePromise = (async () => {
    const mod = await import('boytacean');
    // 直接引入 wasm 资源地址, 交给 Vite 打包/指向 CDN 静态文件 (不依赖核心内部的 import.meta.url)
    const { default: wasmUrl } = await import('boytacean/boytacean_bg.wasm?url');
    await mod.default({ module_or_path: wasmUrl });
    try {
      mod.GameBoy.set_panic_hook_wa?.();
    } catch {
      /* 忽略: 只是让 Rust panic 变成 JS 异常, 失败不影响运行 */
    }
    return mod;
  })().catch((err) => {
    corePromise = null;
    throw err;
  });
  return corePromise;
};

/** 卡带信息 (取自核心解析出的 Cartridge, 界面用于展示) */
export interface GbCartInfo {
  title: string;
  /** 是否为彩色 (GBC) 模式运行 */
  cgb: boolean;
  /** 卡带容量描述 (如 "512Kb") */
  romSize: string;
  /** 卡带 RAM 描述 (如 "64Kb") */
  ramSize: string;
  /** 卡带类型描述 (如 "MBC5+RAM+BATTERY") */
  romType: string;
  /** 是否带电池 */
  battery: boolean;
}

/** 一帧的执行结果 */
export interface GbFrameResult {
  /** 本帧实际执行的时钟周期数 */
  cycles: number;
  /** 核心内部累计帧数 */
  frames: number;
}

/**
 * GameBoy 机器封装
 * 调用方需自己保证只在主线程按帧节奏调用 stepFrame
 */
export class GbMachine {
  private mod: BoytaceanModule;

  private gb: GameBoyCore;

  private cartInfo: GbCartInfo;

  private constructor(mod: BoytaceanModule, gb: GameBoyCore, cartInfo: GbCartInfo) {
    this.mod = mod;
    this.gb = gb;
    this.cartInfo = cartInfo;
  }

  /** 载入 ROM 并启动 (跳过开机自检, 直接跑卡带) */
  static async create(rom: Uint8Array): Promise<GbMachine> {
    const mod = await loadCore();
    const gb = new mod.GameBoy();
    gb.load_null_wa();
    // 依据卡带头里的 CGB 标记切换 DMG / CGB 模式
    gb.infer_mode_wa(rom);
    const cart = gb.load_rom_wa(rom);
    gb.load_unsafe(true);
    let cartInfo: GbCartInfo = { title: '', cgb: false, romSize: '', ramSize: '', romType: '', battery: false };
    try {
      cartInfo = {
        title: cart.title(),
        cgb: cart.gb_mode() === mod.GameBoyMode.Cgb,
        romSize: cart.rom_size_s(),
        ramSize: cart.ram_size_s(),
        romType: cart.rom_type_s(),
        battery: cart.has_battery(),
      };
    } catch {
      /* 忽略: 卡带信息仅用于展示 */
    }
    return new GbMachine(mod, gb, cartInfo);
  }

  /** 卡带信息 */
  get info(): GbCartInfo {
    return this.cartInfo;
  }

  /** 当前是否为 CGB (彩色) 模式 */
  get isCgb(): boolean {
    try {
      return this.gb.is_cgb();
    } catch {
      return this.cartInfo.cgb;
    }
  }

  /** 执行一帧 (70224 时钟周期) */
  stepFrame(): GbFrameResult {
    const frame = this.gb.clocks_frame_buffer(FRAME_CYCLES);
    return { cycles: Number(frame.cycles ?? FRAME_CYCLES), frames: Number(frame.frames ?? 0) };
  }

  /** 取当前帧的像素缓冲 (RGB, 160×144×3) */
  frameBuffer(): Uint8Array {
    return this.gb.frame_buffer_eager();
  }

  /** 取上一帧产生的音频采样 (交错立体声 Int16), 取完即清空 */
  audioBuffer(): Int16Array {
    try {
      return this.gb.audio_buffer_eager(true);
    } catch {
      return new Int16Array(0);
    }
  }

  /** 当前程序计数器 (调试 / 界面展示用) */
  pc(): number {
    try {
      return this.gb.registers().pc;
    } catch {
      return 0;
    }
  }

  /** 按下手柄按键 */
  press(button: PadButton): void {
    try {
      this.gb.key_press(PAD_CODES[button]);
    } catch {
      /* 忽略: 核心未就绪时不响应按键 */
    }
  }

  /** 松开手柄按键 */
  release(button: PadButton): void {
    try {
      this.gb.key_lift(PAD_CODES[button]);
    } catch {
      /* 忽略 */
    }
  }

  /** 松开全部按键 (失焦时调用, 避免按键卡住) */
  releaseAll(): void {
    Object.keys(PAD_CODES).forEach((btn) => this.release(btn as PadButton));
  }

  /** 复位: 重新挂载卡带 (等同于重新开机) */
  reset(): void {
    this.gb.reload_wa();
  }

  /** 保存状态 (BESS / BOS 格式字节) */
  saveState(): Uint8Array {
    return this.mod.StateManager.save_wa(this.gb, null, null);
  }

  /** 读取状态 */
  loadState(bytes: Uint8Array): void {
    this.mod.StateManager.load_wa(bytes, this.gb, null, null);
  }

  /** 卡带电池存档 (SRAM) 内容, 无存档卡带返回空数组 */
  ramData(): Uint8Array {
    try {
      return this.gb.ram_data_eager();
    } catch {
      return new Uint8Array(0);
    }
  }

  /** 写回卡带电池存档 (SRAM) */
  setRamData(bytes: Uint8Array): void {
    try {
      this.gb.set_ram_data(bytes);
    } catch {
      /* 忽略 */
    }
  }

  /** 释放 wasm 侧对象 */
  destroy(): void {
    try {
      this.gb.free?.();
    } catch {
      /* 忽略 */
    }
  }
}

export default GbMachine;
