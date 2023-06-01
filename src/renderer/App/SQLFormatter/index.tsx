import { Checkbox, Divider, Button,Input, Space, message, Select } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard, debounce } from "./../../lib";
import { arrayToOptions } from "./../../lib/array";
import { format } from 'sql-formatter';
import type { FormatOptionsWithLanguage,IndentStyle, KeywordCase, CommaPosition, LogicalOperatorNewline } from 'sql-formatter';
import { languageList, keywordCaseList,indentStyleList,commaPositionList,logicalOperatorNewlineList } from "./data";

// 代码高亮
import 'highlight.js/styles/monokai-sublime.css';
import highlight from 'highlight.js';
import './sql-formatter.css';

const URL = () => {
  // highlight配置
  //highlight.configure({ useBR: true});

  // 输出结果框高度,窗口调整,颜色板高度也需要调整
  const genResultHeight = () => {
    return (window.innerHeight - 380) + "px";
  };

  const [ value, setValue ] = useState(''); // 输入的 SQl 语言
  const [ highLightResult, setHighLightResult ] = useState(''); // 语法高亮后的结果
  const [ result, setResult ] = useState(''); // 格式化后的结果
  const [ notice, contextHolder ] = message.useMessage();
  const [ language, setLanguage ] = useState('mysql'); // 语言类型
  const [ keywordCase, setKeywordCase ] = useState('upper'); // 关键词大小写类型
  const [ indentStyle, setIndentStyle ] = useState('standard'); // 缩进类型
  // const [ useTab, setUseTab ] = useState(false); // 使用 tab
  // const [ tabWidth, setTabWidth ] = useState(4); // tab 宽度  (等于多个空格)
  const [ resultHight, setResultHight ] = useState(genResultHeight()); // 结果框高度

  // 窗体大小发生变化,改变窗口大小
  window.addEventListener('resize',
    debounce(() => { setResultHight(genResultHeight()) }, 100)
  );

  const textareaDoubleClick = (e :React.MouseEvent<HTMLElement>) => {
    if(result.trim() === "") return ;
    copyTextToClipboard(result);
    notice.success( "复制到粘贴板成功！！！");
  };

  const onTextAreaChange = (e :React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    doFormatter(e.target.value,genConfig());
  }

  const doFormatter = (value:string,config :FormatOptionsWithLanguage) => {
    value = value.trim();
    if ('' === value) {
      setResult('');
      setHighLightResult('');
      return;
    }
    try {
      const r = format(value, config);
      setResult( r );
      setHighLightResult( highlight.highlight(r,{language: 'sql'}).value );
    } catch (e) {
      console.log(e);
    }
  }


  // 生成 format 配置
  const genConfig = (key:string = '', value:any = null): FormatOptionsWithLanguage => {
    let config: FormatOptionsWithLanguage = {
      language: (('language' == key)? value : language),
      keywordCase: (('keywordCase' == key)? value : keywordCase) as KeywordCase,
      indentStyle: (('indentStyle' == key)? value : indentStyle) as IndentStyle,
      // tabWidth: 2,
      // useTabs: true,
    };
    return config;
  }

  /**
  export interface FormatOptions {
      tabWidth: number;
      useTabs: boolean;
      keywordCase: KeywordCase;
      indentStyle: IndentStyle;
      logicalOperatorNewline: LogicalOperatorNewline;
      tabulateAlias: boolean;
      commaPosition: CommaPosition;
      expressionWidth: number;
      linesBetweenQueries: number;
      denseOperators: boolean;
      newlineBeforeSemicolon: boolean;
  }
  */

  return (
    <div>
      {contextHolder}

      <Space>
        <Button 
          onClick={ () => { setResult(''); setValue(''); setHighLightResult(''); } }
          style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
        >清除</Button>
        <label>语言类型:</label>
        <Select
          value={ language }
          style={{ width: 120 }}
          onChange={ (v :string) => { setLanguage(v); doFormatter(value,genConfig('language',v)) } }
          options={ arrayToOptions(languageList) }
        />
        <label>关键字格式:</label>
        <Select
          value={ keywordCase }
          style={{ width: 120 }}
          onChange={ (v :string) => { setKeywordCase(v); doFormatter(value,genConfig('keywordCase',v)) } }
          options={ arrayToOptions(keywordCaseList) }
        />
        <label>对齐方式:</label>
        <Select
          value={ indentStyle }
          style={{ width: 120 }}
          onChange={ (v :string) => { setIndentStyle(v); doFormatter(value,genConfig('indentStyle',v)) } }
          options={ arrayToOptions(indentStyleList) }
        />
      </Space>

      <TextArea
        style={ { margin: "12px 0 5px 0" }}
        onChange={ onTextAreaChange }
        value= { value }
        placeholder="输入需要格式化的 SQL 语句"
        autoSize={{ minRows: 5,maxRows: 5}}
      />

      <Divider dashed />

      <div
        style={ { height: resultHight }}
        title="点击复制内容到粘贴板"
        onClick={ textareaDoubleClick }
        className="code-output">
        <pre dangerouslySetInnerHTML={ { __html : highLightResult } } />
      </div>
      
      {/* <TextArea
        style={ { margin: "5px 0 5px 0" }}
        onDoubleClick={ textareaDoubleClick }
        title="双击复制内容到粘贴板"
        value= { result }
        placeholder="格式化后的 SQL 语句"
        autoSize={{ minRows: 17}}
      /> */}
      
    </div>
  );
}

export default URL;