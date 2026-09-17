import { Button, Card, Divider, Input, Progress, Slider, Space, Switch, Tooltip, Typography } from 'antd';
import {
  ClearOutlined, FileTextOutlined, FullscreenExitOutlined, FullscreenOutlined,
  PauseCircleOutlined, PlayCircleOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from '../../hook/locale-context';
import {
  FONT_SIZE_MAX, FONT_SIZE_MIN, LINE_HEIGHT_MAX, LINE_HEIGHT_MIN, PAD_RATIO,
  SAMPLE_SCRIPT, SPEED_MAX, SPEED_MIN, SPEED_STEP, STAGE_BG, STAGE_FG,
} from './data';
import {
  advance, clampFontSize, clampLineHeight, clampSpeed, formatClock, getStoredOptions,
  isSliderTarget, isToggleKey, isTypingTarget, progressOf, remainingSeconds, scrollDistance, setStoredOptions,
  splitScript, type PrompterOptions,
} from './lib';
import { u, uT } from './lang';
import TeleprompterIntro from './intro';

const { Text } = Typography;

const MONO = 'ui-monospace, SFMono-Regular, Consolas, "Courier New", monospace';

// 舞台样式: 用类名而非内联样式 (mask / fixed 定位等前缀属性在各浏览器表现不一致,
// 交给 CSS 更稳, 也便于测试断言类名)
const STAGE_CSS = `
.tp-stage { position: relative; display: flex; flex-direction: column; height: 420px; overflow: hidden; border-radius: 8px; background: ${STAGE_BG}; }
.tp-stage.tp-full { position: fixed; inset: 0; z-index: 1000; height: auto; border-radius: 0; }
.tp-view { position: relative; flex: 1 1 auto; min-height: 0; overflow: hidden; }
.tp-track { will-change: transform; }
.tp-text { white-space: pre-wrap; word-break: break-word; font-weight: 600; color: ${STAGE_FG}; }
.tp-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 8px 12px; background: rgba(255,255,255,0.06); border-top: 1px solid rgba(255,255,255,0.12); }
.tp-fade { -webkit-mask-image: linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%); mask-image: linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%); }
`;

/** 全屏 API 在部分内嵌 webview / 老浏览器上不存在, 统一按可选处理 */
type FullscreenElement = HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

const Teleprompter: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tt = (zh: string, vars?: Record<string, string | number>) => uT(locale, zh, vars);

  const [ opts, setOpts ] = useState<PrompterOptions>(() => getStoredOptions());
  const [ text, setText ] = useState(SAMPLE_SCRIPT);
  const [ playing, setPlaying ] = useState(false);
  const [ offset, setOffset ] = useState(0);
  const [ box, setBox ] = useState({ vh: 0, th: 0 }); // 视口高度 / 文本高度 (测量所得)
  const [ full, setFull ] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef(0);
  const distanceRef = useRef(0);
  const speedRef = useRef(opts.speed);
  speedRef.current = opts.speed;

  const lines = useMemo(() => splitScript(text), [ text ]);
  const hasScript = lines.length > 0;
  const distance = useMemo(() => scrollDistance(box.th, box.vh), [ box.th, box.vh ]);
  const pad = Math.max(0, Math.round(box.vh * PAD_RATIO));
  const progress = progressOf(offset, distance);
  const left = remainingSeconds(offset, distance, opts.speed);
  const done = distance > 0 && offset >= distance;

  const patch = useCallback((next: Partial<PrompterOptions>) => {
    setOpts((prev) => ({ ...prev, ...next }));
  }, []);

  // 偏移量同时写 ref 与 state: 动画帧里读 ref, 避免闭包拿到过期值
  const commit = useCallback((next: number) => {
    offsetRef.current = next;
    setOffset(next);
  }, []);

  const reset = useCallback(() => {
    setPlaying(false);
    commit(0);
  }, [ commit ]);

  // 选项记忆: 速度 / 字号 / 行距 / 淡入淡出 下次打开沿用
  useEffect(() => { setStoredOptions(opts); }, [ opts ]);

  // 测量视口与文本高度 → 得到滚动总距离 (尺寸变化时重算, 已在结尾则贴住结尾)
  useEffect(() => {
    const measure = () => {
      const vh = viewRef.current?.clientHeight ?? 0;
      const th = textRef.current?.offsetHeight ?? 0;
      const next = scrollDistance(th, vh);
      distanceRef.current = next;
      setBox({ vh, th });
      if (offsetRef.current > next) commit(next);
    };
    measure();
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    if (ro) {
      if (viewRef.current) ro.observe(viewRef.current);
      if (textRef.current) ro.observe(textRef.current);
    }
    window.addEventListener('resize', measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [ text, opts.fontSize, opts.lineHeight, full, commit ]);

  // 改稿后回到开头
  useEffect(() => {
    setPlaying(false);
    commit(0);
  }, [ text, commit ]);

  // 滚动动画: requestAnimationFrame 推进, 速度实时读 ref (拖动滑块不打断播放)
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = -1; // -1 表示首帧 (首帧只记时间, 不推进, 避免时间戳为 0 时被当成"已初始化")
    const tick = (ts: number) => {
      const dt = last < 0 ? 0 : Math.min(200, Math.max(0, ts - last)); // 切到后台再回来时不要一次跳很远
      last = ts;
      const step = advance(offsetRef.current, distanceRef.current, speedRef.current, dt);
      commit(step.offset);
      if (step.done) {
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ playing, commit ]);

  const toggle = useCallback(() => {
    if (!hasScript) return;
    if (playing) {
      setPlaying(false);
      return;
    }
    if (offsetRef.current >= distanceRef.current) commit(0); // 播完后再点: 从头开始
    setPlaying(true);
  }, [ hasScript, playing, commit ]);

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

  // 用户按 Esc / 系统快捷键退出原生全屏时同步状态
  useEffect(() => {
    const onChange = () => { if (!document.fullscreenElement) setFull(false); };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // 快捷键: 空格 开始/暂停, ↑↓ 调速, Esc 退出窗口内全屏
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = isTypingTarget(el); // 文本输入框: 空格应保留为普通输入
      const onSlider = isSliderTarget(el); // 滑块手柄: 方向键归滑块
      // 输入框内空格是正常输入, 不抢键; 但正在播放时允许用空格暂停
      if (isToggleKey(e) && (!typing || playing || full)) {
        e.preventDefault();
        toggle();
        return;
      }
      if ((typing || onSlider) && !full) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        patch({ speed: clampSpeed(opts.speed + (e.key === 'ArrowUp' ? SPEED_STEP : -SPEED_STEP)) });
        return;
      }
      if (e.key === 'Escape' && full && !document.fullscreenElement) exitFull();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [ toggle, playing, full, opts.speed, patch, exitFull ]);

  const stageClass = `tp-stage${full ? ' tp-full' : ''}${opts.fade ? ' tp-fade' : ''}`;
  const estTotal = distance / Math.max(1, opts.speed);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <style>{STAGE_CSS}</style>

      <Card
        size="small"
        title={t('提词脚本')}
        extra={
          <Space size={8}>
            <Button size="small" icon={<FileTextOutlined />} onClick={() => setText(SAMPLE_SCRIPT)}>{t('载入示例')}</Button>
            <Button size="small" danger icon={<ClearOutlined />} disabled={!text} onClick={() => setText('')}>{t('清空')}</Button>
          </Space>
        }
      >
        <Input.TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('在此粘贴或输入提词脚本…')}
          style={{ minHeight: 170, fontFamily: MONO, fontSize: 14, lineHeight: 1.7, resize: 'vertical' }}
        />
        <div style={{ marginTop: 6, color: '#888', fontSize: 12 }}>
          {tt('{l} 行 / {c} 字符 / 全文约 {time}', { l: lines.length, c: text.length, time: formatClock(estTotal) })}
        </div>
        <Space size={24} wrap style={{ marginTop: 12 }}>
          <Space size={8}>
            <span style={{ color: '#888' }}>{t('字号')}</span>
            <Slider
              min={FONT_SIZE_MIN}
              max={FONT_SIZE_MAX}
              value={opts.fontSize}
              onChange={(v) => patch({ fontSize: clampFontSize(v) })}
              style={{ width: 150, margin: 0 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>{`${opts.fontSize} px`}</Text>
          </Space>
          <Space size={8}>
            <span style={{ color: '#888' }}>{t('行距')}</span>
            <Slider
              min={LINE_HEIGHT_MIN}
              max={LINE_HEIGHT_MAX}
              step={0.1}
              value={opts.lineHeight}
              onChange={(v) => patch({ lineHeight: clampLineHeight(v) })}
              style={{ width: 130, margin: 0 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>{`${opts.lineHeight.toFixed(1)} x`}</Text>
          </Space>
          <Space size={8}>
            <Switch size="small" checked={opts.fade} onChange={(v) => patch({ fade: v })} />
            <Tooltip title={t('边缘淡入淡出: 文字在上下边缘渐隐, 更接近真实提词器')}>
              <span style={{ color: '#888' }}>{t('淡入淡出')}</span>
            </Tooltip>
          </Space>
        </Space>
      </Card>

      <Card
        size="small"
        title={t('提词器')}
        extra={<Text type="secondary" style={{ fontSize: 12 }}>{t('空格 开始/暂停 · ↑↓ 调速 · Esc 退出全屏')}</Text>}
      >
        <div ref={stageRef} className={stageClass}>
          <div className="tp-view" ref={viewRef}>
            <div className="tp-track" style={{ transform: `translateY(${-offset}px)`, padding: `${pad}px 0` }}>
              <div className="tp-text" ref={textRef} style={{ fontSize: opts.fontSize, lineHeight: opts.lineHeight }}>
                {hasScript
                  ? lines.map((line, i) => <div key={i}>{line === '' ? '\u00A0' : line}</div>)
                  : <div style={{ color: '#777' }}>{t('请先在上方输入提词脚本')}</div>}
              </div>
            </div>
          </div>
          <div className="tp-bar">
            <Button
              size="small"
              type="primary"
              icon={playing ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              disabled={!hasScript}
              onClick={toggle}
            >
              {playing ? t('暂停') : done ? t('重新播放') : t('开始')}
            </Button>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              disabled={!hasScript || (offset === 0 && !playing)}
              onClick={reset}
            >
              {t('回到开头')}
            </Button>
            <Button
              size="small"
              icon={full ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={full ? exitFull : enterFull}
            >
              {full ? t('退出全屏') : t('全屏')}
            </Button>
            <Space size={6}>
              <span style={{ color: '#aaa', fontSize: 12 }}>{t('速度')}</span>
              <Slider
                min={SPEED_MIN}
                max={SPEED_MAX}
                step={SPEED_STEP}
                value={opts.speed}
                onChange={(v) => patch({ speed: clampSpeed(v) })}
                style={{ width: 130, margin: 0 }}
              />
              <Text style={{ color: STAGE_FG, fontSize: 12 }}>{`${opts.speed} px/s`}</Text>
            </Space>
            <Progress
              percent={Math.round(progress * 100)}
              showInfo={false}
              size="small"
              strokeColor="#1677ff"
              trailColor="rgba(255,255,255,0.15)"
              style={{ flex: '1 1 120px', minWidth: 100, margin: 0 }}
            />
            <Text style={{ color: '#aaa', fontSize: 12 }}>
              {done ? t('播放结束') : tt('剩余 {time}', { time: formatClock(left) })}
            </Text>
          </div>
        </div>
      </Card>

      <Divider>{t(' 提词器说明 ')}</Divider>
      <TeleprompterIntro />
    </Space>
  );
};

export default Teleprompter;
