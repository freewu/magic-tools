import { Button, Checkbox, Divider, Input, Select, Space, Tag, theme, message } from 'antd';
import { useMemo, useState } from 'react';
const { TextArea } = Input;
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from './../../lib'
import {
  listRegexPresets,
  compileRegex,
  lineMatches,
  matchAllCount,
  type RegexPreset,
} from './lib'
import RegexIntro from './intro'

// 示例文本 (混合各行)
const SAMPLE_TEXT = [
  'zhangsan@example.com',
  'lisi@test.org.cn',
  'not-an-email',
  'https://www.baidu.com',
  'ftp://files.server.com/pub?x=1',
  '192.168.1.1',
  '999.1.1.1',
  '13800138000',
  '12345',
  'abc123',
  '小明',
  'Hello World',
  '2024-01-15',
  '14:30',
].join('\n');

const FLAG_OPTIONS = [
  { value: 'i', label: 'i 忽略大小写' },
  { value: 'g', label: 'g 全局' },
  { value: 'm', label: 'm 多行' },
  { value: 's', label: 's 点匹配换行' },
];

const RegexTester = () => {

  const { token } = theme.useToken();

  const [ pattern, setPattern ] = useState('');
  const [ flags, setFlags ] = useState<string[]>([]);
  const [ content, setContent ] = useState('');
  const [ presets, setPresets ] = useState<RegexPreset[]>(() => listRegexPresets());
  const [ notice, contextHolder ] = message.useMessage();

  const flagStr = flags.join('');

  // 当前正则是否有效
  const regex = useMemo(() => compileRegex(pattern, flagStr), [ pattern, flagStr ]);
  const invalidMsg = (pattern !== '' && regex === null)
    ? (() => { try { new RegExp(pattern, flagStr); return ''; } catch (e) { return (e as Error).message; } })()
    : '';

  // 逐行匹配
  const lines = useMemo(() => {
    const raw = content.replace(/\r\n/g, '\n');
    return raw === '' ? [] : raw.split('\n');
  }, [ content ]);

  const results = useMemo(() => lines.map((line) => lineMatches(regex, line)), [ lines, regex ]);

  const matchedCount = results.filter((r) => r === true).length;
  const matchTimes = (flags.includes('g') || regex?.flags.includes('g'))
    ? matchAllCount(regex, content.replace(/\r\n/g, '\n'))
    : null;

  // 点击预设应用 (下拉展开时重新读取设置中的列表, 保证与设置页同步)
  const applyPreset = (id :number) => {
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    setPattern(p.pattern);
    setFlags(p.flags === '' ? [] : p.flags.split(''));
  };

  // 一键复制某条预设的正则规则 (点击图标只复制不套用)
  const copyPresetRule = (p :RegexPreset) => {
    copyTextToClipboard(p.pattern);
    notice.success('复制到粘贴板成功！！！');
  };

  // 一键复制当前正在使用的正则规则
  const copyCurrentRule = () => {
    if (pattern === '') { notice.warning('请先输入正则表达式'); return; }
    copyTextToClipboard(pattern);
    notice.success('复制到粘贴板成功！！！');
  };

  const copyMatchedLines = () => {
    const matched = lines.filter((_, i) => results[i] === true).join('\n');
    if (matched === '') { notice.warning('没有匹配的行'); return; }
    copyTextToClipboard(matched);
    notice.success('复制到粘贴板成功！！！');
  };

  const renderLine = (line :string, idx :number) => {
    const ok = results[idx];
    const bg = regex === null ? 'transparent'
      : ok === true ? token.colorSuccessBg
      : token.colorErrorBg;
    const border = regex === null ? 'transparent'
      : ok === true ? token.colorSuccessBorder
      : token.colorErrorBorder;
    return (
      <div
        key={ idx }
        style={ {
          display: 'flex', gap: 8, alignItems: 'flex-start',
          padding: '3px 10px',
          background: bg,
          borderLeft: `3px solid ${border}`,
          borderBottom: `1px solid ${token.colorSplit}`,
        } }
      >
        <span style={ { width: 34, flex: 'none', textAlign: 'right', color: token.colorTextTertiary, userSelect: 'none', fontSize: 12, lineHeight: '22px' } }>{ idx + 1 }</span>
        { regex !== null && (
          <span style={ { flex: 'none', color: ok === true ? token.colorSuccess : token.colorError, fontWeight: 700 } }>{ ok === true ? '✓' : '✕' }</span>
        ) }
        <span style={ { whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: token.colorText, lineHeight: '22px' } }>{ line === '' ? ' ' : line }</span>
      </div>
    );
  };

  return (
    <div>
      {contextHolder}

      <Space wrap style={ { width: '100%' } }>
        <Select
          placeholder="常用正则 (在 设置 → 其它 中管理)"
          style={ { minWidth: 220 } }
          options={ presets.map((p) => ({ value: p.id, label: `${p.name}  (${p.pattern})` })) }
          onSelect={ applyPreset }
          onDropdownVisibleChange={ (open) => { if (open) setPresets(listRegexPresets()); } }
          dropdownStyle={ { minWidth: 440 } }
          optionRender={ (ori) => {
            const v = (ori as { value?: number }).value;
            const p = presets.find((x) => x.id === v);
            return (
              <div style={ { display: 'flex', alignItems: 'center', gap: 6 } }>
                <span style={ { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }>{ ori.label }</span>
                { p && (
                  <Button
                    type="text"
                    size="small"
                    icon={ <CopyOutlined /> }
                    title={ `一键复制规则: ${p.pattern}` }
                    onMouseDown={ (e) => e.stopPropagation() }
                    onClick={ (e) => { e.stopPropagation(); copyPresetRule(p); } }
                  />
                ) }
              </div>
            );
          } }
          allowClear
        />
        <Button
          size="small"
          icon={ <CopyOutlined /> }
          title="一键复制当前正则规则"
          onClick={ copyCurrentRule }
        >复制规则</Button>
        <Button
          size="small"
          icon={ <ReloadOutlined /> }
          title="重新读取设置中的常用正则"
          onClick={ () => setPresets(listRegexPresets()) }
        >刷新</Button>
      </Space>

      <div style={ { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, alignItems: 'center' } }>
        <span>正则</span>
        <Input
          allowClear
          value={ pattern }
          placeholder="输入正则表达式, 例如 ^1[3-9]\d{9}$"
          onChange={ (e) => setPattern(e.target.value) }
          style={ { flex: '1 1 320px', minWidth: 280 } }
        />
        <Checkbox.Group
          options={ FLAG_OPTIONS }
          value={ flags }
          onChange={ (v) => setFlags(v as string[]) }
        />
      </div>
      { invalidMsg !== '' && (
        <div style={ { color: token.colorError, fontSize: 12, marginTop: 4 } }>正则表达式无效: { invalidMsg }</div>
      ) }

      <TextArea
        style={ { margin: "12px 0 5px 0" } }
        value={ content }
        placeholder="在此输入多行内容, 逐行与正则匹配: 匹配行显示为绿色, 不匹配行显示为红色"
        autoSize={{ minRows: 8, maxRows: 14 }}
        onChange={ (e) => setContent(e.target.value) }
      />

      <Space wrap style={ { margin: '4px 0' } }>
        <Button
          size="small"
          icon={ <CopyOutlined /> }
          onClick={ copyMatchedLines }
        >复制匹配行</Button>
        <Button
          size="small"
          icon={ <ClearOutlined /> }
          onClick={ () => setContent(SAMPLE_TEXT) }
        >填入示例</Button>
        <Button
          size="small"
          danger
          type="text"
          onClick={ () => { setPattern(''); setFlags([]); } }
        >清空正则</Button>
        { regex !== null && content !== '' && (
          <Tag color={ matchedCount > 0 ? 'success' : 'error' }>
            匹配 { matchedCount } / { lines.length } 行{ matchTimes !== null ? `, 共 ${matchTimes} 处` : '' }
          </Tag>
        ) }
      </Space>

      { content !== '' && (
        <div
          style={ {
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: 6,
            maxHeight: 360,
            overflowY: 'auto',
            background: token.colorBgContainer,
          } }
        >
          { lines.map(renderLine) }
        </div>
      ) }

      <Divider> 正则表达式说明 </Divider>

      <RegexIntro />
    </div>
  );
}

export default RegexTester;
