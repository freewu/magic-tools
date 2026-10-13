import {
  DEFAULT_LEVEL, LEVELS, LEVEL_TAGS, ZIP_NAME_MODES,
  assignPaths, buildZip, bytesToBase64, entryPathOf, extOfPath, formatSize, imageDataUrl,
  imageMimeOf, isImageEntry, isTextEntry, isUnsafePath, listEntries, loadZip, looksLikeText,
  nameDecoder, normalizePath, readEntry, readEntryText, savedPercent, suggestZipName, summarize,
  uniquePath, zipNameOf,
} from './zip';

const bytesOf = (text: string): Uint8Array => new TextEncoder().encode(text);
const textOf = (bytes: Uint8Array): string => new TextDecoder('utf-8').decode(bytes);

/** 造一个 File (仅用到 name / webkitRelativePath, 不读内容) */
const fakeFile = (name: string, relative = ''): File => {
  const file = new File([ 'x' ], name);
  Object.defineProperty(file, 'webkitRelativePath', { value: relative, configurable: true });
  return file;
};

describe('zip 体积 / 比率格式化', () => {
  test('formatSize 覆盖 B / KB / MB / GB 与非法输入', () => {
    expect(formatSize(0)).toBe('0 B');
    expect(formatSize(-5)).toBe('0 B');
    expect(formatSize(NaN)).toBe('0 B');
    expect(formatSize(512)).toBe('512 B');
    expect(formatSize(2048)).toBe('2.0 KB');
    expect(formatSize(5 * 1024 * 1024)).toBe('5.00 MB');
    expect(formatSize(3 * 1024 * 1024 * 1024)).toBe('3.00 GB');
  });

  test('savedPercent 计算节省比例, 原始为 0 时返回 0', () => {
    expect(savedPercent(1000, 250)).toBe(75);
    expect(savedPercent(1000, 1000)).toBe(0);
    expect(savedPercent(0, 0)).toBe(0);
    expect(savedPercent(300, 450)).toBe(-50); // 变大时为负数 (仅存储 / 小文件头部开销)
  });
});

describe('路径归一化与去重', () => {
  test('normalizePath 统一分隔符并剥离危险片段', () => {
    expect(normalizePath('a\\b\\c.txt')).toBe('a/b/c.txt');
    expect(normalizePath('/a/b.txt')).toBe('a/b.txt');
    expect(normalizePath('../a/b.txt')).toBe('a/b.txt');
    expect(normalizePath('a//b/./c.txt')).toBe('a/b/c.txt');
    expect(normalizePath('a/b/')).toBe('a/b');
    expect(normalizePath('a/b/', true)).toBe('a/b/');
  });

  test('isUnsafePath 识别绝对路径 / 盘符 / .. 片段', () => {
    expect(isUnsafePath('/etc/passwd')).toBe(true);
    expect(isUnsafePath('C:\\windows\\x')).toBe(true);
    expect(isUnsafePath('a/../../b')).toBe(true);
    expect(isUnsafePath('a/b/c.txt')).toBe(false);
    expect(isUnsafePath('..hidden.txt')).toBe(false);
  });

  test('uniquePath 重名时在扩展名前插入序号', () => {
    const taken = new Set<string>();
    expect(uniquePath('a.txt', taken)).toBe('a.txt');
    expect(uniquePath('a.txt', taken)).toBe('a (2).txt');
    expect(uniquePath('a.txt', taken)).toBe('a (3).txt');
    // 目录名里的点不算扩展名
    expect(uniquePath('dir.v1/img', taken)).toBe('dir.v1/img');
    expect(uniquePath('dir.v1/img', taken)).toBe('dir.v1/img (2)');
  });

  test('assignPaths 为整批条目分配互不冲突的路径且保持顺序', () => {
    expect(assignPaths([ { path: 'a.txt' }, { path: 'a.txt' }, { path: 'b/a.txt' } ]))
      .toEqual([ 'a.txt', 'a (2).txt', 'b/a.txt' ]);
  });

  test('entryPathOf 优先使用 webkitRelativePath (拖入文件夹保留层级)', () => {
    expect(entryPathOf(fakeFile('a.txt'))).toBe('a.txt');
    expect(entryPathOf(fakeFile('a.txt', 'docs/sub/a.txt'))).toBe('docs/sub/a.txt');
    expect(entryPathOf(fakeFile('a.txt', 'docs\\sub\\a.txt'))).toBe('docs/sub/a.txt');
  });

  test('zipNameOf 补全扩展名并清理非法字符', () => {
    expect(zipNameOf('')).toBe('archive.zip');
    expect(zipNameOf('  my pack  ')).toBe('my pack.zip');
    expect(zipNameOf('done.ZIP')).toBe('done.ZIP');
    expect(zipNameOf('a/b:c*d')).toBe('a-b-c-d.zip');
    expect(zipNameOf('', 'photos')).toBe('photos.zip');
  });

  test('suggestZipName 取公共顶层目录名 / 首个文件名', () => {
    expect(suggestZipName([])).toBe('archive.zip');
    expect(suggestZipName([], 'photos')).toBe('photos.zip');
    expect(suggestZipName([ 'docs/a.txt', 'docs/b.txt' ])).toBe('docs.zip');
    // 顶层目录不一致时退回首个文件名
    expect(suggestZipName([ 'docs/a.txt', 'src/b.ts' ])).toBe('a.zip');
    expect(suggestZipName([ 'photo.png' ])).toBe('photo.zip');
    expect(suggestZipName([ 'photo.png', 'note.txt' ])).toBe('photo.zip');
    expect(suggestZipName([ 'a/b.txt' ])).toBe('a.zip');
  });
});

describe('打包 (buildZip)', () => {
  test('STORE 级别产出的包能被重新读取, 内容一致', async () => {
    const zipBytes = await buildZip([
      { path: 'hello.txt', bytes: bytesOf('hello 世界') },
      { path: 'dir/nested.txt', bytes: bytesOf('nested') },
    ], 0);
    expect(zipBytes.length).toBeGreaterThan(0);
    // zip 魔数 PK\x03\x04
    expect([ zipBytes[0], zipBytes[1], zipBytes[2], zipBytes[3] ]).toEqual([ 0x50, 0x4b, 0x03, 0x04 ]);

    const zip = await loadZip(zipBytes);
    const entries = listEntries(zip);
    const files = entries.filter((e) => !e.dir);
    expect(files.map((e) => e.path).sort()).toEqual([ 'dir/nested.txt', 'hello.txt' ]);
    const hello = files.find((e) => e.path === 'hello.txt')!;
    expect(textOf(await readEntry(zip, hello))).toBe('hello 世界');
  });

  test('DEFLATE 能压小重复内容, 且指定 STORE 时更大', async () => {
    const item = { path: 'repeat.txt', bytes: bytesOf('abcd'.repeat(5000)) };
    const stored = await buildZip([ item ], 0);
    const deflated = await buildZip([ item ], 9);
    expect(deflated.length).toBeLessThan(stored.length);
    // 4 字符重复内容压缩率很高 (远小于 1/4)
    expect(savedPercent(stored.length, deflated.length)).toBeGreaterThan(75);
  });

  test('重名文件不会互相覆盖 (第二个自动改名)', async () => {
    const zip = await loadZip(await buildZip([
      { path: 'a.txt', bytes: bytesOf('first') },
      { path: 'a.txt', bytes: bytesOf('second') },
    ], DEFAULT_LEVEL));
    const files = listEntries(zip).filter((e) => !e.dir).map((e) => e.path).sort();
    expect(files).toEqual([ 'a (2).txt', 'a.txt' ]);
  });

  test('onProgress 会被调用并最终到 100', async () => {
    const percents: number[] = [];
    await buildZip([ { path: 'a.txt', bytes: bytesOf('x'.repeat(1000)) } ], 6, (p) => percents.push(p));
    expect(percents.length).toBeGreaterThan(0);
    expect(percents[percents.length - 1]).toBe(100);
  });

  test('空列表也能生成合法的空包', async () => {
    const zip = await loadZip(await buildZip([], DEFAULT_LEVEL));
    expect(listEntries(zip).filter((e) => !e.dir)).toHaveLength(0);
  });
});

describe('读取 / 解包 (loadZip / listEntries / readEntryText)', () => {
  test('listEntries 统计大小并标记目录', async () => {
    const zip = await loadZip(await buildZip([
      { path: 'dir/a.txt', bytes: bytesOf('12345') },
      { path: 'b.bin', bytes: new Uint8Array([ 1, 2, 3 ]) },
    ], 6));
    const entries = listEntries(zip);
    const dir = entries.find((e) => e.dir);
    // 自动创建目录条目时路径带尾部 /
    expect(dir?.path).toBe('dir/');
    const a = entries.find((e) => e.path === 'dir/a.txt')!;
    expect(a.size).toBe(5);
    expect(a.compressedSize).toBeGreaterThan(0);
    expect(a.unsafe).toBe(false);
    expect(a.date).toBeInstanceOf(Date);

    const s = summarize(entries);
    expect(s.files).toBe(2);
    expect(s.dirs).toBeGreaterThanOrEqual(1);
    expect(s.rawSize).toBe(8);
    expect(s.zippedSize).toBeGreaterThan(0);
  });

  test('readEntryText 截断到 maxBytes, 目录 / 不存在条目返回空', async () => {
    const zip = await loadZip(await buildZip([ { path: 'a.txt', bytes: bytesOf('0123456789') } ], 6));
    const a = listEntries(zip).find((e) => e.path === 'a.txt')!;
    expect(await readEntryText(zip, a)).toBe('0123456789');
    expect(await readEntryText(zip, a, 4)).toBe('0123');
    expect(await readEntryText(zip, { ...a, key: 'missing.txt' })).toBe('');
    expect(await readEntryText(zip, { ...a, dir: true })).toBe('');
    expect((await readEntry(zip, { ...a, dir: true })).length).toBe(0);
  });

  test('checkCRC32 校验通过, 数据被篡改时抛错', async () => {
    const good = await buildZip([ { path: 'a.txt', bytes: bytesOf('hello') } ], 6);
    await expect(loadZip(good, { checkCRC32: true })).resolves.toBeTruthy();

    // 翻转内容区一个字节, 触发 CRC 不匹配
    const bad = Uint8Array.from(good);
    bad[bad.length - 30] ^= 0xff;
    await expect(loadZip(bad, { checkCRC32: true })).rejects.toBeTruthy();
  });

  test('非 zip 数据解析失败', async () => {
    await expect(loadZip(bytesOf('this is not a zip'))).rejects.toBeTruthy();
  });
});

describe('文件名编码', () => {
  test('nameDecoder: utf-8 模式交给 JSZip 默认实现, 其余返回解码函数', () => {
    expect(nameDecoder('utf-8')).toBeUndefined();
    expect(typeof nameDecoder('auto')).toBe('function');
    expect(typeof nameDecoder('gbk')).toBe('function');
    expect(typeof nameDecoder('big5')).toBe('function');
    expect(ZIP_NAME_MODES).toEqual([ 'auto', 'utf-8', 'gbk', 'big5' ]);
  });

  test('auto 模式: 合法 UTF-8 原样, 非法 UTF-8 按 GBK 解码', () => {
    const dec = nameDecoder('auto')!;
    expect(dec(bytesOf('中文目录/文件.txt'))).toBe('中文目录/文件.txt');
    // GBK 编码的 "中文" (D6 D0 CE C4) 不是合法 UTF-8, 应退回 GBK 解码
    expect(dec(new Uint8Array([ 0xd6, 0xd0, 0xce, 0xc4 ]))).toBe('中文');
    // 纯 ASCII 两种编码一致
    expect(dec(bytesOf('ascii.txt'))).toBe('ascii.txt');
  });

  test('gbk 模式始终按 GBK 解码', () => {
    const dec = nameDecoder('gbk')!;
    expect(dec(new Uint8Array([ 0xd6, 0xd0, 0xce, 0xc4 ]))).toBe('中文');
    expect(dec(bytesOf('ascii.txt'))).toBe('ascii.txt');
  });

  test('big5 模式始终按 Big5 解码', () => {
    const dec = nameDecoder('big5')!;
    // Big5 编码的 "中文" (A4 A4 A4 E5)
    expect(dec(new Uint8Array([ 0xa4, 0xa4, 0xa4, 0xe5 ]))).toBe('中文');
    expect(dec(bytesOf('ascii.txt'))).toBe('ascii.txt');
  });
});

describe('条目类型判断', () => {
  test('extOfPath / isImageEntry / imageMimeOf', () => {
    expect(extOfPath('a/b/c.PNG')).toBe('png');
    expect(extOfPath('.gitignore')).toBe('');
    expect(extOfPath('noext')).toBe('');
    expect(isImageEntry('pics/logo.SVG')).toBe(true);
    expect(isImageEntry('a.txt')).toBe(false);
    expect(imageMimeOf('a.jpg')).toBe('image/jpeg');
    expect(imageMimeOf('a.unknown')).toBe('image/png');
  });

  test('isTextEntry 覆盖白名单与无扩展名的常见文本文件', () => {
    expect(isTextEntry('a/b/readme.md')).toBe(true);
    expect(isTextEntry('Makefile')).toBe(true);
    expect(isTextEntry('Dockerfile.prod')).toBe(false);
    expect(isTextEntry('Dockerfile')).toBe(true);
    expect(isTextEntry('.env')).toBe(true);
    expect(isTextEntry('img.png')).toBe(false);
  });

  test('looksLikeText 依据 0 字节与控制字符比例判断', () => {
    expect(looksLikeText(bytesOf('hello\n世界\t!'))).toBe(true);
    expect(looksLikeText(new Uint8Array(0))).toBe(true);
    expect(looksLikeText(new Uint8Array([ 0x89, 0x50, 0x00, 0x4e ]))).toBe(false);
    // 少量控制字符 (比例低于 5%) 仍视为文本
    const mostlyText = new Uint8Array(101).fill(0x41);
    mostlyText[50] = 0x01;
    expect(looksLikeText(mostlyText)).toBe(true);
  });

  test('bytesToBase64 / imageDataUrl', () => {
    expect(bytesToBase64(bytesOf('abc'))).toBe('YWJj');
    expect(imageDataUrl(bytesOf('abc'), 'a.png')).toBe('data:image/png;base64,YWJj');
    expect(imageDataUrl(bytesOf('abc'), 'a.svg')).toBe('data:image/svg+xml;base64,YWJj');
  });
});

describe('压缩级别常量', () => {
  test('LEVELS 为 0-9, 默认级别在 LEVEL_TAGS 中且有说明', () => {
    expect(LEVELS).toEqual([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]);
    expect(DEFAULT_LEVEL).toBe(6);
    expect(LEVEL_TAGS[0]).toBeTruthy();
    expect(LEVEL_TAGS[DEFAULT_LEVEL]).toBe('默认');
  });
});
