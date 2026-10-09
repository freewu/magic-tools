import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ChatGenerator from './index';
import { LocaleProvider } from '../../hook/locale-context';
import { KEY_SHOW_NAMES, MESSAGES_MAX, STATUS_TIME_DEFAULT } from './data';

/** html-to-image / 保存文件在 jsdom 下不可用, 全部 mock 掉 */
const mockToPng = jest.fn(async (_node: unknown, _opts?: unknown) => 'data:image/png;base64,SHOT');
const mockSavePngFile = jest.fn(async (_name: string, _dataUrl: string) => true);
jest.mock('html-to-image', () => ({ toPng: (node: unknown, opts?: unknown) => mockToPng(node, opts) }));
jest.mock('../../lib/tauri', () => ({
  savePngFile: (name: string, dataUrl: string) => mockSavePngFile(name, dataUrl),
  openUrl: jest.fn(),
  isTauri: () => false,
  emitLocale: jest.fn(),
  listenLocale: jest.fn(async () => jest.fn()),
}));

/**
 * antd message 渲染在 document.body 的单例容器里, 不随组件卸载消失 (也不能手动删它的节点,
 * 那会破坏 React 对 portal 的记账)。因此: 正向断言用容器整体文案 (新提示总在末尾),
 * 反向断言用「提示条数不变」。
 */
const noticeText = (): string => flat(document.querySelector('.ant-message')?.textContent);
const noticeCount = (): number => document.querySelectorAll('.ant-message-notice-content').length;

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
  localStorage.clear();
});

/** 去掉空白后比较 (antd 会在两个 CJK 字符间插空格) */
const flat = (s: string | null | undefined): string => (s ?? '').replace(/\s+/g, '');

const preview = (container: HTMLElement): HTMLElement =>
  container.querySelector('[data-testid="chat-preview"]') as HTMLElement;

/** 消息编辑行里的按钮 (按 title 定位, 避免与卡片工具栏混淆) */
const rowButtons = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('button[title]')) as HTMLButtonElement[];

const clickButton = (container: HTMLElement, label: string) => {
  const btn = Array.from(container.querySelectorAll('button')).find((b) => flat(b.textContent) === flat(label));
  expect(btn ? true : `按钮 ${label} 未找到`).toBe(true);
  fireEvent.click(btn as HTMLButtonElement);
};

describe('聊天生成器 页面', () => {
  test('默认渲染: 9 个平台 Tab + 编辑区 + 预览, 预览展示示例对话', () => {
    const { container } = render(<ChatGenerator />);
    // 平台 Tab
    for (const label of [ '微信', 'QQ', 'Slack', 'Telegram', 'Discord', 'WhatsApp', 'LINE', '钉钉', '飞书' ]) {
      expect(container.querySelector('.ant-tabs-tab')).toBeTruthy();
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(container.querySelectorAll('.ant-tabs-tab')).toHaveLength(9);
    // 默认平台 = 微信
    expect(preview(container).dataset.platform).toBe('wechat');
    // 会话信息回显到编辑框与预览头
    expect((screen.getByDisplayValue('文件传输助手') as HTMLInputElement).value).toBe('文件传输助手');
    expect(flat(preview(container).textContent)).toContain('文件传输助手');
    // 示例消息: 时间分隔 / 文字 / 图片 / 语音
    expect(flat(preview(container).textContent)).toContain('2026年10月9日下午4:20');
    expect(flat(preview(container).textContent)).toContain('在吗?帮忙看下这个页面的间距');
    expect(flat(preview(container).textContent)).toContain('收到,我改完发你');
    expect((preview(container).querySelector('img') as HTMLImageElement).src.startsWith('data:image/svg+xml')).toBe(true);
    expect(container.querySelectorAll('.ant-tabs-tab').length).toBe(9);
    // 消息计数 (antd Space 会把多段文本拆开, 这里整体比对)
    expect(flat(screen.getByText(/消息 \(共/).textContent)).toBe('消息(共7条)');
  });

  test('切换平台: 预览主题与布局随之变化', () => {
    const { container } = render(<ChatGenerator />);
    const tab = (name: string) => screen.getAllByText(name).find((el) => el.closest('.ant-tabs-tab')) as HTMLElement;

    fireEvent.click(tab('QQ'));
    expect(preview(container).dataset.platform).toBe('qq');
    // QQ 的状态栏在右侧 (安卓风格)
    const qqText = flat(preview(container).textContent);
    expect(qqText).toContain('9:41');

    fireEvent.click(tab('Slack'));
    expect(preview(container).dataset.platform).toBe('slack');
    // Slack 为桌面窗口: 有侧边栏色块, 消息流不再有气泡
    expect(preview(container).textContent).toContain('# 文件传输助手');

    fireEvent.click(tab('WhatsApp'));
    expect(preview(container).dataset.platform).toBe('whatsapp');

    fireEvent.click(tab('LINE'));
    expect(preview(container).dataset.platform).toBe('line');

    fireEvent.click(tab('钉钉'));
    expect(preview(container).dataset.platform).toBe('dingtalk');
  });

  test('编辑会话信息与状态栏会同步到预览', () => {
    const { container } = render(<ChatGenerator />);
    fireEvent.change(screen.getByDisplayValue('文件传输助手'), { target: { value: '产品小组' } });
    expect(flat(preview(container).textContent)).toContain('产品小组');

    // 时间改为合法值 → 预览更新
    const timeInput = screen.getByDisplayValue('9:41');
    fireEvent.change(timeInput, { target: { value: '18:20' } });
    expect(flat(preview(container).textContent)).toContain('18:20');

    // 时间非法 → 输入框标红, 预览回退默认时间 (不把非法值渲进 PNG)
    fireEvent.change(timeInput, { target: { value: '99:99' } });
    expect((timeInput.closest('.ant-input-affix-wrapper') ?? timeInput).className).toContain('ant-input-status-error');
    expect(flat(preview(container).textContent)).toContain(STATUS_TIME_DEFAULT);
    expect(flat(preview(container).textContent)).not.toContain('99:99');

    // 副标题清空后预览不再显示
    const subtitle = screen.getByDisplayValue('在线') as HTMLInputElement;
    fireEvent.change(subtitle, { target: { value: '' } });
    expect(flat(preview(container).textContent)).not.toContain('在线');
  });

  test('添加四类消息 / 上移下移 / 删除 / 清空', async () => {
    const { container } = render(<ChatGenerator />);
    clickButton(container, '清空');
    await waitFor(() => expect(flat(preview(container).textContent)).toContain('请在左侧添加或编辑消息'));
    expect(flat(screen.getByText(/消息 \(共/).textContent)).toBe('消息(共0条)');

    clickButton(container, '添加文字');
    clickButton(container, '添加图片');
    clickButton(container, '添加语音');
    clickButton(container, '添加时间');
    expect(flat(screen.getByText(/消息 \(共/).textContent)).toBe('消息(共4条)');
    // 图片消息未选图时显示占位
    expect(flat(preview(container).textContent)).toContain('图片');

    // 第 4 条 (时间分隔) 上移, 顺序改变
    const up = rowButtons(container).filter((b) => b.title === '上移');
    expect(up).toHaveLength(4);
    expect(up[3]).not.toBeDisabled();
    fireEvent.click(up[3]);
    expect(flat(screen.getByText(/消息 \(共/).textContent)).toBe('消息(共4条)');

    // 删除第 1 条
    const del = rowButtons(container).filter((b) => b.title === '删除');
    fireEvent.click(del[0]);
    expect(flat(screen.getByText(/消息 \(共/).textContent)).toBe('消息(共3条)');

    // 载入示例可恢复
    clickButton(container, '载入示例');
    expect(flat(screen.getByText(/消息 \(共/).textContent)).toBe('消息(共7条)');
  });

  test('消息的发送方 / 文案 / 时间 编辑会即时反映到预览', () => {
    const { container } = render(<ChatGenerator />);
    clickButton(container, '清空');
    clickButton(container, '添加文字');

    const textInput = screen.getByPlaceholderText('内容');
    fireEvent.change(textInput, { target: { value: '这是一条新消息' } });
    expect(flat(preview(container).textContent)).toContain('这是一条新消息');

    // 消息时间 (HH:MM) 出现在气泡下方
    fireEvent.change(screen.getByPlaceholderText('16:20'), { target: { value: '09:05' } });
    expect(flat(preview(container).textContent)).toContain('09:05');
  });

  test('「显示昵称」开关控制气泡上方的昵称', () => {
    const { container } = render(<ChatGenerator />);
    const switchEl = screen.getAllByRole('switch').find((el) => el.getAttribute('aria-checked') === 'false') as HTMLElement;
    // 默认不显示昵称
    expect(flat(preview(container).textContent)).not.toContain('林小满');
    fireEvent.click(switchEl);
    expect(flat(preview(container).textContent)).toContain('林小满');
  });

  test('已保存的默认设置会带到页面初始状态', () => {
    localStorage.setItem('chat-generator.platform', 'telegram');
    localStorage.setItem('chat-generator.title', '开局标题');
    localStorage.setItem(KEY_SHOW_NAMES, '1');
    localStorage.setItem('chat-generator.showInputBar', '0');
    const { container } = render(<ChatGenerator />);
    expect(preview(container).dataset.platform).toBe('telegram');
    expect((screen.getByDisplayValue('开局标题') as HTMLInputElement).value).toBe('开局标题');
    expect(flat(preview(container).textContent)).toContain('林小满');
    // 关闭底部输入栏后预览里没有输入消息文案
    expect(flat(preview(container).textContent)).not.toContain('输入消息');
  });

  test('选择图片后预览显示图片 (data URL, 不上传)', async () => {
    const { container } = render(<ChatGenerator />);
    clickButton(container, '清空');
    clickButton(container, '添加图片');
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [ new File([ 'png-bytes' ], 'a.png', { type: 'image/png' }) ] } });
    await waitFor(() => {
      const img = preview(container).querySelector('img') as HTMLImageElement;
      expect(img.src.startsWith('data:image/png;base64')).toBe(true);
    });
    // 未触发任何网络请求
    expect(mockSavePngFile).not.toHaveBeenCalled();
  });

  test('上限保护: 消息条数达到上限时提示且不再追加', () => {
    // 不逐条点到 80 条 (太慢), 直接在「已满」的初始状态上验证: 先把消息加到上限
    const { container } = render(<ChatGenerator />);
    clickButton(container, '清空');
    for (let i = 0; i < MESSAGES_MAX; i += 1) clickButton(container, '添加时间');
    expect(flat(screen.getByText(/消息 \(共/).textContent)).toBe(`消息(共${MESSAGES_MAX}条)`);
    clickButton(container, '添加文字');
    expect(flat(screen.getByText(/消息 \(共/).textContent)).toBe(`消息(共${MESSAGES_MAX}条)`);
    expect(noticeText()).toContain('上限');
  });

  describe('导出 PNG', () => {
    test('按当前倍率调用 toPng 并保存文件', async () => {
      const { container } = render(<ChatGenerator />);
      clickButton(container, '导出 PNG');
      await waitFor(() => expect(mockSavePngFile).toHaveBeenCalled());
      // 默认倍率 2
      expect(mockToPng).toHaveBeenCalledTimes(1);
      expect(mockToPng.mock.calls[0][1]).toEqual(expect.objectContaining({ pixelRatio: 2 }));
      const [ name, dataUrl ] = mockSavePngFile.mock.calls[0] as [string, string];
      expect(name.startsWith('chat-wechat-')).toBe(true);
      expect(name.endsWith('.png')).toBe(true);
      expect(dataUrl).toBe('data:image/png;base64,SHOT');
      await waitFor(() => expect(noticeText()).toContain('已导出PNG'));
      expect(container.querySelector('[data-testid="chat-preview"]')).toBeTruthy();
    });

    test('切换倍率后导出使用新倍率', async () => {
      const { container } = render(<ChatGenerator />);
      // 消息行里也有下拉, 靠当前选中值 "2x" 定位「导出倍率」
      const scaleSelect = Array.from(document.querySelectorAll('.ant-select'))
        .find((el) => /^\s*2x\s*$/.test(flat(el.textContent))) as HTMLElement;
      fireEvent.mouseDown(scaleSelect.querySelector('.ant-select-selector') as Element);
      const item = screen.getAllByText('3x').find((el) => el.closest('.ant-select-item'));
      fireEvent.click(item as Element);
      clickButton(container, '导出 PNG');
      await waitFor(() => expect(mockToPng).toHaveBeenCalled());
      expect(mockToPng.mock.calls[0][1]).toEqual(expect.objectContaining({ pixelRatio: 3 }));
    });

    test('用户取消保存时不提示成功', async () => {
      mockSavePngFile.mockResolvedValueOnce(false);
      const { container } = render(<ChatGenerator />);
      const before = noticeCount();
      await act(async () => clickButton(container, '导出 PNG'));
      expect(mockSavePngFile).toHaveBeenCalled();
      // 取消保存 (返回 false) 不弹任何提示
      expect(noticeCount()).toBe(before);
    });

    test('导出异常时提示失败原因', async () => {
      mockToPng.mockRejectedValueOnce(new Error('canvas is not defined'));
      const { container } = render(<ChatGenerator />);
      clickButton(container, '导出 PNG');
      await waitFor(() => expect(noticeText()).toContain('导出失败'));
      expect(noticeText()).toContain('canvasisnotdefined');
    });
  });

  test('英文环境下页面文案走语言包', () => {
    localStorage.setItem('app-locale', 'en');
    const { container } = render(<LocaleProvider><ChatGenerator /></LocaleProvider>);
    expect(flat(container.textContent)).toContain('Editconversation');
    expect(flat(container.textContent)).toContain('Preview&export');
    expect(flat(container.textContent)).toContain('ExportPNG');
  });
});
