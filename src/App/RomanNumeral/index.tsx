// 罗马数字: 罗马数字 ↔ 阿拉伯数字 (1 - 3999) 双向转换, 布局参考 Base64 编解码
import { Button, Divider, Input, Space, Tooltip, message } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { useLocale } from "../../hook/locale-context";
import { rn } from "./lang";
import { arabicToRoman, romanToArabic, ROMAN_MAX, ROMAN_MIN, type ConvertError } from "./lib";
import RomanNumeralIntro from "./intro";

const RomanNumeral = () => {

  const { locale } = useLocale();
  const t = (zh: string) => rn(locale, zh);

  const [ arabic, setArabic ] = useState(''); // 上方输入框: 阿拉伯数字
  const [ roman, setRoman ] = useState(''); // 下方输入框: 罗马数字
  const [ notice, contextHolder ] = message.useMessage(); // 消息提醒

  // 失败原因 → 提示文案
  const errorTips: Record<ConvertError, string> = {
    empty: '',
    notInteger: '请输入整数 (阿拉伯数字)',
    outOfRange: '阿拉伯数字超出范围, 仅支持 1 - 3999',
    invalidRoman: '不是标准的罗马数字写法 (支持 I ~ MMMCMXCIX, 即 1 - 3999)',
  };

  const textareaDoubleClick = (e :React.MouseEvent<HTMLTextAreaElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt !== '') {
      copyTextToClipboard(txt);
      notice.success(t('复制到粘贴板成功！！！'));
    }
  };

  // 阿拉伯数字 → 罗马数字 (处理上方输入框的内容)
  const toRoman = () => {
    if (arabic.trim() === '') return; // 空输入不提示, 与 Base64 保持一致
    const r = arabicToRoman(arabic);
    if (!r.ok) {
      notice.error(t(errorTips[r.error]));
      return;
    }
    setRoman(r.value);
  };

  // 罗马数字 → 阿拉伯数字 (处理下方输入框的内容)
  const toArabic = () => {
    if (roman.trim() === '') return;
    const r = romanToArabic(roman);
    if (!r.ok) {
      notice.error(t(errorTips[r.error]));
      return;
    }
    setArabic(String(r.value));
  };

  return (
    <div>
      {contextHolder}

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setArabic(e.target.value); } }
        title={ t('双击复制内容到粘贴板') }
        value={ arabic }
        placeholder={ t('输入阿拉伯数字 (1 - 3999)') }
        autoSize={{ minRows: 5, maxRows: 5 }}
      />

      <Space wrap>
        <Button
          onClick={ toRoman }
          style={ {"backgroundColor" : "#007bff","color": "#fff" }}
          icon={<ArrowDownOutlined />}
        >{ t('转为罗马数字') }</Button>
        <Button
          onClick={ toArabic }
          style={ {"backgroundColor" : "#28a745","color": "#fff" }}
          icon={<ArrowUpOutlined />}
        >{ t('转为阿拉伯数字') }</Button>
        <Button
          onClick={ () => { setArabic(''); setRoman(''); } }
          style={ {"backgroundColor" : "#dc3545","color": "#fff" }}
        >{ t('清除') }</Button>
        <Tooltip placement="bottomLeft" title={ t('支持范围 1 - 3999 (I - MMMCMXCIX); 罗马数字大小写均可, 需为标准写法') }>
          <span style={ { color: "#888" } }>{ ROMAN_MIN } - { ROMAN_MAX }</span>
        </Tooltip>
      </Space>

      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { setRoman(e.target.value); } }
        title={ t('双击复制内容到粘贴板') }
        value={ roman }
        placeholder={ t('输入罗马数字 (I - MMMCMXCIX)') }
        autoSize={{ minRows: 5, maxRows: 5 }}
      />

      <Divider>{ t('罗马数字说明') }</Divider>

      <RomanNumeralIntro />
    </div>
  );
}

export default RomanNumeral;
