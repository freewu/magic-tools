import { Checkbox, Divider, Button, Input, Space, message, Table } from "antd";
import { useState } from "react";
import { SearchOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from "./../../lib"
import { parseChmod, modeDigits, lsSymbol, symbolicMode, chmodCommand, describeChmod } from "./lib"
import type { ChmodPerm, ChmodMeaning } from "./lib"

const PERM_META = [
  { label: '读', bit: 4, ch: 'r' },
  { label: '写', bit: 2, ch: 'w' },
  { label: '执行', bit: 1, ch: 'x' },
];

const targets :Array<{ key :keyof ChmodPerm; title :string; idx :number }> = [
  { key: 'user', title: '属主 (u)', idx: 0 },
  { key: 'group', title: '属组 (g)', idx: 1 },
  { key: 'other', title: '其它 (o)', idx: 2 },
];

const Chmod = () => {

  const [ special, setSpecial ] = useState(0);
  const [ user, setUser ] = useState(7);
  const [ group, setGroup ] = useState(5);
  const [ other, setOther ] = useState(5);
  const [ filename, setFilename ] = useState('file');
  const [ parseText, setParseText ] = useState('755');
  const [ notice, contextHolder ] = message.useMessage();

  const perm :ChmodPerm = { special, user, group, other };
  const meanings :ChmodMeaning[] = describeChmod(perm);

  const toggleBit = (target :keyof ChmodPerm, bit :number, checked :boolean) => {
    const cur = { user, group, other } as Record<keyof ChmodPerm, number>;
    const v = checked ? (cur[target as 'user' | 'group' | 'other'] | bit) : (cur[target as 'user' | 'group' | 'other'] & ~bit);
    if (target === 'user') setUser(v);
    if (target === 'group') setGroup(v);
    if (target === 'other') setOther(v);
  };

  const toggleSpecial = (bit :number, checked :boolean) => {
    setSpecial(checked ? (special | bit) : (special & ~bit));
  };

  const doParse = () => {
    try {
      const r = parseChmod(parseText);
      setSpecial(r.perm.special);
      setUser(r.perm.user);
      setGroup(r.perm.group);
      setOther(r.perm.other);
      notice.success(`已解读: ${modeDigits(r.perm)} / ${lsSymbol(r.perm)}`);
    } catch(err) {
      notice.error("解读失败: " + (err as Error).message);
    }
  };

  const copyCmd = () => {
    copyTextToClipboard(chmodCommand(perm, filename));
    notice.success("复制到粘贴板成功！！！");
  };

  return (
    <div>
      {contextHolder}

      <Space wrap style={ { margin: "5px 0" } }>
        <Input
          style={{ width: 240 }}
          allowClear
          value={ parseText }
          placeholder="输入 755 / 4755 / -rwxr-xr-x / chmod 命令"
          onChange={ (e) => setParseText(e.target.value) }
          onPressEnter={ doParse }
        />
        <Button
          onClick={ doParse }
          style={ { "backgroundColor" : "#007bff", "color" : "#fff" } }
          icon={<SearchOutlined />}
        >解读</Button>
        <span style={ { color: "#888" } }>解读结果会同步到下方勾选区</span>
      </Space>

      <Divider plain style={{ margin: "8px 0" }}>配置权限 (勾选后实时生成命令)</Divider>

      <div style={ { margin: "4px 0 8px" } }>
        <Space wrap size="large">
          {
            targets.map((t) => (
              <span key={ t.key } style={ { display: "inline-block", border: "1px solid #ddd", padding: "6px 10px", borderRadius: 6 } }>
                <b style={ { marginRight: 8 } }>{ t.title }</b>
                {
                  PERM_META.map((m) => (
                    <Checkbox
                      key={ m.ch }
                      checked={ (({ user, group, other })[t.key as 'user' | 'group' | 'other'] & m.bit) !== 0 }
                      onChange={ (e) => toggleBit(t.key as 'user' | 'group' | 'other', m.bit, e.target.checked) }
                    >{ m.label } { m.ch }</Checkbox>
                  ))
                }
              </span>
            ))
          }
          <span style={ { display: "inline-block", border: "1px solid #ddd", padding: "6px 10px", borderRadius: 6 } }>
            <b style={ { marginRight: 8 } }>特殊位</b>
            <Checkbox checked={ (special & 4) !== 0 } onChange={ (e) => toggleSpecial(4, e.target.checked) }>setuid (4)</Checkbox>
            <Checkbox checked={ (special & 2) !== 0 } onChange={ (e) => toggleSpecial(2, e.target.checked) }>setgid (2)</Checkbox>
            <Checkbox checked={ (special & 1) !== 0 } onChange={ (e) => toggleSpecial(1, e.target.checked) }>sticky (1)</Checkbox>
          </span>
        </Space>
      </div>

      <Table
        size="small"
        rowKey="target"
        style={ { margin: "6px 0" } }
        pagination={ false }
        dataSource={ meanings }
        columns={ [
          { title: '对象', dataIndex: 'target' },
          { title: '数值', dataIndex: 'bits', width: 60 },
          { title: '符号', dataIndex: 'chars', width: 80 },
          { title: '权限含义', render: (_ :unknown, r :ChmodMeaning) =>
              [r.read ? '读' : '', r.write ? '写' : '', r.exec ? '执行' : ''].filter(Boolean).join(' / ') || '无权限',
            width: 160 },
          { title: '特殊位', dataIndex: 'special', width: 160 },
        ] }
      />

      <Space wrap style={ { margin: "6px 0" } }>
        <label>文件名:</label>
        <Input
          style={{ width: 160 }}
          value={ filename }
          onChange={ (e) => setFilename(e.target.value) }
        />
        <Input
          readOnly
          value={ chmodCommand(perm, filename) }
          style={{ width: 240, fontFamily: "monospace" }}
        />
        <Button
          onClick={ copyCmd }
          style={ { "backgroundColor" : "#28a745", "color" : "#fff" } }
        >复制命令</Button>
      </Space>

      <Space wrap style={ { margin: "0 0 6px 0" } }>
        <label>符号写法:</label>
        <Input
          readOnly
          value={ `chmod ${symbolicMode(perm)} ${filename || 'file'}` }
          style={{ width: 320, fontFamily: "monospace" }}
        />
        <label>ls 显示:</label>
        <Input
          readOnly
          value={ lsSymbol(perm) }
          style={{ width: 130, fontFamily: "monospace" }}
        />
        <label>数字:</label>
        <Input
          readOnly
          value={ modeDigits(perm) }
          style={{ width: 80, fontFamily: "monospace" }}
        />
      </Space>

      <Divider> chmod 权限说明 </Divider>
      <p style={{ margin: "4px 0 8px", fontSize: 13 }}>
        Linux 权限分三组：<b>属主 (u)</b>、<b>属组 (g)</b>、<b>其它 (o)</b>，
        每组含读 (r=4)、写 (w=2)、执行 (x=1) 三个位，数值求和即为 0-7 的数字权限。
        数字串从左到右依次为 u/g/o，如 <code>chmod 755</code> = u:rwx, g:r-x, o:r-x。
      </p>
      <p style={{ margin: "4px 0 8px", fontSize: 13 }}>
        首位为<b>特殊位</b>：<b>4 = setuid</b>（执行时以属主身份运行，如 passwd）、
        <b>2 = setgid</b>（目录内新建文件继承属组）、<b>1 = sticky</b>（仅属主可删除，如 /tmp）。
        ls 显示时 setuid/setgid 使 x 变为小写 <b>s</b>（无执行则为大写 <b>S</b>），sticky 使其它执行位变为 <b>t/T</b>。
      </p>
      <Table
        size="small"
        rowKey="num"
        pagination={ false }
        style={ { margin: "6px 0" } }
        dataSource={ [
          { num: 0, sym: '---' }, { num: 1, sym: '--x' }, { num: 2, sym: '-w-' }, { num: 3, sym: '-wx' },
          { num: 4, sym: 'r--' }, { num: 5, sym: 'r-x' }, { num: 6, sym: 'rw-' }, { num: 7, sym: 'rwx' },
        ] }
        columns={ [
          { title: '数字', dataIndex: 'num', width: 80 },
          { title: '符号', dataIndex: 'sym', width: 100 },
          { title: '含义', render: (_ :unknown, r :{ num :number }) => {
              const b = r.num;
              return [b & 4 ? '读' : '', b & 2 ? '写' : '', b & 1 ? '执行' : ''].filter(Boolean).join('+') || '无权限';
            } },
        ] }
      />
    </div>
  );
}

export default Chmod;
