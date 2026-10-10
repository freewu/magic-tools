// ASCII 文字: figlet 字体选择弹窗
// - 点按钮打开弹窗, 每款字体都用 26 个字母 (A-Z) 渲染成大字预览, 点击即选用
// - 顶部搜索框与「数字 / A-Z 首字母快捷查询」固定在弹窗上部, 只有字体列表滚动
// - 289 款字体分批渲染 (字体数据懒加载 + 每 BATCH_SIZE 款让出主线程), 避免弹窗一次性渲染卡顿
// - 已渲染过的字体写入缓存, 切换搜索/首字母筛选不会重复渲染
import { Button, Input, Modal, theme } from 'antd';
import { DownOutlined, FontColorsOutlined, SearchOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FONT_NAMES, fontInitial, renderText } from './lib';
import { useLocale } from '../../hook/locale-context';
import { u, uT } from './lang';
import './ascii-text-art.css';

/** 预览用字符: 26 个英文字母 */
export const PREVIEW_TEXT = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
/** 首字母快捷查询: 数字 / 符号分组 */
export const INITIAL_DIGIT = '#';
/** 首字母快捷查询按钮 (A-Z) */
export const INITIAL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
/** 每批渲染的字体数量 (渲染一批后让出主线程) */
const BATCH_SIZE = 20;
/** 预览缩略字号 (过宽的字体横向滚动) */
const PREVIEW_FONT_SIZE = 8;

type FontPickerProps = {
  /** 当前字体 */
  value: string;
  /** 选用字体 (点击弹窗中的字体项) */
  onChange: (font: string) => void;
  /** 触发按钮宽度 */
  width?: number | string;
};

const FontPicker: React.FC<FontPickerProps> = ({ value, onChange, width = 220 }) => {
  const { locale } = useLocale();
  const { token } = theme.useToken();
  const t = (zh: string) => u(locale, zh);
  const tt = (zh: string, vars?: Record<string, string | number>) => uT(locale, zh, vars);

  const [ open, setOpen ] = useState(false);
  const [ kw, setKw ] = useState('');
  /** 首字母快捷查询 ('' = 全部) */
  const [ initial, setInitial ] = useState('');
  const [ previews, setPreviews ] = useState<Record<string, string>>({});
  const cache = useRef<Record<string, string>>({});
  const activeRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // 每个首字母分组的字体数量 ('#' 为数字/符号开头)
  const counts = useMemo(() => {
    const map :Record<string, number> = {};
    for (const name of FONT_NAMES) {
      const key = fontInitial(name);
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, []);

  // 有字体的首字母按钮 (没有字体的字母不显示, 如 Q / X / Y / Z)
  const initialKeys = useMemo(
    () => [ INITIAL_DIGIT, ...INITIAL_LETTERS ].filter((key) => (counts[key] ?? 0) > 0),
    [ counts ],
  );

  // 名称关键字 + 首字母 双重筛选
  const list = useMemo(() => {
    const k = kw.trim().toLowerCase();
    return FONT_NAMES.filter((n) => (initial === '' || fontInitial(n) === initial)
      && (k === '' || n.toLowerCase().includes(k)));
  }, [ kw, initial ]);

  // 弹窗打开后逐批渲染预览
  useEffect(() => {
    if (!open) return undefined;
    let alive = true;
    const run = async () => {
      const names = list;
      const buf: Record<string, string> = {};
      for (let i = 0; i < names.length; i += 1) {
        const name = names[i];
        if (cache.current[name] === undefined) {
          cache.current[name] = await renderText(PREVIEW_TEXT, name);
        }
        buf[name] = cache.current[name];
        if (!alive) return;
        // 每批刷新一次界面, 再让出主线程
        if ((i + 1) % BATCH_SIZE === 0 || i === names.length - 1) {
          setPreviews({ ...cache.current });
          await new Promise((resolve) => { setTimeout(resolve, 0); });
          if (!alive) return;
        }
      }
    };
    void run();
    return () => { alive = false; };
  }, [ open, list ]);

  // 筛选条件变化后列表回到顶部
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [ list ]);

  // 打开时把当前字体滚动到可视区域
  useEffect(() => {
    if (!open) return;
    activeRef.current?.scrollIntoView?.({ block: 'center' });
  }, [ open ]);

  const select = (name: string) => {
    onChange(name);
    setOpen(false);
    setKw('');
  };

  /** 首字母按钮: 点击筛选, 再点一次取消筛选 */
  const toggleInitial = (key: string) => setInitial((prev) => (prev === key ? '' : key));

  const chipStyle = { padding: '0 6px', fontSize: 12, minWidth: 26 } as const;

  const initialChip = (key: string) => {
    const n = counts[key] ?? 0;
    const active = initial === key;
    const label = key === '' ? t('全部') : (key === INITIAL_DIGIT ? t('数字') : key);
    const base = key === '' ? t('显示全部字体')
      : (key === INITIAL_DIGIT
        ? tt('数字开头的字体 ({n} 款)', { n })
        : tt('以 {c} 开头的字体 ({n} 款)', { c: key, n }));
    return (
      <Button
        key={ key === '' ? 'all' : key }
        size="small"
        type={ active ? 'primary' : 'default' }
        style={ chipStyle }
        data-initial={ key }
        title={ base + (active && key !== '' ? ' · ' + t('再点一次取消筛选') : '') }
        onClick={ () => toggleInitial(key) }
      >{ label }</Button>
    );
  };

  return (
    <>
      <Button
        className="figlet-font-trigger"
        icon={ <FontColorsOutlined /> }
        onClick={ () => setOpen(true) }
        style={ { width, overflow: 'hidden' } }
        title={ tt('当前字体 {v}, 点击选择', { v: value }) }
      >
        <span style={ { display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: '100%' } }>
          <span style={ { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }>{ value }</span>
          <DownOutlined style={ { fontSize: 10, opacity: 0.45 } } />
        </span>
      </Button>

      <Modal
        open={ open }
        title={ tt('选择字体 (共 {n} 款, 按 A-Z 预览)', { n: FONT_NAMES.length }) }
        onCancel={ () => setOpen(false) }
        footer={ null }
        width={ 920 }
        styles={ { body: { display: 'flex', flexDirection: 'column', maxHeight: '68vh', paddingTop: 8 } } }
      >
        {/* 固定区: 搜索框 + 首字母快捷查询 (不随字体列表滚动) */}
        <Input
          allowClear
          autoFocus
          value={ kw }
          onChange={ (e) => setKw(e.target.value) }
          placeholder={ t('搜索字体名称') }
          prefix={ <SearchOutlined style={ { color: token.colorTextPlaceholder } } /> }
          style={ { marginBottom: 8 } }
        />

        {/* 首字母快捷查询: 全部 / 数字 / 有字体的 A-Z */}
        <div style={ { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginBottom: 8 } }>
          { initialChip('') }
          { initialKeys.map((key) => initialChip(key)) }
        </div>

        <div style={ { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: token.colorTextTertiary, marginBottom: 8 } }>
          <span>{tt('匹配 {n} 款', { n: list.length })}</span>
          <span>{t('点击字体即可选用, 预览为 26 个字母 A-Z 的大字效果')}</span>
        </div>

        {/* 可滚动区: 只有字体列表滚动 */}
        <div
          ref={ listRef }
          className="figlet-font-list"
          style={ { flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 6 } }
        >
          { list.length === 0 && (
            <div style={ { color: token.colorTextTertiary, padding: '12px 0' } }>{t('没有匹配的字体, 换个关键字试试')}</div>
          ) }

          { list.map((name) => {
            const active = name === value;
            return (
              <div
                key={ name }
                className={ `figlet-font-item${active ? ' figlet-font-item-active' : ''}` }
                data-font={ name }
                title={ name }
                ref={ active ? activeRef : undefined }
                onClick={ () => select(name) }
                style={ {
                  border: `1px solid ${active ? token.colorPrimary : token.colorBorderSecondary}`,
                  background: active ? token.controlItemBgActive : token.colorFillQuaternary,
                  borderRadius: 6,
                  padding: '6px 10px',
                  marginBottom: 8,
                  cursor: 'pointer',
                } }
              >
                <div style={ { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 } }>
                  <span style={ {
                    fontSize: 12,
                    fontWeight: active ? 600 : 400,
                    color: active ? token.colorPrimary : token.colorTextSecondary,
                  } }>{ name }</span>
                  { active && <span style={ { fontSize: 12, color: token.colorPrimary } }>{t('当前字体')}</span> }
                </div>
                <pre
                  className="figlet-font-preview"
                  style={ {
                    margin: '4px 0 0',
                    fontSize: PREVIEW_FONT_SIZE,
                    lineHeight: 1.05,
                    whiteSpace: 'pre',
                    overflowX: 'auto',
                    color: token.colorText,
                    fontFamily: 'Consolas, "Courier New", monospace',
                  } }
                >{ previews[name] ?? t('加载中…') }</pre>
              </div>
            );
          }) }
        </div>
      </Modal>
    </>
  );
};

export default FontPicker;
