import { Button, ColorPicker, Input, Space, message } from "antd";
import { CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import { useMemo, useState } from "react";
import { copyTextToClipboard } from "../../lib";
import { saveBytesFile } from "../../lib/tauri";
import {
  badgeFileName, buildBadgeSvg, svgToDataUrl,
  BADGE_DEFAULTS,
} from "./lib";

const ShieldBadgeGenerator: React.FC = () => {
  const [ label, setLabel ] = useState('php');
  const [ value, setValue ] = useState('8.0');
  const [ fg, setFg ] = useState<string>(BADGE_DEFAULTS.fg);
  const [ status, setStatus ] = useState<string>(BADGE_DEFAULTS.status);

  // 参数变化即实时生成
  const svg = useMemo(
    () => buildBadgeSvg({ label, value, fg, status }),
    [ label, value, fg, status ],
  );
  const empty = svg === '';
  const dataUrl = useMemo(() => svgToDataUrl(svg), [ svg ]);

  const doCopy = async () => {
    try {
      await copyTextToClipboard(svg);
      message.success('SVG 内容已复制到剪贴板');
    } catch (err) {
      message.error('复制失败, 请手动选中下方代码复制');
    }
  };

  const doSave = async () => {
    try {
      const name = badgeFileName(label, value);
      const ok = await saveBytesFile(name, new TextEncoder().encode(svg), {
        title: '保存 ' + name,
        filterName: 'SVG 图片',
        extensions: [ 'svg' ],
      });
      if (ok) message.success('已保存 ' + name);
    } catch (err) {
      message.error('保存失败');
    }
  };

  const row = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 } as const;
  const labelStyle = { color: '#666', whiteSpace: 'nowrap' } as const;

  return (
    <div style={ { maxWidth: 760 } }>
      <div style={ row }>
        <span style={ labelStyle }>文字</span>
        <Input value={ label } onChange={ (e) => setLabel(e.target.value) } placeholder="左侧文字 (如 php)"
          style={ { width: 150, maxWidth: '100%' } } allowClear />
        <span style={ labelStyle }>状态</span>
        <Input value={ value } onChange={ (e) => setValue(e.target.value) } placeholder="右侧状态文字 (如 8.0)"
          style={ { width: 150, maxWidth: '100%' } } allowClear />
      </div>
      <div style={ row }>
        <span style={ labelStyle }>文字颜色</span>
        <ColorPicker format="hex" value={ fg } onChange={ (c) => setFg(c.toHexString()) } />
        <span style={ { color: '#999', fontSize: 12, fontFamily: 'monospace' } }>{ fg }</span>
        <span style={ labelStyle }>状态颜色</span>
        <ColorPicker format="hex" value={ status } onChange={ (c) => setStatus(c.toHexString()) } />
        <span style={ { color: '#999', fontSize: 12, fontFamily: 'monospace' } }>{ status }</span>
        <span style={ { color: '#bbb', fontSize: 12 } }>左侧底色固定 #555 (shields 风格)</span>
      </div>
      <div style={ { color: '#bbb', fontSize: 12, marginBottom: 12 } }>
        实时生成 shields.io 风格 SVG; 文字与状态留空时相应段落自动隐藏
      </div>

      {/* 预览 (矢量放大仍清晰, 点击复制) */}
      <div style={ { marginBottom: 12 } }>
        <div style={ { color: '#666', marginBottom: 6 } }>预览 (点击复制 SVG):</div>
        { empty ? (
          <div style={ { color: '#ccc', padding: '14px 0', fontSize: 13 } }>请填写文字或状态后生成预览</div>
        ) : (
          <>
            <img
              src={ dataUrl }
              alt="badge"
              title="点击复制 SVG 内容"
              onClick={ doCopy }
              style={ { height: 72, width: 'auto', maxWidth: '100%', cursor: 'pointer', userSelect: 'none' } }
            />
            <div style={ { color: '#aaa', fontSize: 12, marginTop: 4 } }>{ svg.length } 字符 · { label.trim() || '∅' } | { value.trim() || '∅' }</div>
          </>
        ) }
      </div>

      <Space wrap style={ { marginBottom: 12 } }>
        <Button type="primary" icon={ <CopyOutlined /> } disabled={ empty } onClick={ doCopy }>复制 SVG 内容</Button>
        <Button icon={ <DownloadOutlined /> } disabled={ empty } onClick={ doSave }>保存为 .svg</Button>
      </Space>

      {/* SVG 源码 (方便整段选择) */}
      <div style={ { color: '#666', marginBottom: 4 } }>SVG 源码:</div>
      <pre style={ {
        background: '#0f1419', color: '#e6edf3', borderRadius: 8, padding: '10px 12px',
        fontSize: 12, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
        lineHeight: 1.7, margin: 0, maxHeight: 240, overflowY: 'auto',
      } }>{ svg }</pre>
    </div>
  );
}

export default ShieldBadgeGenerator;
