import { useRef, useState, type ReactNode } from "react";
import { Input, message } from "antd";
import { copyTextToClipboard } from "./../../lib";
import { convertDownloadLink, type DownloadLinks } from "./lib";

const { TextArea } = Input;

interface RowItem { label: string; color: string; value: string }

const toRows = (r: DownloadLinks): RowItem[] => [
  { label: '真实地址', color: '#1890ff', value: r.real },
  { label: '迅雷地址', color: '#13c2c2', value: r.thunder },
  { label: '快车地址', color: '#722ed1', value: r.qqdl },
  { label: '旋风地址', color: '#52c41a', value: r.qdl },
];

const DownloadLinkConvert: React.FC = () => {
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
      { rows.map((item) => {
        const node: ReactNode = (
          <Input
            readOnly
            value={ item.value }
            style={ { flex: 1, minWidth: 0, cursor: 'copy' } }
            onFocus={ (e) => e.target.select() }
            onClick={ () => { copy(item); } }
            title="点击复制到剪贴板"
          />
        );
        return (
          <div key={ item.label } style={ { display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0' } }>
            <span style={ { width: 76, flex: 'none', color: item.color, fontWeight: 600, textAlign: 'right' } }>{ item.label }</span>
            { node }
          </div>
        );
      }) }
    </div>
  );
}

export default DownloadLinkConvert;
