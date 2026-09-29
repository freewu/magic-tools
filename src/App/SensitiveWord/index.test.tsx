import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { message } from 'antd';
import SensitiveWord from './index';
import { DEFAULTS_STORAGE_KEY, GZH_BANK, MASK_CHAR_DEFAULT, SAMPLE_TEXT, XHS_BANK } from './data';
import { maskText, scanText } from './lib';

// ---- tauri 桩: 保存文件 ----
const mockSaveTextFile = jest.fn().mockResolvedValue(true);
jest.mock('../../lib/tauri', () => ({
  isTauri: () => false,
  openUrl: jest.fn(),
  saveTextFile: (...args: unknown[]) => mockSaveTextFile(...args),
}));

// ---- 剪贴板桩 (jsdom 没有 navigator.clipboard) ----
const mockWriteText = jest.fn().mockResolvedValue(undefined);

// ---- DOM 取值助手 ----
const taEl = (c: HTMLElement) => c.querySelector('textarea.sw-input') as HTMLTextAreaElement;
const setText = (c: HTMLElement, value: string) => { fireEvent.change(taEl(c), { target: { value } }); };
const btn = (name: string): HTMLButtonElement => {
  const target = name.replace(/\s+/g, '');
  const hit = screen
    .getAllByText((_, el) => (el?.textContent ?? '').replace(/\s+/g, '') === target)
    .find((el) => el.closest('button'));
  if (!hit) throw new Error(`未找到按钮: ${name}`);
  return hit.closest('button') as HTMLButtonElement;
};
/** 工具页本体 (排除底部说明区 .intro) 里的同名文案 */
const uiTexts = (c: HTMLElement, text: string) =>
  within(c).queryAllByText(text).filter((el) => !el.closest('.intro'));
const hasUiText = (c: HTMLElement, text: string) => {
  expect(uiTexts(c, text).length).toBeGreaterThan(0);
};
const rows = (c: HTMLElement) => Array.from(c.querySelectorAll('.sw-table tbody tr'))
  .filter((tr) => !tr.classList.contains('ant-table-measure-row') && !tr.classList.contains('ant-table-placeholder')) as HTMLTableRowElement[];
const rowWords = (c: HTMLElement) => rows(c).map((tr) => (tr.querySelector('td')?.textContent ?? '').trim());
const marks = (c: HTMLElement) => Array.from(c.querySelectorAll('.sw-mark')) as HTMLElement[];
const switches = (c: HTMLElement) => Array.from(c.querySelectorAll('button.ant-switch')) as HTMLButtonElement[];
const radios = (c: HTMLElement) => Array.from(c.querySelectorAll('input[type="radio"]')) as HTMLInputElement[];
const activeTab = (c: HTMLElement) => (c.querySelector('.ant-tabs-tab-active')?.textContent ?? '');
const cards = (c: HTMLElement) => Array.from(c.querySelectorAll('.sw-card')) as HTMLElement[];
const bankTags = (c: HTMLElement) => Array.from(c.querySelectorAll('.sw-bank-list .ant-tag')) as HTMLElement[];
const scanCommon = (text: string) => scanText(text, { loose: true, latinBoundary: true }).common;
/** 切换页签 (antd Tabs 用 role=tab) */
const toTab = (name: RegExp) => {
  act(() => { fireEvent.click(screen.getByRole('tab', { name })); });
};
const clickCopy = async (name: string) => {
  await act(async () => { fireEvent.click(btn(name)); });
};
const openMaskSelect = async () => {
  const selector = document.querySelector('.ant-select-selector') as HTMLElement;
  await act(async () => { fireEvent.mouseDown(selector); });
};
const clickOption = async (text: string) => {
  const options = Array.from(document.querySelectorAll('.ant-select-item-option-content'));
  const hit = options.find((o) => (o.textContent ?? '') === text);
  if (!hit) throw new Error(`找不到选项「${text}」`);
  await act(async () => { fireEvent.click(hit); });
};

beforeAll(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: (...a: unknown[]) => mockWriteText(...a) },
    configurable: true,
  });
});

beforeEach(() => {
  mockSaveTextFile.mockClear();
  mockWriteText.mockClear();
  localStorage.clear();
  message.destroy();
});

describe('敏感词检测 初始界面', () => {
  test('未输入时显示空状态与说明, 操作按钮不可用', () => {
    const { container } = render(<SensitiveWord />);
    expect(taEl(container)).toBeInTheDocument();
    expect(container.querySelector('.sw-input')).toHaveAttribute('placeholder', '把文案 / 标题 / 商品详情粘贴到这里, 自动检测敏感词');
    hasUiText(container, '先在上面粘贴一段文案, 这里会立刻给出检测结果');
    expect(btn('清空')).toBeDisabled();
    expect(btn('复制打码文本')).toBeDisabled();
    expect(btn('复制检测报告')).toBeDisabled();
    expect(btn('保存打码文本')).toBeDisabled();
    expect(btn('保存检测报告')).toBeDisabled();
    expect(btn('载入示例')).toBeEnabled();
    // 没有输入时不展示词库页签
    expect(container.querySelector('.sw-tabs')).not.toBeInTheDocument();
    // 默认选项: 宽松匹配 / 拉丁词边界都开, 打码字符 *
    expect(switches(container)).toHaveLength(2);
    expect(switches(container)[0]).toHaveClass('ant-switch-checked');
    expect(switches(container)[1]).toHaveClass('ant-switch-checked');
    expect(container.querySelector('.ant-select-selection-item')).toHaveTextContent(MASK_CHAR_DEFAULT);
    // 说明区
    expect(within(container).getByText('这个工具做什么')).toBeInTheDocument();
  });

  test('设置中心里的默认值会带进工具页', () => {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify({
      bank: 'gzh', loose: false, latinBoundary: false, maskChar: '●',
    }));
    const { container } = render(<SensitiveWord />);
    expect(switches(container)[0]).not.toHaveClass('ant-switch-checked');
    expect(switches(container)[1]).not.toHaveClass('ant-switch-checked');
    expect(container.querySelector('.ant-select-selection-item')).toHaveTextContent('●');
    setText(container, '集赞');
    expect(activeTab(container)).toContain('微信公众号');
  });
});

describe('敏感词检测 示例与概览', () => {
  test('载入示例后展示统计 / 三张卡片 / 三个页签', () => {
    const { container } = render(<SensitiveWord />);
    act(() => { fireEvent.click(btn('载入示例')); });
    expect(taEl(container).value).toBe(SAMPLE_TEXT);
    const total = scanCommon(SAMPLE_TEXT).total;
    expect(container.textContent).toContain('命中 ' + total + ' 处');
    expect(container.textContent).toContain('共 ' + [ ...SAMPLE_TEXT ].length + ' 字');
    // 卡片与页签
    expect(cards(container)).toHaveLength(3);
    expect(screen.getByRole('tab', { name: /^通用/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^小红书/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^微信公众号/ })).toBeInTheDocument();
    expect(activeTab(container)).toContain('通用');
    // 默认页签是通用词库, 表格里应有命中行
    expect(rows(container).length).toBeGreaterThan(3);
    expect(marks(container).length).toBeGreaterThan(0);
  });

  test('卡片显示各词库命中数与等级分布', () => {
    const { container } = render(<SensitiveWord />);
    setText(container, '祛斑 仅限今日');
    expect(cards(container)).toHaveLength(3);
    cards(container).forEach((card) => expect(card.textContent).toContain('命中 2 处 / 2 个词'));
    expect(uiTexts(cards(container)[0], '高危 1').length).toBe(1);
    expect(uiTexts(cards(container)[0], '中危 1').length).toBe(1);
    // 页签标题带命中数
    expect(screen.getByRole('tab', { name: '通用 (2)' })).toBeInTheDocument();
  });

  test('点卡片可以切换页签', () => {
    const { container } = render(<SensitiveWord />);
    setText(container, '祛斑');
    act(() => { fireEvent.click(cards(container)[1]); });
    expect(activeTab(container)).toContain('小红书');
    act(() => { fireEvent.click(cards(container)[2]); });
    expect(activeTab(container)).toContain('微信公众号');
  });

  test('清空后回到空状态', () => {
    const { container } = render(<SensitiveWord />);
    setText(container, '祛斑');
    expect(rows(container).length).toBe(1);
    act(() => { fireEvent.click(btn('清空')); });
    expect(taEl(container).value).toBe('');
    expect(container.querySelector('.sw-tabs')).not.toBeInTheDocument();
    expect(btn('复制打码文本')).toBeDisabled();
  });
});

describe('敏感词检测 词库差异与筛选', () => {
  test('两个平台的专有词只在各自页签命中', () => {
    const { container } = render(<SensitiveWord />);
    setText(container, '二维码 集赞');
    // 通用词库 = 并集
    expect(rowWords(container)).toEqual([ '二维码', '集赞' ]);
    toTab(/^小红书/);
    expect(rowWords(container)).toEqual([ '二维码' ]);
    toTab(/^微信公众号/);
    expect(rowWords(container)).toEqual([ '集赞' ]);
  });

  test('等级筛选只保留对应等级的词', () => {
    const { container } = render(<SensitiveWord />);
    setText(container, '祛斑 仅限今日');
    expect(rowWords(container)).toEqual([ '祛斑', '仅限今日' ]);
    const rs = radios(container);
    expect(rs).toHaveLength(4);
    act(() => { fireEvent.click(rs[1]); });
    expect(rowWords(container)).toEqual([ '祛斑' ]);
    act(() => { fireEvent.click(rs[3]); });
    expect(rowWords(container)).toEqual([]);
    hasUiText(container, '未命中该词库的敏感词');
    // 复原
    act(() => { fireEvent.click(rs[0]); });
    expect(rowWords(container)).toHaveLength(2);
  });

  test('高亮预览按等级配色并带建议提示', () => {
    const { container } = render(<SensitiveWord />);
    setText(container, '这款面膜祛斑很棒');
    const list = marks(container);
    expect(list).toHaveLength(1);
    expect(list[0].textContent).toBe('祛斑');
    expect(list[0]).toHaveClass('sw-mark-high');
    expect(list[0].getAttribute('title')).toContain('提亮肤色');
    toTab(/^小红书/);
    expect(marks(container)).toHaveLength(1);
  });

  test('未命中时卡片显示未命中, 表格给出空状态', () => {
    const { container } = render(<SensitiveWord />);
    setText(container, '今天天气不错, 出门散步');
    expect(cards(container)).toHaveLength(3);
    expect(uiTexts(container, '未命中')).toHaveLength(3);
    expect(rowWords(container)).toEqual([]);
    hasUiText(container, '未命中该词库的敏感词');
    expect(screen.getByRole('tab', { name: '通用 (0)' })).toBeInTheDocument();
    expect(marks(container)).toHaveLength(0);
  });

  test('位置列给出行列坐标, 多于 3 处时给出总数', () => {
    const { container } = render(<SensitiveWord />);
    setText(container, '祛斑\n祛斑 祛斑 祛斑');
    const cell = rows(container)[0].querySelectorAll('td')[3];
    expect(cell.textContent).toContain('第 1 行第 1 字');
    expect(cell.textContent).toContain('第 2 行第 1 字');
    expect(cell.textContent).toContain('等 4 处');
    expect(rows(container)[0].textContent).toContain('祛斑');
    expect(rows(container)[0].textContent).toContain('4');
  });

  test('词库预览展开后列出全部词条, 命中的排在最前', () => {
    const { container } = render(<SensitiveWord />);
    setText(container, '祛斑');
    toTab(/^小红书/);
    expect(container.querySelector('.sw-bank-list')).not.toBeInTheDocument();
    act(() => { fireEvent.click(container.querySelector('.ant-collapse-header') as HTMLElement); });
    const tags = bankTags(container);
    expect(tags).toHaveLength(XHS_BANK.length);
    expect(tags[0].textContent).toBe('祛斑');
    expect(tags[0]).toHaveClass('ant-tag-red');
    // 未命中的词条也会列出 (乱序取一个不在示例文案里的词)
    expect(tags.map((el) => el.textContent)).toContain(GZH_BANK.length > 0 ? '绝绝子' : '');
  });
});

describe('敏感词检测 匹配选项', () => {
  test('关闭宽松匹配后夹了间隔符的写法不再命中', () => {
    const { container } = render(<SensitiveWord />);
    setText(container, '微 信');
    expect(rowWords(container)).toEqual([ '微信' ]);
    act(() => { fireEvent.click(switches(container)[0]); });
    expect(rowWords(container)).toEqual([]);
    expect(marks(container)).toHaveLength(0);
  });

  test('关闭拉丁词边界后会命中英文单词里的字母词', () => {
    const { container } = render(<SensitiveWord />);
    setText(container, 'version 2.0');
    expect(rowWords(container)).toEqual([]);
    act(() => { fireEvent.click(switches(container)[1]); });
    expect(rowWords(container)).toEqual([ 'v' ]);
  });

  test('切换打码字符后复制的打码文本随之变化', async () => {
    const { container } = render(<SensitiveWord />);
    setText(container, '祛斑');
    await openMaskSelect();
    await clickOption('●');
    await clickCopy('复制打码文本');
    expect(mockWriteText).toHaveBeenCalledWith('●●');
  });
});

describe('敏感词检测 复制与保存', () => {
  test('复制打码文本按通用词库打码 (含只属于某个平台的词)', async () => {
    const { container } = render(<SensitiveWord />);
    const raw = '祛斑 集赞';
    setText(container, raw);
    await clickCopy('复制打码文本');
    expect(mockWriteText).toHaveBeenCalledTimes(1);
    expect(mockWriteText).toHaveBeenCalledWith('** **');
    expect(maskText(raw, scanCommon(raw).hits, MASK_CHAR_DEFAULT)).toBe('** **');
    expect(await screen.findByText('已复制打码文本')).toBeInTheDocument();
  });

  test('复制检测报告给出中文报告', async () => {
    const { container } = render(<SensitiveWord />);
    setText(container, '祛斑 仅限今日');
    await clickCopy('复制检测报告');
    const report = mockWriteText.mock.calls[0][0] as string;
    expect(report).toContain('敏感词检测报告');
    expect(report).toContain('祛斑 [高危] ×1');
    expect(report).toContain('【小红书词库】');
  });

  test('明细表里的复制按钮可单独取词', async () => {
    const { container } = render(<SensitiveWord />);
    setText(container, '祛斑');
    await act(async () => {
      fireEvent.click(container.querySelector('.sw-copy-word') as HTMLButtonElement);
    });
    expect(mockWriteText).toHaveBeenCalledWith('祛斑');
    expect(await screen.findByText('已复制敏感词 祛斑')).toBeInTheDocument();
  });

  test('保存打码文本 / 检测报告带时间戳文件名', async () => {
    const { container } = render(<SensitiveWord />);
    setText(container, '祛斑');
    await act(async () => { fireEvent.click(btn('保存打码文本')); });
    expect(mockSaveTextFile).toHaveBeenCalledTimes(1);
    const [ maskedName, maskedBody ] = mockSaveTextFile.mock.calls[0] as [ string, string ];
    expect(maskedName).toMatch(/^sensitive-word-masked-\d{8}-\d{6}\.txt$/);
    expect(maskedBody).toBe('**');
    await act(async () => { fireEvent.click(btn('保存检测报告')); });
    const [ reportName, reportBody ] = mockSaveTextFile.mock.calls[1] as [ string, string ];
    expect(reportName).toMatch(/^sensitive-word-report-\d{8}-\d{6}\.txt$/);
    expect(reportBody).toContain('敏感词检测报告');
  });

  test('粘贴时按输入内容实时更新 (无输入则按钮禁用)', () => {
    const { container } = render(<SensitiveWord />);
    setText(container, '微');
    expect(rowWords(container)).toEqual([]);
    setText(container, '微信');
    expect(rowWords(container)).toEqual([ '微信' ]);
    expect(btn('复制打码文本')).toBeEnabled();
  });
});
