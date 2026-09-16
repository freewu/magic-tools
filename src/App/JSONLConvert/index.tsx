import { Button, Checkbox, Divider, Input, Select, Space, Typography, message } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, CopyOutlined, DownloadOutlined, InboxOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { copyTextToClipboard } from '../../lib';
import { openFile } from '../../lib/file';
import { isTauri, saveTextFile } from '../../lib/tauri';
import { useLocale } from '../../hook/locale-context';
import { jc, jcT } from './lang';
import {
  ConvertError, DEFAULT_INDENT, INDENT_LIST, detectInput, jsonToJsonl, jsonlToJson,
  type Indent,
} from './lib';
import JSONLConvertIntro from './intro';

const { TextArea } = Input;
const { Text } = Typography;

/**
 * 页面布局: 上方 textarea = JSON, 下方 textarea = JSONL (两个框都既可输入也可输出)
 * - JSON → JSONL: 读上方 JSON 框, 结果写入下方 JSONL 框
 * - JSONL → JSON: 读下方 JSONL 框, 结果写入上方 JSON 框
 */
type Direction = 'to-jsonl' | 'to-json';

const DIR_LABEL: Record<Direction, string> = {
  'to-jsonl': 'JSON → JSONL',
  'to-json': 'JSONL → JSON',
};

/** 结果的去向 (决定下载扩展名 / 复制内容) */
type Side = 'json' | 'jsonl';

/** 示例: JSON 数组 (含嵌套对象与数组) */
const SAMPLE_JSON = `[
  { "id": 1, "name": "张三", "score": 92.5, "tags": ["vip", "new"] },
  { "id": 2, "name": "李四", "score": 88, "tags": [] },
  { "id": 3, "name": "王五", "score": 76.5, "tags": ["vip"] }
]`;

const JSONLConvert: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => jc(locale, zh);
  const tT = (zh: string, v: Record<string, string | number>) => jcT(locale, zh, v);

  const [ json, setJson ] = useState(''); // 上方: JSON
  const [ jsonl, setJsonl ] = useState(''); // 下方: JSONL
  const [ indent, setIndent ] = useState<Indent>(DEFAULT_INDENT); // JSON 输出缩进
  const [ skipBlank, setSkipBlank ] = useState(true); // 忽略空行
  const [ stat, setStat ] = useState(''); // 上次转换结果说明
  const [ side, setSide ] = useState<Side | ''>(''); // 结果在哪一侧 '')
  const [ fileName, setFileName ] = useState(''); // 已载入的文件名

  const result = side === '' ? '' : side === 'json' ? json : jsonl;
  const canUseResult = result.trim() !== '' && stat !== '';

  /** 内容识别提示 (每个框下方各显示一条) */
  const hintOf = (text: string): string => {
    const d = detectInput(text);
    if (d.kind === 'empty') return '';
    if (d.kind === 'invalid') return t('无法识别: 内容既不是完整 JSON, 也不是逐行合法的 JSONL');
    if (d.kind === 'jsonl') return tT('识别到: JSONL ({n} 行)', { n: d.count });
    return d.array
      ? tT('识别到: JSON 数组 ({n} 条)', { n: d.count })
      : t('识别到: JSON 对象 (单条记录)');
  };

  /** 错误码 -> 当前语言文案 */
  const errText = (e: unknown): string => {
    if (!(e instanceof ConvertError)) return e instanceof Error ? e.message : String(e);
    switch (e.code) {
      case 'empty': return t('内容为空, 请先输入 JSON 数组或 JSONL 文本');
      case 'emptyArray': return t('JSON 数组为空, 没有可转换的记录');
      case 'jsonParse': return tT('JSON 解析失败: {msg}', { msg: e.detail });
      case 'lineParse': return tT('第 {n} 行不是有效的 JSON: {msg}', { n: e.line, msg: e.detail });
      case 'blankLine': return tT('第 {n} 行是空行 (已关闭「忽略空行」): 空行不是合法的 JSONL', { n: e.line });
      case 'jsonArrayInput': return t('整段内容是一个 JSON 数组, 请改用「JSON → JSONL」');
      default: return e.message;
    }
  };

  /**
   * 转换 (按方向自动决定读哪个框、结果写哪个框)
   * @param dir 目标方向 (按钮声明的方向)
   * @param text 指定源文本 (载入文件 / 示例后立即转换); 不传则读对应格式的框
   * 容错: 声明的源框为空时改用另一个框; 内容与方向明显不符时自动纠正方向, 并给出提示
   */
  const convert = (dir: Direction, text?: string) => {
    const primary = text ?? (dir === 'to-jsonl' ? json : jsonl); // 该方向的源框
    const other = dir === 'to-jsonl' ? jsonl : json;
    // 源框为空但另一个框有内容: 换成另一个框 (方向随之反转)
    const useOther = primary.trim() === '' && other.trim() !== '';
    const src = useOther ? other : primary;
    if (src.trim() === '') {
      message.warning(t('请先在上方输入框粘贴或输入内容'));
      return;
    }
    let real: Direction = useOther ? (dir === 'to-jsonl' ? 'to-json' : 'to-jsonl') : dir;

    // 识别输入形态, 纠正明显的方向错误
    const kind = detectInput(src);
    if (real === 'to-json' && kind.array === true) real = 'to-jsonl'; // 整段是 JSON 数组, 不可能按行解析
    if (real === 'to-jsonl' && kind.kind === 'jsonl') real = 'to-json'; // 逐行 JSON, 整段 JSON.parse 会失败
    if (real !== dir) {
      message.info(tT('检测到输入是 {kind}, 已自动按「{dir}」转换', {
        kind: kind.array === true ? t('JSON 数组') : kind.kind === 'jsonl' ? 'JSONL' : t('JSON 对象'),
        dir: DIR_LABEL[real],
      }));
    }

    try {
      const r = real === 'to-jsonl' ? jsonToJsonl(src) : jsonlToJson(src, { indent, skipBlank });
      const dirLabel = DIR_LABEL[real];
      const tip = r.single
        ? tT('已转换 1 条记录 ({dir}, 顶层为单个值)', { dir: dirLabel })
        : tT('已转换 {n} 条记录 ({dir})', { n: r.count, dir: dirLabel });
      // 结果写入目标格式的框 (JSON -> 上方 / JSONL -> 下方)
      if (real === 'to-jsonl') setJsonl(r.text); else setJson(r.text);
      setSide(real === 'to-jsonl' ? 'jsonl' : 'json');
      setStat(tip);
      message.success(tip);
    } catch (e) {
      const em = errText(e);
      setSide('');
      setStat('');
      message.error(em);
    }
  };

  /**
   * 载入文本 (文件 / 示例): 按识别结果放进对应的框, 并自动转换到另一个框
   * 识别不出格式时只放进 JSON 框, 便于用户手工修正
   */
  const loadText = (text: string) => {
    setStat('');
    setSide('');
    const kind = detectInput(text);
    if (kind.kind === 'jsonl') {
      setJsonl(text);
      setJson('');
      convert('to-json', text);
    } else if (kind.kind === 'json') {
      setJson(text);
      setJsonl('');
      convert('to-jsonl', text);
    } else {
      setJson(text);
      setJsonl('');
    }
  };

  const onFile = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setFileName(files[0].name);
    openFile(files, (txt: string) => loadText(txt));
  };

  const textareaDoubleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    copy((e.target as HTMLTextAreaElement).value);
  };

  /** 复制 (失败时给出提示, 不抛出未捕获的 Promise 异常) */
  const copy = (text: string) => {
    if (text.trim() === '') return;
    void Promise.resolve(copyTextToClipboard(text))
      .then(() => message.success(t('已复制到剪贴板')))
      .catch(() => message.error(t('复制失败, 请手动选择文本复制')));
  };

  /** 下载: 桌面版弹系统保存对话框 (可选目录/文件名), Web 版回退为浏览器下载 */
  const download = async () => {
    if (!canUseResult || side === '') return;
    const base = (fileName === '' ? 'data' : fileName.replace(/\.[^/.]+$/u, '')) || 'data';
    const name = `${base}.${side}`;
    const isJsonl = side === 'jsonl';
    try {
      const ok = await saveTextFile(name, result, t(isJsonl ? '保存 JSONL 文件' : '保存 JSON 文件'), {
        filterName: t(isJsonl ? 'JSONL 文件' : 'JSON 文件'),
        extensions: isJsonl ? [ 'jsonl', 'ndjson' ] : [ 'json' ],
      });
      if (!ok) return; // 用户取消保存
      message.success(tT(isTauri() ? '已保存 {file}' : '已下载 {file}', { file: name }));
    } catch (e) {
      message.error(tT('保存失败: {msg}', { msg: e instanceof Error ? e.message : String(e) }));
    }
  };

  let inputRef: HTMLInputElement | null = null;

  return (
    <div>
      {/* 上框工具条: JSON 框标签 + 文件/示例载入 + 缩进/忽略空行 (均属于上方 JSON 框区域) */}
      <Space wrap size={ [ 8, 6 ] } align="center" style={ { marginBottom: 4 } }>
        <Text strong style={ { fontSize: 12 } }>JSON</Text>
        <Button
          onClick={ () => { inputRef?.click(); } }
          icon={ <InboxOutlined /> }
        >{ t('选择文件') }</Button>
        <Button
          icon={ <ThunderboltOutlined /> }
          onClick={ () => { setFileName(''); loadText(SAMPLE_JSON); } }
        >{ t('载入示例') }</Button>
        <Text type="secondary" style={ { fontSize: 12 } }>{ t('缩进') }</Text>
        <Select
          size="small"
          value={ indent }
          style={ { width: 110 } }
          onChange={ (v: Indent) => setIndent(v) }
          options={ INDENT_LIST.map((v) => ({ value: v.value, label: t(v.label) })) }
        />
        <Checkbox
          checked={ skipBlank }
          onChange={ (e) => setSkipBlank(e.target.checked) }
        >{ t('忽略空行 (JSONL 输入)') }</Checkbox>
      </Space>
      <input
        type="file"
        ref={ (el) => { inputRef = el; } }
        style={ { display: 'none' } }
        accept=".json,.jsonl,.ndjson,.txt"
        onChange={ (e) => { onFile(e.target.files); e.target.value = ''; } }
      />
      <TextArea
        style={ { margin: '5px 0 5px 0' } }
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setJson(e.target.value); } }
        title={ t('双击复制内容到粘贴板') }
        value={ json }
        placeholder={ t('输入或粘贴 JSON (数组 / 对象)  或 拖拽文件到框内打开') }
        autoSize={ { minRows: 6, maxRows: 14 } }
        spellCheck={ false }
        onDragOver={ (e) => { e.preventDefault(); } }
        onDrop={ (e) => { e.preventDefault(); onFile(e.dataTransfer.files); } }
      />
      { hintOf(json) !== '' && (
        <div style={ { marginBottom: 4 } }><Text type="secondary" style={ { fontSize: 12 } }>{ hintOf(json) }</Text></div>
      ) }

      <Space wrap style={ { marginBottom: 6, marginTop: 4 } }>
        <Button
          onClick={ () => convert('to-jsonl') }
          style={ { backgroundColor: '#007bff', color: '#fff' } }
          icon={ <ArrowDownOutlined /> }
        >{ DIR_LABEL['to-jsonl'] }</Button>
        <Button
          onClick={ () => convert('to-json') }
          style={ { backgroundColor: '#28a745', color: '#fff' } }
          icon={ <ArrowUpOutlined /> }
        >{ DIR_LABEL['to-json'] }</Button>
        <Button
          onClick={ () => { copy(result); } }
          style={ { backgroundColor: '#17a2b8', color: '#fff' } }
          disabled={ !canUseResult }
          icon={ <CopyOutlined /> }
        >{ t('复制结果') }</Button>
        <Button
          onClick={ () => { void download(); } }
          style={ { backgroundColor: '#6c757d', color: '#fff' } }
          disabled={ !canUseResult }
          icon={ <DownloadOutlined /> }
        >{ t('下载') }</Button>
        <Button
          onClick={ () => { setJson(''); setJsonl(''); setStat(''); setSide(''); setFileName(''); } }
          style={ { backgroundColor: '#dc3545', color: '#fff' } }
        >{ t('清除') }</Button>
      </Space>

      <Text strong style={ { fontSize: 12 } }>JSONL</Text>
      <TextArea
        style={ { margin: '5px 0 5px 0' } }
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setJsonl(e.target.value); } }
        title={ t('双击复制内容到粘贴板') }
        value={ jsonl }
        placeholder={ t('输入或粘贴 JSONL (每行一条 JSON)  或 拖拽文件到框内打开') }
        autoSize={ { minRows: 6, maxRows: 14 } }
        spellCheck={ false }
        onDragOver={ (e) => { e.preventDefault(); } }
        onDrop={ (e) => { e.preventDefault(); onFile(e.dataTransfer.files); } }
      />

      <Space wrap size={ 12 } style={ { marginTop: 4 } }>
        { hintOf(jsonl) !== '' && <Text type="secondary" style={ { fontSize: 12 } }>{ hintOf(jsonl) }</Text> }
        { fileName !== '' && <Text type="secondary" style={ { fontSize: 12 } }>{ tT('已载入文件: {name}', { name: fileName }) }</Text> }
        { stat !== '' && <Text type="success" style={ { fontSize: 12 } }>{ stat }</Text> }
        { side === 'jsonl' && <Text type="secondary" style={ { fontSize: 12 } }>{ t('每行一条紧凑 JSON, 便于流式读取与导入大数据平台') }</Text> }
      </Space>

      <Divider>{ t('JSONL 转换说明') }</Divider>

      <JSONLConvertIntro />
    </div>
  );
};

export default JSONLConvert;
