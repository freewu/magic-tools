import { Button, Divider, Input, Radio, Select, Space, Switch, Tabs, Tag, Typography, message } from 'antd';
import { useMemo, useRef, useState } from 'react';
const { TextArea } = Input;
const { Text } = Typography;
import {
  CheckCircleOutlined, ClearOutlined, CloseCircleOutlined, CopyOutlined, FileTextOutlined,
  FolderOpenOutlined, LockOutlined, SaveOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import { copyTextToClipboard } from '../../lib';
import { openFile } from '../../lib/file';
import { saveTextFile } from '../../lib/tauri';
import { useLocale } from '../../hook/locale-context';
import { u, uT } from './lang';
import JsIntro from './intro';
import { beautifyJs, escapeJsStrings, jsSignature, minifyJs, packJs, unpackJs, type UnpackKind } from './lib';
import {
  INDENT_OPTIONS, OBFUSCATE_MODES, RESULT_HEIGHT, SAMPLE_JS,
  type JsMode, type ObfuscateMode,
} from './data';

// 代码高亮: 复用 highlight.js core + monokai-sublime 主题
import 'highlight.js/styles/monokai-sublime.css';
import hljs from 'highlight.js/lib/core';
import javascriptLang from 'highlight.js/lib/languages/javascript';
hljs.registerLanguage('javascript', javascriptLang);

/** 还原层 -> 展示标签 */
const KIND_LABELS: Record<UnpackKind, string> = {
  'packer': '词表打包',
  'classic-packer': '经典 packer',
  'eval': 'eval 包裹',
  'escape': '字符串转义',
};

const RESULT_TITLES: Record<JsMode, string> = {
  beautify: '美化结果',
  minify: '压缩结果',
  obfuscate: '混淆结果',
  deobfuscate: '还原结果',
};

const JsFormatter = () => {
  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tt = (zh: string, vars?: Record<string, string | number>) => uT(locale, zh, vars);

  const [ input, setInput ] = useState('');
  const [ result, setResult ] = useState('');
  const [ mode, setMode ] = useState('intro');
  const [ kind, setKind ] = useState<JsMode>('beautify'); // 结果来源
  // 美化选项
  const [ indent, setIndent ] = useState(INDENT_OPTIONS[0].value);
  const [ blankLines, setBlankLines ] = useState(true);
  // 压缩选项
  const [ removeComments, setRemoveComments ] = useState(true);
  const [ oneLine, setOneLine ] = useState(true);
  // 混淆选项
  const [ obfMode, setObfMode ] = useState<ObfuscateMode>('pack');
  // 还原层
  const [ layers, setLayers ] = useState<UnpackKind[]>([]);
  // token 指纹是否一致 (null = 不适用)
  const [ sigOk, setSigOk ] = useState<boolean | null>(null);
  const [ notice, contextHolder ] = message.useMessage();

  const resultRef = useRef('');
  let inputRef: HTMLInputElement | null = null;

  const warnEmpty = () => notice.warning(t('请先输入 JavaScript 代码'));
  const setOut = (out: string, from: JsMode, same: boolean | null = null, restLayers: UnpackKind[] = []) => {
    setResult(out);
    resultRef.current = out;
    setKind(from);
    setSigOk(same);
    setLayers(restLayers);
  };

  const runBeautify = () => {
    if (input.trim() === '') { warnEmpty(); return; }
    const out = beautifyJs(input, { indent, blankLines });
    setOut(out, 'beautify', jsSignature(input) === jsSignature(out));
  };

  const runMinify = () => {
    if (input.trim() === '') { warnEmpty(); return; }
    const out = minifyJs(input, { removeComments, oneLine });
    setOut(out, 'minify', jsSignature(input) === jsSignature(out));
  };

  const runObfuscate = () => {
    if (input.trim() === '') { warnEmpty(); return; }
    setOut(obfMode === 'pack' ? packJs(input) : escapeJsStrings(input, obfMode), 'obfuscate');
  };

  const runDeobfuscate = () => {
    if (input.trim() === '') { warnEmpty(); return; }
    const res = unpackJs(input);
    setOut(res.code, 'deobfuscate', null, res.kinds);
    if (res.kinds.length === 0) notice.info(t('未检测到可还原的混淆特征, 已原样返回'));
  };

  const copyResult = () => {
    if (resultRef.current.trim() === '') { warnEmpty(); return; }
    void copyTextToClipboard(resultRef.current);
    notice.success(t('复制到粘贴板成功！！！'));
  };

  const saveJs = async () => {
    if (resultRef.current.trim() === '') { warnEmpty(); return; }
    try {
      const saved = await saveTextFile('formatted.js', resultRef.current, t('保存为 .js'), {
        filterName: t('JavaScript 文件'), extensions: [ 'js' ],
      });
      if (saved) notice.success(t('已保存 JavaScript 文件'));
    } catch (err) {
      notice.error(tt('保存失败: {m}', { m: (err as Error).message }));
    }
  };

  const fileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files || [];
    if (files.length === 0) return;
    if (!/\.(m?js|cjs|txt)$/i.test(files[0].name)) {
      notice.error(t('请选择 .js / .mjs / .cjs / .txt 文件'));
      return;
    }
    openFile(files, (txt: string) => setInput(txt));
  };

  const clearAll = () => {
    setInput('');
    setResult('');
    resultRef.current = '';
    setLayers([]);
    setSigOk(null);
  };

  const highlighted = useMemo(
    () => (result === '' ? '' : hljs.highlight(result, { language: 'javascript' }).value),
    [ result ],
  );

  const clickResult = (e: React.MouseEvent<HTMLElement>) => {
    const txt = (e.target as HTMLElement).textContent ?? '';
    if (txt.trim() === '') return;
    void copyTextToClipboard(resultRef.current);
    notice.success(t('复制到粘贴板成功！！！'));
  };

  // 美化页签
  const beautifyTab = (
    <Space wrap size={12}>
      <Space size={6}>
        <Text style={ { fontSize: 13 } }>{t('缩进')}</Text>
        <Select
          size="small"
          style={ { width: 110 } }
          value={ indent }
          onChange={ (v) => setIndent(v) }
          options={ INDENT_OPTIONS.map((o) => ({ value: o.value, label: t(o.label) })) }
        />
      </Space>
      <Space size={6}>
        <Text style={ { fontSize: 13 } }>{t('保留空行')}</Text>
        <Switch size="small" checked={ blankLines } onChange={ setBlankLines } />
      </Space>
      <Button
        onClick={ runBeautify }
        style={ { backgroundColor: '#007bff', color: '#fff' } }
        icon={ <ThunderboltOutlined /> }
      >{t('美化')}</Button>
    </Space>
  );

  // 压缩页签
  const minifyTab = (
    <Space wrap size={12}>
      <Space size={6}>
        <Text style={ { fontSize: 13 } }>{t('移除注释')}</Text>
        <Switch size="small" checked={ removeComments } onChange={ setRemoveComments } />
      </Space>
      <Space size={6}>
        <Text style={ { fontSize: 13 } }>{t('单行输出')}</Text>
        <Switch size="small" checked={ oneLine } onChange={ setOneLine } />
      </Space>
      <Button
        onClick={ runMinify }
        style={ { backgroundColor: '#6610f2', color: '#fff' } }
        icon={ <ThunderboltOutlined /> }
      >{t('压缩')}</Button>
    </Space>
  );

  // 混淆页签
  const obfuscateTab = (
    <div>
      <Radio.Group
        value={ obfMode }
        onChange={ (e) => setObfMode(e.target.value) }
        options={ OBFUSCATE_MODES.map((o) => ({ value: o.value, label: t(o.label) })) }
        optionType="button"
        buttonStyle="solid"
        size="small"
      />
      <div style={ { margin: '8px 0' } }>
        <Text type="secondary" style={ { fontSize: 12 } }>
          {t(OBFUSCATE_MODES.find((o) => o.value === obfMode)?.desc ?? '')}
        </Text>
      </div>
      <Space wrap size={12}>
        <Button
          onClick={ runObfuscate }
          style={ { backgroundColor: '#e83e8c', color: '#fff' } }
          icon={ <LockOutlined /> }
        >{t('加密')}</Button>
        <Text type="secondary" style={ { fontSize: 12 } }>{t('全部本地完成, 不上传任何代码')}</Text>
      </Space>
    </div>
  );

  // 解密页签
  const deobfuscateTab = (
    <Space wrap size={12}>
      <Button
        onClick={ runDeobfuscate }
        style={ { backgroundColor: '#fd7e14', color: '#fff' } }
        icon={ <ThunderboltOutlined /> }
      >{t('解密')}</Button>
      <Text type="secondary" style={ { fontSize: 12 } }>
        {t('自动识别混淆特征并逐层还原 (词表打包 / 经典 packer / eval 包裹 / 字符串转义), 全过程本地完成, 不会执行代码')}
      </Text>
    </Space>
  );

  return (
    <div>
      {contextHolder}

      <Space wrap>
        <Button
          onClick={ () => inputRef?.click() }
          style={ { backgroundColor: '#6c757d', color: '#fff' } }
          icon={ <FolderOpenOutlined /> }
        >{t('打开 .js')}</Button>
        <Button
          onClick={ () => void saveJs() }
          style={ { backgroundColor: '#17a2b8', color: '#fff' } }
          icon={ <SaveOutlined /> }
        >{t('保存为 .js')}</Button>
        <Button
          onClick={ copyResult }
          style={ { backgroundColor: '#20c997', color: '#fff' } }
          icon={ <CopyOutlined /> }
        >{t('复制结果')}</Button>
        <Button
          onClick={ () => setInput(SAMPLE_JS) }
          style={ { backgroundColor: '#fd7e14', color: '#fff' } }
          icon={ <FileTextOutlined /> }
        >{t('示例')}</Button>
        <Button
          onClick={ clearAll }
          style={ { backgroundColor: '#dc3545', color: '#fff' } }
          icon={ <ClearOutlined /> }
        >{t('清除')}</Button>
        <input
          onChange={ fileChange }
          ref={ (el) => { inputRef = el; } }
          type="file" id="jsFileInput" style={ { display: 'none' } } accept=".js,.mjs,.cjs,.txt" />
      </Space>

      <TextArea
        style={ { margin: '12px 0 5px 0' } }
        onChange={ (e) => setInput(e.target.value) }
        value={ input }
        placeholder={ t('输入 JavaScript 代码, 或拖拽 .js 文件到框内打开') }
        autoSize={ { minRows: 8, maxRows: 16 } }
        onDragOver={ (e) => { e.preventDefault(); } }
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, (txt: string) => setInput(txt)); } }
      />

      <Divider dashed />

      <Tabs
        size="small"
        activeKey={ mode }
        onChange={ (k) => setMode(k) }
        items={ [
          { key: 'intro', label: <Text style={ { fontSize: 13 } }>{t('说明')}</Text>, children: <JsIntro /> },
          { key: 'beautify', label: <Text style={ { fontSize: 13 } }>{t('代码美化')}</Text>, children: beautifyTab },
          { key: 'minify', label: <Text style={ { fontSize: 13 } }>{t('代码压缩')}</Text>, children: minifyTab },
          { key: 'obfuscate', label: <Text style={ { fontSize: 13 } }>{t('混淆加密')}</Text>, children: obfuscateTab },
          { key: 'deobfuscate', label: <Text style={ { fontSize: 13 } }>{t('解密还原')}</Text>, children: deobfuscateTab },
        ] }
      />

      <div style={ { marginTop: 12 } }>
        <Space wrap size={8} style={ { marginBottom: 6 } }>
          <Text strong style={ { fontSize: 13 } }>{t(RESULT_TITLES[kind])}</Text>
          {sigOk === true && (
            <Tag color="success" icon={ <CheckCircleOutlined /> }>{t('语义未变 (token 指纹一致)')}</Tag>
          )}
          {sigOk === false && (
            <Tag color="warning" icon={ <CloseCircleOutlined /> }>
              {t('注意: 结果与原代码的 token 指纹不一致, 请检查后再使用')}
            </Tag>
          )}
          {kind === 'deobfuscate' && layers.length > 0 && (
            <Tag color="processing">{tt('已还原: {n} 层', { n: layers.length })}</Tag>
          )}
          {layers.map((k) => <Tag key={ k }>{t(KIND_LABELS[k])}</Tag>)}
          {result !== '' && (
            <Text type="secondary" style={ { fontSize: 12 } }>{t('字符数')}: {result.length}</Text>
          )}
        </Space>
        <div
          style={ {
            border: '1px solid #d9d9d9', borderRadius: 4, background: '#23241f',
            height: RESULT_HEIGHT, minHeight: 160, overflow: 'auto',
          } }
        >
          {result === '' ? (
            <div style={ { padding: 12, color: '#8a8a8a', fontSize: 13 } }>
              {t('格式化后的代码会显示在这里 (点击可复制)')}
            </div>
          ) : (
            <pre
              className="hljs"
              title={ t('结果 (点击可复制)') }
              onClick={ clickResult }
              style={ { margin: 0, minHeight: '100%' } }
              dangerouslySetInnerHTML={ { __html: highlighted } }
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default JsFormatter;
