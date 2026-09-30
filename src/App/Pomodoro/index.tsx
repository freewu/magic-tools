// 番茄时钟: 专注/短休/长休 轮换计时 · 完成提示音 (Web Audio 本地合成或自定义音频) · 可选系统通知
// 说明: 计时按「截止时刻」推算, 不依赖 setInterval 累积, 切后台/卡顿回来不会跑偏
import {
  Button, Card, ColorPicker, Divider, InputNumber, message, Select, Slider, Space, Switch, Tooltip, Typography,
} from 'antd';
import {
  ClockCircleOutlined, FullscreenExitOutlined, FullscreenOutlined, PauseCircleOutlined,
  PlayCircleOutlined, ReloadOutlined, RightOutlined, SaveOutlined, UploadOutlined,
} from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from '../../hook/locale-context';
import {
  BACKGROUND_PRESETS, PHASE_KEYS, SOUND_KEYS, SOUND_PATTERNS, TICK_MS, type PhaseKey, type SoundKey,
} from './data';
import {
  formatClock, getDefaultOptions, isSameOptions, normalizeOptions, remainingOf, setDefaultOptions,
  type PomodoroOptions,
} from './lib';
import { u, uT } from './lang';
import PomodoroIntro from './intro';

const { Text } = Typography;

/** AudioContext 构造器 (老浏览器带 webkit 前缀) */
type AudioCtor = new () => AudioContext;
const audioCtor = (): AudioCtor | null => {
  const w = window as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
};

// 舞台样式: 全屏时 position:fixed 铺满窗口 (原生全屏失败的窗口内全屏兜底)
const STAGE_CSS = `
.pt-stage-full { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 18px; }
.pt-stage-full .pt-clock-num { font-size: 140px; }
.pt-stage-full .pt-phase { font-size: 22px; }
.pt-stage { border-radius: 12px; color: #f2f3f5; }
.pt-stage .pt-phase { color: rgba(255,255,255,0.72); }
`;
type FullscreenElement = HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

/** 阶段完成通知: 桌面端 (Tauri) 使用系统弹窗 (tauri-plugin-notification),
 *   Web 端回退浏览器 Notification API; 无权限 / 被拒绝时返回 false (调用方降级为页面内提示) */
const requestNotify = async (title: string, body: string): Promise<boolean> => {
  if (typeof window !== 'undefined' && '__TAURI__' in window) {
    try {
      const { isPermissionGranted, requestPermission, sendNotification } =
        await import('@tauri-apps/plugin-notification');
      let granted = await isPermissionGranted();
      if (!granted) {
        granted = (await requestPermission()) === 'granted';
      }
      if (granted) {
        sendNotification({ title, body });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
  if (typeof Notification === 'undefined') return false;
  try {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
      return true;
    }
    if (Notification.permission === 'denied') return false;
    const permission: string = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification(title, { body });
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

const Pomodoro: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { locale } = useLocale();

  // ---- 全屏: 先请求原生全屏, 失败 (内嵌 webview / 非用户手势) 时用窗口内全屏兜底 ----
  const [ full, setFull ] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const enterFull = useCallback(() => {
    setFull(true);
    const el = stageRef.current as FullscreenElement | null;
    const request = el?.requestFullscreen?.bind(el) ?? el?.webkitRequestFullscreen?.bind(el);
    if (!request) return;
    try { Promise.resolve(request()).catch(() => undefined); } catch { /* 兜底 */ }
  }, []);
  const exitFull = useCallback(() => {
    setFull(false);
    const doc = document as FullscreenDocument;
    const active = doc.fullscreenElement ?? doc.webkitFullscreenElement;
    if (!active) return;
    try { Promise.resolve(doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.()).catch(() => undefined); } catch { /* 忽略 */ }
  }, []);
  useEffect(() => {
    const sync = () => { if (!document.fullscreenElement) setFull(false); };
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && full && !document.fullscreenElement) exitFull();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [ full, exitFull ]);
  const t = (zh: string) => u(locale, zh);
  const tt = (zh: string, vars?: Record<string, string | number>) => uT(locale, zh, vars);

  // 打开时按保存的默认设置初始化 (默认设置可在 设置中心 或本页修改)
  const [ opts, setOpts ] = useState<PomodoroOptions>(() => getDefaultOptions());
  const [ defaults, setDefaults ] = useState<PomodoroOptions>(() => getDefaultOptions());
  const [ phase, setPhase ] = useState<PhaseKey>('focus');
  const [ running, setRunning ] = useState(false);
  /** 本轮完成的专注数 (用于决定长休) */
  const [ doneRounds, setDoneRounds ] = useState(0);
  /** 当前阶段总秒数与剩余秒数 */
  const [ totalSec, setTotalSec ] = useState(25 * 60);
  const [ leftSec, setLeftSec ] = useState(25 * 60);
  /** 自定义音频 (仅本机会话内有效; 数据不上传) */
  const [ customAudio, setCustomAudio ] = useState<{ name: string; url: string } | null>(null);

  const deadlineRef = useRef(0);
  const timerRef = useRef(0);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const [ notice, contextHolder ] = message.useMessage();



  /** 当前阶段时长 (秒, 跟随参数) */
  const phaseTotal = useMemo(() => opts.workMinutes * 60, [ opts ]);

  /** 阶段文字标签 */
  const phaseLabel = phase === 'focus'
    ? tt('专注 {m} 分钟', { m: opts.workMinutes })
    : phase === 'short'
      ? tt('短休 {m} 分钟', { m: opts.shortMinutes })
      : tt('长休 {m} 分钟', { m: opts.longMinutes });

  // 手动切换阶段或改分钟数时刷新时长
  useEffect(() => {
    const total = (phase === 'focus' ? opts.workMinutes : phase === 'short' ? opts.shortMinutes : opts.longMinutes) * 60;
    setTotalSec(total);
    setLeftSec(remainingOf(deadlineRef.current, Date.now()) || total);
  }, [ phase, opts.workMinutes, opts.shortMinutes, opts.longMinutes ]);

  /** 合成播放一个内置音色 (支持重复 times 次, 每遍间隔 0.35s) */
  const playSynth = useCallback((sound: Exclude<SoundKey, 'custom'>, volume: number, times = 1) => {
    const Ctor = audioCtor();
    if (!Ctor || volume <= 0) return;
    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = Math.min(1, volume / 100);
    master.connect(ctx.destination);
    const pattern = SOUND_PATTERNS[sound] ?? [];
    const patternDur = pattern.reduce((m, n) => Math.max(m, n.at + n.dur), 0);
    let lastAt = 0;
    for (let i = 0; i < Math.max(1, times); i += 1) {
      const offset = i * (patternDur + 0.35);
      pattern.forEach((note) => {
        const at = note.at + offset;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = note.type;
        osc.frequency.value = note.freq;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + at);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, note.gain), ctx.currentTime + at + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + note.dur);
        osc.connect(gain);
        gain.connect(master);
        osc.start(ctx.currentTime + at);
        osc.stop(ctx.currentTime + at + note.dur + 0.05);
        lastAt = at + note.dur;
      });
    }
    window.setTimeout(() => { void ctx.close().catch(() => undefined); }, (lastAt + 0.5) * 1000);
  }, []);

  /** 播放完成提示音 (自定义音频优先, 否则内置合成; 按 repeatCount 重复) */
  const playSound = useCallback(() => {
    const cur = optsRef.current;
    const times = Math.max(1, cur.repeatCount);
    if (cur.sound === 'custom') {
      const url = customAudioRef.current?.url;
      if (!url) return;
      if (!audioElRef.current) audioElRef.current = new Audio();
      const el = audioElRef.current;
      el.src = url;
      el.volume = Math.min(1, cur.volume / 100);
      // 串行播放 times 次: 每次结束后再播, 播满后停止
      let played = 0;
      const replay = () => {
        played += 1;
        if (played >= times) { el.onended = null; return; }
        void el.play().catch(() => undefined);
      };
      el.onended = replay;
      void el.play().catch(() => undefined);
      return;
    }
    playSynth(cur.sound, cur.volume, times);
  }, [ playSynth ]);

  const customAudioRef = useRef<{ name: string; url: string } | null>(null);
  useEffect(() => { customAudioRef.current = customAudio; }, [ customAudio ]);

  /** 阶段结束: 提示音 + 可选通知 + 轮次推进 (+ 自动开始下一阶段) */
  const finishPhase = useCallback(async () => {
    setRunning(false);
    window.clearInterval(timerRef.current);
    playSound();

    let next: PhaseKey;
    let nextRounds = doneRoundsRef.current;
    if (phaseRef.current === 'focus') {
      // 完成一个专注: 满轮次进长休, 否则短休
      const full = optsRef.current.roundsBeforeLong;
      nextRounds = doneRoundsRef.current + 1;
      next = nextRounds >= full ? 'long' : 'short';
    } else {
      next = 'focus';
    }
    doneRoundsRef.current = nextRounds;
    setDoneRounds(nextRounds);

    // 通知 (可选)
    if (optsRef.current.notify) {
      const title = t('阶段结束提醒');
      const body = phaseRef.current === 'focus' ? t('该休息一下了 / 该开始专注了') : t('完成 {n} 个番茄, 进入长休息');
      const ok = await requestNotify(title, String(body.replace('{n}', String(nextRounds))));
      if (!ok) notice.info(body.replace('{n}', String(nextRounds)));
    }

    setPhase(next);
    if (optsRef.current.autoNext) {
      startPhase(next);
    } else {
      setRunning(false);
    }
  }, [ playSound, notice, t ]);

  const phaseRef = useRef<PhaseKey>('focus');
  useEffect(() => { phaseRef.current = phase; }, [ phase ]);
  const doneRoundsRef = useRef(0);
  useEffect(() => { doneRoundsRef.current = doneRounds; }, [ doneRounds ]);

  /** 从指定阶段开始计时 */
  const startPhase = useCallback((p: PhaseKey, resumeLeftSec?: number) => {
    const total = (p === 'focus' ? optsRef.current.workMinutes : p === 'short' ? optsRef.current.shortMinutes : optsRef.current.longMinutes) * 60;
    const remain = resumeLeftSec && resumeLeftSec > 0 ? resumeLeftSec : total;
    deadlineRef.current = Date.now() + remain * 1000;
    setTotalSec(total);
    setLeftSec(remain);
    setRunning(true);
  }, []);

  // 走动: 每 TICK_MS 刷新一次剩余 (由截止时刻推算)
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const left = remainingOf(deadlineRef.current, Date.now());
      setLeftSec(left);
      if (left <= 0) {
        window.clearInterval(id);
        void finishPhase();
      }
    }, TICK_MS);
    timerRef.current = id;
    return () => window.clearInterval(id);
  }, [ running, finishPhase ]);

  // 卸载清理
  useEffect(() => () => {
    window.clearInterval(timerRef.current);
    if (customAudio) URL.revokeObjectURL(customAudio.url);
    if (audioElRef.current) { audioElRef.current.pause(); }
  }, [ customAudio ]);

  const start = useCallback(() => {
    if (running) return;
    if (leftSec <= 0) { startPhase(phase); return; }
    // 从剩余继续 (暂停后恢复)
    deadlineRef.current = Date.now() + leftSec * 1000;
    setRunning(true);
  }, [ running, leftSec, phase, startPhase ]);

  const pause = useCallback(() => {
    setRunning(false);
    setLeftSec(remainingOf(deadlineRef.current, Date.now()));
  }, []);

  const reset = useCallback(() => {
    setRunning(false);
    deadlineRef.current = 0;
    setLeftSec((phase === 'focus' ? opts.workMinutes : phase === 'short' ? opts.shortMinutes : opts.longMinutes) * 60);
  }, [ phase, opts.workMinutes, opts.shortMinutes, opts.longMinutes ]);

  const switchPhase = useCallback((p: PhaseKey) => {
    setRunning(false);
    setPhase(p);
    const total = (p === 'focus' ? opts.workMinutes : p === 'short' ? opts.shortMinutes : opts.longMinutes) * 60;
    deadlineRef.current = 0;
    setTotalSec(total);
    setLeftSec(total);
  }, [ opts.workMinutes, opts.shortMinutes, opts.longMinutes ]);

  const patch = useCallback((next: Partial<PomodoroOptions>) => {
    setOpts((cur) => normalizeOptions({ ...cur, ...next }));
  }, []);

  const canSaveDefaults = !isSameOptions(opts, defaults);
  const saveDefaults = () => {
    setDefaults(setDefaultOptions(opts));
    notice.success(t('已保存为默认设置'));
  };

  /** 选择自定义音频文件 (仅本机) */
  const onPickAudio = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      notice.error(t('请选择音频文件…'));
      return;
    }
    setCustomAudio((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return { name: file.name, url: URL.createObjectURL(file) };
    });
    patch({ sound: 'custom' });
  };

  // 阶段进度: 已完成番茄 / 每轮圆点
  const dots = Array.from({ length: opts.roundsBeforeLong }, (_, i) => (
    <span
      key={i}
      style={{
        width: 12, height: 12, borderRadius: '50%', display: 'inline-block',
        background: i < doneRounds ? '#16a34a' : 'rgba(255,255,255,0.18)',
        marginRight: 6,
      }}
    />
  ));

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contextHolder}
      <style>{STAGE_CSS}</style>
      <Card
        size="small"
        title={<Space><ClockCircleOutlined />{t('番茄时钟')}</Space>}
        extra={
          <Space>
            <Tooltip title={t(full ? '退出全屏' : '全屏')}>
              <Button size="small" icon={full ? <FullscreenExitOutlined /> : <FullscreenOutlined />} onClick={full ? exitFull : enterFull}>
                {t(full ? '退出全屏' : '全屏')}
              </Button>
            </Tooltip>
            <Text type="secondary" style={{ fontSize: 12 }}>{running ? t('进行中') : t('已暂停')}</Text>
            <Tooltip title={t('把当前参数存为默认值, 下次打开时沿用; 也可在设置中心修改')}>
              <span style={{ display: 'inline-block' }}>
                <Button size="small" icon={<SaveOutlined />} disabled={!canSaveDefaults} onClick={saveDefaults}>
                  {t('保存为默认设置')}
                </Button>
              </span>
            </Tooltip>
          </Space>
        }
      >
        {/* 时钟主体 (全屏时固定铺满) */}
        <div ref={stageRef} className={full ? 'pt-stage-full' : 'pt-stage'} style={{ background: opts.background, color: '#f2f3f5', textAlign: 'center', padding: '16px 12px', borderRadius: full ? 0 : 12 }}>
          <div className="pt-phase" style={{ fontSize: 13, color: `${phase === 'focus' ? opts.workColor : opts.breakColor}b8`, marginBottom: 4 }}>
            {phaseLabel} · {tt('第 {n} 轮', { n: Math.min(doneRounds + 1, opts.roundsBeforeLong) })}
          </div>
          <div className="pt-clock-num" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', color: phase === 'focus' ? opts.workColor : opts.breakColor, fontSize: full ? 140 : 72, fontWeight: 700, lineHeight: 1.1 }}>
            {formatClock(leftSec)}
          </div>
          <div style={{ marginTop: 8 }}>{dots}</div>
          <Space size={12} style={{ marginTop: 16 }}>
            <Button type="primary" size="large" icon={running ? <PauseCircleOutlined /> : <PlayCircleOutlined />} onClick={running ? pause : start}>
              {running ? t('暂停') : t('开始')}
            </Button>
            <Button size="large" icon={<ReloadOutlined />} onClick={reset}>{t('重置')}</Button>
            <Button size="large" icon={<RightOutlined />} onClick={() => { setRunning(false); switchPhase(phase === 'focus' ? 'short' : 'focus'); }}>
              {t('跳过当前阶段')}
            </Button>
          </Space>
          <Space size={8} style={{ marginTop: 18 }}>
            {PHASE_KEYS.map((p) => (
              <Button key={p} size="small" type={phase === p ? 'primary' : 'default'} onClick={() => switchPhase(p)}>
                {p === 'focus' ? t('专注') : p === 'short' ? t('短休息') : t('长休息')}
              </Button>
            ))}
          </Space>
        </div>

        <Divider style={{ margin: '16px 0 12px' }} />

        {/* 参数配置 */}
        <Space size={24} wrap>
          <Space size={6}>
            <Text type="secondary" style={{ fontSize: 13 }}>{t('专注时长 (分钟)')}</Text>
            <InputNumber size="small" min={1} max={180} value={opts.workMinutes} onChange={(v) => patch({ workMinutes: Number(v) })} style={{ width: 70 }} />
          </Space>
          <Space size={6}>
            <Text type="secondary" style={{ fontSize: 13 }}>{t('短休息 (分钟)')}</Text>
            <InputNumber size="small" min={1} max={60} value={opts.shortMinutes} onChange={(v) => patch({ shortMinutes: Number(v) })} style={{ width: 64 }} />
          </Space>
          <Space size={6}>
            <Text type="secondary" style={{ fontSize: 13 }}>{t('长休息 (分钟)')}</Text>
            <InputNumber size="small" min={1} max={120} value={opts.longMinutes} onChange={(v) => patch({ longMinutes: Number(v) })} style={{ width: 64 }} />
          </Space>
          <Space size={6}>
            <Text type="secondary" style={{ fontSize: 13 }}>{t('每几个专注后长休')}</Text>
            <InputNumber size="small" min={1} max={12} value={opts.roundsBeforeLong} onChange={(v) => patch({ roundsBeforeLong: Number(v) })} style={{ width: 56 }} />
          </Space>
        </Space>

        <Space size={24} wrap style={{ marginTop: 14 }}>
          <Space size={6}>
            <Text type="secondary" style={{ fontSize: 13 }}>{t('完成提示音')}</Text>
            <Select
              size="small"
              value={opts.sound}
              style={{ width: 150 }}
              onChange={(v) => patch({ sound: v })}
              options={SOUND_KEYS.map((k) => ({
                value: k,
                label: k === 'ding' ? t('叮 — 清脆') : k === 'bell' ? t('钟声 — 悠长') : k === 'beep' ? t('哔哔哔 — 三连') : k === 'wood' ? t('木鱼 — 短促') : k === 'chime' ? t('风铃 — 清脆高音') : t('自定义音频'),
              }))}
            />
            <Space size={6}>
              <Text type="secondary" style={{ fontSize: 13 }}>{t('提示次数')}</Text>
              <Tooltip title={t('提示音重复播放次数 (1-5)')}>
                <InputNumber size="small" min={1} max={5} value={opts.repeatCount} onChange={(v) => patch({ repeatCount: Number(v) })} style={{ width: 56 }} />
              </Tooltip>
            </Space>
            {opts.sound === 'custom' && (
              <Tooltip title={t('音频文件仅本机播放, 不会上传')}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Button size="small" icon={<UploadOutlined />} onClick={() => fileInputRef.current?.click()}>
                    {customAudio ? t('更改音频文件') : t('选择音频文件…')}
                  </Button>
                  {customAudio && <Text type="secondary" style={{ fontSize: 12, maxWidth: 140 }} ellipsis>{customAudio.name}</Text>}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    style={{ display: 'none' }}
                    onChange={(e) => { onPickAudio(e.target.files?.[0]); e.target.value = ''; }}
                  />
                </span>
              </Tooltip>
            )}
          </Space>
          <Space size={6}>
            <Text type="secondary" style={{ fontSize: 13 }}>{t('音量')}</Text>
            <Slider min={0} max={100} value={opts.volume} onChange={(v) => patch({ volume: v })} style={{ width: 120, margin: 0 }} />
            <Text type="secondary" style={{ fontSize: 12 }}>{opts.volume}</Text>
          </Space>
          <Space size={6}>
            <Switch size="small" checked={opts.notify} onChange={(v) => patch({ notify: v })} />
            <Tooltip title={t('阶段完成时弹出系统通知; 权限被拒绝则在页面内提示')}>
              <Text type="secondary" style={{ fontSize: 13 }}>{t('完成时弹通知')}</Text>
            </Tooltip>
          </Space>
          <Space size={6}>
            <Text type="secondary" style={{ fontSize: 13 }}>{t('背景颜色')}</Text>
            <ColorPicker
              size="small"
              value={opts.background}
              presets={BACKGROUND_PRESETS.map((g) => ({ label: g.label, colors: g.colors }))}
              onChange={(value) => patch({ background: value.toHexString() })}
            />
          </Space>
          <Space size={6}>
            <Text type="secondary" style={{ fontSize: 13 }}>{t('专注颜色')}</Text>
            <ColorPicker
              size="small"
              value={opts.workColor}
              presets={BACKGROUND_PRESETS.map((g) => ({ label: g.label, colors: g.colors }))}
              onChange={(value) => patch({ workColor: value.toHexString() })}
            />
          </Space>
          <Space size={6}>
            <Text type="secondary" style={{ fontSize: 13 }}>{t('休息颜色')}</Text>
            <ColorPicker
              size="small"
              value={opts.breakColor}
              presets={BACKGROUND_PRESETS.map((g) => ({ label: g.label, colors: g.colors }))}
              onChange={(value) => patch({ breakColor: value.toHexString() })}
            />
          </Space>
          <Space size={6}>
            <Switch size="small" checked={opts.autoNext} onChange={(v) => patch({ autoNext: v })} />
            <Text type="secondary" style={{ fontSize: 13 }}>{t('自动开始下一阶段')}</Text>
          </Space>
        </Space>
        {opts.sound === 'custom' && !customAudio && (
          <div style={{ marginTop: 6, color: '#999', fontSize: 12 }}>{t('音频文件仅本机播放, 不会上传')}</div>
        )}
      </Card>

      <Divider>{t(' 番茄时钟说明 ')}</Divider>
      <PomodoroIntro />
    </Space>
  );
};

export default Pomodoro;