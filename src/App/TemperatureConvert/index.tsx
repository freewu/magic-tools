import { Form, Input, Divider, message, Space, Radio, Button, Tag } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard, debounce } from "./../../lib";
import { pickTypeList, getTypePlaceholder, toCelsius, fromCelsius } from "./lib";
import { typeList, presetList } from "./data";
import type { RadioChangeEvent } from 'antd';
import { getDefaultType } from "./lib";
import { BigNumber, parseBN, formatBN } from "../../lib/bignumber";
import { InputStatus } from "antd/es/_util/statusUtils";
import { useLocale } from "../../hook/locale-context";
import { tr } from "../../i18n/lang";
import tempLang from "./lang";

// 常用预设的彩色标签底色 (与「Hash 值计算」一致, 4 色循环)
const TAG_COLORS = [ '#ff5500', '#2db7f5', '#87d068', '#108ee9' ];
const calcTagColor = (index :number) :string => TAG_COLORS[index % TAG_COLORS.length];

const TemperatureConvert = () => {
  const { locale } = useLocale();
  const t = (key: string, fallback: string) => tr(tempLang, locale, key, fallback);
  const dtype = getDefaultType();
  const getPlaceholder = (type :string) :string => t('ph_' + type, getTypePlaceholder(type) ?? '');

  const [ value, setValue ] = useState(''); // 输入数量
  const [ typeListState, setTypeList ] = useState(pickTypeList()); // 类型
  const [ status, setStatus ] = useState(''); // 输入是否合法
  const [ type, setType ] = useState(dtype); // 类型,
  const [ placeholder, setPlaceholder ] = useState(getPlaceholder(dtype)); // 数字类型的输入提示
  const [ celsius, setCelsius ] = useState<BigNumber>(new BigNumber(0)); // 转换的结果 统一转成 摄氏度 c
  const [ notice, contextHolder] = message.useMessage();

  // 窗体大小发生变化,改变窗口大小
  window.addEventListener('resize', debounce(() => { setTypeList(pickTypeList()) }, 100) );

  const inputStyle = { cursor: "pointer" };

  const convert = (value :string, type :string) => {
    const bn = parseBN(value);
    if (bn === null) {
      if (value === '') { setStatus(''); return; } // 没有内容直接返回不做下面的处理
      setCelsius(new BigNumber(0));
      setStatus('error');
      return;
    }
    setCelsius(toCelsius(bn, type));
    setStatus('');
  }

  // 切换类型
  const onTypeChange = ({ target: { value: v } }: RadioChangeEvent) => {
    setType(v);
    setPlaceholder(getPlaceholder(v));
    convert(value, v);
  };

  // 应用常用温度预设 (自动切到对应温标并填入数值)
  const applyPreset = (p :{ value :string; unit :string }) => {
    setType(p.unit);
    setPlaceholder(getPlaceholder(p.unit));
    setValue(p.value);
    convert(p.value, p.unit);
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

  // 统一由摄氏度换算成各温标显示
  const f = (unit :string) :string => {
    if(value === '' || status !== '') return '';
    return formatBN(fromCelsius(celsius, unit));
  }

  return (
    <div>
      {contextHolder}

      <Space size={[0, 8]} wrap style={ { marginBottom: 8 } }>
        <span style={{ lineHeight: '24px' }}>{ t('preset', '常用温度：') }</span>
        { presetList.map((p, index) => (
          <Tag
            key={ p.id }
            color={ calcTagColor(index) }
            style={ { cursor: 'pointer' } }
            onClick={ () => applyPreset(p) }
          >{ t('ps_' + p.id, p.label) }</Tag>
        )) }
      </Space>

      <Space>
        <Radio.Group
          optionType = "button" buttonStyle="solid"
          options = { typeListState.map((it) => ({ ...it, label: t('unit_' + it.value, it.label) })) } 
          onChange={ onTypeChange } 
          value={ type } 
        />
        <Button 
          onClick={ () => { setValue(''); setCelsius(new BigNumber(0)); setStatus(''); } }
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

      <Divider dashed />

      <Form name="basic1" labelCol={{ span: 5 }} autoComplete="off">
        { typeList.map((u) => (
          <Form.Item key={ u.value } label={ t('unit_' + u.value, u.label) }>
            <Input readOnly style={ inputStyle } onClick={ inputClick } value={ f(u.value) } />
          </Form.Item>
        )) }
      </Form>
    </div>
  );
}

export default TemperatureConvert;
