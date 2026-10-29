// 格子纸: A3 / A4 / B5 / B6 的方格纸 · 点阵纸 · 横线纸, 可调格子大小与线色, 一键打印
import { Alert, Button, Divider, InputNumber, Segmented, Space, Tag, Typography, message, theme } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { useLocale } from '../../hook/locale-context';
import { printHtml } from '../../lib/print';
import { gp, gpT } from './lang';
import {
  CELL_MAX, CELL_MIN, CELL_PRESETS, CELL_STEP, INK_COLORS, INK_LABEL, LINE_MAX, LINE_MIN, LINE_STEP,
  MAJOR_MAX, MAJOR_MIN, MARGIN_MAX, MARGIN_MIN, MARGIN_STEP, ORIENTATIONS, ORIENTATION_LABEL, PAGES_MAX, PAGES_MIN,
  PAPERS, PATTERNS, PATTERN_LABEL, TITLE_DEFAULT,
  type GridOptions, type InkColor, type Orientation, type PaperId, type Pattern,
} from './data';
import {
  buildDocumentCss, buildDocumentHtml, buildPageSvgs, documentName, getDefaultOptions, layoutOf,
  setDefaultOptions, type PageLayout,
} from './lib';
import GridPaperIntro from './intro';

const { Text } = Typography;

/** mm → CSS px (96dpi), 仅用于预览缩放 */
const MM_PX = 96 / 25.4;
/** 预览尺寸上限 (px) */
const PREVIEW_MAX_W = 380;
const PREVIEW_MAX_H = 520;
const PREVIEW_MAX_SCALE = 0.6;

/** 预览缩放比: 让整页纸在预览区里放得下 (横竖两个方向都要满足) */
const previewScale = (layout: PageLayout): number => Math.min(
  PREVIEW_MAX_W / (layout.w * MM_PX),
  PREVIEW_MAX_H / (layout.h * MM_PX),
  PREVIEW_MAX_SCALE,
);

const GridPaper: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => gp(locale, zh);
  const tT = (zh: string, v: Record<string, string | number>) => gpT(locale, zh, v);
  const { token } = theme.useToken();

  const [ opts, setOpts ] = useState<GridOptions>(() => getDefaultOptions());
  const patch = (p: Partial<GridOptions>) => setOpts((prev) => ({ ...prev, ...p }));

  // 记住上次使用的参数 (下次打开沿用)
  useEffect(() => { setDefaultOptions(opts); }, [ opts ]);

  const layout = useMemo(() => layoutOf(opts), [ opts ]);
  const pages = useMemo(() => buildPageSvgs(opts), [ opts ]);
  const scale = previewScale(layout);

  const onPrint = () => {
    const ok = printHtml(buildDocumentHtml(opts), {
      title: documentName(opts, t(TITLE_DEFAULT)),
      css: buildDocumentCss(opts),
    });
    if (!ok) message.error(t('打印失败: 当前环境不支持打印'));
    else message.success(t('已打开打印对话框, 选择打印机即可打印'));
  };

  const statTag = (label: string, value: string) => (
    <Tag key={ label } style={ { marginInlineEnd: 0 } }>
      <Text type="secondary" style={ { fontSize: 12 } }>{ label }</Text>
      <span style={ { marginLeft: 6, fontFamily: 'ui-monospace, Menlo, Consolas, monospace' } }>{ value }</span>
    </Tag>
  );

  const row = (label: string, children: React.ReactNode) => (
    <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
      <Text style={ { width: 88, flex: '0 0 auto' } }>{ label }</Text>
      { children }
    </div>
  );

  return (
    <>
      {/* 顶部操作栏 */}
      <div style={ { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 } }>
        <Space wrap>
          <Button size="small" type="primary" icon={ <PrinterOutlined /> } onClick={ onPrint }>
            { tT('打印 {p}', { p: opts.paper }) }
          </Button>
        </Space>
        <Space wrap>
          { statTag(t('纸张'), opts.paper) }
          { statTag(t('每页格子'), `${layout.cols} × ${layout.rows}`) }
          { statTag(t('总页数'), String(opts.pages)) }
        </Space>
      </div>

      <Divider style={ { margin: '12px 0' } }>{ t('纸张设置') }</Divider>

      <div style={ { display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 920, marginBottom: 8 } }>
        { row(t('纸张'), (
          <Segmented
            value={ opts.paper }
            onChange={ (v) => patch({ paper: v as PaperId }) }
            options={ PAPERS.map((p) => ({ value: p.id, label: p.label })) }
          />
        )) }

        { row(t('方向'), (
          <Segmented
            value={ opts.orientation }
            onChange={ (v) => patch({ orientation: v as Orientation }) }
            options={ ORIENTATIONS.map((o) => ({ value: o, label: t(ORIENTATION_LABEL[o]) })) }
          />
        )) }

        { row(t('格型'), (
          <Segmented
            value={ opts.pattern }
            onChange={ (v) => patch({ pattern: v as Pattern }) }
            options={ PATTERNS.map((p) => ({ value: p, label: t(PATTERN_LABEL[p]) })) }
          />
        )) }

        { row(t('格子大小'), (
          <>
            <InputNumber
              min={ CELL_MIN }
              max={ CELL_MAX }
              step={ CELL_STEP }
              value={ opts.cell }
              style={ { width: 110 } }
              suffix="mm"
              onChange={ (v) => patch({ cell: Number(v ?? opts.cell) }) }
            />
            <Text type="secondary" style={ { fontSize: 12 } }>{ t('常用') }</Text>
            <Segmented
              value={ CELL_PRESETS.includes(opts.cell) ? opts.cell : -1 }
              onChange={ (v) => patch({ cell: Number(v) }) }
              options={ CELL_PRESETS.map((c) => ({ value: c, label: `${c}mm` })) }
            />
            <Text type="secondary" style={ { fontSize: 12 } }>{ t('5mm 适合工程笔记, 3mm 更密适合密集型笔记, 8 / 10mm 适合草图') }</Text>
          </>
        )) }

        { row(t('页边距'), (
          <InputNumber
            min={ MARGIN_MIN }
            max={ MARGIN_MAX }
            step={ MARGIN_STEP }
            value={ opts.margin }
            style={ { width: 110 } }
            suffix="mm"
            onChange={ (v) => patch({ margin: Number(v ?? opts.margin) }) }
          />
        )) }

        { row(t('线宽'), (
          <InputNumber
            min={ LINE_MIN }
            max={ LINE_MAX }
            step={ LINE_STEP }
            value={ opts.lineWidth }
            style={ { width: 110 } }
            suffix="mm"
            onChange={ (v) => patch({ lineWidth: Number(v ?? opts.lineWidth) }) }
          />
        )) }

        { row(t('线色'), (
          <Segmented
            value={ opts.ink }
            onChange={ (v) => patch({ ink: v as InkColor }) }
            options={ INK_COLORS.map((c) => ({ value: c, label: t(INK_LABEL[c]) })) }
          />
        )) }

        { row(t('页数'), (
          <InputNumber
            min={ PAGES_MIN }
            max={ PAGES_MAX }
            value={ opts.pages }
            style={ { width: 110 } }
            onChange={ (v) => patch({ pages: Number(v ?? opts.pages) }) }
          />
        )) }

        { row(t('加粗间隔'), (
          <>
            <InputNumber
              min={ MAJOR_MIN }
              max={ MAJOR_MAX }
              value={ opts.major }
              style={ { width: 110 } }
              onChange={ (v) => patch({ major: Number(v ?? opts.major) }) }
            />
            <Text type="secondary" style={ { fontSize: 12 } }>
              { t('加粗间隔为 0 表示不加粗; 设为 N 时每 N 格加深一条线, 方便分块书写') }
            </Text>
          </>
        )) }

        <Text type="secondary" style={ { fontSize: 12 } }>
          { tT('格子 {c}mm · 每页 {cols} × {rows} = {n} 格', {
            c: opts.cell, cols: layout.cols, rows: layout.rows, n: layout.count,
          }) }
        </Text>
      </div>

      <Divider style={ { margin: '12px 0' } }>{ tT('打印预览 ({p})', { p: opts.paper }) }</Divider>

      <Alert
        type="info"
        showIcon
        style={ { marginBottom: 12, maxWidth: 920 } }
        message={ tT('打印时请把纸张设为 {p}, 缩放保持 100% (实际大小), 否则格子边长会不准', { p: opts.paper }) }
      />

      <div style={ { display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' } }>
        { pages.map((svg, i) => (
          <div
            key={ i }
            data-testid={ i === 0 ? 'gridpaper-preview' : undefined }
            style={ {
              width: Math.round(layout.w * MM_PX * scale),
              height: Math.round(layout.h * MM_PX * scale),
              overflow: 'hidden',
              background: '#fff',
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: token.borderRadius,
              boxShadow: token.boxShadowTertiary,
            } }
          >
            <div
              style={ {
                width: `${layout.w}mm`,
                height: `${layout.h}mm`,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              } }
              dangerouslySetInnerHTML={ { __html: svg } }
            />
          </div>
        )) }
      </div>

      <Divider>{ t('格子纸说明') }</Divider>
      <GridPaperIntro />
    </>
  );
};

export default GridPaper;
