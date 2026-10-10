import { Select, Form, Input, Divider, message, Space, Radio, Button, Row, Col, Tag } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { unitTypeList, typeList, presetList } from "./data"
import type { RadioChangeEvent } from 'antd';
import { getDefaultUnitType, getTypeList, getDefaultType, getTypePlaceholder, toSquareMeter, fromSquareMeter } from "./lib"
import { BigNumber, parseBN, formatBN } from "../../lib/bignumber";
import { InputStatus } from "antd/es/_util/statusUtils";
import { useLocale } from "../../hook/locale-context";
import { tr } from "../../i18n/lang";
import arLang from "./lang";

// 常用预设的彩色标签底色 (与「Hash 值计算」一致, 4 色循环)
const TAG_COLORS = [ '#ff5500', '#2db7f5', '#87d068', '#108ee9' ];
const calcTagColor = (index :number) :string => TAG_COLORS[index % TAG_COLORS.length];

// 结果区各类制式的 label 宽度
const LABEL_SPAN :Record<string, number> = { ms: 8, iu: 10, cn: 8, jp: 8 };

const AreaConvert = () => {
  const { locale } = useLocale();
  const t = (key: string, fallback: string) => tr(arLang, locale, key, fallback);
  const getPlaceholder = (type :string) :string => {
    return t('p_' + type.replace(/-/g,'_'), getTypePlaceholder(type) ?? '');
  }

  const ut = getDefaultUnitType();
  const [ unitType, setUnitType ] = useState(ut); // 制式 
  const [ typeListState, setTypeList ] = useState(getTypeList(ut)); // 类型
  const [ value, setValue ] = useState(''); // 输入数量
  const [ status, setStatus ] = useState(''); // 输入是否合法

  const dt = getDefaultType(ut);
  const [ type, setType ] = useState(dt); // 转换类型
  const [ placeholder, setPlaceholder ] = useState(getPlaceholder(dt)); // 数字类型的输入提示
  const [ m2, setM2 ] = useState<BigNumber>(new BigNumber(0)); // 转换的结果 统一转换成 平方米 m²
  const [ notice, contextHolder ] = message.useMessage();

  const inputStyle = { cursor: "pointer" };

  const convert = (value :string, type :string) => {
    const bn = parseBN(value);
    if (bn === null) {
      if (value === '') { setStatus(''); return; } // 没有内容直接返回不做下面的处理
      setM2(new BigNumber(0));
      setStatus('error');
      return;
    }
    setM2(toSquareMeter(bn, type));
    setStatus('');
  }

  // 切换类型
  const onTypeChange = ({ target: { value : v } }: RadioChangeEvent) => {
    setType(v);
    setPlaceholder(getPlaceholder(v));
    convert(value,v);
  };

  // 应用常用面积预设 (自动切到对应制式与单位并填入数值)
  const applyPreset = (p :{ value :string; unit :string }) => {
    const targetUt = typeList.find((i) => i.value === p.unit)?.type ?? unitType;
    if (targetUt !== unitType) {
      setUnitType(targetUt);
      setTypeList(getTypeList(targetUt));
    }
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
    convert(value,type);
  }

  const f = (unit :string) :string => {
    if(value === '' || status !== '') return '';
    return formatBN(fromSquareMeter(m2, unit));
  }

  return (
    <div>
      {contextHolder}

      <Space size={[0, 8]} wrap style={ { display: 'flex', marginBottom: 8 } }>
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
          options = { typeListState.map(i => ({ ...i, label: t('u_' + i.value.replace(/-/g,'_'), i.label) })) } 
          onChange={ onTypeChange } 
          value={ type } 
        />
        <Button 
          onClick={ () => { setValue(''); setStatus(''); setM2(new BigNumber(0)); } }
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
          <Col span={ 6 } key={ g.value }>
            <Divider dashed plain>{t('ut_' + g.value, g.label)}</Divider>
            <Form labelCol={{ span: LABEL_SPAN[g.value] ?? 8 }} autoComplete="off">
              { getTypeList(g.value).map((u) => (
                <Form.Item key={ u.value } label={ t('u_' + u.value.replace(/-/g,'_'), u.label) }>
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

export default AreaConvert;
