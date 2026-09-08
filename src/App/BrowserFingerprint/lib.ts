// 浏览器指纹 纯逻辑层
// - hashString: FNV-1a 32 位 → 8 位十六进制 (指纹哈希, 非加密用途)
// - 三类指纹计算函数 (浏览器 DOM API, 仅在页面运行时调用, jest 不执行)
// - FINGERPRINT_CODE: 可直接复制使用的参考 JS 实现 (与页面计算逻辑一致)

/** FNV-1a 32-bit, 返回 8 位小写十六进制 */
export function hashString(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export type FpKind = 'canvas' | 'webgl' | 'audio';

export interface FpResult {
  /** 计算成功时的指纹哈希 (8 位 hex) */
  value?: string;
  /** 补充说明: 参与指纹的素材 / 详情 */
  detail?: string;
  /** 计算失败原因 (环境不支持/被禁用) */
  reason?: string;
}

export function runCanvasFingerprint(): FpResult {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { reason: 'Canvas 2D 上下文不可用 (可能被浏览器策略禁用)' };
    ctx.textBaseline = 'top';
    // 文字/字体的渲染差异是主要指纹来源
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillText('BrowserFingerprint canvas', 2, 2);
    ctx.font = '16px serif';
    ctx.fillStyle = 'rgba(102,204,0,0.7)';
    ctx.fillText('magic-tools 指纹测试', 4, 20);
    // 渐变填充
    const grad = ctx.createLinearGradient(0, 0, 200, 0);
    grad.addColorStop(0, 'magenta');
    grad.addColorStop(1, 'blue');
    ctx.fillStyle = grad;
    ctx.fillRect(4, 40, 200, 14);
    // 抗锯齿圆
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    ctx.arc(220, 45, 10, 0, Math.PI * 2);
    ctx.stroke();
    const dataUrl = canvas.toDataURL();
    return { value: hashString(dataUrl), detail: `toDataURL PNG, ${dataUrl.length.toLocaleString()} 字符` };
  } catch (e) {
    return { reason: e instanceof Error ? e.message : String(e) };
  }
}

export function runWebglFingerprint(): FpResult {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return { reason: 'WebGL 上下文不可用' };
    const dbg = gl.getExtension('WEBGL_debug_renderer_info') as
      | { UNMASKED_VENDOR_WEBGL: number; UNMASKED_RENDERER_WEBGL: number }
      | null;
    const vendor = dbg ? String(gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL)) : String(gl.getParameter(gl.VENDOR));
    const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER));
    const info = [
      `renderer=${renderer}`,
      `vendor=${vendor}`,
      `version=${String(gl.getParameter(gl.VERSION))}`,
      `shading=${String(gl.getParameter(gl.SHADING_LANGUAGE_VERSION))}`,
      `extensions=${(gl.getSupportedExtensions() ?? []).length}`,
      `maxTextureSize=${String(gl.getParameter(gl.MAX_TEXTURE_SIZE))}`,
      `maxViewport=${String(gl.getParameter(gl.MAX_VIEWPORT_DIMS))}`,
      `maxRenderbuffer=${String(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE))}`,
    ].join('|');
    return { value: hashString(info), detail: `${vendor} · ${renderer}` };
  } catch (e) {
    return { reason: e instanceof Error ? e.message : String(e) };
  }
}

export async function runAudioFingerprint(): Promise<FpResult> {
  try {
    const Ctor = window.OfflineAudioContext
      || (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;
    if (!Ctor) return { reason: 'OfflineAudioContext 不可用' };
    const len = Math.floor(44100 * 0.5); // 0.5 秒 @ 44.1kHz
    const ctx = new Ctor(1, len, 44100);
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 10000;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -50;
    comp.knee.value = 40;
    comp.ratio.value = 12;
    comp.attack.value = 0;
    comp.release.value = 0.25;
    osc.connect(comp);
    comp.connect(ctx.destination);
    osc.start(0);
    const rendered = await ctx.startRendering();
    const data = rendered.getChannelData(0);
    let sig = '';
    for (let i = 0; i < data.length; i += 1) {
      sig += data[i].toFixed(6);
      sig += ',';
    }
    return { value: hashString(sig), detail: `${len.toLocaleString()} 个输出样本 @ 44100Hz` };
  } catch (e) {
    return { reason: e instanceof Error ? e.message : String(e) };
  }
}

export const FP_KIND_LABEL: Record<FpKind, string> = {
  canvas: 'Canvas 指纹',
  webgl: 'WebGL 指纹',
  audio: '音频指纹',
};

// ---- 参考 JS 实现 (页面展示用, 复制即用, 与上方计算逻辑一致) ----

const SNIPPET_HEADER = `// FNV-1a 32 位哈希 → 8 位十六进制 (工具页内置同款函数)
function fnv1a(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}`;

const CANVAS_JS = `${SNIPPET_HEADER}

// 1. Canvas 指纹: 文字绘制 + 渐变 + 图形 → toDataURL 哈希
function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { ok: false, reason: 'Canvas 2D 不可用' };
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillText('BrowserFingerprint canvas', 2, 2);
    ctx.font = '16px serif';
    ctx.fillStyle = 'rgba(102,204,0,0.7)';
    ctx.fillText('magic-tools 指纹测试', 4, 20);
    const grad = ctx.createLinearGradient(0, 0, 200, 0);
    grad.addColorStop(0, 'magenta');
    grad.addColorStop(1, 'blue');
    ctx.fillStyle = grad;
    ctx.fillRect(4, 40, 200, 14);
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    ctx.arc(220, 45, 10, 0, Math.PI * 2);
    ctx.stroke();
    return { ok: true, value: fnv1a(canvas.toDataURL()) };
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
}`;

const WEBGL_JS = `${SNIPPET_HEADER}

// 2. WebGL 指纹: GPU 厂商/渲染器/扩展与渲染参数哈希
function getWebglFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return { ok: false, reason: 'WebGL 不可用' };
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
    const renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    const info = [
      'renderer=' + renderer,
      'vendor=' + vendor,
      'version=' + gl.getParameter(gl.VERSION),
      'shading=' + gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      'extensions=' + (gl.getSupportedExtensions() || []).length,
      'maxTextureSize=' + gl.getParameter(gl.MAX_TEXTURE_SIZE),
    ].join('|');
    return { ok: true, value: fnv1a(info), renderer: renderer + ' / ' + vendor };
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
}`;

const AUDIO_JS = `${SNIPPET_HEADER}

// 3. 音频指纹: OfflineAudioContext 合成 0.5s 信号, 对输出样本哈希
async function getAudioFingerprint() {
  try {
    const Ctx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!Ctx) return { ok: false, reason: 'OfflineAudioContext 不可用' };
    const len = Math.floor(44100 * 0.5);
    const ctx = new Ctx(1, len, 44100);
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 10000;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -50;
    comp.knee.value = 40;
    comp.ratio.value = 12;
    comp.attack.value = 0;
    comp.release.value = 0.25;
    osc.connect(comp);
    comp.connect(ctx.destination);
    osc.start(0);
    const rendered = await ctx.startRendering();
    const data = rendered.getChannelData(0);
    let sig = '';
    for (let i = 0; i < data.length; i++) {
      sig += data[i].toFixed(6) + ',';
    }
    return { ok: true, value: fnv1a(sig) };
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
}`;

export const FINGERPRINT_CODE: Record<FpKind, string> = {
  canvas: CANVAS_JS,
  webgl: WEBGL_JS,
  audio: AUDIO_JS,
};

/** 运行三类指纹 (并发); 音频为异步 */
export async function runAllFingerprints(): Promise<Record<FpKind, FpResult>> {
  const [audio] = await Promise.all([runAudioFingerprint()]);
  return {
    canvas: runCanvasFingerprint(),
    webgl: runWebglFingerprint(),
    audio,
  };
}
