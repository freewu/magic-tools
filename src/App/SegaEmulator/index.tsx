// Sega 模拟器: Mega Drive / Genesis (以及 Master System / Game Gear) 游戏
// 模拟核心为 Genesis Plus GX 的 wasm 构建 (libretro, GPL-3.0), 界面控制器为 EmulatorJS 4.2.3 (GPL-3.0),
// 两者都内置在仓库 src/public/emulatorjs 下, 运行期不联网、不上传 ROM。
// 页面把播放器页放进 <iframe> 里, 用来隔离 EmulatorJS 的全局 CSS / 全局变量:
//   1. 选好 ROM 后挂载 iframe; onLoad 时通过同源 contentWindow.__mtStartRom(file) 把文件交给播放器页;
//   2. 用户在播放器页上拖入新 ROM 时, 播放器页 postMessage 回来, 由本页重新挂载 iframe 再载入
//      (EmulatorJS 一个页面只允许实例化一次, 换 ROM 只能整页重来);
//   3. 文件名 / 选项 / 消息解析等纯逻辑在 lib.ts。
import { Alert, Button, Card, Descriptions, Divider, Space, Tag, Typography, message, theme } from 'antd';
import {
  FullscreenExitOutlined, FullscreenOutlined, ReloadOutlined, UndoOutlined, UploadOutlined,
} from '@ant-design/icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BUTTON_IDS, BUTTON_LABELS, DEFAULT_KEYS, PAD_DPAD_GRID, PAD_FACE_ROWS, PAD_SYSTEM, ROM_ACCEPT, SEGA_BUTTONS, SEGA_CSS,
  type SegaButton,
} from './data';
import {
  coreLabelOf, coreOfRomName, formatFileSize, getDefaultOptions, getKeys, isCustomKeys, isRomFileName, keyLabelOf,
  keyOwner, keysToIds, padOpacityToAlpha, parsePlayerMessage, pickRomFile, playerUrl, resetKeys, setKeys,
  type SegaKeys,
} from './lib';
import { u, uT } from './lang';
import SegaEmulatorIntro from './intro';
import { useLocale } from '../../hook/locale-context';

const { Text } = Typography;

type FullscreenElement = HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};
/** 播放器页暴露给本页 (同源) 的入口: 启动 ROM / 实时更新键位 */
type PlayerWindow = Window & {
  __mtStartRom?: (file: File) => void;
  __mtSetKeys?: (ids: Record<string, number>) => void;
  /** 游戏层虚拟按键: 直接把按下 / 松开喂给模拟核心 */
  __mtInput?: (id: number, down: boolean) => void;
};

/** 错误提示: 标题固定, 细节来自播放器页 (没有细节时给默认文案) */
type PlayerError = { title: string; detail: string };

/**
 * 播放器页的三个阶段 (都由它 postMessage 过来):
 * idle = 还没选 ROM; loading = 正在载入脚本 / 核心; ready = 界面已就绪, 等用户点「开始」; running = 游戏已开跑
 */
type Phase = 'idle' | 'loading' | 'ready' | 'running';

const SegaEmulator: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tT = (zh: string, vars: Record<string, string | number>) => uT(locale, zh, vars);
  const { token } = theme.useToken();

  // 设置只在挂载时读一次: 播放器页的地址里带着音量, 播放中改设置不应该打断游戏
  const optsRef = useRef(getDefaultOptions());
  const [ romFile, setRomFile ] = useState<File | null>(null);
  const [ romName, setRomName ] = useState('');
  const [ frameSrc, setFrameSrc ] = useState('');
  const [ frameKey, setFrameKey ] = useState(0);
  // 游戏层虚拟按键的按下状态 (键盘 / 手柄 / 触屏都会点亮): 用编号做 key, 与 EmulatorJS 对齐
  const [ pressed, setPressed ] = useState<Record<number, boolean>>({});
  // 键位: 点一下按键 -> 按新键; 存本机, 并实时推给播放器页 (游戏运行中也能改)
  const [ keys, setKeysState ] = useState<SegaKeys>(() => getKeys());
  const [ binding, setBinding ] = useState<SegaButton | null>(null);
  const [ phase, setPhase ] = useState<Phase>('idle');
  const [ error, setError ] = useState<PlayerError | null>(null);
  const [ full, setFull ] = useState(false);
  const [ over, setOver ] = useState(false);
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const romFileRef = useRef<File | null>(null);
  const localeRef = useRef(locale);
  localeRef.current = locale;
  const keysRef = useRef(keys);
  keysRef.current = keys;
  const keysGridRef = useRef<HTMLDivElement | null>(null);
  const pressedRef = useRef<Record<number, boolean>>({});

  /** 记录某个按键的按下状态 (状态没变直接跳过, 避免无意义重渲染) */
  const markPressed = useCallback((id: number, down: boolean) => {
    if (pressedRef.current[id] === down) return;
    pressedRef.current = { ...pressedRef.current, [id]: down };
    setPressed(pressedRef.current);
  }, []);

  const clearPressed = useCallback(() => {
    pressedRef.current = {};
    setPressed(pressedRef.current);
  }, []);

  /** 写本机并同步给正在跑的模拟器 (没启动时只是更新 iframe 里的备用键位) */
  const applyKeys = useCallback((next: SegaKeys) => {
    setKeysState(next);
    const win = (frameRef.current?.contentWindow ?? null) as PlayerWindow | null;
    win?.__mtSetKeys?.(keysToIds(next));
  }, []);

  const fullscreenElement = () => (document as FullscreenDocument).fullscreenElement
    ?? (document as FullscreenDocument).webkitFullscreenElement
    ?? null;

  const exitFull = useCallback(() => {
    const doc = document as FullscreenDocument;
    if (doc.fullscreenElement || doc.webkitFullscreenElement) {
      const out = doc.exitFullscreen ?? doc.webkitExitFullscreen;
      void out?.call(doc);
    }
  }, []);

  // 请求全屏: 必须在用户手势里调用 (选 ROM 的点击 / 全屏按钮)
  const enterFull = useCallback(async () => {
    const elem = stageRef.current as FullscreenElement | null;
    if (!elem || fullscreenElement()) return;
    const request = elem.requestFullscreen ?? elem.webkitRequestFullscreen;
    try {
      await request?.call(elem);
    } catch {
      /* 浏览器拒绝 (非手势 / iframe 限制) 时保持窗口模式即可 */
    }
  }, []);

  const toggleFull = useCallback(() => {
    if (fullscreenElement()) exitFull();
    else void enterFull();
  }, [ enterFull, exitFull ]);

  const setPlayerError = (detail: string) =>
    setError({ title: u(localeRef.current, '模拟核心载入失败'), detail });

  /** 载入一个 ROM 文件 (拖放 / 选择文件 / 播放器页回调 都走这里) */
  const loadFile = useCallback((file: File) => {
    if (!isRomFileName(file.name)) {
      message.error(uT(localeRef.current, '不支持的文件类型: {name}', { name: file.name }));
      return;
    }
    romFileRef.current = file;
    setError(null);
    setPhase('loading');
    clearPressed();
    setRomFile(file);
    setRomName(file.name);
    setFrameSrc(playerUrl({
      locale: localeRef.current,
      volume: optsRef.current.volume,
      core: coreOfRomName(file.name),
      keys: keysRef.current,
    }));
    // 换 key 强制重建 iframe: EmulatorJS 一个页面只能实例化一次
    setFrameKey((k) => k + 1);
    if (optsRef.current.autoFullscreen) void enterFull();
  }, [ enterFull ]);

  const loadFileRef = useRef(loadFile);
  useEffect(() => {
    loadFileRef.current = loadFile;
  }, [ loadFile ]);

  const openPicker = () => inputRef.current?.click();

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = pickRomFile(e.target.files);
    // 允许再次选择同一个文件 (否则 change 不会再触发)
    e.target.value = '';
    if (file) loadFile(file);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOver(false);
    const file = pickRomFile(e.dataTransfer?.files);
    if (!file) return;
    // 播放器页里已经载入过 ROM 时也允许直接换牌: 交给 loadFile 重挂 iframe
    loadFile(file);
  };

  /** iframe 载入完成: 把 ROM 交给播放器页 (同源直调, 不传文件副本) */
  const onFrameLoad = () => {
    const win = (frameRef.current?.contentWindow ?? null) as PlayerWindow | null;
    const file = romFileRef.current;
    if (!win || !file) return;
    if (typeof win.__mtStartRom !== 'function') {
      setPlayerError(u(localeRef.current, '模拟核心载入失败, 请刷新页面重试'));
      return;
    }
    win.__mtStartRom(file);
  };

  // 播放器页的回报: 启动成功 / 启动失败 / 用户又把新 ROM 拖进了播放器页
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const frame = frameRef.current;
      // 只接受播放器页发来的消息 (e.source 缺省时放行, 例如某些合成事件)
      if (frame && e.source && e.source !== frame.contentWindow) return;
      const msg = parsePlayerMessage(e.data);
      if (!msg) return;
      if (msg.kind === 'loading') {
        setPhase('loading');
      } else if (msg.kind === 'ready') {
        setPhase('ready');
      } else if (msg.kind === 'started') {
        setPhase('running');
        setError(null);
      } else if (msg.kind === 'error') {
        setPhase('ready');
        setPlayerError(msg.message || u(localeRef.current, '模拟核心载入失败, 请刷新页面重试'));
      } else if (msg.kind === 'input') {
        markPressed(msg.id, msg.down);
      } else {
        loadFileRef.current(msg.file);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [ markPressed ]);

  // 全屏状态跟随浏览器 (含 Esc 退出 / 模拟器内部按钮)
  useEffect(() => {
    const onChange = () => setFull(!!fullscreenElement());
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  // 待绑定状态: 抓一次键盘事件 (捕获阶段, 先于页面其它快捷键), Esc 取消;
  // 点到别处 (比如去点模拟器画面) 也取消, 否则下一次按键会被当成绑定目标而不是游戏输入
  useEffect(() => {
    if (!binding) return;
    const onPointerDown = (e: Event) => {
      const grid = keysGridRef.current;
      const target = e.target as Node | null;
      if (grid && target && grid.contains(target)) return;
      if (target && (target as HTMLElement).closest?.(`[data-testid="sega-key-${binding}"]`)) return;
      setBinding(null);
    };
    const onBlur = () => setBinding(null);
    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') {
        setBinding(null);
        return;
      }
      const code = typeof e.keyCode === 'number' ? e.keyCode : 0;
      if (code <= 0) return;
      const owner = keyOwner(keysRef.current, code, binding);
      if (owner) {
        message.warning(uT(localeRef.current, '{key} 已经分配给 {name} 了, 请先给它换一个键', {
          key: keyLabelOf(code),
          name: BUTTON_LABELS[owner],
        }));
        return;
      }
      applyKeys(setKeys({ ...keysRef.current, [binding]: code }));
      setBinding(null);
    };
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('blur', onBlur);
    };
  }, [ applyKeys, binding ]);

  const resetAllKeys = () => {
    applyKeys(resetKeys());
    setBinding(null);
    message.success(u(localeRef.current, '已恢复默认键位'));
  };

  const restart = () => {
    if (!romFileRef.current) return;
    setPhase('loading');
    setError(null);
    clearPressed();
    setFrameKey((k) => k + 1);
  };

  const core = romName ? coreOfRomName(romName) : '';
  const stageVars = {
    '--sega-bg': token.colorFillQuaternary,
    '--sega-bg-hover': token.colorFillTertiary,
    '--sega-fg': token.colorTextSecondary,
    '--sega-line': token.colorBorder,
  } as React.CSSProperties;

  const errorNode = error ? (
    <Alert
      type="error"
      showIcon
      message={ error.title }
      description={ error.detail }
      closable
      onClose={ () => setError(null) }
    />
  ) : null;

  /** 游戏层虚拟按键: 触摸 / 鼠标按下时直接把输入喂给模拟核心 (同源 iframe) */
  const pressPad = (btn: SegaButton, down: boolean) => {
    const win = (frameRef.current?.contentWindow ?? null) as PlayerWindow | null;
    win?.__mtInput?.(BUTTON_IDS[btn], down);
    markPressed(BUTTON_IDS[btn], down);
  };

  const padButton = (btn: SegaButton, wide = false) => {
    const id = BUTTON_IDS[btn];
    const down = pressed[id] === true;
    return (
      <button
        key={ btn }
        type="button"
        className={ `sega-pad-btn${wide ? ' is-wide' : ''}${down ? ' is-down' : ''}` }
        data-testid={ `sega-pad-${btn}` }
        aria-label={ BUTTON_LABELS[btn] }
        aria-pressed={ down }
        onPointerDown={ (e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
          pressPad(btn, true);
        } }
        onPointerUp={ (e) => {
          (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
          pressPad(btn, false);
        } }
        onPointerCancel={ () => pressPad(btn, false) }
        onLostPointerCapture={ () => pressPad(btn, false) }
        onContextMenu={ (e) => e.preventDefault() }
      >
        { BUTTON_LABELS[btn] }
      </button>
    );
  };

  /** 游戏层虚拟按键浮层 (半透明, 透明度可在设置里调; 键盘 / 手柄 / 触屏按下都会亮起) */
  const padNode = romFile && optsRef.current.showPad ? (
    <div
      className="sega-pad"
      style={ { opacity: padOpacityToAlpha(optsRef.current.padOpacity) } }
      data-testid="sega-pad"
    >
      <div className="sega-pad-cluster sega-pad-dpad">
        { PAD_DPAD_GRID.map((btn, i) => (btn ? padButton(btn) : <span key={ `gap-${i}` } />)) }
      </div>
      <div className="sega-pad-cluster sega-pad-faces">
        { PAD_FACE_ROWS.map((row) => (
          <div className="sega-pad-row" key={ row.join('') }>
            { row.map((btn) => padButton(btn)) }
          </div>
        )) }
        <div className="sega-pad-row">
          { PAD_SYSTEM.map((btn) => padButton(btn, true)) }
        </div>
      </div>
    </div>
  ) : null;

  const stageNode = romFile ? (
    <iframe
      key={ frameKey }
      ref={ frameRef }
      className="sega-frame"
      title={ t('Sega 模拟器') }
      src={ frameSrc }
      onLoad={ onFrameLoad }
      allow="autoplay; fullscreen; gamepad"
      allowFullScreen
      data-testid="sega-frame"
    />
  ) : (
    <div
      className={ `sega-drop${over ? ' is-over' : ''}` }
      role="button"
      tabIndex={ 0 }
      onClick={ openPicker }
      onKeyDown={ (e) => { if (e.key === 'Enter' || e.key === ' ') openPicker(); } }
      data-testid="sega-drop"
    >
      <span className="sega-drop-title">{ t('点击选择 ROM 文件') }</span>
      <span className="sega-drop-hint">{ t('或把 ROM 文件拖到这里') }</span>
      <Text type="secondary" style={ { fontSize: 12, maxWidth: 520 } }>
        { t('支持 .md / .bin / .gen / .smd (Mega Drive)、.sms (Master System)、.gg (Game Gear), 也支持 .zip / .7z 压缩包') }
      </Text>
      <Text type="secondary" style={ { fontSize: 12, maxWidth: 520 } }>
        { t('本工具不含任何游戏 ROM, 请使用自己合法持有的卡带备份') }
      </Text>
    </div>
  );

  return (
    <div className="sega-stage-wrap" style={ { width: '100%' } }>
      <style>{ SEGA_CSS }</style>
      <input
        ref={ inputRef }
        type="file"
        accept={ ROM_ACCEPT }
        style={ { display: 'none' } }
        data-testid="sega-rom-input"
        onChange={ onPick }
      />
      <Space direction="vertical" size={ 16 } style={ { width: '100%' } }>
        <Card
          size="small"
          title={ t('Sega 模拟器') }
          extra={
            <Space size={ 8 } wrap>
              <Button size="small" icon={ <UploadOutlined /> } onClick={ openPicker }>
                { t(romFile ? '更换 ROM' : '选择 ROM') }
              </Button>
              <Button size="small" icon={ <ReloadOutlined /> } disabled={ !romFile } onClick={ restart }>
                { t('重新开始') }
              </Button>
              <Button
                size="small"
                icon={ full ? <FullscreenExitOutlined /> : <FullscreenOutlined /> }
                disabled={ !romFile }
                onClick={ toggleFull }
              >
                { t(full ? '退出全屏' : '全屏') }
              </Button>
            </Space>
          }
        >
          <Space direction="vertical" size={ 12 } style={ { width: '100%' } }>
            { errorNode }
            <div
              ref={ stageRef }
              className={ `sega-stage${full ? ' is-full' : ''}` }
              style={ stageVars }
              onDragOver={ (e) => { e.preventDefault(); setOver(true); } }
              onDragLeave={ () => setOver(false) }
              onDrop={ onDrop }
              data-testid="sega-stage"
            >
              { stageNode }
              { padNode }
            </div>
            { phase !== 'running' ? (
              <Text type="secondary" style={ { fontSize: 12 } }>
                { t('首次播放声音需要点一下画面或按一个键 (浏览器自动播放策略)') }
                { full ? ` · ${t('全屏时可按 Esc 退出')}` : '' }
              </Text>
            ) : null }
          </Space>
        </Card>

        <Card
          size="small"
          title={ t('按键配置') }
          extra={
            <Space size={ 8 } wrap>
              <Tag color={ isCustomKeys(keys) ? 'blue' : undefined }>
                { t(isCustomKeys(keys) ? '自定义' : '默认') }
              </Tag>
              <Button
                size="small"
                icon={ <UndoOutlined /> }
                disabled={ !isCustomKeys(keys) }
                onClick={ resetAllKeys }
              >
                { t('恢复默认') }
              </Button>
            </Space>
          }
        >
          <Space direction="vertical" size={ 8 } style={ { width: '100%' } }>
            <Text type="secondary" style={ { fontSize: 12 } }>
              { t('点一下按键再按键盘上的新键即可重绑, 改完立刻生效 (游戏运行中也能改)') }
            </Text>
            <div className="sega-keys" ref={ keysGridRef }>
              { SEGA_BUTTONS.map((btn) => {
                const custom = keys[btn] !== DEFAULT_KEYS[btn];
                const on = binding === btn;
                return (
                  <div
                    key={ btn }
                    role="button"
                    tabIndex={ 0 }
                    className={ `sega-key${custom ? ' is-custom' : ''}${on ? ' is-binding' : ''}` }
                    data-testid={ `sega-key-${btn}` }
                    aria-label={ `${BUTTON_LABELS[btn]} ${on ? t('按新键…') : keyLabelOf(keys[btn])}` }
                    onClick={ () => setBinding(on ? null : btn) }
                    onKeyDown={ (e) => {
                      if (e.key !== 'Enter' && e.key !== ' ') return;
                      e.preventDefault();
                      setBinding(on ? null : btn);
                    } }
                  >
                    <span className="sega-key-name">{ BUTTON_LABELS[btn] }</span>
                    <span className="sega-key-val">{ on ? t('按新键…') : keyLabelOf(keys[btn]) }</span>
                  </div>
                );
              }) }
            </div>
            <Text type="secondary" style={ { fontSize: 12 } }>
              { t('默认: 方向键 = 十字键, Z / X / C = A / B / C, A / S / D = X / Y / Z, Enter = Start, V = Mode') }
            </Text>
            <Text type="secondary" style={ { fontSize: 12 } }>
              { t('触屏设备请用画面上的虚拟手柄; 外接手柄无需设置, 可以与键盘同时使用') }
            </Text>
            <Text type="secondary" style={ { fontSize: 12 } }>
              { t('画面上的半透明按键可用鼠标 / 触屏点, 也可在「设置 → 游戏 → Sega 模拟器」里关掉或调整透明度') }
            </Text>
          </Space>
        </Card>

        { romFile ? (
          <Card
            size="small"
            title={ t('当前 ROM') }
            extra={
              phase === 'loading'
                ? <Tag color="processing">{ tT('正在载入 {name}', { name: romName }) }</Tag>
                : phase === 'running'
                  ? <Tag color="green">{ t('运行中') }</Tag>
                  : null
            }
          >
            <Descriptions size="small" column={ { xs: 1, sm: 2, md: 3 } }>
              <Descriptions.Item label={ t('当前 ROM') }>{ romName }</Descriptions.Item>
              <Descriptions.Item label={ t('机型') }>{ coreLabelOf(core) }</Descriptions.Item>
              <Descriptions.Item label={ t('文件大小') }>{ formatFileSize(romFile.size) }</Descriptions.Item>
              <Descriptions.Item label={ t('模拟核心') }>Genesis Plus GX (WebAssembly)</Descriptions.Item>
              <Descriptions.Item label={ t('界面控制器') }>EmulatorJS 4.2.3</Descriptions.Item>
            </Descriptions>
          </Card>
        ) : null }

        <Divider>{ t('Sega 模拟器说明') }</Divider>
        <SegaEmulatorIntro />
      </Space>
    </div>
  );
};

export default SegaEmulator;
