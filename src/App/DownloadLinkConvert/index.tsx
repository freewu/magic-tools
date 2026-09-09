import { useRef, useState } from "react";
import { Input, Select, Tabs, message } from "antd";
import { copyTextToClipboard } from "./../../lib";
import { batchConvert, convertDownloadLink, DOWNLOAD_FORMATS, type DownloadLinks, type DownloadError, type DownloadFormat } from "./lib";
import { useLocale } from "../../hook/locale-context";
import { tr, trTpl } from "../../i18n/lang";
import dlLang from "./lang";
import type { LocaleId } from "../../i18n/lang";

const { TextArea } = Input;

interface RowItem { kind: DownloadFormat; label: string; color: string; value: string }

const toRows = (r: DownloadLinks): RowItem[] => [
  { kind: 'real', label: '真实地址', color: '#1890ff', value: r.real },
  { kind: 'thunder', label: '迅雷地址', color: '#13c2c2', value: r.thunder },
  { kind: 'qqdl', label: '快车地址', color: '#722ed1', value: r.qqdl },
  { kind: 'qdl', label: '旋风地址', color: '#52c41a', value: r.qdl },
];

// 把带 code 的下载错误按当前 locale 渲染成文案 (LINE 需展开内层 code)
const dlErrText = (err: Error, locale: LocaleId, t: (k: string, f: string) => string): string => {
  const e = err as DownloadError;
  const base = (code: string, extra: string): string => {
    switch (code) {
      case 'EMPTY': case 'B64': case 'THUNDER': case 'UNREC':
        return t('e_' + code, err.message);
      case 'REAL':
        return trTpl(dlLang, locale, 'e_REAL', { url: extra }, err.message);
      default:
        return t('e_UNKNOWN', '未知错误');
    }
  };
  if (e.code === 'LINE') {
    let n = 0, code = '', extra = '';
    try { const o = JSON.parse(e.extra || '{}'); n = o.n; code = o.code; extra = o.extra; } catch (_) { /* ignore */ }
    const innerMsg = base(code, extra);
    return trTpl(dlLang, locale, 'e_LINE', { n, msg: innerMsg }, err.message);
  }
  return base(e.code || '', e.extra || '');
};

// ---------- 单个转换 ----------
const SinglePanel: React.FC = () => {
  const { locale } = useLocale();
  const t = (key: string, fallback: string) => tr(dlLang, locale, key, fallback);
  const tpl = (key: string, vars: Record<string, string | number>, fallback: string) => trTpl(dlLang, locale, key, vars, fallback);
  const [ rows, setRows ] = useState<RowItem[]>([]);
  const [ error, setError ] = useState<DownloadError | null>(null);
  const [ notEmpty, setNotEmpty ] = useState(false);
  const timeRef = useRef<number | null>(null);

  const copy = async (item: RowItem) => {
    await copyTextToClipboard(item.value);
    message.success(tpl('copied', { label: t('fmt_' + item.kind, item.label) }, '已复制' + item.label + '到剪贴板'));
  };

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNotEmpty(value.trim().length > 0);
    try {
      const result = convertDownloadLink(value);
      setRows(toRows(result));
      setError(null);
    } catch (err) {
      setRows([]);
      setError(err as DownloadError);
      if (timeRef.current) window.clearTimeout(timeRef.current);
      timeRef.current = window.setTimeout(() => { if (error) setError(null); }, 4000);
    }
  };

  const clear = () => {
    setRows([]);
    setError(null);
    setNotEmpty(false);
  };

  return (
    <div>
      <TextArea
        rows={ 4 }
        placeholder={ t('phSingle', '在此粘贴下载地址, 自动识别并转换。支持:\n- 真实地址 http(s):// 或 ftp://\n- 迅雷地址 thunder://\n- 快车地址 qqdl://\n- 旋风地址 qdl://') }
        onChange={ onChange }
      />
      <div style={ { margin: '8px 0 4px', display: 'flex', justifyContent: 'flex-end' } }>
        { notEmpty && <span onClick={ clear } style={ { color: '#999', cursor: 'pointer', fontSize: 12 } }>{t('clearSmall', '清空')}</span> }
      </div>
      { error && <div style={ { color: '#ff4d4f', margin: '4px 0' } }>⚠ { dlErrText(error, locale, t) }</div> }
      { rows.map((item) => (
        <div key={ item.kind } style={ { display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0' } }>
          <span style={ { width: 76, flex: 'none', color: item.color, fontWeight: 600, textAlign: 'right' } }>{ t('fmt_' + item.kind, item.label) }</span>
          <Input
            readOnly
            value={ item.value }
            style={ { flex: 1, minWidth: 0, cursor: 'copy' } }
            onFocus={ (e) => e.target.select() }
            onClick={ () => { copy(item); } }
            title={ t('clickCopy', '点击复制到剪贴板') }
          />
        </div>
      )) }
    </div>
  );
}

// ---------- 批量转换 ----------
const BatchPanel: React.FC = () => {
  const { locale } = useLocale();
  const t = (key: string, fallback: string) => tr(dlLang, locale, key, fallback);
  const tpl = (key: string, vars: Record<string, string | number>, fallback: string) => trTpl(dlLang, locale, key, vars, fallback);
  const [ input, setInput ] = useState('');
  const [ format, setFormat ] = useState<DownloadFormat>('thunder');
  const [ output, setOutput ] = useState('');
  const [ error, setError ] = useState<DownloadError | null>(null);

  const run = (text: string, fmt: DownloadFormat) => {
    try {
      setOutput(batchConvert(text, fmt));
      setError(null);
    } catch (err) {
      setOutput('');
      setError(err as DownloadError);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setInput(v);
    run(v, format);
  };

  const onFormatChange = (v: DownloadFormat) => {
    setFormat(v);
    run(input, v);
  };

  const copyAll = async () => {
    if (!output) return;
    await copyTextToClipboard(output);
    message.success(tpl('copyAll', { n: output.split('\n').length }, '已复制全部结果到剪贴板 (' + output.split('\n').length + ' 条)'));
  };

  return (
    <div>
      <TextArea
        rows={ 7 }
        value={ input }
        onChange={ onInputChange }
        placeholder={ t('phBatch', '每行粘贴一个下载地址 (自动识别):\nhttp(s):// 或 ftp:// 真实地址\nthunder:// 迅雷地址\nqqdl:// 快车地址\nqdl:// 旋风地址') }
      />
      <div style={ { display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0 6px' } }>
        <span style={ { color: '#888' } }>{t('convertTo', '转换为')}</span>
        <Select
          style={ { width: 160 } }
          value={ format }
          onChange={ onFormatChange }
          options={ DOWNLOAD_FORMATS.map((f) => ({ value: f.value, label: t('fmt_' + f.value, f.label) })) }
        />
        <span style={ { color: '#bbb', fontSize: 12 } }>{t('outNote', '输出按行对应输入, 结果可点击复制')}</span>
      </div>
      { error && <div style={ { color: '#ff4d4f', margin: '4px 0' } }>⚠ { dlErrText(error, locale, t) }</div> }
      <TextArea
        rows={ 7 }
        readOnly
        value={ output }
        placeholder={ t('phOutput', '转换结果将显示在这里') }
        style={ { cursor: output ? 'copy' : 'default', background: '#fafafa' } }
        onFocus={ (e) => output && e.target.select() }
        onClick={ () => { if (output) copyAll(); } }
        title={ t('titleAll', '点击复制全部结果到剪贴板') }
      />
    </div>
  );
}

const DownloadLinkConvert: React.FC = () => {
  const { locale } = useLocale();
  const t = (key: string, fallback: string) => tr(dlLang, locale, key, fallback);
  return (
    <Tabs
      items={ [
        { key: 'single', label: t('tab_single', '单个转换'), children: <SinglePanel /> },
        { key: 'batch', label: t('tab_batch', '批量转换'), children: <BatchPanel /> },
      ] }
    />
  );
}

export default DownloadLinkConvert;
