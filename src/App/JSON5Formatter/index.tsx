import { Divider, Button, Input, Space, message, Tabs, Tree, Typography } from "antd";
import { useMemo, useState } from "react";
const { TextArea } = Input;
const { Text } = Typography;
import { ArrowDownOutlined, DeleteOutlined, SaveOutlined, ColumnWidthOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from "../../lib";
import { openFile } from "../../lib/file";
import { saveTextFile } from "../../lib/tauri";
import { j5Pretty, j5Compact, j5ParseValue } from "./lib";
import { jsonValueToTree } from "../JsonFormatter/lib";
import type { JsonTreeNode } from "../JsonFormatter/lib";
import type { TreeDataNode } from "antd";

// 代码高亮 (近似: JSON5 是 JSON 超集, 用 json 语言高亮, 注释部分以普通文本展示)
import 'highlight.js/styles/monokai-sublime.css';
import jsonLang from 'highlight.js/lib/languages/json';
import highlight from 'highlight.js/lib/core';
highlight.registerLanguage('json', jsonLang);
import '../JsonFormatter/json-formatter.css';

const MAX_STR = 120; // 树中字符串值最长展示长度
const MAX_AUTO_EXPAND = 300;

// JsonTreeNode -> antd Tree 节点
const toTreeData = (node: JsonTreeNode, isRoot = false): TreeDataNode => {
  const isLeaf = node.meta === 'val';
  const head = isRoot
    ? (node.meta === 'arr' ? '数组' : '对象')
    : node.label;
  const count = !isLeaf ? ` (${node.size})` : '';
  const valText = isLeaf ? node.text : '';
  const title: React.ReactNode = (
    <span style={ { fontSize: 13 } }>
      <span style={ { fontWeight: 600 } }>{ head }</span>
      <span style={ { opacity: 0.55, marginLeft: 6 } }>{ count }</span>
      { valText && <span style={ { color: '#2f9e44', marginLeft: 4, wordBreak: 'break-all' } }>{ truncate(valText) }</span> }
    </span>
  );
  return {
    key: node.key,
    title,
    children: node.children.length ? node.children.map((c) => toTreeData(c)) : undefined,
  };
};

const truncate = (s: string): string => (s.length > MAX_STR ? s.slice(0, MAX_STR) + '…' : s);

const JSON5Formatter = () => {

  const [ input, setInput ] = useState('');
  const [ j5Text, setJ5Text ] = useState(''); // 格式化后的展示文本
  const [ view, setView ] = useState('text'); // text | tree
  const [ treeRoot, setTreeRoot ] = useState<JsonTreeNode | null>(null);
  const [ expandedKeys, setExpandedKeys ] = useState<React.Key[]>([]);
  const [ notice, contextHolder ] = message.useMessage();

  const outputHeight = useMemo(() => `calc(100vh - ${view === 'text' ? 500 : 320}px)`, [ view ]);

  const textareaDoubleClick = (e: React.MouseEvent<HTMLElement>) => {
    const txt = (e.target as HTMLElement).textContent ?? '';
    if (txt.trim() === '') return;
    void copyTextToClipboard(txt);
    notice.success('复制到粘贴板成功！！！');
  };

  // 解析并设置展示内容 (pretty | compact)
  const doFormat = (mode: 'pretty' | 'compact') => {
    const src = input.trim();
    if (src === '') {
      notice.warning('请先输入 JSON5 字符串');
      return;
    }
    try {
      const value = j5ParseValue(src);
      const out = mode === 'pretty' ? j5Pretty(src) : j5Compact(src);
      setJ5Text(out);
      // 构建树并初始化展开 (最多两层, 大对象只展开根下第一层)
      const root = jsonValueToTree(value);
      setTreeRoot(root);
      const keys: string[] = [];
      let counter = 0;
      const collect = (node: JsonTreeNode, depth: number) => {
        if (counter >= MAX_AUTO_EXPAND) return;
        if (node.children.length === 0) return;
        if (depth <= 1) {
          keys.push(node.key);
          counter += 1;
        }
        node.children.forEach((c) => collect(c, depth + 1));
      };
      collect(root, 0);
      setExpandedKeys(keys);
      setView('text');
    } catch (err) {
      notice.error('JSON5 解析失败: ' + (err as Error).message);
    }
  };

  // 保存为 .json5
  const saveJ5 = async () => {
    if (j5Text.trim() === '') {
      notice.warning('请先格式化 JSON5 再保存');
      return;
    }
    try {
      const saved = await saveTextFile('formatted.json5', j5Text, '保存 JSON5 文件', { filterName: 'JSON5 文件', extensions: ['json5'] });
      if (saved) notice.success('已保存 JSON5 文件');
    } catch (err) {
      notice.error('保存失败: ' + (err as Error).message);
    }
  };

  const fileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files || [];
    if (files.length === 0) return;
    if (!/.*\.json5?$/i.test(files[0].name)) {
      notice.error('请选择 .json5 / .json 文件');
      return;
    }
    openFile(files, (txt: string) => setInput(txt));
  };

  const clearAll = () => {
    setInput('');
    setJ5Text('');
    setTreeRoot(null);
    setExpandedKeys([]);
  };

  // 行号文本
  const lines = useMemo(() => (j5Text === '' ? [] : j5Text.split('\n')), [ j5Text ]);
  const highlighted = useMemo(
    () => (j5Text === '' ? '' : highlight.highlight(j5Text, { language: 'json' }).value),
    [ j5Text ],
  );

  const textTab = (
    <div className="json-out" style={ { height: outputHeight, minHeight: 200 } }>
      { j5Text === '' ? (
        <div className="json-empty">格式化后的 JSON5 将显示在这里（每行左侧带行号，点击结果可复制）</div>
      ) : (
        <div className="json-inner">
          <div className="json-lines" title="行号">{ lines.map((_, i) => i + 1).join('\n') }</div>
          <pre
            className="hljs"
            title="点击复制内容到粘贴板"
            onClick={ textareaDoubleClick }
            dangerouslySetInnerHTML={ { __html: highlighted } }
          />
        </div>
      ) }
    </div>
  );

  const treeTab = treeRoot ? (
    <div style={ { border: '1px solid #d9d9d9', borderRadius: 4, padding: 8, height: outputHeight, minHeight: 200, overflow: 'auto' } }>
      <Tree
        showLine
        defaultExpandParent={ false }
        expandedKeys={ expandedKeys }
        onExpand={ (keys) => setExpandedKeys(keys) }
        treeData={ [ toTreeData(treeRoot, true) ] }
        selectable={ false }
      />
    </div>
  ) : (
    <div className="json-out" style={ { height: outputHeight, minHeight: 200 } }>
      <div className="json-empty">先在上方输入 JSON5 并点击「格式化」，即可在此折叠/展开查看结构</div>
    </div>
  );

  let inputRef: HTMLInputElement | null = null;

  return (
    <div>
      {contextHolder}

      <Space wrap>
        <Button
          onClick={ () => doFormat('pretty') }
          style={ { backgroundColor: "#007bff", color: "#fff" } }
          icon={ <ArrowDownOutlined /> }
        >格式化</Button>
        <Button
          onClick={ () => doFormat('compact') }
          style={ { backgroundColor: "#6610f2", color: "#fff" } }
          icon={ <ColumnWidthOutlined /> }
        >转一行</Button>
        <Button
          onClick={ () => void saveJ5() }
          style={ { backgroundColor: "#17a2b8", color: "#fff" } }
          icon={ <SaveOutlined /> }
        >保存为 .json5</Button>
        <Button
          onClick={ () => inputRef?.click() }
          style={ { backgroundColor: "#6c757d", color: "#fff" } }
        >打开 .json5</Button>
        <input
          onChange={ fileChange }
          ref={ (el) => { inputRef = el; } }
          type="file" id="json5FileInput" style={ { display: 'none' } } accept=".json5,.json" />
        <Button
          onClick={ clearAll }
          style={ { backgroundColor: "#dc3545", color: "#fff" } }
          icon={ <DeleteOutlined /> }
        >清除</Button>
      </Space>

      <TextArea
        style={ { margin: "12px 0 5px 0" } }
        onChange={ (e) => { setInput(e.target.value); } }
        value={ input }
        placeholder={ "输入 JSON5 字符串 (支持注释 // /* */、单引号、无引号键名、尾逗号)  或拖拽 .json5 文件到框内打开" }
        autoSize={ { minRows: 7, maxRows: 7 } }
        onDragOver={ (e) => { e.preventDefault(); } }
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, (txt: string) => setInput(txt)); } }
      />

      <Divider dashed />

      <Tabs
        size="small"
        activeKey={ view }
        onChange={ (k) => setView(k) }
        items={ [
          { key: 'text', label: <Text style={ { fontSize: 13 } }>文本（行号）</Text>, children: textTab },
          { key: 'tree', label: <Text style={ { fontSize: 13 } }>树形折叠</Text>, children: treeTab },
        ] }
      />
    </div>
  );
}

export default JSON5Formatter;
