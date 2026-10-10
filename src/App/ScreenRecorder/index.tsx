// 屏幕录制: 浏览器原生 getDisplayMedia + MediaRecorder, 全程本地处理
// 说明: 该工具是「浏览器专享」—— 桌面版内嵌 WebView 没有系统共享选择器, 页面会给出引导
import { Alert, Button, Card, Divider, Select, Space, Tooltip, message } from 'antd';
import {
  CaretRightOutlined, DownloadOutlined, PauseOutlined, ReloadOutlined, SaveOutlined,
  StopOutlined, VideoCameraOutlined,
} from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from '../../hook/locale-context';
import { isTauri, saveBytesFile } from '../../lib/tauri';
import WebOnlyNotice, { webAppUrl } from '../../lib/web-only';
import {
  AUDIO_BITRATE, AUDIO_OPTIONS, BITRATE_OPTIONS, CLOCK_INTERVAL_MS, FPS_OPTIONS, REC_DOT_MS,
  SIZE_OPTIONS, TIMESLICE_MS, type AudioMode, type SizeKey,
} from './data';
import {
  clampBitrate, clampFps, detectSupport, estimateBytesPerMinute, extensionOf, formatBytes,
  formatDuration, getDefaultOptions, isSameOptions, isToggleKey, isTypingTarget, needsMic,
  normalizeOptions, pickMimeType, recordFileName, setDefaultOptions, trackInfoOf, videoConstraintsOf,
  type RecorderOptions, type TrackInfo,
} from './lib';
import { u, uT } from './lang';
import ScreenRecorderIntro from './intro';

type Phase = 'idle' | 'recording' | 'paused';

/** 一次录制的结果 */
interface RecordResult {
  url: string;
  name: string;
  size: number;
  mime: string;
  duration: number;
}

const BITRATE_TEXT: Record<number, string> = {
  2_000_000: '2 Mbps · 省空间',
  4_000_000: '4 Mbps · 均衡',
  8_000_000: '8 Mbps · 清晰',
  16_000_000: '16 Mbps · 极清 (文件大)',
};

const AUDIO_TEXT: Record<AudioMode, string> = {
  none: '不录声音',
  system: '系统声音 (屏幕 / 标签页)',
  both: '系统声音 + 麦克风',
};

const SIZE_TEXT: Record<SizeKey, string> = {
  source: '原始分辨率',
  '1080p': '最高 1080p',
  '720p': '最高 720p',
};

const STAGE_CSS = `
.sr-params { display: flex; flex-direction: column; gap: 8px; }
.sr-field { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.sr-label { color: #888; white-space: nowrap; }
.sr-hint { color: #999; font-size: 12px; }
.sr-stage { display: flex; flex-direction: column; gap: 10px; align-items: center; justify-content: center; min-height: 200px; padding: 14px; border: 1px solid rgba(128,128,128,0.2); border-radius: 8px; background: rgba(128,128,128,0.06); }
.sr-empty { color: #999; font-size: 13px; }
.sr-status { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
.sr-rec { width: 10px; height: 10px; border-radius: 50%; background: #ff4d4f; animation: sr-blink ${REC_DOT_MS}ms steps(1, end) infinite; }
.sr-rec-paused { background: #faad14; animation: none; }
@keyframes sr-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0.15; } }
.sr-phase { font-weight: 600; }
.sr-clock { font-variant-numeric: tabular-nums; font-size: 16px; font-weight: 600; }
.sr-meta { color: #999; font-size: 12px; }
.sr-video { width: 100%; max-height: 420px; border-radius: 6px; background: #000; }
`;

/** 异常信息转文案 (AbortError = 用户取消共享选择器) */
const messageOf = (err: unknown): string => {
  if (err instanceof Error) return err.message || err.name;
  return String(err);
};

const ScreenRecorder: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tt = (zh: string, vars?: Record<string, string | number>) => uT(locale, zh, vars);

  // 桌面版内嵌 WebView 没有系统共享选择器: 本工具为浏览器 (Web 版) 专享
  const desktop = isTauri();
  const support = useMemo(() => detectSupport(), []);
  const blocked = desktop || !support.supported;

  // 打开时按保存的默认设置初始化 (默认设置可在 设置中心 或本页「保存为默认设置」中修改)
  const [ opts, setOpts ] = useState<RecorderOptions>(() => getDefaultOptions());
  /** 已保存的默认设置: 与当前参数不一致时「保存为默认设置」才可点 */
  const [ defaults, setDefaults ] = useState<RecorderOptions>(() => getDefaultOptions());
  const [ phase, setPhase ] = useState<Phase>('idle');
  const [ elapsed, setElapsed ] = useState(0);
  const [ bytes, setBytes ] = useState(0);
  const [ track, setTrack ] = useState<TrackInfo | null>(null);
  const [ result, setResult ] = useState<RecordResult | null>(null);
  const [ error, setError ] = useState('');

  const recRef = useRef<MediaRecorder | null>(null);
  const displayRef = useRef<MediaStream | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const urlRef = useRef<string | null>(null);
  const startedAtRef = useRef(0);
  const pausedRef = useRef(0); // 累计暂停时长
  const pauseStartRef = useRef(0);
  const disposedRef = useRef(false);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  /** 已挑选的编码格式 (浏览器一个都不支持时交给它自己决定) */
  const mime = useMemo(() => {
    const Rec = (window as unknown as { MediaRecorder?: typeof MediaRecorder }).MediaRecorder;
    if (typeof Rec !== 'function' || typeof Rec.isTypeSupported !== 'function') return null;
    return pickMimeType((m) => Rec.isTypeSupported(m));
  }, []);

  const patch = useCallback((p: Partial<RecorderOptions>) => {
    setOpts((cur) => normalizeOptions({ ...cur, ...p }));
  }, []);

  const clearResult = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    blobRef.current = null;
    setResult(null);
  }, []);

  const cleanupStreams = useCallback(() => {
    for (const stream of [ displayRef.current, micRef.current ]) {
      stream?.getTracks().forEach((tr) => { try { tr.stop(); } catch { /* 忽略 */ } });
    }
    displayRef.current = null;
    micRef.current = null;
    recRef.current = null;
    chunksRef.current = [];
  }, []);

  /** 收尾: 合并分片 -> Blob URL -> 结果卡片 */
  const finish = useCallback(() => {
    const rec = recRef.current;
    const chunks = chunksRef.current;
    const mimeType = rec?.mimeType || chunks[0]?.type || 'video/webm';
    cleanupStreams();
    if (disposedRef.current) return;
    setPhase('idle');
    setElapsed(0);
    const duration = Math.max(0, Date.now() - startedAtRef.current - pausedRef.current);
    if (chunks.length === 0 || (chunks[0]?.size ?? 0) === 0) {
      setError(t('没有录到内容, 请确认共享时没有立即停止'));
      return;
    }
    const blob = new Blob(chunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    blobRef.current = blob;
    urlRef.current = url;
    setResult({
      url,
      name: recordFileName(optsRef.current.prefix, extensionOf(mimeType)),
      size: blob.size,
      mime: mimeType,
      duration,
    });
  }, [ cleanupStreams, t ]);

  const start = useCallback(async () => {
    if (blocked || recRef.current) return;
    setError('');
    clearResult();
    try {
      const cur = optsRef.current;
      const display = await navigator.mediaDevices.getDisplayMedia({
        video: videoConstraintsOf(cur),
        audio: cur.audio !== 'none',
      });
      // 「系统声音 + 麦克风」: 把两条流的轨道并成一条 (任一条缺失都能继续录)
      let mic: MediaStream | null = null;
      if (needsMic(cur.audio)) {
        try {
          mic = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
          message.warning(t('未获得麦克风权限, 本次只录制系统声音'));
        }
      }
      const target = mic
        ? new MediaStream([
          ...display.getVideoTracks(),
          ...display.getAudioTracks(),
          ...mic.getAudioTracks(),
        ])
        : display;
      const rec = new MediaRecorder(target, {
        ...(mime ? { mimeType: mime.mime } : {}),
        videoBitsPerSecond: clampBitrate(cur.bitrate),
        audioBitsPerSecond: AUDIO_BITRATE,
      });
      displayRef.current = display;
      micRef.current = mic;
      recRef.current = rec;
      chunksRef.current = [];
      setBytes(0);
      setTrack(trackInfoOf(target));
      rec.ondataavailable = (e: BlobEvent) => {
        const data = e.data;
        if (data && data.size > 0) {
          chunksRef.current.push(data);
          setBytes((b) => b + data.size);
        }
      };
      rec.onstop = finish;
      rec.onerror = () => setError(t('录制过程中出现错误, 已停止'));
      // 用户在浏览器「正在共享」提示条上点停止 -> 视频轨结束 -> 同步收尾
      display.getVideoTracks().forEach((tr) => {
        tr.onended = () => {
          const live = recRef.current;
          if (live && live.state !== 'inactive') {
            try { live.stop(); } catch { /* 忽略 */ }
          }
        };
      });
      rec.start(TIMESLICE_MS);
      startedAtRef.current = Date.now();
      pausedRef.current = 0;
      pauseStartRef.current = 0;
      setElapsed(0);
      setPhase('recording');
    } catch (err) {
      cleanupStreams();
      setError(tt('开始录制失败: {msg}', { msg: messageOf(err) }));
    }
  }, [ blocked, clearResult, cleanupStreams, finish, mime, t, tt ]);

  const pause = useCallback(() => {
    const rec = recRef.current;
    if (!rec || rec.state !== 'recording') return;
    try {
      rec.pause();
    } catch {
      /* 忽略 */
    }
    pauseStartRef.current = Date.now();
    setPhase('paused');
  }, []);

  const resume = useCallback(() => {
    const rec = recRef.current;
    if (!rec || rec.state !== 'paused') return;
    try {
      rec.resume();
    } catch {
      /* 忽略 */
    }
    if (pauseStartRef.current > 0) pausedRef.current += Date.now() - pauseStartRef.current;
    pauseStartRef.current = 0;
    setPhase('recording');
  }, []);

  const stop = useCallback(() => {
    const rec = recRef.current;
    if (!rec || rec.state === 'inactive') return;
    try {
      rec.stop();
    } catch {
      /* 忽略 */
    }
  }, []);

  const download = async () => {
    const blob = blobRef.current;
    const cur = result;
    if (!blob || !cur) return;
    try {
      const buf = new Uint8Array(await blob.arrayBuffer());
      const ext = extensionOf(cur.mime);
      const ok = await saveBytesFile(cur.name, buf, {
        title: t('下载视频'),
        filterName: ext === 'mp4' ? 'MP4 视频' : 'WebM 视频',
        extensions: [ ext ],
      });
      if (ok) message.success(tt('已保存 {file}', { file: cur.name }));
    } catch (err) {
      message.error(tt('保存失败: {msg}', { msg: messageOf(err) }));
    }
  };

  const saveDefaults = () => {
    const saved = setDefaultOptions(opts);
    setDefaults(saved);
    message.success(t('已保存为默认设置'));
  };

  // 计时: 排除暂停时长
  useEffect(() => {
    if (phase === 'idle') return;
    const id = window.setInterval(() => {
      const paused = pausedRef.current + (pauseStartRef.current > 0 ? Date.now() - pauseStartRef.current : 0);
      setElapsed(Math.max(0, Date.now() - startedAtRef.current - paused));
    }, CLOCK_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [ phase ]);

  // 卸载: 停掉录制与采集, 释放临时 URL
  useEffect(() => () => {
    disposedRef.current = true;
    const rec = recRef.current;
    if (rec && rec.state !== 'inactive') {
      try { rec.stop(); } catch { /* 忽略 */ }
    }
    cleanupStreams();
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, [ cleanupStreams ]);

  // 快捷键: 空格 开始 / 停止 (输入控件内不抢键)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target as HTMLElement | null) || !isToggleKey(e)) return;
      e.preventDefault();
      if (phase === 'idle') void start();
      else stop();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [ phase, start, stop ]);

  const dirty = !isSameOptions(opts, defaults);
  const busy = phase !== 'idle';

  const fpsOptions = useMemo(() => FPS_OPTIONS.map((n) => ({ value: n, label: `${n} fps` })), []);
  const bitrateOptions = useMemo(
    () => BITRATE_OPTIONS.map((v) => ({ value: v, label: t(BITRATE_TEXT[v]) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ locale ]
  );
  const audioOptions = useMemo(
    () => AUDIO_OPTIONS.map((a) => ({ value: a, label: t(AUDIO_TEXT[a]) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ locale ]
  );
  const sizeOptions = useMemo(
    () => SIZE_OPTIONS.map((s) => ({ value: s.value, label: t(SIZE_TEXT[s.value]) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ locale ]
  );

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <style>{STAGE_CSS}</style>

      {/* 桌面版: 本工具为浏览器专享 */}
      {desktop && (
        <WebOnlyNotice
          text={t('屏幕录制是浏览器专享功能')}
          hint={t('桌面版内嵌的 WebView 没有系统共享选择器, 请改用系统自带录屏工具 (Win+G / QuickTime / GNOME 截屏录制), 或打开 Web 版使用本工具')}
          action={t('打开 Web 版')}
          url={ webAppUrl('ScreenRecorder') }
        />
      )}

      {/* 浏览器能力不足 */}
      {!desktop && !support.supported && (
        <Alert
          className="sr-unsupported"
          type="warning"
          showIcon
          style={{ marginBottom: 0, maxWidth: 860 }}
          message={t('当前浏览器不支持屏幕录制')}
          description={t('需要同时支持屏幕采集 (getDisplayMedia) 与 MediaRecorder; 建议使用最新版 Chrome / Edge / Firefox。若页面嵌在 iframe 里, 还需要 iframe 带 allow="display-capture" 属性')}
        />
      )}

      <Card
        size="small"
        title={t('屏幕录制')}
        extra={
          <Space size={8}>
            {phase === 'idle' ? (
              <Button
                size="small"
                type="primary"
                danger
                icon={<VideoCameraOutlined />}
                disabled={blocked}
                onClick={() => { void start(); }}
              >{t('开始录制')}</Button>
            ) : (
              <>
                {phase === 'recording' ? (
                  <Button size="small" icon={<PauseOutlined />} onClick={pause}>{t('暂停')}</Button>
                ) : (
                  <Button size="small" icon={<CaretRightOutlined />} onClick={resume}>{t('继续')}</Button>
                )}
                <Button size="small" type="primary" danger icon={<StopOutlined />} onClick={stop}>{t('停止')}</Button>
              </>
            )}
            <Tooltip title={t('把当前参数记为默认值 (下次打开时沿用)')}>
              <Button size="small" icon={<SaveOutlined />} disabled={!dirty} onClick={saveDefaults}>
                {t('保存为默认设置')}
              </Button>
            </Tooltip>
          </Space>
        }
      >
        <div className="sr-params">
          <div className="sr-field">
            <span className="sr-label">{t('帧率')}</span>
            <Select
              size="small"
              value={opts.fps}
              style={{ width: 110 }}
              disabled={busy || blocked}
              onChange={(v) => patch({ fps: clampFps(v) })}
              options={fpsOptions}
            />
            <span className="sr-label">{t('画质 (码率)')}</span>
            <Select
              size="small"
              value={opts.bitrate}
              style={{ width: 190 }}
              disabled={busy || blocked}
              onChange={(v) => patch({ bitrate: clampBitrate(v) })}
              options={bitrateOptions}
            />
            <span className="sr-label">{t('声音')}</span>
            <Select
              size="small"
              value={opts.audio}
              style={{ width: 190 }}
              disabled={busy || blocked}
              onChange={(v) => patch({ audio: v })}
              options={audioOptions}
            />
            <span className="sr-label">{t('分辨率')}</span>
            <Select
              size="small"
              value={opts.size}
              style={{ width: 140 }}
              disabled={busy || blocked}
              onChange={(v) => patch({ size: v })}
              options={sizeOptions}
            />
          </div>
          <div className="sr-hint">
            {tt('当前编码格式: {mime}', { mime: mime?.label ?? t('浏览器默认格式') })}
            {` · ${tt('预计约 {s}/分钟', { s: formatBytes(estimateBytesPerMinute(opts.bitrate)) })}`}
            {` · ${t('键盘: 空格 开始 / 停止')}`}
          </div>
        </div>
      </Card>

      {error !== '' && (
        <Alert type="error" showIcon style={{ marginBottom: 0, maxWidth: 860 }} message={error} />
      )}

      <div className="sr-stage">
        {phase === 'idle' && !result && (
          <div className="sr-empty">{t('点「开始录制」后这里会显示录制状态与结果')}</div>
        )}
        {phase !== 'idle' && (
          <div className="sr-status">
            <span className={`sr-rec${phase === 'paused' ? ' sr-rec-paused' : ''}`} />
            <span className="sr-phase">{t(phase === 'paused' ? '已暂停' : '录制中')}</span>
            <span className="sr-clock">{formatDuration(elapsed)}</span>
            <span className="sr-meta">{tt('已写入 {s}', { s: formatBytes(bytes) })}</span>
            {track && (
              <span className="sr-meta">
                {track.width > 0 ? `${track.width}×${track.height}` : '—'}
                {track.frameRate > 0 ? ` · ${track.frameRate} fps` : ''}
                {` · ${t(track.hasAudio ? '含声音' : '无声音')}`}
              </span>
            )}
          </div>
        )}
        {result && (
          <>
            <video className="sr-video" src={result.url} controls />
            <div className="sr-meta">
              {result.name}
              {` · ${tt('时长 {d} · 大小 {s}', { d: formatDuration(result.duration), s: formatBytes(result.size) })}`}
              {` · ${result.mime}`}
            </div>
            <Space size={8}>
              <Button type="primary" size="small" icon={<DownloadOutlined />} onClick={() => { void download(); }}>
                {t('下载视频')}
              </Button>
              <Button size="small" icon={<ReloadOutlined />} onClick={clearResult}>{t('重新录制')}</Button>
            </Space>
          </>
        )}
      </div>

      <Alert
        type="info"
        showIcon
        style={{ maxWidth: 860 }}
        message={t('点击「开始录制」后浏览器会弹出共享选择器: 可选整个屏幕 / 应用窗口 / 浏览器标签页; 想录到声音, 请把「声音」设为系统声音并在选择器里勾选「分享标签页音频」或「分享系统音频」')}
        description={(
          <div style={{ fontSize: 12 }}>
            <div>{t('录制中浏览器会常驻「正在共享」提示条, 在它上面点「停止共享」也能结束录制 (结果会自动出现在下方)')}</div>
            <div>{t('所有处理都在本机完成: 屏幕画面、声音都不会上传到任何服务器')}</div>
          </div>
        )}
      />

      <Divider>{t(' 屏幕录制说明 ')}</Divider>
      <ScreenRecorderIntro />
    </Space>
  );
};

export default ScreenRecorder;
