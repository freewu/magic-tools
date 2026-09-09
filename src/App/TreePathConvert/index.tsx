import { Alert, Button, Card, Input, Segmented, Space, Tabs, Tag, Tree, Typography, message } from 'antd';
import { CopyOutlined, DownloadOutlined, SwapOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { useMemo, useState } from 'react';
import { parsePathsTextToRoots, rootsToPaths, rootsToIndentedText,
  parseIndentedTextToRoots, rootsToJson, jsonToRoots,
} from './lib';
import type { PNode } from './lib';
import { useLocale } from '../../hook/locale-context';
import { tr, trTpl } from '../../i18n/lang';
import tpLang from './lang';

const { Text } = Typography;

const SAMPLE_PATHS = [
  'src/App/CodeShot/index.tsx',
  'src/App/CodeShot/lib.ts',
  'src/App/CodeShot/lib.test.ts',
  'src/App/Hash/index.tsx',
  'src/lib/string.ts',
  'README.md',
  'docs/guide.md',
].join('\n');

const SAMPLE_TREE = [
  'src',
  '  App',
  '    CodeShot',
  '      index.tsx',
  '      lib.ts',
  '    Hash',
  '      index.tsx',
  '  lib',
  '    string.ts',
  'docs',
  '  guide.md',
  'README.md',
].join('\n');

const copyText = async (text: string, tip: string, fail: string) => {
  try {
    await navigator.clipboard.writeText(text);
    message.success(tip);
  } catch {
    message.error(fail);
  }
};

const download = (text: string, filename: string, okMsg: string) => {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  message.success(okMsg);
};

const toTreeData = (nodes: PNode[]): DataNode[] => nodes.map((n) => ({
  key: n.path,
  title: n.name,
  isLeaf: n.children.length === 0,
  children: n.children.length ? toTreeData(n.children) : undefined,
}));

const TreePathConvert: React.FC = () => {
  const { locale } = useLocale();
  const t = (key: string, fallback: string) => tr(tpLang, locale, key, fallback);
  const tpl = (key: string, vars: Record<string, string | number>, fallback: string) => trTpl(tpLang, locale, key, vars, fallback);
  const treeErrText = (raw :string) :string => raw === 'JSON 根应为对象' ? t('errRoot', raw) : raw;

  const [mode, setMode] = useState<'to-tree' | 'to-paths'>('to-tree');
  const [pathsText, setPathsText] = useState('');
  const [treeText, setTreeText] = useState('');
  const [treeInput, setTreeInput] = useState<'text' | 'json'>('text');
  const [jsonText, setJsonText] = useState('');

  const roots = useMemo(() => parsePathsTextToRoots(pathsText), [pathsText]);
  const indented = useMemo(() => rootsToIndentedText(roots), [roots]);
  const lines = pathsText.split(/\r?\n/).filter((l) => l.trim());
  const dupLines = lines.length - new Set(lines.map((l) => l.trim())).size;

  const [treeError, setTreeError] = useState('');
  const parsedTree = useMemo(() => {
    if (!treeInput) return null;
    const source = treeInput === 'json' ? jsonText : treeText;
    if (!source.trim()) { setTreeError(''); return null; }
    try {
      const r = treeInput === 'json' ? jsonToRoots(source) : parseIndentedTextToRoots(source);
      setTreeError('');
      return r;
    } catch (e) {
      setTreeError(e instanceof Error ? e.message : String(e));
      return null;
    }
  }, [treeInput, treeText, jsonText]);
  const pathsOut = useMemo(() => (parsedTree ? rootsToPaths(parsedTree) : []), [parsedTree]);
  const pathsOutText = pathsOut.join('\n');

  const inputModeExtra = (
    <Space size={8}>
      <Button size="small" onClick={() => setPathsText(SAMPLE_PATHS)}>{t('load', '载入示例')}</Button>
      <Button size="small" danger disabled={!pathsText} onClick={() => setPathsText('')}>{t('clear', '清空')}</Button>
    </Space>
  );

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message={t('title', '树形和路径转换')}
        description={
          <>
            { t('d1', '在「路径列表 ↔ 树形」之间互转: 每行一条路径(支持 ') }<Text code>/</Text>{ t('d2', ' 与 ') }<Text code>\</Text>{ t('d3', ' 分隔), 树形文本约定每层 2 空格缩进, 也兼容 ') }<Text code>├── └── │</Text>{ t('d4', ' 目录树输出; 亦可与嵌套 JSON 互转。') }
          </>
        }
      />
      <Tabs
        activeKey={mode}
        onChange={(k) => setMode(k as typeof mode)}
        items={[
          {
            key: 'to-tree',
            label: <Space><SwapOutlined /> {t('tabToTree', '路径 → 树')}</Space>,
            children: (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Card size="small" title={t('cardPaths', '路径列表 (每行一条)')} extra={inputModeExtra}>
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Input.TextArea
                      value={pathsText}
                      onChange={(e) => setPathsText(e.target.value)}
                      placeholder={t('phPaths', '每行一条路径, 例如:\n\nsrc/components/App.tsx\nsrc/index.tsx\ndocs/guide.md')}
                      autoSize={{ minRows: 6, maxRows: 12 }}
                      style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 13 }}
                    />
                    <Space size={16} wrap>
                      {pathsText.trim() && <Text type="secondary" style={{ fontSize: 12 }}>{dupLines > 0 ? tpl('statB', { n: lines.length, dup: dupLines }, `${lines.length} 行, 重复 ${dupLines} 行, 重复分支自动合并`) : tpl('statA', { n: lines.length }, `${lines.length} 行, 重复分支自动合并`)}</Text>}
                    </Space>
                  </Space>
                </Card>
                <Card size="small" title={t('cardTree', '树形结构')} extra={
                  <Button size="small" icon={<CopyOutlined />} disabled={!indented} onClick={() => copyText(indented, t('copied', '已复制'), t('copyFail', '复制失败, 请手动选择复制'))}>{t('copyTextBtn', '复制文本')}</Button>
                }>
                  {roots.length ? (
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                      <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, padding: 8, maxHeight: 360, overflow: 'auto' }}>
                        <Tree treeData={toTreeData(roots)} defaultExpandAll selectable={false} showLine />
                      </div>
                      <Input.TextArea
                        value={indented}
                        readOnly
                        autoSize={{ minRows: 3, maxRows: 10 }}
                        style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 12 }}
                      />
                    </Space>
                  ) : (
                    <Text type="secondary">{t('emptyTree', '暂无内容 — 输入路径后自动生成树形。')}</Text>
                  )}
                </Card>
              </Space>
            ),
          },
          {
            key: 'to-paths',
            label: <Space><SwapOutlined /> {t('tabToPaths', '树 → 路径')}</Space>,
            children: (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Card size="small" title={t('cardTreeIn', '树形内容')} extra={
                  <Space size={8}>
                    <Segmented
                      size="small"
                      value={treeInput}
                      onChange={(v) => setTreeInput(v as typeof treeInput)}
                      options={[{ label: t('segText', '缩进树文本'), value: 'text' }, { label: t('segJson', '嵌套 JSON'), value: 'json' }]}
                    />
                    <Button size="small" onClick={() => { setTreeText(SAMPLE_TREE); setTreeInput('text'); message.info(t('loadInfo', '已载入示例树')); }}>{t('load', '载入示例')}</Button>
                    <Button size="small" danger disabled={!treeText && !jsonText} onClick={() => { setTreeText(''); setJsonText(''); }}>{t('clear', '清空')}</Button>
                  </Space>
                }>
                  {treeInput === 'text' ? (
                    <Input.TextArea
                      value={treeText}
                      onChange={(e) => setTreeText(e.target.value)}
                      placeholder={t('phIndent', '缩进树文本 (每层 2 空格), 例如:\n\nsrc\n  App\n    CodeShot\n      index.tsx\n  lib\n    string.ts')}
                      autoSize={{ minRows: 8, maxRows: 14 }}
                      style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 13 }}
                    />
                  ) : (
                    <Input.TextArea
                      value={jsonText}
                      onChange={(e) => setJsonText(e.target.value)}
                      placeholder={t('phJson', '嵌套 JSON, 例如:\n{"src":{"App":{"CodeShot":{"index.tsx":null}},"lib":{"string.ts":null}}}')}
                      autoSize={{ minRows: 8, maxRows: 14 }}
                      style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 13 }}
                    />
                  )}
                </Card>
                {treeError && <Alert type="error" showIcon message={t('parseFail', '解析失败')} description={treeErrText(treeError)} />}
                <Card size="small" title={t('cardPaths', '路径列表 (每行一条)')} extra={
                  <Space size={8}>
                    <Button size="small" icon={<CopyOutlined />} disabled={!pathsOutText} onClick={() => copyText(pathsOutText, t('copied', '已复制'), t('copyFail', '复制失败, 请手动选择复制'))}>{t('copyBtn', '复制')}</Button>
                    <Button size="small" icon={<DownloadOutlined />} disabled={!pathsOutText} onClick={() => download(pathsOutText, 'paths.txt', tpl('downloadedTpl', { file: 'paths.txt' }, '已下载 paths.txt'))}>{t('dlBtn', '下载 .txt')}</Button>
                  </Space>
                }>
                  {pathsOutText ? (
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                      <Input.TextArea
                        value={pathsOutText}
                        readOnly
                        autoSize={{ minRows: 6, maxRows: 14 }}
                        style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 13 }}
                      />
                      <Tag color="green">{ tpl('tagNodes', { n: pathsOut.length }, `共 ${pathsOut.length} 个节点 (含目录)`) }</Tag>
                    </Space>
                  ) : (
                    <Text type="secondary">{t('emptyOut', '暂无结果 — 输入树形内容后自动生成完整路径。树也可先由左侧「路径 → 树」生成。')}</Text>
                  )}
                </Card>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  );
};

export default TreePathConvert;
