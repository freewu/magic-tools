import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

// wasm 核心不能跑在 jsdom 里: 用桩机记录调用
const mockMachineRef: { current: any } = { current: null };
const mockCreate = jest.fn();

const mockMakeMachine = () => ({
  info: { title: 'TESTGAME', cgb: false },
  isCgb: false,
  presses: [] as string[],
  releases: [] as string[],
  releaseAlls: 0,
  resets: 0,
  loadedStates: [] as Uint8Array[],
  ram: new Uint8Array(0) as Uint8Array,
  setRams: [] as Uint8Array[],
  destroyed: 0,
  frames: 0,
  stepFrame() {
    this.frames += 1;
    return { cycles: 70224, frames: 1 };
  },
  frameBuffer() {
    return new Uint8Array(160 * 144 * 3);
  },
  audioBuffer() {
    return new Int16Array(0);
  },
  pc() {
    return 0x100;
  },
  press(button: string) {
    this.presses.push(button);
  },
  release(button: string) {
    this.releases.push(button);
  },
  releaseAll() {
    this.releaseAlls += 1;
  },
  reset() {
    this.resets += 1;
  },
  saveState() {
    return new Uint8Array([ 1, 2, 3 ]);
  },
  loadState(bytes: Uint8Array) {
    this.loadedStates.push(bytes);
  },
  ramData() {
    return this.ram;
  },
  setRamData(bytes: Uint8Array) {
    this.setRams.push(bytes);
    this.ram = bytes;
  },
  destroy() {
    this.destroyed += 1;
  },
});

jest.mock('./core', () => ({
  GbMachine: {
    create: async (rom: Uint8Array) => {
      mockCreate(rom);
      mockMachineRef.current = mockMakeMachine();
      return mockMachineRef.current;
    },
  },
}));

// jsdom 没有 canvas 2D 上下文, 渲染器单独覆盖 (这里只验证调用链)
const mockDraw = jest.fn();
jest.mock('./render', () => ({
  createRenderer: () => ({ draw: mockDraw, snapshot: () => 'data:image/png;base64,AA', clear: jest.fn() }),
}));

// 桌面保存对话框 / 下载不属于单测范围
jest.mock('../../lib/tauri', () => ({
  savePngFile: jest.fn(async () => true),
  saveTextFile: jest.fn(async () => true),
}));

// app-context 依赖 App/index.tsx 的顶层 await + import.meta.glob (jest commonjs 不支持), 故打桩
jest.mock('../../hook/app-context', () => ({
  AppContext: require('react').createContext(null),
}));

import GameBoyEmulator from './index';
import { NINTENDO_LOGO, globalChecksum, headerChecksum, writeSram } from './lib';
import { savePngFile, saveTextFile } from '../../lib/tauri';

/** 构造一个头部合法的合成卡带 */
const makeRom = (opts: { title?: string; cartType?: number; ramSizeCode?: number; cgb?: number } = {}): Uint8Array => {
  const bytes = new Uint8Array(0x8000);
  NINTENDO_LOGO.forEach((v, i) => { bytes[0x104 + i] = v; });
  const title = opts.title ?? 'TESTGAME';
  for (let i = 0; i < title.length; i++) bytes[0x134 + i] = title.charCodeAt(i);
  bytes[0x143] = opts.cgb ?? 0;
  bytes[0x147] = opts.cartType ?? 0x00;
  bytes[0x148] = 0x00;
  bytes[0x149] = opts.ramSizeCode ?? 0x00;
  bytes[0x14d] = headerChecksum(bytes);
  const sum = globalChecksum(bytes);
  bytes[0x14e] = (sum >> 8) & 0xff;
  bytes[0x14f] = sum & 0xff;
  return bytes;
};

/** 通过隐藏的 file input 载入 ROM */
const loadRom = async (bytes: Uint8Array, name = 'Test.gb') => {
  const input = screen.getByTestId('gb-rom-input') as HTMLInputElement;
  const file = new File([ bytes as unknown as BlobPart ], name);
  await act(async () => {
    fireEvent.change(input, { target: { files: [ file ] } });
  });
};

const press = (key: string) => fireEvent.keyDown(window, { key });
const release = (key: string) => fireEvent.keyUp(window, { key });

beforeEach(() => {
  localStorage.clear();
  mockMachineRef.current = null;
  mockCreate.mockClear();
  mockDraw.mockClear();
  (savePngFile as jest.Mock).mockClear();
  (saveTextFile as jest.Mock).mockClear();
});

afterEach(() => {
  cleanup();
  jest.useRealTimers();
});

describe('GameBoy 模拟器页面', () => {
  test('未加载 ROM 时显示选择提示与说明', () => {
    render(<GameBoyEmulator />);
    expect(screen.getByText('点击选择 ROM 文件')).toBeInTheDocument();
    expect(screen.getByText('或把 .gb / .gbc 文件拖到这里')).toBeInTheDocument();
    expect(screen.getByTestId('gb-screen')).toBeInTheDocument();
    expect(screen.getByTestId('gb-canvas')).toBeInTheDocument();
    expect(screen.getByText('仅支持 .gb / .gbc 卡带文件 (MBC1 / MBC2 / MBC3 / MBC5 等常见卡带)')).toBeInTheDocument();
    // 未加载 ROM 时相关按钮不可用
    expect(screen.getByRole('button', { name: /重置/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /保存状态/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /全屏/ })).toBeDisabled();
  });

  test('载入合法 ROM: 创建核心并显示卡带信息', async () => {
    render(<GameBoyEmulator />);
    await loadRom(makeRom({ title: 'TETRIS' }), 'Tetris.gb');
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1), { timeout: 5000 });
    const machine = mockMachineRef.current;

    expect(mockCreate.mock.calls[0][0]).toHaveLength(0x8000);
    expect(screen.getByRole('button', { name: /暂停/ })).toBeInTheDocument();
    expect(screen.getByText('卡带信息')).toBeInTheDocument();
    expect(screen.getByText('TETRIS')).toBeInTheDocument();
    expect(screen.getByText('32 KB · 32 KB')).toBeInTheDocument();
    expect(screen.getAllByText('DMG (灰机)').length).toBeGreaterThan(0);
    // 最近打开只记录文件名与模式
    expect(screen.getByText(/Tetris · DMG/)).toBeInTheDocument();
    expect(localStorage.getItem('magic-tools-gameboy-recent')).toContain('Tetris');
    expect(machine).toBeTruthy();
  });

  test('非 GameBoy 文件报错且不创建核心', async () => {
    render(<GameBoyEmulator />);
    await loadRom(new Uint8Array(0x200), 'bad.gb');
    await waitFor(() => expect(screen.getByText('运行异常')).toBeInTheDocument(), { timeout: 5000 });
    expect(screen.getAllByText('不是有效的 GameBoy ROM 文件').length).toBeGreaterThan(0);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('文件过短时提示', async () => {
    render(<GameBoyEmulator />);
    await loadRom(new Uint8Array(16), 'tiny.gb');
    await waitFor(() => expect(screen.getByText('运行异常')).toBeInTheDocument(), { timeout: 5000 });
    expect(screen.getAllByText('文件太小, 不可能是 GameBoy ROM').length).toBeGreaterThan(0);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('把 ROM 拖到页面任意位置即可载入', async () => {
    render(<GameBoyEmulator />);
    const file = new File([ makeRom() as unknown as BlobPart ], 'Dropped.gbc');
    const stage = document.querySelector('.gb-stage') as HTMLElement;
    await act(async () => {
      fireEvent.drop(stage, { dataTransfer: { files: [ file ], types: [ 'Files' ] } });
    });
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1), { timeout: 5000 });
    expect(screen.getByText(/Dropped · DMG/)).toBeInTheDocument();
  });

  test('拖拽经过时画面区高亮, 离开后取消', () => {
    render(<GameBoyEmulator />);
    const stage = document.querySelector('.gb-stage') as HTMLElement;
    fireEvent.dragOver(stage, { dataTransfer: { files: [], types: [ 'Files' ] } });
    expect(document.querySelector('.gb-screen.gb-drop')).toBeTruthy();
    fireEvent.dragLeave(stage, { dataTransfer: { files: [], types: [ 'Files' ] } });
    expect(document.querySelector('.gb-screen.gb-drop')).toBeNull();
  });

  test('暂停 / 继续切换运行状态', async () => {
    render(<GameBoyEmulator />);
    await loadRom(makeRom());
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1), { timeout: 5000 });

    fireEvent.click(screen.getByRole('button', { name: /暂停/ }));
    expect(screen.getByRole('button', { name: /继续/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /继续/ }));
    expect(screen.getByRole('button', { name: /暂停/ })).toBeInTheDocument();
  });

  test('重置按钮调用核心 reset', async () => {
    render(<GameBoyEmulator />);
    await loadRom(makeRom());
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1), { timeout: 5000 });
    fireEvent.click(screen.getByRole('button', { name: /重置/ }));
    expect(mockMachineRef.current.resets).toBe(1);
  });

  test('键盘方向键 / A 键下发给核心, 抬起时释放', async () => {
    render(<GameBoyEmulator />);
    await loadRom(makeRom());
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1), { timeout: 5000 });
    const machine = mockMachineRef.current;

    press('ArrowUp');
    expect(machine.presses).toContain('Up');
    release('ArrowUp');
    expect(machine.releases).toContain('Up');

    press('z');
    expect(machine.presses).toContain('A');
    release('z');
    expect(machine.releases).toContain('A');

    // 无关按键不拦截
    const before = machine.presses.length;
    press('F2');
    expect(machine.presses).toHaveLength(before);
  });

  test('触摸按键按下 / 抬起同样生效', async () => {
    render(<GameBoyEmulator />);
    await loadRom(makeRom());
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1), { timeout: 5000 });
    const machine = mockMachineRef.current;

    const up = screen.getByLabelText('上');
    fireEvent.pointerDown(up);
    expect(machine.presses).toContain('Up');
    fireEvent.pointerUp(up);
    expect(machine.releases).toContain('Up');
  });

  test('F5 快速存档写入本机, F8 快速读档回写核心', async () => {
    render(<GameBoyEmulator />);
    await loadRom(makeRom());
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1), { timeout: 5000 });
    const machine = mockMachineRef.current;

    press('F5');
    expect(localStorage.getItem('magic-tools-gameboy-quicksave')).toBeTruthy();

    press('F8');
    expect(machine.loadedStates).toHaveLength(1);
    expect(Array.from(machine.loadedStates[0])).toEqual([ 1, 2, 3 ]);
  });

  test('保存状态 / 读取状态走文件读写', async () => {
    render(<GameBoyEmulator />);
    await loadRom(makeRom(), 'Zelda.gb');
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1), { timeout: 5000 });

    fireEvent.click(screen.getByRole('button', { name: /保存状态/ }));
    await waitFor(() => expect(saveTextFile).toHaveBeenCalledTimes(1), { timeout: 5000 });
    expect((saveTextFile as jest.Mock).mock.calls[0][0]).toBe('Zelda.gbstate');

    const stateInput = screen.getByTestId('gb-state-input') as HTMLInputElement;
    const file = new File([ 'GBSTATE1\nAQID' ], 'Zelda.gbstate');
    await act(async () => {
      fireEvent.change(stateInput, { target: { files: [ file ] } });
    });
    await waitFor(() => expect(mockMachineRef.current.loadedStates).toHaveLength(1), { timeout: 5000 });
    expect(Array.from(mockMachineRef.current.loadedStates[0])).toEqual([ 1, 2, 3 ]);
  });

  test('截屏按钮导出 PNG', async () => {
    render(<GameBoyEmulator />);
    await loadRom(makeRom(), 'Shot.gb');
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1), { timeout: 5000 });
    fireEvent.click(screen.getByTestId('gb-shot'));
    await waitFor(() => expect(savePngFile).toHaveBeenCalledTimes(1), { timeout: 5000 });
    expect((savePngFile as jest.Mock).mock.calls[0][0]).toMatch(/^Shot-\d{8}-\d{6}\.png$/);
  });

  test('重新绑定键位后立即生效并写入默认设置', async () => {
    const { container } = render(<GameBoyEmulator />);
    await loadRom(makeRom());
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1), { timeout: 5000 });

    const aBtn = container.querySelector('[data-key-button="A"]') as HTMLElement;
    expect(aBtn.textContent).toContain('z');
    fireEvent.click(aBtn);
    expect(aBtn.textContent).toContain('按键中');
    fireEvent.keyDown(window, { key: 'q' });
    expect(aBtn.textContent).toContain('q');

    const saved = JSON.parse(localStorage.getItem('magic-tools-gameboy-settings') ?? '{}');
    expect(saved.keys.A).toEqual([ 'q' ]);
  });

  test('带电池的卡带自动读回本机存档', async () => {
    writeSram('Batt', new Uint8Array([ 9, 9, 9 ]));
    render(<GameBoyEmulator />);
    await loadRom(makeRom({ cartType: 0x03, ramSizeCode: 0x02 }), 'Batt.gb');
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1), { timeout: 5000 });
    const machine = mockMachineRef.current;
    expect(machine.setRams).toHaveLength(1);
    expect(Array.from(machine.setRams[0])).toEqual([ 9, 9, 9 ]);
  });

  test('全屏进入后只保留画面, 退出后恢复完整界面', async () => {
    render(<GameBoyEmulator />);
    await loadRom(makeRom());
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1), { timeout: 5000 });

    fireEvent.click(screen.getByRole('button', { name: /全屏/ }));
    expect(screen.getByTestId('gb-full')).toBeInTheDocument();
    expect(screen.queryByText('卡带信息')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /退出全屏/ }));
    expect(screen.queryByTestId('gb-full')).not.toBeInTheDocument();
    expect(screen.getByText('卡带信息')).toBeInTheDocument();
  });
});
