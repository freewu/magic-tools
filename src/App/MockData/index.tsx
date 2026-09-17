import { Alert, Button, Checkbox, Divider, Input, InputNumber, Select, Space, Tag, Typography, message, theme } from 'antd';
import { useEffect, useState } from 'react';
import { CopyOutlined, DownloadOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from '../../lib';
import { saveTextFile } from '../../lib/tauri';
import { useLocale } from '../../hook/locale-context';
import { md, mdT } from './lang';
import { COUNT_MAX, COUNT_MIN, DEFAULT_COUNT, FORMAT_LIST, SAMPLE_TEMPLATE, type MockFormat } from './data';
import { generateOutput, getDefaultCount, getDefaultFormat, getDefaultTable } from './lib';
import MockDataIntro from './intro';

const { Text } = Typography;

/** 数据生成: Mock.js 语法模板 -> JSON / CSV / SQL */
const MockData = () => {
  const { locale } = useLocale();
  const t = (zh: string) => md(locale, zh);
  const tT = (zh: string, v: Record<string, string | number>) => mdT(locale, zh, v);
  const { token } = theme.useToken();

  const [ tpl, setTpl ] = useState(SAMPLE_TEMPLATE); // 模板
  const [ format, setFormat ] = useState<MockFormat>(() => getDefaultFormat()); // 输出格式
  const [ count, setCount ] = useState<number>(() => getDefaultCount()); // 生成数量
  const [ table, setTable ] = useState<string>(() => getDefaultTable()); // SQL 表名
  const [ createTable, setCreateTable ] = useState(true); // 生成建表语句
  const [ csvHeader, setCsvHeader ] = useState(true); // CSV 表头
  const [ out, setOut ] = useState(''); // 输出文本
  const [ rows, setRows ] = useState(0); // 记录条数
  const [ err, setErr ] = useState(''); // 错误提示

  const doGenerate = () => {
    const r = generateOutput(tpl, { format, count, tableName: table, createTable, csvHeader });
    if (!r.ok) {
      setErr(r.code === 'root'
        ? t('模板根节点需为对象 (表示一条记录); 兼容 Mock.js 的 list 写法: 单个带数量规则的数组字段会自动取其元素模板。')
        : tT('模板解析失败: {msg}', { msg: r.detail ?? '' }));
      setOut('');
      setRows(0);
      return;
    }
    setErr('');
    setOut(r.text);
    setRows(r.rows.length);
  };

  // 首次进入按当前设置生成一次
  useEffect(() => { doGenerate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onCopy = async () => {
    if (out === '') return;
    await copyTextToClipboard(out);
    message.success(t('已复制到剪贴板'));
  };

  // 下载扩展名 / 过滤名取自 FORMAT_LIST (新增格式只需改 data.ts)
  const fmt = FORMAT_LIST.find((f) => f.value === format) ?? FORMAT_LIST[0];
  const ext = fmt.ext;
  const fileName = `mock-data-${Date.now()}.${ext}`;
  const onDownload = async () => {
    if (out === '') return;
    const ok = await saveTextFile(fileName, out, tT('保存 {n}', { n: fileName }), { filterName: fmt.label, extensions: [ ext ] });
    if (ok) message.success(tT('已保存 {n}', { n: fileName }));
  };

  const rowStyle = { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const };

  return (
    <>
      <div style={ { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 } }>
        <Text strong style={ { fontSize: 16 } }>{ t('模板 (Mock.js 语法)') }</Text>
        <Space>
          <Button size="small" icon={ <ReloadOutlined /> } onClick={ () => setTpl(SAMPLE_TEMPLATE) }>{ t('填充示例') }</Button>
        </Space>
      </div>
      <Input.TextArea
        value={ tpl }
        onChange={ (e) => setTpl(e.target.value) }
        autoSize={ { minRows: 8, maxRows: 20 } }
        spellCheck={ false }
        style={ { fontFamily: 'Consolas, Monaco, "Courier New", monospace', fontSize: 13 } }
        placeholder={ SAMPLE_TEMPLATE }
      />

      <div style={ { ...rowStyle, marginTop: 12 } }>
        <Text>{ t('输出格式') }</Text>
        <Select
          value={ format }
          style={ { width: 140 } }
          onChange={ (value: MockFormat) => setFormat(value) }
          options={ FORMAT_LIST.map((v) => ({ value: v.value, label: v.label })) }
        />
        <Text>{ t('生成数量') }</Text>
        <InputNumber
          min={ COUNT_MIN }
          max={ COUNT_MAX }
          step={ 10 }
          value={ count }
          style={ { width: 130 } }
          onChange={ (value: number | null) => setCount(value === null ? DEFAULT_COUNT : value) }
        />
        { format === 'sql' && (
          <>
            <Text>{ t('SQL 表名') }</Text>
            <Input
              value={ table }
              style={ { width: 180 } }
              onChange={ (e) => setTable(e.target.value) }
              placeholder="mock_data"
            />
            <Checkbox checked={ createTable } onChange={ (e) => setCreateTable(e.target.checked) }>{ t('包含 CREATE TABLE 建表语句') }</Checkbox>
          </>
        ) }
        { format === 'csv' && (
          <Checkbox checked={ csvHeader } onChange={ (e) => setCsvHeader(e.target.checked) }>{ t('CSV 包含表头') }</Checkbox>
        ) }
        { format === 'jsonl' && (
          <Text type="secondary" style={ { fontSize: 12 } }>{ t('JSONL: 每行一条记录, 便于流式读取与导入大数据平台') }</Text>
        ) }
        <Button type="primary" icon={ <ThunderboltOutlined /> } onClick={ doGenerate }>{ t('生成数据') }</Button>
      </div>

      { err !== '' && <Alert style={ { marginTop: 12 } } type="error" showIcon message={ err } /> }

      <Divider orientation="left" plain style={ { marginTop: 16 } }>
        { t('输出结果') }
        { out !== '' && <Tag style={ { marginLeft: 8 } } color="blue">{ tT('共 {n} 条', { n: rows }) }</Tag> }
      </Divider>
      <Space style={ { marginBottom: 8 } }>
        <Button size="small" icon={ <CopyOutlined /> } disabled={ out === '' } onClick={ onCopy }>{ t('复制') }</Button>
        <Button size="small" icon={ <DownloadOutlined /> } disabled={ out === '' } onClick={ onDownload }>{ t('下载') }</Button>
        <Button size="small" danger type="text" disabled={ out === '' } onClick={ () => { setOut(''); setRows(0); setErr(''); } }>{ t('清空输出') }</Button>
      </Space>
      <Input.TextArea
        value={ out }
        readOnly
        autoSize={ { minRows: 10, maxRows: 24 } }
        spellCheck={ false }
        style={ { fontFamily: 'Consolas, Monaco, "Courier New", monospace', fontSize: 13, background: token.colorFillQuaternary } }
      />

      <Alert
        style={ { marginTop: 12 } }
        type="info"
        showIcon
        message={ t('模板语法: 字段名|规则 控制数量/范围/自增 (如 list|1-10, age|18-60, id|+1, score|60-100.1-2); 值里的 @占位符 生成随机数据 (如 @cname / @email / @integer(1,100) / @date("yyyy-MM-dd") / @pick([...])); 模板按 JSON5 解析, 支持单引号、注释与尾逗号, 不支持函数与正则。') }
        description={ t('生成数量与默认格式 / 默认表名可在「设置 → 生成器 → 数据生成」中调整; 数量上限 1000 条。') }
      />

      <Divider>{ t('数据生成说明') }</Divider>
      <MockDataIntro />
    </>
  );
};

export default MockData;
