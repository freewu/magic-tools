import { Button, ColorPicker, Input, InputNumber, Space, message, theme } from "antd";
import { CopyOutlined, DownloadOutlined, PictureOutlined } from '@ant-design/icons';
import { useMemo, useState } from "react";
import { copyTextToClipboard } from "../../lib";
import { saveBytesFile, savePngFile } from "../../lib/tauri";
import {
  badgeFileName, buildBadgeSvg, svgToDataUrl, parseSvgSize,
  BADGE_DEFAULTS,
} from "./lib";

const ShieldBadgeGenerator: React.FC = () => {
  const [ label, setLabel ] = useState('php');
  const [ value, setValue ] = useState('8.0');
  const [ fg, setFg ] = useState<string>(BADGE_DEFAULTS.fg);
  const [ status, setStatus ] = useState<string>(BADGE_DEFAULTS.status);
  const [ scale, setScale ] = useState<number>(2); // PNG 导出倍率 (图片尺寸)
  const { token } = theme.useToken();

  // 参数变化即实时生成
  const svg = useMemo(
    () => buildBadgeSvg({ label, value, fg, status }),
    [ label, value, fg, status ],
  );
  const empty = svg === '';
  const dataUrl = useMemo(() => svgToDataUrl(svg), [ svg ]);

  // 按倍率换算的 PNG 输出像素尺寸 (badge 高 20, 宽随文字)
  const outSize = useMemo(() => {
    const s = parseSvgSize(svg);
    return s ? { w: Math.round(s.w * scale), h: Math.round(s.h * scale) } : null;
  }, [ svg, scale ]);

  const doCopy = async () => {
    try {
      await copyTextToClipboard(svg);
      message.success('SVG 内容已复制到剪贴板');
    } catch (err) {
      message.error('复制失败, 请手动选中下方代码复制');
    }
  };

  const doSaveSvg = async () => {
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

  // 按当前倍率矢量放大绘制并保存 PNG
  const doSavePng = async () => {
    if (empty || !outSize) return;
    try {
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('图片加载失败'));
      });
      const canvas = document.createElement('canvas');
      canvas.width = outSize.w;
      canvas.height = outSize.h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        message.error('当前环境不支持绘制 PNG');
        return;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, outSize.w, outSize.h);
      const name = badgeFileName(label, value).replace(/\.svg$/, '') + '.png';
      const ok = await savePngFile(name, canvas.toDataURL('image/png'));
      if (ok) message.success(`已保存 ${name} (${outSize.w}×${outSize.h}px)`);
    } catch (err) {
      message.error('PNG 保存失败');
    }
  };

  const row = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 } as const;
  const labelStyle = { color: token.colorTextSecondary, whiteSpace: 'nowrap' } as const;
  const hexStyle = { color: token.colorTextTertiary, fontSize: 12, fontFamily: 'monospace' } as const;
  const hintStyle = { color: token.colorTextTertiary, fontSize: 12, marginBottom: 12 } as const;

  // 预览显示高度: 尽量接近导出尺寸, 最小 32px 保证可读, 最大 240px
  const previewH = outSize ? Math.max(32, Math.min(240, outSize.h)) : 72;

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
        <span style={ hexStyle }>{ fg }</span>
        <span style={ labelStyle }>状态颜色</span>
        <ColorPicker format="hex" value={ status } onChange={ (c) => setStatus(c.toHexString()) } />
        <span style={ hexStyle }>{ status }</span>
        <span style={ { color: token.colorTextTertiary, fontSize: 12 } }>左侧底色固定 #555 (shields 风格)</span>
      </div>
      <div style={ row }>
        <span style={ labelStyle }>图片尺寸</span>
        <InputNumber
          min={ 1 }
          max={ 10 }
          step={ 1 }
          value={ scale }
          onChange={ (v) => setScale(v ?? 1) }
          style={ { width: 90 } }
        />
        <span style={ labelStyle }>倍率</span>
        { outSize && <span style={ hexStyle }>导出 PNG 为 { outSize.w }×{ outSize.h }px (badge 高 20, 随文字变宽)</span> }
      </div>
      <div style={ hintStyle }>
        实时生成 shields.io 风格 SVG; 文字与状态留空时相应段落自动隐藏; SVG 为矢量格式, 放大不模糊
      </div>

      {/* 预览 (矢量放大仍清晰, 点击复制) */}
      <div style={ { marginBottom: 12 } }>
        <div style={ { color: token.colorTextSecondary, marginBottom: 6 } }>预览 (点击复制 SVG):</div>
        { empty ? (
          <div style={ { color: token.colorTextTertiary, padding: '14px 0', fontSize: 13 } }>请填写文字或状态后生成预览</div>
        ) : (
          <>
            <img
              src={ dataUrl }
              alt="badge"
              title="点击复制 SVG 内容"
              onClick={ doCopy }
              style={ { height: previewH, width: 'auto', maxWidth: '100%', cursor: 'pointer', userSelect: 'none', imageRendering: 'auto' } }
            />
            <div style={ { color: token.colorTextTertiary, fontSize: 12, marginTop: 4 } }>{ svg.length } 字符 · { label.trim() || '∅' } | { value.trim() || '∅' }</div>
          </>
        ) }
      </div>

      <Space wrap style={ { marginBottom: 12 } }>
        <Button type="primary" icon={ <CopyOutlined /> } disabled={ empty } onClick={ doCopy }>复制 SVG 内容</Button>
        <Button icon={ <DownloadOutlined /> } disabled={ empty } onClick={ doSaveSvg }>保存为 .svg</Button>
        <Button icon={ <PictureOutlined /> } disabled={ empty } onClick={ doSavePng }>导出 PNG ({ scale }×)</Button>
      </Space>

      {/* SVG 源码 (方便整段选择) */}
      <div style={ { color: token.colorTextSecondary, marginBottom: 4 } }>SVG 源码:</div>
      <pre style={ {
        background: '#0f1419', color: '#e6edf3', borderRadius: 8, padding: '10px 12px',
        fontSize: 12, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
        lineHeight: 1.7, margin: 0, maxHeight: 240, overflowY: 'auto',
      } }>{ svg }</pre>
    </div>
  );
}

export default ShieldBadgeGenerator;
