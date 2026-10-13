import {
  KEEP_PATH_KEY, LEVEL_KEY, ZIP_COMPRESS_CHANGED, finalPaths, getDefaultKeepPath, getDefaultLevel,
  mergeFiles, readFiles, setDefaultKeepPath, setDefaultLevel, summarizeFiles, toLevel, type PickedFile,
} from './lib';
import { filesFromDataTransfer } from './lib';

/** 造一个待打包文件 (跳过读盘) */
const picked = (path: string, size = 3): PickedFile => ({
  id: `id-${path}`, path, size, lastModified: 1767222245000, bytes: new Uint8Array(size),
});

/** 造一个 File, 可指定 webkitRelativePath */
const fileOf = (name: string, text = 'x', relative = ''): File => {
  const file = new File([ text ], name, { type: 'text/plain', lastModified: 1767222245000 });
  Object.defineProperty(file, 'webkitRelativePath', { value: relative, configurable: true });
  return file;
};

describe('Zip 压缩 配置项', () => {
  beforeEach(() => { localStorage.clear(); });

  test('toLevel 规整非法 / 越界输入', () => {
    expect(toLevel(0)).toBe(0);
    expect(toLevel('9')).toBe(9);
    expect(toLevel(3.4)).toBe(3);
    expect(toLevel(-5)).toBe(0);
    expect(toLevel(99)).toBe(9);
    expect(toLevel('abc')).toBe(6);
    expect(toLevel(null)).toBe(6);
    expect(toLevel(undefined)).toBe(6);
  });

  test('压缩级别默认值读写 + 广播', () => {
    const onChanged = jest.fn();
    window.addEventListener(ZIP_COMPRESS_CHANGED, onChanged);
    expect(getDefaultLevel()).toBe(6);
    setDefaultLevel(9);
    expect(localStorage.getItem(LEVEL_KEY)).toBe('9');
    expect(getDefaultLevel()).toBe(9);
    // 非法值回退默认
    setDefaultLevel('bad');
    expect(getDefaultLevel()).toBe(6);
    expect(onChanged).toHaveBeenCalledTimes(2);
    window.removeEventListener(ZIP_COMPRESS_CHANGED, onChanged);
  });

  test('保留文件夹结构默认开启, 可关闭', () => {
    expect(getDefaultKeepPath()).toBe(true);
    setDefaultKeepPath(false);
    expect(localStorage.getItem(KEEP_PATH_KEY)).toBe('0');
    expect(getDefaultKeepPath()).toBe(false);
    // 配置文件导入时可能是字符串 / 数字
    setDefaultKeepPath('1');
    expect(getDefaultKeepPath()).toBe(true);
    setDefaultKeepPath(0);
    expect(getDefaultKeepPath()).toBe(false);
  });
});

describe('Zip 压缩 文件读取与合并', () => {
  test('readFiles 读取字节并带上目录层级', async () => {
    const out = await readFiles([
      fileOf('a.txt', 'hello', 'docs/a.txt'),
      fileOf('b.txt', 'hi'),
    ]);
    expect(out.map((f) => f.path)).toEqual([ 'docs/a.txt', 'b.txt' ]);
    expect(Array.from(out[0].bytes)).toHaveLength(5);
    expect(out[0].size).toBe(5);
    expect(out[0].lastModified).toBe(1767222245000);
    // id 唯一
    expect(out[0].id).not.toBe(out[1].id);
  });

  test('readFiles 超过上限时截断', async () => {
    const files = [ fileOf('a'), fileOf('b'), fileOf('c') ];
    expect((await readFiles(files, 2)).map((f) => f.path)).toEqual([ 'a', 'b' ]);
    expect(await readFiles(files, 0)).toEqual([]);
  });

  test('mergeFiles 同路径覆盖, 新路径追加', () => {
    const prev = [ picked('a.txt', 1), picked('b.txt', 2) ];
    const merged = mergeFiles(prev, [ picked('b.txt', 99), picked('c.txt', 3) ]);
    expect(merged.map((f) => f.path)).toEqual([ 'a.txt', 'b.txt', 'c.txt' ]);
    expect(merged[1].size).toBe(99);
    expect(merged).toHaveLength(3);
  });
});

describe('Zip 压缩 包内路径', () => {
  test('保留文件夹结构时路径原样, 不保留时只留文件名', () => {
    expect(finalPaths([ 'docs/a.txt', 'docs/sub/b.txt' ], true)).toEqual([ 'docs/a.txt', 'docs/sub/b.txt' ]);
    expect(finalPaths([ 'docs/a.txt', 'docs/sub/b.txt' ], false)).toEqual([ 'a.txt', 'b.txt' ]);
  });

  test('去掉文件夹结构后重名自动加序号', () => {
    expect(finalPaths([ 'x/a.txt', 'y/a.txt' ], false)).toEqual([ 'a.txt', 'a (2).txt' ]);
  });

  test('归一化盘符 / 反斜杠 / .. 等危险路径', () => {
    expect(finalPaths([ 'C:\\docs\\..\\a.txt' ], true)).toEqual([ 'C:/docs/a.txt' ]);
    expect(finalPaths([ '../../etc/passwd' ], false)).toEqual([ 'passwd' ]);
  });

  test('summarizeFiles 汇总文件数与总大小', () => {
    expect(summarizeFiles([])).toEqual({ count: 0, total: 0 });
    expect(summarizeFiles([ picked('a', 10), picked('b', 32) ])).toEqual({ count: 2, total: 42 });
  });
});

describe('Zip 压缩 拖拽读取', () => {
  /** 造一个目录条目 (readEntries 第一次返回子项, 第二次返回空) */
  const dirEntry = (name: string, children: unknown[]): unknown => {
    let read = false;
    return {
      name,
      isFile: false,
      isDirectory: true,
      createReader: () => ({
        readEntries: (cb: (batch: unknown[]) => void) => {
          const batch = read ? [] : children;
          read = true;
          cb(batch);
        },
      }),
    };
  };
  const fileEntry = (name: string, text: string): unknown => ({
    name,
    isFile: true,
    isDirectory: false,
    file: (cb: (f: File) => void) => cb(new File([ text ], name, { type: 'text/plain' })),
  });

  test('拖入文件夹时递归展开并保留相对路径', async () => {
    const dt = {
      items: [ { kind: 'file', webkitGetAsEntry: () => dirEntry('docs', [ fileEntry('a.txt', 'A'), dirEntry('sub', [ fileEntry('b.txt', 'B') ]) ]) } ],
      files: [],
    } as unknown as DataTransfer;
    const out = await filesFromDataTransfer(dt);
    expect(out.map((f) => f.name)).toEqual([ 'a.txt', 'b.txt' ]);
    // 供后续 entryPathOf 使用
    expect(out.map((f) => (f as File & { webkitRelativePath?: string }).webkitRelativePath))
      .toEqual([ 'docs/a.txt', 'docs/sub/b.txt' ]);
  });

  test('不支持 webkitGetAsEntry 时退回 dataTransfer.files', async () => {
    const plain = fileOf('a.txt', 'A');
    const dt = { items: [ { kind: 'file' } ], files: [ plain ] } as unknown as DataTransfer;
    expect(await filesFromDataTransfer(dt)).toEqual([ plain ]);
    expect(await filesFromDataTransfer(null)).toEqual([]);
    expect(await filesFromDataTransfer(undefined)).toEqual([]);
  });

  test('非 file 类型的拖拽项被忽略', async () => {
    const dt = { items: [ { kind: 'string' } ], files: [] } as unknown as DataTransfer;
    expect(await filesFromDataTransfer(dt)).toEqual([]);
  });
});
