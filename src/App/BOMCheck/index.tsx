// BOM 检查: 检查文件开头是否含 BOM (字节序标记), 可去除 BOM 或添加 / 替换 BOM 后下载
import { useMemo, useRef, useState } from "react";
import { Alert, Button, Collapse, Divider, Input, Select, Space, message } from "antd";
import { copyTextToClipboard } from "../../lib";
import { saveBytesFile } from "../../lib/tauri";
import { useLocale } from "../../hook/locale-context";
import { tr, trTpl } from "../../i18n/lang";
import bcLang from "./lang";
import { BOM_LABELS, bomLabel, formatDateTime, hexOf } from "./data";
import {
  BOM_KEYS, MAX_FILE_SIZE, addBom, bomBytes, bomSize, detectBom, detectBoms, formatBytes,
  getDefaultBom, guessEncoding, hexPreview, previewText, stripBomAs,
  type BomKey, type EncKey,
} from "./lib";

const { TextArea } = Input;

/** 已载入的文件内容 */
interface PickedFile {
  name: string;
  size: number;
  lastModified: number;
  bytes: Uint8Array;
}

/** 结果行 (模块级定义, 避免每次渲染重建组件) */
const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={ { display: 'flex', gap: 10, alignItems: 'baseline', margin: '6px 0' } }>
    <span style={ { width: 96, flex: 'none', color: '#888', textAlign: 'right' } }>{ label }</span>
    <span style={ { flex: 1, minWidth: 0, wordBreak: 'break-all' } }>{ children }</span>
  </div>
);

const TIP_KEYS = [ 'tip_1', 'tip_2', 'tip_3', 'tip_4', 'tip_5' ];

const BOMCheck = () => {
  const { locale } = useLocale();
  const t = (key: string, fallback: string) => tr(bcLang, locale, key, fallback);
  const tpl = (key: string, vars: Record<string, string | number>, fallback: string) =>
    trTpl(bcLang, locale, key, vars, fallback);

  const inputRef = useRef<HTMLInputElement>(null);
  const [ file, setFile ] = useState<PickedFile | null>(null);
  // 当前 BOM 类型: 载入文件时跟随识别结果, 也可手动切换 (去除 / 添加 都用它)
  const [ bomKey, setBomKey ] = useState<BomKey>(getDefaultBom());
  const [ dragging, setDragging ] = useState(false);
  const [ notice, contextHolder ] = message.useMessage();

  const detected = useMemo(() => (file ? detectBom(file.bytes) : null), [ file ]);
  const allBoms = useMemo(() => (file ? detectBoms(file.bytes) : []), [ file ]);
  // 无 BOM 时按字节特征推测编码 (仅用于展示与文本预览)
  const guessed = useMemo(
    () => (file !== null && detected === null ? guessEncoding(file.bytes) : null),
    [ file, detected ],
  );
  const encKey: EncKey | null = detected ?? (guessed !== null && guessed !== 'binary' ? guessed : null);
  const preview = useMemo(() => {
    if (file === null || encKey === null) return '';
    if (file.bytes.length === 0) return '';
    return previewText(file.bytes, encKey);
  }, [ file, encKey ]);

  const openPicker = () => inputRef.current?.click();

  const loadFile = async (f: File) => {
    if (f.size > MAX_FILE_SIZE) {
      notice.error(tpl('e_tooLarge', { size: formatBytes(f.size), max: formatBytes(MAX_FILE_SIZE) }, '文件过大'));
      return;
    }
    try {
      const bytes = new Uint8Array(await f.arrayBuffer());
      setFile({ name: f.name, size: f.size, lastModified: f.lastModified, bytes });
      // 识别到 BOM 时下拉框跟随实际类型, 否则用设置里的默认类型
      setBomKey(detectBom(bytes) ?? getDefaultBom());
    } catch (err) {
      notice.error(tpl('e_readFail', { msg: String((err as Error)?.message ?? err) }, '读取文件失败'));
    }
  };

  const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ?? [];
    if (files.length > 0) await loadFile(files[0]);
    // 清空 value, 便于连续选择同一个文件
    e.target.value = '';
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = e.dataTransfer?.files ?? [];
    if (files.length > 0) await loadFile(files[0]);
  };

  const clear = () => {
    setFile(null);
    setBomKey(getDefaultBom());
  };

  /** 去除 BOM 并下载: 选中的类型存在则按其长度剥离 (可区分 UTF-16 LE / UTF-32 LE), 否则按识别结果 */
  const removeAndDownload = async () => {
    if (file === null) return notice.warning(t('e_needFile', '请先选择文件'));
    const useKey = allBoms.includes(bomKey) ? bomKey : allBoms[0];
    if (useKey === undefined) return notice.warning(t('e_noBom', '当前文件没有检测到 BOM, 无需去除'));
    const out = stripBomAs(file.bytes, useKey);
    const ext = file.name.match(/\.([^.\\/]+)$/)?.[1];
    const ok = await saveBytesFile(file.name, out, {
      title: t('saveRemoveTitle', '保存已去除 BOM 的文件'),
      filterName: t('filterFile', '文件'),
      extensions: ext ? [ ext ] : [],
    });
    if (ok) {
      notice.success(tpl(
        'okRemove',
        { name: file.name, num: file.bytes.length - out.length },
        `已下载去除 BOM 的文件 (减少 ${file.bytes.length - out.length} 字节)`,
      ));
    }
  };

  /** 添加 / 替换 BOM 并下载 */
  const addAndDownload = async () => {
    if (file === null) return notice.warning(t('e_needFile', '请先选择文件'));
    const out = addBom(file.bytes, bomKey);
    const before = bomSize(detected);
    const after = bomSize(bomKey);
    const ext = file.name.match(/\.([^.\\/]+)$/)?.[1];
    const ok = await saveBytesFile(file.name, out, {
      title: t('saveAddTitle', '保存已添加 BOM 的文件'),
      filterName: t('filterFile', '文件'),
      extensions: ext ? [ ext ] : [],
    });
    if (!ok) return;
    if (detected === null) {
      notice.success(tpl(
        'okAdd',
        { name: file.name, type: BOM_LABELS[bomKey], num: out.length - file.bytes.length },
        `已下载添加 BOM 的文件 (${BOM_LABELS[bomKey]})`,
      ));
    } else {
      notice.success(tpl(
        'okReplace',
        { name: file.name, from: BOM_LABELS[detected], type: BOM_LABELS[bomKey], num: before, num2: after },
        '已下载替换 BOM 的文件',
      ));
    }
  };

  const copyHead = async () => {
    if (file === null) return;
    await copyTextToClipboard(hexPreview(file.bytes));
    notice.success(t('copyOk', '复制到粘贴板成功！！！'));
  };

  const bomOptions = BOM_KEYS.map((k) => ({ value: k, label: bomLabel(k) }));
  const dropBorder = dragging ? '#1677ff' : '#d9d9d9';

  return (
    <div>
      {contextHolder}

      <Space wrap style={ { marginBottom: 6 } }>
        <Button type="primary" onClick={ openPicker }>{ t('pickFile', '选择文件') }</Button>
        <Button
          onClick={ clear }
          disabled={ file === null }
          style={ { backgroundColor: file === null ? undefined : '#dc3545', color: file === null ? undefined : '#fff' } }
        >{ t('clear', '清除') }</Button>
        <input
          ref={ inputRef }
          id="bomFileInput"
          type="file"
          style={ { display: 'none' } }
          onChange={ onInputChange }
        />
      </Space>

      {/* 选择 / 拖拽区 */}
      <div
        onClick={ openPicker }
        onDragOver={ (e) => { e.preventDefault(); setDragging(true); } }
        onDragLeave={ () => setDragging(false) }
        onDrop={ onDrop }
        style={ {
          margin: '6px 0 10px 0',
          padding: '12px 16px',
          border: `1px dashed ${dropBorder}`,
          borderRadius: 6,
          background: dragging ? 'rgba(22,119,255,0.06)' : 'transparent',
          cursor: 'pointer',
          color: '#888',
          lineHeight: 1.9,
        } }
      >
        { file === null
          ? (dragging ? t('dropActive', '松开鼠标即可载入文件') : t('dropHint', '点击选择文件, 或把文件拖到这里'))
          : <span><b style={ { color: '#1677ff' } }>{ file.name }</b> — { formatBytes(file.size) }</span> }
      </div>

      { file !== null && (
        <>
          <Alert
            type={ detected === null ? 'success' : 'warning' }
            showIcon
            message={ detected === null ? t('noBom', '未检测到 BOM') : t('hasBom', '检测到 BOM') }
            description={ detected === null ? t('noBomTip', '') : t('hasBomTip', '') }
            style={ { marginBottom: 10 } }
          />

          <Divider dashed plain style={ { margin: '6px 0' } }>{ t('fileTitle', '文件信息') }</Divider>
          <Row label={ t('fileName', '文件名') }>{ file.name }</Row>
          <Row label={ t('fileSize', '文件大小') }>
            { detected === null
              ? formatBytes(file.size)
              : tpl('fileSizeWithBom', { num: bomSize(detected) }, formatBytes(file.size)) }
          </Row>
          <Row label={ t('modifiedAt', '修改时间') }>{ formatDateTime(file.lastModified) }</Row>
          <Row label={ t('headBytes', '首部字节') }>
            <span
              onClick={ copyHead }
              title={ t('copyHead', '点击复制首部字节') }
              style={ { cursor: 'copy', fontFamily: 'monospace' } }
            >{ hexPreview(file.bytes) }</span>
          </Row>

          <Divider dashed plain style={ { margin: '10px 0 6px 0' } }>{ t('resultTitle', '检查结果') }</Divider>
          <Row label={ t('bomType', 'BOM 类型') }>
            { detected === null ? '—' : <span style={ { color: '#fa8c16', fontWeight: 600 } }>{ BOM_LABELS[detected] }</span> }
          </Row>
          { detected !== null && (
            <>
              <Row label={ t('bomBytesLabel', 'BOM 字节') }>
                <span style={ { fontFamily: 'monospace' } }>{ hexOf(bomBytes(detected)) }</span>
              </Row>
              <Row label={ t('bomSizeLabel', 'BOM 长度') }>
                { tpl('bytesUnit', { num: bomSize(detected) }, `${bomSize(detected)} 字节`) }
              </Row>
              { allBoms.length > 1 && (
                <Row label="">{ tpl(
                  'alsoMatch',
                  { list: allBoms.map((k) => BOM_LABELS[k]).join(' / ') },
                  '',
                ) }</Row>
              ) }
            </>
          ) }
          { guessed !== null && (
            <Row label={ t('guessTitle', '编码推测') }>
              { t('guess_' + guessed, guessed) }
              { t('guessTip_' + guessed, '') !== '' && (
                <span style={ { color: '#999' } }> — { t('guessTip_' + guessed, '') }</span>
              ) }
            </Row>
          ) }

          <Divider dashed plain style={ { margin: '10px 0 6px 0' } }>{ t('opTitle', '处理并下载') }</Divider>
          <Space wrap>
            <span style={ { color: '#888' } }>{ t('bomTypeLabel', 'BOM 类型') }</span>
            <Select
              value={ bomKey }
              style={ { width: 230 } }
              options={ bomOptions }
              onChange={ (v: BomKey) => setBomKey(v) }
            />
            <Button
              onClick={ removeAndDownload }
              disabled={ detected === null }
              style={ { backgroundColor: detected === null ? undefined : '#28a745', color: detected === null ? undefined : '#fff' } }
            >{ t('removeBtn', '去除 BOM 并下载') }</Button>
            { detected === null && <span style={ { color: '#999' } }>{ t('removeDisabled', '当前文件没有 BOM, 无需去除') }</span> }
            <Button
              onClick={ addAndDownload }
              style={ { backgroundColor: '#007bff', color: '#fff' } }
            >{ t('addBtn', '添加 / 替换 BOM 并下载') }</Button>
          </Space>

          <Divider dashed plain style={ { margin: '12px 0 6px 0' } }>{ t('previewTitle', '文本预览') }</Divider>
          { file.bytes.length === 0 ? (
            <div style={ { color: '#888' } }>{ t('previewEmpty', '文件内容为空, 没有可预览的文本') }</div>
          ) : guessed === 'binary' ? (
            <div style={ { color: '#888' } }>{ t('previewBinary', '二进制文件, 不显示文本预览') }</div>
          ) : (
            <TextArea
              readOnly
              value={ preview }
              autoSize={ { minRows: 6, maxRows: 12 } }
              style={ { fontFamily: 'monospace' } }
            />
          ) }
        </>
      ) }

      <Collapse
        ghost
        style={ { marginTop: 12 } }
        items={ [{
          key: 'tips',
          label: t('tips', '使用说明'),
          children: (
            <ul style={ { margin: 0, paddingLeft: 20, color: '#888', lineHeight: 1.9 } }>
              { TIP_KEYS.map((k) => <li key={ k }>{ t(k, '') }</li>) }
            </ul>
          ),
        }] }
      />
    </div>
  );
};

export default BOMCheck;
