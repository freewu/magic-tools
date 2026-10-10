import { Divider, Button,Input, message, Segmented, Tooltip } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { InputStatus } from "antd/es/_util/statusUtils";
import { useLocale } from "../../hook/locale-context";
import { tr } from "../../i18n/lang";
import pyLang from "./lang";
import { pinyin } from 'pinyin-pro';
import { toRubyItems, hasChinese } from "./lib";
import type { RubyItem } from "./lib";
import "./pinyin.css";

// 非汉字片段: 原样展示, 并保留原文里的换行
const PlainText = ({ text } :{ text: string }) => {
  return (
    <>
    {
      text.split("\n").flatMap((part,index) => {
        return (index === 0)? [part] : [<br key={ index } />, part];
      })
    }
    </>
  );
}

// 拼音注音排版: 汉字为基字, 拼音显示在汉字上方 (ruby), 其他字符原样展示
const RubyText = ({ items } :{ items :Array<RubyItem> }) => {
  return (
    <>
    {
      items.map((item,index) => {
        if(!item.isZh) return <span key={ index }><PlainText text={ item.text } /></span>;
        return <ruby key={ index }>{ item.text }<rt>{ item.pinyin }</rt></ruby>;
      })
    }
    </>
  );
}

const PinyinConvert = () => {
  const { locale } = useLocale();
  const t = (key: string, fallback: string) => tr(pyLang, locale, key, fallback);

  const [ status, setStatus ] = useState('');
  const [ value, setValue ] = useState('');
  const [ result, setResult ] = useState('');
  const [ items, setItems ] = useState(Array<RubyItem>); // 注音排版数据
  const [ mode, setMode ] = useState('ruby'); // 结果展示方式: ruby 注音排版 / text 拼音文本
  const [ notice, contextHolder ] = message.useMessage(); // 消息提醒

  const textareaDoubleClick = (e :React.MouseEvent<HTMLTextAreaElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt !== '') {
      copyTextToClipboard(txt);
      notice.success(t('copyOk', '复制到粘贴板成功！！！'));
    }
  };

  const encode = (value :string) => {
    setValue(value);
    if ( value.trim() != "") {
      setResult(pinyin(value));
      setItems(toRubyItems(value));
    } else {
      setResult('');
      setItems([]);
    }
  }

  // 点击注音排版区复制拼音文本
  const rubyBoxClick = () => {
    if(result.trim() === '') return;
    copyTextToClipboard(result);
    notice.success(t('copyOk', '复制到粘贴板成功！！！'));
  };

  return (
    <div>

      {contextHolder}

      <div className="pinyin-toolbar">
        <Button 
          onClick={ () => { setValue(''); setResult(''); setItems([]); setStatus(''); } }
          style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
        >{t('clear', '清除')}</Button>
        <Tooltip placement="top" title={ t('modeTip', '拼音注音: 拼音显示在汉字正上方') }>
          <Segmented
            value={ mode }
            onChange={ (v) => { setMode(v as string); } }
            options={ [
              { value: 'ruby', label: t('modeRuby', '拼音注音') },
              { value: 'text', label: t('modeText', '拼音文本') },
            ] }
          />
        </Tooltip>
      </div>

      <TextArea
        status= { status as InputStatus }
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { encode(e.target.value); } }
        title={t('tipDbl', '双击复制内容到粘贴板')}
        value= { value }
        placeholder={t('phInput', '请输入中文')}
        autoSize={{ minRows: 5, maxRows: 10 }}
      />

      <Divider dashed plain>{t('divider', '转换的结果')}</Divider>

      { (mode === 'ruby')? (
        <div
          className="pinyin-ruby-box"
          title={ t('tipClick', '点击复制内容到粘贴板') }
          onClick={ rubyBoxClick }
        >
          { hasChinese(items)
            ? <RubyText items={ items } />
            : <span className="pinyin-ruby-empty">{ t('phRuby', '输入中文后, 拼音会显示在汉字上方') }</span> }
        </div>
      ) : null }
      
      <TextArea
        style={ { margin: "5px 0 5px 0" }}
        title={t('tipClick', '点击复制内容到粘贴板')}
        onClick={ textareaDoubleClick }
        value={ result }
        onChange={ (e) => { setResult(e.target.value); } }
        placeholder={t('phResult', '点击复制内容到粘贴板')}
        autoSize={{ minRows: 10, maxRows: 10 }}
      />

    </div>
  );
}

export default PinyinConvert;
