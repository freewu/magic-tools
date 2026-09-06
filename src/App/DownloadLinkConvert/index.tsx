import { useRef, useState } from "react";
import { Input, Select, Tabs, message } from "antd";
import { copyTextToClipboard } from "./../../lib";
import { batchConvert, convertDownloadLink, DOWNLOAD_FORMATS, type DownloadLinks, type DownloadFormat } from "./lib";

const { TextArea } = Input;

interface RowItem { label: string; color: string; value: string }

const toRows = (r: DownloadLinks): RowItem[] => [
  { label: '真实地址', color: '#1890ff', value: r.real },
  { label: '迅雷地址', color: '#13c2c2', value: r.thunder },
  { label: '快车地址', color: '#722ed1', value: r.qqdl },
  { label: '旋风地址', color: '#52c41a', value: r.qdl },
];

// ---------- 单个转换 ----------
const SinglePanel: React.FC = () => {
  const [ rows, setRows ] = useState<RowItem[]>([]);
  const [ error, setError ] = useState('');
  const [ notEmpty, setNotEmpty ] = useState(false);
  const timeRef = useRef<number | null>(null);

  const copy = async (item: RowItem) => {
    await copyTextToClipboard(item.value);
    message.success('已复制' + item.label + '到剪贴板');
  };

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNotEmpty(value.trim().length > 0);
    try {
      const result = convertDownloadLink(value);
      setRows(toRows(result));
      setError('');
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : String(err));
      if (timeRef.current) window.clearTimeout(timeRef.current);
      timeRef.current = window.setTimeout(() => { if (error) setError(''); }, 4000);
    }
  };

  const clear = () => {
    setRows([]);
    setError('');
    setNotEmpty(false);
  };

  return (
    <div>
      <TextArea
        rows={ 4 }
        placeholder={ '在此粘贴下载地址, 自动识别并转换。支持:\n- 真实地址 http(s):// 或 ftp://\n- 迅雷地址 thunder://\n- 快车地址 qqdl://\n- 旋风地址 qdl://' }
        onChange={ onChange }
      />
      <div style={ { margin: '8px 0 4px', display: 'flex', justifyContent: 'flex-end' } }>
        { notEmpty && <span onClick={ clear } style={ { color: '#999', cursor: 'pointer', fontSize: 12 } }>清空</span> }
      </div>
      { error && <div style={ { color: '#ff4d4f', margin: '4px 0' } }>⚠ { error }</div> }
      { rows.map((item) => (
        <div key={ item.label } style={ { display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0' } }>
          <span style={ { width: 76, flex: 'none', color: item.color, fontWeight: 600, textAlign: 'right' } }>{ item.label }</span>
          <Input
            readOnly
            value={ item.value }
            style={ { flex: 1, minWidth: 0, cursor: 'copy' } }
            onFocus={ (e) => e.target.select() }
            onClick={ () => { copy(item); } }
            title="点击复制到剪贴板"
          />
        </div>
      )) }
    </div>
  );
}

// ---------- 批量转换 ----------
const BatchPanel: React.FC = () => {
  const [ input, setInput ] = useState('');
  const [ format, setFormat ] = useState<DownloadFormat>('thunder');
  const [ output, setOutput ] = useState('');
  const [ error, setError ] = useState('');

  const run = (text: string, fmt: DownloadFormat) => {
    try {
      setOutput(batchConvert(text, fmt));
      setError('');
    } catch (err) {
      setOutput('');
      setError(err instanceof Error ? err.message : String(err));
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
    message.success('已复制全部结果到剪贴板 (' + output.split('\n').length + ' 条)');
  };

  return (
    <div>
      <TextArea
        rows={ 7 }
        value={ input }
        onChange={ onInputChange }
        placeholder={ '每行粘贴一个下载地址 (自动识别):\nhttp(s):// 或 ftp:// 真实地址\nthunder:// 迅雷地址\nqqdl:// 快车地址\nqdl:// 旋风地址' }
      />
      <div style={ { display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0 6px' } }>
        <span style={ { color: '#888' } }>转换为</span>
        <Select
          style={ { width: 160 } }
          value={ format }
          onChange={ onFormatChange }
          options={ DOWNLOAD_FORMATS.map((f) => ({ value: f.value, label: f.label })) }
        />
        <span style={ { color: '#bbb', fontSize: 12 } }>输出按行对应输入, 结果可点击复制</span>
      </div>
      { error && <div style={ { color: '#ff4d4f', margin: '4px 0' } }>⚠ { error }</div> }
      <TextArea
        rows={ 7 }
        readOnly
        value={ output }
        placeholder={ '转换结果将显示在这里' }
        style={ { cursor: output ? 'copy' : 'default', background: '#fafafa' } }
        onFocus={ (e) => output && e.target.select() }
        onClick={ () => { if (output) copyAll(); } }
        title="点击复制全部结果到剪贴板"
      />
    </div>
  );
}

const DownloadLinkConvert: React.FC = () => {
  return (
    <Tabs
      items={ [
        { key: 'single', label: '单个转换', children: <SinglePanel /> },
        { key: 'batch', label: '批量转换', children: <BatchPanel /> },
      ] }
    />
  );
}

export default DownloadLinkConvert;
