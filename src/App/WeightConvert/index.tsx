import { Select, Form, Input, Divider, message, Space, Radio, Button, Row, Col } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { unitTypeList, typeList } from "./data"
import type { RadioChangeEvent } from 'antd';
import { getDefaultUnitType, getTypeList, getDefaultType, getTypePlaceholder, toGram, fromGram } from "./lib"
import { BigNumber, parseBN, formatBN } from "../../lib/bignumber";
import { InputStatus } from "antd/es/_util/statusUtils";
import { useLocale } from "../../hook/locale-context";
import { tr } from "../../i18n/lang";
import wLang from "./lang";

// 结果区文案 key 与单位值不一致的单位 (沿用历史命名, 避免改动已有语言包)
const RESULT_KEY_ALIAS :Record<string, string> = { mcg: 'ug', longton: 'lt', shortton: 'stn' };
const resultKey = (value :string) :string => 'r_' + (RESULT_KEY_ALIAS[value] ?? value);

const LABEL_SPAN :Record<string, number> = { ms: 8, iu: 10, cn: 8 };

const WeightConvert = () => {
  const { locale } = useLocale();
  const t = (key: string, fallback: string) => tr(wLang, locale, key, fallback);
  const getPlaceholder = (type :string) :string => {
    return t('p_' + type, getTypePlaceholder(type) ?? '');
  }

  const ut = getDefaultUnitType();
  const [ unitType, setUnitType ] = useState(ut); // 制式 
  const [ typeListState, setTypeList ] = useState(getTypeList(ut)); // 类型
  const [ value, setValue ] = useState(''); // 输入数量
  const [ status, setStatus ] = useState(''); // 输入是否合法

  const dt = getDefaultType(ut);
  const [ type, setType ] = useState(dt); // 转换类型
  const [ placeholder, setPlaceholder ] = useState(getPlaceholder(dt)); // 数字类型的输入提示
  const [ gram, setGram ] = useState<BigNumber>(new BigNumber(0)); // 转换的结果 统一转换成 克 g
  const [ notice, contextHolder ] = message.useMessage();

  const inputStyle = { cursor: "pointer" };

  const convert = (value :string, type :string) => {
    const bn = parseBN(value);
    if (bn === null) {
      if (value === '') { setStatus(''); return; } // 没有内容直接返回不做下面的处理
      setGram(new BigNumber(0));
      setStatus('error');
      return;
    }
    setGram(toGram(bn, type));
    setStatus('');
  }

  // 切换类型
  const onTypeChange = ({ target: { value : v } }: RadioChangeEvent) => {
    setType(v);
    setPlaceholder(getPlaceholder(v));
    convert(value,v);
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
    convert(value,type);
  }

  const f = (unit :string) :string => {
    if(value === '' || status !== '') return '';
    return formatBN(fromGram(gram, unit));
  }

  return (
    <div>
      {contextHolder}

      <Space>
        <Select
          value={ unitType }
          style={{ width: 80 }}
          onChange={ (v :string) => { 
            setUnitType(v);
            setTypeList(getTypeList(v));
            const dt = getDefaultType(v);
            setType(dt);
            setPlaceholder(getPlaceholder(dt));
            convert(value,dt);
          } }
          options={ unitTypeList.map(i => ({ ...i, label: t('ut_' + i.value, i.label) })) }
        />
        <Radio.Group
          optionType = "button" buttonStyle="solid"
          options = { typeListState.map(i => ({ ...i, label: t('u_' + i.value, i.label) })) } 
          onChange={ onTypeChange } 
          value={ type } 
        />
        <Button 
          onClick={ () => { setValue(''); setStatus(''); setGram(new BigNumber(0)); } }
          style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
        >{t('clear', '清除')}</Button>
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
        { unitTypeList.map((g) => (
          <Col span={ 8 } key={ g.value }>
            <Divider dashed plain>{t('ut_' + g.value, g.label)}</Divider>
            <Form labelCol={{ span: LABEL_SPAN[g.value] ?? 8 }} autoComplete="off">
              { getTypeList(g.value).map((u) => (
                <Form.Item key={ u.value } label={ t(resultKey(u.value), u.label) }>
                  <Input readOnly style={ inputStyle } onClick={ inputClick } value={ f(u.value) } />
                </Form.Item>
              )) }
            </Form>
          </Col>
        )) }
      </Row>
    </div>
  );
}

export default WeightConvert;
