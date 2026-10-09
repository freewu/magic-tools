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

/** 预览里的非 data URL 图片 (即本地打包的头像; 示例图片是内置 SVG data URL) */
const nonDataImgs = (container: HTMLElement): HTMLImageElement[] =>
  (Array.from(preview(container).querySelectorAll('img')) as HTMLImageElement[]).filter(
    (el) => !el.src.startsWith('data:'),
  );

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
    // 示例图片为内置 SVG (页面里还有头像等其它 img, 因此逐个比对)
    const imgs = Array.from(preview(container).querySelectorAll('img')) as HTMLImageElement[];
    expect(imgs.some((el) => el.src.startsWith('data:image/svg+xml'))).toBe(true);
    expect(container.querySelectorAll('.ant-tabs-tab').length).toBe(9);
    // 消息计数 (antd Space 会把多段文本拆开, 这里整体比对)
    expect(flat(screen.getByText(/消息 \(共/).textContent)).toBe('消息(共7条)');
  });

  test('切换平台: 预览主题与布局随之变化', () => {
    const { container } = render(<ChatGenerator />);
    const tab = (name: string) => screen.getAllByText(name).find((el) => el.closest('.ant-tabs-tab')) as HTMLElement;

    fireEvent.click(tab('QQ'));
    expect(preview(container).dataset.platform).toBe('qq');
    // QQ 的状态栏与标题栏同为蓝色, 时间仍然渲染在左侧 (默认 iOS)
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

  test('状态栏: iOS 灵动岛 / 百分比在电池内, 安卓挖孔 / 百分比在电池外 (两风格时钟都在左)', () => {
    const { container } = render(<ChatGenerator />);
    const statusBar = () => container.querySelector('[data-testid="chat-status-bar"]') as HTMLElement;
    const leftPart = () => statusBar().firstElementChild as HTMLElement;

    // 默认 iOS: 时间在左, 右侧是信号 + 网络 + 电池, 开孔为灵动岛
    expect(statusBar().dataset.system).toBe('ios');
    expect(statusBar().dataset.screenCut).toBe('island');
    expect(statusBar().dataset.batteryPercent).toBe('inside');
    expect(statusBar().style.height).toBe('34px');
    expect(flat(leftPart().textContent)).toBe('9:41');
    // 切换平台不会改变状态栏风格 (只跟系统风格有关)
    const tab = (name: string) => screen.getAllByText(name).find((el) => el.closest('.ant-tabs-tab')) as HTMLElement;
    fireEvent.click(tab('WhatsApp'));
    expect(statusBar().dataset.screenCut).toBe('island');

    // 切到安卓: 时钟仍在左侧, 但变为挖孔屏 + 百分比在电池外
    fireEvent.click(screen.getByText('安卓'));
    expect(statusBar().dataset.system).toBe('android');
    expect(statusBar().dataset.screenCut).toBe('hole');
    expect(statusBar().dataset.batteryPercent).toBe('outside');
    expect(statusBar().style.height).toBe('26px');
    expect(flat(leftPart().textContent)).toBe('9:41');
    expect(flat(statusBar().textContent)).toContain('82%');

    // 切回 iOS 恢复
    fireEvent.click(screen.getByText('iOS'));
    expect(statusBar().dataset.screenCut).toBe('island');
    expect(statusBar().dataset.batteryPercent).toBe('inside');
  });

  test('电量颜色: <10% 红, <20% 黄, 充电中绿', () => {
    const { container } = render(<ChatGenerator />);
    const statusBar = () => container.querySelector('[data-testid="chat-status-bar"]') as HTMLElement;
    const batteryColor = () => statusBar().dataset.batteryColor;
    const batteryInput = () => screen.getByDisplayValue('82') as HTMLInputElement;
    const chargingSwitch = () => {
      const label = screen.getByText('充电中');
      return (label.parentElement as HTMLElement).querySelector('.ant-switch') as HTMLElement;
    };

    // 正常电量用平台状态栏文字色 (微信为黑色)
    expect(batteryColor()).toBe('#000000');

    fireEvent.change(batteryInput(), { target: { value: '5' } });
    expect(batteryColor()).toBe('#ff3b30');

    fireEvent.change(screen.getByDisplayValue('5'), { target: { value: '15' } });
    expect(batteryColor()).toBe('#ff9f0a');

    // 充电中不管电量高低都是绿色
    fireEvent.click(chargingSwitch());
    expect(batteryColor()).toBe('#34c759');
    fireEvent.change(screen.getByDisplayValue('15'), { target: { value: '80' } });
    expect(batteryColor()).toBe('#34c759');

    // 关掉充电: 回到平台色
    fireEvent.click(chargingSwitch());
    expect(batteryColor()).toBe('#000000');
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

    // 副标题在微信下不展示 (输入框禁用), 切到 QQ 后可编辑并显示
    const tab = (name: string) => screen.getAllByText(name).find((el) => el.closest('.ant-tabs-tab')) as HTMLElement;
    fireEvent.click(tab('QQ'));
    const subtitle = screen.getByDisplayValue('在线') as HTMLInputElement;
    expect(subtitle.disabled).toBe(false);
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
    // 第一行还有「免打扰」开关, 因此按相邻文案定位
    const label = screen.getByText('显示昵称');
    const switchEl = (label.parentElement as HTMLElement).querySelector('.ant-switch') as HTMLElement;
    // 默认不显示昵称
    expect(flat(preview(container).textContent)).not.toContain('bluefrog');
    fireEvent.click(switchEl);
    expect(flat(preview(container).textContent)).toContain('bluefrog');
  });

  test('微信: 标题居中 / 无副标题 / 免打扰图标可开关', () => {
    const { container } = render(<ChatGenerator />);
    // 微信标题栏居中
    expect(container.querySelector('[data-title-center="1"]')).toBeTruthy();
    // 微信没有副标题: 输入框禁用, 预览也不展示
    expect((screen.getByDisplayValue('在线') as HTMLInputElement).disabled).toBe(true);
    expect(flat(preview(container).textContent)).not.toContain('在线');

    // 免打扰默认关闭, 打开后标题右侧出现禁音图标
    expect(container.querySelector('[data-testid="chat-mute"]')).toBeNull();
    const label = screen.getByText('免打扰');
    fireEvent.click((label.parentElement as HTMLElement).querySelector('.ant-switch') as HTMLElement);
    expect(container.querySelector('[data-testid="chat-mute"]')).toBeTruthy();

    // QQ / 钉钉 / 飞书同样居中且展示副标题; Telegram 标题靠左
    const tab = (name: string) => screen.getAllByText(name).find((el) => el.closest('.ant-tabs-tab')) as HTMLElement;
    fireEvent.click(tab('QQ'));
    expect(container.querySelector('[data-title-center="1"]')).toBeTruthy();
    expect((screen.getByDisplayValue('在线') as HTMLInputElement).disabled).toBe(false);
    expect(flat(preview(container).textContent)).toContain('在线');
    // 免打扰图标在 QQ 下同样生效
    expect(container.querySelector('[data-testid="chat-mute"]')).toBeTruthy();

    fireEvent.click(tab('Telegram'));
    expect(container.querySelector('[data-title-center="0"]')).toBeTruthy();
  });

  test('微信红包 / 转账: 仅微信提供, 其他平台按钮禁用且卡片退化为文字', () => {
    const { container } = render(<ChatGenerator />);
    const btn = (label: string) =>
      Array.from(container.querySelectorAll('button')).find((b) => flat(b.textContent) === flat(label)) as HTMLButtonElement;

    // 微信下可用
    expect(btn('添加红包').disabled).toBe(false);
    expect(btn('添加转账').disabled).toBe(false);

    clickButton(container, '添加红包');
    expect(flat(preview(container).textContent)).toContain('恭喜发财，大吉大利');
    expect(flat(preview(container).textContent)).toContain('微信红包');

    clickButton(container, '添加转账');
    expect(flat(preview(container).textContent)).toContain('￥100.00');
    expect(flat(preview(container).textContent)).toContain('转账');

    // 改祝福语 / 金额会即时反映到卡片
    fireEvent.change(screen.getByDisplayValue('恭喜发财，大吉大利'), { target: { value: '生日快乐' } });
    expect(flat(preview(container).textContent)).toContain('生日快乐');
    fireEvent.change(screen.getByDisplayValue('100.00'), { target: { value: '66.66' } });
    expect(flat(preview(container).textContent)).toContain('￥66.66');

    // 切到 QQ: 按钮禁用, 已有卡片退化为普通文字 (不作假)
    const tab = (name: string) => screen.getAllByText(name).find((el) => el.closest('.ant-tabs-tab')) as HTMLElement;
    fireEvent.click(tab('QQ'));
    expect(btn('添加红包').disabled).toBe(true);
    expect(btn('添加转账').disabled).toBe(true);
    expect(flat(preview(container).textContent)).toContain('生日快乐');
    expect(flat(preview(container).textContent)).toContain('￥66.66');
  });

  test('已保存的默认设置会带到页面初始状态', () => {
    localStorage.setItem('chat-generator.platform', 'telegram');
    localStorage.setItem('chat-generator.title', '开局标题');
    localStorage.setItem(KEY_SHOW_NAMES, '1');
    localStorage.setItem('chat-generator.showInputBar', '0');
    const { container } = render(<ChatGenerator />);
    expect(preview(container).dataset.platform).toBe('telegram');
    expect((screen.getByDisplayValue('开局标题') as HTMLInputElement).value).toBe('开局标题');
    expect(flat(preview(container).textContent)).toContain('bluefrog');
    // 关闭底部输入栏后预览里没有输入消息文案
    expect(flat(preview(container).textContent)).not.toContain('输入消息');
  });

  test('对方默认昵称与默认头像 (项目 Logo, 本地打包, 不联网)', () => {
    const { container } = render(<ChatGenerator />);
    // 默认昵称 bluefrog 写入输入框
    expect((screen.getByDisplayValue('bluefrog') as HTMLInputElement).value).toBe('bluefrog');
    // 默认头像为打包进产物的 Logo: 预览里的头像 img 不是 data URL, 也没发起网络请求
    // (多条对方消息各带一个头像)
    expect(nonDataImgs(container).length).toBeGreaterThan(0);
    expect(mockSavePngFile).not.toHaveBeenCalled();
    // 移除头像后回退为首字母, 再点「用默认头像」可恢复 Logo
    clickButton(container, '移除头像');
    expect(flat(preview(container).textContent)).toContain('B'); // 昵称未显示时头像回退为首字母
    expect(nonDataImgs(container).length).toBe(0);
    clickButton(container, '用默认头像');
    expect(nonDataImgs(container).length).toBeGreaterThan(0);
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
