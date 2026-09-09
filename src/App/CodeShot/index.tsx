import { Alert, Button, Card, Checkbox, Col, Input, Row, Segmented, Select, Slider, Space, Spin, Tag, Typography, message } from 'antd';
import { DownloadOutlined, PictureOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { ALL_LANG_IDS, highlightToHtml, resolveThemeId, themeBackground } from './engine';
import {
  APPEARANCES, COMMON_LANGS, EDITORS, PADDING_MAX, PADDING_MIN, langLabel,
  getDefaultAppearance, getDefaultEditor, getDefaultLang, getDefaultPadding,
  getDefaultShowLines, setDefaultShowLines, decorateHtml,
} from './lib';
import type { Appearance, EditorId } from './lib';
import { useLocale } from '../../hook/locale-context';
import { im, imT } from './lang';

const { Text } = Typography;

const SAMPLE_CODE = `// hello.ts — MagicTools 代码截图示例
interface User { name: string; age: number }

function greet(user: User): string {
  const who = user.age >= 18 ? user.name : '小朋友';
  return \`你好, \${who}! 欢迎使用 MagicTools。\`;
}

const users: User[] = [
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 12 },
];
users.forEach((u) => console.log(greet(u)));`;

const CodeShot: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => im(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => imT(locale, zh, v);
  const [code, setCode] = useState('');
  const [langs, setLangs] = useState<string[]>(() => ALL_LANG_IDS);
  const [lang, setLang] = useState<string>(() => getDefaultLang());
  const [editor, setEditor] = useState<EditorId>(() => getDefaultEditor());
  const [appearance, setAppearance] = useState<Appearance>(() => getDefaultAppearance());
  const [padding, setPadding] = useState<number>(() => getDefaultPadding());
  const [showLines, setShowLines] = useState<boolean>(() => getDefaultShowLines());
  const [html, setHtml] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const shotRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!code.trim()) { setHtml(''); setErr(''); return; }
    setBusy(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const out = await highlightToHtml(code, lang, resolveThemeId(editor, appearance));
        // 展示层装饰 (行号 / pre margin 归零), 预览与导出共用同一段 html
        setHtml(decorateHtml(out, {
          lineNumbers: showLines,
          lineNoColor: appearance === 'dark' ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.38)',
        }));
        setErr('');
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [code, lang, editor, appearance, showLines]);

  const themeId = resolveThemeId(editor, appearance);
  const bg = themeBackground(editor, appearance);
  const dotColor = appearance === 'dark' ? '#2b2f36' : '#d0d7de';
  const borderColor = appearance === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  // 圆角不超出内边距: 内边距小/为 0 时圆角随之减小/归零, 代码不会压到弧线边缘产生"黑圈"
  const radius = Math.min(padding, 10);

  const commonOpts = COMMON_LANGS.map((l) => ({ value: l.id, label: l.label }));
  const allOpts = useMemo(
    () => langs.filter((id) => !COMMON_LANGS.some((c) => c.id === id)).map((id) => ({ value: id, label: langLabel(id) })),
    [langs],
  );

  const exportPng = async () => {
    const node = shotRef.current;
    if (!node || !html) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `code-shot-${lang}-${Date.now()}.png`;
      a.click();
      message.success(t('已导出 PNG'));
    } catch (e) {
      message.error(tt('导出失败: {msg}', { msg: e instanceof Error ? e.message : String(e) }));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message={t('代码截图')}
        description={t('Shiki 语法高亮 + 一键导出 PNG。支持全部内置语言（常用语言置顶），编辑器风格可选 Mac / VSCode / IntelliJ / Sublime / Vim / Emacs，明暗自适应配色，默认值均可在「设置 → 其它」中调整。')}
      />
      <Row gutter={16} wrap align="stretch" style={{ marginTop: 16 }}>
        <Col xs={24} lg={13} xxl={12}>
          <Card size="small" title={t('代码与外观')} style={{ height: '100%' }} extra={
            <Space size={8}>
              <Button size="small" onClick={() => setCode(SAMPLE_CODE)}>{t('载入示例')}</Button>
              <Button size="small" disabled={!code} onClick={() => setCode('')} danger>{t('清空')}</Button>
            </Space>
          }>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Space wrap size={12}>
                <span>
                  <Text type="secondary" style={{ fontSize: 12, marginRight: 6 }}>{t('语言')}</Text>
                  <Select
                    size="small"
                    style={{ width: 220 }}
                    value={lang}
                    onChange={setLang}
                    showSearch
                    filterOption={(kw, opt) => String(opt?.label ?? '').toLowerCase().includes(kw.toLowerCase()) || String((opt as { value?: string } | undefined)?.value ?? '').includes(kw)}
                    options={[
                      { label: t('常用'), options: commonOpts },
                      { label: tt('全部 ({n})', { n: langs.length }), options: allOpts },
                    ]}
                  />
                </span>
                <span>
                  <Text type="secondary" style={{ fontSize: 12, marginRight: 6 }}>{t('编辑器')}</Text>
                  <Segmented size="small" value={editor} onChange={(v) => setEditor(v as EditorId)} options={EDITORS} />
                </span>
                <span>
                  <Text type="secondary" style={{ fontSize: 12, marginRight: 6 }}>{t('外观')}</Text>
                  <Segmented size="small" value={appearance} onChange={(v) => setAppearance(v as Appearance)} options={APPEARANCES.map((a) => ({ ...a, label: t(a.label) }))} />
                </span>
              </Space>
              <Space align="center" size={12} wrap>
                <Text type="secondary" style={{ fontSize: 12 }}>{t('内边距')}</Text>
                <Slider
                  style={{ width: 220 }}
                  min={PADDING_MIN}
                  max={PADDING_MAX}
                  value={padding}
                  onChange={setPadding}
                  tooltip={{ formatter: (v) => `${v}px` }}
                />
                <Text code style={{ fontSize: 12 }}>{padding}px</Text>
                <Checkbox
                  checked={showLines}
                  onChange={(e) => { setShowLines(e.target.checked); setDefaultShowLines(e.target.checked); }}
>
                {t('显示行号')}
              </Checkbox>
                <Tag color="blue">{langLabel(lang)} · {themeId}</Tag>
              </Space>
              <Input.TextArea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t('粘贴需要截图的代码…')}
                autoSize={{ minRows: 8, maxRows: 22 }}
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 13 }}
              />
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={11} xxl={12}>
          <Card size="small" title={t('截图预览')} style={{ height: '100%' }} extra={
            <Button type="primary" size="small" icon={<DownloadOutlined />} loading={exporting} disabled={!html} onClick={exportPng}>
              {t('导出 PNG')}
            </Button>
          }>
            {err ? (
              <Alert type="error" showIcon message={t('高亮失败')} description={err} />
            ) : busy ? (
              <div style={{ textAlign: 'center', padding: 20 }}><Spin tip={t('高亮中…')}><PictureOutlined style={{ fontSize: 28 }} /></Spin></div>
            ) : html ? (
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {/* 预览视口负责滚动/限高; 截图节点本身不裁剪, 导出包含全部代码行且无滚动条/黑边 */}
                <div style={{ maxWidth: '100%', maxHeight: 480, overflow: 'auto' }}>
                  <div
                    ref={shotRef}
                    style={{
                      display: 'inline-block',
                      borderRadius: radius,
                      background: bg,
                      border: `1px solid ${borderColor}`,
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ background: dotColor, padding: '8px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
                      <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
                      <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
                      <span style={{ marginLeft: 8, fontSize: 11, color: appearance === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontFamily: 'ui-monospace, monospace' }}>
                        {langLabel(lang)}
                      </span>
                    </div>
                    <div style={{ padding }}>
                      <div style={{ fontSize: 13, fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace' }} dangerouslySetInnerHTML={{ __html: html }} />
                    </div>
                  </div>
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>{t('导出尺寸 = 截图内容实际像素 × 2 (pixelRatio); 行号随行对齐并随 PNG 一并导出。若内边距较小时圆角会自动收小, 避免代码压弧产生暗圈。')}</Text>
              </Space>
            ) : (
              <Text type="secondary">{t('输入代码后实时预览，点击「导出 PNG」生成图片。')}</Text>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CodeShot;
