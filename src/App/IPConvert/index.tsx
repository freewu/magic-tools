import { Card, Form, Input, Row, Col, Typography } from 'antd';
import React, { useState } from 'react';
import { SwapOutlined } from '@ant-design/icons';
import { ipv4ToInt, ipv4Valid, intToIpv4, intTextValid, intToHex, intToBin } from './lib';
import type { InputStatus } from 'antd/es/_util/statusUtils';
import ipLang from "./lang";
import { useLocale } from "../../hook/locale-context";
import { tr } from "../../i18n/lang";

const { Text } = Typography;

const IPConvert :React.FC = () => {
  const { locale } = useLocale();
  const t = (key: string, fallback: string) => tr(ipLang, locale, key, fallback);

  const [ ip, setIp ] = useState('');           // IPv4 输入
  const [ int, setInt ] = useState('');         // 整数输入
  const [ ipStatus, setIpStatus ] = useState('' as InputStatus);
  const [ intStatus, setIntStatus ] = useState('' as InputStatus);

  // 展示辅助信息: 均合法时给出对应 HEX / BIN
  const intValue = intTextValid(int) ? parseIntSafe(int) : null;

  const onIpChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setIp(v);
    if (ipv4Valid(v)) {
      setIpStatus('');
      setInt(String(ipv4ToInt(v)));
      setIntStatus('');
    } else if (v.trim() === '') {
      setIpStatus('');
      setIntStatus('');
      setInt('');
    } else {
      setIpStatus('error');
    }
  };

  const onIntChange = (e :React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInt(v);
    if (intTextValid(v)) {
      setIntStatus('');
      setIp(intToIpv4(v));
      setIpStatus('');
    } else if (v.trim() === '') {
      setIntStatus('');
      setIpStatus('');
      setIp('');
    } else {
      setIntStatus('error');
    }
  };

  const valid = ipv4Valid(ip);

  return (
    <>
      <Card size="small" style={{ width: 640, marginBottom: 12 }}>
        <Row align="middle" gutter={ 8 }>
          <Col flex="auto">
            <Input
              allowClear
              status={ ipStatus }
              value={ ip }
              onChange={ onIpChange }
              placeholder={ t('ipPh','IPv4 地址, 如 192.168.1.1') }
            />
          </Col>
          <Col>
            <SwapOutlined style={{ color: '#999' }} />
          </Col>
          <Col flex="auto">
            <Input
              allowClear
              status={ intStatus }
              value={ int }
              onChange={ onIntChange }
              placeholder={ t('intPh','十进制整数, 支持 0x 前缀') }
            />
          </Col>
        </Row>
      </Card>
      { valid && (
        <Card size="small" style={{ width: 640 }}>
          <Form layout="vertical" style={{ marginBottom: 0 }}>
            <Form.Item label="HEX" style={{ marginBottom: 4 }}>
              <Text copyable code>0x{ intToHex(int) }</Text>
            </Form.Item>
            <Form.Item label="BIN" style={{ marginBottom: 0 }}>
              <Text copyable style={{ fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all' }}>{ intToBin(int) }</Text>
            </Form.Item>
          </Form>
        </Card>
      ) }
    </>
  );
};

// 仅在校验通过后调用
function parseIntSafe(s :string) :number {
  const t = s.trim();
  if (/^0[xX]/u.test(t)) return parseInt(t.slice(2), 16);
  if (/^0[bB]/u.test(t)) return parseInt(t.slice(2), 2);
  return parseInt(t, 10);
}

export default IPConvert;
