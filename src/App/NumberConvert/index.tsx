import { Checkbox, Form, Input, Divider, message, Space, Radio, Button, ColorPicker } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { } from "./lib"
import { numberTypeList, emptyResult, NumberConvertResult } from "./data"
import type { RadioChangeEvent } from 'antd';
import { translateDecimal } from "./lib"
import { insertIntervalString } from "./../../lib"
import { reverseString } from "./../../lib/string"
import { useLocale } from "../../hook/locale-context";
import { tr } from "../../i18n/lang";
import numLang from "./lang";


const NumberConvert = () => {

  const { locale } = useLocale();
  const t = (key: string, fallback: string) => tr(numLang, locale, key, fallback);
  // 单选项/占位文案按当前语言取词 (data.ts 保留 zh-CN 为默认回退)
  const numberTypeOpts = numberTypeList.map((it) => ({
    ...it,
    label: t('unit_' + it.value, it.label),
    placeholder: t('ph_' + it.value, it.placeholder),
  }));

  const [ value, setValue ] = useState(''); // 需要转换的颜色值 
  const [ numberType, setNumberType ] = useState('DEC'); // 输入内容的数字类型,
  const [ placeholder, setPlaceholder ] = useState(t('ph_DEC', numberTypeList[2]["placeholder"])); // 数字类型的输入提示
  const [ checked, setChecked ] = useState(false); // 输出大小写
  const [ numberData, setNumberData ] = useState(emptyResult); // 转换的结果
  const [ notice, contextHolder] = message.useMessage();
  const [ humanRead, setHumanRead ] = useState(false); // 显示是否加入空格

  const inputStyle = { cursor: "pointer" };

  // 切换输入数据进制类型
  const onNumberTypeChange = ({ target: { value } }: RadioChangeEvent) => {
    setNumberType(value);
    setValue(''); // 需要把内容清空,类型变了输入的内容也没意义了
    setNumberData(emptyResult);
    // 更新输入提示信息
    const tips = numberTypeList.find(item => item.value === value)?.placeholder;
    setPlaceholder(t('ph_' + value, tips ?? ''));
  };

  // 点击结果框,把结果复制到粘贴板
  const inputClick = (e :React.MouseEvent<HTMLElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt != "") {
      copyTextToClipboard(txt);
      notice.success(t('copyOk', '复制到粘贴板成功！！！'));
    }
  };

  const handleCheckboxChange = () => {
    setChecked(!checked);
    // 如果要专内容不为空，处理 显示字母的大小问题
    if ( value.trim() != "") {
      const result = {
        "hex": (checked)? numberData.hex.toLowerCase() : numberData.hex.toUpperCase(),
        "bin": numberData.bin,
        "oct": numberData.oct,
        "dec": numberData.dec,
      };
      setNumberData(result);
    }
  };

  const handleHumanReadChange = () => {
    setHumanRead(!humanRead);
    if ( value.trim() != "") {
      setNumberData(convertHumanRead(!humanRead, numberData));
    }
  }

  const convertHumanRead = (flag :boolean, data :NumberConvertResult) => {
    const result = {
      "hex": (flag)? reverseString(insertIntervalString(reverseString(data.hex),2)).trim() : data.hex.replaceAll(" ",""),
      "bin": (flag)? reverseString(insertIntervalString(reverseString(data.bin),4)).trim() : data.bin.replaceAll(" ",""),
      "oct": (flag)? reverseString(insertIntervalString(reverseString(data.oct),4)).trim() : data.oct.replaceAll(" ",""),
      "dec": (flag)? reverseString(insertIntervalString(reverseString(data.dec),4)).trim() : data.dec.replaceAll(" ",""),
    };
    return result
  }

  const textAreaChange = (e :React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.trim();
    setValue(value);
    // 输入4个符以上才处理
    if (value != "") {
      covertNumber(value);
    } else {
      setNumberData(emptyResult);
    }
  }

  const upperLowerTranslate = (str :string) :string => {
    return checked? str.toUpperCase() : str.toLowerCase()
  }

  const covertNumber = (value :string) => {
    setValue(value);
    const n = translateDecimal(value.replaceAll(" ",""),numberType);
    if(n.toString() !== "NaN") {
      const result = {
        "dec": n.toString(),
        "bin": n.toString(2),
        "oct": n.toString(8),
        "hex": upperLowerTranslate(n.toString(16)),
      };
      // 开启人类可读
      if(humanRead) {
        setNumberData(convertHumanRead(humanRead,result));
      } else {
        setNumberData(result);
      }
    } else {
      notice.error(t('formatErr', '输入的数据格式错误!!!'));
      setNumberData(emptyResult);
    }
  }

  return (
    <div>
      {contextHolder}

      <Space>
        <Radio.Group
          optionType = "button" buttonStyle="solid"
          options = { numberTypeOpts } 
          onChange={ onNumberTypeChange } 
          value={ numberType } 
        />
        <Checkbox onChange={ handleCheckboxChange } checked={ checked }>{ t('upperLabel', '大写字符显示') }</Checkbox>
        <Checkbox onChange={ handleHumanReadChange } checked={ humanRead }>{ t('groupedLabel', '结果插入空格') }</Checkbox>
        <Button 
          onClick={ () => { setValue(''); setNumberData(emptyResult); } }
          style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
        >{ t('clear', '清除') }</Button>
      </Space>

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        value= { value }
        onChange={ textAreaChange }
        placeholder={ placeholder }
        autoSize={{ minRows: 3, maxRows: 5 }}
      />
      <Divider dashed />
      <Form name="basic"labelCol={{ span: 2 }} autoComplete="off">
        <Form.Item label={ t('unit_BIN', '二进制') }>
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { numberData.bin } />
        </Form.Item>
        <Form.Item label={ t('unit_OCT', '八进制') }>
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { numberData.oct } />
        </Form.Item>
        <Form.Item label={ t('unit_DEC', '十进制') }>
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { numberData.dec } />
        </Form.Item>
        <Form.Item label={ t('unit_HEX', '十六进制') }>
          <Input readOnly style={ inputStyle } onClick={ inputClick } value= { numberData.hex } />
        </Form.Item>
      </Form>
    </div>
  );
}

export default NumberConvert;