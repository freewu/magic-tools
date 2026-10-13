// Zip 解压: 解析 zip 压缩包, 支持编码切换 / 条目选择 / 在线预览 / 按目录层级解压 (JSZip, 全程本地)
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert, Button, Checkbox, Collapse, Divider, Modal, Progress, Select, Space, Tooltip, message,
} from "antd";
import {
  ClearOutlined, DownloadOutlined, EyeOutlined, FileZipOutlined, InboxOutlined, UnorderedListOutlined,
} from '@ant-design/icons';
import type JSZip from 'jszip';
import { saveBytesBatch, saveBytesFile } from "../../lib/tauri";
import {
  formatSize, imageDataUrl, listEntries, loadZip, readEntry, readEntryText, savedPercent, summarize,
  type ZipEntry, type ZipNameMode,
} from "../../lib/zip";
import { useLocale } from "../../hook/locale-context";
import { im, imT } from './lang';
import {
  MAX_ROWS, MAX_ZIP_SIZE, PREVIEW_TEXT_BYTES, ZIP_EXTRACT_CHANGED, fileNameOf, getDefaultNameMode,
  invertSelection, planExtract, previewKind, pruneSelection, selectAll, setDefaultNameMode, toggleId,
} from './lib';

/** 预览内容 */
interface Preview { title: string; kind: 'text' | 'image'; text?: string; url?: string }

const nameModeOptions = (t: (zh: string) => string) => ([
  { value: 'auto' as ZipNameMode, label: t('自动识别 (推荐)') },
  { value: 'utf-8' as ZipNameMode, label: 'UTF-8' },
  { value: 'gbk' as ZipNameMode, label: t('简体中文 (GBK)') },
  { value: 'big5' as ZipNameMode, label: t('繁体中文 (Big5)') },
]);

const ZipExtract = () => {
  const { locale } = useLocale();
  const t = (zh: string) => im(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => imT(locale, zh, v);

  const [ zipName, setZipName ] = useState('');
  const [ bytes, setBytes ] = useState<Uint8Array | null>(null);
  const [ entries, setEntries ] = useState<ZipEntry[]>([]);
  const [ nameMode, setNameMode ] = useState<ZipNameMode>(getDefaultNameMode());
  const [ selected, setSelected ] = useState<Set<string>>(() => new Set());
  const [ dragging, setDragging ] = useState(false);
  const [ loading, setLoading ] = useState(false);
  const [ busy, setBusy ] = useState(false);
  const [ progress, setProgress ] = useState(0);
  const [ done, setDone ] = useState<number | null>(null);
  const [ preview, setPreview ] = useState<Preview | null>(null);
  const [ notice, contextHolder ] = message.useMessage();

  const inputRef = useRef<HTMLInputElement | null>(null);
  // 已解析的 JSZip 实例 (读取条目内容需要它)
  const zipRef = useRef<JSZip | null>(null);

  // 设置页改默认编码时同步
  useEffect(() => {
    const onChanged = () => setNameMode(getDefaultNameMode());
    window.addEventListener(ZIP_EXTRACT_CHANGED, onChanged);
    return () => window.removeEventListener(ZIP_EXTRACT_CHANGED, onChanged);
  }, []);

  // 载入压缩包 / 切换编码时重新解析 (坏包不改变已有列表)
  useEffect(() => {
    if (bytes === null) { zipRef.current = null; setEntries([]); setSelected(new Set()); return; }
    let alive = true;
    setLoading(true);
    loadZip(bytes, { nameMode })
      .then((zip) => {
        if (!alive) return;
        zipRef.current = zip;
        const list = listEntries(zip);
        setEntries(list);
        // 默认全选文件 (目录不可选), 重新解析后保留仍然存在的选中项
        setSelected((prev) => {
          const kept = pruneSelection(prev, list);
          return kept.size > 0 ? kept : selectAll(list);
        });
      })
      .catch((err: unknown) => {
        if (!alive) return;
        zipRef.current = null;
        setEntries([]);
        setSelected(new Set());
        notice.error(tt('压缩包解析失败: {msg}', { msg: String((err as Error)?.message ?? err) }));
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [ bytes, nameMode ]);

  const stats = useMemo(() => summarize(entries), [ entries ]);
  const selectedStat = useMemo(() => {
    const files = entries.filter((e) => !e.dir && selected.has(e.key));
    return { count: files.length, size: files.reduce((sum, e) => sum + e.size, 0) };
  }, [ entries, selected ]);
  // 超大包只渲染前 MAX_ROWS 行
  const shown = useMemo(() => entries.slice(0, MAX_ROWS), [ entries ]);
  const unsafeCount = useMemo(() => entries.filter((e) => e.unsafe).length, [ entries ]);

  const loadFile = async (file: File) => {
    if (file.size > MAX_ZIP_SIZE) {
      notice.error(tt('压缩包过大 ({size}), 请选择小于 {max} 的文件', {
        size: formatSize(file.size), max: formatSize(MAX_ZIP_SIZE),
      }));
      return;
    }
    try {
      const data = new Uint8Array(await file.arrayBuffer());
      setZipName(file.name);
      setDone(null);
      setBytes(data);
    } catch (err) {
      notice.error(tt('读取压缩包失败: {msg}', { msg: String((err as Error)?.message ?? err) }));
    }
  };

  const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) await loadFile(file);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) await loadFile(file);
  };

  const clear = () => {
    setBytes(null);
    setZipName('');
    setEntries([]);
    setSelected(new Set());
    setDone(null);
    setProgress(0);
    zipRef.current = null;
  };

  const changeNameMode = (v: ZipNameMode) => {
    setNameMode(v);
    setDefaultNameMode(v); // 与设置页共用, 记住上次选择
  };

  const download = async (entry: ZipEntry) => {
    const zip = zipRef.current;
    if (!zip) return;
    try {
      const data = await readEntry(zip, entry);
      await saveBytesFile(fileNameOf(entry.path), data);
    } catch (err) {
      notice.error(tt('读取条目失败: {msg}', { msg: String((err as Error)?.message ?? err) }));
    }
  };

  const openPreview = async (entry: ZipEntry) => {
    const zip = zipRef.current;
    if (!zip) return;
    try {
      if (previewKind(entry) === 'image') {
        const data = await readEntry(zip, entry);
        setPreview({ title: entry.path, kind: 'image', url: imageDataUrl(data, entry.path) });
        return;
      }
      const data = await readEntry(zip, entry);
      if (previewKind(entry, data) !== 'text') {
        notice.warning(t('无法预览二进制文件, 请直接下载后查看'));
        return;
      }
      const text = data.length > PREVIEW_TEXT_BYTES
        ? await readEntryText(zip, entry, PREVIEW_TEXT_BYTES)
        : new TextDecoder('utf-8').decode(data);
      setPreview({
        title: entry.path,
        kind: 'text',
        text: data.length > PREVIEW_TEXT_BYTES
          ? `${text}\n… [${tt('已截断, 仅预览前 {size}', { size: formatSize(PREVIEW_TEXT_BYTES) })}]`
          : text,
      });
    } catch (err) {
      notice.error(tt('读取条目失败: {msg}', { msg: String((err as Error)?.message ?? err) }));
    }
  };

  const extract = async () => {
    const zip = zipRef.current;
    if (!zip) return;
    const plan = planExtract(entries, selected);
    if (plan.items.length === 0) { notice.warning(t('请先选择要解压的文件')); return; }
    setBusy(true);
    setProgress(0);
    setDone(null);
    try {
      const files: { name: string; bytes: Uint8Array }[] = [];
      for (let i = 0; i < plan.items.length; i += 1) {
        const item = plan.items[i];
        const entry = entries.find((e) => e.key === item.id);
        if (!entry) continue;
        files.push({ name: item.rel, bytes: await readEntry(zip, entry) });
        setProgress(Math.round(((i + 1) / plan.items.length) * 80));
      }
      const written = await saveBytesBatch(files, { title: t('解压选中'), dirName: zipName.replace(/\.zip$/i, '') });
      setProgress(100);
      if (written === 0) return; // 用户取消选择文件夹
      setDone(written);
      if (written < files.length) notice.warning(tt('有 {n} 个文件写入失败, 详见控制台', { n: files.length - written }));
      else notice.success(tt('已解压 {n} 个文件', { n: written }));
    } catch (err) {
      notice.error(tt('解压失败: {msg}', { msg: String((err as Error)?.message ?? err) }));
    } finally {
      setBusy(false);
    }
  };

  const dropBorder = dragging ? '#1677ff' : '#d9d9d9';
  const rowTime = (entry: ZipEntry): string =>
    entry.date ? entry.date.toLocaleString(locale === 'en' ? 'en-US' : 'zh-CN', { hour12: false }) : '-';

  return (
    <div style={ { width: '100%' } }>
      { contextHolder }

      {/* 选择 / 拖拽区 */}
      <div
        className="zx-drop"
        onClick={ () => inputRef.current?.click() }
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
        <div>
          { dragging ? t('松开鼠标即可载入压缩包') : t('点击选择压缩包, 或把 .zip 文件拖到这里') }
          { zipName !== '' && <div style={ { color: '#1677ff' } }><b>{ zipName }</b>{ bytes ? ` — ${formatSize(bytes.length)}` : '' }</div> }
        </div>
      </div>

      <Space wrap style={ { margin: '10px 0 4px' } }>
        <Button type="primary" icon={ <FileZipOutlined /> } onClick={ () => inputRef.current?.click() }>{ t('选择压缩包') }</Button>
        <Button danger icon={ <ClearOutlined /> } disabled={ bytes === null } onClick={ clear }>{ t('清空') }</Button>
      </Space>
      <input ref={ inputRef } id="zipLoadInput" type="file" accept=".zip,application/zip" style={ { display: 'none' } } onChange={ onInputChange } />

      { bytes === null && (
        <div className="zx-empty" style={ { color: '#999', padding: '10px 2px' } }>{ t('还没有载入压缩包') }</div>
      ) }

      { bytes !== null && (
        <>
          <Alert
            type={ unsafeCount > 0 ? 'warning' : 'info' }
            showIcon
            style={ { marginTop: 10 } }
            message={ tt('共 {n} 个文件, {d} 个目录, 原始 {src} → 压缩后 {dst} (节省 {pct}%)', {
              n: stats.files, d: stats.dirs, src: formatSize(stats.rawSize),
              dst: formatSize(stats.zippedSize), pct: savedPercent(stats.rawSize, stats.zippedSize),
            }) }
            description={ unsafeCount > 0
              ? tt('含不安全路径 (../ 或绝对路径, 已自动剥离) 的条目: {n} 个', { n: unsafeCount })
              : t('空目录不会单独创建, 解压时按需建立上级目录') }
          />

          <Space wrap size={ 12 } align="center" style={ { marginTop: 10 } }>
            <Space size={ 8 }>
              <span>{ t('文件名编码') }</span>
              <Select
                value={ nameMode }
                style={ { width: 190 } }
                disabled={ loading || busy }
                onChange={ (v: ZipNameMode) => changeNameMode(v) }
                options={ nameModeOptions(t) }
              />
            </Space>
            <span style={ { color: '#999', fontSize: 12 } }>{ t('文件名编码说明: 老版 Windows 压缩工具常按 GBK 写文件名且不带 UTF-8 标志位, 出现乱码时切到 GBK 或自动识别') }</span>
          </Space>

          <Divider dashed plain style={ { margin: '10px 0 6px' } }>
            { t('压缩包内容') }
            { ` · ${tt('已选 {n} 个文件, {size}', { n: selectedStat.count, size: formatSize(selectedStat.size) })}` }
          </Divider>

          <Space wrap style={ { marginBottom: 6 } }>
            <Button size="small" icon={ <UnorderedListOutlined /> } disabled={ busy || loading } onClick={ () => setSelected(selectAll(entries)) }>{ t('全选') }</Button>
            <Button size="small" disabled={ busy || loading } onClick={ () => setSelected((prev) => invertSelection(prev, entries)) }>{ t('反选') }</Button>
            <Button size="small" disabled={ busy || loading } onClick={ () => setSelected(new Set()) }>{ t('取消选择') }</Button>
            <Button
              type="primary"
              size="small"
              loading={ busy }
              disabled={ selectedStat.count === 0 }
              onClick={ extract }
            >{ busy ? t('正在解压…') : t('解压选中') }</Button>
          </Space>

          {/* 条目列表 */}
          <div
            className="zx-list"
            style={ { maxHeight: 340, overflow: 'auto', border: '1px solid rgba(140,140,140,0.25)', borderRadius: 6 } }
          >
            <div
              className="zx-row zx-head"
              style={ {
                display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', color: '#888', fontSize: 12,
                borderBottom: '1px solid rgba(140,140,140,0.25)', position: 'sticky', top: 0,
                background: 'rgba(140,140,140,0.08)',
              } }
            >
              <span style={ { width: 20 } } />
              <span style={ { flex: 1, minWidth: 0 } }>{ t('名称') }</span>
              <span style={ { width: 92, textAlign: 'right' } }>{ t('大小') }</span>
              <span style={ { width: 92, textAlign: 'right' } }>{ t('压缩后') }</span>
              <span style={ { width: 150 } }>{ t('修改时间') }</span>
              <span style={ { width: 72, textAlign: 'right' } }>{ t('下载') }</span>
            </div>

            { shown.map((entry) => (
              <div
                key={ entry.key }
                className={ entry.dir ? 'zx-row zx-row-dir' : 'zx-row' }
                style={ {
                  display: 'flex', alignItems: 'center', gap: 8, padding: '3px 8px',
                  borderBottom: '1px solid rgba(140,140,140,0.15)', fontSize: 13,
                } }
              >
                <Checkbox
                  style={ { width: 20 } }
                  disabled={ entry.dir || busy }
                  checked={ !entry.dir && selected.has(entry.key) }
                  aria-label={ entry.path }
                  onChange={ () => setSelected((prev) => toggleId(prev, entry.key)) }
                />
                <Tooltip title={ entry.path }>
                  <span
                    className="zx-row-path"
                    style={ {
                      flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      color: entry.dir ? '#888' : undefined,
                    } }
                  >
                    { entry.dir ? (entry.path.endsWith('/') ? entry.path : `${entry.path}/`) : entry.path }
                  </span>
                </Tooltip>
                <span className="zx-row-size" style={ { width: 92, textAlign: 'right', color: '#888' } }>
                  { entry.dir ? t('目录') : formatSize(entry.size) }
                </span>
                <span style={ { width: 92, textAlign: 'right', color: '#888' } }>
                  { entry.dir ? '-' : formatSize(entry.compressedSize) }
                </span>
                <span style={ { width: 150, color: '#888', fontSize: 12 } }>{ rowTime(entry) }</span>
                <span style={ { width: 72, textAlign: 'right', whiteSpace: 'nowrap' } }>
                  { !entry.dir && (
                    <Button size="small" type="text" aria-label={ `${t('预览')} ${entry.path}` } icon={ <EyeOutlined /> } onClick={ () => openPreview(entry) } />
                  ) }
                  { !entry.dir && (
                    <Button size="small" type="text" aria-label={ `${t('下载')} ${entry.path}` } icon={ <DownloadOutlined /> } onClick={ () => download(entry) } />
                  ) }
                </span>
              </div>
            ))}
          </div>

          { entries.length > MAX_ROWS && (
            <div style={ { color: '#999', fontSize: 12, margin: '4px 2px 0' } }>{ tt('只显示前 {n} 个条目 (不影响解压整包)', { n: MAX_ROWS }) }</div>
          ) }

          { busy && <Progress percent={ progress } style={ { maxWidth: 420, marginTop: 10 } } /> }

          { done !== null && (
            <Alert
              type="success"
              showIcon
              className="zx-result"
              style={ { marginTop: 12 } }
              message={ tt('解压完成: 已写入 {n} 个文件', { n: done }) }
            />
          ) }
        </>
      ) }

      <Modal
        open={ preview !== null }
        title={ preview?.title }
        footer={ null }
        width={ 760 }
        onCancel={ () => setPreview(null) }
      >
        { preview?.kind === 'image'
          ? <img alt={ preview.title } src={ preview.url } style={ { maxWidth: '100%' } } />
          : <pre className="zx-preview" style={ { maxHeight: 460, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' } }>{ preview?.text }</pre> }
      </Modal>

      <Collapse
        ghost
        style={ { marginTop: 14 } }
        items={ [ {
          key: 'intro',
          label: t('Zip 解压说明'),
          children: (
            <div style={ { color: '#888', lineHeight: 1.9 } }>
              <p>{ t('解析并解压 zip 压缩包, 全部在本地浏览器 / WebView 内完成 (JSZip), 压缩包不会上传到任何服务器。') }</p>
              <p>{ t('桌面版点「解压选中」后选择一个目标文件夹, 会按包内目录层级写入文件; Web 演示版会逐个触发下载 (浏览器会拍平层级, 只保留文件名)。') }</p>
              <p>{ t('包内路径中的 ../ 与绝对路径会被自动剥离 (防 zip-slip), 不会写到目标目录之外。') }</p>
              <p>{ t('文本与图片条目支持在线预览, 其余类型请下载后查看; 超大压缩包需注意内存占用。') }</p>
            </div>
          ),
        } ] }
      />
    </div>
  );
};

export default ZipExtract;
