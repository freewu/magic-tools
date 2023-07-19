import { Checkbox, Form, Input, Divider, message, Space, Tag, Button } from "antd";
import { useState } from "react";
import { copyTextToClipboard, debounce } from "./../../lib"
import { openFile } from "../../lib/file"
import { emptyResult } from "./data"

import sha256 from 'crypto-js/sha256';
import sha1 from 'crypto-js/sha1';
import sha512 from 'crypto-js/sha512';
import md5 from 'crypto-js/md5';
import sha3 from 'crypto-js/sha3';
import sha224 from 'crypto-js/sha224';
import sha384 from 'crypto-js/sha384';
import ripemd160 from 'crypto-js/ripemd160';

import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import { getDefaultShowUppercase } from "./lib"
import "./file-hash.css"

const FileHash = () => {

  const genFormHeight = () => {
    return (window.innerHeight - 300) + "px";
  };

  const [ height, setHeight ] = useState(genFormHeight()); // 窗口大小高度

  // 窗体大小发生变化,改变窗口大小
  window.addEventListener('resize', debounce(() => { setHeight(genFormHeight()) },100) );

  const [ value, setValue ] = useState('');
  const [ checked, setChecked ] = useState(getDefaultShowUppercase());
  const [ hash, setHash ] = useState(emptyResult);
  const [ fileName, setFileName ] = useState('');
  const [ notice, contextHolder] = message.useMessage();

  const inputClick = (e :React.MouseEvent<HTMLElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt != "") {
      copyTextToClipboard(txt);
      notice.success("复制到粘贴板成功！！！");
    }
  };

  const upperLowerFormat = (str :string,flag :boolean) => {
    if(flag) return str.toUpperCase();
    return str.toLowerCase();
  }

  const onChange = (e :CheckboxChangeEvent) => {
    setChecked(!checked);
    // 如果加密内容不为空，处理 hash 值的大小问题
    //if ( value.trim() != "") {
      const result = {
        "md5": upperLowerFormat(hash["md5"],!checked),
        "md516": upperLowerFormat(hash["md516"],!checked),
        "sha1": upperLowerFormat(hash["sha1"],!checked),
        "sha256": upperLowerFormat(hash["sha256"],!checked),
        "sha512": upperLowerFormat(hash["sha512"],!checked),
        "sha3": upperLowerFormat(hash["sha3"],!checked),
        "sha224": upperLowerFormat(hash["sha224"],!checked),
        "sha384": upperLowerFormat(hash["sha384"],!checked),
        "ripemd160": upperLowerFormat(hash["ripemd160"],!checked),
      };
      setHash(result);
    //}
  };

  const changeValue = (value :any) => {
    setValue(value);
    calcHash(value);
  }

  const calcHash = (value :string) => {
    const result = {
      "md5": upperLowerFormat(md5(value).toString(),checked),
      "md516": "",
      "sha1": upperLowerFormat(sha1(value).toString(),checked),
      "sha256": upperLowerFormat(sha256(value).toString(),checked),
      "sha512": upperLowerFormat(sha512(value).toString(),checked),
      "sha3": upperLowerFormat(sha3(value).toString(),checked),
      "sha224": upperLowerFormat(sha224(value).toString(),checked),
      "sha384": upperLowerFormat(sha384(value).toString(),checked),
      "ripemd160": upperLowerFormat(ripemd160(value).toString(),checked),
    };
    // 处理 16 位 md5 
    result["md516"] = upperLowerFormat(result["md5"].substring(8,24),checked); // 取 9-24 位
    setHash(result);
  }

  return (
    <div>
      <div 
        className="file-pick"
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { 
          e.preventDefault();
          const files = e.dataTransfer.files;
          // openFile(e.dataTransfer.files, changeValue );
          setFileName(e.dataTransfer.files.length >=  1? e.dataTransfer.files[0].name : '');
          if(0 === files.length) {
            // notice.error("请选择文件！！！");
            return;
          }
          const reader = new FileReader();
          // 加载失败
          reader.onerror = (err) => {
            console.log(err);
          }
          // 文件加载完毕
          reader.onload = (e) => {
            console.log(e.target?.result);
            changeValue(reader.result)
            //changeValue(e.target?.result)
            // setValue(reader.result as string);
            // setLineCount(calcLineCount(reader.result as string));
          }
          //reader.readAsArrayBuffer(files[0]);
          reader.readAsBinaryString(files[0]);
          //reader.readAsText(files[0]);
        } }
      >
        <span>请拖拽要计算 Hash 值的文件到框内</span>
      </div>
      
      <Space>
        {/* <Button 
          onClick={ () => { setValue(''); setHash(emptyResult); setFileName(''); } }
          style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
        >清除</Button> */}
        <Checkbox onChange={onChange} checked={ checked }>结果大写字符展示</Checkbox>
        &nbsp;&nbsp;
        { fileName !== ''?
            <>
              { fileName }
              <Button
                onClick={ () => { setValue(''); setHash(emptyResult); setFileName(''); } }
                type="link" 
              >X</Button>
            </> 
            : null
        }
      </Space>

      <Divider dashed />

      <div className="hash-form textarea" style={ { height: height, overflowY: "auto",paddingRight: 12 } } >
        <Form name="basic"labelCol={{ span: 3 }}autoComplete="off" >
          <Form.Item label="MD5 (16位)">
            <Input readOnly showCount onClick={ inputClick } value= { hash.md516 } />
          </Form.Item>
          <Form.Item label="MD5 (32位)">
            <Input readOnly showCount onClick={ inputClick } value= { hash.md5 } />
          </Form.Item>
          <Form.Item label="RipeMD-160">
            <Input readOnly showCount onClick={ inputClick } value= { hash.ripemd160 } />
          </Form.Item>
          <Form.Item label="SHA1">
            <Input readOnly showCount onClick={ inputClick } value= { hash.sha1 } />
          </Form.Item>
          <Form.Item label="SHA256">
            <Input readOnly showCount onClick={ inputClick } value= { hash.sha256 }/>
          </Form.Item>
          <Form.Item label="SHA3">
            <Input readOnly showCount onClick={ inputClick } value= { hash.sha3 } title={ hash.sha3 }  />
          </Form.Item>
          <Form.Item label="SHA224">
            <Input readOnly showCount onClick={ inputClick } value= { hash.sha224 } />
          </Form.Item>
          <Form.Item label="SHA384">
            <Input readOnly showCount onClick={ inputClick } value= { hash.sha384 } title={ hash.sha384 } />
          </Form.Item>
          <Form.Item label="SHA512">
            <Input readOnly showCount onClick={ inputClick } value= { hash.sha512 } title={ hash.sha512 } />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

export default FileHash;