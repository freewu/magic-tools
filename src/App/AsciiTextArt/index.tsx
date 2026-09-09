import { Button, Input, InputNumber, Select, Space, message } from "antd";
import { CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from "react";
import { copyTextToClipboard } from "../../lib";
import { saveBytesFile } from "../../lib/tauri";
import { FONT_NAMES, getDefaultFont, renderText } from "./lib";
import { useLocale } from "../../hook/locale-context";
import { u, uT } from './lang';

const SAMPLE = 'Hello ASCII!';
/** 预览字号 (仅 CSS 缩放, 不影响复制的文本) */
const FONT_SIZE_MIN = 4;
const FONT_SIZE_MAX = 32;

const AsciiTextArt: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => uT(locale, zh, v);
  const [ text, setText ] = useState(SAMPLE);
  const [ font, setFont ] = useState<string>(() => getDefaultFont());
  const [ fontSize, setFontSize ] = useState(12);
  const [ art, setArt ] = useState('');

  // 渲染: 首次渲染需动态加载字体数据模块; 文字/字体任一变化即重新排版
  useEffect(() => {
    let alive = true;
    renderText(text, font).then((out) => { if (alive) setArt(out); });
    return () => { alive = false; };
  }, [ text, font ]);

  const artRows = useMemo(() => art.split('\n'), [ art ]);

  const doCopy = async () => {
    if (!art) return;
    try {
      await copyTextToClipboard(art);
      message.success(tt('已复制 {n} 字符到剪贴板', { n: art.length }));
    } catch (err) {
      message.error(t('复制失败, 请手动选中文本复制'));
    }
  };

  const doSave = async () => {
    if (!art) return;
    const word = (text.split(/\s+/)[0] || 'ascii-art').replace(/[\\/:*?"<>|]/g, '') || 'ascii-art';
    const name = word + '.txt';
    const ok = await saveBytesFile(name, new TextEncoder().encode(art), {
      title: tt('保存 {n}', { n: name }),
      filterName: t('文本文件'),
      extensions: [ 'txt' ],
    });
    if (ok) message.success(tt('已保存 {n}', { n: name }));
  };

  const row = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 } as const;
  const labelStyle = { color: '#666', whiteSpace: 'nowrap' } as const;

  return (
    <div style={ { maxWidth: 1080 } }>
      <div style={ row }>
        <span style={ labelStyle }>{t('文字')}</span>
        <Input.TextArea
          value={ text } onChange={ (e) => setText(e.target.value) }
          placeholder={t('输入要生成大字的内容 (支持多行, 每行独立排版)')}
          autoSize={ { minRows: 2, maxRows: 8 } } style={ { width: 400, maxWidth: '100%' } }
        />
      </div>
      <div style={ row }>
        <span style={ labelStyle }>{t('字体')}</span>
        <Select
          value={ font }
          style={ { width: 340, maxWidth: '100%' } }
          showSearch
          onChange={ setFont }
          placeholder={t('选择 figlet 字体')}
          options={ FONT_NAMES.map((v) => ({ value: v, label: v })) }
          filterOption={ (kw, opt) => String(opt?.label ?? '').toLowerCase().includes(kw.toLowerCase()) }
        />
        <span style={ { color: '#bbb', fontSize: 12 } }>{tt('共 {n} 款 figlet 字体', { n: FONT_NAMES.length })}</span>
      </div>
      <div style={ row }>
        <span style={ labelStyle }>{t('预览字号')}</span>
        <InputNumber
          min={ FONT_SIZE_MIN } max={ FONT_SIZE_MAX } value={ fontSize }
          onChange={ (v) => { if (v != null) setFontSize(v); } } style={ { width: 80 } }
        />
        <span style={ { color: '#bbb', fontSize: 12 } }>{t('仅缩放预览显示, 复制的文本不受影响')}</span>
      </div>
      <div style={ { color: '#bbb', fontSize: 12, marginBottom: 10 } }>
        {t('字体来自 figlet 经典字体集; 支持英文字母 / 数字 / 常用标点, 中文等未收录字符按字体回退显示 · 默认字体可在「设置 → 其它」中调整')}
      </div>

      <div style={ { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } }>
        <span style={ { color: '#666' } }>{tt('结果 ({r} 行 · {c} 字符):', { r: artRows.length, c: art.length })}</span>
        <Space>
          <Button size="small" icon={ <CopyOutlined /> } disabled={ !art } onClick={ doCopy }>{t('复制文本')}</Button>
          <Button size="small" icon={ <DownloadOutlined /> } disabled={ !art } onClick={ doSave }>{t('下载 .txt')}</Button>
        </Space>
      </div>
      <pre style={ {
        background: '#f6f8fa', color: '#222', borderRadius: 8, padding: 12,
        fontSize, lineHeight: fontSize <= 8 ? 1.1 : 1.2, letterSpacing: 0, whiteSpace: 'pre',
        overflow: 'auto', maxHeight: 520, margin: 0,
        fontFamily: 'Consolas, "Courier New", monospace',
      } }>{ art }</pre>
      <div style={ { color: '#bbb', fontSize: 12, marginTop: 6 } }>
        {t('提示: 预览按等宽字体近似比例示意, 复制到 Markdown 代码块或等宽字体编辑器效果最佳')}
      </div>
    </div>
  );
}

export default AsciiTextArt;
