// 敏感词检测: 粘贴文案即自动检测, 内置「通用 / 小红书 / 微信公众号」三个词库与替换建议
import { Button, Card, Collapse, Divider, Empty, Input, Radio, Select, Space, Switch, Table, Tabs, Tag, Tooltip, Typography, message, theme } from 'antd';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ClearOutlined, CopyOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { useLocale } from '../../hook/locale-context';
import { u, uT } from './lang';
import {
  BANK_KEYS, BANK_LABELS, LEVEL_COLOR, LEVEL_DESC, LEVEL_LABELS, LEVEL_ORDER,
  MASK_CHAR_OPTIONS, SAMPLE_TEXT, SENSITIVE_BANKS,
  type BankKey, type Level,
} from './data';
import {
  getSettings, highlightParts, lineCol, maskedFileName, maskText, reportFileName, reportText,
  scanText, textLength, type BankScan,
} from './lib';
import { saveTextFile } from '../../lib/tauri';
import SensitiveWordIntro from './intro';

const { Text } = Typography;

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/** 等级筛选值 */
type LevelFilter = 'all' | Level;

/** 命中高亮底色 (深浅色主题下都清晰) */
const MARK_BG: Record<Level, string> = {
  high: 'rgba(255, 77, 79, 0.34)',
  mid: 'rgba(250, 140, 22, 0.34)',
  low: 'rgba(250, 219, 20, 0.42)',
};

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

  const copySeq = useRef(0);

  /** 检测结果 (纯函数, 文本 / 选项变化即重算) */
  const scans = useMemo(
    () => scanText(text, { loose, latinBoundary }),
    [ text, loose, latinBoundary ]
  );
  /** 打码按「通用」词库 (两个平台的并集) 处理, 避免漏掉只属于某一平台的词 */
  const maskHits = scans.common.hits;

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

  const onSave = async (kind: 'masked' | 'report') => {
    const masked = kind === 'masked';
    const name = masked ? maskedFileName() : reportFileName();
    const content = masked
      ? maskText(text, maskHits, maskChar)
      : reportText(text, scans, { loose, latinBoundary });
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
  const levelTags = (scan: BankScan) => LEVEL_ORDER
    .filter((lv) => scan.counts[lv] > 0)
    .map((lv) => (
      <Tag key={ lv } color={ LEVEL_COLOR[lv] } style={ { marginInlineEnd: 0 } }>
        { `${t(LEVEL_LABELS[lv])} ${scan.counts[lv]}` }
      </Tag>
    ));

  /** 词库页签内容: 高亮预览 + 等级筛选 + 命中明细 + 词库预览 */
  const bankPanel = (key: BankKey) => {
    const scan = scans[key];
    const hits = level === 'all' ? scan.hits : scan.hits.filter((h) => h.level === level);
    const parts = highlightParts(text, hits);
    const rows = level === 'all' ? scan.words : scan.words.filter((w) => w.level === level);
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
        <div
          className="sw-preview"
          style={ {
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
          } }
        >
          { parts.map((part, i) => (part.hit
            ? (
              <mark
                key={ i }
                className={ `sw-mark sw-mark-${part.hit.level}` }
                title={ `${part.hit.word} · ${t(LEVEL_LABELS[part.hit.level])} · ${part.hit.tip}` }
                style={ { background: MARK_BG[part.hit.level], color: 'inherit', padding: 0, borderRadius: 2 } }
              >
                { part.text }
              </mark>
            )
            : <span key={ i }>{ part.text }</span>)) }
        </div>

        <Radio.Group
          size="small"
          value={ level }
          onChange={ (e) => setLevel(e.target.value as LevelFilter) }
          options={ [
            { value: 'all', label: `${t('全部')} (${scan.total})` },
            ...LEVEL_ORDER.map((lv) => ({ value: lv, label: `${t(LEVEL_LABELS[lv])} (${scan.counts[lv]})` })),
          ] }
        />

        <Table
          className="sw-table"
          size="small"
          rowKey="word"
          dataSource={ rows }
          pagination={ false }
          scroll={ { x: 760 } }
          locale={ {
            emptyText: (
              <Empty
                image={ Empty.PRESENTED_IMAGE_SIMPLE }
                description={ (
                  <Space direction="vertical" size={ 2 }>
                    <Text>{ t('未命中该词库的敏感词') }</Text>
                    <Text type="secondary" style={ { fontSize: 12 } }>{ t('换个词库试试, 或检查文案是否需要放宽松') }</Text>
                  </Space>
                ) }
              />
            ),
          } }
          columns={ [
            {
              title: t('敏感词'),
              dataIndex: 'word',
              width: 180,
              render: (_: unknown, row: { word: string; level: Level; count: number; positions: number[] }) => (
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
          ] }
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
          <Tooltip title={ t('打码 / 报告都按「通用」词库 (小红书 + 微信公众号的并集) 处理, 避免漏词') }>
            <Button size="small" icon={ <CopyOutlined /> } onClick={ () => { void copy(maskText(text, maskHits, maskChar), t('已复制打码文本')); } } disabled={ text === '' }>
              { t('复制打码文本') }
            </Button>
          </Tooltip>
          <Button size="small" icon={ <CopyOutlined /> } onClick={ () => { void copy(reportText(text, scans, { loose, latinBoundary }), t('已复制检测报告')); } } disabled={ text === '' }>
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
          <Space size={ 4 }>
            <Text type="secondary" style={ { fontSize: 12 } }>{ t('打码字符') }</Text>
            <Select
              size="small"
              style={ { width: 72 } }
              value={ maskChar }
              onChange={ setMaskChar }
              options={ MASK_CHAR_OPTIONS.map((c) => ({ value: c, label: c })) }
            />
          </Space>
        </Space>
        <Text type="secondary" style={ { fontSize: 12 } }>
          { `${tT('共 {n} 字', { n: textLength(text) })} · ${tT('命中 {n} 处', { n: scans.common.total })}` }
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
          {/* 词库概览: 点击卡片即切到对应页签 */}
          <div style={ { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 } }>
            { BANK_KEYS.map((key) => (
              <Card
                key={ key }
                className="sw-card"
                size="small"
                hoverable
                onClick={ () => setBank(key) }
                style={ { borderColor: bank === key ? token.colorPrimary : undefined } }
              >
                <Space direction="vertical" size={ 4 }>
                  <Text strong>{ t(BANK_LABELS[key]) }</Text>
                  <Text type="secondary" style={ { fontSize: 12 } }>
                    { scans[key].total === 0
                      ? t('未命中')
                      : tT('命中 {hits} 处 / {words} 个词', { hits: scans[key].total, words: scans[key].words.length }) }
                  </Text>
                  <Space size={ 4 } wrap>{ levelTags(scans[key]) }</Space>
                </Space>
              </Card>
            )) }
          </div>

          {/* 各平台词库明细 */}
          <Tabs
            className="sw-tabs"
            style={ { marginTop: 12 } }
            activeKey={ bank }
            onChange={ (key) => setBank(key as BankKey) }
            items={ BANK_KEYS.map((key) => ({
              key,
              label: `${t(BANK_LABELS[key])} (${scans[key].total})`,
              children: key === bank ? bankPanel(key) : null,
            })) }
          />
        </>
      ) }

      <Divider>{ t(' 敏感词检测说明 ') }</Divider>
      <SensitiveWordIntro />
    </>
  );
};

export default SensitiveWord;
