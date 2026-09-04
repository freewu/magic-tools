import { Checkbox, Form, Input, Divider, message, Space, Tag, Button, InputNumber } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { openFile } from "../../lib/file"
import { emptyResult, FIXED_ITEMS } from "./data"
import { computeSha3Hash, getDefaultShakeBits, getDefaultUpper } from "./lib"
import type { Sha3HashResult } from "./data"
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import { getPasswordList } from "../Hash/lib"
import "../Hash/hash.css"

const SHA3Hash = () => {

  const [ value, setValue ] = useState('');
  const [ checked, setChecked ] = useState(getDefaultUpper());
  const [ shakeBits, setShakeBits ] = useState(getDefaultShakeBits());
  const [ hash, setHash ] = useState<Sha3HashResult>(emptyResult);
  const [ notice, contextHolder ] = message.useMessage();

  const fmt = (str :string) => { return checked ? str.toUpperCase() : str.toLowerCase(); };

  const inputClick = (e :React.MouseEvent<HTMLElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt !== "") {
      copyTextToClipboard(txt);
      notice.success("复制到粘贴板成功！！！");
    }
  };

  const compute = (text :string, bits :number, upper :boolean) => {
    setChecked(upper);
    if (text.trim() === "") {
      setHash(emptyResult);
      return;
    }
    const r = computeSha3Hash(text, bits);
    setHash({ ...r });
  };

  const changeValue = (text :string) => {
    setValue(text);
    compute(text, shakeBits, checked);
  };

  const onChangeUpper = (e :CheckboxChangeEvent) => {
    const upper = e.target.checked;
    setChecked(upper);
    if (value.trim() !== "") {
      // 仅重新做大小写格式化, 无需重算摘要
      const r = computeSha3Hash(value, shakeBits);
      const up = (str :string) => { return upper ? str.toUpperCase() : str.toLowerCase(); };
      const n :Sha3HashResult = {
        "sha3_224": up(r.sha3_224),
        "sha3_256": up(r.sha3_256),
        "sha3_384": up(r.sha3_384),
        "sha3_512": up(r.sha3_512),
        "shake128": up(r.shake128),
        "shake256": up(r.shake256),
      };
      setHash(n);
    }
  };

  const onChangeShakeBits = (v :number | null) => {
    if (v != null && Number.isInteger(v) && v >= 8 && v % 8 === 0) {
      setShakeBits(v);
      if (value.trim() !== "") {
        const r = computeSha3Hash(value, v);
        setHash({ ...r });
      }
    }
  };

  const calcTagColor = (index :number) => {
    switch(index % 4) {
      case 1: return '#2db7f5';
      case 2: return '#87d068';
      case 3: return '#108ee9';
    }
    return '#ff5500';
  }

  return (
    <div style={ { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 } }>
      {contextHolder}
      <Space size={[0, 8]} wrap>
        {
          getPasswordList()?.map((password, index) => {
            // 与 Hash 值计算保持一致, 只展示 10 个
            if(index < 10) {
              return (
                <Tag
                  className="hash-tag"
                  key={ password }
                  color={ calcTagColor(index) }
                  onClick={ () => { setValue(password); compute(password, shakeBits, checked); } } >{ password }</Tag>
              )
            }
          })
        }
      </Space>
      <TextArea
        style={ { margin: "5px 0 5px 0" } }
        value={ value }
        onChange={ (e) => { changeValue(e.target.value) } }
        placeholder="输入需要计算 SHA3 Hash 值的内容 或 拖拽文件到框内打开"
        autoSize={{ minRows: 5, maxRows: 5 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, changeValue); } }
      />
      <Space wrap>
        <Button
          onClick={ () => { setValue(''); setShakeBits(getDefaultShakeBits()); setHash(emptyResult); } }
          style={ { backgroundColor: "#dc3545", color: "#fff" } }
        >清除</Button>
        <Checkbox checked={ checked } onChange={ onChangeUpper }>结果大写字符展示</Checkbox>
        <span style={ { color: "#888" } }>SHAKE 输出长度</span>
        <InputNumber
          min={ 8 }
          max={ 8192 }
          step={ 8 }
          style={ { width: 110 } }
          title="SHAKE128/256 的输出长度 (bit), 须为 8 的整数倍"
          value={ shakeBits }
          onChange={ onChangeShakeBits }
        />
      </Space>

      <Divider dashed />

      <div className="hash-form" style={ { flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 12 } } >
        <Form name="sha3-hash-form" labelCol={{ span: 3 }} autoComplete="off">
          {
            FIXED_ITEMS.map((item) => {
              return (
                <Form.Item key={ item.key } label={ item.label }>
                  <Input readOnly showCount onClick={ inputClick } value={ fmt(hash[item.key]) } />
                </Form.Item>
              );
            })
          }
          <Form.Item key="shake128" label={ `SHAKE128 (${shakeBits} bit)` }>
            <Input readOnly showCount onClick={ inputClick } value={ fmt(hash.shake128) } />
          </Form.Item>
          <Form.Item key="shake256" label={ `SHAKE256 (${shakeBits} bit)` }>
            <Input readOnly showCount onClick={ inputClick } value={ fmt(hash.shake256) } />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

export default SHA3Hash;
