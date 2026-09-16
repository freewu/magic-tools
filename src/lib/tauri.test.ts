import { saveTextFile } from './tauri';

// 模拟 @tauri-apps 插件 (动态 import 在 CJS 下同样会命中 jest.mock)
const mockSave = jest.fn();
const mockWriteTextFile = jest.fn();
const mockWriteFile = jest.fn();

jest.mock('@tauri-apps/plugin-dialog', () => ({
  save: (...args: unknown[]) => mockSave(...args),
}), { virtual: true });
jest.mock('@tauri-apps/plugin-fs', () => ({
  writeTextFile: (...args: unknown[]) => mockWriteTextFile(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
}), { virtual: true });

const setTauri = (on: boolean) => {
  const w = window as unknown as Record<string, unknown>;
  if (on) w.__TAURI__ = {};
  else delete w.__TAURI__;
};

describe('saveTextFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSave.mockResolvedValue('/tmp/out.jsonl');
    mockWriteTextFile.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    setTauri(true);
  });
  afterAll(() => setTauri(false));

  it('Tauri: 走系统保存对话框 + writeTextFile', async () => {
    const ok = await saveTextFile('data.jsonl', '1\n2', '保存 JSONL 文件', { filterName: 'JSONL 文件', extensions: [ 'jsonl', 'ndjson' ] });
    expect(ok).toBe(true);
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave.mock.calls[0][0]).toMatchObject({
      title: '保存 JSONL 文件',
      defaultPath: 'data.jsonl',
      filters: [{ name: 'JSONL 文件', extensions: [ 'jsonl', 'ndjson' ] }],
    });
    expect(mockWriteTextFile).toHaveBeenCalledWith('/tmp/out.jsonl', '1\n2');
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('Tauri: 用户取消保存对话框 -> false, 不写文件', async () => {
    mockSave.mockResolvedValue(null);
    await expect(saveTextFile('data.json', '[]')).resolves.toBe(false);
    expect(mockWriteTextFile).not.toHaveBeenCalled();
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('Tauri: writeTextFile 因权限缺失失败时, 退回 writeFile (字节写入) 保证落盘', async () => {
    // 回归: capabilities 只授 fs:allow-write-file 时, write_text_file 会被拒绝 -> 必须回退
    mockWriteTextFile.mockRejectedValue(new Error('fs.write_text_file not allowed'));
    await expect(saveTextFile('data.jsonl', 'a\nb')).resolves.toBe(true);
    expect(mockWriteFile).toHaveBeenCalledTimes(1);
    const [ path, bytes ] = mockWriteFile.mock.calls[0];
    expect(path).toBe('/tmp/out.jsonl');
    expect(new TextDecoder().decode(bytes as Uint8Array)).toBe('a\nb');
  });

  it('Tauri: 保存对话框本身失败时抛出异常 (不再静默回退下载)', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockSave.mockRejectedValue(new Error('dialog boom'));
    await expect(saveTextFile('data.json', '[]')).rejects.toThrow('dialog boom');
    spy.mockRestore();
  });

  it('浏览器环境: 回退为 <a download> 下载', async () => {
    setTauri(false);
    const createObjectURL = jest.fn(() => 'blob:mock');
    const revokeObjectURL = jest.fn();
    (URL as unknown as Record<string, unknown>).createObjectURL = createObjectURL;
    (URL as unknown as Record<string, unknown>).revokeObjectURL = revokeObjectURL;
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await expect(saveTextFile('data.jsonl', '1\n2')).resolves.toBe(true);
    expect(mockSave).not.toHaveBeenCalled();
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    click.mockRestore();
    setTauri(true);
  });
});
