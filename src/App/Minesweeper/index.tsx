// 扫雷: 经典 Windows 扫雷玩法, 支持初级 / 中级 / 高级与自定义棋盘
// 规则参考 https://minesweeper.online/ : 首点 3×3 安全, 左键翻开, 右键插旗 (旗 → 问号 → 空),
// 已翻开的数字格周围旗数够了可双击 / 中键一键连开; 触屏长按插旗
// 说明: 规则计算全部在 lib.ts (纯函数), 本文件只做渲染与鼠标 / 触屏 / 全屏等副作用
import {
  Alert, Button, Card, Divider, InputNumber, Modal, Segmented, Space, Tag, Tooltip, Typography, theme,
} from 'antd';
import {
  FullscreenExitOutlined, FullscreenOutlined, ReloadOutlined, SettingOutlined,
} from '@ant-design/icons';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppContext } from '../../hook/app-context';
import { useLocale } from '../../hook/locale-context';
import {
  CELL_SIZES, CLOCK_TICK_MS, HEIGHT_MAX, HEIGHT_MIN, HINT_MS, LEVELS, LONG_PRESS_MS, MINESWEEPER_CSS, MINES_MIN,
  SAFE_AREA, WIDTH_MAX, WIDTH_MIN, type Dims, type Level,
} from './data';
import {
  chordCell, createBoard, dimsOf, faceOf, flagCount, formatBest, formatTime, getBestTime, getDefaultOptions,
  hintCells, isTypingTarget, isWin, levelOf, normalizeDims, revealCell, setBestTime, setMark, showMines, startGame,
  wrongFlags, type Board, type GameStatus,
} from './lib';
import { u, uT } from './lang';
import MinesweeperIntro from './intro';

const { Text } = Typography;

/** 难度标签 (自定义只在页面上按需切换, 不作为默认设置) */
const LEVEL_LABEL: Record<Level, string> = {
  beginner: '初级',
  intermediate: '中级',
  expert: '高级',
  custom: '自定义',
};

/** 格子档位标签 */
const CELL_LABEL: Record<number, string> = { 22: '小', 26: '中', 30: '大' };

type FullscreenElement = HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

const Minesweeper: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tT = (zh: string, vars: Record<string, string | number>) => uT(locale, zh, vars);
  const { token } = theme.useToken();
  // 页面在 KeepAlive 容器中常驻: 只有当前显示本应用时才响应全局键盘 / 全屏状态
  const appCtx = useContext(AppContext);
  const active = appCtx ? appCtx.app === 'Minesweeper' : true;

  /** 默认设置 (打开页面时读取一次; 修改默认设置后重开页面生效) */
  const [ opts ] = useState(() => getDefaultOptions());
  const [ level, setLevel ] = useState<Level>(opts.level);
  const [ dims, setDims ] = useState<Dims>(() => dimsOf(opts.level));
  const [ board, setBoard ] = useState<Board>(() => createBoard(dims.width, dims.height, dims.mines));
  const [ status, setStatus ] = useState<GameStatus>('ready');
  const [ elapsed, setElapsed ] = useState(0);
  const [ cell, setCell ] = useState(opts.cell);
  const [ best, setBest ] = useState<number | null>(() => getBestTime(dims.width, dims.height, dims.mines));
  const [ full, setFull ] = useState(false);
  const [ customOpen, setCustomOpen ] = useState(false);
  const [ draft, setDraft ] = useState<Dims>(dims);
  /** 双击数字格的闪烁提示: 周边未翻开的格子下标 + 序号 (序号变化让 CSS 动画重播) */
  const [ hint, setHint ] = useState<{ cells: number[], seq: number }>({ cells: [], seq: 0 });

  const stageRef = useRef<HTMLDivElement | null>(null);
  /** 开局时间戳 (0 = 还没点第一下) */
  const startRef = useRef(0);
  /** 触屏长按插旗的定时器 */
  const pressRef = useRef<number | null>(null);
  /** 长按已插旗: 屏蔽随后的 click, 避免又翻开一格 */
  const skipClickRef = useRef(false);
  /** 闪烁提示的定时清除 */
  const hintTimer = useRef<number | null>(null);

  const scale = dims;

  /** 清除闪烁提示 (重开 / 翻开新格子时) */
  const clearHint = useCallback(() => {
    if (hintTimer.current !== null) {
      window.clearTimeout(hintTimer.current);
      hintTimer.current = null;
    }
    setHint((h) => (h.cells.length === 0 ? h : { cells: [], seq: h.seq }));
  }, []);

  /** 双击 / 中键数字格: 周边未翻开的格子闪一下, 方便找到还没点的地方 */
  const flashHint = useCallback((i: number) => {
    const list = hintCells(board, i);
    if (list.length === 0) return;
    if (hintTimer.current !== null) window.clearTimeout(hintTimer.current);
    setHint((h) => ({ cells: list, seq: h.seq + 1 }));
    hintTimer.current = window.setTimeout(() => {
      hintTimer.current = null;
      setHint((h) => ({ cells: [], seq: h.seq }));
    }, HINT_MS);
  }, [ board ]);

  useEffect(() => () => {
    if (hintTimer.current !== null) window.clearTimeout(hintTimer.current);
  }, []);

  /** 重开一局 (切难度 / 换尺寸 / 点表情按钮) */
  const newGame = useCallback((nextLevel: Level, next: Dims) => {
    setLevel(nextLevel);
    setDims(next);
    setBoard(createBoard(next.width, next.height, next.mines));
    setStatus('ready');
    setElapsed(0);
    startRef.current = 0;
    clearHint();
    setBest(getBestTime(next.width, next.height, next.mines));
  }, [ clearHint ]);

  /** 结算: 踩雷亮出全部地雷, 通关则记录最快用时 */
  const settle = useCallback((next: Board) => {
    if (next.exploded >= 0) {
      setStatus('lost');
      setElapsed(Math.max(1, Math.floor((Date.now() - startRef.current) / 1000)));
      setBoard(showMines(next));
      return;
    }
    if (isWin(next)) {
      const sec = Math.max(1, Math.floor((Date.now() - startRef.current) / 1000));
      setElapsed(sec);
      setStatus('won');
      setBestTime(next.width, next.height, next.mines, sec);
      setBest(getBestTime(next.width, next.height, next.mines));
      setBoard(next);
      return;
    }
    setBoard(next);
  }, []);

  /** 连开: 数字格周围旗数够了, 一次翻开其余格子 */
  const chordAt = useCallback((i: number) => {
    if (!board.placed || status === 'won' || status === 'lost') return;
    const res = chordCell(board, i);
    if (!res) return;
    settle(res.board);
  }, [ board, status, settle ]);

  /** 双击 / 中键: 先闪烁提示周边未开的格子, 再尝试连开 */
  const hintAndChord = useCallback((i: number) => {
    flashHint(i);
    chordAt(i);
  }, [ chordAt, flashHint ]);

  /** 左键翻开 (未开局的第一次点击先按安全区布雷) */
  const revealAt = useCallback((i: number) => {
    if (status === 'won' || status === 'lost') return;
    const target = board.cells[i];
    if (!target) return;
    if (target.revealed) {
      chordAt(i);
      return;
    }
    if (target.mark === 'flag') return;
    const fresh = !board.placed;
    const base = fresh ? startGame(board.width, board.height, board.mines, i) : board;
    if (fresh) {
      startRef.current = Date.now();
      setStatus('playing');
    }
    clearHint();
    settle(revealCell(base, i).board);
  }, [ board, chordAt, clearHint, settle, status ]);

  /** 右键 / 长按插旗 */
  const markAt = useCallback((i: number) => {
    if (status === 'won' || status === 'lost') return;
    setBoard((prev) => setMark(prev, i, opts.question));
  }, [ opts.question, status ]);

  const clearPress = () => {
    if (pressRef.current !== null) {
      window.clearTimeout(pressRef.current);
      pressRef.current = null;
    }
  };

  useEffect(() => clearPress, []);

  // 计时: 只在进行中走表, 结算时停在 settle 写入的秒数
  useEffect(() => {
    if (status !== 'playing') return;
    const id = window.setInterval(() => {
      if (startRef.current === 0) return;
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, CLOCK_TICK_MS);
    return () => window.clearInterval(id);
  }, [ status ]);

  // ---- 全屏 ----
  const exitFull = useCallback(() => {
    setFull(false);
    const doc = document as FullscreenDocument;
    if (!doc.fullscreenElement && !doc.webkitFullscreenElement) return;
    try {
      Promise.resolve(doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.()).catch(() => undefined);
    } catch {
      /* 忽略: 已退到窗口内全屏 */
    }
  }, []);

  // 进入窗口内全屏后, 再尝试申请原生全屏 (失败也不影响, CSS 已铺满视口)
  useEffect(() => {
    if (!full) return;
    const el = stageRef.current as FullscreenElement | null;
    const request = el?.requestFullscreen?.bind(el) ?? el?.webkitRequestFullscreen?.bind(el);
    if (!request) return;
    try {
      Promise.resolve(request()).catch(() => undefined);
    } catch {
      /* 忽略 */
    }
  }, [ full ]);

  // 用户用 Esc / 系统手势退出原生全屏时, 同步退出窗口内全屏
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

  // 切换到其它工具时自动退出全屏
  useEffect(() => {
    if (!active && full) exitFull();
  }, [ active, full, exitFull ]);

  // 键盘: R 重开一局, 全屏时 Esc 退出
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && full) {
        const doc = document as FullscreenDocument;
        if (!doc.fullscreenElement && !doc.webkitFullscreenElement) exitFull();
        return;
      }
      if (isTypingTarget(e.target as HTMLElement | null)) return;
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        newGame(level, scale);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [ active, exitFull, full, level, newGame, scale ]);

  const changeLevel = (next: Level) => {
    if (next === 'custom') {
      setDraft(dims);
      setCustomOpen(true);
      return;
    }
    newGame(next, dimsOf(next));
  };

  const applyCustom = () => {
    const next = normalizeDims(draft);
    newGame(levelOf(next), next);
    setCustomOpen(false);
  };

  const left = board.mines - flagCount(board);
  const wrong = status === 'lost' ? new Set(wrongFlags(board)) : new Set<number>();
  const dimsText = tT('棋盘 {w}×{h} · {n} 雷', { w: board.width, h: board.height, n: board.mines });

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

  const faceBtn = (
    <Tooltip title={ t('重新开始') }>
      <Button
        className="ms-face"
        data-testid="ms-face"
        onClick={ () => newGame(level, dims) }
      >
        { faceOf(status) }
      </Button>
    </Tooltip>
  );

  const boardNode = (
    <div className="ms-scroll">
      <div
        className="ms-board"
        data-testid="ms-board"
        style={ { gridTemplateColumns: `repeat(${board.width}, ${cell}px)`, '--ms-cell': `${cell}px` } as React.CSSProperties }
      >
        { board.cells.map((c, i) => {
          const boom = status === 'lost' && board.exploded === i;
          const mine = c.revealed && c.mine && !boom;
          const badFlag = wrong.has(i);
          const hinting = !c.revealed && hint.cells.includes(i);
          const cls = [
            'ms-cell',
            c.revealed ? 'ms-open' : '',
            boom ? 'ms-boom' : '',
            mine ? 'ms-mine' : '',
            badFlag ? 'ms-wrong' : '',
            !c.revealed && c.mark === 'flag' ? 'ms-flag' : '',
            hinting ? 'ms-hint' : '',
          ].filter(Boolean).join(' ');
          const content = badFlag
            ? '❌'
            : boom
              ? '💥'
              : mine
                ? '💣'
                : c.revealed
                  ? (c.adj > 0 ? c.adj : '')
                  : c.mark === 'flag'
                    ? '🚩'
                    : c.mark === 'question'
                      ? '❓'
                      : '';
          return (
            <button
              key={ hinting ? `${i}-${hint.seq}` : i }
              type="button"
              className={ cls }
              data-cell={ i }
              data-open={ c.revealed ? 1 : 0 }
              data-mark={ c.mark }
              data-mine={ c.mine && c.revealed ? 1 : 0 }
              data-n={ c.revealed && !c.mine && c.adj > 0 ? c.adj : undefined }
              data-hint={ hinting ? 1 : undefined }
              onClick={ () => {
                if (skipClickRef.current) {
                  skipClickRef.current = false;
                  return;
                }
                revealAt(i);
              } }
              onContextMenu={ (e) => {
                e.preventDefault();
                markAt(i);
              } }
              onDoubleClick={ () => hintAndChord(i) }
              onPointerDown={ (e) => {
                if (e.button === 1) {
                  e.preventDefault();
                  hintAndChord(i);
                  return;
                }
                // 鼠标左键不参与长按插旗 (触屏 / 触控笔 / 未知指针都按长按处理)
                if (e.pointerType === 'mouse') return;
                clearPress();
                pressRef.current = window.setTimeout(() => {
                  pressRef.current = null;
                  skipClickRef.current = true;
                  markAt(i);
                }, LONG_PRESS_MS);
              } }
              onPointerUp={ clearPress }
              onPointerLeave={ clearPress }
              onPointerCancel={ clearPress }
            >
              { content }
            </button>
          );
        }) }
      </div>
    </div>
  );

  const alertsNode = (
    <>
      { status === 'won' ? (
        <Alert
          type="success"
          showIcon
          message={ t('通关!') }
          description={ elapsed === best
            ? tT('用时 {t}, 刷新了本规格的最快纪录', { t: formatTime(elapsed) })
            : tT('用时 {t}', { t: formatTime(elapsed) }) }
          action={ <Button size="small" type="primary" onClick={ () => newGame(level, dims) }>{ t('重新开始') }</Button> }
        />
      ) : null }
      { status === 'lost' ? (
        <Alert
          type="error"
          showIcon
          message={ t('踩到地雷了') }
          description={ t('点表情按钮或「新游戏」再来一局') }
          action={ <Button size="small" type="primary" onClick={ () => newGame(level, dims) }>{ t('重新开始') }</Button> }
        />
      ) : null }
    </>
  );

  const levelSegment = (
    <Segmented
      size="small"
      value={ level }
      onChange={ (v) => changeLevel(v as Level) }
      options={ LEVELS.map((l) => ({ value: l, label: t(LEVEL_LABEL[l]) })) }
    />
  );

  const cellSegment = (
    <Segmented
      size="small"
      value={ cell }
      onChange={ (v) => setCell(Number(v)) }
      options={ CELL_SIZES.map((n) => ({ value: n, label: t(CELL_LABEL[n]) })) }
    />
  );

  const customBtn = (
    <Button size="small" icon={ <SettingOutlined /> } onClick={ () => { setDraft(dims); setCustomOpen(true); } }>
      { t('自定义') }
    </Button>
  );

  const newGameBtn = (
    <Button size="small" type="primary" icon={ <ReloadOutlined /> } onClick={ () => newGame(level, dims) }>
      { t('新游戏') }
    </Button>
  );

  const modalNode = (
    <Modal
      open={ customOpen }
      title={ t('自定义棋盘') }
      okText={ t('确定') }
      cancelText={ t('取消') }
      onOk={ applyCustom }
      onCancel={ () => setCustomOpen(false) }
      destroyOnHidden
    >
      <Space direction="vertical" size={ 12 } style={ { width: '100%' } }>
        <Space size={ 12 } wrap>
          <Space size={ 6 }>
            <Text>{ t('宽度') }</Text>
            <InputNumber
              min={ WIDTH_MIN }
              max={ WIDTH_MAX }
              value={ draft.width }
              onChange={ (v) => setDraft((d) => ({ ...d, width: Number(v) || d.width })) }
            />
          </Space>
          <Space size={ 6 }>
            <Text>{ t('高度') }</Text>
            <InputNumber
              min={ HEIGHT_MIN }
              max={ HEIGHT_MAX }
              value={ draft.height }
              onChange={ (v) => setDraft((d) => ({ ...d, height: Number(v) || d.height })) }
            />
          </Space>
          <Space size={ 6 }>
            <Text>{ t('雷数') }</Text>
            <InputNumber
              min={ MINES_MIN }
              max={ Math.max(MINES_MIN, draft.width * draft.height - SAFE_AREA) }
              value={ draft.mines }
              onChange={ (v) => setDraft((d) => ({ ...d, mines: Number(v) || d.mines })) }
            />
          </Space>
        </Space>
        <Text type="secondary" style={ { fontSize: 12 } }>
          { tT('雷数最多 {n} 个 (需留出首点 3×3 安全区)', {
            n: Math.max(MINES_MIN, normalizeDims(draft).width * normalizeDims(draft).height - SAFE_AREA),
          }) }
        </Text>
      </Space>
    </Modal>
  );

  // ---- 全屏: 只留统计 / 棋盘 / 操作 ----
  if (full) {
    return (
      <>
        <style>{ MINESWEEPER_CSS }</style>
        <div
          ref={ stageRef }
          className="ms-stage ms-full"
          data-testid="ms-full"
          style={ { '--ms-bg': token.colorBgContainer } as React.CSSProperties }
        >
          <div className="ms-bar">
            { stat(t('剩余雷数'), left) }
            { stat(t('用时'), formatTime(elapsed)) }
            { stat(t('最高纪录'), formatBest(best)) }
            { faceBtn }
            { levelSegment }
            { cellSegment }
            { newGameBtn }
            <Button size="small" icon={ <FullscreenExitOutlined /> } onClick={ exitFull }>{ t('退出全屏') }</Button>
          </div>
          { alertsNode }
          { boardNode }
          <Text type="secondary" style={ { fontSize: 12, textAlign: 'center' } }>
            { t('左键翻开 · 右键插旗 (旗 → 问号 → 空) · 双击数字闪烁提示周边 · 触屏长按插旗') }
          </Text>
          <Text type="secondary" style={ { fontSize: 12 } }>{ t('Esc 退出全屏') }</Text>
        </div>
        { modalNode }
      </>
    );
  }

  return (
    <div className="ms-stage">
      <style>{ MINESWEEPER_CSS }</style>
      <Space direction="vertical" size={ 16 } style={ { width: '100%' } }>
        <Card
          size="small"
          title={ t('扫雷') }
          extra={
            <Space size={ 8 } wrap>
              { newGameBtn }
              { customBtn }
              <Button size="small" icon={ <FullscreenOutlined /> } onClick={ () => setFull(true) }>
                { t('全屏') }
              </Button>
            </Space>
          }
        >
          <Space direction="vertical" size={ 12 } style={ { width: '100%' } }>
            <Space size={ 12 } wrap align="center">
              { stat(t('剩余雷数'), left) }
              { stat(t('用时'), formatTime(elapsed)) }
              { stat(t('最高纪录'), formatBest(best)) }
              { faceBtn }
              <Space size={ 6 } wrap>
                { levelSegment }
                <Text type="secondary" style={ { fontSize: 12 } }>{ t('难度') }</Text>
              </Space>
              <Space size={ 6 } wrap>
                { cellSegment }
                <Text type="secondary" style={ { fontSize: 12 } }>{ t('格子大小') }</Text>
              </Space>
              <Tag color="blue">{ dimsText }</Tag>
            </Space>

            { alertsNode }

            { boardNode }

            <Space direction="vertical" size={ 2 }>
              <Text type="secondary" style={ { fontSize: 12 } }>
                { t('左键翻开 · 右键插旗 (旗 → 问号 → 空) · 双击数字闪烁提示周边 · 触屏长按插旗') }
              </Text>
              <Text type="secondary" style={ { fontSize: 12 } }>
                { t('双击数字格时, 周围未翻开的格子会闪烁提示; 旗数正好等于该数字时同时连开') }
                { t('数字格周围插满对应数量的旗子后, 双击或中键点数字即可一次翻开其余格子') }
              </Text>
              <Text type="secondary" style={ { fontSize: 12 } }>
                { t('第一次点击的位置与其 3×3 邻域内不会放雷, 开局第一下必定安全') }
              </Text>
              { status === 'won' || status === 'lost'
                ? <Text type="secondary" style={ { fontSize: 12 } }>{ t('本局已结束, 点表情按钮快速重开') }</Text>
                : null }
            </Space>
          </Space>
        </Card>

        <Divider>{ t('扫雷说明') }</Divider>
        <MinesweeperIntro />
      </Space>
      { modalNode }
    </div>
  );
};

export default Minesweeper;
