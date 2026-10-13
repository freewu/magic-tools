// Zip 压缩: 把多个文件 / 文件夹打包为一个 zip (JSZip, 全程本地, 不联网)
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Checkbox, Collapse, Divider, Input, Progress, Select, Space, Tooltip, message } from "antd";
import {
  ClearOutlined, DeleteOutlined, FileZipOutlined, FolderOpenOutlined, InboxOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import { saveBytesFile } from "../../lib/tauri";
import {
  LEVELS, LEVEL_TAGS, buildZip, formatSize, savedPercent, suggestZipName, zipNameOf,
  type ZipLevel,
} from "../../lib/zip";
import { useLocale } from "../../hook/locale-context";
import { im, imT } from './lang';
import {
  ZIP_COMPRESS_CHANGED, filesFromDataTransfer, finalPaths, getDefaultKeepPath, getDefaultLevel,
  mergeFiles, readFiles, setDefaultKeepPath, setDefaultLevel, summarizeFiles, type PickedFile,
} from './lib';

/** 单次最多读入的文件数 (拖入超大目录时保护界面) */
const MAX_FILES = 2000;

/** 打包结果 */
interface ZipResult { name: string; count: number; src: number; dst: number }

const ZipCompress = () => {
  const { locale } = useLocale();
  const t = (zh: string) => im(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => imT(locale, zh, v);

  const [ files, setFiles ] = useState<PickedFile[]>([]);
  const [ level, setLevel ] = useState<ZipLevel>(getDefaultLevel());
  const [ keepPath, setKeepPath ] = useState<boolean>(getDefaultKeepPath());
  const [ name, setName ] = useState('');
  // 用户手动改过文件名后, 不再随文件列表自动推导
  const [ nameTouched, setNameTouched ] = useState(false);
  const [ dragging, setDragging ] = useState(false);
  const [ busy, setBusy ] = useState(false);
  const [ progress, setProgress ] = useState(0);
  const [ result, setResult ] = useState<ZipResult | null>(null);
  const [ notice, contextHolder ] = message.useMessage();

  const fileRef = useRef<HTMLInputElement | null>(null);
  const dirRef = useRef<HTMLInputElement | null>(null);

  // 目录选择只能通过非标准属性 webkitdirectory 打开 (React 不认这个属性, 用 setAttribute 补上)
  useEffect(() => {
    dirRef.current?.setAttribute('webkitdirectory', '');
  }, []);

  // 设置页改默认值时同步 (已打开的页面不重挂载)
  useEffect(() => {
    const onChanged = () => {
      setLevel(getDefaultLevel());
      setKeepPath(getDefaultKeepPath());
    };
    window.addEventListener(ZIP_COMPRESS_CHANGED, onChanged);
    return () => window.removeEventListener(ZIP_COMPRESS_CHANGED, onChanged);
  }, []);

  const stats = useMemo(() => summarizeFiles(files), [ files ]);
  // 未手动改名时跟随文件列表推导默认包名
  const autoName = useMemo(() => (files.length > 0 ? suggestZipName(files.map((f) => f.path)) : ''), [ files ]);
  const shownName = nameTouched ? name : (autoName || name);

  const addPicked = async (picked: File[]) => {
    if (picked.length === 0) {
      notice.warning(t('引入的文件列表里没有文件'));
      return;
    }
    try {
      const incoming = await readFiles(picked, MAX_FILES);
      setFiles((prev) => mergeFiles(prev, incoming));
      setResult(null);
      notice.success(tt('已添加 {n} 个文件', { n: incoming.length }));
      if (picked.length > MAX_FILES) notice.warning(tt('文件太多, 只添加了前 {n} 个', { n: MAX_FILES }));
    } catch (err) {
      notice.error(tt('读取文件失败: {msg}', { msg: String((err as Error)?.message ?? err) }));
    }
  };

  const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = ''; // 清空 value, 便于连续选择同一批文件
    await addPicked(picked);
  };

  const openFiles = () => fileRef.current?.click();
  const openDir = () => dirRef.current?.click();

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    await addPicked(await filesFromDataTransfer(e.dataTransfer));
  };

  const removeAt = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setResult(null);
  };

  const clear = () => {
    setFiles([]);
    setResult(null);
    setName('');
    setNameTouched(false);
  };

  const changeLevel = (v: ZipLevel) => {
    setLevel(v);
    setDefaultLevel(v); // 与设置页共用, 记住上次选择
  };

  const changeKeepPath = (v: boolean) => {
    setKeepPath(v);
    setDefaultKeepPath(v);
  };

  const doZip = async () => {
    if (files.length === 0) { notice.warning(t('请先添加要打包的文件')); return; }
    setBusy(true);
    setProgress(0);
    setResult(null);
    try {
      const paths = finalPaths(files.map((f) => f.path), keepPath);
      const bytes = await buildZip(
        files.map((f, i) => ({ path: paths[i], bytes: f.bytes, date: new Date(f.lastModified) })),
        level,
        (percent) => setProgress(Math.round(percent)),
      );
      const outName = zipNameOf(shownName);
      const ok = await saveBytesFile(outName, bytes, {
        title: t('输出文件名'),
        filterName: 'Zip',
        extensions: [ 'zip' ],
      });
      if (!ok) return; // 用户取消保存
      setResult({ name: outName, count: files.length, src: stats.total, dst: bytes.length });
    } catch (err) {
      notice.error(tt('打包失败: {msg}', { msg: String((err as Error)?.message ?? err) }));
    } finally {
      setBusy(false);
    }
  };

  const levelOptions = LEVELS.map((lv) => {
    const tag = LEVEL_TAGS[lv];
    return { value: lv, label: tag ? `${lv} · ${t(tag)}` : String(lv) };
  });

  const dropBorder = dragging ? '#1677ff' : '#d9d9d9';

  return (
    <div style={ { maxWidth: 900 } }>
      { contextHolder }

      {/* 选择 / 拖拽区 */}
      <div
        className="zc-drop"
        onClick={ openFiles }
        onDragOver={ (e) => { e.preventDefault(); setDragging(true); } }
        onDragEnter={ (e) => { e.preventDefault(); setDragging(true); } }
        onDragLeave={ () => setDragging(false) }
        onDrop={ onDrop }
        style={ {
          border: `1px dashed ${dropBorder}`,
          borderRadius: 8,
          padding: '18px 12px',
          textAlign: 'center',
          background: dragging ? 'rgba(22,119,255,0.06)' : 'transparent',
          cursor: 'pointer',
          color: '#888',
          lineHeight: 1.9,
        } }
      >
        <InboxOutlined style={ { fontSize: 28, color: dragging ? '#1677ff' : '#bfbfbf' } } />
        <div>{ dragging ? t('松开鼠标即可添加文件') : t('点击选择文件, 或把文件 / 文件夹拖到这里') }</div>
      </div>

      <Space wrap style={ { margin: '10px 0 4px' } }>
        <Button type="primary" icon={ <FolderOpenOutlined /> } onClick={ (e) => { e.stopPropagation(); openFiles(); } }>
          { t('选择文件') }
        </Button>
        <Button icon={ <FileZipOutlined /> } onClick={ openDir }>{ t('选择文件夹') }</Button>
        <Button
          danger
          icon={ <ClearOutlined /> }
          disabled={ files.length === 0 }
          onClick={ clear }
        >{ t('清空') }</Button>
      </Space>

      <input ref={ fileRef } id="zipFileInput" type="file" multiple style={ { display: 'none' } } onChange={ onInputChange } />
      <input ref={ dirRef } id="zipDirInput" type="file" multiple style={ { display: 'none' } } onChange={ onInputChange } />

      {/* 待打包文件列表 */}
      <Divider dashed plain style={ { margin: '10px 0 6px' } }>
        { t('待打包文件') }
        { files.length > 0 && ` · ${tt('共 {n} 个文件, {size}', { n: stats.count, size: formatSize(stats.total) })}` }
      </Divider>

      { files.length === 0
        ? <div className="zc-empty" style={ { color: '#999', padding: '10px 2px' } }>{ t('还没有添加文件') }</div>
        : (
          <div
            className="zc-list"
            style={ { maxHeight: 260, overflow: 'auto', border: '1px solid rgba(140,140,140,0.25)', borderRadius: 6 } }
          >
            { files.map((f) => (
              <div
                key={ f.id }
                className="zc-row"
                style={ {
                  display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px',
                  borderBottom: '1px solid rgba(140,140,140,0.15)',
                } }
              >
                <Tooltip title={ f.path }>
                  <span className="zc-row-path" style={ { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }>
                    { f.path }
                  </span>
                </Tooltip>
                <span className="zc-row-size" style={ { color: '#888', flex: 'none' } }>{ formatSize(f.size) }</span>
                <Button
                  size="small"
                  type="text"
                  danger
                  aria-label={ t('删除') }
                  icon={ <DeleteOutlined /> }
                  onClick={ () => removeAt(f.id) }
                />
              </div>
            ))}
          </div>
        ) }

      { files.length > 0 && (
        <div style={ { color: '#999', fontSize: 12, margin: '4px 2px 0' } }>{ t('重名文件会自动加序号 (不会互相覆盖)') }</div>
      ) }

      {/* 打包选项 */}
      <Divider dashed plain style={ { margin: '12px 0 8px' } }>{ t('压缩级别') }</Divider>
      <Space wrap size={ 16 } align="center">
        <Space size={ 8 }>
          <span>{ t('压缩级别') }</span>
          <Select
            value={ level }
            style={ { width: 190 } }
            disabled={ busy }
            onChange={ (v: ZipLevel) => changeLevel(v) }
            options={ levelOptions }
          />
          <span style={ { color: '#999', fontSize: 12 } }>{ t('压缩级别说明: 0 仅存储 (最快, 包最大), 6 默认, 9 体积最小但最慢; 已压缩过的文件 (jpg / mp4 / zip) 再压缩收益很小') }</span>
        </Space>
      </Space>

      <Space wrap size={ 16 } align="center" style={ { marginTop: 10 } }>
        <Space size={ 8 }>
          <span>{ t('输出文件名') }</span>
          <Input
            style={ { width: 220 } }
            value={ shownName }
            disabled={ busy }
            placeholder="archive.zip"
            onChange={ (e) => { setName(e.target.value); setNameTouched(true); } }
          />
        </Space>
        <Checkbox
          checked={ keepPath }
          disabled={ busy }
          onChange={ (e) => changeKeepPath(e.target.checked) }
        >{ t('保留文件夹结构') }</Checkbox>
      </Space>

      <Space wrap style={ { marginTop: 12 } }>
        <Button
          type="primary"
          icon={ <ThunderboltOutlined /> }
          loading={ busy }
          disabled={ files.length === 0 }
          onClick={ doZip }
        >{ busy ? t('正在打包…') : t('打包并下载') }</Button>
      </Space>

      { busy && <Progress percent={ progress } style={ { maxWidth: 420, marginTop: 10 } } /> }

      { result && (
        <Alert
          type="success"
          showIcon
          className="zc-result"
          style={ { marginTop: 12 } }
          message={ tt('压缩包已生成: {name} ({n} 个文件, {src} → {dst}, 节省 {pct}%)', {
            name: result.name,
            n: result.count,
            src: formatSize(result.src),
            dst: formatSize(result.dst),
            pct: savedPercent(result.src, result.dst),
          }) }
        />
      ) }

      <Collapse
        ghost
        style={ { marginTop: 14 } }
        items={ [ {
          key: 'intro',
          label: t('Zip 压缩说明'),
          children: (
            <div style={ { color: '#888', lineHeight: 1.9 } }>
              <p>{ t('把多个文件 / 文件夹打包成一个 zip, 全部在本地浏览器 / WebView 内完成 (JSZip), 文件不会上传到任何服务器。') }</p>
              <p>{ t('拖入文件夹会保留目录层级 (包内路径与源目录一致); 取消勾选「保留文件夹结构」则只保留文件名, 重名自动加序号。') }</p>
              <p>{ t('包内文件名按 UTF-8 写入并带 UTF-8 标志位, Windows 资源管理器 / macOS 解压都不会乱码。') }</p>
              <p>{ t('整个压缩包在内存中生成, 超大文件 (单个数百 MB 以上) 需注意内存占用。') }</p>
            </div>
          ),
        } ] }
      />
    </div>
  );
};

export default ZipCompress;
