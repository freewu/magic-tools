// 贪吃蛇: 经典 20×20 网格贪吃蛇 (四档速度 / 穿墙 / 障碍物 / 金苹果限时高分 / 音效 / 全屏)
// 玩法参考 https://tanchishe.513game.com/
// 说明: 规则计算全部在 lib.ts (纯函数), 本文件只做渲染与键盘 / 触摸 / 计时 / 音效 / 全屏等副作用
import { Alert, Button, Card, Divider, Segmented, Space, Switch, Tag, Tooltip, Typography, theme } from 'antd';
import {
  ArrowDownOutlined, ArrowLeftOutlined, ArrowRightOutlined, ArrowUpOutlined, FullscreenExitOutlined,
  FullscreenOutlined, PauseCircleOutlined, PlayCircleOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppContext } from '../../hook/app-context';
import { useLocale } from '../../hook/locale-context';
import {
  BOARD_SIZE_CSS, BOARD_SIZE_CSS_FULL, GOLD_LIFE_MS, SCORE_APPLE, SCORE_GOLD, SPEED_ORDER, SNAKE_CSS, type Dir,
  type SpeedKey,
} from './data';
import {
  begin, cellKey, createState, expireFood, getBestScore, getDefaultOptions, isTypingTarget, keyToInput,
  setBestScore, snakeLength, speedMs, step, swipeToDir, togglePause, turn, type SnakeState,
} from './lib';
import { u, uT } from './lang';
import SnakeIntro from './intro';

const { Text } = Typography;

type FullscreenElement = HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type Sfx = 'eat' | 'gold' | 'die' | 'win' | 'start';

/** 提示音 (Web Audio 现场合成, 不加载任何音频文件; 不支持时静默跳过) */
const tone = (ctx: AudioContext, freq: number, at: number, dur: number, vol = 0.06) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, ctx.currentTime + at);
  gain.gain.setValueAtTime(0, ctx.currentTime + at);
  gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + at);
  osc.stop(ctx.currentTime + at + dur + 0.02);
};

const Snake: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tT = (zh: string, vars: Record<string, string | number>) => uT(locale, zh, vars);
  const { token } = theme.useToken();
  // 页面在 KeepAlive 容器中常驻: 只有当前显示本应用时才响应全局键盘事件
  const appCtx = useContext(AppContext);
  const active = appCtx ? appCtx.app === 'Snake' : true;

  const [ opts, setOpts ] = useState(() => getDefaultOptions());
  const [ st, setSt ] = useState<SnakeState>(() => {
    const o = getDefaultOptions();
    return createState({ walls: o.walls, wrap: o.wrap });
  });
  const [ best, setBest ] = useState<number>(() => getBestScore());
  const [ full, setFull ] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  /** 记录本局是否刷新了纪录 (结束提示里用) */
  const newRecordRef = useRef(false);

  const running = st.status === 'running';

  /** 播放提示音 */
  const playSfx = useCallback((kind: Sfx) => {
    if (! opts.sound) return;
    const Ctor = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
      .AudioContext
      ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (! Ctor) return;
    try {
      const ctx = audioRef.current ?? new Ctor();
      audioRef.current = ctx;
      if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
      if (kind === 'eat') {
        tone(ctx, 660, 0, 0.08);
        tone(ctx, 880, 0.07, 0.09);
      } else if (kind === 'gold') {
        tone(ctx, 780, 0, 0.08);
        tone(ctx, 1040, 0.07, 0.08);
        tone(ctx, 1320, 0.14, 0.12);
      } else if (kind === 'start') {
        tone(ctx, 520, 0, 0.08);
      } else {
        tone(ctx, 300, 0, 0.16, 0.08);
        tone(ctx, 180, 0.12, 0.26, 0.08);
      }
    } catch {
      /* 忽略: 音频不可用时不影响游戏 */
    }
  }, [ opts.sound ]);

  /** 开一局新的 (walls / wrap 用当前开关) */
  const start = useCallback((patch: { walls?: boolean } = {}) => {
    const walls = patch.walls ?? opts.walls;
    const next = createState({ walls, wrap: opts.wrap }, Math.random, Date.now());
    newRecordRef.current = false;
    setBest(getBestScore());
    setSt(begin(next));
    playSfx('start');
  }, [ opts.walls, opts.wrap, playSfx ]);

  /** 走一格 (由计时器触发) */
  const advance = useCallback(() => {
    const now = Date.now();
    const { state, event } = step(expireFood(st, now), Math.random, now);
    setSt(state);
    if (event !== 'none') playSfx(event);
    if (state.score > best) {
      newRecordRef.current = true;
      setBest(setBestScore(state.score));
    }
  }, [ st, best, playSfx ]);

  // 自动前进: 每 speedMs 走一格 (暂停 / 结束时不排新的计时器)
  useEffect(() => {
    if (st.status !== 'running') return;
    const id = window.setTimeout(advance, speedMs(opts.speed));
    return () => window.clearTimeout(id);
  }, [ st, opts.speed, advance ]);

  /** 转向 (键盘 / 屏幕方向盘 / 滑动共用) */
  const steer = useCallback((dir: Dir) => {
    setSt((s) => turn(s, dir));
  }, []);

  /** 空格 / 播放按钮: 未开局则开局, 进行中则暂停, 暂停中则继续, 结束后重来 */
  const toggle = useCallback(() => {
    if (st.status === 'idle' || st.status === 'over' || st.status === 'won') {
      start();
      return;
    }
    setSt((s) => togglePause(s));
  }, [ st.status, start ]);

  // 键盘: 方向键 / WASD 转向, 空格 / 回车 开局或暂停, P / Esc 暂停 (输入框内不拦截)
  useEffect(() => {
    if (! active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target as HTMLElement | null)) return;
      const input = keyToInput(e);
      if (! input) return;
      e.preventDefault();
      if (input === 'start') toggle();
      else if (input === 'pause') setSt((s) => togglePause(s));
      else steer(input);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [ active, toggle, steer ]);

  // ---- 触摸: 在棋盘上滑动转向 ----
  const swipeRef = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    swipeRef.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const from = swipeRef.current;
    swipeRef.current = null;
    if (! from) return;
    const dir = swipeToDir(e.clientX - from.x, e.clientY - from.y);
    if (dir) steer(dir);
  };

  // ---- 全屏 (原生全屏不可用时用窗口内全屏兜底) ----
  const exitFull = useCallback(() => {
    setFull(false);
    const doc = document as FullscreenDocument;
    const activeFull = doc.fullscreenElement ?? doc.webkitFullscreenElement;
    if (! activeFull) return;
    try {
      Promise.resolve(doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.()).catch(() => undefined);
    } catch {
      /* 忽略 */
    }
  }, []);

  useEffect(() => {
    if (! full) return;
    const el = stageRef.current as FullscreenElement | null;
    const request = el?.requestFullscreen?.bind(el) ?? el?.webkitRequestFullscreen?.bind(el);
    if (! request) return;
    try {
      Promise.resolve(request()).catch(() => undefined);
    } catch {
      /* 忽略: CSS 已铺满视口 */
    }
  }, [ full ]);

  useEffect(() => {
    const onChange = () => {
      const doc = document as FullscreenDocument;
      if (! doc.fullscreenElement && ! doc.webkitFullscreenElement) setFull(false);
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  // 切到其它工具时自动退出全屏
  useEffect(() => {
    if (! active && full) exitFull();
  }, [ active, full, exitFull ]);

  // 音效开关变化 / 卸载时关闭 AudioContext
  useEffect(() => () => {
    const ctx = audioRef.current;
    audioRef.current = null;
    if (ctx) void ctx.close?.().catch(() => undefined);
  }, []);

  // ---- 渲染 ----
  const head = st.snake[0];
  const tailKey = st.snake.length > 1 ? cellKey(st.snake[st.snake.length - 1]) : '';
  const segMap = new Map<string, 'head' | 'body' | 'tail'>();
  st.snake.forEach((c, i) => segMap.set(cellKey(c), i === 0 ? 'head' : i === st.snake.length - 1 ? 'tail' : 'body'));
  const wallSet = new Set(st.walls.map(cellKey));
  const foodKey = st.food ? cellKey(st.food) : '';

  const cells = Array.from({ length: st.cols * st.rows }, (_, i) => {
    const x = i % st.cols;
    const y = Math.floor(i / st.cols);
    const key = `${x},${y}`;
    const seg = segMap.get(key);
    const filled = seg ?? (wallSet.has(key) ? 'wall' : key === foodKey ? (st.food?.type === 'gold' ? 'gold' : 'food') : '');
    return (
      <div
        key={ key }
        className="sk-cell"
        data-cell={ key }
        data-filled={ filled }
        style={ { background: 'var(--sk-cell-bg)' } }
      >
        { seg === 'head' ? <div className="sk-head" /> : null }
        { seg === 'body' ? <div className="sk-body" /> : null }
        { seg === 'tail' ? <div className="sk-tail" /> : null }
        { filled === 'wall' ? <div className="sk-wall" /> : null }
        { filled === 'food' ? <div className="sk-apple" /> : null }
        { filled === 'gold' ? <div className="sk-gold" /> : null }
      </div>
    );
  });

  const overlay = st.status === 'idle' ? (
    <div className="sk-overlay">
      <div>{ t('贪吃蛇') }</div>
      <Button size="small" type="primary" onClick={ () => start() }>{ t('开始游戏') }</Button>
      <Text style={ { fontSize: 12, fontWeight: 400, opacity: 0.8 } }>{ t('或按空格键开局') }</Text>
    </div>
  ) : st.status === 'paused' ? (
    <div className="sk-overlay">
      <div>{ t('已暂停') }</div>
      <Button size="small" type="primary" icon={ <PlayCircleOutlined /> } onClick={ toggle }>{ t('继续') }</Button>
    </div>
  ) : st.status === 'over' || st.status === 'won' ? (
    <div className="sk-overlay">
      <div>{ st.status === 'won' ? t('通关了!') : t('游戏结束') }</div>
      <div style={ { fontSize: 13, fontWeight: 400 } }>{ tT('本局得分 {n}', { n: st.score }) }</div>
      <Button size="small" type="primary" icon={ <ReloadOutlined /> } onClick={ () => start() }>{ t('再来一局') }</Button>
    </div>
  ) : null;

  const boardNode = (
    <div className="sk-board-box">
      <div
        className="sk-board"
        data-testid="snake-board"
        onPointerDown={ onPointerDown }
        onPointerUp={ onPointerUp }
      >
        { cells }
      </div>
      { overlay }
    </div>
  );

  const stat = (label: string, value: React.ReactNode) => (
    <div
      key={ label }
      style={ {
        minWidth: 74,
        padding: '4px 10px',
        borderRadius: token.borderRadius,
        background: token.colorFillSecondary,
        textAlign: 'center',
      } }
    >
      <div style={ { fontSize: 12, color: token.colorTextSecondary, lineHeight: '16px' } }>{ label }</div>
      <div style={ { fontSize: 17, fontWeight: 700, lineHeight: '24px' } } data-stat={ label }>{ value }</div>
    </div>
  );

  const speedNode = (
    <Segmented
      size="small"
      value={ opts.speed }
      onChange={ (v) => setOpts({ ...opts, speed: v as SpeedKey }) }
      options={ SPEED_ORDER.map((k) => ({ value: k, label: t({ slow: '慢', mid: '标准', fast: '快', insane: '极速' }[k]) })) }
    />
  );

  const switchNode = (
    <Space size={ 12 } wrap>
      <Space size={ 6 }>
        <Tooltip title={ t('穿墙: 从一边出去, 从对边进来') }>
          <Text style={ { fontSize: 12 } }>{ t('穿墙') }</Text>
        </Tooltip>
        <Switch
          size="small"
          checked={ opts.wrap }
          onChange={ (v) => {
            // 穿墙随时生效: 同时更新设置与当前局面
            setOpts({ ...opts, wrap: v });
            setSt((s) => ({ ...s, wrap: v }));
          } }
          data-testid="snake-wrap"
        />
      </Space>
      <Space size={ 6 }>
        <Tooltip title={ t('障碍物: 棋盘上固定出现 12 格障碍') }>
          <Text style={ { fontSize: 12 } }>{ t('障碍物') }</Text>
        </Tooltip>
        <Switch
          size="small"
          checked={ opts.walls }
          onChange={ (v) => {
            // 障碍物只在开局时铺设: 未开局直接刷新棋盘, 进行中则下一局生效
            setOpts({ ...opts, walls: v });
            if (st.status === 'idle') setSt(createState({ walls: v, wrap: opts.wrap }, Math.random, Date.now()));
          } }
          data-testid="snake-walls"
        />
      </Space>
      <Space size={ 6 }>
        <Text style={ { fontSize: 12 } }>{ t('音效') }</Text>
        <Switch
          size="small"
          checked={ opts.sound }
          onChange={ (v) => setOpts({ ...opts, sound: v }) }
          data-testid="snake-sound"
        />
      </Space>
    </Space>
  );

  const dpadButton = (dir: Dir, icon: React.ReactNode, label: string) => (
    <Button
      size="small"
      icon={ icon }
      aria-label={ label }
      title={ label }
      data-testid={ `snake-${dir}` }
      disabled={ ! running }
      onClick={ () => steer(dir) }
    />
  );

  const dpadNode = (
    <div className="sk-dpad" data-testid="snake-dpad">
      <span />
      { dpadButton('up', <ArrowUpOutlined />, t('上移 (↑ / W)')) }
      <span />
      { dpadButton('left', <ArrowLeftOutlined />, t('左移 (← / A)')) }
      { dpadButton('down', <ArrowDownOutlined />, t('下移 (↓ / S)')) }
      { dpadButton('right', <ArrowRightOutlined />, t('右移 (→ / D)')) }
    </div>
  );

  const controlNode = (
    <Space size={ 6 } wrap>
      <Tooltip title={ t('开始 / 暂停 (空格)') }>
        <Button
          size="small"
          type={ running ? 'default' : 'primary' }
          icon={ running ? <PauseCircleOutlined /> : <PlayCircleOutlined /> }
          onClick={ toggle }
        >
          { running ? t('暂停') : st.status === 'paused' ? t('继续') : t('开始') }
        </Button>
      </Tooltip>
      <Tooltip title={ t('重新开始') }>
        <Button size="small" icon={ <ReloadOutlined /> } onClick={ () => start() }>{ t('重来') }</Button>
      </Tooltip>
    </Space>
  );

  const hintNode = (
    <Space direction="vertical" size={ 2 }>
      <Text type="secondary" style={ { fontSize: 12 } }>
        { t('方向键 / WASD 转向; 手机滑动棋盘, 或点下面的方向键') }
      </Text>
      <Text type="secondary" style={ { fontSize: 12 } }>
        { tT('苹果 {a} 分 · 金苹果 {b} 分 (只存在 {s} 秒)', {
          a: SCORE_APPLE, b: SCORE_GOLD, s: Math.round(GOLD_LIFE_MS / 1000),
        }) }
      </Text>
      <Text type="secondary" style={ { fontSize: 12 } }>
        { t('撞墙 / 撞到自己 / 撞到障碍物即结束, 棋盘填满则通关') }
      </Text>
    </Space>
  );

  const sideNode = (
    <>
      <Space size={ 8 } wrap>
        { stat(t('得分'), st.score) }
        { stat(t('最高分'), best) }
        { stat(t('长度'), snakeLength(st)) }
        { stat(t('速度'), t({ slow: '慢', mid: '标准', fast: '快', insane: '极速' }[opts.speed])) }
      </Space>
      { speedNode }
      { switchNode }
      { controlNode }
    </>
  );

  const boardStyle = {
    '--sk-board': BOARD_SIZE_CSS,
    '--sk-cell-bg': token.colorFillQuaternary,
  } as React.CSSProperties;

  // ---- 全屏: 只保留棋盘与记分 / 控制 ----
  if (full) {
    return (
      <>
        <style>{ SNAKE_CSS }</style>
        <div
          ref={ stageRef }
          className="sk-stage sk-full"
          data-testid="snake-full"
          style={ { ...boardStyle, '--sk-board': BOARD_SIZE_CSS_FULL, '--sk-bg': token.colorBgContainer } as React.CSSProperties }
        >
          <div className="sk-side" style={ { alignItems: 'stretch' } }>
            { sideNode }
            { dpadNode }
            <Button size="small" icon={ <FullscreenExitOutlined /> } onClick={ exitFull }>{ t('退出全屏') }</Button>
          </div>
          { boardNode }
          <div className="sk-side">
            <Text type="secondary" style={ { fontSize: 12 } }>{ t('Esc 退出全屏') }</Text>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="sk-stage" style={ boardStyle }>
      <style>{ SNAKE_CSS }</style>
      <Space direction="vertical" size={ 16 } style={ { width: '100%' } }>
        <Card
          size="small"
          title={ t('贪吃蛇') }
          extra={
            <Button size="small" icon={ <FullscreenOutlined /> } onClick={ () => setFull(true) }>{ t('全屏') }</Button>
          }
        >
          <Space direction="vertical" size={ 12 } style={ { width: '100%' } }>
            <div className="sk-wrap">
              { boardNode }
              <div className="sk-side" style={ { minWidth: 190 } }>
                { sideNode }
                { dpadNode }
                <Space size={ 4 } wrap>
                  <Tag color="green">{ tT('本局得分 {n}', { n: st.score }) }</Tag>
                  { opts.wrap ? <Tag>{ t('穿墙') }</Tag> : null }
                  { opts.walls ? <Tag>{ t('障碍物') }</Tag> : null }
                </Space>
                { hintNode }
              </div>
            </div>

            { st.status === 'over' || st.status === 'won' ? (
              <Alert
                type={ st.status === 'won' ? 'success' : 'error' }
                showIcon
                message={ st.status === 'won' ? t('通关了!') : t('游戏结束') }
                description={
                  newRecordRef.current
                    ? tT('本局得分 {n}', { n: st.score }) + ' · ' + tT('新纪录! 最高分 {m}', { m: best })
                    : tT('本局得分 {n}', { n: st.score })
                }
                action={ <Button size="small" type="primary" onClick={ () => start() }>{ t('再来一局') }</Button> }
              />
            ) : null }
          </Space>
        </Card>

        <Divider>{ t('贪吃蛇说明') }</Divider>
        <SnakeIntro />
      </Space>
    </div>
  );
};

export default Snake;
