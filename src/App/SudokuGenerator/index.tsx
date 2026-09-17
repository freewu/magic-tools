// 数独生成器: 4 / 6 / 9 宫格 · 高/中/低三档难度 · A4 排版打印 (答案红色)
import { Button, Divider, Input, InputNumber, Segmented, Space, Switch, Tag, Typography, message, theme } from 'antd';
import { PrinterOutlined, ReloadOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { useLocale } from '../../hook/locale-context';
import { printHtml } from '../../lib/print';
import { sd, sdT } from './lang';
import {
  DIFFICULTIES, GRID_SIZES, PAGES_DEFAULT, PAGES_MAX, PAGES_MIN, PER_PAGE, PRINT_MODES, TITLE_DEFAULT,
  difficultyLabel, sizeLabel, type Difficulty, type GridSize, type PrintMode,
} from './data';
import {
  SHEET_CSS, buildSheetHtml, buildSheetPages, cellMm, generatePuzzles, getDefaultDifficulty, getDefaultMode,
  getDefaultPages, getDefaultSize, gridSideMm, randomSeed, type Puzzle, type SheetOptions, type SheetText,
} from './lib';
import SudokuGeneratorIntro from './intro';

const { Text } = Typography;

/** A4 预览缩放比 (210mm ≈ 794px, 297mm ≈ 1123px) */
const SCALE = 0.42;
const PREVIEW_W = Math.round(794 * SCALE);
const PREVIEW_H = Math.round(1123 * SCALE);

const today = (): string => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const SudokuGenerator: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => sd(locale, zh);
  const tT = (zh: string, v: Record<string, string | number>) => sdT(locale, zh, v);
  const { token } = theme.useToken();

  const [ size, setSize ] = useState<GridSize>(() => getDefaultSize());
  const [ difficulty, setDifficulty ] = useState<Difficulty>(() => getDefaultDifficulty());
  const [ pages, setPages ] = useState<number>(() => getDefaultPages());
  const [ mode, setMode ] = useState<PrintMode>(() => getDefaultMode());
  const [ title, setTitle ] = useState(TITLE_DEFAULT);
  const [ showMeta, setShowMeta ] = useState(true);
  const [ seed, setSeed ] = useState<number>(() => randomSeed());
  const [ puzzles, setPuzzles ] = useState<Puzzle[]>([]);
  const [ busy, setBusy ] = useState(false);
  const [ ms, setMs ] = useState(0);

  const count = pages * PER_PAGE[size];

  // 参数变化即重新出题 (放在 setTimeout 中, 先让「生成中」状态渲染出来)
  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    const timer = setTimeout(() => {
      const t0 = Date.now();
      const list = generatePuzzles(size, difficulty, count, seed);
      if (cancelled) return;
      setPuzzles(list);
      setMs(Date.now() - t0);
      setBusy(false);
    }, 0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [ size, difficulty, count, seed ]);

  /** 打印文案 (按当前语言组装, 传给 lib 生成 HTML) */
  const text: SheetText = useMemo(() => ({
    size: t(sizeLabel(size)),
    difficulty: t(difficultyLabel(difficulty)),
    answer: t('答案'),
    question: t('第 {n} 题'),
    meta: t('姓名: ____________ 日期: ____________ 用时: ______ 分'),
    footer: t('第 {a} / {b} 页 · {d}'),
  }), [ locale, size, difficulty ]);

  const sheet: SheetOptions = useMemo(() => ({
    size, difficulty, puzzles, mode, title, showMeta, date: today(), text,
  }), [ size, difficulty, puzzles, mode, title, showMeta, text ]);

  const previewPages = useMemo(() => buildSheetPages(sheet), [ sheet ]);

  const clueRange = useMemo(() => {
    if (puzzles.length === 0) return null;
    const list = puzzles.map((p) => p.clues);
    return { min: Math.min(...list), max: Math.max(...list) };
  }, [ puzzles ]);

  const onPrint = () => {
    if (puzzles.length === 0) return;
    const ok = printHtml(buildSheetHtml(sheet), { title: title || TITLE_DEFAULT, css: SHEET_CSS });
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
      <style>{ SHEET_CSS }</style>

      {/* 顶部操作栏 */}
      <div style={ { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 } }>
        <Space wrap>
          <Button
            size="small"
            icon={ <ReloadOutlined /> }
            loading={ busy }
            onClick={ () => setSeed(randomSeed()) }
          >
            { t('重新生成') }
          </Button>
          <Button size="small" type="primary" icon={ <PrinterOutlined /> } onClick={ onPrint } disabled={ puzzles.length === 0 }>
            { t('打印') }
          </Button>
        </Space>
        <Space wrap>
          { busy ? <Tag color="processing">{ t('生成中…') }</Tag> : statTag(t('页数'), String(pages)) }
          { statTag(t('宫格'), t(sizeLabel(size))) }
          { statTag(t('难度'), t(difficultyLabel(difficulty))) }
          { clueRange ? statTag(t('提示数'), `${clueRange.min} ~ ${clueRange.max}`) : null }
          { ms > 0 && !busy ? statTag(t('耗时'), `${ms} ms`) : null }
        </Space>
      </div>

      <Divider style={ { margin: '12px 0' } }>{ t('数独设置') }</Divider>

      <div style={ { display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 900, marginBottom: 8 } }>
        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('宫格') }</Text>
          <Segmented
            value={ size }
            onChange={ (v) => setSize(Number(v) as GridSize) }
            options={ GRID_SIZES.map((s) => ({ value: s, label: t(sizeLabel(s)) })) }
          />
          <Text type="secondary" style={ { fontSize: 12 } }>{ tT('每页 {n} 题', { n: PER_PAGE[size] }) }</Text>
        </div>

        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('难度') }</Text>
          <Segmented
            value={ difficulty }
            onChange={ (v) => setDifficulty(v as Difficulty) }
            options={ DIFFICULTIES.map((d) => ({ value: d, label: t(difficultyLabel(d)) })) }
          />
          <Text type="secondary" style={ { fontSize: 12 } }>{ t('所有题目均为唯一解; 提示数越少难度越高') }</Text>
        </div>

        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('页数') }</Text>
          <InputNumber
            min={ PAGES_MIN }
            max={ PAGES_MAX }
            value={ pages }
            onChange={ (v) => setPages(Number(v ?? PAGES_DEFAULT)) }
            style={ { width: 120 } }
          />
          <Text type="secondary" style={ { fontSize: 12 } }>{ tT('共生成 {n} 道题 · {p} 页', { n: count, p: pages }) }</Text>
        </div>

        <div style={ { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }>
          <Text style={ { width: 96, flex: '0 0 auto' } }>{ t('打印内容') }</Text>
          <Segmented
            value={ mode }
            onChange={ (v) => setMode(v as PrintMode) }
            options={ PRINT_MODES.map((m) => ({
              value: m,
              label: t(m === 'puzzle' ? '仅题目' : m === 'answer' ? '仅答案 (红色)' : '题目 + 答案'),
            })) }
          />
          <Text type="secondary" style={ { fontSize: 12 } }>{ t('红色数字为答案, 黑色为题目原有提示数') }</Text>
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

        <Text type="secondary" style={ { fontSize: 12 } }>
          { t('浏览器/WebView 打印时可选择打印机, 也可「另存为 PDF」') }
          { ` · ` }
          { tT('宫格 {side}mm · 单格 {cell}mm', { side: gridSideMm(size), cell: cellMm(size) }) }
        </Text>
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
        { previewPages.length === 0 ? <Text type="secondary">{ t('生成中…') }</Text> : null }
      </div>

      <Divider>{ t('数独生成器说明') }</Divider>
      <SudokuGeneratorIntro />
    </>
  );
};

export default SudokuGenerator;
