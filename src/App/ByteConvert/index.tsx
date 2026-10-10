import { Form, Input, Divider, message, Space, Radio, Button, Row, Col } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { typeList } from "./data"
import type { RadioChangeEvent } from 'antd';
import { toByte, fromByte, getDefaultType } from "./lib"
import { BigNumber, parseBN, formatBN } from "../../lib/bignumber";
import { InputStatus } from "antd/es/_util/statusUtils";
import { useLocale } from "../../hook/locale-context";
import { tr } from "../../i18n/lang";
import byteLang from "./lang";

// 结果区展示单位 (字节 / 位 两侧各一份)
const BYTE_ROWS = [
  { unit: '', label: 'B (Byte)' },
  { unit: 'KB', label: 'KB (Kilo Byte)' },
  { unit: 'MB', label: 'MB (Mega Byte)' },
  { unit: 'GB', label: 'GB (Giga Byte)' },
  { unit: 'TB', label: 'TB (Trillion Byte)' },
  { unit: 'PB', label: 'PB (Peta Byte)' },
  { unit: 'EB', label: 'EB (Exa Byte)' },
  { unit: 'ZB', label: 'ZB (Zetta Byte)' },
  { unit: 'YB', label: 'YB (Yotta Byte)' },
];

const BIT_ROWS = [
  { unit: '', label: 'b (bit)' },
  { unit: 'KB', label: 'Kb (Kilo bit)' },
  { unit: 'MB', label: 'Mb (Mega bit)' },
  { unit: 'GB', label: 'Gb (Giga bit)' },
  { unit: 'TB', label: 'Tb (Trillion bit)' },
  { unit: 'PB', label: 'Pb (Peta bit)' },
  { unit: 'EB', label: 'Eb (Exa bit)' },
  { unit: 'ZB', label: 'Zb (Zetta bit)' },
  { unit: 'YB', label: 'Yb (Yotta bit)' },
];

const ByteConvert = () => {
  const { locale } = useLocale();
  const t = (key: string, fallback: string) => tr(byteLang, locale, key, fallback);
  const dtype = getDefaultType();
  const getPlaceholder = (type :string) :string => {
    return t('ph_' + type, typeList.find(item => item.value === type)?.placeholder ?? '');
  }

  const [ value, setValue ] = useState(''); // 输入数量
  const [ status, setStatus ] = useState(''); // 输入是否合法
  const [ bytes, setBytes ] = useState<BigNumber>(new BigNumber(0)); // 统一换算成字节
  const [ type, setType ] = useState(dtype); // 类型,
  const [ placeholder, setPlaceholder ] = useState(getPlaceholder(dtype)); // 数字类型的输入提示
  const [ notice, contextHolder] = message.useMessage();

  const inputStyle = { cursor: "pointer" };

  const convert = (value :string, type :string) => {
    const bn = parseBN(value);
    if (bn === null) {
      if (value === '') { setStatus(''); return; } // 没有内容直接返回不做下面的处理
      setBytes(new BigNumber(0));
      setStatus('error');
      return;
    }
    if (bn.isNegative()) { // 字节数不允许为负
      setBytes(new BigNumber(0));
      setStatus('error');
      return;
    }
    setBytes(toByte(bn, type));
    setStatus('');
  }

  // 切换类型
  const onTypeChange = ({ target: { value : t } }: RadioChangeEvent) => {
    setType(t);
    setPlaceholder(getPlaceholder(t));
    convert(value, t);
  };

  // 点击结果框,把结果复制到粘贴板
  const inputClick = (e :React.MouseEvent<HTMLElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt != "") {
      copyTextToClipboard(txt);
      notice.success(t('copyOk', '复制到粘贴板成功！！！'));
    }
  };

  const textAreaChange = (e :React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.trim();
    setValue(value);
    convert(value, type);
  }

  const f = (v :BigNumber) :string => {
    if(value === '' || status !== '') return '';
    return formatBN(v);
  }

  return (
    <div>
      {contextHolder}

      <Space>
        <Radio.Group
          optionType = "button" buttonStyle="solid"
          options = { typeList } 
          onChange={ onTypeChange } 
          value={ type } 
        />
        <Button 
          onClick={ () => { setValue(''); setBytes(new BigNumber(0)); setStatus(''); } }
          style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
        >{ t('clear', '清除') }</Button>
      </Space>

      <TextArea
        status= { status as InputStatus }
        style={ { margin: "5px 0 5px 0" }}
        value= { value }
        onChange={ textAreaChange }
        placeholder={ placeholder }
        autoSize={{ minRows: 3, maxRows: 3 }}
      />

      <Row wrap>
        <Col span={12}>
          <Divider dashed plain>{ t('divByte', '字节 ( Byte )') }</Divider>
          <Form name="basic1" labelCol={{ span: 8 }} autoComplete="off">
            { BYTE_ROWS.map((row) => (
              <Form.Item key={ row.label } label={ row.label }>
                <Input readOnly style={ inputStyle } onClick={ inputClick } value={ f(fromByte(bytes, row.unit)) } />
              </Form.Item>
            )) }
          </Form>
        </Col>
        <Col span={12}>
          <Divider dashed plain>{ t('divBit', '位 ( bit )') }</Divider>
          <Form name="basic2" labelCol={{ span: 8 }} autoComplete="off">
            { BIT_ROWS.map((row) => (
              <Form.Item key={ row.label } label={ row.label }>
                <Input readOnly style={ inputStyle } onClick={ inputClick } value={ f(fromByte(bytes.times(8), row.unit)) } />
              </Form.Item>
            )) }
          </Form>
        </Col>
      </Row>
    </div>
  );
}

export default ByteConvert;
