// 字帖生成器: 米字格 / 田字格 / 回宫格 / 作文格 · 多字体 · A4 打印
import { Button, Divider, Input, InputNumber, Segmented, Select, Space, Switch, Tag, Typography, Upload, message, theme } from 'antd';
import { DeleteOutlined, PrinterOutlined, UploadOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { useLocale } from '../../hook/locale-context';
import { printHtml } from '../../lib/print';
import { cb, cbT } from './lang';
import {
  COLS_DEFAULT, COLS_MAX, COLS_MIN, CONTENT_MODES, CONTENT_MODE_LABEL, FONTS, FONT_ACCEPT, FONT_DEFAULT,
  GAP_DEFAULT, GAP_MAX, GAP_MIN, GAP_STEP, GRID_STYLES, GRID_STYLE_LABEL, LINE_COLORS, LINE_COLOR_LABEL,
  MAX_FONT_BYTES, PAGES_DEFAULT, PAGES_MAX, PAGES_MIN, ROWS_DEFAULT, ROWS_MAX, ROWS_MIN, TEXT_DEFAULT,
  TEXT_MAX, TITLE_DEFAULT,
  type ContentMode, type GridStyle, type LineColor,
} from './data';
import {
  buildSheetCss, buildSheetHtml, buildSheetPages, cellSizeMm, cellsPerPage, defaultGridOf, fillChars,
  fontFamilyOf, fontStack, getDefaultCols, getDefaultFont, getDefaultGap, getDefaultLine, getDefaultLoop,
  getDefaultMode, getDefaultPages, getDefaultRows, getDefaultStyle, getDefaultText, splitChars, totalCells,
  type CopybookText,
} from './lib';
import CopybookGeneratorIntro from './intro';

const { Text } = Typography;

/** A4 预览缩放比 */
const SCALE = 0.42;
const PREVIEW_W = Math.round(794 * SCALE);
const PREVIEW_H = Math.round(1123 * SCALE);

const today = (): string => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const CopybookGenerator: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => cb(locale, zh);
  const tT = (zh: string, v: Record<string, string | number>) => cbT(locale, zh, v);
  const { token } = theme.useToken();

  const [ style, setStyle ] = useState<GridStyle>(() => getDefaultStyle());
  const [ font, setFont ] = useState<string>(() => getDefaultFont());
  const [ line, setLine ] = useState<LineColor>(() => getDefaultLine());
  const [ mode, setMode ] = useState<ContentMode>(() => getDefaultMode());
  const [ cols, setCols ] = useState<number>(() => getDefaultCols());
  const [ rows, setRows ] = useState<number>(() => getDefaultRows());
  const [ pages, setPages ] = useState<number>(() => getDefaultPages());
  const [ gap, setGap ] = useState<number>(() => getDefaultGap());
  const [ text, setText ] = useState<string>(() => getDefaultText() || TEXT_DEFAULT);
  const [ loop, setLoop ] = useState<boolean>(() => getDefaultLoop());
  const [ title, setTitle ] = useState(TITLE_DEFAULT);
  const [ showMeta, setShowMeta ] = useState(true);
  const [ custom, setCustom ] = useState<{ name: string; data: string } | null>(null);

  const per = cellsPerPage(cols, rows);
  const chars = useMemo(() => splitChars(text), [ text ]);
  const filled = useMemo(() => fillChars(chars, totalCells(cols, rows, pages), loop), [ chars, cols, rows, pages, loop ]);

  /** 打印文案 (按当前语言组装) */
  const sheetText: CopybookText = useMemo(() => ({
    styleName: t(GRID_STYLE_LABEL[style]),
    fontName: custom ? custom.name : t(font),
    meta: t('姓名: ________ 日期: ________'),
    footer: t('第 {a} / {b} 页 · {d}'),
  }), [ locale, style, font, custom ]);

  const css = useMemo(() => buildSheetCss(custom), [ custom ]);

  const options = useMemo(() => ({
    style,
    line,
    mode,
    cols,
    rows,
    pages,
    gap,
    chars: filled,
    title,
    showMeta,
    date: today(),
    fontFamily: fontStack(font, custom !== null),
    text: sheetText,
  }), [ style, line, mode, cols, rows, pages, gap, filled, title, showMeta, sheetText, font, custom ]);

  const previewPages = useMemo(() => buildSheetPages(options), [ options ]);

  /** 切换格型: 若当前行列数正好等于原格型默认值, 则套用新格型的默认值 */
  const onStyleChange = (next: GridStyle) => {
    const prevDefault = defaultGridOf(style);
    const nextDefault = defaultGridOf(next);
    if (cols === prevDefault.cols && rows === prevDefault.rows) {
      setCols(nextDefault.cols);
      setRows(nextDefault.rows);
    }
    setStyle(next);
  };

  /** 读取自定义字体 (data URL, 供 @font-face 内嵌到预览与打印页) */
  const onFontFile = (file: File) => {
    if (file.size > MAX_FONT_BYTES) { message.error(t('字体文件过大 (上限 12MB)')); return; }
    const reader = new FileReader();
    reader.onerror = () => message.error(t('字体读取失败'));
    reader.onload = () => {
      const data = String(reader.result ?? '');
      setCustom({ name: file.name, data });
      message.success(tT('已载入自定义字体: {name}', { name: file.name }));
    };
    reader.readAsDataURL(file);
  };

  const onPrint = () => {
    const ok = printHtml(buildSheetHtml(options), { title: title || TITLE_DEFAULT, css });
    if (!ok) message.error(t('打印失败: 当前环境不支持打印'));
    else message.success(t('已打开打印对话框, 选择打印机即可打印'));
  };

  const statTag = (label: string, value: string) => (
    <Tag key={ label } style={ { marginInlineEnd: 0 } }>
      <Text type="secondary" style={ { fontSize: 12 } }>{ label }</Text>
      <span style={ { marginLeft: 6, fontFamily: 'ui-monospace, Menlo, Consolas, monospace' } }>{ value }</span>
    </Tag>
  );

  return (
    <>
      <style>{ css }</style>

      {/* 顶部操作栏 */}
      <div style={ { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 } }>
        <Space wrap>
          <Button size="small" type="primary" icon={ <PrinterOutlined /> } onClick={ onPrint }>{ t('打印 A4') }</Button>
        </Space>
        <Space wrap>
          { statTag(t('格子样式'), t(GRID_STYLE_LABEL[style])) }
          { statTag(t('字体'), custom ? custom.name : t(font)) }
          { statTag(t('页数'), `${pages}`) }
          { statTag(t('文本'), `${chars.length}`) }
        </Space>
      </div>

      <Divider style={ { margin: '12px 0' } }>{ t('字帖设置') }</Divider>

      <div style={ { display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 920, marginBottom: 8 } }>
        {/* 文本放在最上面: 打开工具第一件事就是填要练的内容 */}
        <div style={ { display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto', lineHeight: '32px' } }>{ t('文本') }</Text>
          <Input.TextArea
            value={ text }
            onChange={ (e) => setText(e.target.value) }
            maxLength={ TEXT_MAX }
            autoSize={ { minRows: 2, maxRows: 4 } }
            style={ { width: 420 } }
            placeholder={ TEXT_DEFAULT }
          />
          <div style={ { display: 'flex', flexDirection: 'column', gap: 4 } }>
            <Space size={ 8 }>
              <Text style={ { fontSize: 12 } }>{ t('循环填充') }</Text>
              <Switch size="small" checked={ loop } onChange={ setLoop } />
            </Space>
            <Text type="secondary" style={ { fontSize: 12 } }>{ tT('共 {n} 格 · {c} 字', { n: totalCells(cols, rows, pages), c: chars.length }) }</Text>
          </div>
        </div>

        <Text type="secondary" style={ { fontSize: 12 } }>{ t('文本会按空格 / 标点自动逐字拆分, 不足时循环填充 (可关闭)') }</Text>

        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('格子样式') }</Text>
          <Segmented
            value={ style }
            onChange={ (v) => onStyleChange(v as GridStyle) }
            options={ GRID_STYLES.map((s) => ({ value: s, label: t(GRID_STYLE_LABEL[s]) })) }
          />
        </div>

        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('字体') }</Text>
          <Select
            style={ { width: 180 } }
            value={ font }
            onChange={ setFont }
            options={ FONTS.map((f) => ({ value: f.label, label: t(f.label), style: { fontFamily: f.family } })) }
          />
          <Upload
            accept={ FONT_ACCEPT }
            showUploadList={ false }
            beforeUpload={ (f) => { onFontFile(f as File); return false; } }
          >
            <Button size="small" icon={ <UploadOutlined /> }>{ t('上传字体') }</Button>
          </Upload>
          { custom ? (
            <Space size={ 4 }>
              <Text code style={ { fontSize: 12 } }>{ custom.name }</Text>
              <Button size="small" type="text" icon={ <DeleteOutlined /> } onClick={ () => setCustom(null) } title={ t('移除自定义字体') } />
            </Space>
          ) : null }
          <Text type="secondary" style={ { fontSize: 12 } }>{ t('可上传 ttf / otf / woff / woff2 字体文件, 仅在本地使用, 不会上传') }</Text>
        </div>

        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('内容模式') }</Text>
          <Segmented
            value={ mode }
            onChange={ (v) => setMode(v as ContentMode) }
            options={ CONTENT_MODES.map((m) => ({ value: m, label: t(CONTENT_MODE_LABEL[m]) })) }
          />
          <Text type="secondary" style={ { fontSize: 12 } }>{ t('浅灰色为描红字, 可沿格线描写; 深色为范字') }</Text>
        </div>

        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('格线颜色') }</Text>
          <Segmented
            value={ line }
            onChange={ (v) => setLine(v as LineColor) }
            options={ LINE_COLORS.map((c) => ({ value: c, label: t(LINE_COLOR_LABEL[c]) })) }
          />
        </div>

        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('每行格数') }</Text>
          <InputNumber
            min={ COLS_MIN }
            max={ COLS_MAX }
            value={ cols }
            style={ { width: 100 } }
            onChange={ (v) => setCols(Number(v ?? COLS_DEFAULT)) }
          />
          <Text style={ { flex: '0 0 auto' } }>{ t('每页行数') }</Text>
          <InputNumber
            min={ ROWS_MIN }
            max={ ROWS_MAX }
            value={ rows }
            style={ { width: 100 } }
            onChange={ (v) => setRows(Number(v ?? ROWS_DEFAULT)) }
          />
          <Text style={ { flex: '0 0 auto' } }>{ t('页数') }</Text>
          <InputNumber
            min={ PAGES_MIN }
            max={ PAGES_MAX }
            value={ pages }
            style={ { width: 100 } }
            onChange={ (v) => setPages(Number(v ?? PAGES_DEFAULT)) }
          />
          <Text style={ { flex: '0 0 auto' } }>{ t('格间距') }</Text>
          <InputNumber
            min={ GAP_MIN }
            max={ GAP_MAX }
            step={ GAP_STEP }
            value={ gap }
            style={ { width: 110 } }
            addonAfter="mm"
            onChange={ (v) => setGap(Number(v ?? GAP_DEFAULT)) }
          />
          <Text type="secondary" style={ { fontSize: 12 } }>{ tT('每格 {cell}mm · 每页 {n} 格', { cell: cellSizeMm(cols, rows, gap), n: per }) }</Text>
        </div>

        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('标题') }</Text>
          <Input
            value={ title }
            onChange={ (e) => setTitle(e.target.value) }
            maxLength={ 30 }
            style={ { width: 220 } }
            placeholder={ TITLE_DEFAULT }
          />
          <Text style={ { flex: '0 0 auto' } }>{ t('显示姓名 / 日期栏') }</Text>
          <Switch checked={ showMeta } onChange={ setShowMeta } />
        </div>
      </div>

      <Divider style={ { margin: '12px 0' } }>{ t('打印预览 (A4)') }</Divider>

      <div style={ { display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' } }>
        { previewPages.map((html, i) => (
          <div
            key={ i }
            style={ {
              width: PREVIEW_W,
              height: PREVIEW_H,
              overflow: 'hidden',
              background: '#fff',
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: token.borderRadius,
              boxShadow: token.boxShadowTertiary,
            } }
          >
            <div
              style={ { width: '210mm', height: '297mm', transform: `scale(${SCALE})`, transformOrigin: 'top left' } }
              dangerouslySetInnerHTML={ { __html: html } }
            />
          </div>
        )) }
      </div>

      <Divider>{ t('字帖生成器说明') }</Divider>
      <CopybookGeneratorIntro />
    </>
  );
};

export default CopybookGenerator;
