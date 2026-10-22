// 2048: 经典数字合并游戏 (4×4 / 5×5 / 6×6)
// 规则参考 https://play2048.co/ : 相同数字相撞合并为两倍, 每次有效移动后随机生成 2 / 4
// 说明: 规则计算全部在 lib.ts (纯函数), 本文件只做渲染与键盘 / 触摸等副作用
import { Alert, Button, Card, Divider, Segmented, Space, Tag, Tooltip, Typography, theme } from 'antd';
import {
  ArrowDownOutlined, ArrowLeftOutlined, ArrowRightOutlined, ArrowUpOutlined,
  ReloadOutlined, UndoOutlined,
} from '@ant-design/icons';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppContext } from '../../hook/app-context';
import { useLocale } from '../../hook/locale-context';
import {
  ANIM_MS, BOARD_BG, BOARD_CSS, BOARD_GAP, BOARD_MAX_PX, BOARD_SIZES, CELL_BG, SWIPE_MIN_PX, UNDO_LIMIT,
  type BoardSize,
} from './data';
import {
  cellKey, clearState, dirOfKey, getBestScore, getDefaultOptions, hasReached, isGameOver, isTypingTarget,
  loadState, moveBoard, saveState, setBestScore, spawnTile, startBoard, tileColor, tileFontScale,
  type Board, type Direction, type GameOptions, type GameState,
} from './lib';
import { u, uT } from './lang';
import Game2048Intro from './intro';

const { Text } = Typography;

/** 方向按钮 (鼠标 / 触屏可点, 键盘方向键更常用) */
const DPAD: Array<{ dir: Direction; icon: React.ReactNode; area: string }> = [
  { dir: 'up', icon: <ArrowUpOutlined />, area: '1 / 2' },
  { dir: 'left', icon: <ArrowLeftOutlined />, area: '2 / 1' },
  { dir: 'down', icon: <ArrowDownOutlined />, area: '2 / 2' },
  { dir: 'right', icon: <ArrowRightOutlined />, area: '2 / 3' },
];

/** 首帧数据: 默认设置 + 本机存档 (无存档则开一局新的) + 最高分 */
const readInitial = (): { opts: GameOptions; game: GameState; best: number } => {
  const opts = getDefaultOptions();
  const saved = loadState(opts.size);
  const game: GameState = saved ?? { board: startBoard(opts.size).board, score: 0, won: false };
  return { opts, game, best: Math.max(getBestScore(opts.size), game.score) };
};

const Game2048: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tT = (zh: string, vars: Record<string, string | number>) => uT(locale, zh, vars);
  const { token } = theme.useToken();
  // 页面在 KeepAlive 容器中常驻: 只有当前显示本应用时才响应全局键盘事件
  const appCtx = useContext(AppContext);
  const active = appCtx ? appCtx.app === 'Game2048' : true;

  const initRef = useRef<ReturnType<typeof readInitial> | null>(null);
  if (initRef.current === null) initRef.current = readInitial();
  const init = initRef.current;

  /** 默认设置 (打开页面时读取一次; 修改默认设置后重开页面生效) */
  const [ opts ] = useState<GameOptions>(init.opts);
  /** 当前棋盘边长 (面板上可即时切换, 不影响默认设置) */
  const [ size, setSize ] = useState<BoardSize>(init.opts.size);
  const [ game, setGame ] = useState<GameState>(init.game);
  const [ best, setBest ] = useState<number>(init.best);
  const [ history, setHistory ] = useState<GameState[]>([]);
  const [ moves, setMoves ] = useState(0);
  /** 动画标记: keys = 本次合并的格子, spawn = 本次新生成的格子 */
  const [ fx, setFx ] = useState<{ keys: string[]; spawn: string | null }>({ keys: [], spawn: null });
  /** 已通关后是否选择继续挑战 (false 时棋盘停在结算状态, 不再响应移动) */
  const [ keepPlaying, setKeepPlaying ] = useState(false);

  const n = game.board.length;
  const over = isGameOver(game.board);
  /** 通关结算中 或 已无路可走: 棋盘锁定 */
  const locked = over || (game.won && !keepPlaying);

  const restart = useCallback((nextSize: BoardSize) => {
    setSize(nextSize);
    setGame({ board: startBoard(nextSize).board, score: 0, won: false });
    setBest(getBestScore(nextSize));
    setHistory([]);
    setMoves(0);
    setKeepPlaying(false);
    setFx({ keys: [], spawn: null });
    clearState(); // 重新开局后不保留上一局存档 (否则重开页面会回到旧对局)
  }, []);

  const applyMove = useCallback((dir: Direction) => {
    if (locked) return;
    const res = moveBoard(game.board, dir);
    if (!res.moved) return; // 无效移动: 不生成新方块, 也不记步
    const spawned = spawnTile(res.board);
    const board: Board = spawned?.board ?? res.board;
    const score = game.score + res.gained;
    const won = game.won || hasReached(board, opts.win);
    const next: GameState = { board, score, won };
    setHistory((h) => [ ...h, game ].slice(-UNDO_LIMIT));
    setMoves((m) => m + 1);
    setGame(next);
    setFx({
      keys: res.merges.map((m) => cellKey({ r: m.r, c: m.c })),
      spawn: spawned ? cellKey(spawned.tile) : null,
    });
    if (score > best) setBest(setBestScore(size, score)[String(size)] ?? score);
    saveState(next, size);
  }, [ game, locked, opts.win, best, size ]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setGame(prev);
    setMoves((m) => Math.max(0, m - 1));
    setKeepPlaying(false);
    setFx({ keys: [], spawn: null });
    saveState(prev, size);
  }, [ history, size ]);

  // 动画标记只保留一帧动画时长 (连续快速操作时以最后一次为准)
  useEffect(() => {
    if (fx.keys.length === 0 && fx.spawn === null) return;
    const id = window.setTimeout(() => setFx({ keys: [], spawn: null }), ANIM_MS);
    return () => window.clearTimeout(id);
  }, [ fx ]);

  // 键盘: 方向键 / WASD (输入框内不拦截)
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target as HTMLElement | null)) return;
      const dir = dirOfKey(e);
      if (!dir) return;
      e.preventDefault();
      applyMove(dir);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [ active, applyMove ]);

  // 触摸滑动
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t0 = e.touches[0];
    touchRef.current = t0 ? { x: t0.clientX, y: t0.clientY } : null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const from = touchRef.current;
    touchRef.current = null;
    const t1 = e.changedTouches[0];
    if (!from || !t1) return;
    const dx = t1.clientX - from.x;
    const dy = t1.clientY - from.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN_PX) return;
    applyMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  };

  const maxValue = game.board.reduce((m, row) => row.reduce((mm, v) => (v > mm ? v : mm), m), 0);
  const cellFont = (v: number) =>
    `calc((min(88vw, ${BOARD_MAX_PX}px) - ${BOARD_GAP * (n + 1)}px) / ${n} * ${tileFontScale(v)})`;

  const stat = (label: string, value: React.ReactNode) => (
    <div
      style={ {
        minWidth: 84,
        padding: '4px 12px',
        borderRadius: token.borderRadius,
        background: token.colorFillSecondary,
        textAlign: 'center',
      } }
    >
      <div style={ { fontSize: 12, color: token.colorTextSecondary, lineHeight: '16px' } }>{ label }</div>
      <div style={ { fontSize: 18, fontWeight: 700, lineHeight: '24px' } }>{ value }</div>
    </div>
  );

  return (
    <Space direction="vertical" size={ 16 } style={ { width: '100%' } }>
      <style>{ BOARD_CSS }</style>

      <Card
        size="small"
        title={ t('2048') }
        extra={
          <Space size={ 8 } wrap>
            <Button size="small" type="primary" icon={ <ReloadOutlined /> } onClick={ () => restart(size) }>
              { t('新游戏') }
            </Button>
            <Tooltip title={ t('回退上一步') }>
              <Button size="small" icon={ <UndoOutlined /> } disabled={ history.length === 0 } onClick={ undo }>
                { t('撤销') }
              </Button>
            </Tooltip>
          </Space>
        }
      >
        <Space direction="vertical" size={ 12 } style={ { width: '100%' } }>
          <Space size={ 12 } wrap align="center">
            { stat(t('分数'), game.score) }
            { stat(t('最高分'), best) }
            <Space size={ 6 } wrap>
              <Segmented
                size="small"
                value={ size }
                onChange={ (v) => restart(Number(v) as BoardSize) }
                options={ BOARD_SIZES.map((s) => ({ value: s, label: `${s}×${s}` })) }
              />
              <Text type="secondary" style={ { fontSize: 12 } }>{ t('棋盘') }</Text>
            </Space>
            <Tag color={ maxValue >= opts.win ? 'gold' : 'default' }>{ tT('最大方块 {n}', { n: maxValue }) }</Tag>
            <Tag>{ tT('目标 {n}', { n: opts.win }) }</Tag>
            <Tag>{ tT('第 {n} 步', { n: moves }) }</Tag>
            { history.length > 0 ? <Tag color="blue">{ tT('已撤销 {n} 步可退', { n: history.length }) }</Tag> : null }
          </Space>

          {/* 通关 / 结束提示 (不遮挡棋盘, 棋盘保持可见) */}
          { game.won && !keepPlaying ? (
            <Alert
              type="success"
              showIcon
              message={ tT('达成 {n}!', { n: opts.win }) }
              description={ tT('已合成 {n}, 可以继续挑战更大的数字, 也可以重新开始', { n: maxValue }) }
              action={ (
                <Space direction="vertical" size={ 6 }>
                  <Button size="small" type="primary" onClick={ () => setKeepPlaying(true) }>{ t('继续挑战') }</Button>
                  <Button size="small" onClick={ () => restart(size) }>{ t('重新开始') }</Button>
                </Space>
              ) }
            />
          ) : null}
          { over ? (
            <Alert
              type="error"
              showIcon
              message={ t('游戏结束') }
              description={ t('棋盘已满, 也再没有可以合并的方块了') }
              action={ <Button size="small" type="primary" onClick={ () => restart(size) }>{ t('重新开始') }</Button> }
            />
          ) : null}

          <div
            className="g2048-board"
            data-testid="game2048-board"
            style={ {
              gridTemplateColumns: `repeat(${n}, 1fr)`,
              gap: BOARD_GAP,
              background: BOARD_BG,
              width: `min(88vw, ${BOARD_MAX_PX}px)`,
            } }
            onTouchStart={ onTouchStart }
            onTouchEnd={ onTouchEnd }
          >
            { game.board.map((row, r) => row.map((v, c) => {
              const key = cellKey({ r, c });
              const merged = fx.keys.includes(key);
              const spawned = fx.spawn === key;
              const anim = opts.anim && (merged || spawned);
              return (
                <div key={ key } className="g2048-cell" style={ { background: CELL_BG } } data-cell={ key }>
                  { v > 0 ? (
                    <div
                      className={ `g2048-tile${anim && spawned ? ' g2048-tile-new' : ''}${anim && merged ? ' g2048-tile-merge' : ''}` }
                      data-tile={ v }
                      style={ { background: tileColor(v).bg, color: tileColor(v).fg, fontSize: cellFont(v) } }
                    >
                      { v }
                    </div>
                  ) : null }
                </div>
              );
            })) }
          </div>

          <Space size={ 12 } wrap align="start">
            <div style={ { display: 'grid', gridTemplateColumns: 'repeat(3, 34px)', gridAutoRows: '34px', gap: 4 } }>
              { DPAD.map(({ dir, icon, area }) => (
                <Button
                  key={ dir }
                  size="small"
                  style={ { gridArea: area } }
                  icon={ icon }
                  aria-label={ dir }
                  disabled={ locked }
                  onClick={ () => applyMove(dir) }
                />
              )) }
            </div>
            <Space direction="vertical" size={ 2 }>
              <Text type="secondary" style={ { fontSize: 12 } }>
                { tT('方向键 / WASD 移动方块 · 触屏可直接滑动 · 可撤销 {n} 步', { n: UNDO_LIMIT }) }
              </Text>
              <Text type="secondary" style={ { fontSize: 12 } }>{ t('相同数字相撞即合并为两倍, 每合成出新方块得相同分数') }</Text>
              <Text type="secondary" style={ { fontSize: 12 } }>{ tT('达到 {n} 即通关, 通关后可继续挑战更高分', { n: opts.win }) }</Text>
              { over ? <Text type="secondary" style={ { fontSize: 12 } }>{ t('本局已结束, 点「重新开始」开一局新的') }</Text> : null }
            </Space>
          </Space>
        </Space>
      </Card>

      <Divider>{ t('2048 说明') }</Divider>
      <Game2048Intro />
    </Space>
  );
};

export default Game2048;
