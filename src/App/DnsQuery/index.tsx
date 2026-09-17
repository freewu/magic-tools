import { Button, Divider, Input, Segmented, Select, Space, Table, Tag, message, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CopyOutlined, SearchOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { copyTextToClipboard } from '../../lib';
import { isTauri } from '../../lib/tauri';
import DesktopOnlyNotice from '../../lib/desktop';
import { useLocale } from '../../hook/locale-context';
import { dq, dqT } from './lang';
import DnsQueryIntro from './intro';
import {
  ALL_RECORD_TYPES, DNS_SERVERS, RECORD_TYPES, formatTtl, normalizeName, recordsToText,
  sortRecords, statusColor, statusText, summarizeResults, validateName,
} from './lib';
import type { DnsQueryResult, DnsRecord, DnsTypeResult } from './lib';
import { isAllTypes, queryAllDns, queryDns } from './net';
const DnsQuery = () => {
  const { locale } = useLocale();
  const t = (zh: string) => dq(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => dqT(locale, zh, v);
  const { token } = theme.useToken();

  const desktop = isTauri(); // 桌面版才能发起 DNS 查询
  const [ name, setName ] = useState('');                 // 域名
  const [ type, setType ] = useState<string>('A');        // 记录类型
  const [ server, setServer ] = useState('system');       // DNS 服务器
  const [ loading, setLoading ] = useState(false);        // 查询中
  const [ results, setResults ] = useState<DnsTypeResult[]>([]); // 查询结果 (全部类型时为多条)
  const [ messageApi, contextHolder ] = message.useMessage();

  // 记录列表 (类型 / 值排序, 去重)
  const records: DnsRecord[] = useMemo(
    () => sortRecords(results.flatMap((item) => item.result.records)),
    [ results ],
  );
  const summary = useMemo(() => summarizeResults(results), [ results ]);

  const copy = (text: string) => {
    if (text === '') return;
    copyTextToClipboard(text);
    messageApi.success(t('复制到粘贴板成功!!!'));
  };

  // 查询
  const run = async () => {
    const cleaned = normalizeName(name);
    const invalid = validateName(cleaned);
    if (invalid !== '') {
      messageApi.warning(t(invalid));
      return;
    }
    setLoading(true);
    setResults([]);
    try {
      if (isAllTypes(type)) {
        setResults(await queryAllDns(cleaned, server));
      } else {
        setResults([ { recordType: type, result: await queryDns(cleaned, type, server) } ]);
      }
    } catch (err) {
      messageApi.error(tt('查询失败: {msg}', { msg: (err as Error).message }));
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<DnsRecord> = [
    {
      title: t('类型'), dataIndex: 'recordType', key: 'recordType', width: 90,
      render: (v: string) => <Tag>{ v }</Tag>,
    },
    {
      title: t('名称'), dataIndex: 'name', key: 'name',
      render: (v: string) => <span style={ { wordBreak: 'break-all' } }>{ v }</span>,
    },
    {
      title: t('值'), dataIndex: 'value', key: 'value',
      render: (v: string) => (
        <span
          title={ t('双击复制内容') }
          onDoubleClick={ () => { copy(v); } }
          style={ { wordBreak: 'break-all', cursor: 'text', color: token.colorText } }
        >{ v }</span>
      ),
    },
    {
      title: t('TTL'), dataIndex: 'ttl', key: 'ttl', width: 110,
      render: (v: number) => <span title={ formatTtl(v) }>{ v }</span>,
    },
    {
      title: '', key: 'action', width: 44,
      render: (_: unknown, row: DnsRecord) => (
        <Button
          size="small"
          type="text"
          icon={ <CopyOutlined /> }
          onClick={ () => { copy(recordsToText([ row ])); } }
        />
      ),
    },
  ];

  return (
    <div>
      { contextHolder }

      <Space wrap>
        <Input
          allowClear
          style={ { width: 260 } }
          prefix={ <SearchOutlined /> }
          value={ name }
          placeholder={ t('输入域名, 如 example.com') }
          onChange={ (e) => { setName(e.target.value); } }
          onPressEnter={ () => { if (desktop) void run(); } }
        />
        <Segmented
          value={ type }
          onChange={ (v) => { setType(String(v)); } }
          options={ [
            ...RECORD_TYPES.map((rt) => ({ value: rt as string, label: rt as string })),
            { value: ALL_RECORD_TYPES, label: t('全部') },
          ] }
        />
        <Select
          style={ { width: 210 } }
          value={ server }
          onChange={ (v: string) => { setServer(v); } }
          options={ DNS_SERVERS.map((s) => ({ value: s.value, label: t(s.label) })) }
        />
        <Button
          type="primary"
          loading={ loading }
          disabled={ !desktop }
          onClick={ () => { void run(); } }
        >{t('查询')}</Button>
      </Space>

      {/* 浏览器演示版: 仅提示, 同时上方按钮已禁用 */}
      { !desktop && (
        <DesktopOnlyNotice
          text={ t('该功能仅在桌面应用中可用') }
          download={ t('下载桌面版') }
          hint={ t('浏览器版没有应用内 DNS 解析能力 (且受同源策略限制), 请下载桌面版后使用') }
        />
      ) }

      {/* 结果汇总 */}
      { results.length > 0 && (
        <div style={ { marginTop: 12, maxWidth: 900 } }>
          <Space wrap size={ [ 8, 8 ] }>
            { results.map((item) => (
              <Tag
                key={ item.recordType + item.result.status }
                color={ statusColor(item.result.status) }
                title={ item.result.message ?? statusText(item.result.status) }
              >{ `${item.recordType} · ${item.result.records.length}` }</Tag>
            )) }
          </Space>
          <div style={ { marginTop: 6, fontSize: 12, color: token.colorTextSecondary } }>
            { tt('服务器: {server}', { server: summary.servers.join(', ') }) }
            { ' · ' }
            { tt('耗时: {ms} ms', { ms: summary.elapsedMs }) }
            { ' · ' }
            { tt('共 {n} 条记录', { n: records.length }) }
          </div>
          { records.length > 0 && (
            <Button
              size="small"
              style={ { marginTop: 8 } }
              icon={ <CopyOutlined /> }
              onClick={ () => { copy(recordsToText(records)); } }
            >{t('复制结果')}</Button>
          ) }
          <Table<DnsRecord>
            rowKey={ (r) => `${r.recordType}|${r.name}|${r.value}|${r.ttl}` }
            columns={ columns }
            dataSource={ records }
            size="small"
            pagination={ false }
            style={ { marginTop: 8 } }
          />
        </div>
      ) }

      {/* 未查询时的占位提示 */}
      { results.length === 0 && !loading && (
        <div style={ { marginTop: 16, color: token.colorTextTertiary } }>
          {t('输入域名后点击「查询」, 将向指定 DNS 服务器查询 A / AAAA / CNAME / MX / TXT / SRV / NS 记录')}
        </div>
      ) }

      <Divider>{t('DNS 查询说明')}</Divider>

      <DnsQueryIntro />
    </div>
  );
}

export default DnsQuery;
