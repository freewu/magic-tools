// GameBoy 模拟器: 在浏览器里跑 .gb / .gbc 游戏
// 说明: 解析 / 键位 / 存档 / 设置等纯逻辑在 lib.ts, wasm 核心封装在 core.ts, 音频在 audio.ts, 画面在 render.ts
//       本文件只负责: 模拟循环、键盘 / 手柄 / 触摸输入、存档文件读写、全屏与界面渲染
import {
  Alert, Button, Card, Col, Descriptions, Divider, Row, Segmented, Slider, Space, Tag, Tooltip, Typography, message,
} from 'antd';
import {
  CameraOutlined, FolderOpenOutlined, FullscreenExitOutlined, FullscreenOutlined, PauseCircleOutlined,
  PlayCircleOutlined, ReloadOutlined, SaveOutlined, SoundOutlined, UploadOutlined,
} from '@ant-design/icons';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppContext } from '../../hook/app-context';
import { useLocale } from '../../hook/locale-context';
import { savePngFile, saveTextFile } from '../../lib/tauri';
import {
  GB_CSS, PAD_BUTTONS, SCREEN_HEIGHT, SCREEN_WIDTH, SPEED_OPTIONS, VOLUME_MAX, VOLUME_MIN, type PadButton,
} from './data';
import {
  EMPTY_ROM_INFO, buildKeyLookup, decodeSaveState, encodeSaveState, formatRomSize, frameIntervalMs, gamepadButtonOf,
  getDefaultOptions, getRecentRoms, hotkeyOf, isTypingTarget, keyDisplayName, keyLabel, normalizeKeys,
  padOpacityToAlpha, parseRomHeader, patchDefaultOptions, pushRecentRom, readFileBytes, readFileText, readQuickSave,
  readSram, rebindKey, romBaseName,
  saveRecentRoms, screenshotFileName, stateFileName, writeQuickSave, writeSram, type KeyMap, type RecentRom,
  type RomError, type RomInfo,
} from './lib';
import { GbMachine } from './core';
import { GbAudio } from './audio';
import { createRenderer, type GbRenderer } from './render';
import { u, uT } from './lang';
import GameBoyIntro from './intro';

const { Text } = Typography;

type FullscreenElement = HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

/** ROM 头校验失败原因 -> 提示文案 */
const ROM_ERRORS: Record<RomError, string> = {
  tooShort: '文件太小, 不可能是 GameBoy ROM',
  badLogo: '不是有效的 GameBoy ROM 文件',
};

/** 电池存档定时写回间隔 (ms): 卡带电池存档按 ROM 名保存在本机浏览器 */
const SRAM_FLUSH_MS = 5000;

const GameBoyEmulator: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tT = (zh: string, vars: Record<string, string | number>) => uT(locale, zh, vars);
  // 页面在 KeepAlive 容器中常驻: 只有当前显示本应用时才响应全局键盘事件 / 继续掉帧
  const appCtx = useContext(AppContext);
  const active = appCtx ? appCtx.app === 'GameBoy' : true;

  const [ opts ] = useState(() => getDefaultOptions());
  const [ keys, setKeys ] = useState<KeyMap>(() => normalizeKeys(getDefaultOptions().keys));
  const [ speed, setSpeed ] = useState<number>(() => getDefaultOptions().speed);
  const [ volume, setVolume ] = useState<number>(() => getDefaultOptions().volume);
  const [ muted, setMuted ] = useState(false);
  const [ romInfo, setRomInfo ] = useState<RomInfo>(EMPTY_ROM_INFO);
  const [ romName, setRomName ] = useState('');
  const [ playing, setPlaying ] = useState(false);
  // 读文件 / 初始化 wasm 核心期间给个反馈, 避免看起来像「没反应」
  const [ loading, setLoading ] = useState(false);
  // 拖拽经过页面时高亮画面区域
  const [ dragging, setDragging ] = useState(false);
  const [ fps, setFps ] = useState(0);
  const [ error, setError ] = useState<string | null>(null);
  const [ full, setFull ] = useState(false);
  const [ captureBtn, setCaptureBtn ] = useState<PadButton | null>(null);
  const [ recent, setRecent ] = useState<RecentRom[]>(() => getRecentRoms());
  // 虚拟按键按下状态 (键盘 / 手柄 / 触摸都会点亮, 全屏时的按键动效靠它)
  const [ pressed, setPressed ] = useState<Record<string, boolean>>({});

  const machineRef = useRef<GbMachine | null>(null);
  const rendererRef = useRef<GbRenderer | null>(null);
  const audioRef = useRef<GbAudio | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const romInputRef = useRef<HTMLInputElement | null>(null);
  const stateInputRef = useRef<HTMLInputElement | null>(null);
  const loopRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const framesRef = useRef(0);
  const fpsStampRef = useRef(0);
  const playingRef = useRef(false);
  const speedRef = useRef(speed);
  const keysRef = useRef(keys);
  const volumeRef = useRef(volume);
  const mutedRef = useRef(muted);
  const captureRef = useRef<PadButton | null>(null);
  const padsRef = useRef<Set<PadButton>>(new Set());
  const pressedRef = useRef<Record<string, boolean>>({});
  const romNameRef = useRef(romName);
  const activeRef = useRef(active);

  useEffect(() => { speedRef.current = speed; }, [ speed ]);
  useEffect(() => { keysRef.current = keys; }, [ keys ]);
  useEffect(() => { volumeRef.current = volume; }, [ volume ]);
  useEffect(() => { mutedRef.current = muted; }, [ muted ]);
  useEffect(() => { captureRef.current = captureBtn; }, [ captureBtn ]);
  useEffect(() => { romNameRef.current = romName; }, [ romName ]);
  useEffect(() => { activeRef.current = active; }, [ active ]);

  const loaded = romInfo.valid;

  /** 把内存里的卡带电池存档 (SRAM) 写回本机浏览器 */
  const persistSram = useCallback((name?: string) => {
    const machine = machineRef.current;
    const key = name ?? romNameRef.current;
    if (!machine || !key) return;
    try {
      const ram = machine.ramData();
      if (ram && ram.length > 0) writeSram(key, ram);
    } catch {
      /* 忽略: 电池存档只是附加能力, 失败不影响游玩 */
    }
  }, []);

  /** 更新虚拟按键的高亮状态 (相同状态直接跳过, 避免每帧 rAF 触发重渲染) */
  const markPressed = useCallback((button: PadButton, down: boolean) => {
    if ((pressedRef.current[button] ?? false) === down) return;
    pressedRef.current = { ...pressedRef.current, [button]: down };
    setPressed(pressedRef.current);
  }, []);

  /** 松开所有按键 (切走 / 暂停 / 读档时避免「按键卡住」) */
  const releaseAll = useCallback(() => {
    pressedRef.current = {};
    setPressed(pressedRef.current);
    machineRef.current?.releaseAll();
    padsRef.current = new Set();
  }, []);

  const applyVolume = useCallback((v: number, m: boolean) => {
    audioRef.current?.setVolume(m ? 0 : v);
  }, []);

  const pause = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
    setFps(0);
    lastTimeRef.current = 0;
    framesRef.current = 0;
    releaseAll();
    audioRef.current?.flush();
    persistSram();
  }, [ persistSram, releaseAll ]);

  const play = useCallback(() => {
    if (!machineRef.current) return;
    audioRef.current?.resume();
    playingRef.current = true;
    lastTimeRef.current = 0;
    framesRef.current = 0;
    fpsStampRef.current = 0;
    setPlaying(true);
    setError(null);
  }, []);

  // ---- 模拟循环: 用 requestAnimationFrame 追赶真实帧间隔, 每帧产出画面与音频 ----
  const pollGamepads = useCallback(() => {
    const machine = machineRef.current;
    const nav = typeof navigator === 'undefined' ? null : navigator;
    if (!machine || !nav || typeof nav.getGamepads !== 'function') return;
    const pressed = new Set<PadButton>();
    const pads = nav.getGamepads() ?? [];
    const pad = Array.from(pads).find((it) => it !== null && it !== undefined);
    if (pad) {
      pad.buttons.forEach((btn, i) => {
        if (!btn?.pressed) return;
        const b = gamepadButtonOf(i);
        if (b) pressed.add(b);
      });
    }
    const held = padsRef.current;
    for (const b of pressed) {
      if (!held.has(b)) machine.press(b);
    }
    for (const b of held) {
      if (!pressed.has(b)) machine.release(b);
    }
    padsRef.current = pressed;
    // 手柄按下同样点亮虚拟按键; 没接手柄时不要干预, 否则每帧都会把键盘 / 触摸的高亮清掉
    if (pad) {
      for (const b of PAD_BUTTONS) markPressed(b, pressed.has(b));
    } else if (held.size > 0) {
      for (const b of held) markPressed(b, false);
    }
  }, [ markPressed ]);

  const startLoop = useCallback(() => {
    if (loopRef.current !== null) return;
    const step = (time: number) => {
      loopRef.current = window.requestAnimationFrame(step);
      const machine = machineRef.current;
      if (!machine) return;
      if (!playingRef.current) {
        lastTimeRef.current = 0;
        framesRef.current = 0;
        return;
      }
      pollGamepads();
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = time;
        fpsStampRef.current = time;
        return;
      }
      const interval = frameIntervalMs(speedRef.current);
      let steps = 0;
      // 最多补 4 帧: 标签页切回来时不要一次猛跑几百帧
      while (time - lastTimeRef.current >= interval && steps < 4) {
        try {
          machine.stepFrame();
          rendererRef.current?.draw(machine.frameBuffer());
          audioRef.current?.write(machine.audioBuffer());
        } catch (err) {
          playingRef.current = false;
          setPlaying(false);
          setError(String((err as Error)?.message ?? err));
          return;
        }
        lastTimeRef.current += interval;
        framesRef.current += 1;
        steps += 1;
      }
      if (steps === 0) return;
      audioRef.current?.flush();
      if (time - fpsStampRef.current >= 1000) {
        const span = time - fpsStampRef.current;
        setFps(Math.round((framesRef.current * 1000) / span));
        framesRef.current = 0;
        fpsStampRef.current = time;
      }
    };
    loopRef.current = window.requestAnimationFrame(step);
  }, [ pollGamepads ]);

  // 首帧渲染后启动循环, 卸载时停止并释放音频 / 核心
  useEffect(() => {
    startLoop();
    return () => {
      if (loopRef.current !== null) {
        window.cancelAnimationFrame(loopRef.current);
        loopRef.current = null;
      }
      playingRef.current = false;
      persistSram();
      audioRef.current?.stop();
      audioRef.current = null;
      machineRef.current?.destroy();
      machineRef.current = null;
    };
  }, [ persistSram, startLoop ]);

  // 电池存档定时写回 (只在运行中且页面可见时)
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!playingRef.current) return;
      persistSram();
    }, SRAM_FLUSH_MS);
    return () => window.clearInterval(timer);
  }, [ persistSram ]);

  // 画面节点会因进入 / 退出全屏重新挂载, 需要重建渲染器
  useEffect(() => {
    rendererRef.current = createRenderer(canvasRef.current);
    return () => { rendererRef.current = null; };
  }, [ full ]);

  // ---- ROM 载入 ----
  const loadRom = useCallback(async (file: Blob, fileName: string) => {
    setLoading(true);
    try {
      const bytes = await readFileBytes(file);
      const info = parseRomHeader(bytes);
      if (!info.valid) {
        const key = ROM_ERRORS[info.error ?? 'badLogo'] ?? ROM_ERRORS.badLogo;
        setError(t(key));
        message.error(t(key));
        return;
      }
      pause();
      audioRef.current?.stop();
      audioRef.current = null;
      machineRef.current?.destroy();
      machineRef.current = null;
      const audio = new GbAudio();
      audioRef.current = audio;
      void audio.start(mutedRef.current ? 0 : volumeRef.current);
      let machine: GbMachine;
      try {
        machine = await GbMachine.create(bytes);
      } catch (err) {
        const msg = tT('ROM 载入失败: {msg}', { msg: String((err as Error)?.message ?? err) });
        setError(msg);
        message.error(msg);
        return;
      }
      machineRef.current = machine;
      const base = romBaseName(fileName || 'rom.gb');
      // 电池存档: 有存档卡带则自动读回 (RPG 进度接续)
      const sram = info.ramSizeKB > 0 ? readSram(base) : null;
      if (sram && sram.length > 0) {
        try {
          machine.setRamData(sram);
          message.info(t('已恢复卡带电池存档'));
        } catch {
          /* 忽略 */
        }
      }
      setRomName(base);
      setRomInfo(info);
      setError(null);
      const next = pushRecentRom(getRecentRoms(), { name: base, mode: info.cartMode, size: info.fileSize, at: Date.now() });
      setRecent(next);
      saveRecentRoms(next);
      setPlaying(true);
      playingRef.current = true;
      lastTimeRef.current = 0;
      framesRef.current = 0;
      fpsStampRef.current = 0;
      message.success(tT('已加载 {name}', { name: base }));
    } catch (err) {
      const msg = tT('ROM 载入失败: {msg}', { msg: String((err as Error)?.message ?? err) });
      setError(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, [ pause, t, tT ]);

  const onPickRom = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) void loadRom(file, file.name);
  }, [ loadRom ]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    void loadRom(file, file.name);
  }, [ loadRom ]);

  // 整个页面都能接收拖拽 (桌面端 HTML5 拖放需要 tauri.conf.json 里 dragDropEnabled: false)
  const dropProps = {
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => {
      if (!e.dataTransfer?.types?.includes('Files')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      if (!dragging) setDragging(true);
    },
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => {
      // 只有真正离开整个容器才取消高亮 (子元素间移动也会触发 dragleave)
      if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
      setDragging(false);
    },
    onDrop,
  };

  // ---- 重置 / 存档 / 截屏 ----
  const reset = useCallback(() => {
    const machine = machineRef.current;
    if (!machine) return;
    try {
      // 重置等同于重新开机: 卡带电池存档需要保留
      const ram = machine.ramData();
      machine.reset();
      if (ram && ram.length > 0) machine.setRamData(ram);
      releaseAll();
      audioRef.current?.flush();
      message.success(t('重置'));
    } catch (err) {
      message.error(String((err as Error)?.message ?? err));
    }
  }, [ releaseAll, t ]);

  const saveState = useCallback(async () => {
    const machine = machineRef.current;
    if (!machine) return;
    try {
      const text = encodeSaveState(machine.saveState());
      const ok = await saveTextFile(stateFileName(romName || 'rom.gb'), text, t('保存状态'), {
        filterName: 'GameBoy 存档', extensions: [ 'gbstate' ],
      });
      if (ok) message.success(t('已保存状态到文件'));
    } catch (err) {
      message.error(String((err as Error)?.message ?? err));
    }
  }, [ romName, t ]);

  const loadStateFile = useCallback(async (file: Blob) => {
    const machine = machineRef.current;
    if (!machine) return;
    try {
      machine.loadState(decodeSaveState(await readFileText(file)));
      releaseAll();
      pause();
      message.success(t('已读取存档'));
    } catch {
      message.error(t('文件不是有效的存档'));
    }
  }, [ pause, releaseAll, t ]);

  const onPickState = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) void loadStateFile(file);
  }, [ loadStateFile ]);

  const quickSave = useCallback(() => {
    const machine = machineRef.current;
    if (!machine) return;
    try {
      const text = encodeSaveState(machine.saveState());
      if (writeQuickSave(text)) message.success(t('快速存档已写入'));
      else message.error(t('快速存档写入失败 (存储空间不足)'));
    } catch (err) {
      message.error(String((err as Error)?.message ?? err));
    }
  }, [ t ]);

  const quickLoad = useCallback(() => {
    const machine = machineRef.current;
    if (!machine) return;
    const text = readQuickSave();
    if (!text) {
      message.info(t('没有快速存档'));
      return;
    }
    try {
      machine.loadState(decodeSaveState(text));
      releaseAll();
      pause();
      message.success(t('快速读档完成'));
    } catch {
      message.error(t('文件不是有效的存档'));
    }
  }, [ pause, releaseAll, t ]);

  const screenshot = useCallback(async () => {
    const url = rendererRef.current?.snapshot() ?? null;
    if (!url) {
      message.warning(t('截屏'));
      return;
    }
    const ok = await savePngFile(screenshotFileName(romName || 'gb'), url);
    if (ok) message.success(t('已保存截屏图片'));
  }, [ romName, t ]);

  const toggleMute = useCallback(() => {
    const next = ! mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    applyVolume(volumeRef.current, next);
    if (!next) audioRef.current?.resume();
  }, [ applyVolume ]);

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

  // 切到其它工具时退出全屏并暂停 (别在后台空转)
  useEffect(() => {
    if (active) return;
    if (full) exitFull();
    if (playingRef.current) pause();
  }, [ active, full, exitFull, pause ]);

  // ---- 键盘: 手柄按键 + 快捷键 ----
  const actionsRef = useRef({
    play, pause, reset, quickSave, quickLoad, toggleMute, toggleFull: () => setFull(true), screenshot,
  });
  useEffect(() => {
    actionsRef.current = { play, pause, reset, quickSave, quickLoad, toggleMute, toggleFull: () => setFull(true), screenshot };
  });

  useEffect(() => {
    if (!active) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target as HTMLElement | null)) return;
      // 键位捕获模式: 下一个按键直接作为该手柄键的键位
      const capturing = captureRef.current;
      if (capturing) {
        e.preventDefault();
        if (e.key === 'Escape') {
          setCaptureBtn(null);
          return;
        }
        if (e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;
        const next = rebindKey(keysRef.current, capturing, e.key);
        keysRef.current = next;
        setKeys(next);
        patchDefaultOptions({ keys: next });
        setCaptureBtn(null);
        return;
      }
      const machine = machineRef.current;
      if (!machine) return;
      const hot = hotkeyOf(e.key);
      if (hot) {
        e.preventDefault();
        const a = actionsRef.current;
        if (hot === 'playPause') (playingRef.current ? a.pause : a.play)();
        else if (hot === 'quickSave') a.quickSave();
        else if (hot === 'quickLoad') a.quickLoad();
        else if (hot === 'reset') a.reset();
        else if (hot === 'mute') a.toggleMute();
        else if (hot === 'fullscreen') a.toggleFull();
        return;
      }
      const button = buildKeyLookup(keysRef.current)[e.key];
      if (!button) return;
      e.preventDefault();
      if (e.repeat) return;
      audioRef.current?.resume();
      markPressed(button, true);
      machine.press(button);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const machine = machineRef.current;
      if (!machine) return;
      const button = buildKeyLookup(keysRef.current)[e.key];
      if (!button) return;
      e.preventDefault();
      markPressed(button, false);
      machine.release(button);
    };
    const onBlur = () => releaseAll();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      releaseAll();
    };
  }, [ active, releaseAll ]);

  // ---- 触摸 / 鼠标按键 ----
  const padDown = useCallback((button: PadButton) => {
    markPressed(button, true);
    const machine = machineRef.current;
    if (!machine) return;
    audioRef.current?.resume();
    machine.press(button);
  }, [ markPressed ]);

  const padUp = useCallback((button: PadButton) => {
    markPressed(button, false);
    machineRef.current?.release(button);
  }, [ markPressed ]);

  const padProps = (button: PadButton) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); padDown(button); },
    onPointerUp: (e: React.PointerEvent) => { e.preventDefault(); padUp(button); },
    onPointerLeave: () => padUp(button),
    onPointerCancel: () => padUp(button),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  /** 虚拟按键的 class (按下时加 is-down, 有缩放 + 高亮动效) */
  const padBtnClass = (button: PadButton) => `gb-pad-btn${pressed[button] ? ' is-down' : ''}`;

  /** 全屏时浮在画面底部的虚拟按键 (透明度可设置; 触摸 / 键盘 / 手柄按下都会高亮) */
  const overlayPadNode = (
    <div
      className="gb-overlay-pad"
      data-testid="gb-overlay-pad"
      style={ { opacity: padOpacityToAlpha(opts.padOpacity) } }
    >
      <div className="gb-pad" data-pad-group="dpad">
        <span />
        <button type="button" className={ padBtnClass('Up') } data-pad="Up" aria-label={ t('上') } { ...padProps('Up') }>↑</button>
        <span />
        <button type="button" className={ padBtnClass('Left') } data-pad="Left" aria-label={ t('左') } { ...padProps('Left') }>←</button>
        <span />
        <button type="button" className={ padBtnClass('Right') } data-pad="Right" aria-label={ t('右') } { ...padProps('Right') }>→</button>
        <span />
        <button type="button" className={ padBtnClass('Down') } data-pad="Down" aria-label={ t('下') } { ...padProps('Down') }>↓</button>
        <span />
      </div>
      <div className="gb-overlay-faces">
        <div className="gb-overlay-row">
          <button type="button" className={ `${padBtnClass('Select')} gb-overlay-mini` } data-pad="Select" { ...padProps('Select') }>
            Select
          </button>
          <button type="button" className={ `${padBtnClass('Start')} gb-overlay-mini` } data-pad="Start" { ...padProps('Start') }>
            Start
          </button>
        </div>
        <div className="gb-overlay-row">
          <button type="button" className={ `${padBtnClass('B')} gb-overlay-round` } data-pad="B" { ...padProps('B') }>B</button>
          <button type="button" className={ `${padBtnClass('A')} gb-overlay-round` } data-pad="A" { ...padProps('A') }>A</button>
        </div>
      </div>
    </div>
  );

  // ---- 渲染 ----
  const modeLabel = romInfo.cartMode === 'only' ? 'CGB 专用'
    : romInfo.cartMode === 'compatible' ? 'CGB 兼容' : 'DMG (灰机)';

  const cartItems = useMemo(() => (romInfo.valid ? [
    { key: 'title', label: t('卡带标题'), children: romInfo.title || romName || '—' },
    { key: 'type', label: t('卡带类型'), children: romInfo.cartTypeName },
    { key: 'size', label: t('卡带容量'), children: `${romInfo.romSizeKB} KB · ${formatRomSize(romInfo.fileSize)}` },
    { key: 'ram', label: t('卡带内存'), children: romInfo.ramSizeKB > 0 ? `${romInfo.ramSizeKB} KB` : t('无') },
    { key: 'mode', label: t('运行模式'), children: t(modeLabel) },
    { key: 'battery', label: t('电池存档'), children: romInfo.battery ? t('有') : t('无') },
    {
      key: 'checksum',
      label: t('校验和'),
      children: romInfo.globalChecksumOk ? t('正确') : t('不符'),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ] : []), [ romInfo, romName, locale ]);

  const screenNode = (
    <div
      className={ `gb-screen${dragging ? ' gb-drop' : ''}` }
      data-testid="gb-screen"
      onPointerDown={ () => audioRef.current?.resume() }
    >
      <canvas
        ref={ canvasRef }
        width={ SCREEN_WIDTH }
        height={ SCREEN_HEIGHT }
        className={ `gb-canvas${opts.smooth ? ' gb-canvas-smooth' : ''}` }
        data-testid="gb-canvas"
      />
      { !loaded ? (
        <div className="gb-empty">
          <Text strong style={ { fontSize: 15, color: '#e2e8f0' } }>{ t('点击选择 ROM 文件') }</Text>
          <Text style={ { fontSize: 12, color: '#cbd5e1' } }>{ t('或把 .gb / .gbc 文件拖到这里') }</Text>
          <Button size="small" type="primary" icon={ <FolderOpenOutlined /> } onClick={ () => romInputRef.current?.click() }>
            { t('选择 ROM') }
          </Button>
          <Text style={ { fontSize: 11, opacity: 0.75, maxWidth: 320 } }>
            { t('本工具不含任何游戏 ROM, 请使用自己合法持有的卡带备份') }
          </Text>
        </div>
      ) : null }
      { full && opts.showPad ? overlayPadNode : null }
    </div>
  );

  const toolbarNode = (
    <Space size={ 6 } wrap>
      <Tooltip title={ t('选择 ROM') }>
        <Button size="small" icon={ <FolderOpenOutlined /> } onClick={ () => romInputRef.current?.click() }>
          { loaded ? t('更换 ROM') : t('选择 ROM') }
        </Button>
      </Tooltip>
      <Tooltip title={ t('运行中') + ' / ' + t('暂停') }>
        <Button
          size="small"
          type={ playing ? 'default' : 'primary' }
          disabled={ !loaded }
          icon={ playing ? <PauseCircleOutlined /> : <PlayCircleOutlined /> }
          onClick={ () => (playing ? pause() : play()) }
        >
          { playing ? t('暂停') : t('继续') }
        </Button>
      </Tooltip>
      <Tooltip title={ t('重置') }>
        <Button size="small" icon={ <ReloadOutlined /> } disabled={ !loaded } onClick={ reset }>{ t('重置') }</Button>
      </Tooltip>
      <Tooltip title={ t('保存状态') }>
        <Button size="small" icon={ <SaveOutlined /> } disabled={ !loaded } onClick={ () => void saveState() }>
          { t('保存状态') }
        </Button>
      </Tooltip>
      <Tooltip title={ t('读取状态') }>
        <Button size="small" icon={ <UploadOutlined /> } disabled={ !loaded } onClick={ () => stateInputRef.current?.click() }>
          { t('读取状态') }
        </Button>
      </Tooltip>
      <Tooltip title={ t('截屏') }>
        <Button
          size="small"
          icon={ <CameraOutlined /> }
          disabled={ !loaded }
          data-testid="gb-shot"
          onClick={ () => void screenshot() }
        />
      </Tooltip>
      <Tooltip title={ muted ? t('取消静音') : t('静音') }>
        <Button
          size="small"
          type={ muted ? 'default' : 'text' }
          icon={ <SoundOutlined /> }
          danger={ muted }
          onClick={ toggleMute }
        />
      </Tooltip>
      <Slider
        style={ { width: 110, margin: '0 4px' } }
        min={ VOLUME_MIN }
        max={ VOLUME_MAX }
        value={ muted ? 0 : volume }
        tooltip={ { formatter: (v) => `${v ?? 0}%` } }
        onChange={ (v) => {
          const next = Number(v);
          setVolume(next);
          mutedRef.current = false;
          setMuted(false);
          applyVolume(next, false);
        } }
      />
      <Segmented
        size="small"
        value={ speed }
        options={ SPEED_OPTIONS.map((s) => ({ value: s, label: `${s}×` })) }
        onChange={ (v) => setSpeed(Number(v)) }
      />
    </Space>
  );

  const padNode = (
    <Row gutter={ [ 16, 12 ] } align="middle">
      <Col>
        <div className="gb-pad" data-testid="gb-pad">
          <span />
          <button className="gb-pad-btn" aria-label={ t('上') } { ...padProps('Up') }>↑</button>
          <span />
          <button className="gb-pad-btn" aria-label={ t('左') } { ...padProps('Left') }>←</button>
          <span />
          <button className="gb-pad-btn" aria-label={ t('右') } { ...padProps('Right') }>→</button>
          <span />
          <button className="gb-pad-btn" aria-label={ t('下') } { ...padProps('Down') }>↓</button>
          <span />
        </div>
      </Col>
      <Col flex="auto">
        <Space size={ 6 } wrap>
          <Button danger disabled={ !loaded } { ...padProps('B') }>{ t('B 键') }</Button>
          <Button type="primary" disabled={ !loaded } { ...padProps('A') }>{ t('A 键') }</Button>
          <Button size="small" disabled={ !loaded } { ...padProps('Select') }>Select</Button>
          <Button size="small" disabled={ !loaded } { ...padProps('Start') }>Start</Button>
        </Space>
      </Col>
    </Row>
  );

  const keyRowsNode = (
    <Space size={ 6 } wrap data-testid="gb-keys">
      { PAD_BUTTONS.map((button) => (
        <Tooltip key={ button } title={ t('点击后按下新的按键') }>
          <Button
            size="small"
            type={ captureBtn === button ? 'primary' : 'default' }
            onClick={ () => setCaptureBtn(captureBtn === button ? null : button) }
            data-key-button={ button }
          >
            { `${t(button === 'A' ? 'A 键' : button === 'B' ? 'B 键' : button)}: ${
              captureBtn === button ? t('按键中… (Esc 取消)') : keyDisplayName(keyLabel(keys, button))
            }` }
          </Button>
        </Tooltip>
      ))}
    </Space>
  );

  const infoNode = (
    <Space direction="vertical" size={ 10 } style={ { width: '100%' } }>
      <Space size={ 6 } wrap>
        { loading ? <Tag color="processing">{ t('载入中…') }</Tag> : null }
        <Tag color={ playing ? 'green' : 'default' }>{ playing ? t('运行中') : t('已暂停') }</Tag>
        { opts.showFps && loaded ? <Tag color="blue">{ `FPS ${fps}` }</Tag> : null }
        { romInfo.cartMode !== 'dmg' ? <Tag color="magenta">{ romInfo.cartMode === 'only' ? 'CGB' : 'CGB 兼容' }</Tag> : null }
        { romInfo.battery ? <Tag color="gold">{ t('电池存档') }</Tag> : null }
      </Space>
      { loaded ? (
        <Descriptions size="small" column={ 2 } items={ cartItems } colon={ false } />
      ) : (
        <Text type="secondary" style={ { fontSize: 12 } }>
          { t('仅支持 .gb / .gbc 卡带文件 (MBC1 / MBC2 / MBC3 / MBC5 等常见卡带)') }
        </Text>
      ) }
      <Text type="secondary" style={ { fontSize: 12 } }>{ t('ROM 只在本地内存中运行, 不会上传; 长期保存请自行保留 ROM 文件') }</Text>
      <Divider style={ { margin: '4px 0' } } />
      <Text type="secondary" style={ { fontSize: 12 } }>{ t('按键设置') }</Text>
      { keyRowsNode }
      <Text type="secondary" style={ { fontSize: 12 } }>{ t('方向键移动 · Z(A) / X(B) · Enter(Start) · Shift(Select) · P 暂停 · F5 存档 · F8 读档 · F11 全屏') }</Text>
      <Text type="secondary" style={ { fontSize: 12 } }>{ t('支持标准 USB / 蓝牙手柄 (Gamepad API), 插上后直接可用') }</Text>
      <Text type="secondary" style={ { fontSize: 12 } }>{ t('若没有声音, 先点一下画面或按一个键 (浏览器要求先有用户操作)') }</Text>
      <Text type="secondary" style={ { fontSize: 12 } }>{ t('快速存档只保存在本机浏览器, 换设备或清缓存即丢失') }</Text>
      <Text type="secondary" style={ { fontSize: 12 } }>{ t('本机浏览器按 ROM 名称记住电池存档 (RPG 进度), 换设备或清缓存即丢失') }</Text>
      { recent.length > 0 ? (
        <>
          <Divider style={ { margin: '4px 0' } } />
          <Text type="secondary" style={ { fontSize: 12 } }>{ t('最近打开') }</Text>
          <Space size={ 4 } wrap>
            { recent.map((it) => (
              <Tag key={ `${it.name}-${it.at}` }>
                { `${it.name} · ${it.mode === 'dmg' ? 'DMG' : 'CGB'} · ${formatRomSize(it.size)}` }
              </Tag>
            ))}
          </Space>
          <Text type="secondary" style={ { fontSize: 12 } }>{ t('只记录文件名与模式, 不会保存 ROM 内容') }</Text>
        </>
      ) : null }
    </Space>
  );

  const hiddenInputs = (
    <>
      <input
        ref={ romInputRef }
        type="file"
        accept=".gb,.gbc,.bin,.GB,.GBC,.BIN"
        style={ { display: 'none' } }
        data-testid="gb-rom-input"
        onChange={ onPickRom }
      />
      <input
        ref={ stateInputRef }
        type="file"
        accept=".gbstate,.txt,text/plain"
        style={ { display: 'none' } }
        data-testid="gb-state-input"
        onChange={ onPickState }
      />
    </>
  );

  const alertNode = error ? (
    <Alert type="error" showIcon message={ t('运行异常') } description={ error } closable onClose={ () => setError(null) } />
  ) : null;

  if (full) {
    return (
      <>
        <style>{ GB_CSS }</style>
        { hiddenInputs }
        <div
          ref={ stageRef }
          className="gb-stage gb-full"
          data-testid="gb-full"
          { ...dropProps }
          style={ { background: '#000' } }
        >
          { screenNode }
          <Space size={ 8 } wrap style={ { justifyContent: 'center' } }>
            <Button
              size="small"
              type={ playing ? 'default' : 'primary' }
              icon={ playing ? <PauseCircleOutlined /> : <PlayCircleOutlined /> }
              disabled={ !loaded }
              onClick={ () => (playing ? pause() : play()) }
            >
              { playing ? t('暂停') : t('继续') }
            </Button>
            <Button size="small" icon={ <FullscreenExitOutlined /> } onClick={ exitFull }>{ t('退出全屏') }</Button>
            <Text style={ { fontSize: 12, color: 'rgba(255,255,255,0.65)' } }>{ t('Esc 退出全屏') }</Text>
          </Space>
        </div>
      </>
    );
  }

  return (
    <div className="gb-stage" style={ { width: '100%' } } { ...dropProps }>
      <style>{ GB_CSS }</style>
      { hiddenInputs }
      <Space direction="vertical" size={ 16 } style={ { width: '100%' } }>
        <Card
          size="small"
          title={ t('GameBoy 模拟器') }
          extra={
            <Button size="small" icon={ <FullscreenOutlined /> } onClick={ () => setFull(true) } disabled={ !loaded }>
              { t('全屏') }
            </Button>
          }
        >
          <Space direction="vertical" size={ 12 } style={ { width: '100%' } }>
            { alertNode }
            { loading && !loaded ? <Text type="secondary">{ t('正在初始化模拟核心…') }</Text> : null }
            { screenNode }
            { toolbarNode }
            { padNode }
          </Space>
        </Card>

        <Card size="small" title={ t('卡带信息') }>
          { infoNode }
        </Card>

        <Divider>{ t('GameBoy 模拟器说明') }</Divider>
        <GameBoyIntro />
      </Space>
    </div>
  );
};

export default GameBoyEmulator;
