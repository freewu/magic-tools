import { Alert, Button, Card, Checkbox, Col, Input, Progress, Row, Slider, Space, Tag, message, theme } from "antd";
import { useMemo, useState } from "react";
import { CheckCircleFilled, CloseCircleFilled, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from '../../lib';
import { useLocale } from '../../hook/locale-context';
import { u, uT } from '../ui-lang';
import { genPassword, passwordStrength, humanSeconds, STRENGTH_LEVELS } from './lib';

// 强度面板: 进度条 + 估算信息 + 检查明细
const StrengthPanel: React.FC<{ pw: string; t: (zh: string) => string; tt: (zh: string, v?: Record<string, string | number>) => string }> = ({ pw, t, tt }) => {
  const r = useMemo(() => passwordStrength(pw), [pw]);
  const [ notice, contextHolder ] = message.useMessage();
  const { token } = theme.useToken();

  if (pw === '') {
    return (
      <div style={ { color: token.colorTextTertiary, textAlign: 'center', padding: '24px 0' } }>
        {t('输入或生成一个密码后显示强度评估')}
      </div>
    );
  }

  const percent = Math.round((r.score / 4) * 100);
  return (
    <>
      { contextHolder }
      <Space direction="vertical" style={ { width: '100%' } }>
        <Space>
          <span style={ { width: 72, textAlign: 'right' } }>{t('强度:')}</span>
          <Progress
            style={ { width: 220 } }
            percent={ percent }
            strokeColor={ r.level.color }
            format={ () => '' }
          />
          <Tag color={ r.level.color } style={ { marginInlineEnd: 0 } }>{ t(r.level.label) }</Tag>
        </Space>
        <Space wrap>
          <span style={ { width: 72, textAlign: 'right' } }>{t('参考熵:')}</span>
          <span>{ r.entropy >= 120 ? '≥120' : r.entropy.toFixed(1) } bits</span>
          <span style={ { color: token.colorTextSecondary } }>{tt('按每秒 1 万亿次猜测约需 {t}', { t: humanSeconds(r.offlineSec) })}</span>
        </Space>
        <Space wrap>
          <span style={ { width: 72, textAlign: 'right' } }>{t('在线攻击:')}</span>
          <span style={ { color: token.colorTextSecondary } }>{tt('按每秒 1000 次猜测约需 {t}', { t: humanSeconds(r.onlineSec) })}</span>
        </Space>
        <div style={ { color: r.level.color, fontSize: 13 } }>{ t(r.level.desc) }</div>
        <div
          style={ {
            display: 'flex', flexDirection: 'column', gap: 2,
            borderTop: '1px dashed rgba(128,128,128,0.35)', paddingTop: 8,
          } }
        >
          { r.checks.map((c, i) => {
            let cc: { ok: boolean; label: string } = c;
            try {
              if (c.label.indexOf('长度 ') === 0) {
                const n = parseInt(c.label.slice(3), 10);
                cc = { ...c, label: tt('长度 {n} (推荐 ≥12)', { n }) };
              } else if (c.label.indexOf('存在连续 ') === 0) {
                const n = parseInt(c.label.slice(5), 10);
                cc = { ...c, label: tt('存在连续 {n} 个相同字符', { n }) };
              } else {
                cc = { ...c, label: t(c.label) };
              }
            } catch { /* keep zh fallback */ }
            return (
            <div key={ i } style={ { fontSize: 13 } }>
              { c.ok
                ? <CheckCircleFilled style={ { color: '#52c41a', marginRight: 6 } } />
                : <CloseCircleFilled style={ { color: '#ff4d4f', marginRight: 6 } } /> }
              <span style={ { color: c.ok ? token.colorTextSecondary : token.colorText } }>{ cc.label }</span>
            </div>
            );
          }) }
        </div>
      </Space>
    </>
  );
};

const PasswordGenerator = () => {
  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => uT(locale, zh, v);
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
      notice.warning(t('请先生成或输入密码'));
      return;
    }
    await copyTextToClipboard(pw);
    notice.success(t('已复制到剪贴板'));
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
        message={t('所有生成与强度评估均在本地完成, 密码不会离开设备; 建议长度 ≥ 12 并混合大小写、数字与符号。强度仅为启发式估算, 不能替代权威评估。')}
      />
      <Row gutter={ 16 }>
        <Col xs={ 24 } lg={ 11 }>
          <Card size="small" title={t('生成')} style={ { marginBottom: 12 } }>
            <Space direction="vertical" style={ { width: '100%' } }>
              <Space wrap>
                <span style={ { width: 72, textAlign: 'right' } }>{t('长度:')}</span>
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
                <span style={ { width: 72, textAlign: 'right' } }>{t('字符集:')}</span>
                <Checkbox checked={ upper } onChange={ (e) => setUpper(e.target.checked) }>{t('大写 A-Z')}</Checkbox>
                <Checkbox checked={ lower } onChange={ (e) => setLower(e.target.checked) }>{t('小写 a-z')}</Checkbox>
                <Checkbox checked={ digit } onChange={ (e) => setDigit(e.target.checked) }>{t('数字 0-9')}</Checkbox>
                <Checkbox checked={ symbol } onChange={ (e) => setSymbol(e.target.checked) }>{t('符号 !@#…')}</Checkbox>
              </Space>
              <Space wrap>
                <span style={ { width: 72, textAlign: 'right' } }>{t('选项:')}</span>
                <Checkbox checked={ excludeAmbiguous } onChange={ (e) => setExcludeAmbiguous(e.target.checked) }>
                  排除易混淆字符 (IOlo01)
                </Checkbox>
              </Space>
              <Button type="primary" icon={ <ReloadOutlined /> } onClick={ generate }>{t('生成密码')}</Button>
              <Input.Password
                value={ pw }
                onChange={ (e) => setPw(e.target.value) }
                placeholder={t('点击上方按钮生成随机密码')}
                autoComplete="new-password"
              />
              <Space>
                <Button icon={ <CopyOutlined /> } onClick={ copy } disabled={ !pw }>{t('复制')}</Button>
                <Button onClick={ () => setPw('') } disabled={ !pw }>清空</Button>
              </Space>
              { strengthHint && (
                <div>
                  {t('当前强度: ')}<Tag color={ strengthHint.color }>{ t(strengthHint.label) }</Tag>
                </div>
              ) }
            </Space>
          </Card>
        </Col>
        <Col xs={ 24 } lg={ 13 }>
          <Card size="small" title={t('强度检测 (支持手工输入任意密码)')}>
            <Input.Password
              value={ pw }
              onChange={ (e) => setPw(e.target.value) }
              placeholder={t('在此输入或粘贴要检测的密码')}
              style={ { marginBottom: 12 } }
              autoComplete="new-password"
            />
            <StrengthPanel pw={ pw } t={ t } tt={ tt } />
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default PasswordGenerator;
