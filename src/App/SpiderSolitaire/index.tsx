// 蜘蛛纸牌 (Spider Solitaire): 10 列牌桌 + 5 轮发牌, 收满 8 组同花 K→A 即通关
// 规则参考 https://cardgames.io/zh/spidersolitaire/
// 说明: 规则计算全部在 lib.ts (纯函数), 本文件只做渲染与键盘 / 计时 / 全屏等副作用
import { Alert, Button, Card, Divider, InputNumber, Select, Space, Tag, Tooltip, Typography, message, theme } from 'antd';
import {
  BulbOutlined, DownloadOutlined, FullscreenExitOutlined, FullscreenOutlined, PlaySquareOutlined,
  PlusCircleOutlined, ReloadOutlined, UndoOutlined,
} from '@ant-design/icons';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppContext } from '../../hook/app-context';
import { useLocale } from '../../hook/locale-context';
import {
  CARD_SIZE_CSS, CARD_SIZE_CSS_FULL, DIFFICULTIES, HISTORY_LIMIT, IS_RED, RANK_LABEL, SEED_MAX, SEED_MIN,
  SERIES_COUNT, SP_CSS, SUIT_SYMBOL, type Difficulty,
} from './data';
import {
  applyMove, canMove, cardId, cloneState, collectCompleted, collectedCount, dealFromSeed, dealStock,
  dealsLeft, findHint, formatTime, getDefaultOptions, getLastSeed, getRecords, isRedCard, isStuck,
  isTypingTarget, isWin, keyToAction, normalizeSeed, patchDefaultOptions, randomSeed, recordPlay,
  recordWin, runFrom, setLastSeed, type Card as CardData, type GameState, type Move, type SpiderRecords,
} from './lib';
import { u, uT } from './lang';
import SpiderSolitaireIntro from './intro';

const { Text } = Typography;

type FullscreenElement = HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

/** 当前选中的一段连牌 */
type Selection = { col: number; start: number; count: number };

/** 正在被拖动的牌组 */
type DragState = {
  from: number;
  count: number;
  /** 这段连牌在该列中的起始下标 */
  start: number;
  cards: CardData[];
  x: number;
  y: number;
  offX: number;
  offY: number;
  /** 指针当前悬停的目标列 */
  over: number | null;
};

/** 移动超过该距离才算拖拽, 否则视为点击 */
const DRAG_THRESHOLD = 5;

/**
 * 取指针坐标: 有的环境 (jsdom / 部分合成事件) 拿不到 clientX, 此时得到 NaN。
 * 坐标不可用时按「已经移动」处理 (宁可拖起来也别吞掉用户的滑动), 只把幽灵牌放在原点。
 */
const pointerPos = (e: { clientX?: number; clientY?: number }): { x: number; y: number } => ({
  x: e.clientX as number,
  y: e.clientY as number,
});

/** 幽灵牌定位 (坐标不可用时返回 undefined, 交给 CSS 定位) */
const finiteOrUndefined = (v: number): number | undefined => (Number.isFinite(v) ? v : undefined);

/** 指针位置下的目标列 (靠容器上的 data-drop 标记) */
const dropColumnAt = (x: number, y: number): number | null => {
  const doc = document as Document & { elementFromPoint?: (px: number, py: number) => Element | null };
  if (typeof doc.elementFromPoint !== 'function') return null;
  let el: Element | null = null;
  try {
    el = doc.elementFromPoint(x, y);
  } catch {
    return null;
  }
  const holder = el?.closest?.('[data-drop]') as HTMLElement | null | undefined;
  const raw = holder?.dataset?.drop;
  if (!raw) return null;
  const col = Number(raw);
  return Number.isFinite(col) ? col : null;
};

const SpiderSolitaire: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tT = (zh: string, vars: Record<string, string | number>) => uT(locale, zh, vars);
  const { token } = theme.useToken();
  // 页面在 KeepAlive 容器中常驻: 只有当前显示本应用时才响应全局键盘事件
  const appCtx = useContext(AppContext);
  const active = appCtx ? appCtx.app === 'SpiderSolitaire' : true;

  const [ opts, setOpts ] = useState(() => getDefaultOptions());
  const [ seed, setSeed ] = useState<number>(() => getLastSeed());
  const [ seedInput, setSeedInput ] = useState<number | null>(() => getLastSeed());
  const [ state, setState ] = useState<GameState>(() => dealFromSeed(getLastSeed(), getDefaultOptions().suits));
  const [ history, setHistory ] = useState<GameState[]>([]);
  const [ sel, setSel ] = useState<Selection | null>(null);
  const [ hint, setHint ] = useState<Move | null>(null);
  const [ elapsed, setElapsed ] = useState(0);
  const [ running, setRunning ] = useState(false);
  const [ won, setWon ] = useState(false);
  const [ records, setRecords ] = useState<SpiderRecords>(() => getRecords());
  const [ full, setFull ] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  /** 计时器回调里要读到最新用时, 用 ref 同步一份 */
  const elapsedRef = useRef(0);

  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [ elapsed ]);

  // ---- 计时 ----
  useEffect(() => {
    if (!running || won) return;
    const id = window.setInterval(() => setElapsed((v) => v + 1000), 1000);
    return () => window.clearInterval(id);
  }, [ running, won ]);

  // ---- 移动 ----
  const pushHistory = useCallback((prev: GameState) => {
    setHistory((h) => [ ...h, cloneState(prev) ].slice(-HISTORY_LIMIT));
  }, []);

  const finishIfWin = useCallback((next: GameState, steps: number) => {
    if (!isWin(next)) return false;
    setRunning(false);
    setWon(true);
    setRecords(recordWin(elapsedRef.current, steps));
    return true;
  }, []);

  /** 执行一步移动; 成功返回 true */
  const commit = useCallback((move: Move): boolean => {
    const next = applyMove(state, move, { autoCollect: opts.autoCollect });
    if (!next) return false;
    pushHistory(state);
    setState(next);
    setSel(null);
    setHint(null);
    if (!running && !won) setRunning(true);
    finishIfWin(next, next.moves);
    return true;
  }, [ state, opts.autoCollect, running, won, pushHistory, finishIfWin ]);

  const tryMove = useCallback((from: number, count: number, to: number): boolean => {
    if (!canMove(state, { from, to, count })) return false;
    return commit({ from, to, count });
  }, [ state, commit ]);

  // ---- 拖拽 (鼠标 / 触摸统一走 Pointer Events) ----
  const tryMoveRef = useRef(tryMove);
  useEffect(() => {
    tryMoveRef.current = tryMove;
  }, [ tryMove ]);

  const [ drag, setDrag ] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const pendingRef = useRef<Omit<DragState, 'over'> | null>(null);
  /** 拖拽刚结束时浏览器还会补一个 click, 用它吞掉, 避免拖完又选中一次 */
  const suppressClick = useRef(false);

  const clearDrag = useCallback(() => {
    pendingRef.current = null;
    dragRef.current = null;
    setDrag(null);
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const pending = pendingRef.current;
      if (!pending) return;
      const current = dragRef.current;
      const { x, y } = pointerPos(e);
      if (!current) {
        // 未过阀值: 仍然当作点击, 不进入拖拽
        if (Math.abs(x - pending.x) < DRAG_THRESHOLD && Math.abs(y - pending.y) < DRAG_THRESHOLD) return;
        const started: DragState = { ...pending, x, y, over: dropColumnAt(x, y) };
        dragRef.current = started;
        setDrag(started);
        setSel(null);
        setHint(null);
      } else {
        const next: DragState = { ...current, x, y, over: dropColumnAt(x, y) };
        dragRef.current = next;
        setDrag(next);
      }
      if (e.cancelable) e.preventDefault();
    };

    const end = (drop: boolean) => {
      const started = dragRef.current;
      pendingRef.current = null;
      dragRef.current = null;
      if (!started) return;
      setDrag(null);
      suppressClick.current = true;
      window.setTimeout(() => { suppressClick.current = false; }, 0);
      if (drop && started.over !== null) tryMoveRef.current(started.from, started.count, started.over);
    };

    const onUp = () => end(true);
    const onCancel = () => end(false);
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
  }, []);

  /** 按下牌面: 先记下候选拖拽, 指针移动超阀值后才真正拖起来 */
  const startDrag = (col: number, count: number, e: React.PointerEvent<HTMLElement>) => {
    // 只响应左键 / 触摸 (jsdom 等环境里 button 可能是 undefined)
    if (won || (typeof e.button === 'number' && e.button > 0)) return;
    const pile = state.tableau[col] ?? [];
    const cards = pile.slice(Math.max(0, pile.length - count));
    if (!cards.length || !cards.every((card) => card.faceUp)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const { x, y } = pointerPos(e);
    pendingRef.current = {
      from: col,
      count,
      start: pile.length - count,
      cards,
      x,
      y,
      offX: Number.isFinite(x) ? Math.max(0, x - rect.left) : 0,
      offY: Number.isFinite(y) ? Math.max(0, y - rect.top) : 0,
    };
  };

  const isDragSource = (col: number, index: number): boolean =>
    !!drag && drag.from === col && index >= drag.start;

  // ---- 开局 / 重开 ----
  const startGame = useCallback((n: unknown, suits?: Difficulty) => {
    const value = normalizeSeed(n);
    const difficulty = suits ?? state.suits;
    clearDrag();
    setSeed(value);
    setSeedInput(value);
    setLastSeed(value);
    setState(dealFromSeed(value, difficulty));
    setHistory([]);
    setSel(null);
    setHint(null);
    setElapsed(0);
    setRunning(false);
    setWon(false);
    setRecords(recordPlay());
  }, [ clearDrag, state.suits ]);

  const undo = useCallback(() => {
    if (!history.length) return;
    clearDrag();
    const prev = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setState(prev);
    setSel(null);
    setHint(null);
    setWon(false);
    if (!running && prev.moves > 0) setRunning(true);
  }, [ history, running, clearDrag ]);

  const dealRow = useCallback(() => {
    const result = dealStock(state, { strictDeal: opts.strictDeal, autoCollect: opts.autoCollect });
    if (!result.ok) {
      message.warning(result.reason === 'empty' ? t('有空列时不能发牌, 先把空列填上') : t('牌堆已经空了'));
      return;
    }
    pushHistory(state);
    setState(result.state);
    setSel(null);
    setHint(null);
    if (!running && !won) setRunning(true);
    finishIfWin(result.state, result.state.moves);
  }, [ state, opts, running, won, pushHistory, finishIfWin, t ]);

  const collectNow = useCallback(() => {
    const { state: next, collected } = collectCompleted(state);
    if (!collected) {
      message.info(t('还没有能收的同花顺'));
      return;
    }
    pushHistory(state);
    setState(next);
    setSel(null);
    setHint(null);
    finishIfWin(next, next.moves);
    message.success(tT('已收 {n} 组', { n: collected }));
  }, [ state, pushHistory, finishIfWin, t, tT ]);

  const showHint = useCallback(() => {
    const found = findHint(state, opts, true);
    setSel(null);
    if (!found) {
      setHint(null);
      message.info(t('没有可走的牌'));
      return;
    }
    if ('deal' in found) {
      setHint(null);
      message.info(t('没有可接的牌, 试试发一轮牌 (D)'));
      return;
    }
    setHint(found);
  }, [ state, opts, t ]);

  // ---- 全屏 (原生全屏不可用时用窗口内全屏兜底) ----
  const exitFull = useCallback(() => {
    setFull(false);
    const doc = document as FullscreenDocument;
    const activeFull = doc.fullscreenElement ?? doc.webkitFullscreenElement;
    if (!activeFull) return;
    try {
      Promise.resolve(doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.()).catch(() => undefined);
    } catch {
      /* 忽略 */
    }
  }, []);

  useEffect(() => {
    if (!full) return;
    const el = stageRef.current as FullscreenElement | null;
    const request = el?.requestFullscreen?.bind(el) ?? el?.webkitRequestFullscreen?.bind(el);
    if (!request) return;
    try {
      Promise.resolve(request()).catch(() => undefined);
    } catch {
      /* 忽略: CSS 已铺满视口 */
    }
  }, [ full ]);

  useEffect(() => {
    const onChange = () => {
      const doc = document as FullscreenDocument;
      if (!doc.fullscreenElement && !doc.webkitFullscreenElement) setFull(false);
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
    if (!active && full) exitFull();
  }, [ active, full, exitFull ]);

  // ---- 键盘 ----
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target as HTMLElement | null)) return;
      if (e.key === 'Escape') {
        if (full) exitFull();
        return;
      }
      const action = keyToAction(e);
      if (!action) return;
      e.preventDefault();
      if (action === 'new') startGame(randomSeed());
      else if (action === 'restart') startGame(seed);
      else if (action === 'undo') undo();
      else if (action === 'hint') showHint();
      else if (action === 'deal') dealRow();
      else collectNow();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [ active, full, seed, startGame, undo, showHint, dealRow, collectNow, exitFull ]);

  // ---- 点击交互 ----
  const clickCard = (col: number, index: number) => {
    if (suppressClick.current || won) return;
    const card = state.tableau[col]?.[index];
    if (!card || !card.faceUp) {
      clickColumn(col);
      return;
    }
    if (sel && sel.col !== col) {
      if (tryMove(sel.col, sel.count, col)) return;
    }
    const run = runFrom(state, col, index);
    if (!run) {
      setSel(null);
      message.info(t('只能移动同花色的降序连牌'));
      return;
    }
    if (sel && sel.col === col && sel.start === index) {
      setSel(null);
      return;
    }
    setSel({ col, start: index, count: run.length });
    setHint(null);
  };

  const clickColumn = (col: number) => {
    if (suppressClick.current || won) return;
    if (sel && sel.col !== col) {
      if (tryMove(sel.col, sel.count, col)) return;
    }
    setSel(null);
  };

  /** 双击: 找一列能接住它的牌桌列放过去 */
  const doubleClick = (col: number, count = 1) => {
    if (won || !opts.doubleClick) return;
    const pile = state.tableau[col] ?? [];
    const moving = pile[pile.length - count];
    if (!moving) return;
    const order = [ ...state.tableau.keys() ].sort(
      (a, b) => (state.tableau[a].length ? 1 : 0) - (state.tableau[b].length ? 1 : 0)
    );
    for (const target of order) {
      if (target === col) continue;
      if (tryMove(col, count, target)) return;
    }
  };

  // ---- 渲染辅助 ----
  const selectedCard = (col: number, index: number): boolean =>
    !!sel && sel.col === col && index >= sel.start;

  const hintKeys = useMemo(() => {
    const keys = new Set<string>();
    if (!hint) return keys;
    const src = state.tableau[hint.from] ?? [];
    for (const card of src.slice(Math.max(0, src.length - hint.count))) keys.add(cardId(card));
    const dst = state.tableau[hint.to] ?? [];
    const dstTop = dst[dst.length - 1];
    if (dstTop) keys.add(cardId(dstTop));
    return keys;
  }, [ hint, state ]);

  const stuck = useMemo(
    () => !won && state.moves > 0 && isStuck(state, opts),
    [ state, won, opts ]
  );

  /** 一张牌的牌面 (ghost = 拖拽时跟随指针的幽灵牌, 不带 testid 以免与牌堆里的重复) */
  const face = (
    card: CardData,
    extra: {
      selected?: boolean;
      dragging?: boolean;
      ghost?: boolean;
      style?: React.CSSProperties;
      onClick?: React.MouseEventHandler;
      onDoubleClick?: React.MouseEventHandler;
      onPointerDown?: React.PointerEventHandler<HTMLDivElement>;
    }
  ) => (
    <div
      key={ cardId(card) }
      className={ `sp-card ${isRedCard(card) ? 'is-red' : 'is-black'}`
        + `${card.faceUp ? '' : ' is-down'}${extra.selected ? ' is-selected' : ''}`
        + `${hintKeys.has(cardId(card)) ? ' is-hint' : ''}`
        + `${extra.dragging ? ' is-dragging' : ''}${extra.ghost ? ' sp-card-ghost' : ''}` }
      style={ extra.style }
      data-testid={ extra.ghost ? undefined : `card-${cardId(card)}` }
      data-card={ extra.ghost ? undefined : cardId(card) }
      data-suit={ extra.ghost ? undefined : card.suit }
      data-rank={ extra.ghost ? undefined : card.rank }
      data-up={ extra.ghost ? undefined : (card.faceUp ? '1' : '0') }
      data-selected={ extra.ghost ? undefined : (extra.selected ? '1' : '0') }
      onClick={ extra.onClick }
      onDoubleClick={ extra.onDoubleClick }
      onPointerDown={ extra.onPointerDown }
    >
      { card.faceUp ? (
        <>
          <span className="sp-rank">{ RANK_LABEL[card.rank] }{ SUIT_SYMBOL[card.suit] }</span>
          <span className="sp-suit-big">{ SUIT_SYMBOL[card.suit] }</span>
          <span className="sp-suit-mini">{ RANK_LABEL[card.rank] }</span>
        </>
      ) : null }
    </div>
  );

  const stat = (label: string, value: React.ReactNode, testId: string) => (
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
      <div style={ { fontSize: 17, fontWeight: 700, lineHeight: '24px' } } data-testid={ testId }>{ value }</div>
    </div>
  );

  const stageVars = (fullscreen: boolean) => ({
    '--sp-w': fullscreen ? CARD_SIZE_CSS_FULL : CARD_SIZE_CSS,
    '--sp-h': `calc(${fullscreen ? CARD_SIZE_CSS_FULL : CARD_SIZE_CSS} * 1.4)`,
    '--sp-fan-up': `calc(${fullscreen ? CARD_SIZE_CSS_FULL : CARD_SIZE_CSS} * 0.3)`,
    '--sp-fan-down': `calc(${fullscreen ? CARD_SIZE_CSS_FULL : CARD_SIZE_CSS} * 0.13)`,
    '--sp-bg': token.colorBgLayout,
    '--sp-card-bg': '#ffffff',
  }) as React.CSSProperties;

  // ---- 各部分 ----
  const difficultyOptions = DIFFICULTIES.map((d) => ({
    value: d,
    label: d === 1 ? t('一花色 (简单)') : d === 2 ? t('两花色 (中等)') : t('四花色 (困难)'),
  }));

  const seedNode = (
    <Space size={ 6 } wrap align="center">
      <Text type="secondary" style={ { fontSize: 12 } }>{ t('局号') }</Text>
      <InputNumber
        size="small"
        min={ SEED_MIN }
        max={ SEED_MAX }
        precision={ 0 }
        value={ seedInput }
        onChange={ (v) => setSeedInput(typeof v === 'number' ? v : null) }
        style={ { width: 116 } }
        data-testid="spider-seed"
      />
      <Tooltip title={ t('难度') }>
        <Select
          size="small"
          style={ { width: 128 } }
          value={ state.suits }
          options={ difficultyOptions }
          onChange={ (v) => {
            setOpts(patchDefaultOptions({ suits: v }));
            startGame(seedInput ?? seed, v);
          } }
          data-testid="spider-difficulty"
        />
      </Tooltip>
      <Tooltip title={ t('发牌') }>
        <Button size="small" icon={ <PlaySquareOutlined /> } onClick={ () => startGame(seedInput ?? seed) }>
          { t('发牌') }
        </Button>
      </Tooltip>
      <Tooltip title={ t('新局 (N)') }>
        <Button size="small" type="primary" icon={ <PlusCircleOutlined /> } onClick={ () => startGame(randomSeed()) }>
          { t('新局 (N)') }
        </Button>
      </Tooltip>
      <Tooltip title={ t('重开本局 (R)') }>
        <Button size="small" icon={ <ReloadOutlined /> } onClick={ () => startGame(seed) }>{ t('重开本局 (R)') }</Button>
      </Tooltip>
      <Tooltip title={ t('撤销 (Z)') }>
        <Button size="small" icon={ <UndoOutlined /> } disabled={ !history.length || won } onClick={ undo }>
          { t('撤销 (Z)') }
        </Button>
      </Tooltip>
      <Tooltip title={ t('提示 (H)') }>
        <Button size="small" icon={ <BulbOutlined /> } disabled={ won } onClick={ showHint }>{ t('提示 (H)') }</Button>
      </Tooltip>
      <Tooltip title={ t('发一轮牌 (D)') }>
        <Button
          size="small"
          icon={ <DownloadOutlined /> }
          disabled={ won || !state.stock.length }
          onClick={ dealRow }
        >
          { t('发一轮牌 (D)') }
        </Button>
      </Tooltip>
      <Tooltip title={ t('收牌 (C)') }>
        <Button size="small" disabled={ won } onClick={ collectNow }>{ t('收牌 (C)') }</Button>
      </Tooltip>
    </Space>
  );

  const statsNode = (
    <Space size={ 8 } wrap>
      { stat(t('用时'), formatTime(elapsed), 'stat-time') }
      { stat(t('步数'), state.moves, 'stat-moves') }
      { stat(t('已收牌'), `${collectedCount(state)}/${SERIES_COUNT}`, 'stat-collected') }
    </Space>
  );

  const recordsNode = (
    <Space size={ 4 } wrap>
      <Tag color="blue">{ tT('胜利 {n} 次', { n: records.wins }) }</Tag>
      <Tag>{ records.bestTimeMs > 0
        ? tT('最快 {t}', { t: formatTime(records.bestTimeMs) })
        : t('暂无记录') }</Tag>
      <Tag>{ records.bestMoves > 0 ? tT('最少 {n} 步', { n: records.bestMoves }) : t('暂无记录') }</Tag>
    </Space>
  );

  const stockNode = (
    <Space size={ 8 } align="center" data-testid="spider-stock-wrap">
      <div
        className={ `sp-slot sp-stock${state.stock.length ? '' : ' is-empty'}` }
        data-testid="spider-stock"
        data-count={ state.stock.length }
        onClick={ dealRow }
        title={ t('发一轮牌 (D)') }
      >
        { state.stock.length ? (
          <div className="sp-card is-down" style={ { cursor: 'pointer' } } />
        ) : (
          <Text type="secondary" style={ { fontSize: 11 } }>{ t('牌堆') }</Text>
        ) }
      </div>
      <div>
        <div style={ { fontSize: 12, color: token.colorTextSecondary } }>
          { tT('还剩 {n} 张', { n: state.stock.length }) }
        </div>
        <div style={ { fontSize: 12, color: token.colorTextSecondary } }>
          { tT('还能发 {n} 轮', { n: dealsLeft(state) }) }
        </div>
      </div>
      <div style={ { display: 'flex', gap: 4, flexWrap: 'wrap' } } data-testid="spider-done">
        { Array.from({ length: SERIES_COUNT }, (_, i) => {
          const suit = state.done[i];
          return (
            <div
              key={ `done-${i}` }
              className={ `sp-mini${suit ? '' : ' is-empty'}` }
              data-testid={ `done-${i}` }
              data-filled={ suit ? '1' : '0' }
              style={ { color: suit && IS_RED[suit] ? '#cf1322' : '#1f2933' } }
            >
              { suit ? `K${SUIT_SYMBOL[suit]}` : '' }
            </div>
          );
        }) }
      </div>
    </Space>
  );

  const boardNode = (
    <Space direction="vertical" size={ 10 } style={ { width: '100%' } }>
      <div className="sp-row" style={ { justifyContent: 'space-between' } } data-testid="spider-top">
        { stockNode }
      </div>
      <div className="sp-row" data-testid="spider-tableau">
        { state.tableau.map((pile, col) => {
          // 盖着 / 翻开的牌错位不同, 逐张累计偏移 (用 CSS 变量倍数表示, 避免读实际像素)
          let upBefore = 0;
          let downBefore = 0;
          const positions = pile.map((card) => {
            const at = { up: upBefore, down: downBefore };
            if (card.faceUp) upBefore += 1;
            else downBefore += 1;
            return at;
          });
          const last = positions[positions.length - 1] ?? { up: 0, down: 0 };
          const offsetCss = (p: { up: number; down: number }) =>
            `calc(${p.up} * var(--sp-fan-up) + ${p.down} * var(--sp-fan-down))`;
          return (
            <div
              key={ `col-${col}` }
              className={ `sp-col${pile.length ? '' : ' is-empty'}${drag?.over === col ? ' is-drop' : ''}` }
              style={ { height: `calc(var(--sp-h) + ${offsetCss(last)})` } }
              data-testid={ `tableau-${col}` }
              data-drop={ col }
              data-count={ pile.length }
              data-up={ pile.filter((card) => card.faceUp).length }
              onClick={ () => clickColumn(col) }
            >
              { pile.map((card, i) => {
                const run = card.faceUp ? runFrom(state, col, i) : null;
                return face(card, {
                  selected: selectedCard(col, i),
                  dragging: isDragSource(col, i),
                  style: { position: 'absolute', left: 0, top: offsetCss(positions[i]), zIndex: i },
                  onPointerDown: (e) => {
                    if (run) startDrag(col, run.length, e);
                  },
                  onClick: (e) => { e.stopPropagation(); clickCard(col, i); },
                  onDoubleClick: (e) => {
                    e.stopPropagation();
                    // 双击连牌里任意一张, 都把整段连牌搬走
                    if (run) doubleClick(col, run.length);
                  },
                });
              }) }
            </div>
          );
        }) }
      </div>
    </Space>
  );

  const winNode = won ? (
    <Alert
      type="success"
      showIcon
      message={ t('恭喜通关!') }
      description={ tT('本局用时 {t}, 共 {n} 步', { t: formatTime(elapsed), n: state.moves }) }
      action={ (
        <Space size={ 6 } wrap>
          <Button size="small" type="primary" onClick={ () => startGame(randomSeed()) }>{ t('再玩一局') }</Button>
          <Button size="small" onClick={ () => startGame(seed) }>{ t('重玩本局') }</Button>
        </Space>
      ) }
    />
  ) : null;

  const stuckNode = stuck && !won ? (
    <Alert
      type="warning"
      showIcon
      message={ t('无路可走, 可撤销 (Z) 或重开本局 (R)') }
      action={ (
        <Space size={ 6 }>
          <Button size="small" disabled={ !history.length } onClick={ undo }>{ t('撤销 (Z)') }</Button>
          <Button size="small" onClick={ () => startGame(seed) }>{ t('重开本局 (R)') }</Button>
        </Space>
      ) }
    />
  ) : null;

  const hintText = (
    <Space direction="vertical" size={ 2 }>
      <Text type="secondary" style={ { fontSize: 12 } }>{ t('拖动牌到目标列, 或选中牌后点击目标列即可移动') }</Text>
      <Text type="secondary" style={ { fontSize: 12 } }>{ t('拖动时会高亮可放下的位置, 无效位置会弹回') }</Text>
      <Text type="secondary" style={ { fontSize: 12 } }>{ t('双击一张牌可自动移到能接住它的列') }</Text>
      <Text type="secondary" style={ { fontSize: 12 } }>{ t('凑齐 K 到 A 的同花顺会自动收走, 收满 8 组即通关') }</Text>
      <Text type="secondary" style={ { fontSize: 12 } }>
        { t('键盘: N 新局 · R 重开本局 · Z 撤销 · H 提示 · D 发一轮牌 · C 收牌') }
      </Text>
    </Space>
  );

  /** 拖拽时跟随指针的幽灵牌层 (fixed 定位, 不接事件, 避免影响 elementFromPoint) */
  const ghostNode = drag ? (
    <div
      className="sp-drag-layer"
      data-testid="spider-drag"
      style={ {
        ...stageVars(full),
        left: finiteOrUndefined(drag.x - drag.offX),
        top: finiteOrUndefined(drag.y - drag.offY),
        width: 'var(--sp-w)',
        height: drag.cards.length > 1
          ? `calc(var(--sp-h) + ${drag.cards.length - 1} * var(--sp-fan-up))`
          : undefined,
      } }
    >
      { drag.cards.map((card, i) => face(card, {
        ghost: true,
        style: { top: `calc(${i} * var(--sp-fan-up))` },
      })) }
    </div>
  ) : null;

  // ---- 全屏: 只保留牌桌与统计 ----
  if (full) {
    return (
      <>
        <style>{ SP_CSS }</style>
        <div ref={ stageRef } className="sp-stage sp-full" data-testid="spider-full" style={ stageVars(true) }>
          <div style={ { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' } }>
            <Space size={ 6 } wrap>
              { statsNode }
              { recordsNode }
            </Space>
            <Button size="small" icon={ <FullscreenExitOutlined /> } onClick={ exitFull }>{ t('退出全屏') }</Button>
          </div>
          { boardNode }
          <div style={ { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' } }>
            { seedNode }
          </div>
          { winNode }
          { stuckNode }
          <Text type="secondary" style={ { fontSize: 12, textAlign: 'center' } }>{ t('Esc 退出全屏') }</Text>
          {/* 幽灵牌层必须在全屏元素内部, 否则全屏时会被裁掉 */}
          { ghostNode }
        </div>
      </>
    );
  }

  return (
    <div className="sp-stage" style={ stageVars(false) }>
      <style>{ SP_CSS }</style>
      <Space direction="vertical" size={ 16 } style={ { width: '100%' } }>
        <Card
          size="small"
          title={ t('蜘蛛纸牌') }
          extra={ (
            <Space size={ 6 } wrap>
              { recordsNode }
              <Button size="small" icon={ <FullscreenOutlined /> } onClick={ () => setFull(true) }>{ t('全屏') }</Button>
            </Space>
          ) }
        >
          <Space direction="vertical" size={ 12 } style={ { width: '100%' } }>
            <div style={ { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', alignItems: 'center' } }>
              { seedNode }
              { statsNode }
            </div>
            { boardNode }
            { winNode }
            { stuckNode }
            { hintText }
          </Space>
        </Card>

        <Divider>{ t('蜘蛛纸牌说明') }</Divider>
        <SpiderSolitaireIntro />
      </Space>
      { ghostNode }
    </div>
  );
};

export default SpiderSolitaire;
