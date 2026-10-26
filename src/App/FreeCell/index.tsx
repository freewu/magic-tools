// 空档接龙 (FreeCell): 经典纸牌, 8 列牌桌 + 4 自由格 + 4 收集区
// 规则参考 https://theworldatplay.com/zh-CN/freecell
// 说明: 规则计算全部在 lib.ts (纯函数), 本文件只做渲染与键盘 / 计时 / 全屏等副作用
import { Alert, Button, Card, Divider, InputNumber, Space, Tag, Tooltip, Typography, message, theme } from 'antd';
import {
  BulbOutlined, DownloadOutlined, FullscreenExitOutlined, FullscreenOutlined, PlaySquareOutlined,
  PlusCircleOutlined, ReloadOutlined, UndoOutlined,
} from '@ant-design/icons';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppContext } from '../../hook/app-context';
import { useLocale } from '../../hook/locale-context';
import {
  CARD_SIZE_CSS, CARD_SIZE_CSS_FULL, FC_CSS, HISTORY_LIMIT, IS_RED, RANK_LABEL, SEED_MAX, SEED_MIN,
  SUIT_SYMBOL, SUITS, type Suit,
} from './data';
import {
  applyMove, autoCollect, canMove, cardId, cloneState, collectedCount, dealFromSeed, findHint, formatTime,
  foundationIndex, getDefaultOptions, getLastSeed, getRecords, hasAnyMove, isRedCard, isTypingTarget, isWin,
  keyToAction, normalizeSeed, pileOf, randomSeed, recordPlay, recordWin, runFrom, setLastSeed,
  type Card as CardData, type FreeCellRecords, type GameState, type Move, type PileRef,
} from './lib';
import { u, uT } from './lang';
import FreeCellIntro from './intro';

const { Text } = Typography;

type FullscreenElement = HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

/** 当前选中的来源: 牌桌一段连牌 / 自由格一张 / 收集区顶牌 */
type Selection =
  | { kind: 'tableau'; col: number; start: number; count: number }
  | { kind: 'free'; index: number; count: number }
  | { kind: 'foundation'; index: number; count: number };

const refOf = (sel: Selection): PileRef =>
  sel.kind === 'tableau' ? { kind: 'tableau', index: sel.col } : { kind: sel.kind, index: sel.index };

/** 正在被拖动的牌组 */
type DragState = {
  from: PileRef;
  count: number;
  /** 牌桌列里这段连牌的起始下标 (自由格 / 收集区固定为 0) */
  start: number;
  cards: CardData[];
  /** 当前指针位置与指针相对被抓那张牌左上角的偏移 (幽灵牌跟手) */
  x: number;
  y: number;
  offX: number;
  offY: number;
  /** 指针当前悬停的落点 */
  over: PileRef | null;
};

/** 移动超过该距离才算拖拽, 否则视为点击 */
const DRAG_THRESHOLD = 5;

const parseDropKey = (key: string | undefined): PileRef | null => {
  if (!key) return null;
  const [ kind, raw ] = key.split('-');
  const index = Number(raw);
  if (!Number.isFinite(index)) return null;
  if (kind !== 'tableau' && kind !== 'free' && kind !== 'foundation') return null;
  return { kind, index };
};

/** 指针位置下的可落位牌堆 (靠容器上的 data-drop 标记) */
const dropTargetAt = (x: number, y: number): PileRef | null => {
  const doc = document as Document & { elementFromPoint?: (px: number, py: number) => Element | null };
  if (typeof doc.elementFromPoint !== 'function') return null;
  let el: Element | null = null;
  try {
    el = doc.elementFromPoint(x, y);
  } catch {
    return null;
  }
  const holder = el?.closest?.('[data-drop]') as HTMLElement | null | undefined;
  return parseDropKey(holder?.dataset?.drop);
};

const FreeCell: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tT = (zh: string, vars: Record<string, string | number>) => uT(locale, zh, vars);
  const { token } = theme.useToken();
  // 页面在 KeepAlive 容器中常驻: 只有当前显示本应用时才响应全局键盘事件
  const appCtx = useContext(AppContext);
  const active = appCtx ? appCtx.app === 'FreeCell' : true;

  const [ opts ] = useState(() => getDefaultOptions());
  const [ seed, setSeed ] = useState<number>(() => getLastSeed());
  const [ seedInput, setSeedInput ] = useState<number | null>(() => getLastSeed());
  const [ state, setState ] = useState<GameState>(() => dealFromSeed(getLastSeed()));
  const [ history, setHistory ] = useState<GameState[]>([]);
  const [ sel, setSel ] = useState<Selection | null>(null);
  const [ hint, setHint ] = useState<Move | null>(null);
  const [ elapsed, setElapsed ] = useState(0);
  const [ running, setRunning ] = useState(false);
  const [ won, setWon ] = useState(false);
  const [ records, setRecords ] = useState<FreeCellRecords>(() => getRecords());
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

  /** 执行一步移动 (自动收牌开启时顺带收掉安全牌); 成功返回 true */
  const commit = useCallback((move: Move): boolean => {
    const next = applyMove(state, move, { superMove: opts.superMove });
    if (!next) return false;
    const after = opts.autoCollect ? autoCollect(next, true).state : next;
    pushHistory(state);
    setState(after);
    setSel(null);
    setHint(null);
    if (!running && !won) setRunning(true);
    finishIfWin(after, after.moves);
    return true;
  }, [ state, opts, running, won, pushHistory, finishIfWin ]);

  /** 移动并自动把收集区下标落到发起牌的花色上 */
  const tryMove = useCallback((from: PileRef, count: number, to: PileRef): boolean => {
    const source = pileOf(state, from);
    const moving = source[source.length - count];
    if (!moving) return false;
    const target: PileRef = to.kind === 'foundation'
      ? { kind: 'foundation', index: foundationIndex(moving.suit) }
      : to;
    if (!canMove(state, { from, to: target, count }, { superMove: opts.superMove })) return false;
    return commit({ from, to: target, count });
  }, [ state, opts.superMove, commit ]);

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
      if (!current) {
        // 未过阀值: 仍然当作点击, 不进入拖拽
        if (Math.abs(e.clientX - pending.x) < DRAG_THRESHOLD
          && Math.abs(e.clientY - pending.y) < DRAG_THRESHOLD) return;
        const started: DragState = { ...pending, x: e.clientX, y: e.clientY, over: dropTargetAt(e.clientX, e.clientY) };
        dragRef.current = started;
        setDrag(started);
        setSel(null);
        setHint(null);
      } else {
        const next: DragState = { ...current, x: e.clientX, y: e.clientY, over: dropTargetAt(e.clientX, e.clientY) };
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
      if (drop && started.over) tryMoveRef.current(started.from, started.count, started.over);
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
  const startDrag = (ref: PileRef, count: number, e: React.PointerEvent<HTMLElement>) => {
    // 只响应左键 / 触摸 (jsdom 等环境里 button 可能是 undefined)
    if (won || (typeof e.button === 'number' && e.button > 0)) return;
    const pile = pileOf(state, ref);
    const cards = pile.slice(Math.max(0, pile.length - count));
    if (!cards.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    pendingRef.current = {
      from: ref,
      count,
      start: ref.kind === 'tableau' ? pile.length - count : 0,
      cards,
      x: e.clientX,
      y: e.clientY,
      offX: Math.max(0, e.clientX - rect.left),
      offY: Math.max(0, e.clientY - rect.top),
    };
  };

  const isDragSource = (ref: PileRef, index: number): boolean => {
    if (!drag || drag.from.kind !== ref.kind || drag.from.index !== ref.index) return false;
    return ref.kind === 'tableau' ? index >= drag.start : true;
  };

  const isDropTarget = (ref: PileRef): boolean =>
    !!drag?.over && drag.over.kind === ref.kind && drag.over.index === ref.index;

  // ---- 开局 / 重开 ----
  const startGame = useCallback((n: unknown) => {
    const value = normalizeSeed(n);
    clearDrag();
    setSeed(value);
    setSeedInput(value);
    setLastSeed(value);
    setState(dealFromSeed(value));
    setHistory([]);
    setSel(null);
    setHint(null);
    setElapsed(0);
    setRunning(false);
    setWon(false);
    setRecords(recordPlay());
  }, [ clearDrag ]);

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

  const collectNow = useCallback(() => {
    const { state: next, played } = autoCollect(state, true);
    if (!played) {
      message.info(t('暂无可自动收的牌'));
      return;
    }
    pushHistory(state);
    setState(next);
    setSel(null);
    setHint(null);
    if (!running && !won) setRunning(true);
    finishIfWin(next, next.moves);
    message.success(tT('已收 {n} 张牌', { n: played }));
  }, [ state, running, won, pushHistory, finishIfWin, t, tT ]);

  const showHint = useCallback(() => {
    const move = findHint(state, opts.superMove);
    setSel(null);
    if (!move) {
      setHint(null);
      message.info(t('没有可走的牌'));
      return;
    }
    setHint(move);
  }, [ state, opts.superMove, t ]);

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
      else collectNow();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [ active, full, seed, startGame, undo, showHint, collectNow, exitFull ]);

  // ---- 点击交互 ----
  const clickTableauCard = (col: number, index: number) => {
    if (suppressClick.current || won) return;
    if (sel && !(sel.kind === 'tableau' && sel.col === col)) {
      if (tryMove(refOf(sel), sel.count, { kind: 'tableau', index: col })) return;
    }
    const run = runFrom(state, col, index);
    if (!run) {
      setSel(null);
      message.info(t('只能移动连续的降序异色牌组'));
      return;
    }
    if (sel && sel.kind === 'tableau' && sel.col === col && sel.start === index) {
      setSel(null);
      return;
    }
    setSel({ kind: 'tableau', col, start: index, count: run.length });
    setHint(null);
  };

  const clickColumn = (col: number) => {
    if (suppressClick.current || won) return;
    if (sel && tryMove(refOf(sel), sel.count, { kind: 'tableau', index: col })) return;
    setSel(null);
  };

  const clickFree = (index: number) => {
    if (suppressClick.current || won) return;
    if (sel && tryMove(refOf(sel), sel.count, { kind: 'free', index })) return;
    const card = state.free[index];
    setHint(null);
    setSel(card ? { kind: 'free', index, count: 1 } : null);
  };

  const clickFoundation = (index: number) => {
    if (suppressClick.current || won) return;
    if (sel && tryMove(refOf(sel), sel.count, { kind: 'foundation', index })) return;
    const pile = state.foundations[index];
    setHint(null);
    setSel(pile.length ? { kind: 'foundation', index, count: 1 } : null);
  };

  /** 双击: 收集区 -> 能接住它的牌桌列 -> 空自由格 */
  const doubleClick = (ref: PileRef, count = 1) => {
    if (won || !opts.doubleClick) return;
    const source = pileOf(state, ref);
    const moving = source[source.length - count];
    if (!moving) return;
    if (tryMove(ref, count, { kind: 'foundation', index: foundationIndex(moving.suit) })) return;
    const order = [ ...state.tableau.keys() ].sort(
      (a, b) => (state.tableau[a].length ? 1 : 0) - (state.tableau[b].length ? 1 : 0)
    );
    for (const col of order) {
      if (ref.kind === 'tableau' && ref.index === col) continue;
      if (tryMove(ref, count, { kind: 'tableau', index: col })) return;
    }
    for (let i = 0; i < state.free.length; i += 1) {
      if (ref.kind === 'free' && ref.index === i) continue;
      if (tryMove(ref, count, { kind: 'free', index: i })) return;
    }
  };

  // ---- 渲染辅助 ----
  const selectedCard = (nextRef: PileRef, index: number): boolean => {
    if (!sel) return false;
    if (sel.kind === 'tableau') return nextRef.kind === 'tableau' && sel.col === nextRef.index && index >= sel.start;
    return sel.kind === nextRef.kind && sel.index === nextRef.index;
  };

  const hintKeys = useMemo(() => {
    const keys = new Set<string>();
    if (!hint) return keys;
    const src = pileOf(state, hint.from);
    for (const card of src.slice(Math.max(0, src.length - hint.count))) keys.add(cardId(card));
    const dst = pileOf(state, hint.to);
    const dstTop = dst[dst.length - 1];
    if (dstTop) keys.add(cardId(dstTop));
    return keys;
  }, [ hint, state ]);

  const isHintTarget = (ref: PileRef): boolean =>
    !!hint && hint.to.kind === ref.kind && hint.to.index === ref.index;

  const stuck = useMemo(
    () => !won && state.moves > 0 && !hasAnyMove(state, opts.superMove, false),
    [ state, won, opts.superMove ]
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
      className={ `fc-card ${isRedCard(card) ? 'is-red' : 'is-black'}`
        + `${extra.selected ? ' is-selected' : ''}${hintKeys.has(cardId(card)) ? ' is-hint' : ''}`
        + `${extra.dragging ? ' is-dragging' : ''}${extra.ghost ? ' fc-card-ghost' : ''}` }
      style={ extra.style }
      data-testid={ extra.ghost ? undefined : `card-${cardId(card)}` }
      data-card={ extra.ghost ? undefined : cardId(card) }
      data-selected={ extra.ghost ? undefined : (extra.selected ? '1' : '0') }
      onClick={ extra.onClick }
      onDoubleClick={ extra.onDoubleClick }
      onPointerDown={ extra.onPointerDown }
    >
      <span className="fc-rank">{ RANK_LABEL[card.rank] }{ SUIT_SYMBOL[card.suit] }</span>
      <span className="fc-suit-big">{ SUIT_SYMBOL[card.suit] }</span>
      <span className="fc-suit-mini">{ RANK_LABEL[card.rank] }</span>
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

  // ---- 各部分 ----
  const seedNode = (
    <Space size={ 6 } wrap>
      <InputNumber
        size="small"
        min={ SEED_MIN }
        max={ SEED_MAX }
        precision={ 0 }
        value={ seedInput }
        onChange={ (v) => setSeedInput(typeof v === 'number' ? v : null) }
        addonBefore={ t('局号') }
        style={ { width: 168 } }
        data-testid="freecell-seed"
      />
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
      <Tooltip title={ t('自动收牌 (A)') }>
        <Button size="small" icon={ <DownloadOutlined /> } disabled={ won } onClick={ collectNow }>
          { t('自动收牌 (A)') }
        </Button>
      </Tooltip>
    </Space>
  );

  const statsNode = (
    <Space size={ 8 } wrap>
      { stat(t('用时'), formatTime(elapsed), 'stat-time') }
      { stat(t('步数'), state.moves, 'stat-moves') }
      { stat(t('已收牌'), `${collectedCount(state)}/52`, 'stat-collected') }
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

  const boardNode = (
    <Space direction="vertical" size={ 12 } style={ { width: '100%' } }>
      <div className="fc-row" style={ { justifyContent: 'center' } } data-testid="freecell-top">
        <div className="fc-row" style={ { gap: 8, justifyContent: 'flex-start' } } data-testid="freecell-free">
          { state.free.map((card, i) => (
            <div
              key={ `free-${i}` }
              className={ `fc-slot${card ? '' : ' fc-slot-empty'}${isDropTarget({ kind: 'free', index: i }) ? ' is-drop' : ''}` }
              style={ { display: 'flex' } }
              data-testid={ `free-${i}` }
              data-drop={ `free-${i}` }
              data-empty={ card ? '0' : '1' }
              onClick={ () => clickFree(i) }
              onDoubleClick={ card ? () => doubleClick({ kind: 'free', index: i }) : undefined }
            >
              { card ? face(card, {
                selected: selectedCard({ kind: 'free', index: i }, 0),
                dragging: isDragSource({ kind: 'free', index: i }, 0),
                onPointerDown: (e) => startDrag({ kind: 'free', index: i }, 1, e),
              }) : null }
            </div>
          )) }
        </div>
        <div className="fc-row" style={ { gap: 8, justifyContent: 'flex-start' } } data-testid="freecell-foundations">
          { state.foundations.map((pile, i) => {
            const suit = SUITS[i] as Suit;
            const card = pile[pile.length - 1];
            return (
              <div
                key={ `fnd-${suit}` }
                className={ `fc-slot${card ? '' : ' fc-slot-empty'}${isDropTarget({ kind: 'foundation', index: i }) ? ' is-drop' : ''}` }
                style={ {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  outline: isHintTarget({ kind: 'foundation', index: i }) ? '2px dashed #faad14' : undefined,
                } }
                data-testid={ `foundation-${suit}` }
                data-drop={ `foundation-${i}` }
                data-count={ pile.length }
                onClick={ () => clickFoundation(i) }
                onDoubleClick={ card ? () => doubleClick({ kind: 'foundation', index: i }) : undefined }
              >
                { card ? face(card, {
                  selected: selectedCard({ kind: 'foundation', index: i }, 0),
                  dragging: isDragSource({ kind: 'foundation', index: i }, 0),
                  onPointerDown: (e) => startDrag({ kind: 'foundation', index: i }, 1, e),
                }) : (
                  <span
                    style={ {
                      fontSize: 'calc(var(--fc-w) * 0.4)',
                      opacity: 0.35,
                      color: IS_RED[suit] ? '#cf1322' : token.colorTextSecondary,
                    } }
                  >
                    { SUIT_SYMBOL[suit] }
                  </span>
                ) }
              </div>
            );
          }) }
        </div>
      </div>

      <div className="fc-row" data-testid="freecell-tableau">
        { state.tableau.map((pile, col) => (
          <div
            key={ `col-${col}` }
            className={ `fc-col${pile.length ? '' : ' is-empty'}${isDropTarget({ kind: 'tableau', index: col }) ? ' is-drop' : ''}` }
            style={ {
              height: pile.length > 1 ? `calc(var(--fc-h) + ${pile.length - 1} * var(--fc-fan))` : undefined,
              outline: isHintTarget({ kind: 'tableau', index: col }) && !pile.length
                ? '2px dashed #faad14'
                : undefined,
            } }
            data-testid={ `tableau-${col}` }
            data-drop={ `tableau-${col}` }
            data-count={ pile.length }
            onClick={ () => clickColumn(col) }
          >
            { pile.map((card, i) => {
              const run = runFrom(state, col, i);
              return face(card, {
                selected: selectedCard({ kind: 'tableau', index: col }, i),
                dragging: isDragSource({ kind: 'tableau', index: col }, i),
                style: { position: 'absolute', left: 0, top: `calc(${i} * var(--fc-fan))`, zIndex: i },
                onPointerDown: (e) => {
                  if (run) startDrag({ kind: 'tableau', index: col }, run.length, e);
                },
                onClick: (e) => { e.stopPropagation(); clickTableauCard(col, i); },
                onDoubleClick: (e) => {
                  e.stopPropagation();
                  if (i === pile.length - 1) doubleClick({ kind: 'tableau', index: col }, 1);
                },
              });
            }) }
          </div>
        )) }
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
      <Text type="secondary" style={ { fontSize: 12 } }>{ t('拖动牌到目标位置, 或选中牌后点击目标位置即可移动') }</Text>
      <Text type="secondary" style={ { fontSize: 12 } }>{ t('拖动时会高亮可放下的位置, 无效位置会弹回') }</Text>
      <Text type="secondary" style={ { fontSize: 12 } }>{ t('双击一张牌可自动移动到收集区或牌桌') }</Text>
      <Text type="secondary" style={ { fontSize: 12 } }>
        { t('键盘: N 新局 · R 重开本局 · Z 撤销 · H 提示 · A 自动收牌') }
      </Text>
      <Text type="secondary" style={ { fontSize: 12 } }>{ t('只要还有可移动的牌就能继续, 玩到四叠收集区都收满 K 即通关') }</Text>
    </Space>
  );

  const stageVars = (fullscreen: boolean) => ({
    '--fc-w': fullscreen ? CARD_SIZE_CSS_FULL : CARD_SIZE_CSS,
    '--fc-h': `calc(${fullscreen ? CARD_SIZE_CSS_FULL : CARD_SIZE_CSS} * 1.4)`,
    '--fc-fan': `calc(${fullscreen ? CARD_SIZE_CSS_FULL : CARD_SIZE_CSS} * 0.3)`,
    '--fc-bg': token.colorBgLayout,
    '--fc-card-bg': '#ffffff',
  }) as React.CSSProperties;

  /** 拖拽时跟随指针的幽灵牌层 (fixed 定位, 不接事件, 避免影响 elementFromPoint) */
  const ghostNode = drag ? (
    <div
      className="fc-drag-layer"
      data-testid="freecell-drag"
      style={ {
        ...stageVars(full),
        left: drag.x - drag.offX,
        top: drag.y - drag.offY,
        width: 'var(--fc-w)',
        height: drag.cards.length > 1
          ? `calc(var(--fc-h) + ${drag.cards.length - 1} * var(--fc-fan))`
          : undefined,
      } }
    >
      { drag.cards.map((card, i) => face(card, {
        ghost: true,
        style: { top: `calc(${i} * var(--fc-fan))` },
      })) }
    </div>
  ) : null;

  // ---- 全屏: 只保留牌桌与统计 ----
  if (full) {
    return (
      <>
        <style>{ FC_CSS }</style>
        <div ref={ stageRef } className="fc-stage fc-full" data-testid="freecell-full" style={ stageVars(true) }>
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
    <div className="fc-stage" style={ stageVars(false) }>
      <style>{ FC_CSS }</style>
      <Space direction="vertical" size={ 16 } style={ { width: '100%' } }>
        <Card
          size="small"
          title={ t('空档接龙') }
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

        <Divider>{ t('空档接龙说明') }</Divider>
        <FreeCellIntro />
      </Space>
      { ghostNode }
    </div>
  );
};

export default FreeCell;
