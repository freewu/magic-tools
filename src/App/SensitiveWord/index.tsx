// 敏感词检测: 粘贴文案即自动检测, 内置「通用 / 小红书 / 微信公众号」三个词库与替换建议,
// 另可按分类勾选外部扩展词库 (Sensitive-lexicon, 涉政 / 涉恐 / 涉黄 ...), 与「通用」词库融合检查
import { Alert, AutoComplete, Button, Card, Collapse, Divider, Empty, Input, Radio, Select, Space, Spin, Switch, Table, Tabs, Tag, Tooltip, Typography, message, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ClearOutlined, CopyOutlined, DownloadOutlined, LinkOutlined, ReloadOutlined } from '@ant-design/icons';
import { useLocale } from '../../hook/locale-context';
import { u, uT } from './lang';
import {
  BANK_KEYS, BANK_LABELS, LEVEL_COLOR, LEVEL_DESC, LEVEL_LABELS, LEVEL_ORDER,
  MASK_CHAR_OPTIONS, SAMPLE_TEXT, SENSITIVE_BANKS,
  type BankKey, type Level, type WordMeta,
} from './data';
import {
  fuseScans, getSettings, highlightParts, lineCol, maskCharInput, maskedFileName, maskStats, maskedParts,
  maskText, normalizeMaskChar, reportFileName, reportText, scanText, scanWords, textLength,
  type BankScan, type Hit, type ReportGroup, type ScanRow,
} from './lib';
import {
  LEXICON_BUILT_AT, LEXICON_CATEGORIES, LEXICON_MAP, LEXICON_SOURCE, LEXICON_TOTAL,
  loadLexiconWords, type LexKey,
} from './lexicon';
import { openUrl, saveTextFile } from '../../lib/tauri';
import SensitiveWordIntro from './intro';

const { Text } = Typography;

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/** 等级筛选值 */
type LevelFilter = 'all' | Level;

/** 命中明细行 (融合扩展词库时, 扩展行多一列分类) */
type HitRow = ScanRow;

/** 命中高亮底色 (深浅色主题下都清晰) */
const MARK_BG: Record<Level, string> = {
  high: 'rgba(255, 77, 79, 0.34)',
  mid: 'rgba(250, 140, 22, 0.34)',
  low: 'rgba(250, 219, 20, 0.42)',
};

/** 扩展词库某等级的词条数 (下拉分组标题用) */
const lexCountOf = (level: Level): number => LEXICON_CATEGORIES
  .filter((c) => c.level === level)
  .reduce((n, c) => n + c.count, 0);

const SensitiveWord = () => {
  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tT = (zh: string, vars: Record<string, string | number>) => uT(locale, zh, vars);
  const { token } = theme.useToken();

  // 初始值来自设置中心 (工具页可临时改, 不回写)
  const [ settings ] = useState(() => getSettings());
  const [ text, setText ] = useState('');
  const [ bank, setBank ] = useState<BankKey>(settings.bank);
  const [ level, setLevel ] = useState<LevelFilter>('all');
  const [ loose, setLoose ] = useState(settings.loose);
  const [ latinBoundary, setLatinBoundary ] = useState(settings.latinBoundary);
  const [ maskChar, setMaskChar ] = useState(settings.maskChar);
  // 扩展词库 (Sensitive-lexicon): 按分类勾选, 勾选后才动态加载解码
  const [ lexKeys, setLexKeys ] = useState<LexKey[]>([]);
  const [ lexBanks, setLexBanks ] = useState<Partial<Record<LexKey, WordMeta[]>>>({});
  const [ lexLoading, setLexLoading ] = useState(false);
  const [ lexError, setLexError ] = useState('');

  const copySeq = useRef(0);

  /** 检测结果 (纯函数, 文本 / 选项变化即重算) */
  const scans = useMemo(
    () => scanText(text, { loose, latinBoundary }),
    [ text, loose, latinBoundary ]
  );

  /** 扩展词库检测结果 (只算已解码的分类) */
  const lexScans = useMemo(() => {
    const out: Partial<Record<LexKey, BankScan>> = {};
    lexKeys.forEach((key) => {
      const bank = lexBanks[key];
      if (bank) out[key] = scanWords(text, key, bank, { loose, latinBoundary });
    });
    return out;
  }, [ text, lexKeys, lexBanks, loose, latinBoundary ]);

  /** 已勾选且有结果的分类 (按勾选顺序) */
  const lexGroups = useMemo(() => lexKeys.flatMap((key) => {
    const scan = lexScans[key];
    return scan ? [ { key, scan } ] : [];
  }), [ lexKeys, lexScans ]);

  /** 命中 -> 所属分类 (高亮预览的悬停提示用) */
  const lexHitCategory = useMemo(() => {
    const map = new Map<Hit, LexKey>();
    lexGroups.forEach(({ key, scan }) => { scan.hits.forEach((hit) => map.set(hit, key)); });
    return map;
  }, [ lexGroups ]);

  const lexHits = useMemo(() => lexGroups.flatMap(({ scan }) => scan.hits), [ lexGroups ]);
  const lexHitTotal = lexGroups.reduce((n, { scan }) => n + scan.total, 0);
  const lexWordTotal = lexGroups.reduce((n, { scan }) => n + scan.words.length, 0);

  /** 已勾选扩展词库分类的扫描结果 (检测报告 / 融合检查共用) */
  const extraGroups = useMemo<ReportGroup[]>(
    () => lexGroups.map(({ key, scan }) => ({ key, label: LEXICON_MAP[key].label, scan })),
    [ lexGroups ]
  );

  /**
   * 融合检查: 「通用」页签把已勾选的扩展词库分类一起算进来
   * (命中明细合并、扩展行标注分类, 等级计数与命中处数同步叠加)
   */
  const commonView = useMemo(() => fuseScans(scans.common, extraGroups), [ scans, extraGroups ]);

  /** 命中所属的扩展词库分类名 (高亮预览的悬停提示用) */
  const categoryLabel = (hit: Hit): string | undefined => {
    const key = lexHitCategory.get(hit);
    return key ? t(LEXICON_MAP[key].label) : undefined;
  };

  /**
   * 勾选扩展词库分类: 首次勾选某分类时才动态 import 词库文件并解码
   * (词表经 XOR + Base64 编码存放, 不勾选就不加载, 避免拖慢工具页)
   */
  const onLexKeysChange = (keys: LexKey[]) => {
    setLexKeys(keys);
    const missing = keys.filter((key) => !lexBanks[key]);
    if (missing.length === 0) return;
    setLexLoading(true);
    setLexError('');
    loadLexiconWords(missing)
      .then((banks) => { setLexBanks((prev) => ({ ...prev, ...banks })); })
      .catch((e) => { setLexError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { setLexLoading(false); });
  };

  /** 打码按「通用」词库 (两个平台的并集) + 已勾选的扩展词库分类处理, 避免漏词 */
  const maskHits = useMemo(() => [ ...scans.common.hits, ...lexHits ], [ scans, lexHits ]);

  /** 复制到剪贴板 (桌面端 WebView 可能没有权限, 失败时给出提示) */
  const copy = useCallback(async (value: string, okMsg: string) => {
    const seq = ++copySeq.current;
    try {
      await navigator?.clipboard?.writeText(value);
      if (seq === copySeq.current) message.success(okMsg);
    } catch {
      if (seq === copySeq.current) message.warning(t('复制失败, 请手动选择复制'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ locale ]);

  /** 检测报告正文 (含已勾选的扩展词库分类) */
  const reportContent = () => reportText(text, scans, { loose, latinBoundary }, new Date(), extraGroups);

  const onSave = async (kind: 'masked' | 'report') => {
    const masked = kind === 'masked';
    const name = masked ? maskedFileName() : reportFileName();
    const content = masked ? maskText(text, maskHits, maskChar) : reportContent();
    try {
      const ok = await saveTextFile(name, content, t(masked ? '保存打码文本' : '保存检测报告'), {
        filterName: t('文本文件'), extensions: [ 'txt' ],
      });
      if (ok) message.success(tT('已保存 {file}', { file: name }));
    } catch (e) {
      message.error(tT('保存失败: {msg}', { msg: e instanceof Error ? e.message : String(e) }));
    }
  };

  /** 等额命中的等级统计标签 */
  const levelTags = (counts: Record<Level, number>) => LEVEL_ORDER
    .filter((lv) => counts[lv] > 0)
    .map((lv) => (
      <Tag key={ lv } color={ LEVEL_COLOR[lv] } style={ { marginInlineEnd: 0 } }>
        { `${t(LEVEL_LABELS[lv])} ${counts[lv]}` }
      </Tag>
    ));

  /** 预览区外框 (高亮预览 / 打码预览共用) */
  const PREVIEW_BOX: CSSProperties = {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontFamily: MONO,
    fontSize: 13,
    lineHeight: 1.7,
    maxHeight: 200,
    overflow: 'auto',
    padding: '8px 10px',
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadius,
    background: token.colorFillQuaternary,
  };

  /** 命中高亮预览 (扩展词库的预览会在悬停提示里带上分类) */
  const previewNode = (hits: Hit[], categoryOf?: (hit: Hit) => string | undefined) => (
    <div className="sw-preview" style={ PREVIEW_BOX }>
      { highlightParts(text, hits).map((part, i) => (part.hit
        ? (
          <mark
            key={ i }
            className={ `sw-mark sw-mark-${part.hit.level}` }
            title={ [ part.hit.word, categoryOf?.(part.hit), t(LEVEL_LABELS[part.hit.level]), part.hit.tip ].filter(Boolean).join(' · ') }
            style={ { background: MARK_BG[part.hit.level], color: 'inherit', padding: 0, borderRadius: 2 } }
          >
            { part.text }
          </mark>
        )
        : <span key={ i }>{ part.text }</span>)) }
    </div>
  );

  /** 打码效果预览: 被打码的片段标成高亮块, 悬停可看原词 */
  const maskPreviewNode = () => {
    const parts = maskedParts(text, maskHits, maskChar);
    const stat = maskStats(parts);
    if (stat.spots === 0) {
      return <Text type="secondary" style={ { fontSize: 12 } }>{ t('文案里没有命中词库的敏感词, 打码后与原文一致') }</Text>;
    }
    return (
      <>
        <Text>{ tT('打码 {n} 处 / {m} 字', { n: stat.spots, m: stat.chars }) }</Text>
        <div className="sw-preview sw-mask-preview" style={ PREVIEW_BOX }>
          { parts.map((part, i) => (part.hit
            ? (
              <span
                key={ i }
                className={ `sw-mask-fill sw-mask-fill-${part.hit.level}` }
                title={ `${part.hit.word} · ${t(LEVEL_LABELS[part.hit.level])} · ${part.hit.tip}` }
                style={ { background: MARK_BG[part.hit.level], color: 'inherit', borderRadius: 2 } }
              >
                { part.text }
              </span>
            )
            : <span key={ i }>{ part.text }</span>)) }
        </div>
      </>
    );
  };

  /** 命中明细表列 (融合扩展词库时额外带一列「分类」, 内置词条标为内置) */
  const wordColumns = (withCategory = false): ColumnsType<HitRow> => {
    const cols: ColumnsType<HitRow> = [
      {
        title: t('敏感词'),
        dataIndex: 'word',
        width: 180,
        render: (_: unknown, row: HitRow) => (
          <Space size={ 4 }>
            <Text strong style={ { fontFamily: MONO } }>{ row.word }</Text>
            <Tooltip title={ t('点击「复制」按钮可取到该词, 便于批量替换') }>
              <Button
                className="sw-copy-word"
                type="link"
                size="small"
                icon={ <CopyOutlined /> }
                onClick={ () => { void copy(row.word, tT('已复制敏感词 {word}', { word: row.word })); } }
              />
            </Tooltip>
          </Space>
        ),
      },
      {
        title: t('等级'),
        dataIndex: 'level',
        width: 90,
        render: (lv: Level) => (
          <Tooltip title={ t(LEVEL_DESC[lv]) }>
            <Tag color={ LEVEL_COLOR[lv] } style={ { marginInlineEnd: 0 } }>{ t(LEVEL_LABELS[lv]) }</Tag>
          </Tooltip>
        ),
      },
      { title: t('次数'), dataIndex: 'count', width: 70 },
      {
        title: t('位置'),
        dataIndex: 'positions',
        width: 220,
        render: (positions: number[]) => (
          <Text type="secondary" style={ { fontSize: 12 } }>
            { positions.slice(0, 3).map((pos) => {
              const { line, col } = lineCol(text, pos);
              return tT('第 {line} 行第 {col} 字', { line, col });
            }).join(', ') }
            { positions.length > 3 ? ` ${tT('等 {n} 处', { n: positions.length })}` : '' }
          </Text>
        ),
      },
      { title: t('建议替换'), dataIndex: 'tip' },
    ];
    if (!withCategory) return cols;
    return [
      cols[0],
      {
        title: t('分类'),
        dataIndex: 'categoryKey',
        width: 120,
        render: (key?: string) => {
          if (!key) {
            return <Tag style={ { marginInlineEnd: 0 } }>{ t('内置') }</Tag>;
          }
          const category = LEXICON_MAP[key as LexKey];
          return (
            <Tooltip title={ tT('来源: 上游文件 {file}', { file: category?.file ?? '' }) }>
              <Tag style={ { marginInlineEnd: 0 } }>{ t(category?.label ?? key) }</Tag>
            </Tooltip>
          );
        },
      },
      ...cols.slice(1),
    ];
  };

  /** 融合检查: 「通用」页签内的扩展词库选择 (勾选后才动态加载解码) */
  const lexiconPicker = () => (
    <Space direction="vertical" size={ 6 } style={ { width: '100%' } }>
      <Space wrap size={ 8 }>
        <Select
          className="sw-lexicon-select"
          mode="multiple"
          allowClear
          size="small"
          style={ { minWidth: 340, maxWidth: '100%' } }
          placeholder={ t('选择扩展词库分类 (可多选)') }
          value={ lexKeys }
          onChange={ (v: LexKey[]) => onLexKeysChange(v) }
          maxTagCount="responsive"
          optionFilterProp="label"
          options={ LEVEL_ORDER.map((lv) => ({
            label: `${t(LEVEL_LABELS[lv])} ${lexCountOf(lv)}`,
            options: LEXICON_CATEGORIES.filter((c) => c.level === lv).map((c) => ({
              value: c.key,
              label: `${t(c.label)} (${c.count})`,
            })),
          })) }
        />
        <Button className="sw-lexicon-all" size="small" onClick={ () => onLexKeysChange(LEXICON_CATEGORIES.map((c) => c.key)) }>{ t('全选') }</Button>
        <Button className="sw-lexicon-reset" size="small" onClick={ () => onLexKeysChange([]) } disabled={ lexKeys.length === 0 }>{ t('清空选择') }</Button>
        { lexLoading
          ? <Space size={ 6 }><Spin size="small" /><Text type="secondary" style={ { fontSize: 12 } }>{ t('正在解码词表…') }</Text></Space>
          : null }
        <Tooltip title={ t('词库来自开源项目 konsheng/Sensitive-lexicon (MIT), 已按上游文件分类整理, 词表编码存放') }>
          <Button
            className="sw-lexicon-source"
            type="link"
            size="small"
            icon={ <LinkOutlined /> }
            onClick={ () => { void openUrl(LEXICON_SOURCE); } }
          >
            { t('词库来源') }
          </Button>
        </Tooltip>
      </Space>

      <Text type="secondary" style={ { fontSize: 12 } }>
        { tT('扩展词库 (社区词库, 按上游文件分类): {n} 个分类 / 共 {m} 条词条; 勾选后与「通用」词库一起自检, 命中明细多一列「分类」并计入打码与报告; 收录量大且含少量误报, 按需勾选', {
          n: LEXICON_CATEGORIES.length,
          m: LEXICON_TOTAL,
        }) }
      </Text>

      { lexError ? <Alert className="sw-lexicon-error" type="error" showIcon message={ lexError } /> : null }

      { lexKeys.length > 0 ? (
        <Space wrap size={ 8 }>
          <Text>
            { lexHitTotal === 0
              ? t('未命中已选分类')
              : tT('扩展词库命中 {hits} 处 / {words} 个词', { hits: lexHitTotal, words: lexWordTotal }) }
          </Text>
          { lexGroups.filter(({ scan }) => scan.total > 0).map(({ key, scan }) => (
            <Tag key={ key } color={ LEVEL_COLOR[LEXICON_MAP[key].level] } style={ { marginInlineEnd: 0 } }>
              { `${t(LEXICON_MAP[key].label)} ${scan.total}` }
            </Tag>
          )) }
        </Space>
      ) : null }
    </Space>
  );

  /** 词库页签内容: (通用: 扩展词库选择) + 高亮预览 + 等级筛选 + 命中明细 + 词库预览 */
  const bankPanel = (key: BankKey) => {
    const scan = scans[key];
    // 「通用」页签融合已勾选的扩展词库分类, 扩展行在明细表里带分类
    const fused = key === 'common' && extraGroups.length > 0;
    const view = key === 'common' ? commonView : scan;
    const hits = level === 'all' ? view.hits : view.hits.filter((h) => h.level === level);
    const rows = (level === 'all' ? view.words : view.words.filter((w) => w.level === level)) as HitRow[];
    const bankWords: typeof scan.words = [];
    const matched = new Map(scan.words.map((w) => [ w.word.toLowerCase(), w ]));
    SENSITIVE_BANKS[key].forEach((meta) => {
      const stat = matched.get(meta.word.toLowerCase());
      if (stat) bankWords.push(stat);
    });
    SENSITIVE_BANKS[key].forEach((meta) => {
      if (!matched.has(meta.word.toLowerCase())) {
        bankWords.push({ word: meta.word, level: meta.level, tip: meta.tip, count: 0, positions: [] });
      }
    });

    return (
      <Space direction="vertical" size={ 12 } style={ { width: '100%' } }>
        { key === 'common' ? lexiconPicker() : null }

        { previewNode(hits, key === 'common' ? categoryLabel : undefined) }

        <Radio.Group
          size="small"
          value={ level }
          onChange={ (e) => setLevel(e.target.value as LevelFilter) }
          options={ [
            { value: 'all', label: `${t('全部')} (${view.total})` },
            ...LEVEL_ORDER.map((lv) => ({ value: lv, label: `${t(LEVEL_LABELS[lv])} (${view.counts[lv]})` })),
          ] }
        />

        <Table
          className="sw-table"
          size="small"
          rowKey={ fused ? (row: HitRow) => (row.categoryKey ? `${row.categoryKey}-${row.word}` : `builtin-${row.word}`) : 'word' }
          dataSource={ rows }
          pagination={ false }
          scroll={ { x: fused ? 880 : 760 } }
          locale={ {
            emptyText: (
              <Empty
                image={ Empty.PRESENTED_IMAGE_SIMPLE }
                description={ (
                  <Space direction="vertical" size={ 2 }>
                    <Text>{ t(fused ? '未命中已选分类的敏感词' : '未命中该词库的敏感词') }</Text>
                    <Text type="secondary" style={ { fontSize: 12 } }>
                      { t(fused ? '外部词库误报较多, 命中后请结合语境核实' : '换个词库试试, 或检查文案是否需要放宽松') }
                    </Text>
                  </Space>
                ) }
              />
            ),
          } }
          columns={ wordColumns(fused) }
        />

        <Collapse
          size="small"
          items={ [ {
            key: 'bank',
            label: tT('共 {n} 条词条, 命中的词条排在最前', { n: SENSITIVE_BANKS[key].length }),
            children: (
              <div className="sw-bank-list" style={ { display: 'flex', flexWrap: 'wrap', gap: 6 } }>
                { bankWords.map((w) => (
                  <Tag
                    key={ w.word }
                    color={ w.count > 0 ? LEVEL_COLOR[w.level] : undefined }
                    title={ `${w.tip}${w.count > 0 ? ` · ${tT('命中 {n} 次', { n: w.count })}` : ''}` }
                    style={ { marginInlineEnd: 0, fontFamily: MONO } }
                  >
                    { w.word }
                  </Tag>
                )) }
              </div>
            ),
          } ] }
        />
      </Space>
    );
  };

  return (
    <>
      {/* 操作栏 */}
      <div style={ { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 8 } }>
        <Space wrap>
          <Button size="small" icon={ <ReloadOutlined /> } onClick={ () => setText(SAMPLE_TEXT) }>{ t('载入示例') }</Button>
          <Button size="small" icon={ <ClearOutlined /> } onClick={ () => setText('') } disabled={ text === '' }>{ t('清空') }</Button>
        </Space>
        <Space wrap>
          <Tooltip title={ lexKeys.length > 0
            ? t('打码 / 报告按「通用」词库 + 已勾选的扩展词库分类处理, 避免漏词')
            : t('打码 / 报告都按「通用」词库 (小红书 + 微信公众号的并集) 处理, 避免漏词') }>
            <Button size="small" icon={ <CopyOutlined /> } onClick={ () => { void copy(maskText(text, maskHits, maskChar), t('已复制打码文本')); } } disabled={ text === '' }>
              { t('复制打码文本') }
            </Button>
          </Tooltip>
          <Button size="small" icon={ <CopyOutlined /> } onClick={ () => { void copy(reportContent(), t('已复制检测报告')); } } disabled={ text === '' }>
            { t('复制检测报告') }
          </Button>
          <Button size="small" icon={ <DownloadOutlined /> } onClick={ () => { void onSave('masked'); } } disabled={ text === '' }>{ t('保存打码文本') }</Button>
          <Button size="small" icon={ <DownloadOutlined /> } onClick={ () => { void onSave('report'); } } disabled={ text === '' }>{ t('保存检测报告') }</Button>
        </Space>
      </div>

      {/* 匹配选项 + 文本统计 */}
      <div style={ { display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } }>
        <Space wrap size={ 12 }>
          <Tooltip title={ t('开启后「微 信」「ｖｘ」这类插入间隔符 / 全角的绕过写法也会被检出') }>
            <Space size={ 4 }>
              <Text type="secondary" style={ { fontSize: 12 } }>{ t('宽松匹配 (忽略间隔符)') }</Text>
              <Switch size="small" checked={ loose } onChange={ setLoose } />
            </Space>
          </Tooltip>
          <Tooltip title={ t('开启后纯字母词要求左右不是字母, 避免「v」命中 version 这类英文单词') }>
            <Space size={ 4 }>
              <Text type="secondary" style={ { fontSize: 12 } }>{ t('拉丁词边界') }</Text>
              <Switch size="small" checked={ latinBoundary } onChange={ setLatinBoundary } />
            </Space>
          </Tooltip>
          <Tooltip title={ t('可下拉选择, 也可自己填写 (只取第一个字符)') }>
            <Space size={ 4 }>
              <Text type="secondary" style={ { fontSize: 12 } }>{ t('打码字符') }</Text>
              <AutoComplete
                size="small"
                className="sw-mask-char"
                style={ { width: 84 } }
                value={ maskChar }
                onChange={ (v) => setMaskChar(maskCharInput(v)) }
                onBlur={ () => setMaskChar((c) => normalizeMaskChar(c)) }
                options={ MASK_CHAR_OPTIONS.map((c) => ({ value: c, label: c })) }
              />
            </Space>
          </Tooltip>
        </Space>
        <Text type="secondary" style={ { fontSize: 12 } }>
          { `${tT('共 {n} 字', { n: textLength(text) })} · ${tT('命中 {n} 处', { n: commonView.total })}`
            + (commonView.extraHits > 0 ? ` (${tT('含扩展词库 {n} 处', { n: commonView.extraHits })})` : '') }
        </Text>
      </div>

      <Input.TextArea
        className="sw-input"
        value={ text }
        onChange={ (e) => setText(e.target.value) }
        placeholder={ t('把文案 / 标题 / 商品详情粘贴到这里, 自动检测敏感词') }
        autoSize={ { minRows: 8, maxRows: 20 } }
        style={ { fontFamily: MONO, fontSize: 13, marginBottom: 12 } }
      />

      { text === '' ? (
        <Empty
          image={ Empty.PRESENTED_IMAGE_SIMPLE }
          description={ t('先在上面粘贴一段文案, 这里会立刻给出检测结果') }
        />
      ) : (
        <>
          {/* 词库概览: 点击卡片即切到对应页签; 「通用」融合已勾选的扩展词库 */}
          <div style={ { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 } }>
            { BANK_KEYS.map((key) => {
              const view = key === 'common' ? commonView : scans[key];
              return (
                <Card
                  key={ key }
                  className="sw-card"
                  size="small"
                  hoverable
                  onClick={ () => setBank(key) }
                  style={ { borderColor: bank === key ? token.colorPrimary : undefined } }
                >
                  <Space direction="vertical" size={ 4 }>
                    <Space size={ 4 } wrap>
                      <Text strong>{ t(BANK_LABELS[key]) }</Text>
                      { key === 'common' && lexKeys.length > 0
                        ? <Tag color={ token.colorPrimary } style={ { marginInlineEnd: 0 } }>{ tT('已融合扩展词库 {n} 个分类', { n: lexKeys.length }) }</Tag>
                        : null }
                    </Space>
                    <Text type="secondary" style={ { fontSize: 12 } }>
                      { view.total === 0
                        ? t('未命中')
                        : tT('命中 {hits} 处 / {words} 个词', { hits: view.total, words: view.words.length }) }
                      { key === 'common' && commonView.extraHits > 0 ? ` · ${tT('含扩展词库 {n} 处', { n: commonView.extraHits })}` : '' }
                    </Text>
                    <Space size={ 4 } wrap>{ levelTags(view.counts) }</Space>
                  </Space>
                </Card>
              );
            }) }
          </div>

          {/* 各平台词库明细 */}
          <Tabs
            className="sw-tabs"
            style={ { marginTop: 12 } }
            activeKey={ bank }
            onChange={ (key) => setBank(key as BankKey) }
            items={ BANK_KEYS.map((key) => ({
              key,
              label: `${t(BANK_LABELS[key])} (${key === 'common' ? commonView.total : scans[key].total})`,
              children: key === bank ? bankPanel(key) : null,
            })) }
          />

          {/* 打码效果预览: 按通用词库 + 已勾选扩展词库分类打码 */}
          <Card
            className="sw-mask-card"
            size="small"
            style={ { marginTop: 12 } }
            title={ (
              <Space size={ 8 } wrap>
                <Text strong>{ t('打码预览') }</Text>
                <Text type="secondary" style={ { fontSize: 12 } }>
                  { lexKeys.length > 0
                    ? tT('按通用词库 + 已勾选扩展词库分类打码, 打码字符: {ch}', { ch: normalizeMaskChar(maskChar) })
                    : tT('按通用词库打码, 打码字符: {ch}', { ch: normalizeMaskChar(maskChar) }) }
                </Text>
              </Space>
            ) }
            extra={ (
              <Tooltip title={ t('复制打码文本') }>
                <Button
                  className="sw-mask-copy"
                  size="small"
                  icon={ <CopyOutlined /> }
                  onClick={ () => { void copy(maskText(text, maskHits, maskChar), t('已复制打码文本')); } }
                >
                  { t('复制结果') }
                </Button>
              </Tooltip>
            ) }
          >
            <Space direction="vertical" size={ 8 } style={ { width: '100%' } }>
              <Text type="secondary" style={ { fontSize: 12 } }>
                { tT('原文共 {n} 字', { n: textLength(text) }) }
              </Text>
              { maskPreviewNode() }
            </Space>
          </Card>
        </>
      ) }

      <Divider>{ t(' 敏感词检测说明 ') }</Divider>
      <SensitiveWordIntro />
    </>
  );
};

export default SensitiveWord;
