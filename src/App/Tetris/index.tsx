// 俄罗斯方块: 经典下落式方块游戏 (10×20 棋盘, 7-bag 随机, 幽灵方块, 暂存 / 预览 / 全屏)
// 规则参考 https://chvin.github.io/react-tetris/
// 说明: 规则计算全部在 lib.ts (纯函数), 本文件只做渲染与键盘 / 触摸 / 计时 / 全屏等副作用
import { Alert, Button, Card, Divider, Space, Tag, Tooltip, Typography, theme } from 'antd';
import {
  ArrowDownOutlined, ArrowLeftOutlined, ArrowRightOutlined, FullscreenExitOutlined, FullscreenOutlined,
  PauseCircleOutlined, PlayCircleOutlined, RedoOutlined, ReloadOutlined, SwapOutlined,
} from '@ant-design/icons';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppContext } from '../../hook/app-context';
import { useLocale } from '../../hook/locale-context';
import {
  BOARD_SIZE_CSS, BOARD_SIZE_CSS_FULL, CELL_BG, HARD_DROP_SCORE, LINE_SCORES, PIECE_COLORS, PREVIEW_QUEUE,
  SOFT_DROP_SCORE, TETRIS_CSS, type PieceType,
} from './data';
import {
  boardCols, clearLines, createBoard, ghostPiece, getBestScore, getDefaultOptions, gravityMs,
  hardDropPiece, initialQueue, isTopOut, isTypingTarget, keyToAction, levelOf, lockPiece, movePiece,
  nextFromQueue, pieceCells, rotatePiece, scoreForClear, setBestScore, shapeOf, softDropPiece, spawnPiece,
  type Action, type Board, type Piece, type TetrisOptions,
} from './lib';
import { u, uT } from './lang';
import TetrisIntro from './intro';

const { Text } = Typography;

type FullscreenElement = HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

/** 预览框列数 (I 用 4 列, 其余 3 列, 与 shapes 的包围盒一致) */
const boxCols = (type: PieceType) => (type === 'I' ? 4 : 3);

const Tetris: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tT = (zh: string, vars: Record<string, string | number>) => uT(locale, zh, vars);
  const { token } = theme.useToken();
  // 页面在 KeepAlive 容器中常驻: 只有当前显示本应用时才响应全局键盘事件
  const appCtx = useContext(AppContext);
  const active = appCtx ? appCtx.app === 'Tetris' : true;

  const [ opts ] = useState<TetrisOptions>(() => getDefaultOptions());
  const [ board, setBoard ] = useState<Board>(() => createBoard());
  const [ queue, setQueue ] = useState<PieceType[]>(() => initialQueue(Math.random, PREVIEW_QUEUE + 1));
  const [ current, setCurrent ] = useState<Piece | null>(null);
  const [ hold, setHold ] = useState<PieceType | null>(null);
  /** 每个方块只能暂存一次 */
  const [ holdUsed, setHoldUsed ] = useState(false);
  const [ score, setScore ] = useState(0);
  const [ lines, setLines ] = useState(0);
  const [ best, setBest ] = useState<number>(() => getBestScore());
  /** 是否已开过局 (决定开局提示 / 暂停提示) */
  const [ started, setStarted ] = useState(false);
  const [ running, setRunning ] = useState(false);
  const [ over, setOver ] = useState(false);
  const [ full, setFull ] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const level = levelOf(opts.level, lines);
  const cols = boardCols(board);

  /** 加分 (同时刷新最高分) */
  const addScore = useCallback((n: number) => {
    if (n === 0) return;
    const v = score + n;
    setScore(v);
    if (v > best) setBest(setBestScore(v));
  }, [ score, best ]);

  /** 当前方块落地: 锁定 -> 消行 -> 计分 -> 出下一个 */
  const commit = useCallback((piece: Piece | null) => {
    if (!piece) return;
    const locked = lockPiece(board, piece);
    const { board: nextBoard, cleared } = clearLines(locked);
    const gained = scoreForClear(cleared, level);
    const nextLines = lines + cleared;
    const nextScore = score + gained;
    setBoard(nextBoard);
    setLines(nextLines);
    if (gained > 0) addScore(gained);
    const { type, queue: nextQueue } = nextFromQueue(queue);
    const next = spawnPiece(type, boardCols(nextBoard));
    setQueue(nextQueue);
    setHoldUsed(false);
    if (isTopOut(nextBoard, next)) {
      setCurrent(null);
      setOver(true);
      setRunning(false);
      setBest(setBestScore(nextScore));
      return;
    }
    setCurrent(next);
  }, [ board, lines, level, score, addScore, queue ]);

  /** 开一局新的 */
  const start = useCallback(() => {
    const fresh = createBoard();
    const nextQueue = initialQueue(Math.random, PREVIEW_QUEUE + 1);
    const first = spawnPiece(nextQueue[0], boardCols(fresh));
    setBoard(fresh);
    setQueue(nextQueue.slice(1));
    setCurrent(first);
    setHold(null);
    setHoldUsed(false);
    setScore(0);
    setLines(0);
    setBest(getBestScore());
    setStarted(true);
    setRunning(true);
    setOver(false);
  }, []);

  /** 处理一个动作 (键盘 / 屏幕按钮共用) */
  const dispatch = useCallback((action: Action) => {
    if (action === 'pause') {
      if (!started || over) return;
      setRunning((r) => ! r);
      return;
    }
    if (!started || over) return;
    if (!running) return;
    if (!current) return;
    switch (action) {
      case 'left':
      case 'right': {
        const next = movePiece(board, current, action === 'left' ? -1 : 1);
        if (next) setCurrent(next);
        return;
      }
      case 'softDrop': {
        const next = softDropPiece(board, current);
        if (next) {
          setCurrent(next);
          addScore(SOFT_DROP_SCORE);
        } else {
          commit(current);
        }
        return;
      }
      case 'hardDrop': {
        const { piece, distance } = hardDropPiece(board, current);
        addScore(distance * HARD_DROP_SCORE);
        commit(piece);
        return;
      }
      case 'rotateCW':
      case 'rotateCCW': {
        const next = rotatePiece(board, current, action === 'rotateCW' ? 1 : -1);
        if (next) setCurrent(next);
        return;
      }
      case 'hold': {
        if (holdUsed) return;
        const curType = current.type;
        if (hold) {
          setCurrent(spawnPiece(hold, cols));
          setHold(curType);
        } else {
          const { type, queue: nextQueue } = nextFromQueue(queue);
          setQueue(nextQueue);
          setCurrent(spawnPiece(type, cols));
          setHold(curType);
        }
        setHoldUsed(true);
        return;
      }
      default:
        return;
    }
  }, [ started, over, running, current, board, cols, queue, hold, holdUsed, commit, addScore ]);

  // 自动下落 (等级越高越快)
  useEffect(() => {
    if (!running || over || !current) return;
    const id = window.setTimeout(() => {
      const next = softDropPiece(board, current);
      if (next) setCurrent(next);
      else commit(current);
    }, gravityMs(level));
    return () => window.clearTimeout(id);
  }, [ running, over, current, board, level, commit ]);

  // 键盘: 方向键 / WASD / 空格等 (输入框内不拦截)
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target as HTMLElement | null)) return;
      const action = keyToAction(e);
      if (!action) return;
      e.preventDefault();
      if (!started) {
        // 未开局时按 空格 / 回车 直接开局
        if (action === 'hardDrop') start();
        return;
      }
      dispatch(action);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [ active, started, start, dispatch ]);

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

  // ---- 渲染 ----
  const ghost = current && opts.ghost ? ghostPiece(board, current) : null;
  const ghostKeys = new Set((ghost ? pieceCells(ghost) : []).filter(({ r }) => r >= 0).map(({ r, c }) => `${r}-${c}`));
  const curKeys = new Map<string, PieceType>();
  if (current) {
    for (const { r, c } of pieceCells(current)) {
      if (r >= 0) curKeys.set(`${r}-${c}`, current.type);
    }
  }

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
      <div style={ { fontSize: 17, fontWeight: 700, lineHeight: '24px' } }>{ value }</div>
    </div>
  );

  /** 迷你预览框 (下一个 / 暂存) */
  const previewBox = (type: PieceType | null, title: string) => (
    <div className="t4-side">
      <Text type="secondary" style={ { fontSize: 12 } }>{ title }</Text>
      <div className="t4-box" style={ { gridTemplateColumns: `repeat(${type ? boxCols(type) : 3}, 1fr)` } }>
        { Array.from({ length: (type ? boxCols(type) : 3) * 2 }, (_, i) => {
          const r = Math.floor(i / (type ? boxCols(type) : 3));
          const c = i % (type ? boxCols(type) : 3);
          const filled = type ? shapeOf(type, 0).some(([ dr, dc ]) => dr === r && dc === c) : false;
          return (
            <div key={ `${r}-${c}` } className="t4-box-cell" data-preview={ filled ? type ?? '' : '' }>
              { filled && type ? (
                <div className="t4-piece" style={ { background: PIECE_COLORS[type] } } />
              ) : null }
            </div>
          );
        }) }
      </div>
    </div>
  );

  const overlay = !started ? (
    <div className="t4-overlay">
      <div>{ t('俄罗斯方块') }</div>
      <Button size="small" type="primary" onClick={ start }>{ t('开始游戏') }</Button>
      <Text style={ { fontSize: 12, fontWeight: 400, opacity: 0.8 } }>{ t('或按空格键开局') }</Text>
    </div>
  ) : over ? (
    <div className="t4-overlay">
      <div>{ t('游戏结束') }</div>
      <div style={ { fontSize: 13, fontWeight: 400 } }>{ tT('本局得分 {n}', { n: score }) }</div>
      <Button size="small" type="primary" icon={ <ReloadOutlined /> } onClick={ start }>{ t('重新开始') }</Button>
    </div>
  ) : !running ? (
    <div className="t4-overlay">
      <div>{ t('已暂停') }</div>
      <Button size="small" type="primary" icon={ <PlayCircleOutlined /> } onClick={ () => dispatch('pause') }>
        { t('继续') }
      </Button>
    </div>
  ) : null;

  const playfieldNode = (
    <div className="t4-stage-relative" style={ { position: 'relative' } }>
      <div className="t4-board" data-testid="tetris-board" style={ { width: 'var(--t4-board)' } }>
        { board.map((row, r) => row.map((v, c) => {
          const key = `${r}-${c}`;
          const curType = curKeys.get(key);
          const showGhost = !curType && ghostKeys.has(key) && current !== null;
          return (
            <div
              key={ key }
              className={ `t4-cell${opts.grid ? ' t4-cell-grid' : ''}` }
              style={ { background: CELL_BG } }
              data-cell={ key }
              data-filled={ curType ?? v ?? '' }
            >
              { curType || v ? (
                <div className="t4-piece" style={ { background: PIECE_COLORS[(curType ?? v) as PieceType] } } />
              ) : showGhost && current ? (
                <div className="t4-ghost" style={ { color: PIECE_COLORS[current.type] } } />
              ) : null }
            </div>
          );
        })) }
      </div>
      { overlay }
    </div>
  );

  const sideNode = (
    <>
      <Space size={ 8 } wrap align="center">
        { stat(t('分数'), score) }
        { stat(t('最高分'), best) }
        { stat(t('消行'), lines) }
        { stat(t('等级'), level) }
      </Space>
      <Space size={ 8 } align="start" wrap>
        { previewBox(queue[0] ?? null, t('下一个')) }
        { previewBox(hold, t('暂存')) }
      </Space>
    </>
  );

  const controlNode = (
    <Space size={ 6 } wrap>
      <Tooltip title={ t('开始 / 暂停 (P)') }>
        <Button
          size="small"
          type={ running ? 'default' : 'primary' }
          icon={ running ? <PauseCircleOutlined /> : <PlayCircleOutlined /> }
          disabled={ over }
          onClick={ () => (started ? dispatch('pause') : start()) }
        >
          { running ? t('暂停') : started && !over ? t('继续') : t('开始') }
        </Button>
      </Tooltip>
      <Tooltip title={ t('重新开始') }>
        <Button size="small" icon={ <ReloadOutlined /> } onClick={ start }>{ t('重新开始') }</Button>
      </Tooltip>
      <Tooltip title={ t('左移 (←)') }>
        <Button size="small" icon={ <ArrowLeftOutlined /> } disabled={ !running || over } onClick={ () => dispatch('left') } />
      </Tooltip>
      <Tooltip title={ t('右移 (→)') }>
        <Button size="small" icon={ <ArrowRightOutlined /> } disabled={ !running || over } onClick={ () => dispatch('right') } />
      </Tooltip>
      <Tooltip title={ t('软降 (↓)') }>
        <Button size="small" icon={ <ArrowDownOutlined /> } disabled={ !running || over } onClick={ () => dispatch('softDrop') } />
      </Tooltip>
      <Tooltip title={ t('旋转 (↑ / X)') }>
        <Button size="small" icon={ <RedoOutlined /> } disabled={ !running || over } onClick={ () => dispatch('rotateCW') } />
      </Tooltip>
      <Tooltip title={ t('硬降 (空格)') }>
        <Button size="small" type="primary" disabled={ !running || over } onClick={ () => dispatch('hardDrop') }>
          { t('硬降') }
        </Button>
      </Tooltip>
      <Tooltip title={ t('暂存 (C)') }>
        <Button
          size="small"
          icon={ <SwapOutlined /> }
          disabled={ !running || over || holdUsed }
          onClick={ () => dispatch('hold') }
        />
      </Tooltip>
    </Space>
  );

  const hintNode = (
    <Space direction="vertical" size={ 2 }>
      <Text type="secondary" style={ { fontSize: 12 } }>
        { t('← → 移动 · ↓ 软降 · ↑ / X 旋转 · Z 反向旋转 · 空格 硬降 · C 暂存 · P 暂停') }
      </Text>
      <Text type="secondary" style={ { fontSize: 12 } }>
        { tT('消 1 行 {a} 分 · 2 行 {b} 分 · 3 行 {c} 分 · 4 行 {d} 分 (均乘当前等级)', {
          a: LINE_SCORES[1], b: LINE_SCORES[2], c: LINE_SCORES[3], d: LINE_SCORES[4],
        }) }
      </Text>
      <Text type="secondary" style={ { fontSize: 12 } }>
        { tT('每消 {n} 行升 1 级, 等级越高下落越快', { n: 10 }) }
      </Text>
    </Space>
  );

  // ---- 全屏: 只保留棋盘与记分 / 预览 ----
  if (full) {
    return (
      <>
        <style>{ TETRIS_CSS }</style>
        <div
          ref={ stageRef }
          className="t4-stage t4-full"
          data-testid="tetris-full"
          style={ {
            '--t4-board': BOARD_SIZE_CSS_FULL,
            '--t4-bg': token.colorBgContainer,
            '--t4-board-bg': token.colorFillQuaternary,
          } as React.CSSProperties }
        >
          <div className="t4-side">
            { sideNode }
            <Button size="small" icon={ <FullscreenExitOutlined /> } onClick={ exitFull }>{ t('退出全屏') }</Button>
          </div>
          { playfieldNode }
          <div className="t4-side">
            { controlNode }
            <Text type="secondary" style={ { fontSize: 12 } }>{ t('Esc 退出全屏') }</Text>
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      className="t4-stage"
      style={ {
        '--t4-board': BOARD_SIZE_CSS,
        '--t4-board-bg': token.colorFillQuaternary,
      } as React.CSSProperties }
    >
      <style>{ TETRIS_CSS }</style>
      <Space direction="vertical" size={ 16 } style={ { width: '100%' } }>
        <Card
          size="small"
          title={ t('俄罗斯方块') }
          extra={
            <Button size="small" icon={ <FullscreenOutlined /> } onClick={ () => setFull(true) }>{ t('全屏') }</Button>
          }
        >
          <Space direction="vertical" size={ 12 } style={ { width: '100%' } }>
            <div className="t4-wrap">
              { playfieldNode }
              <div className="t4-side" style={ { alignItems: 'stretch', minWidth: 180 } }>
                { sideNode }
                { controlNode }
                <Space size={ 4 } wrap>
                  <Tag color="blue">{ tT('第 {n} 级', { n: level }) }</Tag>
                  <Tag>{ tT('已消 {n} 行', { n: lines }) }</Tag>
                  { holdUsed && hold ? <Tag>{ t('本方块已暂存') }</Tag> : null }
                </Space>
                { hintNode }
              </div>
            </div>

            { over ? (
              <Alert
                type="error"
                showIcon
                message={ t('游戏结束') }
                description={ tT('本局得分 {n}, 消掉 {m} 行, 达到 {lv} 级', { n: score, m: lines, lv: level }) }
                action={ <Button size="small" type="primary" onClick={ start }>{ t('重新开始') }</Button> }
              />
            ) : null }
          </Space>
        </Card>

        <Divider>{ t('俄罗斯方块说明') }</Divider>
        <TetrisIntro />
      </Space>
    </div>
  );
};

export default Tetris;
