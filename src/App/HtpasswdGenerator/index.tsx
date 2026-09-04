import { Button, Divider, Input, message, Select, Space } from 'antd';
import { useState } from 'react';
import { CopyOutlined, SaveOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from '../../lib';
import { saveTextFile } from '../../lib/tauri';
import { HTPASSWD_METHODS, type HtpasswdMethod } from './data';
import {
  buildHtpasswdFile,
  buildHtpasswdLine,
  getBcryptRounds,
  getDefaultMethod,
} from './lib';
import HtpasswdIntro from './intro';

const HtpasswdGenerator = () => {

  const [ user, setUser ] = useState('admin'); // 账号
  const [ pass, setPass ] = useState(''); // 密码
  const [ method, setMethod ] = useState<HtpasswdMethod>(getDefaultMethod()); // 加密方式
  const [ line, setLine ] = useState(''); // 生成结果 (用户名:哈希)
  const [ notice, contextHolder ] = message.useMessage(); // 消息提醒

  // 当前加密方式信息
  const methodInfo = HTPASSWD_METHODS.find((v) => v.value === method);

  // 生成 htpasswd 记录
  const generate = () => {
    try {
      setLine(buildHtpasswdLine(user, pass, { method, rounds: getBcryptRounds() }));
      notice.success('生成成功, 可双击下方结果复制');
    } catch (err) {
      setLine('');
      notice.error('生成失败: ' + (err as Error).message);
    }
  };

  // 复制结果
  const copyLine = () => {
    if (line === '') return;
    copyTextToClipboard(line);
    notice.success('复制到粘贴板成功!!!');
  };

  // 保存为 .htpasswd 文件
  const saveFile = async () => {
    if (line === '') return;
    const ok = await saveTextFile('.htpasswd', buildHtpasswdFile([line]), '保存 .htpasswd 文件');
    if (ok) notice.success('已保存 .htpasswd 文件');
  };

  // 清除
  const clearAll = () => {
    setUser('');
    setPass('');
    setLine('');
  };

  return (
    <div>
      {contextHolder}

      {/* 输入区 */}
      <Space direction="vertical" style={ { width: '100%', maxWidth: 560 } } size={ 12 }>
        <div style={ { display: 'flex', alignItems: 'center', gap: 12 } }>
          <span style={ { width: 76, textAlign: 'right', color: '#666', whiteSpace: 'nowrap' } }>账号</span>
          <Input
            allowClear
            value={ user }
            placeholder="如 admin"
            onChange={ (e) => { setUser(e.target.value); } }
            onPressEnter={ generate }
            maxLength={ 64 }
          />
        </div>
        <div style={ { display: 'flex', alignItems: 'center', gap: 12 } }>
          <span style={ { width: 76, textAlign: 'right', color: '#666', whiteSpace: 'nowrap' } }>密码</span>
          <Input.Password
            allowClear
            value={ pass }
            placeholder="输入密码"
            onChange={ (e) => { setPass(e.target.value); } }
            onPressEnter={ generate }
          />
        </div>
        <div style={ { display: 'flex', alignItems: 'center', gap: 12 } }>
          <span style={ { width: 76, textAlign: 'right', color: '#666', whiteSpace: 'nowrap' } }>加密方式</span>
          <Select
            value={ method }
            style={ { width: 220 } }
            onChange={ (v :HtpasswdMethod) => { setMethod(v); } }
            options={ HTPASSWD_METHODS.map((v) => ({ value: v.value, label: v.label })) }
          />
          <Button type="primary" onClick={ generate }>生成</Button>
        </div>
        <div style={ { marginLeft: 88, color: '#999', fontSize: 12, lineHeight: '18px' } }>
          { methodInfo?.cmd } — { methodInfo?.tip }
        </div>
      </Space>

      <Divider />

      {/* 结果区 */}
      <div style={ { maxWidth: 560 } }>
        <Input
          readOnly
          value={ line }
          placeholder="生成结果: 用户名:密码哈希"
          title="双击复制内容到粘贴板"
          onDoubleClick={ (e) => {
            if ((e.target as HTMLInputElement).value.trim() !== '') {
              copyLine();
            }
          } }
          style={ { marginBottom: 12 } }
        />
        <Space>
          <Button
            disabled={ line === '' }
            icon={ <CopyOutlined /> }
            onClick={ copyLine }
          >复制</Button>
          <Button
            disabled={ line === '' }
            style={ { backgroundColor: '#28a745', color: '#fff' } }
            icon={ <SaveOutlined /> }
            onClick={ saveFile }
          >保存为 .htpasswd 文件</Button>
          <Button
            style={ { backgroundColor: '#dc3545', color: '#fff' } }
            onClick={ clearAll }
          >清除</Button>
        </Space>
      </div>

      <Divider>htpasswd 生成说明</Divider>

      <HtpasswdIntro />
    </div>
  );
}

export default HtpasswdGenerator;
