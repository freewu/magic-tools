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

/** 转换方向: JSON 数组 -> JSONL / JSONL -> JSON 数组 */
type Direction = 'to-jsonl' | 'to-json';

const DIR_LABEL: Record<Direction, string> = {
  'to-jsonl': 'JSON → JSONL',
  'to-json': 'JSONL → JSON',
};

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

  const [ raw, setRaw ] = useState(''); // 输入
  const [ out, setOut ] = useState(''); // 输出
  const [ indent, setIndent ] = useState<Indent>(DEFAULT_INDENT); // JSON 输出缩进
  const [ skipBlank, setSkipBlank ] = useState(true); // 忽略空行
  const [ stat, setStat ] = useState(''); // 上次转换结果说明
  const [ outExt, setOutExt ] = useState('jsonl'); // 下载扩展名
  const [ fileName, setFileName ] = useState(''); // 已载入的文件名

  const detected = detectInput(raw);
  const hint = detected.kind === 'empty'
    ? ''
    : detected.kind === 'jsonl'
      ? tT('识别到: JSONL ({n} 行)', { n: detected.count })
      : detected.kind === 'json'
        ? (detected.array
          ? tT('识别到: JSON 数组 ({n} 条)', { n: detected.count })
          : t('识别到: JSON 对象 (单条记录)'))
        : t('无法识别: 内容既不是完整 JSON, 也不是逐行合法的 JSONL');

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
   * 转换
   * @param dir 目标方向 (按钮声明的方向)
   * @param text 指定源文本 (载入文件 / 示例后立即转换); 不传则取输入框, 输入框为空时改用结果框
   * 说明: 输入内容与目标方向明显不符时 (JSON 数组却点了「JSONL → JSON」等) 自动纠正方向,
   *       避免用户因为放错框 / 点错按钮而拿到报错
   */
  const convert = (dir: Direction, text?: string) => {
    const given = text ?? raw;
    const useOutBox = given.trim() === '' && out.trim() !== '';
    const src = useOutBox ? out : given;
    if (src.trim() === '') {
      message.warning(t('请先在上方输入框粘贴或输入内容'));
      return;
    }
    if (useOutBox) message.info(t('输入框为空, 已改用下方结果框的内容'));

    // 识别输入形态, 纠正明显的方向错误
    const kind = detectInput(src);
    let real = dir;
    if (dir === 'to-json' && kind.array === true) real = 'to-jsonl'; // 整段是 JSON 数组, 不可能按行解析
    if (dir === 'to-jsonl' && kind.kind === 'jsonl') real = 'to-json'; // 逐行 JSON, 整段 JSON.parse 会失败
    if (real !== dir) {
      message.info(tT('检测到输入是 {kind}, 已自动按「{dir}」转换', {
        kind: kind.array === true ? t('JSON 数组') : t('JSONL'),
        dir: DIR_LABEL[real],
      }));
    }

    try {
      const r = real === 'to-jsonl' ? jsonToJsonl(src) : jsonlToJson(src, { indent, skipBlank });
      const dirLabel = DIR_LABEL[real];
      const tip = r.single
        ? tT('已转换 1 条记录 ({dir}, 顶层为单个值)', { dir: dirLabel })
        : tT('已转换 {n} 条记录 ({dir})', { n: r.count, dir: dirLabel });
      setOut(r.text);
      setOutExt(real === 'to-jsonl' ? 'jsonl' : 'json');
      setStat(tip);
      message.success(tip);
    } catch (e) {
      const em = errText(e);
      setOut('');
      setStat('');
      message.error(em);
    }
  };

  /** 载入文本 (文件 / 示例) 并按识别结果自动转换 */
  const loadText = (text: string) => {
    setRaw(text);
    setStat('');
    setOut('');
    const kind = detectInput(text);
    if (kind.kind === 'json') convert('to-jsonl', text);
    else if (kind.kind === 'jsonl') convert('to-json', text);
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
    if (out === '') return;
    const base = (fileName === '' ? 'data' : fileName.replace(/\.[^/.]+$/u, '')) || 'data';
    const name = `${base}.${outExt}`;
    const isJsonl = outExt === 'jsonl';
    const ok = await saveTextFile(name, out, t(isJsonl ? '保存 JSONL 文件' : '保存 JSON 文件'), {
      filterName: t(isJsonl ? 'JSONL 文件' : 'JSON 文件'),
      extensions: isJsonl ? [ 'jsonl', 'ndjson' ] : [ 'json' ],
    });
    if (!ok) return; // 用户取消保存
    message.success(tT(isTauri() ? '已保存 {file}' : '已下载 {file}', { file: name }));
  };

  let inputRef: HTMLInputElement | null = null;

  return (
    <div>
      <Text strong style={ { fontSize: 12 } }>{ t('输入 (JSON 数组 / JSONL)') }</Text>
      <TextArea
        style={ { margin: '5px 0 5px 0' } }
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setRaw(e.target.value); } }
        title={ t('双击复制内容到粘贴板') }
        value={ raw }
        placeholder={ t('输入 JSON 数组 或 JSONL 文本  或 拖拽文件到框内打开') }
        autoSize={ { minRows: 6, maxRows: 14 } }
        spellCheck={ false }
        onDragOver={ (e) => { e.preventDefault(); } }
        onDrop={ (e) => { e.preventDefault(); onFile(e.dataTransfer.files); } }
      />

      <Space wrap style={ { marginBottom: 6 } }>
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
          onClick={ () => { copy(out); } }
          style={ { backgroundColor: '#17a2b8', color: '#fff' } }
          disabled={ out === '' }
          icon={ <CopyOutlined /> }
        >{ t('复制结果') }</Button>
        <Button
          onClick={ () => { void download(); } }
          style={ { backgroundColor: '#6c757d', color: '#fff' } }
          disabled={ out === '' }
          icon={ <DownloadOutlined /> }
        >{ t('下载') }</Button>
        <Button
          onClick={ () => { inputRef?.click(); } }
          icon={ <InboxOutlined /> }
        >{ t('选择文件') }</Button>
        <input
          type="file"
          ref={ (el) => { inputRef = el; } }
          style={ { display: 'none' } }
          accept=".json,.jsonl,.ndjson,.txt"
          onChange={ (e) => { onFile(e.target.files); e.target.value = ''; } }
        />
        <Button
          icon={ <ThunderboltOutlined /> }
          onClick={ () => { setFileName(''); loadText(SAMPLE_JSON); } }
        >{ t('载入示例') }</Button>
        <Button
          onClick={ () => { setRaw(''); setOut(''); setStat(''); setFileName(''); } }
          style={ { backgroundColor: '#dc3545', color: '#fff' } }
        >{ t('清除') }</Button>
      </Space>
      &nbsp;
      <Space wrap style={ { marginBottom: 6 } }>
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

      <Text strong style={ { fontSize: 12 } }>{ t('转换结果 (可直接编辑)') }</Text>
      <TextArea
        style={ { margin: '5px 0 5px 0' } }
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setOut(e.target.value); } }
        title={ t('双击复制内容到粘贴板') }
        value={ out }
        placeholder={ t('转换结果会显示在这里 (双击可复制)') }
        autoSize={ { minRows: 6, maxRows: 14 } }
        spellCheck={ false }
        onDragOver={ (e) => { e.preventDefault(); } }
        onDrop={ (e) => { e.preventDefault(); onFile(e.dataTransfer.files); } }
      />

      <Space wrap size={ 12 } style={ { marginBottom: 4 } }>
        { hint !== '' && <Text type="secondary" style={ { fontSize: 12 } }>{ hint }</Text> }
        { fileName !== '' && <Text type="secondary" style={ { fontSize: 12 } }>{ tT('已载入文件: {name}', { name: fileName }) }</Text> }
        { stat !== '' && <Text type="success" style={ { fontSize: 12 } }>{ stat }</Text> }
        { outExt === 'jsonl' && out !== '' && (
          <Text type="secondary" style={ { fontSize: 12 } }>{ t('每行一条紧凑 JSON, 便于流式读取与导入大数据平台') }</Text>
        ) }
      </Space>

      <Divider>{ t('JSONL 转换说明') }</Divider>

      <JSONLConvertIntro />
    </div>
  );
};

export default JSONLConvert;
