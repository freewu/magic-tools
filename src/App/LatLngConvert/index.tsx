import { useState } from "react";
import { Input, Radio, Button, Space, Divider, message, Collapse, Tag } from "antd";
import { copyTextToClipboard } from "./../../lib";
import { formatList, orderList, sampleList, type FormatValue, type OrderValue } from "./data";
import {
  convertCoordinate,
  getDefaultFormat,
  getDefaultOrder,
  CoordError,
  type ConvertResult,
  type CoordRow,
} from "./lib";
import { useLocale } from "../../hook/locale-context";
import { tr, trTpl } from "../../i18n/lang";
import llLang from "./lang";

const { TextArea } = Input;

// 各输出格式的主题色
const ROW_COLORS: Record<string, string> = {
  DD: '#1890ff',
  DMS: '#13c2c2',
  DM: '#722ed1',
  NMEA: '#52c41a',
};

const REF_KEYS = ['ref_1', 'ref_2', 'ref_3', 'ref_4', 'ref_5', 'ref_6'];

// 示例标签配色 (与下方结果行的主题色一致)
const SAMPLE_COLORS: Record<string, string> = {
  dd: 'blue',
  dms: 'cyan',
  dm: 'purple',
  nmea: 'green',
  lnglat: 'gold',
  south: 'magenta',
};

// 空输入时结果行的灰色占位 (取首个示例的四种格式输出, 便于对照)
const HINT = convertCoordinate(sampleList[0].text, { format: 'AUTO', order: 'latlng' });
const hintOf = (key: string) => HINT.rows.find((r) => r.key === key);
// 空输入时仍展示的结果行 (值均空, 仅显示灰色占位)
const EMPTY_ROWS: CoordRow[] = ([ 'DD', 'DMS', 'DM', 'NMEA' ] as const).map((key) => ({ key, lat: '', lng: '', pair: '' }));

const LatLngConvert = () => {
  const { locale } = useLocale();
  const t = (key: string, fallback: string) => tr(llLang, locale, key, fallback);
  const tpl = (key: string, vars: Record<string, string | number>, fallback: string) => trTpl(llLang, locale, key, vars, fallback);

  const [ format, setFormat ] = useState<FormatValue>(getDefaultFormat());
  const [ order, setOrder ] = useState<OrderValue>(getDefaultOrder());
  const [ value, setValue ] = useState('');
  const [ result, setResult ] = useState<ConvertResult | null>(null);
  const [ error, setError ] = useState<CoordError | null>(null);
  const [ notice, contextHolder ] = message.useMessage();

  // 转换错误按当前语言渲染
  const errText = (err: CoordError): string => {
    switch (err.code) {
      case 'EMPTY': return t('e_EMPTY', '请输入经纬度');
      case 'PAIR': return t('e_PAIR', '请输入一对经纬度 (纬度, 经度)');
      case 'INVALID': return tpl('e_INVALID', { value: err.extra }, '无法识别坐标: ' + err.extra);
      case 'LAT_RANGE': return tpl('e_LAT_RANGE', { value: err.extra }, '纬度超出范围 (-90 ~ 90): ' + err.extra);
      case 'LNG_RANGE': return tpl('e_LNG_RANGE', { value: err.extra }, '经度超出范围 (-180 ~ 180): ' + err.extra);
      default: return t('e_UNKNOWN', '未知错误');
    }
  };

  const run = (text: string, fmt: FormatValue, ord: OrderValue) => {
    if (text.trim() === '') {
      setResult(null);
      setError(null);
      return;
    }
    try {
      setResult(convertCoordinate(text, { format: fmt, order: ord }));
      setError(null);
    } catch (e) {
      setResult(null);
      setError(e as CoordError);
    }
  };

  const onValueChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setValue(v);
    run(v, format, order);
  };

  const onFormatChange = (v: FormatValue) => {
    setFormat(v);
    run(value, v, order);
  };

  const onOrderChange = (v: OrderValue) => {
    setOrder(v);
    run(value, format, v);
  };

  const copy = async (text: string) => {
    const txt = text.trim();
    if (txt === '') return;
    await copyTextToClipboard(txt);
    notice.success(t('copyOk', '复制到粘贴板成功！！！'));
  };

  const inputStyle = { cursor: 'copy' } as const;
  // 结果行: 输入为空时也展示 (空值 + 灰色占位)
  const rows: CoordRow[] = result ? result.rows : EMPTY_ROWS;

  return (
    <div>
      {contextHolder}

      {/* 示例: 彩色标签置于最上方并单独占一行, 点击载入 */}
      <div style={{ marginBottom: 8 }}>
        <Space wrap size={[ 6, 8 ]}>
          { sampleList.map((s) => (
            <Tag
              key={ s.key }
              color={ SAMPLE_COLORS[s.key] }
              style={{ cursor: 'pointer', margin: 0 }}
              title={ s.text }
              onClick={ () => { setValue(s.text); run(s.text, format, order); } }
            >{ t('sample_' + s.key, s.key) }</Tag>
          )) }
        </Space>
      </div>

      <Space wrap style={{ marginBottom: 6 }}>
        <Radio.Group
          optionType="button" buttonStyle="solid"
          options={ formatList.map((i) => ({ value: i.value, label: t('fmt_' + i.value, i.label) })) }
          onChange={ (e) => onFormatChange(e.target.value as FormatValue) }
          value={ format }
        />
        <span style={{ color: '#888', marginLeft: 8 }}>{ t('labelOrder', '书写顺序') }</span>
        <Radio.Group
          optionType="button" buttonStyle="solid"
          options={ orderList.map((i) => ({ value: i.value, label: t('order_' + i.value, i.label) })) }
          onChange={ (e) => onOrderChange(e.target.value as OrderValue) }
          value={ order }
        />
        <Button
          onClick={ () => { setValue(''); setResult(null); setError(null); } }
          style={{ backgroundColor: '#dc3545', color: '#fff' }}
        >{ t('clear', '清除') }</Button>
      </Space>

      <TextArea
        style={{ margin: '2px 0 5px 0' }}
        value={ value }
        onChange={ onValueChange }
        placeholder={ t('ph_' + format, '') }
        autoSize={{ minRows: 3, maxRows: 5 }}
      />

      { error && <div style={{ color: '#ff4d4f', margin: '4px 0' }}>⚠ { errText(error) }</div> }

      <Divider dashed plain style={{ margin: '10px 0' }}>{ t('resultTitle', '转换结果') }</Divider>
      <div style={{ display: 'flex', gap: 10, margin: '0 0 6px 0', color: '#999', fontSize: 12 }}>
        <span style={{ width: 150, flex: 'none' }} />
        <span style={{ flex: 1 }}>{ t('latShort', '纬度') }</span>
        <span style={{ flex: 1 }}>{ t('lngShort', '经度') }</span>
      </div>
      <div>
        { rows.map((row) => (
          <div key={ row.key } style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0' }}>
            <span className="latlng-row-label" style={{ width: 150, flex: 'none', color: ROW_COLORS[row.key], fontWeight: 600, textAlign: 'right' }}>
              { t('fmt_' + row.key, row.key) }
            </span>
            <Input
              readOnly value={ row.lat } placeholder={ hintOf(row.key)?.lat } style={{ ...inputStyle, flex: 1, minWidth: 0 }}
              onFocus={ (e) => e.target.select() }
              onClick={ () => copy(row.lat) }
              title={ t('clickCopy', '点击复制到粘贴板') }
            />
            <Input
              readOnly value={ row.lng } placeholder={ hintOf(row.key)?.lng } style={{ ...inputStyle, flex: 1, minWidth: 0 }}
              onFocus={ (e) => e.target.select() }
              onClick={ () => copy(row.lng) }
              title={ t('clickCopy', '点击复制到粘贴板') }
            />
          </div>
        )) }
      </div>

      <Collapse
        ghost
        style={{ marginTop: 12 }}
        items={ [{
          key: 'ref',
          label: t('refTitle', '格式说明'),
          children: (
            <ul style={{ margin: 0, paddingLeft: 20, color: '#888', lineHeight: 1.9 }}>
              { REF_KEYS.map((k) => <li key={ k }>{ t(k, '') }</li>) }
            </ul>
          ),
        }] }
      />
    </div>
  );
};

export default LatLngConvert;
