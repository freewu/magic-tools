import { Button, Select, Space, theme, message } from 'antd';
import { useMemo, useState } from 'react';
import { CopyOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from './../../lib'
import { useLocale } from './../../hook/locale-context'
import { u, uT } from './lang'
import {
  buildRegexCode,
  REGEX_CODE_LABELS,
  REGEX_CODE_LANGS,
  MAX_TEXT_LINES,
  type RegexCodeLang,
} from './codegen'

interface Props {
  /** 当前正则表达式 */
  pattern: string;
  /** 当前标志位 (如 'gi') */
  flags: string;
  /** 上方的测试文本 */
  text: string;
}

/** 「代码生成」页签: 选语言 → 生成对应语言的调用代码 */
const RegexCodeTab = ({ pattern, flags, text }: Props) => {

  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => uT(locale, zh, v);

  const { token } = theme.useToken();
  const [ lang, setLang ] = useState<RegexCodeLang>('python');
  const [ notice, contextHolder ] = message.useMessage();

  const code = useMemo(() => buildRegexCode(lang, { pattern, flags, text }), [ lang, pattern, flags, text ]);

  const needPattern = pattern.trim() === '';
  const truncated = text.replace(/\r\n/g, '\n').replace(/\n+$/, '').split('\n').length > MAX_TEXT_LINES;

  const copyCode = () => {
    copyTextToClipboard(code);
    notice.success(t('复制到粘贴板成功！！！'));
  };

  return (
    <div>
      {contextHolder}

      <Space wrap>
        <span>{t('语言')}</span>
        <Select
          value={ lang }
          style={ { minWidth: 200 } }
          showSearch
          optionFilterProp="label"
          options={ REGEX_CODE_LANGS.map((v) => ({ value: v, label: REGEX_CODE_LABELS[v] })) }
          onChange={ (v) => setLang(v as RegexCodeLang) }
        />
        <Button
          size="small"
          icon={ <CopyOutlined /> }
          disabled={ needPattern }
          onClick={ copyCode }
        >{t('复制代码')}</Button>
        <span style={ { color: token.colorTextTertiary, fontSize: 12 } }>
          { truncated
            ? tt('示例文本取自上方的输入内容, 最多前 {n} 行', { n: MAX_TEXT_LINES })
            : t('可选的示例文本取自上方的输入内容') }
        </span>
      </Space>

      { needPattern ? (
        <div style={ { marginTop: 12, color: token.colorTextTertiary } }>
          {t('请先在上方输入正则表达式, 这里会生成对应语言的调用代码')}
        </div>
      ) : (
        <pre
          style={ {
            margin: '10px 0 0',
            padding: '10px 12px',
            maxHeight: 460,
            overflow: 'auto',
            background: token.colorFillQuaternary,
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: 6,
            color: token.colorText,
            fontFamily: "Consolas, Monaco, 'Courier New', monospace",
            fontSize: 13,
            lineHeight: 1.6,
            whiteSpace: 'pre',
          } }
        >{ code }</pre>
      ) }
    </div>
  );
};

export default RegexCodeTab;
