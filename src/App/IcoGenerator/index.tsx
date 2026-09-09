import { useRef, useState } from "react";
import { Button, Modal, Select, message } from "antd";
import { saveBytesFile } from "../../lib/tauri";
import { dataUrlToBytes, getDefaultSize, pngToIco } from "./lib";
import { ICO_SIZES, type IcoSize } from "./data";
import { useLocale } from "../../hook/locale-context";
import { im, imT } from "../image-lang";

// 透明棋盘背景 (便于观察透明图标)
const checkerBg = {
  backgroundImage: 'conic-gradient(#d9d9d9 25%, #fff 0 50%, #d9d9d9 0 75%, #fff 0)',
  backgroundSize: '16px 16px',
  border: '1px solid #e0e0e0',
  borderRadius: 6,
} as const;

const IcoGenerator: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => im(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => imT(locale, zh, v);
  const [ size, setSize ] = useState<IcoSize>(getDefaultSize());
  const [ srcName, setSrcName ] = useState('');
  const [ preview, setPreview ] = useState('');       // 生成的 PNG dataURL
  const [ icoBytes, setIcoBytes ] = useState<Uint8Array | null>(null);
  const [ info, setInfo ] = useState('');
  const [ modalOpen, setModalOpen ] = useState(false);
  const [ saving, setSaving ] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // 把原图缩放到 size×size, 输出 PNG dataURL + ICO 字节
  const generate = (img: HTMLImageElement, sz: IcoSize) => {
    const canvas = document.createElement('canvas');
    canvas.width = sz;
    canvas.height = sz;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, sz, sz);
    ctx.imageSmoothingEnabled = true;
    (ctx as CanvasRenderingContext2D & { imageSmoothingQuality?: string }).imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, sz, sz);
    const dataUrl = canvas.toDataURL('image/png');
    const ico = pngToIco(dataUrlToBytes(dataUrl), sz);
    setPreview(dataUrl);
    setIcoBytes(ico);
    setInfo(tt('{s}×{s} · ICO 文件 {n} 字节', { s: sz, n: ico.length }));
  };

  const loadFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      message.error(t('请选择图片文件 (PNG/JPG/WebP 等)'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        setSrcName(file.name);
        generate(img, size);
      };
      img.onerror = () => { message.error(t('图片加载失败')); };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const onSizeChange = (v: IcoSize) => {
    setSize(v);
    if (imgRef.current) generate(imgRef.current, v);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  };

  const save = async () => {
    if (!icoBytes) return;
    setSaving(true);
    try {
      const ok = await saveBytesFile('icon-' + size + 'x' + size + '.ico', icoBytes, {
        title: t('保存 ICO 图标'),
        filterName: t('ICO 图标'),
        extensions: ['ico'],
      });
      if (ok) {
        message.success(tt('已保存 icon-{s}x{s}.ico', { s: size }));
        setModalOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const iconName = 'icon-' + size + 'x' + size + '.ico';

  return (
    <div>
      <div style={ { display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' } }>
        {/* 左: 上传 + 尺寸选择 */}
        <div style={ { flex: '1 1 380px', minWidth: 320, maxWidth: 460 } }>
          <div
            onClick={ () => fileRef.current?.click() }
            onDragOver={ (e) => e.preventDefault() }
            onDrop={ onDrop }
            style={ {
              border: '1px dashed #bbb',
              borderRadius: 8,
              padding: '28px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              color: '#888',
              background: '#fafafa',
            } }
          >
            <div style={ { fontSize: 15, marginBottom: 6 } }>{t('点击或拖拽图片到此处')}</div>
            <div style={ { fontSize: 12 } }>{t('支持 PNG / JPG / WebP / GIF, 建议使用方形图标素材')}{ srcName ? tt(' · 当前: {name}', { name: srcName }) : '' }</div>
          </div>
          <input
            ref={ fileRef }
            type="file"
            accept="image/*"
            style={ { display: 'none' } }
            onChange={ (e) => { const f = e.target.files?.[0]; if (f) loadFile(f); e.target.value = ''; } }
          />
          <div style={ { display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 } }>
            <span>{t('生成尺寸')}</span>
            <Select
              style={ { width: 120 } }
              value={ size }
              onChange={ onSizeChange }
              options={ ICO_SIZES.map((v) => ({ value: v, label: v + ' × ' + v })) }
            />
            { info && <span style={ { color: '#999', fontSize: 12 } }>{ info }</span> }
          </div>
          { srcName && !preview && <div style={ { color: '#999', marginTop: 8, fontSize: 12 } }>{t('正在生成…')}</div> }
        </div>

        {/* 右: 图标预览 (点击弹窗保存) */}
        <div style={ { textAlign: 'center' } }>
          <div style={ { color: '#888', marginBottom: 8, fontSize: 12 } }>{ tt('生成预览 ({s}×{s} 放大展示)', { s: size }) }</div>
          { preview ? (
            <>
              <img
                src={ preview }
                alt="icon"
                width={ 128 }
                height={ 128 }
                style={ { ...checkerBg, cursor: 'zoom-in', padding: 8, imageRendering: 'pixelated' } }
                onClick={ () => setModalOpen(true) }
                title={t('点击查看并保存')}
              />
              <div style={ { color: '#aaa', marginTop: 6, fontSize: 12 } }>{t('点击图标查看并保存 .ico')}</div>
            </>
          ) : (
            <div style={ { ...checkerBg, width: 128, height: 128, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' } }>
              {t('暂无图标')}
            </div>
          ) }
        </div>
      </div>

      {/* 保存弹窗 */}
      <Modal
        open={ modalOpen }
        title={ tt('保存 ICO 图标 · {s}×{s}', { s: size }) }
        onCancel={ () => setModalOpen(false) }
        width={ 360 }
        footer={ [
          <Button key="cancel" onClick={ () => setModalOpen(false) }>{t('取消')}</Button>,
          <Button key="save" type="primary" loading={ saving } onClick={ save }>{ tt('保存为 {name}', { name: iconName }) }</Button>,
        ] }
      >
        <div style={ { textAlign: 'center', padding: '8px 0' } }>
          { preview && (
            <img
              src={ preview }
              alt="icon preview"
              width={ 96 }
              height={ 96 }
              style={ { ...checkerBg, padding: 8, imageRendering: 'pixelated' } }
            />
          ) }
          <div style={ { color: '#888', marginTop: 10, fontSize: 12 } }>
            { tt('将导出单尺寸 {s}×{s} ICO (32 位带透明通道), 可直接用作网站 favicon 或程序图标', { s: size }) }
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default IcoGenerator;
