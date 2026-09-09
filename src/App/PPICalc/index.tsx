import { Divider, InputNumber, Select, Space, Tag, theme } from 'antd';
import { useMemo, useState } from 'react';
import { calcPpi, SCREEN_PRESETS } from './lib';
import { useLocale } from '../../hook/locale-context';
import { u, uT } from '../ui-lang';

// 结果统计块: 大字数值 + 小字说明 (颜色取自主题, 深浅模式自适应)
const StatBlock = ({ label, value, note, color }: { label: string; value: string; note: string; color: string }) => (
  <div style={ { minWidth: 220 } }>
    <div style={ { fontSize: 13, color: 'rgba(128,128,128,0.9)' } }>{ label }</div>
    <div style={ { fontSize: 30, fontWeight: 600, color, lineHeight: 1.3 } }>{ value }</div>
    <div style={ { fontSize: 12, color: 'rgba(128,128,128,0.75)' } }>{ note }</div>
  </div>
);

// 细项行: 名称 + 值
const MetaRow = ({ label, value }: { label: string; value: string }) => (
  <div style={ { display: 'flex', justifyContent: 'space-between', gap: 16, padding: '4px 0', borderBottom: '1px dashed rgba(128,128,128,0.25)' } }>
    <span>{ label }</span>
    <span style={ { fontWeight: 500 } }>{ value }</span>
  </div>
);

const PPICalc = () => {
  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => uT(locale, zh, v);
  const { token } = theme.useToken();
  // 默认填入常见手机屏 (1080×1920 @ 5.5″)
  const [ widthPx, setWidthPx ] = useState<number | null>(1080);
  const [ heightPx, setHeightPx ] = useState<number | null>(1920);
  const [ diagInch, setDiagInch ] = useState<number | null>(5.5);

  // 当前输入是否匹配某个预设 (选中预设后仍可手动微调, 不匹配时下拉显示为空)
  const presetKey = SCREEN_PRESETS.find(
    (p) => p.widthPx === widthPx && p.heightPx === heightPx && Math.abs(p.diagInch - (diagInch ?? 0)) < 0.01
  )?.key;

  // PPI 计算廉价且同步, 输入变化即重算 (无需按钮)
  const res = useMemo(() => {
    if (widthPx == null || heightPx == null || diagInch == null) return null;
    try {
      return calcPpi({ widthPx, heightPx, diagInch });
    } catch {
      return null;
    }
  }, [ widthPx, heightPx, diagInch ]);

  const invalid = widthPx != null && heightPx != null && diagInch != null && res == null;

  return (
    <div>
      <Space wrap style={ { marginBottom: 4 } }>
        <Tag color="#108ee9">{t('PPI = √(宽² + 高²) ÷ 对角线英寸')}</Tag>
        <Tag color="#ff5500">{t('Pentile 等效 ≈ RGB PPI × √(2/3) ≈ ×0.8165')}</Tag>
        <Tag color="#2db7f5">{t('RGB 排列: 每像素 3 子像素 | Pentile: 2 子像素')}</Tag>
      </Space>

      {/* 常用屏幕预设 */}
      <div style={ { margin: '8px 0' } }>
        <span style={ { marginRight: 8 } }>{t('常用屏幕:')}</span>
        <Select
          showSearch
          placeholder={t('选择常用分辨率 (可手动修改下方数值)')}
          style={ { width: 400 } }
          value={ presetKey }
          optionFilterProp="label"
          options={ SCREEN_PRESETS.map((p) => ({ value: p.key, label: p.label })) }
          onChange={ (key: string) => {
            const p = SCREEN_PRESETS.find((s) => s.key === key);
            if (p) {
              setWidthPx(p.widthPx);
              setHeightPx(p.heightPx);
              setDiagInch(p.diagInch);
            }
          } }
        />
      </div>

      {/* 分辨率 + 尺寸输入 */}
      <div style={ { margin: '6px 0' } }>
        <Space wrap>
          <span>{t('分辨率:')}</span>
          <InputNumber
            addonBefore={t('宽')}
            addonAfter="px"
            min={ 1 }
            max={ 100000 }
            precision={ 0 }
            value={ widthPx }
            onChange={ (v: number | null) => setWidthPx(v) }
          />
          <span style={ { color: 'rgba(128,128,128,0.8)' } }>×</span>
          <InputNumber
            addonBefore={t('高')}
            addonAfter="px"
            min={ 1 }
            max={ 100000 }
            precision={ 0 }
            value={ heightPx }
            onChange={ (v: number | null) => setHeightPx(v) }
          />
          <span>{t('屏幕尺寸:')}</span>
          <InputNumber
            addonAfter={t('英寸')}
            min={ 0.1 }
            max={ 200 }
            precision={ 2 }
            step={ 0.1 }
            value={ diagInch }
            onChange={ (v: number | null) => setDiagInch(v) }
          />
        </Space>
      </div>

      <Divider dashed />

      { invalid && (
        <Tag color="red">{t('请输入有效的分辨率(正整数)与屏幕尺寸(大于 0 英寸)')}</Tag>
      ) }

      { res && (
        <div>
          <div style={ { display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'flex-start' } }>
            <StatBlock
              label={t('标准 RGB 排列 PPI')}
              value={ `${res.ppi}` }
              note={t('每英寸像素 (对角线方向)')}
              color={ token.colorPrimary }
            />
            <StatBlock
              label={t('Pentile 排列等效 PPI')}
              value={ `${res.pentilePpi}` }
              note={t('OLED 菱形排列, 红/蓝子像素共享, 等效 ≈ RGB × 0.8165')}
              color={ '#eb2f96' }
            />
          </div>

          <Divider style={ { margin: '12px 0' } } />

          <div style={ { maxWidth: 460 } }>
            <MetaRow label={t('物理尺寸 (宽 × 高)')} value={ tt('{a} × {b} 英寸', { a: res.widthInch, b: res.heightInch }) } />
            <MetaRow label={t('RGB 子像素密度')} value={ tt('{n} 个/英寸', { n: res.rgbSubpixelPpi }) } />
            <MetaRow label={t('Pentile 子像素密度')} value={ tt('{n} 个/英寸', { n: res.pentileSubpixelPpi }) } />
            <MetaRow label={t('总像素')} value={ tt('{p} ({m} MP)', { p: res.totalPx.toLocaleString(), m: res.megapixel }) } />
            <MetaRow label={t('宽高比')} value={ res.ratio } />
          </div>

          <div style={ { marginTop: 8, fontSize: 12, color: 'rgba(128,128,128,0.75)' } }>
            {t('提示: Pentile (如三星 Diamond 排列) 每个像素仅 2 个子像素, 等效视觉密度约为标准 RGB 的 √(2/3) ≈ 81.65%; 同分辨率下 Pentile 屏的理论细腻度低于 RGB 排列, 厂商常以更高分辨率(如 QHD+)弥补。')}
          </div>
        </div>
      ) }
    </div>
  );
};

export default PPICalc;
