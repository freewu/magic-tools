import { Radio, Divider, Button,Input, Space, message, Tabs } from "antd";
import { useRef, useState } from "react";
import type { RadioChangeEvent } from 'antd';
const { TextArea } = Input;
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from "../../lib"
import { typeList } from "./data";
import type { InputStatus } from "antd/es/_util/statusUtils";
import { getDefaultInputFormat, getDefaultOutputFormat, guessFormat } from "./lib";
import { saveTextFile } from "../../lib/tauri";
import { ConfigResult } from "./config-result"
import { json2ini, ini2json } from "./lib";
import { json2yaml, yaml2json } from "./lib";
import { json2toml, toml2json } from "./lib";
import { json2xml, xml2json } from "./lib";
import { json2properties, properties2json } from "./lib";
import { ConvertResult } from "./interface";
import { useLocale } from "../../hook/locale-context";
import { tr, trTpl } from "../../i18n/lang";
import cfgLang from "./lang";

const ConfigConvert = () => {

  const { locale } = useLocale();
  const t = (key: string, fallback: string) => tr(cfgLang, locale, key, fallback);
  const tpl = (key: string, vars: Record<string, string | number>, fallback: string) => trTpl(cfgLang, locale, key, vars, fallback);

  const [ outputFormat, setOutputFormat ] = useState(getDefaultOutputFormat());
  const [ type, setType ] = useState(getDefaultInputFormat());
  const [ value, setValue ] = useState('');
  const [ result, setResult ] = useState({});
  const [ notice, contextHolder ] = message.useMessage(); // 消息提醒
  const [ status, setStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 切换输入类型
  const onTypeChange = ({ target: { value } }: RadioChangeEvent) => {
    setType(value);
    setValue(''); // 需要把内容清空,类型变了输入的内容也没意义了
    setResult({});
  };

  const convert2object = (data :string, fmt? :string) => {
    setValue(data);
    if(data.trim() === '') return ; // 输入空没有进行下面的处理
    try {
      const json = convert2json(data, fmt ?? type);
      setStatus('');
      setResult(json);
    } catch (error) {
      notice.error(t('errParse', '解析输入内容出错'));
      setStatus('error');
      setResult({});
    }
  };

  // 读取文件并按扩展名自动识别输入格式 (xml/ini/json/yaml/toml/properties)
  const handleFileList = (files: FileList | null) => {
    const f = files?.[0];
    if(!f) return;
    const fmt = guessFormat(f.name);
    const reader = new FileReader();
    reader.onload = () => {
      const txt = String(reader.result ?? '');
      if(fmt && typeList.some((t) => t.value === fmt)) setType(fmt);
      setValue(txt);
      convert2object(txt, fmt ?? type);
      if(fmt) notice.success(tpl('parsedTpl', { fmt: fmt.toUpperCase(), name: f.name }, `已按 ${fmt.toUpperCase()} 解析 ${f.name}`));
      else notice.warning(t('extWarn', '未能识别文件扩展名, 按当前所选格式解析'));
    };
    reader.onerror = () => notice.error(t('readFail', '读取文件失败'));
    reader.readAsText(f);
  };

  const textareaDoubleClick = (e :React.MouseEvent<HTMLTextAreaElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt !== '') {
      copyTextToClipboard(txt);
      notice.success(t('copyOk', '复制到粘贴板成功！！！'));
    }
  };

  // 先统一转换成 json 再由 json 转换成不同格式
  const convert2json = (data: string ,type :string ) :Object => {
    switch(type) {
      case 'json': return JSON.parse(data);
      case 'ini': return ini2json(data);
      case 'xml': return xml2json(data);
      case 'yaml': return yaml2json(data);
      case 'toml': return toml2json(data);;
      case 'properties': return properties2json(data);
    }
    return '';
  }

  const convert = (t :string ) :ConvertResult => {
    const json = result;
    if(value.trim() === '') return { data: '', error: false }; // 输入为空直接返回
    if(JSON.stringify(json) === '{}' || JSON.stringify(json) === '""') return { data: '', error: false };

    // 有 json 转其它格式可能出问题错误,不影响全局
    try {
      switch(t) {
        case 'json': return { data: JSON.stringify(json,null,"\t"), error: false };
        case 'ini': return { data: json2ini(json), error: false };
        case 'xml': return { data: json2xml(json), error: false };
        case 'yaml': return { data: json2yaml(json), error: false };
        case 'toml': return { data: json2toml(json), error: false };
        case 'properties': return { data: json2properties(json), error: false };
      }
    } catch (error) {
      console.log(error);
      // 在 JS中，Error对象有两个默认的属性，分别是name和message
      // 输出错原因
      return { data: (error as Error).message, error: true };
    }
    return { data: 'no such type', error: true };
  }

  // 结果 tabs
  const items = typeList.map ((item) => {
    return {
      key : item.value,
      label : item.label,
      children: <ConfigResult 
                  type={ item.value } 
                  click={ textareaDoubleClick } 
                  data= { convert(item.value) } 
                />,
    }
  });

  // 当前输出 tab 的内容 (供保存按钮使用)
  const activeData = convert(outputFormat);
  const canSave = activeData.data.trim() !== '' && !activeData.error;

  // 把当前格式的转换结果保存为对应扩展名的文件 (桌面弹系统保存框 / 浏览器下载)
  const saveCurrent = async () => {
    const label = typeList.find((t) => t.value === outputFormat)?.label ?? outputFormat;
    const ok = await saveTextFile(`config.${outputFormat}`, activeData.data, t('saveDialog', '保存配置文件'), {
      filterName: tpl('filterTpl', { label }, `${label} 配置文件`),
      extensions: [outputFormat],
    });
    if (ok) notice.success(tpl('savedTpl', { ext: outputFormat }, `已保存 config.${outputFormat} 文件`));
  };

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
          icon={ <UploadOutlined /> }
          onClick={ () => fileInputRef.current?.click() }
        >{t('openBtn', '打开配置文件')}</Button>
        <input
          ref={ fileInputRef }
          type="file" style={ { display: 'none' } }
          accept=".ini,.conf,.cfg,.json,.json5,.xml,.yaml,.yml,.toml,.properties,.props"
          onChange={ (e) => { handleFileList(e.target.files); e.target.value = ''; } }
        />
        <Button 
          onClick={ () => { setValue(''); setResult(''); setStatus(''); } }
          style={ { backgroundColor : "#dc3545", color: "#fff" }} 
        >{t('clear', '清除')}</Button>
      </Space>

      <TextArea
        status= { status as InputStatus }
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        onChange={ (e) => { convert2object(e.target.value) } }
        title={t('tipDbl', '双击复制内容到粘贴板')}
        value= { value }
        placeholder={t('ph', '输入需要转换的配置内容 或 拖拽配置文件到框内打开 (自动识别 xml/ini/json/yaml/toml/properties)')}
        autoSize={{ minRows: 10, maxRows: 10 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); handleFileList(e.dataTransfer.files); } }
      />

      <Divider dashed plain>{t('divResult', ' 转换结果 ')}</Divider>

      {/* 保存按钮: 直接保存当前输出格式的结果 */}
      <div style={ { display: 'flex', justifyContent: 'flex-end', margin: '0 0 4px 0' } }>
        <Button
          icon={ <DownloadOutlined /> }
          disabled={ !canSave }
          onClick={ () => { void saveCurrent(); } }
          title={ canSave ? tpl('svTitleTpl', { ext: outputFormat }, `将当前结果保存为 config.${outputFormat}`) : t('svTitleDisabled', '先输入内容生成转换结果') }
        >{ tpl('saveBtnTpl', { ext: outputFormat }, `保存为 .${outputFormat} 文件`) }</Button>
      </div>

      <Tabs activeKey={ outputFormat } items={ items } onChange={ (key: string) => { setOutputFormat(key) } } />

    </div>
  );
}

export default ConfigConvert;