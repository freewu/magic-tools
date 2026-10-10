import { Select, Form, Input, Divider, message, Space, Radio, Button, Row, Col } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { unitTypeList, typeList, presetList } from "./data"
import type { RadioChangeEvent } from 'antd';
import { getDefaultUnitType, getTypeList, getDefaultType, getTypePlaceholder, toMl, fromMl } from "./lib"
import { BigNumber, parseBN, formatBN } from "../../lib/bignumber";
import { InputStatus } from "antd/es/_util/statusUtils";
import { useLocale } from "../../hook/locale-context";
import { tr } from "../../i18n/lang";
import volLang from "./lang";

// 结果区各类制式的 label 宽度 (4 列布局下标签长度差异较大)
const LABEL_SPAN :Record<string, number> = { ms: 12, iu: 10, us: 10, cn: 8 };

export const VolumeConvert = () => {
  const { locale } = useLocale();
  const t = (key: string, fallback: string) => tr(volLang, locale, key, fallback);
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
  const [ ml, setMl ] = useState<BigNumber>(new BigNumber(0)); // 转换的结果 统一转换成 毫升 ml
  const [ notice, contextHolder ] = message.useMessage();

  const inputStyle = { cursor: "pointer" };

  const convert = (value :string, type :string) => {
    const bn = parseBN(value);
    if (bn === null) {
      if (value === '') { setStatus(''); return; } // 没有内容直接返回不做下面的处理
      setMl(new BigNumber(0));
      setStatus('error');
      return;
    }
    setMl(toMl(bn, type));
    setStatus('');
  }

  // 切换类型
  const onTypeChange = ({ target: { value : v } }: RadioChangeEvent) => {
    setType(v);
    setPlaceholder(getPlaceholder(v));
    convert(value,v);
  };

  // 应用常用容量预设 (自动切到对应制式/单位并填入数值)
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
    return formatBN(fromMl(ml, unit));
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
          options = { typeListState.map(i => ({ ...i, label: t('u_' + i.value.replace(/-/g,'_'), i.label) })) } 
          onChange={ onTypeChange } 
          value={ type } 
        />
        <Button 
          onClick={ () => { setValue(''); setStatus(''); setMl(new BigNumber(0)); } }
          style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
        >{t('clear', '清除')}</Button>
      </Space>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        <span style={{ lineHeight: '24px' }}>{t('preset', '常用容量：')}</span>
        { presetList.map((p) => (
          <Button key={ p.id } size="small" onClick={ () => applyPreset(p) }>{ t('ps_' + p.id, p.label) }</Button>
        )) }
      </div>

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
            <Form labelCol={{ span: LABEL_SPAN[g.value] ?? 10 }} autoComplete="off">
              { getTypeList(g.value).map((u) => (
                <Form.Item key={ u.value } label={ t('r_' + u.value.replace(/-/g,'_'), u.label) }>
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

export default VolumeConvert;
