import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import JSONLConvert from './index';
import { saveTextFile } from '../../lib/tauri';

// 桌面环境: 下载应走系统保存对话框 (saveTextFile)
jest.mock('../../lib/tauri', () => ({
  isTauri: () => true,
  saveTextFile: jest.fn().mockResolvedValue(true),
}));

/** 上方 textarea = JSON 框, 下方 textarea = JSONL 框 */
const boxes = (): HTMLTextAreaElement[] => screen.getAllByRole('textbox') as HTMLTextAreaElement[];
const jsonBox = () => boxes()[0];
const jsonlBox = () => boxes()[1];
const setJson = (text: string) => fireEvent.change(jsonBox(), { target: { value: text } });
const setJsonl = (text: string) => fireEvent.change(jsonlBox(), { target: { value: text } });

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

  test('JSON -> JSONL: 读上方 JSON 框, 结果写入下方 JSONL 框', () => {
    const { container } = render(<JSONLConvert />);
    setJson('[\n  {"id": 1},\n  {"id": 2}\n]');
    expect(within(container).getByText('识别到: JSON 数组 (2 条)')).toBeInTheDocument();

    click('JSON → JSONL');
    expect(jsonBox().value).toBe('[\n  {"id": 1},\n  {"id": 2}\n]'); // 源内容保留
    expect(jsonlBox().value).toBe('{"id":1}\n{"id":2}');
    expect(within(container).getByText('已转换 2 条记录 (JSON → JSONL)')).toBeInTheDocument();
  });

  test('JSONL -> JSON: 读下方 JSONL 框, 结果写入上方 JSON 框', () => {
    const { container } = render(<JSONLConvert />);
    setJsonl('{"id":1}\n{"id":2}');
    expect(within(container).getByText('识别到: JSONL (2 行)')).toBeInTheDocument();

    click('JSONL → JSON');
    expect(jsonBox().value).toBe('[\n  {\n    "id": 1\n  },\n  {\n    "id": 2\n  }\n]\n');
    expect(jsonlBox().value).toBe('{"id":1}\n{"id":2}'); // 源内容保留
  });

  test('单个 JSON 对象也能转换 (顶层为单个值)', () => {
    const { container } = render(<JSONLConvert />);
    setJson('{ "id": 1 }');
    expect(within(container).getByText('识别到: JSON 对象 (单条记录)')).toBeInTheDocument();

    click('JSON → JSONL');
    expect(jsonlBox().value).toBe('{"id":1}');
    expect(within(container).getByText('已转换 1 条记录 (JSON → JSONL, 顶层为单个值)')).toBeInTheDocument();
  });

  test('放错框 / 点错按钮时会自动纠正方向', () => {
    const { container } = render(<JSONLConvert />);

    // JSON 数组放在 JSON 框里, 却点了「JSONL → JSON」(该方向的源框为空) -> 自动按 JSON -> JSONL 转换
    setJson('[{"id":1},{"id":2}]');
    click('JSONL → JSON');
    expect(jsonlBox().value).toBe('{"id":1}\n{"id":2}');
    expect(within(container).getByText('已转换 2 条记录 (JSON → JSONL)')).toBeInTheDocument();

    // JSONL 放在 JSON 框里 (放错), 点「JSONL → JSON」-> 源框为空, 自动改用 JSON 框的内容
    click('清除');
    setJson('{"id":1}\n{"id":2}');
    click('JSONL → JSON');
    expect(jsonBox().value).toBe('[\n  {\n    "id": 1\n  },\n  {\n    "id": 2\n  }\n]\n');
  });

  test('非法行 / 空内容不产生结果', () => {
    const { container } = render(<JSONLConvert />);
    setJsonl('{"id":1}\n{"id":');
    click('JSONL → JSON');
    expect(jsonBox().value).toBe('');
    expect(within(container).getByText('无法识别: 内容既不是完整 JSON, 也不是逐行合法的 JSONL')).toBeInTheDocument();

    click('清除');
    click('JSON → JSONL');
    expect(jsonlBox().value).toBe('');
  });

  test('载入示例后自动转换到 JSONL 框, 清除后全部还原', () => {
    const { container } = render(<JSONLConvert />);
    click('载入示例');
    expect(jsonBox().value).toContain('"id": 1');
    expect(jsonlBox().value.split('\n')).toHaveLength(3);
    expect(JSON.parse(jsonlBox().value.split('\n')[0])).toMatchObject({ id: 1 });
    expect(within(container).getByText('已转换 3 条记录 (JSON → JSONL)')).toBeInTheDocument();

    click('清除');
    expect(jsonBox().value).toBe('');
    expect(jsonlBox().value).toBe('');
    expect(within(container).queryByText(/已转换/)).toBeNull();
  });

  test('复制结果与双击复制都会写入粘贴板 (结果所在框)', async () => {
    render(<JSONLConvert />);
    setJson('[1,2]');
    click('JSON → JSONL');
    expect(jsonlBox().value).toBe('1\n2');

    expect(btn('复制结果')).toBeEnabled();
    click('复制结果');
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith('1\n2'));

    fireEvent.doubleClick(jsonlBox());
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(2));
  });

  test('两个框都可手工编辑 (内容可继续修改)', () => {
    render(<JSONLConvert />);
    setJson('[1]');
    click('JSON → JSONL');
    fireEvent.change(jsonlBox(), { target: { value: '改过了' } });
    expect(jsonlBox().value).toBe('改过了');
    fireEvent.change(jsonBox(), { target: { value: '也改过了' } });
    expect(jsonBox().value).toBe('也改过了');
  });

  test('下载走系统保存对话框 (桌面版): 扩展名随结果所在框', async () => {
    render(<JSONLConvert />);
    setJson('[1,2]');
    click('JSON → JSONL');
    click('下载');
    await waitFor(() => expect(saveTextFile).toHaveBeenCalledTimes(1));
    expect((saveTextFile as jest.Mock).mock.calls[0][0]).toBe('data.jsonl');
    expect((saveTextFile as jest.Mock).mock.calls[0][1]).toBe('1\n2');

    // 反向转换后结果为 JSON, 扩展名跟着变
    click('清除');
    setJsonl('{"a":1}');
    click('JSONL → JSON');
    click('下载');
    await waitFor(() => expect(saveTextFile).toHaveBeenCalledTimes(2));
    expect((saveTextFile as jest.Mock).mock.calls[1][0]).toBe('data.json');
    expect((saveTextFile as jest.Mock).mock.calls[1][1]).toContain('"a": 1');
  });
});
