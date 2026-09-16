import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import JSONLConvert from './index';
import { saveTextFile } from '../../lib/tauri';

// 桌面环境: 下载应走系统保存对话框 (saveTextFile)
jest.mock('../../lib/tauri', () => ({
  isTauri: () => true,
  saveTextFile: jest.fn().mockResolvedValue(true),
}));

/** 输入 / 输出两个多行文本框 */
const boxes = (): HTMLTextAreaElement[] => screen.getAllByRole('textbox') as HTMLTextAreaElement[];

const setInput = (text: string) => fireEvent.change(boxes()[0], { target: { value: text } });
const inputValue = () => boxes()[0].value;
const outputValue = () => boxes()[1].value;

/**
 * 按按钮文案定位: antd 会在两个汉字之间插入空格 ("清 除"), 且按钮的无障碍名称含图标
 * aria-label, 因此按"去掉空白后的文本"匹配最近的 button
 */
const btn = (name: string): HTMLButtonElement => {
  const target = name.replace(/\s+/g, '');
  const hit = screen
    .getAllByText((_, el) => (el?.textContent ?? '').replace(/\s+/g, '') === target)
    .find((el) => el.closest('button'));
  if (!hit) throw new Error(`未找到按钮: ${name}`);
  return hit.closest('button') as HTMLButtonElement;
};
const click = (name: string) => fireEvent.click(btn(name));

describe('JSONLConvert 交互', () => {
  beforeEach(() => {
    // jsdom 没有实现粘贴板, 注入一个 jest.fn 便于断言复制行为
    Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });
    (saveTextFile as jest.Mock).mockClear();
  });

  test('JSON 数组 -> JSONL: 每个元素压成一行, 并显示识别结果与统计', () => {
    const { container } = render(<JSONLConvert />);
    setInput('[\n  {"id": 1},\n  {"id": 2}\n]');
    expect(within(container).getByText('识别到: JSON 数组 (2 条)')).toBeInTheDocument();

    click('JSON → JSONL');
    expect(outputValue()).toBe('{"id":1}\n{"id":2}');
    expect(within(container).getByText('已转换 2 条记录 (JSON → JSONL)')).toBeInTheDocument();
  });

  test('JSONL -> JSON: 逐行解析为格式化数组 (缩进默认 2 空格)', () => {
    const { container } = render(<JSONLConvert />);
    setInput('{"id":1}\n{"id":2}');
    expect(within(container).getByText('识别到: JSONL (2 行)')).toBeInTheDocument();

    click('JSONL → JSON');
    expect(outputValue()).toBe('[\n  {\n    "id": 1\n  },\n  {\n    "id": 2\n  }\n]\n');
  });

  test('单个 JSON 对象也能转换 (顶层为单个值)', () => {
    const { container } = render(<JSONLConvert />);
    setInput('{ "id": 1 }');
    expect(within(container).getByText('识别到: JSON 对象 (单条记录)')).toBeInTheDocument();

    click('JSON → JSONL');
    expect(outputValue()).toBe('{"id":1}');
    expect(within(container).getByText('已转换 1 条记录 (JSON → JSONL, 顶层为单个值)')).toBeInTheDocument();
  });

  test('点错按钮时自动按正确方向转换 (JSON 数组 + 「JSONL → JSON」)', () => {
    const { container } = render(<JSONLConvert />);
    setInput('[{"id":1},{"id":2}]');
    click('JSONL → JSON');
    expect(outputValue()).toBe('{"id":1}\n{"id":2}');
    expect(within(container).getByText('已转换 2 条记录 (JSON → JSONL)')).toBeInTheDocument();
  });

  test('文本误粘到下方结果框时也能转换', () => {
    const { container } = render(<JSONLConvert />);
    fireEvent.change(boxes()[1], { target: { value: '{"id":1}\n{"id":2}' } });
    click('JSONL → JSON');
    expect(outputValue()).toBe('[\n  {\n    "id": 1\n  },\n  {\n    "id": 2\n  }\n]\n');
    expect(within(container).getByText('已转换 2 条记录 (JSONL → JSON)')).toBeInTheDocument();
  });

  test('非法行 / 空输入不产生结果', () => {
    const { container } = render(<JSONLConvert />);
    setInput('{"id":1}\n{"id":');
    click('JSONL → JSON');
    expect(outputValue()).toBe('');
    expect(within(container).getByText('无法识别: 内容既不是完整 JSON, 也不是逐行合法的 JSONL')).toBeInTheDocument();

    setInput('   ');
    click('JSON → JSONL');
    expect(outputValue()).toBe('');
    expect(inputValue()).toBe('   ');
  });

  test('载入示例后自动按识别结果转换, 清除后全部还原', () => {
    const { container } = render(<JSONLConvert />);
    click('载入示例');
    expect(inputValue()).toContain('"id": 1');
    expect(outputValue().split('\n')).toHaveLength(3);
    expect(JSON.parse(outputValue().split('\n')[0])).toMatchObject({ id: 1 });
    expect(within(container).getByText('已转换 3 条记录 (JSON → JSONL)')).toBeInTheDocument();

    click('清除');
    expect(inputValue()).toBe('');
    expect(outputValue()).toBe('');
    expect(within(container).queryByText(/已转换/)).toBeNull();
  });

  test('复制结果与双击复制都会写入粘贴板', async () => {
    render(<JSONLConvert />);
    setInput('[1,2]');
    click('JSON → JSONL');
    expect(outputValue()).toBe('1\n2');

    expect(btn('复制结果')).toBeEnabled();
    click('复制结果');
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith('1\n2'));

    fireEvent.doubleClick(boxes()[1]);
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(2));
  });

  test('下载走系统保存对话框 (桌面版), 文件名沿用已载入文件主名', async () => {
    render(<JSONLConvert />);
    setInput('[1,2]');
    click('JSON → JSONL');
    click('下载');
    await waitFor(() => expect(saveTextFile).toHaveBeenCalledTimes(1));
    expect((saveTextFile as jest.Mock).mock.calls[0][0]).toBe('data.jsonl');
    expect((saveTextFile as jest.Mock).mock.calls[0][1]).toBe('1\n2');

    // 切换方向后扩展名跟着变
    setInput('{"a":1}');
    click('JSONL → JSON');
    click('下载');
    await waitFor(() => expect(saveTextFile).toHaveBeenCalledTimes(2));
    expect((saveTextFile as jest.Mock).mock.calls[1][0]).toBe('data.json');
  });

  test('输出框可手工编辑 (结果可继续修改)', () => {
    render(<JSONLConvert />);
    setInput('[1]');
    click('JSON → JSONL');
    fireEvent.change(boxes()[1], { target: { value: '改过了' } });
    expect(outputValue()).toBe('改过了');
  });
});
