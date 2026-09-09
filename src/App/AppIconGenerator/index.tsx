import { useRef, useState } from "react";
import { Button, Card, Checkbox, Collapse, message, theme } from "antd";
import { saveBytesFile } from "../../lib/tauri";
import { zipStore } from "./lib";
import { ALL_PLATFORMS, TOTAL_ICONS } from "./data";
import { useLocale } from "../../hook/locale-context";
import { im, imT } from "../image-lang";

const checkerBg = {
  backgroundImage: 'conic-gradient(#d9d9d9 25%, #fff 0 50%, #d9d9d9 0 75%, #fff 0)',
  backgroundSize: '16px 16px',
  border: '1px solid #e0e0e0',
  borderRadius: 6,
} as const;

interface Rendered { dataUrl: string; bytes: Uint8Array }

const AppIconGenerator: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => im(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => imT(locale, zh, v);
  const { token } = theme.useToken();
  const [ srcName, setSrcName ] = useState('');
  const [ master, setMaster ] = useState('');   // 1024 主图标 dataURL (预览)
  const [ busy, setBusy ] = useState(false);
  // 勾选状态: 选中的平台才参与打包 (默认全选)
  const [ selected, setSelected ] = useState<Set<string>>(() => new Set(ALL_PLATFORMS.map((p) => p.key)));
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const togglePlatform = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // 把原图等比拉伸绘制为 px×px PNG
  const renderPng = (img: HTMLImageElement, px: number): Promise<Rendered> => {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = px;
        canvas.height = px;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error(t('无法创建画布'))); return; }
        ctx.clearRect(0, 0, px, px);
        ctx.imageSmoothingEnabled = true;
        (ctx as CanvasRenderingContext2D & { imageSmoothingQuality?: string }).imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, px, px);
        const dataUrl = canvas.toDataURL('image/png');
        canvas.toBlob(async (blob) => {
          if (!blob) { reject(new Error(t('PNG 生成失败'))); return; }
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
      message.error(t('请选择图片文件 (PNG/JPG/WebP 等)'));
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
          message.error(err instanceof Error ? t(err.message) : t('生成失败'));
        } finally {
          setBusy(false);
        }
      };
      img.onerror = () => { message.error(t('图片加载失败')); };
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
    if (!img || !srcName) { message.warning(t('请先上传一张图片')); return; }
    setBusy(true);
    try {
      const chosen = ALL_PLATFORMS.filter((p) => selected.has(p.key));
      const entries = [];
      for (const platform of chosen) {
        for (const f of platform.files) {
          const r = await renderPng(img, f.px);
          entries.push({ path: f.path, bytes: r.bytes });
        }
      }
      const readme = [
        tt('App Icon 生成 · 批量结果 ({n} 张)', { n: entries.length }),
        '',
        ...chosen.flatMap((p) => [
          tt('【{t}】{d}:', { t: p.title, d: t(p.desc) }),
          ...p.files.map((f) => '  ' + f.path + ' (' + f.px + 'x' + f.px + ')'),
          '',
        ]),
      ].join('\n');
      entries.push({ path: 'README.txt', bytes: new TextEncoder().encode(readme) });
      const zip = zipStore(entries);
      const ok = await saveBytesFile('App-Icons.zip', zip, {
        title: t('批量下载 App 图标'),
        filterName: t('ZIP 压缩包'),
        extensions: ['zip'],
      });
      if (ok) message.success(tt('已生成 {n} 张图标并打包下载', { n: entries.length }));
    } catch (err) {
      message.error(err instanceof Error ? t(err.message) : t('打包失败'));
    } finally {
      setBusy(false);
    }
  };

  // 选中平台合计张数
  const selCount = ALL_PLATFORMS.filter((p) => selected.has(p.key)).reduce((s, p) => s + p.files.length, 0);

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
            <div style={ { fontSize: 15, marginBottom: 6 } }>{t('点击或拖拽图片到此处')}</div>
            <div style={ { fontSize: 12 } }>{t('建议 1024×1024 方形、无透明底素材')}{ srcName ? tt(' · 当前: {name}', { name: srcName }) : '' }</div>
          </div>
          <input
            ref={ fileRef }
            type="file"
            accept="image/*"
            style={ { display: 'none' } }
            onChange={ (e) => { const f = e.target.files?.[0]; if (f) loadFile(f); e.target.value = ''; } }
          />

          {/* 平台规格: 卡片勾选, 选中边框高亮 */}
          <div style={ { display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' } }>
            { ALL_PLATFORMS.map((p) => {
              const on = selected.has(p.key);
              const pxs = [...new Set(p.files.map((f) => f.px))].sort((a, b) => a - b);
              return (
                <Card
                  key={ p.key }
                  size="small"
                  style={ {
                    width: 208,
                    cursor: 'pointer',
                    borderColor: on ? token.colorPrimary : undefined,
                    boxShadow: on ? `0 0 0 1px ${token.colorPrimary}` : undefined,
                    background: on ? token.colorPrimaryBg : undefined,
                    transition: 'all 0.2s',
                  } }
                  onClick={ () => togglePlatform(p.key) }
                  title={ <Checkbox checked={ on } onClick={ (e) => { e.stopPropagation(); togglePlatform(p.key); } }>{ p.title }</Checkbox> }
                >
                  <div style={ { fontWeight: 600, marginBottom: 2 } }>{ tt('{n} 张', { n: p.files.length }) }</div>
                  <div style={ { color: token.colorTextTertiary, fontSize: 12, margin: '0 0 6px' } }>{ t(p.desc) }</div>
                  <div style={ { color: token.colorTextSecondary, fontSize: 12 } }>{ tt('像素: {p}', { p: pxs.join(' / ') }) }</div>
                </Card>
              );
            }) }
          </div>
          <div style={ { color: token.colorTextTertiary, fontSize: 12, marginTop: 6 } }>
            { tt('点击卡片可勾选 / 取消平台, 选中的平台才会被打包下载 (当前选中 {n} 张)', { n: selCount }) }
          </div>

          <Button
            type="primary"
            size="large"
            block
            loading={ busy }
            disabled={ !srcName || selCount === 0 }
            onClick={ downloadAll }
            style={ { marginTop: 10 } }
          >
            { busy ? t('正在生成…') : tt('下载所选平台图标 (.zip · {n} 张)', { n: selCount }) }
          </Button>
        </div>

        {/* 右: 预览 */}
        <div style={ { textAlign: 'center' } }>
          <div style={ { color: '#888', marginBottom: 8, fontSize: 12 } }>{t('1024 主图标预览')}</div>
          { master ? (
            <img src={ master } alt="master" width={ 160 } height={ 160 } style={ { ...checkerBg, padding: 8 } } />
          ) : (
            <div style={ { ...checkerBg, width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' } }>
              {t('上传后预览')}
            </div>
          ) }
          <div style={ { color: '#aaa', marginTop: 6, fontSize: 12 } }>
            {t('iOS · Android · PhoneGap 三平台同时生成')}
          </div>
        </div>
      </div>

      <Collapse
        ghost
        style={ { marginTop: 10, maxWidth: 760 } }
        items={ [
          {
            key: 'list',
            label: tt('查看输出文件清单 ({n} 个可选, 以下仅列出已选平台)', { n: TOTAL_ICONS }),
            children: (
              <div style={ { fontFamily: 'Consolas, monospace', fontSize: 12, color: '#666', lineHeight: 1.9 } }>
                { ALL_PLATFORMS.filter((p) => selected.has(p.key)).map((p) => (
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
