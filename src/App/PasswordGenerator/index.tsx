import { Alert, Button, Card, Checkbox, Col, Input, Progress, Row, Slider, Space, Tag, message } from "antd";
import { useMemo, useState } from "react";
import { CheckCircleFilled, CloseCircleFilled, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from '../../lib';
import { genPassword, passwordStrength, humanSeconds, STRENGTH_LEVELS } from './lib';

// 强度面板: 进度条 + 估算信息 + 检查明细
const StrengthPanel: React.FC<{ pw: string }> = ({ pw }) => {
  const r = useMemo(() => passwordStrength(pw), [pw]);
  const [ notice, contextHolder ] = message.useMessage();

  if (pw === '') {
    return (
      <div style={ { color: 'rgba(0,0,0,0.45)', textAlign: 'center', padding: '24px 0' } }>
        输入或生成一个密码后显示强度评估
      </div>
    );
  }

  const percent = Math.round((r.score / 4) * 100);
  return (
    <>
      { contextHolder }
      <Space direction="vertical" style={ { width: '100%' } }>
        <Space>
          <span style={ { width: 72, textAlign: 'right' } }>强度:</span>
          <Progress
            style={ { width: 220 } }
            percent={ percent }
            strokeColor={ r.level.color }
            format={ () => '' }
          />
          <Tag color={ r.level.color } style={ { marginInlineEnd: 0 } }>{ r.level.label }</Tag>
        </Space>
        <Space wrap>
          <span style={ { width: 72, textAlign: 'right' } }>参考熵:</span>
          <span>{ r.entropy >= 120 ? '≥120' : r.entropy.toFixed(1) } bits</span>
          <span style={ { color: 'rgba(0,0,0,0.45)' } }>按每秒 1 万亿次猜测约需 { humanSeconds(r.offlineSec) }</span>
        </Space>
        <Space wrap>
          <span style={ { width: 72, textAlign: 'right' } }>在线攻击:</span>
          <span>按每秒 1000 次猜测约需 { humanSeconds(r.onlineSec) }</span>
        </Space>
        <div style={ { color: r.level.color, fontSize: 13 } }>{ r.level.desc }</div>
        <div
          style={ {
            display: 'flex', flexDirection: 'column', gap: 2,
            borderTop: '1px dashed rgba(128,128,128,0.35)', paddingTop: 8,
          } }
        >
          { r.checks.map((c, i) => (
            <div key={ i } style={ { fontSize: 13 } }>
              { c.ok
                ? <CheckCircleFilled style={ { color: '#52c41a', marginRight: 6 } } />
                : <CloseCircleFilled style={ { color: '#ff4d4f', marginRight: 6 } } /> }
              <span style={ { color: c.ok ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.88)' } }>{ c.label }</span>
            </div>
          )) }
        </div>
      </Space>
    </>
  );
};

const PasswordGenerator = () => {
  const [ length, setLength ] = useState(16);          // 长度
  const [ upper, setUpper ] = useState(true);          // 大写
  const [ lower, setLower ] = useState(true);          // 小写
  const [ digit, setDigit ] = useState(true);          // 数字
  const [ symbol, setSymbol ] = useState(true);        // 符号
  const [ excludeAmbiguous, setExcludeAmbiguous ] = useState(true); // 排除易混淆
  const [ pw, setPw ] = useState('');                  // 当前密码 (生成或手工输入)
  const [ notice, contextHolder ] = message.useMessage();

  const generate = () => {
    const p = genPassword({ length, upper, lower, digit, symbol, excludeAmbiguous });
    setPw(p);
  };

  const copy = async () => {
    if (!pw) {
      notice.warning('请先生成或输入密码');
      return;
    }
    await copyTextToClipboard(pw);
    notice.success('已复制到剪贴板');
  };

  const strengthHint = useMemo(() => {
    if (!pw) return null;
    const lv = STRENGTH_LEVELS[passwordStrength(pw).score];
    return lv;
  }, [pw]);

  return (
    <>
      { contextHolder }
      <Alert
        type="info"
        showIcon
        style={ { marginBottom: 10 } }
        message="所有生成与强度评估均在本地完成, 密码不会离开设备; 建议长度 ≥ 12 并混合大小写、数字与符号。强度仅为启发式估算, 不能替代权威评估。"
      />
      <Row gutter={ 16 }>
        <Col xs={ 24 } lg={ 11 }>
          <Card size="small" title="生成" style={ { marginBottom: 12 } }>
            <Space direction="vertical" style={ { width: '100%' } }>
              <Space wrap>
                <span style={ { width: 72, textAlign: 'right' } }>长度:</span>
                <div style={ { width: 160 } }>
                  <Slider
                    min={ 4 }
                    max={ 64 }
                    value={ length }
                    onChange={ (v) => setLength(v) }
                  />
                </div>
                <span>{ length }</span>
              </Space>
              <Space wrap>
                <span style={ { width: 72, textAlign: 'right' } }>字符集:</span>
                <Checkbox checked={ upper } onChange={ (e) => setUpper(e.target.checked) }>大写 A-Z</Checkbox>
                <Checkbox checked={ lower } onChange={ (e) => setLower(e.target.checked) }>小写 a-z</Checkbox>
                <Checkbox checked={ digit } onChange={ (e) => setDigit(e.target.checked) }>数字 0-9</Checkbox>
                <Checkbox checked={ symbol } onChange={ (e) => setSymbol(e.target.checked) }>符号 !@#…</Checkbox>
              </Space>
              <Space wrap>
                <span style={ { width: 72, textAlign: 'right' } }>选项:</span>
                <Checkbox checked={ excludeAmbiguous } onChange={ (e) => setExcludeAmbiguous(e.target.checked) }>
                  排除易混淆字符 (IOlo01)
                </Checkbox>
              </Space>
              <Button type="primary" icon={ <ReloadOutlined /> } onClick={ generate }>生成密码</Button>
              <Input.Password
                value={ pw }
                onChange={ (e) => setPw(e.target.value) }
                placeholder="点击上方按钮生成随机密码"
                autoComplete="new-password"
              />
              <Space>
                <Button icon={ <CopyOutlined /> } onClick={ copy } disabled={ !pw }>复制</Button>
                <Button onClick={ () => setPw('') } disabled={ !pw }>清空</Button>
              </Space>
              { strengthHint && (
                <div>
                  当前强度: <Tag color={ strengthHint.color }>{ strengthHint.label }</Tag>
                </div>
              ) }
            </Space>
          </Card>
        </Col>
        <Col xs={ 24 } lg={ 13 }>
          <Card size="small" title="强度检测 (支持手工输入任意密码)">
            <Input.Password
              value={ pw }
              onChange={ (e) => setPw(e.target.value) }
              placeholder="在此输入或粘贴要检测的密码"
              style={ { marginBottom: 12 } }
              autoComplete="new-password"
            />
            <StrengthPanel pw={ pw } />
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default PasswordGenerator;
