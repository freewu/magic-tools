import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { message } from 'antd';
import jsQR from 'jsqr';
import QrDecode from './index';
import { DEFAULTS_STORAGE_KEY } from './data';

// ---- jsQR 桩: 由用例决定解析结果 ----
jest.mock('jsqr', () => ({ __esModule: true, default: jest.fn() }));
const mockJsQR = jsQR as unknown as jest.Mock;

// ---- tauri 桩: 打开链接 / 保存文件 ----
const mockOpenUrl = jest.fn().mockResolvedValue(undefined);
const mockSaveTextFile = jest.fn().mockResolvedValue(true);
jest.mock('../../lib/tauri', () => ({
  isTauri: () => false,
  openUrl: (...args: unknown[]) => mockOpenUrl(...args),
  saveTextFile: (...args: unknown[]) => mockSaveTextFile(...args),
}));

// ---- 剪贴板桩 (jsdom 没有 navigator.clipboard) ----
const mockWriteText = jest.fn().mockResolvedValue(undefined);

/** jsQR 返回结构 */
const qrCode = (text: string, over: Record<string, unknown> = {}) => ({
  data: text,
  binaryData: [ 104, 105 ],
  chunks: [ { type: 'byte', bytes: [ 104, 105 ], text } ],
  version: 3,
  location: {
    topLeftCorner: { x: 0, y: 0 },
    topRightCorner: { x: 3, y: 0 },
    bottomRightCorner: { x: 3, y: 3 },
    bottomLeftCorner: { x: 0, y: 3 },
  },
  ...over,
});

// ---- canvas 桩: 返回请求尺寸的全零像素 ----
const stubCtx = {
  fillStyle: '',
  fillRect: () => undefined,
  drawImage: () => undefined,
  getImageData: (_sx: number, _sy: number, w: number, h: number) => ({
    data: new Uint8ClampedArray(w * h * 4),
    width: w,
    height: h,
  }),
};

// ---- Image 桩: 自然尺寸由 imageSize 决定, onload 异步触发 ----
let imageSize = { width: 4, height: 3 };

class MockImage {
  onload: (() => void) | null = null;

  onerror: (() => void) | null = null;

  naturalWidth = 0;

  naturalHeight = 0;

  private inner = '';

  get src() { return this.inner; }

  set src(v: string) {
    this.inner = v;
    this.naturalWidth = imageSize.width;
    this.naturalHeight = imageSize.height;
    setTimeout(() => this.onload?.(), 0);
  }
}

// ---- DOM 取值助手 ----
const dropZone = (container: HTMLElement) => container.querySelector('div[style*="dashed"]') as HTMLElement;
const textArea = (container: HTMLElement) => container.querySelector('textarea.qr-text') as HTMLTextAreaElement | null;
const btn = (name: string): HTMLButtonElement => {
  const target = name.replace(/\s+/g, '');
  const hit = screen
    .getAllByText((_, el) => (el?.textContent ?? '').replace(/\s+/g, '') === target)
    .find((el) => el.closest('button'));
  if (!hit) throw new Error(`未找到按钮: ${name}`);
  return hit.closest('button') as HTMLButtonElement;
};
/** 工具页本体 (排除底部说明区 .intro) 里的同名文案: 说明区里也有「网址」等 <b> 标签, 需过滤 */
const uiTexts = (container: HTMLElement, text: string) =>
  within(container).queryAllByText(text).filter((el) => !el.closest('.intro'));
const hasUiText = (container: HTMLElement, text: string) => {
  expect(uiTexts(container, text).length).toBeGreaterThan(0);
};

/** 历史记录按钮 (带 title 属性, 便于与工具栏按钮区分) */
const historyButtons = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('button[title]')) as HTMLButtonElement[];

const dropFile = (container: HTMLElement, name = 'qr.png', type = 'image/png') => {
  fireEvent.drop(dropZone(container), { dataTransfer: { files: [ new File([ 'x' ], name, { type }) ] } });
};
/** 拖入图片并等待解析完成 (返回解析出的文本; 未识别时返回 null) */
const dropQr = async (container: HTMLElement, expectText?: string) => {
  dropFile(container);
  if (expectText !== undefined) {
    await waitFor(() => expect(mockJsQR).toHaveBeenCalled());
    await waitFor(() => expect(textArea(container)?.value).toBe(expectText));
  } else {
    await waitFor(() => expect(mockJsQR).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(dropZone(container)).not.toBeInTheDocument());
  }
};
const openSelect = async (index: number) => {
  const selector = document.querySelectorAll('.ant-select-selector')[index] as HTMLElement;
  await act(async () => { fireEvent.mouseDown(selector); });
};
const clickOption = async (text: string) => {
  const options = Array.from(document.querySelectorAll('.ant-select-item-option-content'));
  const hit = options.find((o) => (o.textContent ?? '') === text);
  if (!hit) throw new Error(`找不到选项「${text}」`);
  await act(async () => { fireEvent.click(hit); });
};

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => stubCtx) as unknown as HTMLCanvasElement['getContext'];
  (global as unknown as { Image: unknown }).Image = MockImage;
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: (...a: unknown[]) => mockWriteText(...a) }, configurable: true });
});

beforeEach(() => {
  mockJsQR.mockReset();
  mockJsQR.mockReturnValue(qrCode('https://example.com'));
  mockOpenUrl.mockClear();
  mockSaveTextFile.mockClear();
  mockWriteText.mockClear();
  imageSize = { width: 4, height: 3 };
  localStorage.clear();
  message.destroy();
});

describe('二维码解析 初始界面', () => {
  test('未选择图片时显示拖拽区与说明, 清空按钮不可用', () => {
    const { container } = render(<QrDecode />);
    expect(within(container).getByText('拖拽二维码图片到此处, 或点击「选择二维码图片」')).toBeInTheDocument();
    expect(within(container).getByText('也可以直接把截图粘贴进来 (Ctrl / ⌘ + V)')).toBeInTheDocument();
    expect(btn('清空')).toBeDisabled();
    expect(btn('清空历史')).toBeDisabled();
    expect(container.querySelector('.qr-text')).not.toBeInTheDocument();
    // 参数区
    hasUiText(container, '反色策略');
    hasUiText(container, '图片最大边长');
    // 说明区
    expect(within(container).getByText('这个工具做什么')).toBeInTheDocument();
  });

  test('默认设置从本地存储读取 (autoCopy 打开)', () => {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify({ autoCopy: true, maxEdge: 800 }));
    const { container } = render(<QrDecode />);
    expect(within(container).getByText('800 px')).toBeInTheDocument();
  });
});

describe('二维码解析 解析结果', () => {
  test('拖入图片后显示网址结果 / 版本 / 预览框选与历史记录', async () => {
    const { container } = render(<QrDecode />);
    await dropQr(container, 'https://example.com');
    hasUiText(container, '网址');
    hasUiText(container, '版本 V3');
    expect(btn('复制')).toBeInTheDocument();
    expect(btn('保存为 TXT')).toBeInTheDocument();
    expect(btn('打开链接')).toBeInTheDocument();
    expect(container.querySelector('.qr-locate polygon')).toBeInTheDocument();
    expect(historyButtons(container)).toHaveLength(1);
    // 图片尺寸 / 解析尺寸 / 解码用时
    expect(container.textContent).toContain('4 × 3 px');
    expect(container.textContent).toContain('解码用时');
    expect(btn('清空历史')).toBeEnabled();
  });

  test('WiFi 配网内容拆成结构化字段', async () => {
    mockJsQR.mockReturnValue(qrCode('WIFI:T:WPA;S:MyNet;P:pw123;;'));
    const { container } = render(<QrDecode />);
    await dropQr(container, 'WIFI:T:WPA;S:MyNet;P:pw123;;');
    hasUiText(container, 'WiFi 配网');
    hasUiText(container, '加密方式');
    hasUiText(container, 'SSID');
    hasUiText(container, '密码');
    hasUiText(container, 'MyNet');
    hasUiText(container, 'pw123');
    hasUiText(container, '结构化信息');
    // 非链接内容不给「打开链接」
    expect(uiTexts(container, '打开链接')).toHaveLength(0);
  });

  test('编码信息显示数据段与原始字节 HEX', async () => {
    mockJsQR.mockReturnValue(qrCode('hi', { binaryData: [ 0x68, 0x69 ] }));
    const { container } = render(<QrDecode />);
    await dropQr(container, 'hi');
    hasUiText(container, '编码信息');
    hasUiText(container, '字节 · 2');
    expect(container.querySelector('.qr-hex')?.textContent).toContain('68 69');
    hasUiText(container, '原始字节 (2 字节)');
    expect(container.textContent).toContain('2 字节');
  });

  test('没有定位点时不画框选, 纯文本内容不显示结构化字段', async () => {
    mockJsQR.mockReturnValue(qrCode('just text', { location: undefined }));
    const { container } = render(<QrDecode />);
    await dropQr(container, 'just text');
    expect(container.querySelector('.qr-locate')).not.toBeInTheDocument();
    hasUiText(container, '纯文本');
    expect(uiTexts(container, '结构化信息')).toHaveLength(0);
  });

  test('未识别到二维码时给出失败提示与建议', async () => {
    mockJsQR.mockReturnValue(null);
    const { container } = render(<QrDecode />);
    await dropQr(container);
    expect(within(container).getByText('未识别到二维码')).toBeInTheDocument();
    expect(container.textContent).toContain('可尝试: 换一张更清晰');
    expect(container.querySelector('.qr-text')).not.toBeInTheDocument();
    expect(historyButtons(container)).toHaveLength(0);
  });

  test('非图片文件给出错误提示且不解析', async () => {
    const { container } = render(<QrDecode />);
    dropFile(container, 'a.txt', 'text/plain');
    await waitFor(() => expect(container.querySelector('.ant-alert')?.textContent).toContain('请选择图片文件'));
    expect(mockJsQR).not.toHaveBeenCalled();
    expect(dropZone(container)).toBeInTheDocument();
  });

  test('图片过大 (不缩放) 时提示尺寸超限', async () => {
    imageSize = { width: 20000, height: 100 };
    const { container } = render(<QrDecode />);
    await openSelect(1);
    await clickOption('不缩放');
    dropFile(container);
    await waitFor(() => expect(container.querySelector('.ant-alert')?.textContent).toContain('图片尺寸过大'));
    expect(mockJsQR).not.toHaveBeenCalled();
  });

  test('canvas 不可用时给出提示', async () => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = jest.fn(() => null) as unknown as HTMLCanvasElement['getContext'];
    try {
      const { container } = render(<QrDecode />);
      dropFile(container);
      await waitFor(() => expect(container.querySelector('.ant-alert')?.textContent).toContain('当前环境不支持 Canvas'));
      expect(mockJsQR).not.toHaveBeenCalled();
    } finally {
      HTMLCanvasElement.prototype.getContext = original;
    }
  });
});

describe('二维码解析 操作', () => {
  test('复制结果写入剪贴板并提示', async () => {
    const { container } = render(<QrDecode />);
    await dropQr(container, 'https://example.com');
    fireEvent.click(btn('复制'));
    await waitFor(() => expect(mockWriteText).toHaveBeenCalledWith('https://example.com'));
    expect(await screen.findByText('已复制解析结果')).toBeInTheDocument();
  });

  test('保存为 TXT 使用带时间戳的文件名', async () => {
    const { container } = render(<QrDecode />);
    await dropQr(container, 'https://example.com');
    fireEvent.click(btn('保存为 TXT'));
    await waitFor(() => expect(mockSaveTextFile).toHaveBeenCalledTimes(1));
    const [ name, content, title, opts ] = mockSaveTextFile.mock.calls[0];
    expect(name).toMatch(/^qrcode-\d{8}-\d{6}\.txt$/);
    expect(content).toBe('https://example.com');
    expect(title).toBe('保存为 TXT');
    expect(opts).toEqual({ filterName: 'Text', extensions: [ 'txt' ] });
    expect(await screen.findByText(`已保存 ${name}`)).toBeInTheDocument();
  });

  test('打开链接调用系统打开', async () => {
    const { container } = render(<QrDecode />);
    await dropQr(container, 'https://example.com');
    fireEvent.click(btn('打开链接'));
    await waitFor(() => expect(mockOpenUrl).toHaveBeenCalledWith('https://example.com'));
  });

  test('自动复制开关生效时解析成功即写入剪贴板', async () => {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify({ autoCopy: true }));
    const { container } = render(<QrDecode />);
    await dropQr(container, 'https://example.com');
    await waitFor(() => expect(mockWriteText).toHaveBeenCalledWith('https://example.com'));
  });

  test('清空后回到拖拽区', async () => {
    const { container } = render(<QrDecode />);
    await dropQr(container, 'https://example.com');
    fireEvent.click(btn('清空'));
    await waitFor(() => expect(dropZone(container)).toBeInTheDocument());
    expect(container.querySelector('.qr-text')).not.toBeInTheDocument();
  });
});

describe('二维码解析 参数', () => {
  test('默认把大图等比缩小到 1600 px 再解析', async () => {
    imageSize = { width: 3200, height: 1600 };
    const { container } = render(<QrDecode />);
    await dropQr(container, 'https://example.com');
    const [ , w, h ] = mockJsQR.mock.calls[0];
    expect([ w, h ]).toEqual([ 1600, 800 ]);
    expect(container.textContent).toContain('3200 × 1600 px');
    expect(container.textContent).toContain('1600 × 800 px');
  });

  test('切换「图片最大边长」后按新上限解析', async () => {
    imageSize = { width: 3200, height: 1600 };
    const { container } = render(<QrDecode />);
    await openSelect(1);
    await clickOption('800 px');
    await dropQr(container, 'https://example.com');
    const [ , w, h ] = mockJsQR.mock.calls[0];
    expect([ w, h ]).toEqual([ 800, 400 ]);
  });

  test('切换「反色策略」后传给 jsQR 的策略随之改变', async () => {
    const { container } = render(<QrDecode />);
    await openSelect(0);
    await clickOption('只按反色解析 (深底浅码)');
    await dropQr(container, 'https://example.com');
    expect(mockJsQR.mock.calls[0][3]).toEqual({ inversionAttempts: 'onlyInvert' });
  });
});

describe('二维码解析 历史记录', () => {
  test('多次解析按时间倒序记录, 点击可恢复内容', async () => {
    const { container } = render(<QrDecode />);
    mockJsQR.mockReturnValue(qrCode('first-payload'));
    await dropQr(container, 'first-payload');
    mockJsQR.mockReturnValue(qrCode('https://second.example'));
    // 换一张图触发再次解析
    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [ new File([ 'y' ], 'b.png', { type: 'image/png' }) ] },
    });
    await waitFor(() => expect(textArea(container)?.value).toBe('https://second.example'));
    const items = historyButtons(container);
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toContain('https://second.example');
    fireEvent.click(items[1]);
    await waitFor(() => expect(textArea(container)?.value).toBe('first-payload'));
    expect(await screen.findByText('已从历史记录恢复')).toBeInTheDocument();
  });

  test('清空历史后显示暂无记录', async () => {
    const { container } = render(<QrDecode />);
    await dropQr(container, 'https://example.com');
    fireEvent.click(btn('清空历史'));
    await waitFor(() => expect(within(container).getByText('暂无记录')).toBeInTheDocument());
    expect(historyButtons(container)).toHaveLength(0);
  });

  test('历史条数上限来自默认设置', async () => {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify({ historyMax: 5 }));
    const { container } = render(<QrDecode />);
    await dropQr(container, 'https://example.com');
    expect(container.textContent).toContain('最多保留 5 条');
  });
});

describe('二维码解析 粘贴', () => {
  test('粘贴剪贴板图片即解析', async () => {
    const { container } = render(<QrDecode />);
    fireEvent.paste(window, { clipboardData: { files: [ new File([ 'x' ], 'paste.png', { type: 'image/png' }) ] } });
    await waitFor(() => expect(mockJsQR).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(textArea(container)?.value).toBe('https://example.com'));
  });
});
