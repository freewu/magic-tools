import { Button, Divider, Input, Radio, Space, message, Typography } from "antd";
import { useEffect, useRef, useState } from "react";
import { ArrowDownOutlined, ArrowUpOutlined, ClearOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from "../../lib";
import { openFile } from "../../lib/file";
import {
  compressText, decompressToText, formatGzipBytes, getFormat, parseGzipBytes,
  setFormat, GZIP_FORMAT_CHANGED, GZIP_FORMAT_OPTIONS,
} from "./lib";
import type { GzipFormat } from "./lib";

const GzipCodec = () => {
  const [ plain, setPlain ] = useState('');   // 上框: 明文 / 解压结果
  const [ codec, setCodec ] = useState('');   // 下框: gzip 展示串 (Base64/Hex) / 解压输入
  const [ fmt, setFmt ] = useState<GzipFormat>(getFormat()); // 展示格式 (默认取设置)
  const lastBytesRef = useRef<Uint8Array | null>(null);      // 最近一次压缩产物
  const [ busy, setBusy ] = useState<'gzip' | 'gunzip' | null>(null);
  const [ stat, setStat ] = useState<{ src: number; dst: number } | null>(null);

  // 设置页修改默认格式时同步 (keep-alive 页面不重挂载的场景)
  useEffect(() => {
    const onChanged = () => setFmt(getFormat());
    window.addEventListener(GZIP_FORMAT_CHANGED, onChanged);
    return () => window.removeEventListener(GZIP_FORMAT_CHANGED, onChanged);
  }, []);

  const changeFormat = (f: GzipFormat) => {
    setFmt(f);
    setFormat(f);
    // 若下框内容仍是上次压缩产物, 即时按新格式重算
    if (lastBytesRef.current) setCodec(formatGzipBytes(lastBytesRef.current, f));
  };

  const doGzip = async () => {
    if (!plain.trim()) { message.warning('请先输入要压缩的内容'); return; }
    setBusy('gzip');
    try {
      const bytes = await compressText(plain);
      lastBytesRef.current = bytes;
      setCodec(formatGzipBytes(bytes, fmt));
      setStat({ src: new TextEncoder().encode(plain).length, dst: bytes.length });
    } catch (e) {
      message.error(e instanceof Error ? e.message : '压缩失败');
    } finally {
      setBusy(null);
    }
  };

  const doGunzip = async () => {
    const input = codec.trim();
    if (!input) { message.warning('请先输入要解压的 Gzip 串 (Base64 或 Hex)'); return; }
    setBusy('gunzip');
    try {
      const bytes = parseGzipBytes(input, fmt); // 自动识别两种格式
      const text = await decompressToText(bytes);
      lastBytesRef.current = null;
      setPlain(text);
      setStat(null);
    } catch (e) {
      message.error(e instanceof Error ? e.message : '解压失败');
    } finally {
      setBusy(null);
    }
  };

  const textareaCopy = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if (txt) {
      copyTextToClipboard(txt);
      message.success('已复制到剪贴板');
    }
  };

  const btnStyle = { color: '#fff' } as const;
  const statText = stat
    ? `明文 ${stat.src} 字节 → Gzip ${stat.dst} 字节 (${stat.src > 0 ? Math.round(stat.dst / stat.src * 100) : 0}%)`
    : '';

  return (
    <div style={ { maxWidth: 900 } }>
      <Input.TextArea
        value={ plain }
        onChange={ (e) => setPlain(e.target.value) }
        onDoubleClick={ textareaCopy }
        title="双击复制内容到剪贴板"
        placeholder="输入要 Gzip 压缩的文本, 或拖拽文件到框内以文件内容为输入"
        autoSize={ { minRows: 5, maxRows: 8 } }
        onDragOver={ (e) => e.preventDefault() }
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setPlain); } }
      />

      <div style={ { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, margin: '8px 0' } }>
        <Button type="primary" icon={ <ArrowDownOutlined /> } loading={ busy === 'gzip' }
          disabled={ busy !== null } onClick={ doGzip }>Gzip 压缩</Button>
        <Button style={ { ...btnStyle, background: '#28a745', borderColor: '#28a745' } }
          icon={ <ArrowUpOutlined /> } loading={ busy === 'gunzip' }
          disabled={ busy !== null } onClick={ doGunzip }>Gzip 解压</Button>
        <Radio.Group
          value={ fmt }
          onChange={ (e) => changeFormat(e.target.value as GzipFormat) }
          optionType="button" buttonStyle="solid"
          options={ [ ...GZIP_FORMAT_OPTIONS ] }
        />
        <Button icon={ <ClearOutlined /> }
          onClick={ () => { setPlain(''); setCodec(''); lastBytesRef.current = null; setStat(null); } }>清除</Button>
      </div>

      <Input.TextArea
        value={ codec }
        onChange={ (e) => { setCodec(e.target.value); lastBytesRef.current = null; } }
        onDoubleClick={ textareaCopy }
        title="双击复制内容到剪贴板"
        placeholder={ fmt === 'hex'
          ? 'Gzip 压缩结果 (Hex, 可双击复制), 或粘贴待解压的 Gzip 串 (Base64/Hex 均可)'
          : 'Gzip 压缩结果 (Base64, 可双击复制), 或粘贴待解压的 Gzip 串 (Base64/Hex 均可)' }
        autoSize={ { minRows: 5, maxRows: 8 } }
        onDragOver={ (e) => e.preventDefault() }
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setCodec); } }
      />

      <Space style={ { marginTop: 4 } } size={ 16 }>
        <Typography.Text type="secondary" style={ { fontSize: 12 } }>
          { statText || '压缩率按输入输出字节计算; 点击下方说明了解格式差异' }
        </Typography.Text>
      </Space>

      <Divider plain orientation="left">Gzip 编解码说明</Divider>
      <ul style={ { color: '#888', fontSize: 13, lineHeight: 1.9, paddingLeft: 18, marginTop: 0 } }>
        <li>Gzip 是广泛使用的数据压缩格式: 压缩(编码)把文本变为二进制 gzip 流, 解压(解码)还原原文, 压缩率取决于内容重复度。</li>
        <li>结果为二进制, 本工具用 <b>Base64</b>(更紧凑) 或 <b>Hex</b>(可读/便于调试) 两种文本格式展示, 可在「设置 → 编解码」里修改默认格式。</li>
        <li>解压输入 Base64 / Hex 均可自动识别; 输入必须带 Gzip 文件头 (1F 8B), 普通 Base64 文本(非 gzip 数据)会提示无效。</li>
        <li>压缩解压在本地浏览器/WebView 完成 (CompressionStream API), 内容不出本机, 无需网络。</li>
      </ul>
    </div>
  );
}

export default GzipCodec;
