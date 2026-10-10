import { Button, Col, Divider, Form, Input, message, Row, Space, Tag } from 'antd';
import React, { useState } from 'react';
import { SwapOutlined } from '@ant-design/icons';
import { ipv4ToInt, ipv4Valid, intToIpv4, intTextValid, intToHex, intToBin, ipv4ToIpv6RowsSafe } from './lib';
import type { InputStatus } from 'antd/es/_util/statusUtils';
import { copyTextToClipboard } from "./../../lib";
import ipLang from "./lang";
import { useLocale } from "../../hook/locale-context";
import { tr } from "../../i18n/lang";
import "./ipconvert.css";

// 常用示例 IP (点击标签即填入并换算)
const SAMPLE_IPS = [
  '0.0.0.0',
  '127.0.0.1',
  '10.0.0.1',
  '172.16.0.1',
  '192.168.1.1',
  '169.254.1.1',
  '224.0.0.1',
  '255.255.255.255',
  '8.8.8.8',
];

// 彩色标签底色 (与「Hash 值计算」一致, 4 色循环)
const TAG_COLORS = [ '#ff5500', '#2db7f5', '#87d068', '#108ee9' ];

const IPConvert :React.FC = () => {
  const { locale } = useLocale();
  const t = (key: string, fallback: string) => tr(ipLang, locale, key, fallback);

  const [ ip, setIp ] = useState('');           // IPv4 输入
  const [ int, setInt ] = useState('');         // 整数输入
  const [ ipStatus, setIpStatus ] = useState('' as InputStatus);
  const [ intStatus, setIntStatus ] = useState('' as InputStatus);
  const [ notice, contextHolder ] = message.useMessage();

  // 点击结果框, 把结果复制到粘贴板 (与「Hash 值计算」一致)
  const inputClick = (e :React.MouseEvent<HTMLElement>) => {
    const txt = (e.target as HTMLInputElement).value.trim();
    if (txt != '') {
      copyTextToClipboard(txt);
      notice.success(t('copyOk','复制到粘贴板成功！！！'));
    }
  };

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

  // 应用示例 IP
  const applySample = (v :string) => {
    setIp(v);
    setIpStatus('');
    setInt(String(ipv4ToInt(v)));
    setIntStatus('');
  };

  // 清除输入与结果
  const clear = () => {
    setIp('');
    setInt('');
    setIpStatus('');
    setIntStatus('');
  };

  const valid = ipv4Valid(ip);

  return (
    <div style={ { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 } }>
      {contextHolder}

      <Space size={[0, 8]} wrap style={ { display: 'flex', marginBottom: 8 } }>
        { SAMPLE_IPS.map((v, index) => (
          <Tag
            className="ip-tag"
            key={ v }
            color={ TAG_COLORS[index % TAG_COLORS.length] }
            onClick={ () => applySample(v) }
          >{ v }</Tag>
        )) }
      </Space>

      <Row align="middle" gutter={ 8 } style={ { marginBottom: 8 } }>
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

      <Space>
        <Button
          onClick={ clear }
          style={ {"backgroundColor" : "#dc3545","color": "#fff"} }
        >{ t('clear','清除') }</Button>
      </Space>

      <Divider dashed />

      {/* 结果区常驻显示: 值为空时各行为空串, 不隐藏也不跳动 */}
      <div className="ip-form" style={ { flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 12 } }>
        <Form labelCol={{ span: 5 }} autoComplete="off">
          <Form.Item label="HEX" style={{ marginBottom: 12 }}>
            <Input readOnly showCount onClick={ inputClick } value={ valid ? `0x${intToHex(int)}` : '' } />
          </Form.Item>
          <Form.Item label="BIN" style={{ marginBottom: 12 }}>
            <Input readOnly showCount onClick={ inputClick } value={ valid ? intToBin(int) : '' } />
          </Form.Item>
          <Divider orientation="left" style={{ margin: '0 0 12px' }}>{ t('ipv6Title','对应的 IPv6 写法') }</Divider>
          { ipv4ToIpv6RowsSafe(ip).map((form) => (
            <Form.Item key={ form.key } label={ t(form.key, form.key) } style={{ marginBottom: 12 }}>
              <Input readOnly showCount onClick={ inputClick } value={ form.value } />
            </Form.Item>
          )) }
        </Form>
        <div style={ { color: '#999', fontSize: 12 } }>{ t('ipv6Hint','同一条 IPv4 在不同过渡方案下的写法, 点输入框即可复制') }</div>
      </div>
    </div>
  );
};

export default IPConvert;
