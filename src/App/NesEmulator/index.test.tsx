import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

// jsnes 是 ESM 包, jest (commonjs) 里用桩类代替: 记录调用并模拟 onFrame / onAudioSample
const mockInstances: any[] = [];
jest.mock('jsnes', () => {
  class NES {
    opts: any;

    frames = 0;

    loads: any[] = [];

    downs: number[][] = [];

    ups: number[][] = [];

    resets = 0;

    state: any = null;

    constructor(opts: any) {
      this.opts = opts;
      mockInstances.push(this);
    }

    loadROM(data: any) {
      this.loads.push(data);
    }

    frame() {
      this.frames += 1;
      this.opts.onFrame?.(new Uint32Array(256 * 240));
      this.opts.onAudioSample?.(0, 0);
    }

    reset() {
      this.resets += 1;
    }

    buttonDown(controller: number, button: number) {
      this.downs.push([ controller, button ]);
    }

    buttonUp(controller: number, button: number) {
      this.ups.push([ controller, button ]);
    }

    toJSON() {
      return { cpu: { pc: 0x1234 }, mmap: {}, ppu: {}, papu: {} };
    }

    fromJSON(data: any) {
      this.state = data;
    }
  }
  return { NES };
});

// app-context 依赖 App/index.tsx 的顶层 await + import.meta.glob (jest commonjs 不支持), 故打桩
jest.mock('../../hook/app-context', () => ({
  AppContext: require('react').createContext(null),
}));

// 桌面保存对话框 / 下载不属于单测范围
jest.mock('../../lib/tauri', () => ({
  savePngFile: jest.fn(async () => true),
  saveTextFile: jest.fn(async () => true),
}));

// jsdom 没有 canvas 2D 上下文 (调用会打印 not implemented 噪音), 渲染器单独在 render.test.ts 覆盖
jest.mock('./render', () => ({ createRenderer: () => null }));

import NesEmulator from './index';

/** 构造一个合法的最小 iNES 文件 */
const makeRom = (prg = 1, chr = 1): Uint8Array => {
  const bytes = new Uint8Array(16 + prg * 16384 + chr * 8192);
  bytes.set([ 0x4e, 0x45, 0x53, 0x1a ], 0);
  bytes[4] = prg;
  bytes[5] = chr;
  return bytes;
};

/** 通过隐藏的 file input 载入 ROM (模拟用户选文件) */
const loadRom = async (bytes: Uint8Array, name = 'test.nes') => {
  const input = screen.getByTestId('nes-rom-input') as HTMLInputElement;
  const file = new File([ bytes as unknown as BlobPart ], name);
  await act(async () => {
    fireEvent.change(input, { target: { files: [ file ] } });
  });
};

const press = (key: string) => fireEvent.keyDown(window, { key });
const release = (key: string) => fireEvent.keyUp(window, { key });

beforeEach(() => {
  localStorage.clear();
  mockInstances.length = 0;
});

afterEach(() => {
  cleanup();
  jest.useRealTimers();
});

describe('NES 模拟器页面', () => {
  test('未加载 ROM 时显示选择提示与说明', () => {
    render(<NesEmulator />);
    expect(screen.getByText('点击选择 ROM 文件')).toBeInTheDocument();
    expect(screen.getByText('或把 .nes 文件拖到这里')).toBeInTheDocument();
    expect(screen.getByTestId('nes-screen')).toBeInTheDocument();
    expect(screen.getByTestId('nes-canvas')).toBeInTheDocument();
    // 未加载 ROM 时不能暂停 / 重置
    expect(screen.getByRole('button', { name: /重置/ })).toBeDisabled();
  });

  test('载入合法 ROM: 创建模拟器并显示卡带信息', async () => {
    render(<NesEmulator />);
    await loadRom(makeRom(2, 1), 'Contra.nes');
    await waitFor(() => expect(mockInstances).toHaveLength(1));

    const nes = mockInstances[0];
    expect(nes.loads).toHaveLength(1);
    expect(Array.from(nes.loads[0].slice(0, 4))).toEqual([ 0x4e, 0x45, 0x53, 0x1a ]);
    // 载入后进入运行状态
    expect(screen.getByRole('button', { name: /暂停/ })).toBeInTheDocument();
    expect(screen.getByText('Mapper')).toBeInTheDocument();
    expect(screen.getByText('2 × 16 KB')).toBeInTheDocument();
    expect(screen.getByText('1 × 8 KB')).toBeInTheDocument();
    expect(screen.getByText('NTSC')).toBeInTheDocument();
    expect(screen.getByText('水平')).toBeInTheDocument();
    // 最近打开被记录
    expect(screen.getByText(/Contra · Mapper 0/)).toBeInTheDocument();
    expect(localStorage.getItem('magic-tools-nes-recent')).toContain('Contra');
  });

  test('非 NES 文件报错且不创建模拟器', async () => {
    render(<NesEmulator />);
    const bad = new Uint8Array(32);
    await loadRom(bad, 'bad.nes');
    await waitFor(() => expect(screen.getByText('运行异常')).toBeInTheDocument());
    expect(screen.getAllByText('不是有效的 NES ROM 文件').length).toBeGreaterThan(0);
    expect(mockInstances).toHaveLength(0);
  });

  test('文件不完整时提示 truncated', async () => {
    render(<NesEmulator />);
    const rom = makeRom(1, 1);
    rom[4] = 8; // 声称 8 个 PRG bank, 实际只有 1 个
    await loadRom(rom);
    await waitFor(() => expect(screen.getByText('运行异常')).toBeInTheDocument());
    expect(screen.getAllByText('ROM 文件不完整 (可能下载未完成)').length).toBeGreaterThan(0);
    expect(mockInstances).toHaveLength(0);
  });

  test('把 ROM 拖到页面任意位置即可载入 (不再局限于画面区)', async () => {
    render(<NesEmulator />);
    const file = new File([ makeRom() as unknown as BlobPart ], 'dropped.nes');
    const stage = document.querySelector('.nes-stage') as HTMLElement;
    await act(async () => {
      fireEvent.drop(stage, { dataTransfer: { files: [ file ], types: [ 'Files' ] } });
    });
    await waitFor(() => expect(mockInstances).toHaveLength(1));
    expect(screen.getByText(/dropped · Mapper 0/)).toBeInTheDocument();
  });

  test('拖拽经过页面时画面区高亮, 离开后取消', () => {
    render(<NesEmulator />);
    const stage = document.querySelector('.nes-stage') as HTMLElement;
    fireEvent.dragOver(stage, { dataTransfer: { files: [], types: [ 'Files' ] } });
    expect(document.querySelector('.nes-screen.nes-drop')).toBeTruthy();
    fireEvent.dragLeave(stage, { dataTransfer: { files: [], types: [ 'Files' ] } });
    expect(document.querySelector('.nes-screen.nes-drop')).toBeNull();
  });

  test('暂停 / 继续按钮切换运行状态', async () => {
    render(<NesEmulator />);
    await loadRom(makeRom());
    await waitFor(() => expect(mockInstances).toHaveLength(1));

    fireEvent.click(screen.getByRole('button', { name: /暂停/ }));
    expect(screen.getByRole('button', { name: /继续/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /继续/ }));
    expect(screen.getByRole('button', { name: /暂停/ })).toBeInTheDocument();
  });

  test('重置按钮调用 nes.reset', async () => {
    render(<NesEmulator />);
    await loadRom(makeRom());
    await waitFor(() => expect(mockInstances).toHaveLength(1));
    fireEvent.click(screen.getByRole('button', { name: /重置/ }));
    expect(mockInstances[0].resets).toBe(1);
  });

  test('键盘方向键 / A 键下发给模拟器, 抬起时释放', async () => {
    render(<NesEmulator />);
    await loadRom(makeRom());
    await waitFor(() => expect(mockInstances).toHaveLength(1));
    const nes = mockInstances[0];

    press('ArrowUp');
    expect(nes.downs).toContainEqual([ 1, 4 ]);
    release('ArrowUp');
    expect(nes.ups).toContainEqual([ 1, 4 ]);

    press('x');
    expect(nes.downs).toContainEqual([ 1, 0 ]);
    release('x');
    expect(nes.ups).toContainEqual([ 1, 0 ]);

    // 无关按键不拦截
    const before = nes.downs.length;
    press('F2');
    expect(nes.downs).toHaveLength(before);
  });

  test('触摸按键按下 / 抬起同样生效', async () => {
    render(<NesEmulator />);
    await loadRom(makeRom());
    await waitFor(() => expect(mockInstances).toHaveLength(1));
    const nes = mockInstances[0];

    const up = screen.getByLabelText('上');
    fireEvent.pointerDown(up);
    expect(nes.downs).toContainEqual([ 1, 4 ]);
    fireEvent.pointerUp(up);
    expect(nes.ups).toContainEqual([ 1, 4 ]);
  });

  test('F5 快速存档写入本地, F8 快速读档恢复状态', async () => {
    render(<NesEmulator />);
    await loadRom(makeRom());
    await waitFor(() => expect(mockInstances).toHaveLength(1));
    const nes = mockInstances[0];

    press('F5');
    expect(localStorage.getItem('magic-tools-nes-quicksave')).toBeTruthy();

    press('F8');
    expect(nes.state).toEqual({ cpu: { pc: 0x1234 }, mmap: {}, ppu: {}, papu: {} });
  });

  test('重新绑定键位后立即生效并写入默认设置', async () => {
    const { container } = render(<NesEmulator />);
    await loadRom(makeRom());
    await waitFor(() => expect(mockInstances).toHaveLength(1));

    const aBtn = container.querySelector('[data-key-button="A"]') as HTMLElement;
    expect(aBtn.textContent).toContain('x');
    fireEvent.click(aBtn);
    // 捕获中: 按钮提示切换
    expect(aBtn.textContent).toContain('按键中');
    fireEvent.keyDown(window, { key: 'q' });
    expect(aBtn.textContent).toContain('q');

    const saved = JSON.parse(localStorage.getItem('magic-tools-nes-settings') ?? '{}');
    expect(saved.keys.A).toEqual([ 'q' ]);
  });

  test('全屏进入后只保留画面, 退出后恢复完整界面', async () => {
    render(<NesEmulator />);
    await loadRom(makeRom());
    await waitFor(() => expect(mockInstances).toHaveLength(1));

    fireEvent.click(screen.getByRole('button', { name: /全屏/ }));
    expect(screen.getByTestId('nes-full')).toBeInTheDocument();
    expect(screen.queryByText('卡带信息')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /退出全屏/ }));
    expect(screen.queryByTestId('nes-full')).not.toBeInTheDocument();
    expect(screen.getByText('卡带信息')).toBeInTheDocument();
  });
});
