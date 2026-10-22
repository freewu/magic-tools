// NES 模拟器: 音频输出 (AudioWorklet + 环形缓冲)
// jsnes 每帧通过 onAudioSample 吐出左右声道采样, 这里批量打包给 AudioWorklet 播放
// 说明: 浏览器不支持 AudioWorklet (或运行在测试环境的 jsdom 里) 时静默降级, 只是没有声音, 不影响画面
import { volumeToGain } from './lib';

/** 每次批量发送的采样数 (与音频渲染量子对齐) */
const BATCH_SIZE = 128;

/** AudioWorklet 处理器源码 (内联为字符串, 通过 Blob URL 加载, 不用打包器特殊语法) */
const WORKLET_CODE = `
class NesAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // 环形缓冲: 约 170ms @48kHz, 够吸收主线程卡顿又不会引入明显延迟
    this.capacity = 8192;
    this.bufferL = new Float32Array(this.capacity);
    this.bufferR = new Float32Array(this.capacity);
    this.readPos = 0;
    this.writePos = 0;
    this.count = 0;
    this.port.onmessage = (e) => {
      const left = e.data && e.data.left;
      const right = e.data && e.data.right;
      if (!left || !right) return;
      const len = left.length;
      if (this.count + len > this.capacity) {
        const drop = this.count + len - this.capacity;
        this.readPos = (this.readPos + drop) % this.capacity;
        this.count -= drop;
      }
      for (let i = 0; i < len; i++) {
        this.bufferL[this.writePos] = left[i];
        this.bufferR[this.writePos] = right[i];
        this.writePos = (this.writePos + 1) % this.capacity;
      }
      this.count += len;
    };
  }
  process(inputs, outputs) {
    const output = outputs[0];
    if (!output || output.length < 2) return true;
    const outL = output[0];
    const outR = output[1];
    const size = outL.length;
    if (this.count < size) {
      // 缓冲不足: 有多少放多少, 其余补静音 (避免爆音)
      for (let i = 0; i < this.count; i++) {
        outL[i] = this.bufferL[this.readPos];
        outR[i] = this.bufferR[this.readPos];
        this.readPos = (this.readPos + 1) % this.capacity;
      }
      for (let i = this.count; i < size; i++) {
        outL[i] = 0;
        outR[i] = 0;
      }
      this.count = 0;
    } else {
      for (let i = 0; i < size; i++) {
        outL[i] = this.bufferL[this.readPos];
        outR[i] = this.bufferR[this.readPos];
        this.readPos = (this.readPos + 1) % this.capacity;
      }
      this.count -= size;
    }
    return true;
  }
}
registerProcessor('nes-audio-processor', NesAudioProcessor);
`;

/** AudioContext 构造函数 (老 WebKit 前缀版兼容) */
type AudioContextCtor = typeof AudioContext;
type AudioContextWindow = { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor };

/** 取当前环境的 AudioContext 构造器 (没有则返回 null) */
export const resolveAudioContextCtor = (): AudioContextCtor | null => {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as AudioContextWindow;
  return win.AudioContext ?? win.webkitAudioContext ?? null;
};

/** 当前环境能否出声 (需要 AudioContext + AudioWorklet) */
export const isAudioSupported = (): boolean => {
  const Ctor = resolveAudioContextCtor();
  if (!Ctor || typeof AudioWorkletNode === 'undefined') return false;
  return 'audioWorklet' in Ctor.prototype;
};

/** NES 音频通道 (start / stop 由页面控制, write 由 jsnes 的 onAudioSample 驱动) */
export class NesAudio {
  private ctx: AudioContext | null = null;

  private gain: GainNode | null = null;

  private node: AudioWorkletNode | null = null;

  private batchL = new Float32Array(BATCH_SIZE);

  private batchR = new Float32Array(BATCH_SIZE);

  private batchPos = 0;

  /** 采样率 (未初始化时用 44100 兜底, 保证 jsnes 能正常构造) */
  get sampleRate(): number {
    return this.ctx?.sampleRate ?? 44100;
  }

  /** 音频通道是否已就绪 (未就绪时采样会被丢弃) */
  get ready(): boolean {
    return this.node !== null;
  }

  /** 初始化音频通道; 返回是否成功 (失败不影响模拟运行) */
  async start(volume: number): Promise<boolean> {
    if (this.node) return true;
    if (!isAudioSupported()) return false;
    const Ctor = resolveAudioContextCtor();
    if (!Ctor) return false;
    try {
      const ctx = new Ctor();
      // 先挂上 ctx: 调用方紧接着会读 sampleRate 传给 jsnes, 必须已经是真实采样率
      this.ctx = ctx;
      const blob = new Blob([ WORKLET_CODE ], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      await ctx.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);
      const node = new AudioWorkletNode(ctx, 'nes-audio-processor', { outputChannelCount: [ 2 ] });
      const gain = ctx.createGain();
      gain.gain.value = volumeToGain(volume);
      node.connect(gain);
      gain.connect(ctx.destination);
      this.node = node;
      this.gain = gain;
      return true;
    } catch (err) {
      console.warn('NES audio unavailable:', err);
      this.stop();
      return false;
    }
  }

  /** 浏览器要求用户手势后才能出声: 在按键 / 点击时调用 */
  resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      Promise.resolve(this.ctx.resume()).catch(() => undefined);
    }
  }

  /** 设置音量 (0~100) */
  setVolume(volume: number): void {
    if (this.gain) this.gain.gain.value = volumeToGain(volume);
  }

  /** 写入一个立体声采样 (jsnes onAudioSample 回调) */
  write(left: number, right: number): void {
    if (!this.node) return;
    this.batchL[this.batchPos] = left;
    this.batchR[this.batchPos] = right;
    this.batchPos += 1;
    if (this.batchPos >= BATCH_SIZE) this.flush();
  }

  /** 把尚未发完的采样推给 worklet (每帧结束时调用) */
  flush(): void {
    if (!this.node || this.batchPos === 0) return;
    this.node.port.postMessage({
      left: this.batchL.slice(0, this.batchPos),
      right: this.batchR.slice(0, this.batchPos),
    });
    this.batchPos = 0;
  }

  /** 关闭音频通道并释放资源 */
  stop(): void {
    this.batchPos = 0;
    if (this.node) {
      try {
        this.node.port.postMessage(null);
        this.node.disconnect();
      } catch {
        /* 忽略 */
      }
      this.node = null;
    }
    if (this.gain) {
      try {
        this.gain.disconnect();
      } catch {
        /* 忽略 */
      }
      this.gain = null;
    }
    if (this.ctx) {
      Promise.resolve(this.ctx.close()).catch(() => undefined);
      this.ctx = null;
    }
  }
}

export default NesAudio;
