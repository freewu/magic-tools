import { Alert, Button, Divider, Form, Input, InputNumber, Space, Tag, message } from 'antd';
import { useState } from 'react';
import { copyTextToClipboard } from '../../lib';
import {
  BCRYPT_COST_MAX,
  BCRYPT_COST_MIN,
  BCRYPT_DEFAULT_COST,
  bcryptCostOf,
  genBcrypt,
  isValidBcryptHash,
  verifyBcrypt,
} from './lib';

const BcryptCalc = () => {
  const [ password, setPassword ] = useState(''); // 待生成哈希的口令
  const [ cost, setCost ] = useState<number>(BCRYPT_DEFAULT_COST);
  const [ hash, setHash ] = useState(''); // 生成结果
  const [ busy, setBusy ] = useState(false);
  const [ verifyPassword, setVerifyPassword ] = useState(''); // 待校验口令
  const [ verifyHash, setVerifyHash ] = useState(''); // 待校验哈希
  const [ match, setMatch ] = useState<boolean | null>(null);
  const [ checking, setChecking ] = useState(false);
  const [ notice, contextHolder ] = message.useMessage();

  const inputClick = (e: React.MouseEvent<HTMLElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if (txt !== '') {
      copyTextToClipboard(txt);
      notice.success('复制到粘贴板成功！！！');
    }
  };

  const generate = async () => {
    if (password === '') return;
    setBusy(true);
    try {
      const h = await genBcrypt(password, cost);
      setHash(h);
    } catch (err) {
      notice.error(`生成失败: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const check = async () => {
    if (verifyPassword === '' || verifyHash.trim() === '') return;
    if (!isValidBcryptHash(verifyHash.trim())) {
      notice.error('BCrypt 哈希格式不正确');
      setMatch(null);
      return;
    }
    setChecking(true);
    try {
      setMatch(await verifyBcrypt(verifyPassword, verifyHash.trim()));
    } catch (err) {
      notice.error(`校验失败: ${(err as Error).message}`);
      setMatch(null);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={ { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 } }>
      {contextHolder}
      <Alert
        type="info"
        showIcon
        message="BCrypt 内置随机盐, 相同口令每次生成结果不同; 使用前请确认与目标系统相同的 $2a/$2b/$2y 前缀与成本因子"
      />
      <Divider orientation="left" plain>生成哈希</Divider>
      <Space direction="vertical" style={ { width: '100%' } } size={ 4 }>
        <Form.Item label="口令" style={ { marginBottom: 8 } }>
          <Input
            allowClear
            value={ password }
            placeholder="输入需要计算 BCrypt 哈希的口令 (超过 72 字节的内容会被截断)"
            onChange={ (e) => setPassword(e.target.value) }
          />
        </Form.Item>
        <Space wrap>
          <span>成本因子</span>
          <InputNumber
            min={ BCRYPT_COST_MIN }
            max={ BCRYPT_COST_MAX }
            value={ cost }
            onChange={ (v) => { if (v != null) setCost(v); } }
          />
          <Button type="primary" loading={ busy } disabled={ password === '' } onClick={ generate }>
            生成 BCrypt
          </Button>
        </Space>
        <Form.Item label="BCrypt" style={ { marginTop: 8, marginBottom: 0 } }>
          <Input readOnly showCount value={ hash } placeholder="生成结果, 点击可复制" onClick={ inputClick } />
        </Form.Item>
      </Space>

      <Divider orientation="left" plain>校验</Divider>
      <Form layout="inline" style={ { flexWrap: 'wrap', rowGap: 8 } }>
        <Form.Item label="口令">
          <Input
            allowClear
            value={ verifyPassword }
            placeholder="候选口令"
            style={ { width: 220 } }
            onChange={ (e) => { setVerifyPassword(e.target.value); setMatch(null); } }
          />
        </Form.Item>
        <Form.Item label="BCrypt 哈希">
          <Input
            allowClear
            value={ verifyHash }
            placeholder="$2a$10$..."
            style={ { width: 320 } }
            onChange={ (e) => { setVerifyHash(e.target.value); setMatch(null); } }
          />
        </Form.Item>
        <Form.Item>
          <Button loading={ checking } disabled={ verifyPassword === '' || verifyHash.trim() === '' } onClick={ check }>
            校验
          </Button>
        </Form.Item>
      </Form>
      { match !== null && (
        <Tag color={ match ? 'green' : 'red' } style={ { marginTop: 8, width: 'fit-content' } }>
          { match ? '校验通过: 口令与哈希匹配' : '校验失败: 口令与哈希不匹配' }
        </Tag>
      ) }
      { verifyHash.trim() !== '' && isValidBcryptHash(verifyHash.trim()) && bcryptCostOf(verifyHash.trim()) !== cost && (
        <div style={ { marginTop: 4, color: '#999', fontSize: 12 } }>
          提示: 目标哈希成本因子为 { bcryptCostOf(verifyHash.trim()) }, 与上方生成区当前成本 { cost } 不同
        </div>
      ) }
    </div>
  );
};

export default BcryptCalc;
