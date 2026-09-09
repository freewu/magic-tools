import { Button, Card, Form, Input, InputNumber, Progress, QRCode, Segmented, Select, Space, Typography, message } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { ReloadOutlined, CopyOutlined } from '@ant-design/icons';
import { hotp, totp, totpRemaining, randomBase32Secret, buildOtpUri } from './lib';
import type { OtpAlgorithm } from './lib';
import { copyTextToClipboard } from '../../lib';
import { useLocale } from '../../hook/locale-context';
import { u, uT } from '../ui-lang';
import type { InputStatus } from 'antd/es/_util/statusUtils';

const { Text } = Typography;

const OTPGenerator :React.FC = () => {

  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => uT(locale, zh, v);

  const [ notice, contextHolder ] = message.useMessage();
  const [ mode, setMode ] = useState<'totp' | 'hotp'>('totp');
  const [ secret, setSecret ] = useState('');   // Base32 密钥
  const [ algorithm, setAlgorithm ] = useState<OtpAlgorithm>('SHA1');
  const [ digits, setDigits ] = useState(6);
  const [ period, setPeriod ] = useState(30);
  const [ counter, setCounter ] = useState(0);
  const [ issuer, setIssuer ] = useState('');   // 名称 (二维码 issuer)
  const [ account, setAccount ] = useState(''); // 账号 (二维码 label)
  const [ nowMs, setNowMs ] = useState(() => Date.now());

  // TOTP 秒级刷新 + 倒计时
  useEffect(() => {
    const t = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(t);
  }, []);

  const sec = Math.floor(nowMs / 1000);

  // 计算验证码
  let code = '';
  let err = '';
  try {
    if (secret.trim() !== '') {
      code = mode === 'totp'
        ? totp(secret, { digits, period, algorithm, time: sec })
        : hotp(secret, counter, { digits, algorithm });
    }
  } catch (e) {
    err = (e as Error).message;
  }
  const secretValid = secret.trim() !== '' && err === '';
  const secretStatus :InputStatus = err !== '' ? 'error' : '';
  const remaining = mode === 'totp' ? totpRemaining(nowMs / 1000, period) : 0;

  // otpauth:// URI (二维码导入)
  const uri = useMemo(() => {
    if (secret.trim() === '' || account.trim() === '') return '';
    try {
      return buildOtpUri({ type: mode, secret, account, issuer, digits, period, algorithm, counter });
    } catch {
      return '';
    }
  }, [ mode, secret, account, issuer, digits, period, algorithm, counter ]);

  const copyCode = () => {
    if (code === '') return;
    copyTextToClipboard(code);
    notice.success(t('验证码已复制'));
  };

  const copyUri = () => {
    copyTextToClipboard(uri);
    notice.success(t('otpauth 链接已复制'));
  };

  return (
    <Space direction="vertical" size="middle" align="start" style={ { width: '100%', maxWidth: 880 } }>
      { contextHolder }
      <Card size="small" style={ { width: '100%' } } title={t('动态口令')}>
        <Space direction="vertical" size="middle" style={ { width: '100%' } }>
          <Space wrap>
            <Segmented
              value={ mode }
              onChange={ (v) => setMode(v as 'totp' | 'hotp') }
              options={ [
                { label: t('TOTP (时间)'), value: 'totp' },
                { label: t('HOTP (计数)'), value: 'hotp' },
              ] }
            />
            <Text type="secondary">{t('兼容 Google / Microsoft Authenticator')}</Text>
          </Space>
          <Form layout="inline" style={ { rowGap: 12 } }>
            <Form.Item label={t('密钥')} style={ { marginBottom: 0 } }>
              <Space.Compact>
                <Input
                  allowClear
                  status={ secretStatus }
                  value={ secret }
                  onChange={ (e) => setSecret(e.target.value.toUpperCase().replace(/\s/gu, '')) }
                  placeholder={t('Base32, 如 GEZDGNBV…')}
                  style={ { width: 260, fontFamily: 'monospace' } }
                />
                <Button
                  icon={ <ReloadOutlined /> }
                  onClick={ () => setSecret(randomBase32Secret()) }
                  title={t('随机生成密钥')}
                />
              </Space.Compact>
            </Form.Item>
            <Form.Item label={t('算法')} style={ { marginBottom: 0 } }>
              <Select
                value={ algorithm }
                style={ { width: 110 } }
                onChange={ setAlgorithm }
                options={ [{ value: 'SHA1' }, { value: 'SHA256' }, { value: 'SHA512' }] }
              />
            </Form.Item>
            <Form.Item label={t('位数')} style={ { marginBottom: 0 } }>
              <Select value={ digits } style={ { width: 80 } } onChange={ setDigits } options={ [{ value: 6, label: t('6 位') }, { value: 7, label: t('7 位') }, { value: 8, label: t('8 位') }] } />
            </Form.Item>
            { mode === 'totp' && (
              <Form.Item label={t('步长(秒)')} style={ { marginBottom: 0 } }>
                <InputNumber min={ 10 } max={ 300 } step={ 10 } value={ period } onChange={ (v) => v && setPeriod(v) } style={ { width: 90 } } />
              </Form.Item>
            ) }
            { mode === 'hotp' && (
              <Form.Item label={t('计数')} style={ { marginBottom: 0 } }>
                <Space.Compact>
                  <InputNumber min={ 0 } precision={ 0 } value={ counter } onChange={ (v) => v != null && setCounter(v) } style={ { width: 110 } } />
                  <Button onClick={ () => setCounter((c) => c + 1) }>{t('+1')}</Button>
                </Space.Compact>
              </Form.Item>
            ) }
          </Form>
          <Space.Compact style={ { width: '100%' } }>
            <Input addonBefore={t('名称')} value={ issuer } onChange={ (e) => setIssuer(e.target.value) } placeholder={t('如 GitHub (可选)')} style={ { width: 220 } } />
            <Input addonBefore={t('账号')} value={ account } onChange={ (e) => setAccount(e.target.value) } placeholder={t('用于扫码导入的标签')} />
          </Space.Compact>
          { err !== '' && <Text type="danger">{ err }</Text> }
        </Space>
      </Card>

      <Card size="small" style={ { width: '100%' } } title={ mode === 'totp' ? t('当前验证码') : t('当前验证码 (每次使用后计数 +1)') }>
        { secretValid ? (
          <Space direction="vertical" size="middle" style={ { width: '100%' } }>
            <Space align="center">
              <Text style={ { fontSize: 46, fontFamily: 'monospace', letterSpacing: 8, color: '#1677ff', lineHeight: 1.1 } }>
                { code }
              </Text>
              <Button icon={ <CopyOutlined /> } onClick={ copyCode }>{t('复制')}</Button>
            </Space>
            { mode === 'totp' && (
              <Space direction="vertical" size={ 0 } style={ { width: 260 } }>
                <Progress percent={ Math.round((remaining / period) * 100) } showInfo={ false } size="small" strokeColor={ remaining <= 5 ? '#ff4d4f' : '#1677ff' } />
                <Text type="secondary" style={ { fontSize: 12 } }>{tt('{r} 秒后刷新', { r: remaining })}</Text>
              </Space>
            ) }
            { uri !== '' && (
              <Space size="middle" align="center">
                <QRCode value={ uri } size={ 132 } bordered={ false } icon="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg" iconSize={ 22 } />
                <Space direction="vertical">
                  <Text type="secondary" style={ { fontSize: 12 } }>{t('扫码添加至 Authenticator (otpauth://)')}</Text>
                  <Button size="small" icon={ <CopyOutlined /> } onClick={ copyUri }>{t('复制导入链接')}</Button>
                </Space>
              </Space>
            ) }
          </Space>
        ) : (
          <Text type="secondary">{ secret.trim() === '' ? t('请输入或生成密钥') : t('密钥格式有误') }</Text>
        ) }
      </Card>
    </Space>
  );
};

export default OTPGenerator;
