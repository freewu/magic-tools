import { Button, ColorPicker, Divider, Input, InputNumber, Modal, Select, Space, message } from "antd";
import { useEffect, useRef, useState } from "react";
import { saveBytesFile } from "../../lib/tauri";
import {
  buildFileName, checkSize, getDefaultBg, getDefaultFg, getDefaultSize,
  PH_FORMATS, PH_MAX, PH_MIN, type PhFormat,
} from "./lib";

const MIME: Record<PhFormat, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };
const FILTER_NAME: Record<PhFormat, string> = { png: 'PNG 图片', jpg: 'JPEG 图片', webp: 'WebP 图片' };

interface Result { dataUrl: string; bytes: Uint8Array; fmt: PhFormat; w: number; h: number; }

// 按参数绘制占位图: 纯色底 + 居中自适应文字 (超宽先缩字号再截断)
const drawPlaceholder = async (w: number, h: number, text: string, bg: string, fg: string, fmt: PhFormat): Promise<Result> => {
  checkSize(w, h);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建画布');

  // 背景
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // 文字: 空则显示“宽 × 高”, 自动缩字号, 仍放不下则截尾
  const finalText = text.trim() || `${w} × ${h}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const maxW = Math.max(40, w * 0.92);
  const maxH = h * 0.9;
  let fs = Math.max(12, Math.floor(Math.min(w, h) / 8));
  let shown = finalText;
  const applyFont = (size: number) => { ctx.font = `${size}px Arial, "Microsoft YaHei", sans-serif`; };
  applyFont(fs);
  const fits = () => ctx.measureText(shown).width <= maxW && fs <= maxH;
  while (!fits() && fs > 6) { fs--; applyFont(fs); } // 缩字号
  while (!fits() && shown.length > 1) { shown = shown.slice(0, -1); } // 仍超宽 -> 截断

  ctx.fillStyle = fg;
  ctx.fillText(shown, w / 2, h / 2);

  const dataUrl = canvas.toDataURL(MIME[fmt]);
  const bytes = await new Promise<Uint8Array>((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) { reject(new Error('图片生成失败')); return; }
      resolve(new Uint8Array(await blob.arrayBuffer()));
    }, MIME[fmt], fmt === 'png' ? undefined : 0.92);
  });
  return { dataUrl, bytes, fmt, w, h };
};

const PlaceholderImage: React.FC = () => {
  const init = getDefaultSize();
  const [ w, setW ] = useState(init.w);
  const [ h, setH ] = useState(init.h);
  const [ text, setText ] = useState('');
  const [ bg, setBg ] = useState(getDefaultBg());
  const [ fg, setFg ] = useState(getDefaultFg());
  const [ fmt, setFmt ] = useState<PhFormat>('png');
  const [ generated, setGenerated ] = useState(false);
  const [ result, setResult ] = useState<Result | null>(null);
  const [ modalOpen, setModalOpen ] = useState(false);
  const [ saving, setSaving ] = useState(false);
  const genIdRef = useRef(0);

  // 参数变化 -> 重新生成 (首次点「生成图片」后才自动跟随)
  useEffect(() => {
    if (!generated) return;
    const id = ++genIdRef.current;
    (async () => {
      try {
        const r = await drawPlaceholder(w, h, text, bg, fg, fmt);
        if (id === genIdRef.current) setResult(r);
      } catch (err) {
        if (id === genIdRef.current) message.error(err instanceof Error ? err.message : '生成失败');
      }
    })();
  }, [ w, h, text, bg, fg, fmt, generated ]);

  const generate = () => setGenerated(true);

  const save = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const name = buildFileName(result.w, result.h, result.fmt);
      const ok = await saveBytesFile(name, result.bytes, {
        title: '保存占位图 ' + name,
        filterName: FILTER_NAME[result.fmt],
        extensions: [ result.fmt ],
      });
      if (ok) {
        message.success('已保存 ' + name);
        setModalOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const fileName = result ? buildFileName(result.w, result.h, result.fmt) : '';
  const defaultText = w + ' × ' + h;

  const row = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 } as const;
  const label = { color: '#666', whiteSpace: 'nowrap' } as const;

  return (
    <div>
      <div style={ { maxWidth: 720 } }>
        {/* 参数行: 宽高 */}
        <div style={ row }>
          <span style={ label }>尺寸</span>
          <InputNumber min={ PH_MIN } max={ PH_MAX } value={ w } onChange={ (v) => { if (v != null) setW(v); } } addonBefore="宽" style={ { width: 130 } } />
          <span style={ { color: '#bbb' } }>×</span>
          <InputNumber min={ PH_MIN } max={ PH_MAX } value={ h } onChange={ (v) => { if (v != null) setH(v); } } addonBefore="高" style={ { width: 130 } } />
          <span style={ label }>格式</span>
          <Select value={ fmt } onChange={ setFmt } style={ { width: 90 } }
            options={ PH_FORMATS.map((f) => ({ value: f, label: f.toUpperCase() })) } />
        </div>
        {/* 文字 */}
        <div style={ row }>
          <span style={ label }>显示文字</span>
          <Input value={ text } onChange={ (e) => setText(e.target.value) } style={ { width: 320, maxWidth: '100%' } }
            placeholder={ '留空则显示默认文字: ' + defaultText } allowClear />
          { !text && <span style={ { color: '#bbb', fontSize: 12 } }>默认 { defaultText }</span> }
        </div>
        {/* 颜色 */}
        <div style={ row }>
          <span style={ label }>背景颜色</span>
          <ColorPicker format="hex" value={ bg } onChange={ (c) => setBg(c.toHexString()) } />
          <span style={ { color: '#999', fontSize: 12, fontFamily: 'monospace' } }>{ bg }</span>
          <span style={ label }>文字颜色</span>
          <ColorPicker format="hex" value={ fg } onChange={ (c) => setFg(c.toHexString()) } />
          <span style={ { color: '#999', fontSize: 12, fontFamily: 'monospace' } }>{ fg }</span>
          <Button type="primary" onClick={ generate }>生成图片</Button>
        </div>
        <div style={ { color: '#bbb', fontSize: 12, marginBottom: 10 } }>
          宽高范围 { PH_MIN }–{ PH_MAX }px; 文字过长会自动缩小字号或截断; 已生成后修改参数会自动刷新图片
        </div>
      </div>

      <Divider style={ { margin: '8px 0' } }>预览 (点击图片弹窗保存)</Divider>

      { result ? (
        <div style={ { display: 'inline-block' } }>
          <img
            src={ result.dataUrl }
            alt="placeholder"
            style={ { maxWidth: '100%', maxHeight: 320, border: '1px solid #eee', borderRadius: 4, cursor: 'zoom-in' } }
            onClick={ () => setModalOpen(true) }
            title="点击查看并保存"
          />
          <div style={ { color: '#aaa', marginTop: 6, fontSize: 12 } }>
            { result.w }×{ result.h } · { result.fmt.toUpperCase() } · 点击图片查看并保存
          </div>
        </div>
      ) : (
        <div style={ { color: '#ccc', padding: '20px 0' } }>
          设置参数后点击「生成图片」, 图片将显示在此处; 点击图片可弹窗下载保存
        </div>
      ) }

      {/* 保存弹窗 */}
      <Modal
        open={ modalOpen }
        title={ '保存占位图 · ' + (result ? result.w + '×' + result.h + ' ' + result.fmt.toUpperCase() : '') }
        onCancel={ () => setModalOpen(false) }
        width={ 480 }
        footer={ [
          <Button key="cancel" onClick={ () => setModalOpen(false) }>取消</Button>,
          <Button key="save" type="primary" loading={ saving } onClick={ save }>保存图片</Button>,
        ] }
      >
        <div style={ { textAlign: 'center', padding: '8px 0' } }>
          { result && (
            <img src={ result.dataUrl } alt="placeholder" style={ { maxWidth: '100%', maxHeight: 420, border: '1px solid #eee', borderRadius: 4 } } />
          ) }
          <div style={ { color: '#888', marginTop: 10, fontSize: 12 } }>
            将保存为 <b style={ { fontFamily: 'monospace' } }>{ fileName }</b> ({ result ? Math.round(result.bytes.length / 1024) : 0 } KB)
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default PlaceholderImage;
