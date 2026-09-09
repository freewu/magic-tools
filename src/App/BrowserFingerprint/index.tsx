import { Alert, Button, Card, Collapse, Row, Col, Space, Spin, Tag, Typography, message } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useState } from 'react';
import { useLocale } from "../../hook/locale-context";
import { wm, wmT } from "../webmaster-lang";
import { runAllFingerprints, FINGERPRINT_CODE, FP_KIND_LABEL } from './lib';
import type { FpKind, FpResult } from './lib';

const { Text, Paragraph } = Typography;

const KIND_ORDER: FpKind[] = ['canvas', 'webgl', 'audio'];

const KIND_DESC: Record<FpKind, string> = {
  canvas: '浏览器将文字/图形光栅化后各平台抗锯齿与字体渲染存在细微差异，同一脚本在不同设备输出的像素不同——这是区分度最高的指纹之一。',
  webgl: '通过 GPU 渲染上下文读取显卡厂商与渲染器标识（可被隐私模式伪装），并结合支持的扩展数量与渲染参数生成指纹。',
  audio: '利用 OfflineAudioContext 离线合成音频信号，各浏览器的音频处理管线（重采样、压缩器实现）会让输出样本产生微小但稳定的差异。',
};


const BrowserFingerprint: React.FC = () => {
  const { locale } = useLocale();
  const t = (zh: string) => wm(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => wmT(locale, zh, v);
  const [results, setResults] = useState<Partial<Record<FpKind, FpResult>>>({});
  const [busy, setBusy] = useState(false);

  const doCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(t('已复制'));
    } catch {
      message.error(t('复制失败, 请手动选择复制'));
    }
  };

  const compute = useCallback(async () => {
    setBusy(true);
    try {
      setResults(await runAllFingerprints());
    } catch (e) {
      message.error(tt('计算失败: {msg}', { msg: e instanceof Error ? e.message : String(e) }));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    compute();
  }, [compute]);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message={t('浏览器指纹')}
        description={
          <>
            {t('在本页分别计算 ')}<Text strong>{t('Canvas / WebGL / 音频')}</Text>{t(' 三类指纹并给出对应的可直接复制的 JS 实现。')}
            {t('指纹常用于无感设备识别：同机不同浏览器、同浏览器不同版本、隐身模式等都可能产生不同哈希。')}
            <br />
            <Text type="warning">{t('隐私提示:')}</Text>{' '}{t('请勿在未告知用户的站点中擅自采集并跨站关联指纹，合规用途请先取得用户同意。')}
          </>
        }
      />
      <Card
        size="small"
        title={t('运行结果')}
        extra={
          <Button size="small" icon={<ReloadOutlined />} loading={busy} onClick={compute}>{t('重新计算全部')}</Button>
        }
      >
        <Spin spinning={busy}>
          <Row gutter={[12, 12]}>
            {KIND_ORDER.map((kind) => {
              const r = results[kind];
              return (
                <Col xs={24} xl={8} key={kind}>
                  <Card
                    size="small"
                    title={t(FP_KIND_LABEL[kind])}
                    extra={r?.value ? <Button size="small" type="link" icon={<CopyOutlined />} onClick={() => doCopy(r.value!)}>{t('复制')}</Button> : null}
                    style={{ height: '100%' }}
                  >
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                      {r ? (
                        r.reason ? (
                          <Alert type="warning" showIcon message={t('不可用')} description={r.reason} />
                        ) : (
                          <>
                            <Space size={6}>
                              <Text code style={{ fontSize: 14 }}>{r.value}</Text>
                              <Tag color="green">{t('已生成')}</Tag>
                            </Space>
                            {r.detail && <Text type="secondary" style={{ fontSize: 12 }}>{r.detail}</Text>}
                          </>
                        )
                      ) : (
                        <Text type="secondary">{t('计算中…')}</Text>
                      )}
                      <Paragraph type="secondary" style={{ fontSize: 12, margin: 0 }}>
                        {t(KIND_DESC[kind])}
                      </Paragraph>
                      <Collapse
                        ghost
                        size="small"
                        items={[{
                          key: 'js',
                          label: t('查看 JS 实现'),
                          children: (
                            <Space direction="vertical" size={8} style={{ width: '100%' }}>
                              <Button size="small" icon={<CopyOutlined />} onClick={() => doCopy(FINGERPRINT_CODE[kind])}>{t('复制完整代码')}</Button>
                              <pre style={{ margin: 0, maxHeight: 300, overflow: 'auto', fontSize: 12, lineHeight: 1.5 }}>
                                <code>{FINGERPRINT_CODE[kind]}</code>
                              </pre>
                            </Space>
                          ),
                        }]}
                      />
                    </Space>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Spin>
      </Card>
      <Alert
        type="warning"
        showIcon
        message={t('指纹稳定性说明')}
        description={t('三类指纹相加（含 UA、语言、时区、屏幕分辨率等）即构成强标识；WebGL 渲染器与音频指纹在部分系统升级/驱动更新后会变化，Canvas 指纹则相对稳定。本页计算的哈希仅作特征演示，不采集、不存储、不上传任何数据。')}
      />
    </Space>
  );
};

export default BrowserFingerprint;
