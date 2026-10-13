import {
  MAX_ROWS, MAX_ZIP_SIZE, NAME_MODE_KEY, PREVIEW_TEXT_BYTES, ZIP_EXTRACT_CHANGED, fileNameOf,
  getDefaultNameMode, invertSelection, isNameMode, planExtract, previewKind, pruneSelection, selectAll,
  selectableIds, setDefaultNameMode, toggleId,
} from './lib';
import type { ZipEntry } from '../../lib/zip';
import { listEntries, loadZip, buildZip } from '../../lib/zip';

/** 造一个条目 */
const entryOf = (path: string, size = 10, partial: Partial<ZipEntry> = {}): ZipEntry => ({
  key: path,
  path,
  dir: false,
  size,
  compressedSize: Math.floor(size / 2),
  date: new Date(1767222245000),
  unsafe: false,
  ...partial,
});

const dirOf = (path: string): ZipEntry => entryOf(path, 0, { dir: true, key: path });

describe('Zip 解压 配置项', () => {
  beforeEach(() => { localStorage.clear(); });

  test('文件名编码白名单与默认值', () => {
    expect(isNameMode('auto')).toBe(true);
    expect(isNameMode('big5')).toBe(true);
    expect(isNameMode('shift-jis')).toBe(false);
    expect(isNameMode(null)).toBe(false);
  });

  test('默认编码读写 + 广播', () => {
    const onChanged = jest.fn();
    window.addEventListener(ZIP_EXTRACT_CHANGED, onChanged);
    expect(getDefaultNameMode()).toBe('auto');
    setDefaultNameMode('gbk');
    expect(localStorage.getItem(NAME_MODE_KEY)).toBe('gbk');
    expect(getDefaultNameMode()).toBe('gbk');
    // 非法值回退 auto
    setDefaultNameMode('utf-16');
    expect(getDefaultNameMode()).toBe('auto');
    expect(onChanged).toHaveBeenCalledTimes(2);
    window.removeEventListener(ZIP_EXTRACT_CHANGED, onChanged);
  });

  test('常量自检', () => {
    expect(MAX_ZIP_SIZE).toBeGreaterThan(0);
    expect(MAX_ROWS).toBeGreaterThan(0);
    expect(PREVIEW_TEXT_BYTES).toBeGreaterThan(0);
  });
});

describe('Zip 解压 选中集合', () => {
  const entries = [ entryOf('a.txt'), dirOf('docs/'), entryOf('docs/b.txt') ];

  test('目录不可选', () => {
    expect(selectableIds(entries)).toEqual([ 'a.txt', 'docs/b.txt' ]);
    expect([ ...selectAll(entries) ]).toEqual([ 'a.txt', 'docs/b.txt' ]);
  });

  test('toggleId 切换单个条目 (不改原集合)', () => {
    const prev = new Set<string>([ 'a.txt' ]);
    const next = toggleId(prev, 'docs/b.txt');
    expect([ ...next ].sort()).toEqual([ 'a.txt', 'docs/b.txt' ]);
    expect([ ...prev ]).toEqual([ 'a.txt' ]);
    expect([ ...toggleId(next, 'a.txt') ]).toEqual([ 'docs/b.txt' ]);
  });

  test('invertSelection 只反转文件条目', () => {
    expect([ ...invertSelection(new Set([ 'a.txt' ]), entries) ]).toEqual([ 'docs/b.txt' ]);
    expect([ ...invertSelection(selectAll(entries), entries) ]).toEqual([]);
  });

  test('pruneSelection 丢掉已不存在的条目', () => {
    const pruned = pruneSelection(new Set([ 'a.txt', 'gone.txt', 'docs/' ]), entries);
    expect([ ...pruned ]).toEqual([ 'a.txt' ]);
  });
});

describe('Zip 解压 预览类型', () => {
  test('按扩展名判断', () => {
    expect(previewKind(entryOf('pics/a.png'))).toBe('image');
    expect(previewKind(entryOf('readme.md'))).toBe('text');
    expect(previewKind(entryOf('a.bin'))).toBe('binary');
    expect(previewKind(dirOf('docs/'))).toBe('dir');
  });

  test('未知扩展名按字节样本兜底', () => {
    const bytes = new TextEncoder().encode('hello world, this is plain text');
    expect(previewKind(entryOf('noext'), bytes)).toBe('text');
    expect(previewKind(entryOf('noext'), new Uint8Array([ 0, 1, 2, 3 ]))).toBe('binary');
    // 没有字节时不猜测
    expect(previewKind(entryOf('noext'))).toBe('binary');
  });
});

describe('Zip 解压 落盘计划', () => {
  const entries = [
    dirOf('docs/'),
    entryOf('docs/a.txt'),
    entryOf('docs/sub/b.txt'),
    entryOf('plain.txt'),
  ];

  test('只取选中的文件, 跳过目录', () => {
    const plan = planExtract(entries, new Set([ 'docs/a.txt', 'docs/' ]));
    expect(plan.items.map((i) => i.rel)).toEqual([ 'docs/a.txt' ]);
    // 选中的目录被计入 dirs (空目录不单独创建)
    expect(plan.dirs).toBe(1);
    expect(plan.unsafe).toEqual([]);
  });

  test('剥离 ../ 与绝对路径, 归一到空则跳过', () => {
    const list = [ entryOf('../../etc/passwd', 5, { unsafe: true }), entryOf('../', 0, { unsafe: true }) ];
    const plan = planExtract(list, new Set([ '../../etc/passwd', '../' ]));
    expect(plan.items.map((i) => i.rel)).toEqual([ 'etc/passwd' ]);
    expect(plan.unsafe).toEqual([ '../' ]);
  });

  test('归一化后重名时自动加序号, 不互相覆盖', () => {
    const list = [ entryOf('a/x.txt'), entryOf('a/./x.txt', 20, { unsafe: true }) ];
    const plan = planExtract(list, new Set([ 'a/x.txt', 'a/./x.txt' ]));
    expect(plan.items.map((i) => i.rel)).toEqual([ 'a/x.txt', 'a/x (2).txt' ]);
    // 两行分别对应不同条目 (id 保留原始键名)
    expect(plan.items.map((i) => i.id)).toEqual([ 'a/x.txt', 'a/./x.txt' ]);
  });

  test('未选中 / 空包返回空计划', () => {
    expect(planExtract(entries, new Set()).items).toEqual([]);
    expect(planExtract([], new Set([ 'a' ]))).toEqual({ items: [], dirs: 0, unsafe: [] });
  });

  test('fileNameOf 取路径最后一段', () => {
    expect(fileNameOf('docs/sub/b.txt')).toBe('b.txt');
    expect(fileNameOf('a.txt')).toBe('a.txt');
  });
});

describe('Zip 解压 与真实压缩包联动', () => {
  test('打包后再解析: 条目齐全, 计划路径与原路径一致', async () => {
    const bytes = await buildZip([
      { path: 'docs/a.txt', bytes: new TextEncoder().encode('hello') },
      { path: 'docs/sub/b.txt', bytes: new TextEncoder().encode('world') },
    ], 6);
    const zip = await loadZip(bytes, { nameMode: 'auto' });
    const entries = listEntries(zip).filter((e) => !e.dir);
    expect(entries.map((e) => e.path)).toEqual([ 'docs/a.txt', 'docs/sub/b.txt' ]);
    const plan = planExtract(entries, selectAll(entries));
    expect(plan.items.map((i) => i.rel)).toEqual([ 'docs/a.txt', 'docs/sub/b.txt' ]);
  });
});
