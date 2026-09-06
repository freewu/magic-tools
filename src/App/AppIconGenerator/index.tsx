import { useRef, useState } from "react";
import { Button, Card, Collapse, message } from "antd";
import { saveBytesFile } from "../../lib/tauri";
import { zipStore } from "./lib";
import { ALL_PLATFORMS, TOTAL_ICONS } from "./data";

const checkerBg = {
  backgroundImage: 'conic-gradient(#d9d9d9 25%, #fff 0 50%, #d9d9d9 0 75%, #fff 0)',
  backgroundSize: '16px 16px',
  border: '1px solid #e0e0e0',
  borderRadius: 6,
} as const;

interface Rendered { dataUrl: string; bytes: Uint8Array }

const AppIconGenerator: React.FC = () => {
  const [ srcName, setSrcName ] = useState('');
  const [ master, setMaster ] = useState('');   // 1024 主图标 dataURL (预览)
  const [ busy, setBusy ] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // 把原图等比拉伸绘制为 px×px PNG
  const renderPng = (img: HTMLImageElement, px: number): Promise<Rendered> => {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = px;
        canvas.height = px;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('无法创建画布')); return; }
        ctx.clearRect(0, 0, px, px);
        ctx.imageSmoothingEnabled = true;
        (ctx as CanvasRenderingContext2D & { imageSmoothingQuality?: string }).imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, px, px);
        const dataUrl = canvas.toDataURL('image/png');
        canvas.toBlob(async (blob) => {
          if (!blob) { reject(new Error('PNG 生成失败')); return; }
          const buf = await blob.arrayBuffer();
          resolve({ dataUrl, bytes: new Uint8Array(buf) });
        }, 'image/png');
      } catch (err) {
        reject(err);
      }
    });
  };

  const loadFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      message.error('请选择图片文件 (PNG/JPG/WebP 等)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const img = new Image();
      img.onload = async () => {
        imgRef.current = img;
        setSrcName(file.name);
        setBusy(true);
        try {
          const r = await renderPng(img, 1024);
          setMaster(r.dataUrl);
        } catch (err) {
          message.error(err instanceof Error ? err.message : '生成失败');
        } finally {
          setBusy(false);
        }
      };
      img.onerror = () => { message.error('图片加载失败'); };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  };

  // 渲染全部尺寸 -> zip -> 保存/下载
  const downloadAll = async () => {
    const img = imgRef.current;
    if (!img || !srcName) { message.warning('请先上传一张图片'); return; }
    setBusy(true);
    try {
      const entries = [];
      for (const platform of ALL_PLATFORMS) {
        for (const f of platform.files) {
          const r = await renderPng(img, f.px);
          entries.push({ path: f.path, bytes: r.bytes });
        }
      }
      const readme = [
        'App Icon 生成 · 批量结果 (' + TOTAL_ICONS + ' 张)',
        '',
        '【iOS】按 Apple HIG 命名 (pt × 倍数)。AppIcon-1024.png 用于 App Store;',
        '  建议源图为 1024×1024 方形且无透明背景 (Apple 审核要求)。',
        '【Android】mipmap-*/ic_launcher.png 对应 Google 官方密度目录,',
        '  可整体并入项目的 src/main/res; playstore-icon-512.png 用于商店。',
        '【PhoneGap】Cordova res/icon 官方目录结构, 覆盖到项目 res/icon 即生效,',
        '  config.xml 默认模板已按这些文件名引用。',
      ].join('\n');
      entries.push({ path: 'README.txt', bytes: new TextEncoder().encode(readme) });
      const zip = zipStore(entries);
      const ok = await saveBytesFile('App-Icons.zip', zip, {
        title: '批量下载 App 图标',
        filterName: 'ZIP 压缩包',
        extensions: ['zip'],
      });
      if (ok) message.success('已生成 ' + TOTAL_ICONS + ' 张图标并打包下载');
    } catch (err) {
      message.error(err instanceof Error ? err.message : '打包失败');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={ { display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' } }>
        {/* 左: 上传 */}
        <div style={ { flex: '1 1 360px', minWidth: 320, maxWidth: 460 } }>
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
            <div style={ { fontSize: 15, marginBottom: 6 } }>点击或拖拽图片到此处</div>
            <div style={ { fontSize: 12 } }>建议 1024×1024 方形、无透明底素材{ srcName ? ' · 当前: ' + srcName : '' }</div>
          </div>
          <input
            ref={ fileRef }
            type="file"
            accept="image/*"
            style={ { display: 'none' } }
            onChange={ (e) => { const f = e.target.files?.[0]; if (f) loadFile(f); e.target.value = ''; } }
          />

          {/* 平台规格 */}
          <div style={ { display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' } }>
            { ALL_PLATFORMS.map((p) => {
              const pxs = [...new Set(p.files.map((f) => f.px))].sort((a, b) => a - b);
              return (
                <Card key={ p.key } size="small" style={ { width: 208 } }>
                  <div style={ { fontWeight: 600 } }>{ p.title } · { p.files.length } 张</div>
                  <div style={ { color: '#999', fontSize: 12, margin: '4px 0 6px' } }>{ p.desc }</div>
                  <div style={ { color: '#666', fontSize: 12 } }>像素: { pxs.join(' / ') }</div>
                </Card>
              );
            }) }
          </div>

          <Button
            type="primary"
            size="large"
            block
            loading={ busy }
            disabled={ !srcName }
            onClick={ downloadAll }
            style={ { marginTop: 14 } }
          >
            { busy ? '正在生成…' : '生成并批量下载全部图标 (.zip · ' + TOTAL_ICONS + ' 张)' }
          </Button>
        </div>

        {/* 右: 预览 */}
        <div style={ { textAlign: 'center' } }>
          <div style={ { color: '#888', marginBottom: 8, fontSize: 12 } }>1024 主图标预览</div>
          { master ? (
            <img src={ master } alt="master" width={ 160 } height={ 160 } style={ { ...checkerBg, padding: 8 } } />
          ) : (
            <div style={ { ...checkerBg, width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' } }>
              上传后预览
            </div>
          ) }
          <div style={ { color: '#aaa', marginTop: 6, fontSize: 12 } }>
            iOS · Android · PhoneGap 三平台同时生成
          </div>
        </div>
      </div>

      <Collapse
        ghost
        style={ { marginTop: 10, maxWidth: 760 } }
        items={ [
          {
            key: 'list',
            label: '查看全部 ' + TOTAL_ICONS + ' 个输出文件清单 (遵循 Apple / Google / Cordova 官方标准)',
            children: (
              <div style={ { fontFamily: 'Consolas, monospace', fontSize: 12, color: '#666', lineHeight: 1.9 } }>
                { ALL_PLATFORMS.map((p) => (
                  <div key={ p.key }>
                    { p.files.map((f) => (
                      <div key={ f.path }>{ f.path } <span style={ { color: '#aaa' } }>({ f.px }×{ f.px })</span></div>
                    )) }
                  </div>
                )) }
                <div>README.txt</div>
              </div>
            ),
          },
        ] }
      />
    </div>
  );
}

export default AppIconGenerator;
