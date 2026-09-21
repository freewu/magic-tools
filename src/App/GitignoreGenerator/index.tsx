import { Button, Checkbox, Divider, Input, Select, Space, Typography, message } from 'antd';
import { useMemo, useState } from 'react';
import { CopyOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from '../../lib';
import { saveTextFile } from '../../lib/tauri';
import { useLocale } from '../../hook/locale-context';
import { gg, ggT } from './lang';
import {
  GITIGNORE_CATEGORIES,
  GITIGNORE_PRESETS,
  GITIGNORE_TEMPLATES,
} from './data';
import {
  MAX_INLINE_OPTIONS,
  allTemplateIds,
  type GitignoreOptions,
  applyPresetSelection,
  buildGitignore,
  emptyGitignoreOptions,
  mergeGroupSelection,
  toggleTemplate,
} from './lib';

const { Text } = Typography;
const { TextArea } = Input;

// 错误码 -> 文案 (zh 短语即 key, 由语言包翻译)
const ERROR_TEXT: Record<string, string> = {
  'gi-empty': '未选择任何模板, 也没有自定义规则',
};

// 警告码 -> 文案
const WARN_TEXT: Record<string, string> = {
  'gi-dedupe': '已自动去重 {n} 行重复规则',
  'gi-env-tip': '未勾选「环境变量 / 密钥」, 建议加上以避免误提交 .env / *.pem',
  'gi-negation-first': '自定义规则里以 ! 开头的例外规则需放在对应忽略规则之后, 否则不生效',
  'gi-anchored': '以 / 开头的规则只在仓库根目录生效, 需要匹配任意层级请去掉开头的 /',
};

const GitignoreGenerator = () => {

  const { locale } = useLocale();
  const t = (zh: string) => gg(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => ggT(locale, zh, v);

  const [ selected, setSelected ] = useState<string[]>([]); // 已勾选模板 (按勾选顺序)
  const [ custom, setCustom ] = useState('');              // 自定义追加
  const [ options, setOptions ] = useState<GitignoreOptions>(() => emptyGitignoreOptions());
  const [ notice, contextHolder ] = message.useMessage();

  const plan = useMemo(() => buildGitignore(selected, custom, options), [ selected, custom, options ]);
  const invalid = plan.errors.length > 0;

  // 模板库分组: 分类内选项超过 5 个的下拉自带搜索
  const groups = GITIGNORE_CATEGORIES.map((c) => ({
    key: c.key as string,
    label: t(c.label),
    items: GITIGNORE_TEMPLATES.filter((x) => x.category === c.key),
  }));

  const patchOptions = (patch: Partial<GitignoreOptions>) => setOptions((prev) => ({ ...prev, ...patch }));

  // 分类内选项超过 5 个时改用下拉多选: 复选框平铺会占满整屏, 下拉更紧凑且自带搜索
  // 选项不多的分类 (≤5) 仍平铺复选框, 一眼可见、点一下即勾
  const tooMany = (count: number) => count > MAX_INLINE_OPTIONS;

  // 当前选择与某个常用组合完全一致时回显该组合; 手动增删模板后自动回到占位符
  const currentPreset = GITIGNORE_PRESETS.find((p) => {
    const ids = applyPresetSelection(p);
    return ids.length > 0 && ids.length === selected.length && ids.every((id) => selected.includes(id));
  });

  // 复制
  const copy = (value: string) => {
    if (value === '') return;
    copyTextToClipboard(value);
    notice.success(t('已复制到粘贴板'));
  };

  // 保存为 .gitignore
  const saveFile = async () => {
    if (invalid) return;
    const ok = await saveTextFile(plan.fileName, plan.content, t('保存 .gitignore 文件'), {
      filterName: t('.gitignore 文件'),
      extensions: [ 'gitignore', 'txt' ],
    });
    if (ok) notice.success(t('保存成功'));
  };

  const reset = () => {
    setSelected([]);
    setCustom('');
    setOptions(emptyGitignoreOptions());
  };

  // 结果逐行视图 (去掉末尾换行产生的空行)
  const previewLines = plan.content === '' ? [] : plan.content.replace(/\n$/, '').split('\n');

  return (
    <div style={ { maxWidth: 1080 } }>
      {contextHolder}

      <Text type="secondary">{t('勾选需要的技术栈, 生成的 .gitignore 可直接保存到仓库根目录')}</Text>

      {/* 常用组合: 选项超过 5 个, 同样改用下拉 select 一键套用 */}
      <div style={ { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', margin: '10px 0' } }>
        <Text style={ { color: '#666', width: 70, textAlign: 'right' } }>{t('常用组合')}</Text>
        <Select
          showSearch
          optionFilterProp="label"
          listHeight={ 400 }
          aria-label={ t('常用组合') }
          style={ { minWidth: 260, maxWidth: 420 } }
          placeholder={ t('选择常用组合 (一键套用)') }
          value={ currentPreset?.id }
          options={ GITIGNORE_PRESETS.map((p) => ({ value: p.id, label: t(p.name) })) }
          onChange={ (id: string) => {
            const hit = GITIGNORE_PRESETS.find((p) => p.id === id);
            if (hit) setSelected(applyPresetSelection(hit));
          } }
        />
        <Text type="secondary" style={ { fontSize: 12 } }>{ tt('共 {n} 个常用组合', { n: GITIGNORE_PRESETS.length }) }</Text>
      </div>

      {/* 统计 + 批量操作 (搜索由各下拉自带) */}
      <div style={ { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', margin: '0 0 10px 78px' } }>
        <Text type="secondary">{ tt('共 {n} 个模板可选', { n: allTemplateIds().length }) }</Text>
        <Text strong>{ tt('已选 {n} 个模板', { n: selected.length }) }</Text>
        <Button size="small" onClick={ () => { setSelected(allTemplateIds()); } }>{ t('全选') }</Button>
        <Button size="small" onClick={ () => { setSelected([]); } }>{ t('清空') }</Button>
        <Button size="small" icon={ <ReloadOutlined /> } onClick={ reset }>{ t('恢复默认') }</Button>
      </div>

      {/* 模板库 */}
      { groups.map((g) => (
        <div key={ g.key } style={ { marginBottom: 8 } }>
          <div style={ { color: '#666', marginBottom: 4 } }>
            { g.label } <Text type="secondary" style={ { fontSize: 12 } }>({ g.items.length })</Text>
          </div>
          { tooMany(g.items.length) ? (
            <Select
              mode="multiple"
              allowClear
              showSearch
              maxTagCount="responsive"
              optionFilterProp="label"
              aria-label={ g.label }
              style={ { width: '100%', maxWidth: 760 } }
              placeholder={ t('选择模板 (可多选)') }
              value={ g.items.filter((tp) => selected.includes(tp.id)).map((tp) => tp.id) }
              options={ g.items.map((tp) => ({ value: tp.id, label: tp.label })) }
              onChange={ (ids: string[]) => {
                setSelected(mergeGroupSelection(selected, g.items.map((tp) => tp.id), ids));
              } }
            />
          ) : (
            <div style={ { display: 'flex', flexWrap: 'wrap', gap: '6px 18px', marginLeft: 2 } }>
              { g.items.map((tp) => (
                <Checkbox
                  key={ tp.id }
                  checked={ selected.includes(tp.id) }
                  onChange={ () => { setSelected(toggleTemplate(selected, tp.id)); } }
                >{ tp.label }</Checkbox>
              )) }
            </div>
          ) }
        </div>
      )) }

      {/* 自定义追加 */}
      <div style={ { marginTop: 12 } }>
        <div style={ { color: '#666', marginBottom: 4 } }>{ t('自定义追加') }</div>
        <TextArea
          value={ custom }
          placeholder={ t('每行一条, 直接追加到结果末尾 (支持 # 注释与 ! 例外)') }
          autoSize={ { minRows: 2, maxRows: 6 } }
          style={ { fontFamily: 'Consolas, Menlo, monospace', fontSize: 13 } }
          onChange={ (e) => { setCustom(e.target.value); } }
        />
      </div>

      {/* 选项 */}
      <div style={ { marginTop: 12 } }>
        <div style={ { color: '#666', marginBottom: 4 } }>{ t('选项') }</div>
        <div style={ { display: 'flex', flexWrap: 'wrap', gap: '6px 18px' } }>
          <Checkbox checked={ options.header } onChange={ (e) => { patchOptions({ header: e.target.checked }); } }>{ t('顶部说明注释') }</Checkbox>
          <Checkbox checked={ options.groupComments } onChange={ (e) => { patchOptions({ groupComments: e.target.checked }); } }>{ t('分组注释') }</Checkbox>
          <Checkbox checked={ options.sortLibraryOrder } onChange={ (e) => { patchOptions({ sortLibraryOrder: e.target.checked }); } }>{ t('按模板库顺序') }</Checkbox>
          <Checkbox checked={ options.dedupe } onChange={ (e) => { patchOptions({ dedupe: e.target.checked }); } }>{ t('自动去重') }</Checkbox>
        </div>
      </div>

      <Divider style={ { margin: '14px 0' } } />

      {/* 生成结果 */}
      <Space size={ 10 } style={ { marginBottom: 4 } } wrap>
        <Text strong>{ t('生成结果') }</Text>
        <Text type="secondary">{ tt('模板 {n} 个', { n: plan.templateCount }) }</Text>
        <Text type="secondary">{ tt('规则 {m} 条', { m: plan.ruleCount }) }</Text>
        <Text type="secondary">{ tt('注释 {k} 行', { k: plan.commentCount }) }</Text>
        { plan.duplicateCount > 0 && <Text type="secondary">{ tt('已去重 {d} 行', { d: plan.duplicateCount }) }</Text> }
        <Button size="small" type="link" icon={ <CopyOutlined /> } disabled={ invalid } onClick={ () => { copy(plan.content); } }>{ t('复制全部') }</Button>
      </Space>

      { invalid && (
        <div style={ { color: '#ff4d4f', marginBottom: 8 } }>
          { plan.errors.map((code) => <div key={ code }>{ t(ERROR_TEXT[code] ?? code) }</div>) }
        </div>
      ) }
      { plan.warnings.length > 0 && (
        <div style={ { color: '#d48806', marginBottom: 8 } }>
          { plan.warnings.map((code) => (
            <div key={ code }>
              { code === 'gi-dedupe'
                ? tt(WARN_TEXT[code], { n: plan.duplicateCount })
                : t(WARN_TEXT[code] ?? code) }
            </div>
          )) }
        </div>
      ) }

      <div
        style={ {
          background: '#23241f', color: '#f8f8f2', borderRadius: 6, padding: '6px 10px',
          fontFamily: 'Consolas, Monaco, monospace', fontSize: 12.5, lineHeight: 1.7,
          whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 420, overflow: 'auto',
        } }
      >
        { previewLines.map((line, i) => (
          <div key={ `${i}-${line}` } title={ t('点击复制') } style={ { cursor: 'pointer' } } onClick={ () => { copy(line); } }>
            { line === '' ? '\u00a0' : line }
          </div>
        )) }
      </div>

      <Space style={ { marginTop: 10 } }>
        <Button
          disabled={ invalid }
          icon={ <CopyOutlined /> }
          onClick={ () => { copy(plan.content); } }
        >{ t('复制全部') }</Button>
        <Button
          disabled={ invalid }
          style={ { backgroundColor: '#28a745', color: '#fff' } }
          icon={ <SaveOutlined /> }
          onClick={ saveFile }
        >{ t('保存为 .gitignore') }</Button>
      </Space>
    </div>
  );
};

export default GitignoreGenerator;
