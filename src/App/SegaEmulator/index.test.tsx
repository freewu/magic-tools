import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import SegaEmulator from './index';
import { DEFAULT_KEYS, KEYS_STORAGE_KEY, SETTINGS_STORAGE_KEY } from './data';

// app-context 依赖 App/index.tsx 的顶层 await + import.meta.glob (jest commonjs 不支持), 故打桩
jest.mock('../../hook/app-context', () => ({
  AppContext: require('react').createContext(null),
}));

const fileOf = (name: string, size = 4096) => new File([ new Uint8Array(size) ], name);

/** 通过隐藏的 <input type="file"> 选文件 */
const pick = (file: File) => {
  fireEvent.change(screen.getByTestId('sega-rom-input'), { target: { files: [ file ] } });
};

/** 播放器页回报一条消息 (模拟 postMessage) */
const postFromPlayer = (data: unknown, source?: unknown) => {
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { data, source: source as Window }));
  });
};

/** 当前渲染出来的键位 (data-testid -> 显示文本) */
const keyText = (btn: string) => screen.getByTestId(`sega-key-${btn}`).textContent ?? '';

/** 用 MouseEvent 冒充 pointer 事件 (jsdom 没有 PointerEvent) */
const pointer = (el: Element, type: 'pointerdown' | 'pointerup', pointerId = 1) => {
  fireEvent(el, new MouseEvent(type, { bubbles: true, cancelable: true, button: 0 } as MouseEventInit));
};

/** 绑定一个键: 点按键进入待绑定, 再按键盘上的新键 */
const bindKey = (btn: string, code: number, key = 'k') => {
  fireEvent.click(screen.getByTestId(`sega-key-${btn}`));
  fireEvent.keyDown(window, { key, keyCode: code });
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe('Sega 模拟器页面', () => {
  test('初始渲染: 只显示拖放区, 不挂 iframe', () => {
    render(<SegaEmulator />);
    expect(screen.getByTestId('sega-drop')).toBeInTheDocument();
    expect(screen.queryByTestId('sega-frame')).not.toBeInTheDocument();
    expect(screen.getByText('点击选择 ROM 文件')).toBeInTheDocument();
    expect(screen.getByText('或把 ROM 文件拖到这里')).toBeInTheDocument();
    expect(screen.getByText('本工具不含任何游戏 ROM, 请使用自己合法持有的卡带备份')).toBeInTheDocument();
    // 还没选 ROM 时「重新开始 / 全屏」不可点
    expect(screen.getByRole('button', { name: /重新开始/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /全屏/ })).toBeDisabled();
  });

  test('选择 ROM 后挂 iframe, 载入完成时把文件交给播放器页', async () => {
    render(<SegaEmulator />);
    pick(fileOf('sonic.md'));

    const frame = (await screen.findByTestId('sega-frame')) as HTMLIFrameElement;
    const src = frame.getAttribute('src') ?? '';
    expect(src).toContain('emulatorjs/player.html');
    expect(src).toContain('core=segaMD');
    // 拖放区已被 iframe 取代, 信息区显示「正在载入」
    expect(screen.queryByTestId('sega-drop')).not.toBeInTheDocument();
    expect(screen.getByText('正在载入 sonic.md')).toBeInTheDocument();

    const start = jest.fn();
    (frame.contentWindow as unknown as { __mtStartRom: jest.Mock }).__mtStartRom = start;
    fireEvent.load(frame);

    expect(start).toHaveBeenCalledTimes(1);
    const passed = start.mock.calls[0][0] as File;
    expect(passed.name).toBe('sonic.md');
  });

  test('Master System / Game Gear 的 ROM 按扩展名选核心', async () => {
    render(<SegaEmulator />);
    pick(fileOf('alex.sms', 1024));

    const frame = (await screen.findByTestId('sega-frame')) as HTMLIFrameElement;
    expect(frame.getAttribute('src')).toContain('core=segaMS');
    expect(screen.getByText('Master System')).toBeInTheDocument();
    expect(screen.getByText('1 KB')).toBeInTheDocument();
    expect(screen.getByText('Genesis Plus GX (WebAssembly)')).toBeInTheDocument();
  });

  test('不支持的文件类型: 提示且不挂 iframe', async () => {
    render(<SegaEmulator />);
    pick(fileOf('save.sav'));

    expect(await screen.findByText('不支持的文件类型: save.sav')).toBeInTheDocument();
    expect(screen.queryByTestId('sega-frame')).not.toBeInTheDocument();
    expect(screen.getByTestId('sega-drop')).toBeInTheDocument();
  });

  test('把 ROM 拖到舞台区域也能载入', () => {
    render(<SegaEmulator />);
    fireEvent.drop(screen.getByTestId('sega-stage'), { dataTransfer: { files: [ fileOf('bare.md') ] } });

    expect(screen.getByTestId('sega-frame')).toBeInTheDocument();
    expect(screen.getByText('bare.md')).toBeInTheDocument();
  });

  test('播放器页回报启动成功 → 显示运行中, 收起声音提示', async () => {
    render(<SegaEmulator />);
    pick(fileOf('sonic.md'));
    await screen.findByTestId('sega-frame');

    expect(screen.getByText('首次播放声音需要点一下画面或按一个键 (浏览器自动播放策略)')).toBeInTheDocument();

    // 界面就绪 (等用户点开始) 时不再是「正在载入」
    postFromPlayer({ type: 'sega-ready', name: 'sonic.md' });
    expect(screen.queryByText('正在载入 sonic.md')).not.toBeInTheDocument();
    expect(screen.queryByText('运行中')).not.toBeInTheDocument();

    postFromPlayer({ type: 'sega-started', name: 'sonic.md' });
    expect(await screen.findByText('运行中')).toBeInTheDocument();
    expect(screen.queryByText('首次播放声音需要点一下画面或按一个键 (浏览器自动播放策略)')).not.toBeInTheDocument();
  });

  test('播放器页回报启动失败 → 显示错误提示', async () => {
    render(<SegaEmulator />);
    pick(fileOf('sonic.md'));
    await screen.findByTestId('sega-frame');

    postFromPlayer({ type: 'sega-error', message: 'core not found' });
    expect(await screen.findByText('模拟核心载入失败')).toBeInTheDocument();
    // 错误细节来自播放器页
    expect(screen.getByText('core not found')).toBeInTheDocument();
  });

  test('播放器页里拖入新 ROM → 由页面重新挂载 iframe 载入', async () => {
    render(<SegaEmulator />);
    pick(fileOf('sonic.md'));
    const first = await screen.findByTestId('sega-frame');

    postFromPlayer({ type: 'sega-rom-file', file: fileOf('streets.md', 2048) });

    expect(await screen.findByText('streets.md')).toBeInTheDocument();
    const second = screen.getByTestId('sega-frame');
    // 换 ROM 必须重建 iframe (EmulatorJS 每页只能实例化一次)
    expect(second).not.toBe(first);
  });

  test('「重新开始」重建 iframe', async () => {
    render(<SegaEmulator />);
    pick(fileOf('sonic.md'));
    const first = await screen.findByTestId('sega-frame');

    fireEvent.click(screen.getByRole('button', { name: /重新开始/ }));
    expect(screen.getByTestId('sega-frame')).not.toBe(first);
  });

  test('「更换 ROM」打开文件选择框', () => {
    render(<SegaEmulator />);
    const input = screen.getByTestId('sega-rom-input') as HTMLInputElement;
    const click = jest.spyOn(input, 'click').mockImplementation(() => undefined);

    // 拖放区也是 role="button", 这里用精确名称只命中工具栏按钮
    fireEvent.click(screen.getByRole('button', { name: /选择 ROM$/ }));
    expect(click).toHaveBeenCalledTimes(1);

    // 载入后按钮文案变为「更换 ROM」
    pick(fileOf('sonic.md'));
    fireEvent.click(screen.getByRole('button', { name: /更换 ROM$/ }));
    expect(click).toHaveBeenCalledTimes(2);
    click.mockRestore();
  });

  test('播放器页没有暴露 __mtStartRom 时给出错误提示', async () => {
    render(<SegaEmulator />);
    pick(fileOf('sonic.md'));
    const frame = (await screen.findByTestId('sega-frame')) as HTMLIFrameElement;
    delete (frame.contentWindow as unknown as { __mtStartRom?: unknown }).__mtStartRom;

    fireEvent.load(frame);
    expect(await screen.findByText('模拟核心载入失败')).toBeInTheDocument();
  });

  test('按键配置: 12 个按键都显示默认键位', () => {
    render(<SegaEmulator />);

    // 说明区里也有「按键配置」字样, 这里只认卡片标题
    expect(screen.getByText('按键配置', { selector: '.ant-card-head-title' })).toBeInTheDocument();
    const rows = [ 'Up', 'Down', 'Left', 'Right', 'A', 'B', 'C', 'X', 'Y', 'Z', 'Start', 'Mode' ];
    rows.forEach((btn) => {
      expect(screen.getByTestId(`sega-key-${btn}`)).toBeInTheDocument();
    });
    // 默认: 方向键 / Z X C / A S D / Enter / V
    expect(keyText('Up')).toContain('↑');
    expect(keyText('A')).toContain('Z');
    expect(keyText('B')).toContain('X');
    expect(keyText('C')).toContain('C');
    expect(keyText('X')).toContain('A');
    expect(keyText('Y')).toContain('S');
    expect(keyText('Z')).toContain('D');
    expect(keyText('Start')).toContain('Enter');
    expect(keyText('Mode')).toContain('V');
    // 默认状态: 标签为「默认」, 「恢复默认」不可点
    expect(screen.getByText('默认')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /恢复默认/ })).toBeDisabled();
  });

  test('点按键再按新键即可重绑, 并写入 localStorage', () => {
    render(<SegaEmulator />);
    const row = screen.getByTestId('sega-key-A');

    fireEvent.click(row);
    // 待绑定状态: 显示占位文案
    expect(keyText('A')).toContain('按新键…');

    fireEvent.keyDown(window, { key: 'k', keyCode: 75 });
    expect(keyText('A')).toContain('K');
    expect(screen.getByTestId('sega-key-A').className).toContain('is-custom');
    expect(screen.getByText('自定义')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(KEYS_STORAGE_KEY) ?? '{}').A).toBe(75);
    // 绑定完成后退出待绑定状态
    expect(keyText('A')).not.toContain('按新键…');
  });

  test('Esc 取消绑定, 键位不变', () => {
    render(<SegaEmulator />);
    fireEvent.click(screen.getByTestId('sega-key-A'));
    fireEvent.keyDown(window, { key: 'Escape', keyCode: 27 });

    expect(keyText('A')).toContain('Z');
    expect(screen.getByTestId('sega-key-A').className).not.toContain('is-binding');
    expect(localStorage.getItem(KEYS_STORAGE_KEY)).toBeNull();
  });

  test('点别处 / 窗口失去焦点都会取消绑定 (避免下次按键被当成绑定)', () => {
    render(<SegaEmulator />);
    const row = () => screen.getByTestId('sega-key-A');

    // 点到按键区之外
    fireEvent.click(row());
    expect(keyText('A')).toContain('按新键…');
    fireEvent.pointerDown(document.body);
    expect(keyText('A')).toContain('Z');

    // 窗口失焦 (比如去点模拟器 iframe)
    fireEvent.click(row());
    expect(keyText('A')).toContain('按新键…');
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
    expect(keyText('A')).toContain('Z');
    expect(localStorage.getItem(KEYS_STORAGE_KEY)).toBeNull();
  });

  test('绑定到已被占用的键会被拒绝并提示', async () => {
    render(<SegaEmulator />);
    // Z 已经给了 A, 再想给 B 也绑 Z
    bindKey('B', 90, 'z');

    expect(await screen.findByText('Z 已经分配给 A 了, 请先给它换一个键')).toBeInTheDocument();
    // 仍停在待绑定状态, 可以直接再按另一个键
    expect(keyText('B')).toContain('按新键…');
    fireEvent.keyDown(window, { key: 'Escape', keyCode: 27 });
    expect(keyText('B')).toContain('X');
    expect(localStorage.getItem(KEYS_STORAGE_KEY)).toBeNull();
  });

  test('「恢复默认」把键位改回去', async () => {
    render(<SegaEmulator />);
    bindKey('A', 75, 'k');
    expect(keyText('A')).toContain('K');

    fireEvent.click(screen.getByRole('button', { name: /恢复默认/ }));
    expect(await screen.findByText('已恢复默认键位')).toBeInTheDocument();
    expect(keyText('A')).toContain('Z');
    expect(screen.getByText('默认')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(KEYS_STORAGE_KEY) ?? '{}')).toEqual(DEFAULT_KEYS);
  });

  test('本机保存的键位会在下次打开时读回', () => {
    localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify({ ...DEFAULT_KEYS, Start: 32 }));
    render(<SegaEmulator />);

    expect(keyText('Start')).toContain('Space');
    expect(screen.getByText('自定义')).toBeInTheDocument();
  });

  test('iframe 地址带上键位, 改键位时实时推给播放器页', async () => {
    render(<SegaEmulator />);
    pick(fileOf('sonic.md'));

    const frame = (await screen.findByTestId('sega-frame')) as HTMLIFrameElement;
    const src = new URL(frame.getAttribute('src') ?? '', 'http://localhost/');
    const keys = JSON.parse(src.searchParams.get('keys') ?? '{}');
    // 按钮编号 -> keyCode: A(1)=Z(90), Start(3)=Enter(13)
    expect(keys['1']).toBe(DEFAULT_KEYS.A);
    expect(keys['3']).toBe(DEFAULT_KEYS.Start);

    const push = jest.fn();
    (frame.contentWindow as unknown as { __mtSetKeys: jest.Mock }).__mtSetKeys = push;
    bindKey('Start', 32, ' ');
    expect(push).toHaveBeenCalledTimes(1);
    expect(push.mock.calls[0][0]['3']).toBe(32);
  });

  test('游戏层虚拟按键: 选好 ROM 后浮出 12 个半透明按键, 默认不透明度 70%', async () => {
    render(<SegaEmulator />);
    // 还没选 ROM 时不浮出
    expect(screen.queryByTestId('sega-pad')).not.toBeInTheDocument();

    pick(fileOf('sonic.md'));
    await screen.findByTestId('sega-frame');

    const pad = screen.getByTestId('sega-pad');
    expect(pad.style.opacity).toBe('0.7');
    // 十字键 + 6 个动作键 + Mode / Start
    [ 'Up', 'Down', 'Left', 'Right', 'A', 'B', 'C', 'X', 'Y', 'Z', 'Start', 'Mode' ].forEach((btn) => {
      expect(screen.getByTestId(`sega-pad-${btn}`)).toBeInTheDocument();
    });
    // 动作键按真机丝印排列
    expect(screen.getByTestId('sega-pad-X')).toHaveTextContent('X');
    expect(screen.getByTestId('sega-pad-Up')).toHaveTextContent('上');
  });

  test('游戏层虚拟按键: 透明度 / 开关跟随设置', async () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ padOpacity: 35 }));
    render(<SegaEmulator />);
    pick(fileOf('sonic.md'));
    await screen.findByTestId('sega-frame');
    expect(screen.getByTestId('sega-pad').style.opacity).toBe('0.35');

    // 关掉开关后不再浮出
    cleanup();
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ showPad: false }));
    render(<SegaEmulator />);
    pick(fileOf('bare.md'));
    await screen.findByTestId('sega-frame');
    expect(screen.queryByTestId('sega-pad')).not.toBeInTheDocument();
  });

  test('游戏层虚拟按键: 播放器页回报按下 / 松开时点亮对应按键', async () => {
    render(<SegaEmulator />);
    pick(fileOf('sonic.md'));
    const frame = (await screen.findByTestId('sega-frame')) as HTMLIFrameElement;

    // 编号 0 = B (键盘按下 B 时由播放器页上报)
    postFromPlayer({ type: 'sega-input', id: 0, down: true }, frame.contentWindow);
    const b = screen.getByTestId('sega-pad-B');
    expect(b.className).toContain('is-down');
    expect(b).toHaveAttribute('aria-pressed', 'true');

    postFromPlayer({ type: 'sega-input', id: 0, down: false }, frame.contentWindow);
    expect(screen.getByTestId('sega-pad-B').className).not.toContain('is-down');

    // 重新开始后清空点亮状态
    postFromPlayer({ type: 'sega-input', id: 4, down: true }, frame.contentWindow);
    expect(screen.getByTestId('sega-pad-Up').className).toContain('is-down');
    fireEvent.click(screen.getByRole('button', { name: /重新开始/ }));
    expect(screen.getByTestId('sega-pad-Up').className).not.toContain('is-down');
  });

  test('游戏层虚拟按键: 鼠标 / 手指按下会把输入喂给模拟器', async () => {
    render(<SegaEmulator />);
    pick(fileOf('sonic.md'));
    const frame = (await screen.findByTestId('sega-frame')) as HTMLIFrameElement;

    const input = jest.fn();
    (frame.contentWindow as unknown as { __mtInput: jest.Mock }).__mtInput = input;

    const a = screen.getByTestId('sega-pad-A');
    pointer(a, 'pointerdown');
    // 编号 1 = A (对齐 EmulatorJS 的 RetroArch 布局)
    expect(input).toHaveBeenCalledWith(1, true);
    expect(screen.getByTestId('sega-pad-A').className).toContain('is-down');

    pointer(a, 'pointerup');
    expect(input).toHaveBeenCalledWith(1, false);
    expect(screen.getByTestId('sega-pad-A').className).not.toContain('is-down');
  });

  test('鼠标拖动经过舞台时高亮拖放区', () => {
    render(<SegaEmulator />);
    const stage = screen.getByTestId('sega-stage');
    const drop = screen.getByTestId('sega-drop');

    fireEvent.dragOver(stage);
    expect(drop.className).toContain('is-over');
    fireEvent.dragLeave(stage);
    expect(drop.className).not.toContain('is-over');
  });
});
