// 打开 / 保存文件相关的共享辅助 (各工具打开 .md、导出 .md / .html 时共用)
import { fileNameOf, htmlFileNameOf, mdFileNameOf, readTextFile } from './file';

describe('readTextFile', () => {
  it('读取文本文件内容', async () => {
    const file = new File([ '# 标题\n正文' ], 'note.md', { type: 'text/markdown' });
    await expect(readTextFile(file)).resolves.toBe('# 标题\n正文');
  });

  it('读取失败 (文件已被移除) 时 reject', async () => {
    const file = new File([ 'x' ], 'gone.md', { type: 'text/markdown' });
    const reader = { readAsText: jest.fn(), error: new Error('gone'), result: null } as unknown as FileReader;
    const spy = jest.spyOn(globalThis, 'FileReader').mockImplementation(() => {
      setTimeout(() => reader.onerror?.(new Event('error') as unknown as ProgressEvent<FileReader>), 0);
      return reader;
    });
    await expect(readTextFile(file)).rejects.toThrow('gone');
    spy.mockRestore();
  });
});

describe('fileNameOf', () => {
  it('非法字符与空白换成 -, 空名字回退 fallback', () => {
    expect(fileNameOf('我的 大纲', 'md')).toBe('我的-大纲.md');
    expect(fileNameOf('a/b:c*d?e"f<g>h|i', 'txt')).toBe('a-b-c-d-e-f-g-h-i.txt');
    expect(fileNameOf('   ', 'md')).toBe('untitled.md');
    expect(fileNameOf('   ', 'md', 'markdown')).toBe('markdown.md');
  });
});

describe('mdFileNameOf', () => {
  it('保留已有的 Markdown 后缀 (大小写不变)', () => {
    expect(mdFileNameOf('notes.md')).toBe('notes.md');
    expect(mdFileNameOf('notes.markdown')).toBe('notes.markdown');
    expect(mdFileNameOf('notes.mkd')).toBe('notes.mkd');
    expect(mdFileNameOf('说明.MD')).toBe('说明.MD');
  });

  it('其它后缀 / 无后缀补 .md, 多级后缀只换最后一段', () => {
    expect(mdFileNameOf('notes.txt')).toBe('notes.md');
    expect(mdFileNameOf('notes')).toBe('notes.md');
    expect(mdFileNameOf('report.final.txt')).toBe('report.final.md');
  });

  it('去掉路径, 空名字回退 fallback (.md)', () => {
    expect(mdFileNameOf('C:\\docs\\sub/我的大纲.md')).toBe('我的大纲.md');
    expect(mdFileNameOf('/tmp/a/b')).toBe('b.md');
    expect(mdFileNameOf('')).toBe('untitled.md');
    expect(mdFileNameOf('   ')).toBe('untitled.md');
    expect(mdFileNameOf('a/b/', 'markdown')).toBe('markdown.md');
  });
});

describe('htmlFileNameOf', () => {
  it('跟随 .md 的文件名 (my-note.md -> my-note.html)', () => {
    expect(htmlFileNameOf('my-note.md')).toBe('my-note.html');
    expect(htmlFileNameOf('my-note.markdown')).toBe('my-note.html');
    expect(htmlFileNameOf('note.txt')).toBe('note.html');
    expect(htmlFileNameOf('C:\\docs\\报告.md')).toBe('报告.html');
    expect(htmlFileNameOf('   ', 'markdown')).toBe('markdown.html');
  });
});
