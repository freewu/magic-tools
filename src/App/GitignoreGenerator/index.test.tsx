import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { saveTextFile } from '../../lib/tauri';
import GitignoreGenerator from './index';

jest.mock('../../lib/tauri', () => ({
  ...jest.requireActual('../../lib/tauri'),
  saveTextFile: jest.fn().mockResolvedValue(true),
}));

const mockSave = saveTextFile as jest.Mock;

let container: HTMLElement;
const setup = () => { container = render(<GitignoreGenerator />).container; };
/** 页面文本 */
const view = (): string => container.textContent ?? '';
/** 复选框标签 (取包裹 input 的 wrapper) */
const box = (label: string): HTMLElement => {
  const hit = screen.getAllByText(label).map((n) => n.closest('label.ant-checkbox-wrapper')).find(Boolean);
  if (!hit) throw new Error(`未找到复选框: ${label}`);
  return hit as HTMLElement;
};
const toggle = (label: string) => fireEvent.click(box(label).querySelector('input[type="checkbox"]') as HTMLElement);
/** 下拉多选 (分类内选项 > 5 个时启用): 按分组 aria-label 打开并点选/取消某个模板 */
const groupSelect = (group: string): HTMLElement => {
  const hit = container.querySelector(`[aria-label="${group}"]`);
  if (!hit) throw new Error(`未找到分组下拉: ${group}`);
  return hit as HTMLElement;
};
const pick = (group: string, label: string) => {
  fireEvent.mouseDown(groupSelect(group).querySelector('.ant-select-selector') as HTMLElement);
  const option = screen.getAllByText(label).find((el) => el.closest('.ant-select-item-option'));
  if (!option) throw new Error(`未找到下拉选项: ${label}`);
  fireEvent.click(option);
};
/** 已选标签数 (下拉多选里已选项以 tag 展示) */
const tagCount = (group: string): number => groupSelect(group).querySelectorAll('.ant-select-selection-item').length;
/** 按钮 (antd 两个汉字会自动插空格, 逐字符匹配) */
const btns = (name: string): HTMLElement[] =>
  screen.getAllByRole('button', { name: new RegExp(name.split('').map((c) => (c === ' ' ? '\\s+' : c)).join('\\s*')) });
const btn = (name: string): HTMLElement => btns(name)[0];
/** 搜索框 */
const search = (value: string) => fireEvent.change(screen.getByPlaceholderText('搜索模板'), { target: { value } });
/** 自定义追加输入框 */
const setCustom = (value: string) => fireEvent.change(
  screen.getByPlaceholderText('每行一条, 直接追加到结果末尾 (支持 # 注释与 ! 例外)'),
  { target: { value } },
);
const notice = (): string => document.querySelector('.ant-message')?.textContent ?? '';
const writeText = (): jest.Mock =>
  (navigator as unknown as { clipboard: { writeText: jest.Mock } }).clipboard.writeText;
/** 结果里某行的出现次数 */
const countOf = (text: string): number => (view().match(new RegExp(text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'), 'g')) ?? []).length;

describe('GitignoreGenerator 页面交互', () => {
  beforeEach(() => {
    message.destroy();
    mockSave.mockClear();
    Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });
  });

  test('默认渲染: 未勾选任何模板时提示并禁用操作按钮', () => {
    setup();
    expect(view()).toContain('个模板可选');
    expect(view()).toContain('已选 0 个模板');
    expect(view()).toContain('语言');
    expect(view()).toContain('框架与工具');
    expect(view()).toContain('编辑器 / IDE');
    expect(view()).toContain('操作系统');
    expect(view()).toContain('未选择任何模板, 也没有自定义规则');
    expect(btn('复制全部')).toBeDisabled();
    expect(btn('保存为 .gitignore')).toBeDisabled();
  });

  test('勾选 Node.js 后生成规则并提示补上密钥模板', () => {
    setup();
    pick('语言', 'Node.js');
    expect(view()).toContain('已选 1 个模板');
    expect(view()).toContain('# ---- Node.js ----');
    expect(view()).toContain('node_modules/');
    expect(view()).not.toContain('未选择任何模板, 也没有自定义规则');
    expect(view()).toContain('未勾选「环境变量 / 密钥」, 建议加上以避免误提交 .env / *.pem');
    expect(btn('复制全部')).not.toBeDisabled();
  });

  test('可关闭分组注释与顶部说明注释', () => {
    setup();
    pick('语言', 'Node.js');
    expect(view()).toContain('# ---- Node.js ----');
    toggle('分组注释');
    expect(view()).not.toContain('# ---- ');
    expect(view()).toContain('node_modules/');
    toggle('顶部说明注释');
    expect(view()).not.toContain('MagicTools');
  });

  test('自动去重可开关', () => {
    setup();
    pick('语言', 'Node.js');
    pick('其它', '缓存与构建产物');
    expect(countOf('dist/')).toBe(1);
    expect(view()).toContain('已自动去重');
    toggle('自动去重');
    expect(countOf('dist/')).toBe(2);
    expect(view()).not.toContain('已自动去重');
  });

  test('搜索过滤模板库', () => {
    setup();
    search('jetbrains');
    expect(view()).toContain('搜索结果');
    expect(view()).toContain('JetBrains');
    expect(view()).not.toContain('Node.js');
    search('zzzz-不存在');
    expect(view()).toContain('未找到匹配的模板');
  });

  test('常用组合一键勾选', () => {
    setup();
    fireEvent.click(screen.getByText('通用基础 (系统 + 编辑器 + 密钥)'));
    expect(view()).toContain('已选 8 个模板');
    expect(view()).toContain('.DS_Store');
    expect(view()).toContain('Thumbs.db');
  });

  test('全选与清空', () => {
    setup();
    fireEvent.click(btn('全选'));
    expect(view()).toContain('已选 64 个模板');
    fireEvent.click(btn('清空'));
    expect(view()).toContain('已选 0 个模板');
  });

  test('分类内选项超过 5 个时改用下拉多选, 少量选项仍为复选框', () => {
    setup();
    // 语言 (22) / 框架与工具 (20) / 编辑器 / IDE (9) / 其它 (10) 均为多选下拉
    for (const group of [ '语言', '框架与工具', '编辑器 / IDE', '其它' ]) {
      expect(groupSelect(group)).toBeInTheDocument();
    }
    // 操作系统只有 3 个模板, 仍平铺复选框
    expect(box('macOS')).toBeInTheDocument();
    expect(view()).toContain('选择模板 (可多选)');
  });

  test('下拉多选可选取与取消模板', () => {
    setup();
    pick('语言', 'Node.js');
    expect(tagCount('语言')).toBe(1);
    expect(view()).toContain('已选 1 个模板');
    expect(view()).toContain('# ---- Node.js ----');
    // 再次点选同一项即取消
    pick('语言', 'Node.js');
    expect(tagCount('语言')).toBe(0);
    expect(view()).toContain('已选 0 个模板');
  });

  test('恢复默认清空选择与自定义规则', () => {
    setup();
    pick('语言', 'Node.js');
    setCustom('custom.log');
    expect(view()).toContain('custom.log');
    fireEvent.click(btn('恢复默认'));
    expect(view()).toContain('已选 0 个模板');
    expect((screen.getByPlaceholderText('每行一条, 直接追加到结果末尾 (支持 # 注释与 ! 例外)') as HTMLTextAreaElement).value).toBe('');
    expect(view()).toContain('未选择任何模板, 也没有自定义规则');
  });

  test('自定义追加作为独立分组并提示绝对路径语义', () => {
    setup();
    setCustom('/build/\ncustom.log');
    expect(view()).toContain('# ---- 自定义追加 ----');
    expect(view()).toContain('custom.log');
    expect(view()).toContain('以 / 开头的规则只在仓库根目录生效, 需要匹配任意层级请去掉开头的 /');
  });

  test('复制全部写入选中的完整内容', async () => {
    setup();
    pick('语言', 'Node.js');
    fireEvent.click(btn('复制全部'));
    await waitFor(() => expect(notice()).toContain('已复制到粘贴板'));
    const copied = writeText().mock.calls[0][0] as string;
    expect(copied).toContain('# ---- Node.js ----');
    expect(copied.endsWith('\n')).toBe(true);
  });

  test('点击结果行只复制该行', async () => {
    setup();
    pick('语言', 'Node.js');
    fireEvent.click(screen.getByText('node_modules/'));
    await waitFor(() => expect(notice()).toContain('已复制到粘贴板'));
    expect(writeText()).toHaveBeenCalledWith('node_modules/');
  });

  test('保存为 .gitignore 调用落地方法', async () => {
    setup();
    pick('语言', 'Node.js');
    fireEvent.click(btn('保存为 .gitignore'));
    await waitFor(() => expect(mockSave).toHaveBeenCalled());
    expect(mockSave.mock.calls[0][0]).toBe('.gitignore');
    expect(mockSave.mock.calls[0][1] as string).toContain('node_modules/');
    await waitFor(() => expect(notice()).toContain('保存成功'));
  });
});
