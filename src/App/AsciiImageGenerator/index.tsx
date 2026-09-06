import { Button, Input, InputNumber, Select, Slider, Space, Switch, message } from "antd";
import { CopyOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useMemo, useRef, useState } from "react";
import { copyTextToClipboard } from "../../lib";
import { saveBytesFile } from "../../lib/tauri";
import {
  GRAY_PALETTES, OUT_W_DEFAULT, OUT_W_MAX, OUT_W_MIN,
  STD_CHARS, renderAscii, toGray,
} from "./lib";

interface Source { gray: Uint8Array; w: number; h: number; name: string; }

// 解码图片 -> 灰度数组 (最长边缩放至 600px 内, 兼顾细节与性能)
const decodeToGray = async (file: File): Promise<Source> => {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('读取文件失败'));
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error('图片解析失败, 请确认文件格式'));
    im.src = dataUrl;
  });
  const maxSide = 600;
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建画布');
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  const gray = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = toGray(data[i], data[i + 1], data[i + 2]);
  }
  return { gray, w, h, name: file.name.replace(/\.[^.]+$/, '') };
};

const AsciiImageGenerator: React.FC = () => {
  const [ src, setSrc ] = useState<Source | null>(null);
  const [ outW, setOutW ] = useState(OUT_W_DEFAULT);
  const [ palette, setPalette ] = useState('std');
  const [ customChars, setCustomChars ] = useState('');
  const [ invert, setInvert ] = useState(false);
  const [ brightness, setBrightness ] = useState(0);
  const [ contrast, setContrast ] = useState(0);
  const [ dragOver, setDragOver ] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { message.warning('请选择图片文件'); return; }
    try {
      const s = await decodeToGray(file);
      setSrc(s);
      message.success('已载入 ' + file.name + ` (${s.w}×${s.h}px)`);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '载入失败');
    }
  };

  // 实时生成
  const text = useMemo(() => {
    if (!src) return '';
    const chars = customChars.trim() || (GRAY_PALETTES.find((p) => p.key === palette)?.chars ?? STD_CHARS);
    return renderAscii({
      gray: src.gray, srcW: src.w, srcH: src.h, outW,
      chars, invert, brightness: brightness / 100, contrast: contrast / 100,
    });
  }, [ src, outW, palette, customChars, invert, brightness, contrast ]);

  const doCopy = async () => {
    if (!text) return;
    try {
      await copyTextToClipboard(text);
      message.success('已复制 ' + text.length + ' 字符到剪贴板');
    } catch (err) {
      message.error('复制失败, 请手动选中文本复制');
    }
  };

  const doSave = async () => {
    if (!text || !src) return;
    const name = src.name + '-ascii.txt';
    const ok = await saveBytesFile(name, new TextEncoder().encode(text), {
      title: '保存 ' + name,
      filterName: '文本文件',
      extensions: [ 'txt' ],
    });
    if (ok) message.success('已保存 ' + name);
  };

  const row = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 } as const;
  const labelStyle = { color: '#666', whiteSpace: 'nowrap' } as const;

  return (
    <div>
      {/* 上传区 */}
      <input
        ref={ fileRef } type="file" accept="image/*" style={ { display: 'none' } }
        onChange={ (e) => { load(e.target.files?.[0]); e.target.value = ''; } }
      />
      <div
        onClick={ () => fileRef.current?.click() }
        onDragOver={ (e) => { e.preventDefault(); setDragOver(true); } }
        onDragLeave={ () => setDragOver(false) }
        onDrop={ (e) => { e.preventDefault(); setDragOver(false); load(e.dataTransfer.files?.[0]); } }
        style={ {
          border: `2px dashed ${dragOver ? '#1677ff' : '#d9d9d9'}`,
          background: dragOver ? '#f0f7ff' : '#fafafa',
          borderRadius: 10, padding: '26px 12px', textAlign: 'center', cursor: 'pointer',
          color: dragOver ? '#1677ff' : '#999', transition: 'all 0.2s',
        } }
      >
        <UploadOutlined style={ { fontSize: 26, marginBottom: 6 } } />
        <div>点击或拖拽图片到此处载入</div>
        <div style={ { fontSize: 12, color: '#bbb', marginTop: 4 } }>
          支持 png / jpg / webp / gif (首帧), 自动按最长边 600px 缩小处理
        </div>
      </div>

      { !src && (
        <div style={ { color: '#ccc', padding: '14px 0', fontSize: 13 } }>
          载入图片后自动生成 ASCII 图: 灰度字符按亮度映射, 可用下方参数实时调整
        </div>
      ) }

      { src && (
        <>
          {/* 参数 */}
          <div style={ { marginTop: 12 } }>
            <div style={ row }>
              <span style={ labelStyle }>输出宽</span>
              <InputNumber min={ OUT_W_MIN } max={ OUT_W_MAX } value={ outW } onChange={ (v) => { if (v != null) setOutW(v); } } style={ { width: 90 } } />
              <span style={ { color: '#bbb', fontSize: 12 } }>字符</span>
              <span style={ labelStyle }>字符集</span>
              <Select value={ palette } onChange={ (k) => { setPalette(k); if (k !== 'custom') setCustomChars(''); } } style={ { width: 210 } }
                options={ [
                  ...GRAY_PALETTES.map((p) => ({ value: p.key, label: p.label })),
                  { value: 'custom', label: '自定义…' },
                ] } />
              { palette === 'custom' && (
                <Input value={ customChars } onChange={ (e) => setCustomChars(e.target.value) } placeholder="按暗->亮输入字符, 如 @%# "
                  style={ { width: 200, fontFamily: 'monospace' } } maxLength={ 64 } allowClear />
              ) }
              <span style={ labelStyle }>反色</span>
              <Switch checked={ invert } onChange={ setInvert } />
            </div>
            <div style={ row }>
              <span style={ labelStyle }>亮度</span>
              <Slider style={ { width: 160 } } min={ -100 } max={ 100 } value={ brightness } onChange={ setBrightness } />
              <span style={ { color: '#999', width: 30, fontSize: 12 } }>{ brightness > 0 ? '+' : '' }{ brightness }</span>
              <span style={ labelStyle }>对比度</span>
              <Slider style={ { width: 160 } } min={ -100 } max={ 100 } value={ contrast } onChange={ setContrast } />
              <span style={ { color: '#999', width: 30, fontSize: 12 } }>{ contrast > 0 ? '+' : '' }{ contrast }</span>
            </div>
          </div>

          {/* 结果 */}
          <div style={ { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 8px' } }>
            <span style={ { color: '#666' } }>
              结果预览 ({ text.split('\n').length } 行 · { text.length } 字符 · 点击复制):
            </span>
            <Space>
              <Button size="small" icon={ <CopyOutlined /> } onClick={ doCopy }>复制文本</Button>
              <Button size="small" icon={ <DownloadOutlined /> } onClick={ doSave }>下载 .txt</Button>
            </Space>
          </div>
          <pre style={ {
            background: '#f6f8fa', color: '#222', borderRadius: 8, padding: 12,
            fontSize: 9, lineHeight: 1, letterSpacing: 0, whiteSpace: 'pre', overflow: 'auto',
            maxHeight: 420, margin: 0, userSelect: 'text', cursor: 'text',
            fontFamily: 'Consolas, "Courier New", monospace',
          } }>{ text }</pre>
          <div style={ { color: '#bbb', fontSize: 12, marginTop: 6 } }>
            提示: 预览按等宽字体 2:1 比例示意, 复制到 Markdown 代码块 / 等宽字体编辑器查看效果最佳
          </div>
        </>
      ) }
    </div>
  );
}

export default AsciiImageGenerator;
