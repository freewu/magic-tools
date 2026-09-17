// 提词器内置口令彩蛋: 稿件内容正好是口令时, 点「开始」不滚动, 而是铺一层「应用名雨」
// 实现: 口令与载荷都以 base64 存放; 命中后 atob 解码, 再以「注入内联 <script>」的方式执行载荷
//       (内联脚本由 CSP 的 'unsafe-inline' 放行, 无需 'unsafe-eval', 严格策略下也能跑)
// 约束: 载荷保持纯 ASCII (否则 atob 解出的 UTF-8 会乱码); 应用名列表由组件注入, 载荷内不含任何业务文案

/** 口令 (base64) */
const EGG_KEY_B64 = 'Ymx1ZWZyb2c=';

/** 载荷 (base64): 解码后是一个函数表达式, 调用后返回「退出」函数 */
const EGG_CODE_B64 =
  'KGZ1bmN0aW9uIChjdHgpIHsKICB2YXIgZG9jID0gY3R4LmRvYywgd2luID0gY3R4LndpbiwgaG9zdCA9IGN0eC5ob3N0LCByYWYgPSBjdHgucmFmLCBjYWYgPSBjdHguY2FmOwogIHZhciBuYW1lcyA9IFtdLCByYXcgPSBjdHgubmFtZXMgfHwgW10sIGk7CiAgZm9yIChpID0gMDsgaSA8IHJhdy5sZW5ndGg7IGkrKykgewogICAgdmFyIHMgPSBTdHJpbmcocmF3W2ldID09IG51bGwgPyAnJyA6IHJhd1tpXSkucmVwbGFjZSgvXHMrL2csICcgJykudHJpbSgpOwogICAgaWYgKHMgJiYgbmFtZXMuaW5kZXhPZihzKSA8IDApIG5hbWVzLnB1c2gocyk7CiAgfQogIGlmICghbmFtZXMubGVuZ3RoKSBuYW1lcy5wdXNoKCdNYWdpY1Rvb2xzJyk7CiAgdmFyIGNhbnZhcyA9IGRvYy5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTsKICBjYW52YXMuY2xhc3NOYW1lID0gJ3RwLWVnZy1jYW52YXMnOwogIGNhbnZhcy5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTsKICBjYW52YXMuc3R5bGUucG9zaXRpb24gPSAnZml4ZWQnOwogIGNhbnZhcy5zdHlsZS5sZWZ0ID0gJzAnOwogIGNhbnZhcy5zdHlsZS50b3AgPSAnMCc7CiAgY2FudmFzLnN0eWxlLndpZHRoID0gJzEwMCUnOwogIGNhbnZhcy5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7CiAgY2FudmFzLnN0eWxlLnpJbmRleCA9ICcyMTQ3NDgzMDAwJzsKICBjYW52YXMuc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInOwogIGNhbnZhcy5zdHlsZS5iYWNrZ3JvdW5kID0gJ3JnYmEoMiw4LDQsMC45NCknOwogIGhvc3QuYXBwZW5kQ2hpbGQoY2FudmFzKTsKICB2YXIgZyA9IGNhbnZhcy5nZXRDb250ZXh0ID8gY2FudmFzLmdldENvbnRleHQoJzJkJykgOiBudWxsOwogIHZhciBkb25lID0gZmFsc2UsIHJhZklkID0gMCwgY29scyA9IDAsIHJvd3MgPSAwLCBjb2xXID0gMCwgcm93SCA9IDAsIGRyb3BzID0gW107CiAgLy8gZmFsbGluZyByYXRlOiBhZHZhbmNlIG9uZSByb3cgZXZlcnkgU1RFUF9NUyBtcyAodGltZSBiYXNlZCwgcmVmcmVzaC1yYXRlIGluZGVwZW5kZW50KQogIHZhciBTVEVQX01TID0gOTAsIGxhc3QgPSAwLCBhY2MgPSAwOwogIHZhciBybmQgPSBmdW5jdGlvbiAobikgeyByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbik7IH07CiAgdmFyIGZpdCA9IGZ1bmN0aW9uICgpIHsKICAgIHZhciBkcHIgPSB3aW4uZGV2aWNlUGl4ZWxSYXRpbyA+IDIgPyAyIDogd2luLmRldmljZVBpeGVsUmF0aW8gfHwgMTsKICAgIHZhciB3ID0gTWF0aC5tYXgoMzIwLCBob3N0LmNsaWVudFdpZHRoIHx8IHdpbi5pbm5lcldpZHRoIHx8IDEwMjQpOwogICAgdmFyIGggPSBNYXRoLm1heCgyNDAsIGhvc3QuY2xpZW50SGVpZ2h0IHx8IHdpbi5pbm5lckhlaWdodCB8fCA3NjgpOwogICAgY2FudmFzLndpZHRoID0gTWF0aC5mbG9vcih3ICogZHByKTsKICAgIGNhbnZhcy5oZWlnaHQgPSBNYXRoLmZsb29yKGggKiBkcHIpOwogICAgY29sVyA9IE1hdGguZmxvb3IoMjIgKiBkcHIpOwogICAgcm93SCA9IE1hdGguZmxvb3IoMjAgKiBkcHIpOwogICAgY29scyA9IE1hdGgubWF4KDEsIE1hdGguZmxvb3IoY2FudmFzLndpZHRoIC8gY29sVykpOwogICAgcm93cyA9IE1hdGgubWF4KDEsIE1hdGguZmxvb3IoY2FudmFzLmhlaWdodCAvIHJvd0gpKSArIDE7CiAgICBkcm9wcyA9IFtdOwogICAgZm9yICh2YXIgYyA9IDA7IGMgPCBjb2xzOyBjKyspIGRyb3BzLnB1c2goeyB5OiAtcm5kKHJvd3MpLCBwOiBuYW1lc1tybmQobmFtZXMubGVuZ3RoKV0gfSk7CiAgICBnLmZvbnQgPSBNYXRoLmZsb29yKDE2ICogZHByKSArICdweCB1aS1tb25vc3BhY2UsQ29uc29sYXMsbW9ub3NwYWNlJzsKICAgIGcudGV4dEJhc2VsaW5lID0gJ3RvcCc7CiAgfTsKICB2YXIgc3RlcCA9IGZ1bmN0aW9uICh0KSB7CiAgICBpZiAoZG9uZSkgcmV0dXJuOwogICAgdmFyIG5vdyA9ICh0eXBlb2YgdCA9PT0gJ251bWJlcicgJiYgdCA+IDApID8gdAogICAgICA6ICh3aW4ucGVyZm9ybWFuY2UgJiYgd2luLnBlcmZvcm1hbmNlLm5vdyA/IHdpbi5wZXJmb3JtYW5jZS5ub3coKSA6IERhdGUubm93KCkpOwogICAgaWYgKCFsYXN0KSBsYXN0ID0gbm93OyAvLyBmaXJzdCBmcmFtZSBvbmx5IHJlY29yZHMgdGhlIHRpbWUKICAgIGFjYyArPSBub3cgLSBsYXN0OwogICAgbGFzdCA9IG5vdzsKICAgIGlmIChhY2MgPiBTVEVQX01TICogNCkgYWNjID0gU1RFUF9NUzsgLy8gYWZ0ZXIgYSBsb25nIHN0YWxsIC8gaGlkZGVuIHRhYjogc2tpcCwgZG8gbm90IGNhdGNoIHVwCiAgICBpZiAoYWNjID49IFNURVBfTVMpIHsKICAgICAgYWNjID0gYWNjID49IFNURVBfTVMgKiAyID8gMCA6IGFjYyAtIFNURVBfTVM7IC8vIGF0IG1vc3Qgb25lIHJvdyBwZXIgZnJhbWUKICAgICAgZy5maWxsU3R5bGUgPSAncmdiYSgyLDgsNCwwLjE2KSc7CiAgICAgIGcuZmlsbFJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTsKICAgICAgZm9yICh2YXIgYyA9IDA7IGMgPCBjb2xzOyBjKyspIHsKICAgICAgICB2YXIgZCA9IGRyb3BzW2NdLCB4ID0gYyAqIGNvbFcgKyA0OwogICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgZC5wLmxlbmd0aDsgaysrKSB7CiAgICAgICAgICB2YXIgeSA9IChkLnkgKyBrKSAqIHJvd0g7CiAgICAgICAgICBpZiAoeSA8IC1yb3dIIHx8IHkgPiBjYW52YXMuaGVpZ2h0KSBjb250aW51ZTsKICAgICAgICAgIGcuZmlsbFN0eWxlID0gayA9PT0gMCA/ICcjZWFmZmYyJyA6IGsgPCAzID8gJyM3ZGZmYTgnIDogJ3JnYmEoMCwyMjUsMTIwLDAuNSknOwogICAgICAgICAgZy5maWxsVGV4dChkLnAuY2hhckF0KGspLCB4LCB5KTsKICAgICAgICB9CiAgICAgICAgZC55ICs9IDE7CiAgICAgICAgaWYgKChkLnkgLSBkLnAubGVuZ3RoKSAqIHJvd0ggPiBjYW52YXMuaGVpZ2h0KSB7IGQueSA9IC1ybmQocm93cyk7IGQucCA9IG5hbWVzW3JuZChuYW1lcy5sZW5ndGgpXTsgfQogICAgICB9CiAgICB9CiAgICByYWZJZCA9IHJhZihzdGVwKTsKICB9OwogIHZhciBvbktleSA9IGZ1bmN0aW9uIChlKSB7IGlmIChlICYmIChlLmtleSA9PT0gJ0VzY2FwZScgfHwgZS5rZXkgPT09ICcgJykpIHN0b3AoKTsgfTsKICBmdW5jdGlvbiBzdG9wKCkgewogICAgaWYgKGRvbmUpIHJldHVybjsKICAgIGRvbmUgPSB0cnVlOwogICAgaWYgKHJhZklkICYmIGNhZikgY2FmKHJhZklkKTsKICAgIHdpbi5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgb25LZXkpOwogICAgd2luLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGZpdCk7CiAgICBjYW52YXMucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzdG9wKTsKICAgIGlmIChjYW52YXMucGFyZW50Tm9kZSkgY2FudmFzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoY2FudmFzKTsKICAgIGlmIChjdHguZG9uZSkgY3R4LmRvbmUoKTsKICB9CiAgaWYgKCFnKSB7IGlmIChjYW52YXMucGFyZW50Tm9kZSkgY2FudmFzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoY2FudmFzKTsgcmV0dXJuIHN0b3A7IH0KICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzdG9wKTsKICB3aW4uYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9uS2V5KTsKICB3aW4uYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgZml0KTsKICBmaXQoKTsKICByYWZJZCA9IHJhZihzdGVwKTsKICByZXR1cm4gc3RvcDsKfSkK';

/** 载荷运行环境 (由组件注入; 载荷本身不依赖模块作用域) */
export interface EggEnv {
  /** 浏览器窗口 (取 devicePixelRatio / 尺寸 / 事件) */
  win: Window;
  doc: Document;
  /** 画布挂载到哪个元素上 (全屏时挂全屏元素, 否则 body) */
  host: HTMLElement;
  /** 雨滴字符来源: 应用中心里的全部应用名 */
  names: string[];
  raf: (cb: FrameRequestCallback) => number;
  caf: (id: number) => void;
  /** 退出 (点画布 / Esc / 主动停止) 时回调 */
  done?: () => void;
}

/** 注入执行时用来传递入参 / 回传退出函数的全局槽位 (执行后立即清理) */
const EGG_SLOT = '__mtTpEffect';

/** 口令原文 (仅供内部判断与测试) */
export const eggKey = (): string => atob(EGG_KEY_B64);

/** 稿件是否为口令稿 (忽略首尾空白与大小写) */
export const matchesEggKey = (text: string): boolean =>
  String(text ?? '').trim().toLowerCase() === eggKey();

/**
 * 注入执行载荷, 返回退出函数
 * 注入一段内联 <script>: 插入文档即同步执行 (不用 eval, 不依赖 'unsafe-eval')
 * 入参经全局槽位传给载荷, 退出函数再由载荷写回槽位; 解码 / 执行失败时安静退出并在控制台留一条提示
 */
export const startEgg = (env: EggEnv): (() => void) => {
  const slot: { env?: EggEnv; stop?: () => void } = { env };
  const g = globalThis as unknown as Record<string, unknown>;
  const holder = g[EGG_SLOT] as typeof slot | undefined;
  g[EGG_SLOT] = slot;
  try {
    // 解码后是一个函数表达式: `(function (ctx) { … })`
    const code = atob(EGG_CODE_B64);
    const script = env.doc.createElement('script');
    script.textContent = `globalThis.${EGG_SLOT}.stop=(${code})(globalThis.${EGG_SLOT}.env);`;
    (env.doc.head ?? env.doc.body).appendChild(script); // 内联脚本插入即同步执行
    script.remove();
  } catch (err) {
    console.warn('[teleprompter] effect unavailable:', err);
  } finally {
    delete slot.env; // 不长期持有组件与 DOM 引用
    if (holder) g[EGG_SLOT] = holder;
    else delete g[EGG_SLOT];
  }
  return slot.stop ?? (() => undefined);
};
