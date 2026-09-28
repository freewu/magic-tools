// 节拍器: Web Audio 精准打点 (lookahead 调度) + 全屏闪烁点 + 拍点指示
// 说明: 打点音全部本地合成 (OscillatorNode + 增益包络), 不加载任何音频文件
import {
  Button, Card, Divider, InputNumber, Segmented, Select, Slider, Space, Switch, Tooltip, message,
} from 'antd';
import {
  FullscreenExitOutlined, FullscreenOutlined, MinusOutlined, PauseCircleOutlined,
  PlayCircleOutlined, PlusOutlined, SaveOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from '../../hook/locale-context';
import {
  BEAT_PRESETS, BEATS_MAX, BEATS_MIN, BPM_MAX, BPM_MIN, BPM_STEP, CLOCK_INTERVAL_MS, FLASH_COLOR,
  FLASH_MS, SCHEDULE_AHEAD_SEC, SCHEDULE_INTERVAL_MS, STAGE_BG, STAGE_DOT_IDLE,
  START_DELAY_SEC, SUBDIVISION_OPTIONS, TEMPO_PRESETS, TIMBRE_KEYS, TIMBRES, TONE_FREQ, TONE_GAIN,
  VOLUME_MAX, VOLUME_MIN, type TimbreKey,
} from './data';
import {
  beatInfoAt, clampBpm, collectTickTimes, formatClock, getDefaultOptions, isSameOptions,
  isSliderTarget, isToggleKey, isTypingTarget, normalizeOptions, setDefaultOptions, tapTempo,
  tempoTerm, tickIntervalSec, type BeatKind, type MetronomeOptions,
} from './lib';
import { u, uT } from './lang';
import MetronomeIntro from './intro';

/** 音色文案 (key 与 data.ts 的 TIMBRES 对应) */
const TIMBRE_TEXT: Record<TimbreKey, string> = {
  click: '电子嘀嗒',
  beep: '正弦蜂鸣',
  wood: '木鱼',
};

// 舞台样式: 用类名表达状态 (闪烁 / 全屏), 便于测试断言, 也避免内联样式写大量过渡
const STAGE_CSS = `
.mt-stage { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: space-between; gap: 10px; height: 300px; padding: 14px; border-radius: 8px; overflow: hidden; transition: background 90ms linear; }
.mt-stage.mt-full { position: fixed; inset: 0; z-index: 1000; height: auto; border-radius: 0; }
.mt-stage-top { display: flex; flex-direction: column; align-items: center; gap: 4px; width: 100%; color: #8a8f98; font-size: 12px; }
.mt-stage-tempo { color: #e6e8eb; font-size: 20px; font-weight: 600; letter-spacing: 0.5px; }
.mt-stage-hint { text-align: center; }
.mt-dot { width: 120px; height: 120px; border-radius: 50%; cursor: pointer; transition: background 60ms linear, opacity 60ms linear, transform 60ms ease-out; }
.mt-dot-accent { transform: scale(1.08); }
.mt-stage.mt-full .mt-dot { width: min(52vh, 52vw); height: min(52vh, 52vw); }
.mt-stage-bottom { display: flex; flex-direction: column; align-items: center; gap: 8px; color: #8a8f98; font-size: 12px; }
.mt-beats { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: center; }
.mt-beat { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.18); transition: background 60ms linear, transform 60ms linear; }
.mt-beat-on { background: #1677ff; transform: scale(1.35); }
.mt-beat-on.mt-beat-accent { background: #ff4d4f; }
.mt-beat-on.mt-beat-sub { background: #8c8c8c; transform: scale(1.1); }
.mt-ctrl { display: flex; flex-direction: column; gap: 12px; }
.mt-field { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.mt-label { color: #888; white-space: nowrap; }
.mt-hint { color: #999; font-size: 12px; }
`;

/** 全屏 API 在部分内嵌 webview / 老浏览器上不存在, 统一按可选处理 */
type FullscreenElement = HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

/** AudioContext 构造器 (老浏览器带 webkit 前缀) */
type AudioCtor = new () => AudioContext;
const audioCtor = (): AudioCtor | null => {
  const w = window as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
};

/** 打出一次节拍音: 振荡器 + 指数衰减包络 (0 值不能作为指数目标, 故用 0.0001 近似静音) */
const playClick = (
  ctx: AudioContext,
  time: number,
  kind: BeatKind,
  options: MetronomeOptions
): void => {
  const spec = TIMBRES[options.timbre];
  const level = Math.min(1, (options.volume / 100) * TONE_GAIN[kind]);
  if (level <= 0) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = spec.type;
  osc.frequency.setValueAtTime(TONE_FREQ[kind], time);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, level), time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + spec.decay);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + spec.decay + 0.02);
};

/** 闪烁时舞台背景的染色 (整屏闪烁的强度刻意压低, 避免刺眼) */
const bgTint = (kind: BeatKind): string => {
  if (kind === 'accent') return 'rgba(255,77,79,0.16)';
  if (kind === 'beat') return 'rgba(22,119,255,0.14)';
  return 'rgba(140,140,140,0.10)';
};

const Metronome: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tt = (zh: string, vars?: Record<string, string | number>) => uT(locale, zh, vars);

  // 打开时按保存的默认设置初始化 (默认设置可在 设置中心 或本页「保存为默认设置」中修改)
  const [ opts, setOpts ] = useState<MetronomeOptions>(() => getDefaultOptions());
  /** 已保存的默认设置: 与当前参数不一致时「保存为默认设置」才可点 */
  const [ defaults, setDefaults ] = useState<MetronomeOptions>(() => getDefaultOptions());
  const [ running, setRunning ] = useState(false);
  /** 当前正在闪烁的打点 (null = 处于静默状态) */
  const [ flash, setFlash ] = useState<{ kind: BeatKind; index: number } | null>(null);
  const [ elapsed, setElapsed ] = useState(0);
  const [ taps, setTaps ] = useState(0);
  const [ flashBg, setFlashBg ] = useState(true);
  const [ full, setFull ] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const runningRef = useRef(false);
  /** 下一次打点的 AudioContext 时刻 (秒) */
  const nextTimeRef = useRef(0);
  /** 已排期的打点总数 (闪烁序号) */
  const tickRef = useRef(0);
  const timeoutsRef = useRef<number[]>([]);
  const offTimerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const tapsRef = useRef<number[]>([]);
  /** 调度器每次读取最新参数 (音量 / 音色 / 拍号中途修改立即生效) */
  const optsRef = useRef(opts);
  optsRef.current = opts;
  /** 打点间隔 (秒): 与渲染同步刷新, 中途变速无需重启调度器 */
  const intervalRef = useRef(tickIntervalSec(opts.bpm, opts.subdivision));
  intervalRef.current = tickIntervalSec(opts.bpm, opts.subdivision);

  const patch = useCallback((p: Partial<MetronomeOptions>) => {
    setOpts((cur) => normalizeOptions({ ...cur, ...p }));
  }, []);

  /** 清掉所有已排期的视觉闪烁 (停止 / 卸载时调用) */
  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutsRef.current = [];
    if (offTimerRef.current !== null) {
      window.clearTimeout(offTimerRef.current);
      offTimerRef.current = null;
    }
  }, []);

  /** 让大圆点闪一下 (FLASH_MS 后自动回到静默态) */
  const flashAt = useCallback((kind: BeatKind, index: number) => {
    setFlash({ kind, index });
    if (offTimerRef.current !== null) window.clearTimeout(offTimerRef.current);
    offTimerRef.current = window.setTimeout(() => {
      offTimerRef.current = null;
      setFlash(null);
    }, FLASH_MS);
  }, []);

  /** 音频先排期, 视觉按同一时刻延迟触发 (两者共用 AudioContext 时钟, 不会漂移) */
  const scheduleFlash = useCallback(
    (ctx: AudioContext, time: number, kind: BeatKind, index: number) => {
      const delay = Math.max(0, (time - ctx.currentTime) * 1000);
      const id = window.setTimeout(() => flashAt(kind, index), delay);
      timeoutsRef.current.push(id);
    },
    [ flashAt ]
  );

  /** 调度一轮: 把未来 SCHEDULE_AHEAD_SEC 内的打点排进 Web Audio 队列 */
  const schedule = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const { times, nextTime } = collectTickTimes(
      nextTimeRef.current,
      intervalRef.current,
      ctx.currentTime + SCHEDULE_AHEAD_SEC
    );
    const cur = optsRef.current;
    times.forEach((time, i) => {
      const index = tickRef.current + i;
      const info = beatInfoAt(index, cur.beats, cur.subdivision, cur.accent);
      playClick(ctx, time, info.kind, cur);
      scheduleFlash(ctx, time, info.kind, index);
    });
    tickRef.current += times.length;
    nextTimeRef.current = nextTime;
  }, [ scheduleFlash ]);

  const stop = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    setFlash(null);
    clearTimeouts();
  }, [ clearTimeouts ]);

  const start = useCallback(async () => {
    if (runningRef.current) return;
    const Ctor = audioCtor();
    if (!Ctor) {
      message.warning(t('当前浏览器不支持 Web Audio, 无法播放节拍音'));
      return;
    }
    let ctx = ctxRef.current;
    if (!ctx || ctx.state === 'closed') {
      try {
        ctx = new Ctor();
      } catch {
        message.warning(t('当前浏览器不支持 Web Audio, 无法播放节拍音'));
        return;
      }
      ctxRef.current = ctx;
    }
    try {
      if (ctx.state === 'suspended') await ctx.resume();
    } catch {
      /* 忽略: 下面统一按状态提示 */
    }
    if (ctx.state !== 'running') {
      message.warning(t('音频被浏览器挂起, 请再次点击「开始」'));
      return;
    }
    tickRef.current = 0;
    setFlash(null);
    setElapsed(0);
    startedAtRef.current = Date.now();
    nextTimeRef.current = ctx.currentTime + START_DELAY_SEC;
    runningRef.current = true;
    setRunning(true);
  }, [ t ]);

  const toggle = useCallback(() => {
    if (runningRef.current) stop();
    else void start();
  }, [ start, stop ]);

  // 调度循环: 开始后每 SCHEDULE_INTERVAL_MS 排期一次 (变速改的是 intervalRef, 立即生效)
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(schedule, SCHEDULE_INTERVAL_MS);
    schedule();
    return () => window.clearInterval(id);
  }, [ running, schedule ]);

  // 已播放时长
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(
      () => setElapsed((Date.now() - startedAtRef.current) / 1000),
      CLOCK_INTERVAL_MS
    );
    return () => window.clearInterval(id);
  }, [ running ]);

  // 卸载: 停掉调度与音频上下文
  useEffect(() => () => {
    runningRef.current = false;
    clearTimeouts();
    void ctxRef.current?.close().catch(() => undefined);
  }, [ clearTimeouts ]);

  // ---- 全屏: 先请求原生全屏, 失败 (内嵌 webview / 非用户手势) 时用窗口内全屏兜底 ----
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

  useEffect(() => {
    const onChange = () => { if (!document.fullscreenElement) setFull(false); };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // 快捷键: 空格 开始/停止, ↑↓ 调速 (Shift 加速 ±10), Esc 退出窗口内全屏
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = isTypingTarget(el);
      const onSlider = isSliderTarget(el);
      if (isToggleKey(e) && (!typing || running || full)) {
        e.preventDefault();
        toggle();
        return;
      }
      if ((typing || onSlider) && !full) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const step = (e.shiftKey ? 10 : BPM_STEP) * (e.key === 'ArrowUp' ? 1 : -1);
        patch({ bpm: clampBpm(opts.bpm + step) });
        return;
      }
      if (e.key === 'Escape' && full && !document.fullscreenElement) exitFull();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [ toggle, running, full, opts.bpm, patch, exitFull ]);

  // ---- 连击测速: 连续点击求平均, 间隔过长自动重新开始 ----
  const onTap = () => {
    const { taps: next, bpm } = tapTempo(tapsRef.current, Date.now());
    tapsRef.current = next;
    setTaps(next.length);
    if (bpm !== null) patch({ bpm });
  };

  const resetTap = () => {
    tapsRef.current = [];
    setTaps(0);
  };

  const saveDefaults = () => {
    const saved = setDefaultOptions(opts);
    setDefaults(saved);
    message.success(t('已保存为默认设置'));
  };

  const dirty = !isSameOptions(opts, defaults);
  const cur = flash ? beatInfoAt(flash.index, opts.beats, opts.subdivision, opts.accent) : null;
  const played = flash ? flash.index + 1 : 0;
  const stageBg = flashBg && flash ? bgTint(flash.kind) : STAGE_BG;

  const beatsOptions = useMemo(
    () => Array.from({ length: BEATS_MAX - BEATS_MIN + 1 }, (_, i) => BEATS_MIN + i)
      .map((n) => ({ value: n, label: tt('{n} 拍 / 小节', { n }) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ locale ]
  );
  const subdivisionOptions = useMemo(
    () => SUBDIVISION_OPTIONS.map((n) => ({ value: n, label: n === 1 ? t('不细分') : tt('{n} 连音', { n }) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ locale ]
  );
  const timbreOptions = useMemo(
    () => TIMBRE_KEYS.map((k) => ({ value: k, label: t(TIMBRE_TEXT[k]) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ locale ]
  );

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <style>{STAGE_CSS}</style>

      <Card
        size="small"
        title={t('节拍器')}
        extra={
          <Space size={8}>
            <Button
              size="small"
              type={running ? 'default' : 'primary'}
              icon={running ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={toggle}
            >{t(running ? '停止' : '开始')}</Button>
            <Tooltip title={t('把当前参数记为默认值 (下次打开时沿用)')}>
              <Button size="small" icon={<SaveOutlined />} disabled={!dirty} onClick={saveDefaults}>
                {t('保存为默认设置')}
              </Button>
            </Tooltip>
            <Button
              size="small"
              icon={full ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={full ? exitFull : enterFull}
            >{t(full ? '退出全屏' : '全屏')}</Button>
          </Space>
        }
      >
        <div className="mt-ctrl">
          <div className="mt-field">
            <span className="mt-label">{t('速度 (BPM)')}</span>
            <Slider
              min={BPM_MIN}
              max={BPM_MAX}
              step={BPM_STEP}
              value={opts.bpm}
              onChange={(v) => patch({ bpm: v })}
              style={{ flex: '1 1 160px', minWidth: 140, margin: 0 }}
            />
            <InputNumber
              size="small"
              min={BPM_MIN}
              max={BPM_MAX}
              value={opts.bpm}
              onChange={(v) => patch({ bpm: clampBpm(v) })}
              style={{ width: 78 }}
            />
            <Button size="small" icon={<MinusOutlined />} onClick={() => patch({ bpm: clampBpm(opts.bpm - BPM_STEP) })} />
            <Button size="small" icon={<PlusOutlined />} onClick={() => patch({ bpm: clampBpm(opts.bpm + BPM_STEP) })} />
            <Button size="small" type="primary" ghost icon={<ThunderboltOutlined />} onClick={onTap}>
              {t('连击测速')}
            </Button>
            <span className="mt-hint">
              {taps >= 2 ? tt('已取样 {n} 次', { n: taps }) : t('点击此处测速 (至少 2 次)')}
            </span>
            {taps > 0 && <Button size="small" type="text" onClick={resetTap}>{t('重置')}</Button>}
          </div>

          <div className="mt-field">
            <span className="mt-label">{t('常用速度')}</span>
            <Space size={4} wrap>
              {TEMPO_PRESETS.map((p) => (
                <Button
                  key={p.bpm}
                  size="small"
                  type={opts.bpm === p.bpm ? 'primary' : 'default'}
                  onClick={() => patch({ bpm: p.bpm })}
                >{p.label}</Button>
              ))}
            </Space>
          </div>

          <div className="mt-field">
            <span className="mt-label">{t('拍号')}</span>
            <Select
              size="small"
              value={opts.beats}
              style={{ width: 132 }}
              onChange={(v) => patch({ beats: v })}
              options={beatsOptions}
            />
            <Space size={4} wrap>
              {BEAT_PRESETS.map((p) => (
                <Button
                  key={p.label}
                  size="small"
                  type={opts.beats === p.beats ? 'primary' : 'default'}
                  onClick={() => patch({ beats: p.beats })}
                >{p.label}</Button>
              ))}
            </Space>
          </div>

          <div className="mt-field">
            <span className="mt-label">{t('细分')}</span>
            <Segmented
              size="small"
              value={opts.subdivision}
              onChange={(v) => patch({ subdivision: Number(v) })}
              options={subdivisionOptions}
            />
            <span className="mt-label">{t('音色')}</span>
            <Select
              size="small"
              value={opts.timbre}
              style={{ width: 132 }}
              onChange={(v) => patch({ timbre: v })}
              options={timbreOptions}
            />
            <span className="mt-label">{t('音量')}</span>
            <Slider
              min={VOLUME_MIN}
              max={VOLUME_MAX}
              value={opts.volume}
              onChange={(v) => patch({ volume: v })}
              style={{ width: 150, margin: 0 }}
            />
            <Switch size="small" checked={opts.accent} onChange={(v) => patch({ accent: v })} />
            <span>{t('首拍重音')}</span>
            <Switch size="small" checked={flashBg} onChange={setFlashBg} />
            <span>{t('背景闪烁')}</span>
          </div>
        </div>
      </Card>

      <div
        ref={stageRef}
        className={`mt-stage${full ? ' mt-full' : ''}`}
        style={{ background: stageBg }}
        title={t('点击圆点也可以开始 / 停止')}
      >
        <div className="mt-stage-top">
          <span className="mt-stage-tempo">
            {tt('{bpm} BPM · {term}', { bpm: opts.bpm, term: tempoTerm(opts.bpm) })}
          </span>
          <span className="mt-stage-hint">
            {running ? tt('第 {bar} 小节 · 第 {beat} 拍', { bar: (cur?.bar ?? 0) + 1, beat: (cur?.beat ?? 0) + 1 })
              : t('点击「开始」后这里会跟着节拍闪烁')}
            {full ? ` · ${t('按 Esc 退出全屏')}` : ''}
          </span>
        </div>

        <div
          className={`mt-dot${flash ? ` mt-dot-${flash.kind}` : ''}`}
          style={{ background: flash ? FLASH_COLOR[flash.kind] : STAGE_DOT_IDLE, opacity: flash ? 1 : 0.35 }}
          onClick={toggle}
        />

        <div className="mt-stage-bottom">
          <div className="mt-beats">
            {Array.from({ length: opts.beats }, (_, i) => {
              const on = cur !== null && cur.beat === i;
              const mark = on
                ? cur.kind === 'accent' ? ' mt-beat-on mt-beat-accent'
                  : cur.kind === 'sub' ? ' mt-beat-on mt-beat-sub' : ' mt-beat-on'
                : '';
              return <span key={i} className={`mt-beat${mark}`} />;
            })}
          </div>
          <span className="mt-stage-clock">
            {running
              ? tt('已播放 {t} · {n} 拍', { t: formatClock(elapsed), n: played })
              : t('点击「开始」后这里会跟着节拍闪烁')}
          </span>
        </div>
      </div>

      <Divider>{t(' 节拍器说明 ')}</Divider>
      <MetronomeIntro />
    </Space>
  );
};

export default Metronome;
