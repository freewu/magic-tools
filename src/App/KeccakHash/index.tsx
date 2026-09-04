import { Checkbox, Form, Input, Divider, message, Space, Tag, Button } from "antd";
import { useState } from "react";
const { TextArea } = Input;
import { copyTextToClipboard } from "./../../lib"
import { openFile } from "../../lib/file"
import { emptyResult, FIXED_ITEMS } from "./data"
import { computeKeccakHash, getDefaultUpper } from "./lib"
import type { KeccakHashResult } from "./data"
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import { getPasswordList } from "../Hash/lib"
import "../Hash/hash.css"

const KeccakHash = () => {

  const [ value, setValue ] = useState('');
  const [ checked, setChecked ] = useState(getDefaultUpper());
  const [ hash, setHash ] = useState<KeccakHashResult>(emptyResult);
  const [ notice, contextHolder ] = message.useMessage();

  const fmt = (str :string) => { return checked ? str.toUpperCase() : str.toLowerCase(); };

  const inputClick = (e :React.MouseEvent<HTMLElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if(txt !== "") {
      copyTextToClipboard(txt);
      notice.success("复制到粘贴板成功！！！");
    }
  };

  const compute = (text :string, upper :boolean) => {
    setChecked(upper);
    if (text.trim() === "") {
      setHash(emptyResult);
      return;
    }
    const r = computeKeccakHash(text);
    const up = (str :string) => { return upper ? str.toUpperCase() : str.toLowerCase(); };
    setHash({
      "keccak_224": up(r.keccak_224),
      "keccak_256": up(r.keccak_256),
      "keccak_384": up(r.keccak_384),
      "keccak_512": up(r.keccak_512),
    });
  };

  const changeValue = (text :string) => {
    setValue(text);
    compute(text, checked);
  };

  const onChangeUpper = (e :CheckboxChangeEvent) => {
    const upper = e.target.checked;
    setChecked(upper);
    if (value.trim() !== "") {
      const r = computeKeccakHash(value);
      const up = (str :string) => { return upper ? str.toUpperCase() : str.toLowerCase(); };
      const n :KeccakHashResult = {
        "keccak_224": up(r.keccak_224),
        "keccak_256": up(r.keccak_256),
        "keccak_384": up(r.keccak_384),
        "keccak_512": up(r.keccak_512),
      };
      setHash(n);
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
                  onClick={ () => { setValue(password); compute(password, checked); } } >{ password }</Tag>
              )
            }
          })
        }
      </Space>
      <TextArea
        style={ { margin: "5px 0 5px 0" } }
        value={ value }
        onChange={ (e) => { changeValue(e.target.value) } }
        placeholder="输入需要计算 Keccak Hash 值的内容 或 拖拽文件到框内打开"
        autoSize={{ minRows: 5, maxRows: 5 }}
        onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
        onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, changeValue); } }
      />
      <Space wrap>
        <Button
          onClick={ () => { setValue(''); setHash(emptyResult); } }
          style={ { backgroundColor: "#dc3545", color: "#fff" } }
        >清除</Button>
        <Checkbox checked={ checked } onChange={ onChangeUpper }>结果大写字符展示</Checkbox>
      </Space>

      <Divider dashed />

      <div className="hash-form" style={ { flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 12 } } >
        <Form name="keccak-hash-form" labelCol={{ span: 3 }} autoComplete="off">
          {
            FIXED_ITEMS.map((item) => {
              return (
                <Form.Item key={ item.key } label={ item.label }>
                  <Input readOnly showCount onClick={ inputClick } value={ hash[item.key] } />
                </Form.Item>
              );
            })
          }
        </Form>
      </div>
    </div>
  );
}

export default KeccakHash;
