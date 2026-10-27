import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import SegaEmulator from './index';

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
