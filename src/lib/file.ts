
// 打开文件制作
export const openFile = (files: any, callback :Function) => {
  if(0 === files.length) {
    // notice.error("请选择文件！！！");
    return;
  }
  const reader = new FileReader();
  // 加载失败
  reader.onerror = (err) => {
    console.log(err);
  }
  // 文件加载完毕
  reader.onload = () => {
    callback(reader.result as string)
    // setValue(reader.result as string);
    // setLineCount(calcLineCount(reader.result as string));
  }
  reader.readAsText(files[0]);
}

/**
 * 读取本地文本文件 (打开 .md / .mmd 等纯文本文件时用): 失败时 reject, 由调用方提示
 * @param file input[type=file] / 拖拽得到的 File 对象
 */
export const readTextFile = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('read file failed'));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsText(file);
  });

/** 已是 Markdown 后缀时保留原文件名, 其它后缀 (含 .txt) 统一换成 .md */
const MD_EXT = /\.(md|markdown|mdx|mdown|mkd)$/i;

/**
 * 保存 .md 时用的文件名 (MarkdownEditor / MermaidEditor / MindMap / 即时渲染 Markdown 共用):
 * 去掉路径, 保留已有的 Markdown 后缀 (大小写不变), 其它后缀 (note.txt) 或无后缀时补 .md,
 * 空名字回退 fallback (不传则用 untitled)。
 */
export const mdFileNameOf = (name: string, fallback = 'untitled'): string => {
  const base = (name.split(/[\\/]/).pop() ?? '').trim();
  if (base === '') return `${fallback}.md`;
  if (MD_EXT.test(base)) return base;
  return `${base.replace(/\.[^.]+$/, '') || base}.md`;
};

/** 导出 HTML 时的文件名: 跟随 .md 文件名 (my-note.md -> my-note.html) */
export const htmlFileNameOf = (name: string, fallback = 'untitled'): string =>
  `${mdFileNameOf(name, fallback).replace(/\.[^.]+$/, '')}.html`;

/**
 * 拼一个安全的导出文件名: 路径分隔符与非法字符换成 -, 空白折叠为 -;
 * 清理后为空时用 fallback (不传则用 untitled)。
 */
export const fileNameOf = (base: string, ext: string, fallback = 'untitled'): string => {
  const safe = base.trim().replace(/[\\/:*?"<>|\s]+/g, '-').replace(/^-+|-+$/g, '');
  return `${safe || fallback}.${ext}`;
};