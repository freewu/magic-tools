import { Button, Collapse, Descriptions, Divider, Input, Space, Tag, Typography, message, theme } from 'antd';
import { CopyOutlined, SearchOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { copyTextToClipboard } from '../../lib';
import { isTauri } from '../../lib/tauri';
import DesktopOnlyNotice from '../../lib/desktop';
import { useLocale } from '../../hook/locale-context';
import { wq, wqT } from './lang';
import WhoisQueryIntro from './intro';
import { allFields, kindText, normalizeQuery, summarizeWhois, summaryToText, validateQuery } from './lib';
import type { WhoisResult, WhoisSection } from './lib';
import { whoisQuery } from './net';

const { Text, Paragraph } = Typography;

const WhoisQuery = () => {
  const { locale } = useLocale();
  const t = (zh: string) => wq(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => wqT(locale, zh, v);
  const { token } = theme.useToken();

  const desktop = isTauri(); // 桌面版才能建立 TCP 43 连接
  const [ input, setInput ] = useState('');           // 查询对象 (域名 / IP)
  const [ loading, setLoading ] = useState(false);    // 查询中
  const [ result, setResult ] = useState<WhoisResult | null>(null);
  const [ messageApi, contextHolder ] = message.useMessage();

  // 汇总所有分段的字段, 再按关键字段表归纳
  const summary = useMemo(() => summarizeWhois(allFields(result?.sections ?? [])), [ result ]);
  const failed = useMemo(() => (result?.sections ?? []).some((s) => s.note !== null), [ result ]);

  const copy = (text: string) => {
    if (text === '') return;
    copyTextToClipboard(text);
    messageApi.success(t('复制到粘贴板成功!!!'));
  };

  // 查询
  const run = async () => {
    const invalid = validateQuery(input);
    if (invalid !== '') {
      messageApi.warning(t(invalid));
      return;
    }
    const query = normalizeQuery(input);
    setLoading(true);
    setResult(null);
    try {
      const res = await whoisQuery(query);
      setResult(res);
      messageApi.success(tt('查询完成: {query} ({kind})', { query: res.query, kind: t(kindText(res.kind)) }));
    } catch (err) {
      messageApi.error(tt('查询失败: {msg}', { msg: (err as Error).message }));
    } finally {
      setLoading(false);
    }
  };

  // 原始结果分段
  const collapseItems = (result?.sections ?? []).map((section: WhoisSection, i: number) => ({
    key: String(i),
    label: (
      <Space wrap size={ 8 }>
        <Text strong>{ `${i + 1}. ${section.server}` }</Text>
        { section.note ? <Tag color="warning">{ t('查询失败 (可查看其它跳结果)') }</Tag> : <Tag color="green">OK</Tag> }
        { section.note && <Text type="secondary" style={ { fontSize: 12 } }>{ section.note }</Text> }
      </Space>
    ),
    children: (
      <div>
        <Button
          size="small"
          icon={ <CopyOutlined /> }
          style={ { marginBottom: 8 } }
          onClick={ () => { copy(section.text); } }
        >{t('复制')}</Button>
        <Paragraph>
          <pre style={ {
            margin: 0, maxHeight: 420, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            fontSize: 12, lineHeight: 1.6, background: token.colorFillQuaternary, padding: 12, borderRadius: 4,
          } }>{ section.text }</pre>
        </Paragraph>
      </div>
    ),
  }));

  return (
    <div>
      { contextHolder }

      <Space wrap>
        <Input
          allowClear
          style={ { width: 320 } }
          prefix={ <SearchOutlined /> }
          value={ input }
          placeholder={ t('输入域名或 IP, 如 example.com 或 8.8.8.8') }
          onChange={ (e) => { setInput(e.target.value); } }
          onPressEnter={ () => { if (desktop) void run(); } }
        />
        <Button
          type="primary"
          loading={ loading }
          disabled={ !desktop }
          onClick={ () => { void run(); } }
        >{t('查询')}</Button>
        { summary.length > 0 && (
          <Button
            icon={ <CopyOutlined /> }
            onClick={ () => { copy(summaryToText(summary)); } }
          >{t('复制关键信息')}</Button>
        ) }
      </Space>

      {/* 浏览器演示版: 仅提示, 同时上方按钮已禁用 */}
      { !desktop && (
        <DesktopOnlyNotice
          text={ t('该功能仅在桌面应用中可用') }
          download={ t('下载桌面版') }
          hint={ t('浏览器版没有应用内 Whois 查询能力 (浏览器不允许直接建立 TCP 43 连接), 请下载桌面版后使用') }
        />
      ) }

      { result && (
        <div style={ { marginTop: 12, maxWidth: 1000 } }>
          <Space wrap size={ [ 8, 8 ] }>
            <Tag color="blue">{ result.query }</Tag>
            <Tag>{ t(kindText(result.kind)) }</Tag>
            <Tag>{ tt('共 {n} 跳', { n: result.sections.length }) }</Tag>
            { failed && <Tag color="warning">{ t('查询失败 (可查看其它跳结果)') }</Tag> }
          </Space>

          <Divider orientation="left" plain>{t('关键信息')}</Divider>
          { summary.length === 0
            ? <Text type="secondary">{t('未解析出关键信息, 请查看下方原始结果')}</Text>
            : (
              <Descriptions
                size="small"
                bordered
                column={ 1 }
                style={ { marginTop: 4 } }
                items={ summary.map((item) => ({
                  key: item.label,
                  label: t(item.label),
                  children: item.kind === 'tags'
                    ? item.values.map((v) => <Tag key={ v } style={ { marginBottom: 4 } }>{ v }</Tag>)
                    : <Text style={ { wordBreak: 'break-all' } }>{ item.values.join(' / ') }</Text>,
                })) }
              />
            ) }

          <Divider orientation="left" plain>{t('原始结果')}</Divider>
          <Collapse key={ result.query } defaultActiveKey={ collapseItems.map((c) => c.key) } items={ collapseItems } />
        </div>
      ) }

      { !result && !loading && (
        <div style={ { marginTop: 16, color: token.colorTextTertiary } }>
          {t('输入域名或 IP 后点击「查询」, 将依次查询 IANA / 注册局 / 注册商的 Whois 服务器并汇总关键信息')}
        </div>
      ) }

      <Divider>{t('Whois 查询说明')}</Divider>

      <WhoisQueryIntro />
    </div>
  );
}

export default WhoisQuery;
