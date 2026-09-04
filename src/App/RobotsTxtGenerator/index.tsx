import { Button, Divider, Input, InputNumber, message, Select, Space } from 'antd';
import { useState } from 'react';
import { CopyOutlined, DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from '../../lib';
import { saveTextFile } from '../../lib/tauri';
import {
  buildRobotsTxt,
  newRuleId,
  ROBOTS_PRESETS,
  ROBOTS_USER_AGENTS,
  type RobotsRule,
} from './lib';
import RobotsIntro from './intro';

const { TextArea } = Input;

const RobotsTxtGenerator = () => {

  const [ userAgent, setUserAgent ] = useState('*'); // 爬虫
  const [ rules, setRules ] = useState<Array<RobotsRule>>([
    { id: newRuleId(), kind: 'disallow', path: '/admin/' },
  ]); // 规则行
  const [ sitemaps, setSitemaps ] = useState(''); // sitemap (每行一个)
  const [ crawlDelay, setCrawlDelay ] = useState<number | null>(null); // 抓取间隔
  const [ notice, contextHolder ] = message.useMessage();

  // 组装内容 (出错时在下方展示原因)
  let preview = '';
  let buildError = '';
  try {
    const sitemapList = sitemaps.split('\n').map((v) => v.trim()).filter((v) => v !== '');
    preview = buildRobotsTxt({ userAgent, rules, sitemaps: sitemapList, crawlDelay });
  } catch (err) {
    buildError = (err as Error).message;
  }

  // 更新某行规则
  const updateRule = (id: string, patch: Partial<RobotsRule>) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  // 删除某行规则
  const removeRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  // 添加规则行
  const addRule = (kind: 'allow' | 'disallow') => {
    setRules([...rules, { id: newRuleId(), kind, path: kind === 'disallow' ? '/private/' : '/public/' }]);
  };

  // 应用预设
  const applyPreset = (index: number) => {
    const p = ROBOTS_PRESETS[index];
    setUserAgent(p.userAgent);
    setRules(p.rules.map((r) => ({ ...r, id: newRuleId() })));
    setCrawlDelay(p.crawlDelay);
  };

  // 复制
  const copyPreview = () => {
    if (preview === '') return;
    copyTextToClipboard(preview);
    notice.success('复制到粘贴板成功!!!');
  };

  // 保存 robots.txt
  const saveFile = async () => {
    if (preview === '') return;
    const ok = await saveTextFile('robots.txt', preview, '保存 robots.txt 文件');
    if (ok) notice.success('已保存 robots.txt 文件');
  };

  return (
    <div>
      {contextHolder}

      <Space direction="vertical" style={ { width: '100%', maxWidth: 640 } } size={ 10 }>

        {/* 爬虫 */}
        <div style={ { display: 'flex', alignItems: 'center', gap: 12 } }>
          <span style={ { width: 110, textAlign: 'right', color: '#666' } }>爬虫 User-agent</span>
          <Select
            style={ { width: 240 } }
            value={ userAgent }
            onChange={ setUserAgent }
            options={ ROBOTS_USER_AGENTS.map((v) => ({ value: v.value, label: v.label })) }
          />
          <span style={ { color: '#999', fontSize: 12 } }>为不同爬虫分组时, 请按此页生成多次再合并</span>
        </div>

        {/* 规则行 */}
        <div>
          <div style={ { display: 'flex', alignItems: 'center', gap: 12 } }>
            <span style={ { width: 110, textAlign: 'right', color: '#666' } }>抓取规则</span>
            <Button icon={ <PlusOutlined /> } onClick={ () => { addRule('disallow'); } }>禁止 (Disallow)</Button>
            <Button icon={ <PlusOutlined /> } onClick={ () => { addRule('allow'); } }>允许 (Allow)</Button>
            <Button size="small" type="link" onClick={ () => { setRules([]); } }>清空规则</Button>
          </div>
          <div style={ { marginTop: 6, marginLeft: 122 } }>
            { rules.map((r) => (
              <Space.Compact key={ r.id } style={ { display: 'flex', marginBottom: 6 } }>
                <Select
                  style={ { width: 110 } }
                  value={ r.kind }
                  onChange={ (v) => { updateRule(r.id, { kind: v }); } }
                  options={ [
                    { value: 'disallow', label: '禁止' },
                    { value: 'allow', label: '允许' },
                  ] }
                />
                <Input
                  value={ r.path }
                  placeholder="路径, 如 /admin/"
                  onChange={ (e) => { updateRule(r.id, { path: e.target.value }); } }
                />
                <Button
                  danger
                  type="text"
                  icon={ <DeleteOutlined /> }
                  onClick={ () => { removeRule(r.id); } }
                />
              </Space.Compact>
            )) }
            { rules.length === 0 && (
              <div style={ { color: '#999' } }>当前无规则 = 允许爬虫抓取全部页面 (等效放行)</div>
            ) }
          </div>
        </div>

        {/* 抓取间隔 + Sitemap */}
        <div style={ { display: 'flex', alignItems: 'center', gap: 12 } }>
          <span style={ { width: 110, textAlign: 'right', color: '#666' } }>Crawl-delay</span>
          <InputNumber
            min={ 0 }
            max={ 3600 }
            precision={ 0 }
            value={ crawlDelay }
            placeholder="秒"
            onChange={ (v) => { setCrawlDelay(v); } }
          />
          <span style={ { color: '#999', fontSize: 12 } }>抓取间隔秒数 (留空不输出; 部分爬虫不支持)</span>
        </div>
        <div style={ { display: 'flex', alignItems: 'center', gap: 12 } }>
          <span style={ { width: 110, textAlign: 'right', color: '#666' } }>Sitemap</span>
          <TextArea
            value={ sitemaps }
            placeholder="每行一个 Sitemap 地址, 如 https://example.com/sitemap.xml"
            autoSize={ { minRows: 1, maxRows: 3 } }
            onChange={ (e) => { setSitemaps(e.target.value); } }
          />
        </div>

        {/* 预设 */}
        <div style={ { display: 'flex', alignItems: 'center', gap: 12 } }>
          <span style={ { width: 110, textAlign: 'right', color: '#666' } }>快捷模板</span>
          { ROBOTS_PRESETS.map((p, i) => (
            <Button key={ p.name } size="small" onClick={ () => { applyPreset(i); } }>{ p.name }</Button>
          )) }
        </div>

        {/* 预览 */}
        <div>
          <div style={ { color: '#666', marginBottom: 4 } }>预览</div>
          <TextArea
            readOnly
            value={ preview }
            autoSize={ { minRows: 5, maxRows: 12 } }
            style={ { fontFamily: 'Consolas, Menlo, monospace', fontSize: 13 } }
            title="双击复制内容到粘贴板"
            onDoubleClick={ (e) => {
              if ((e.target as HTMLTextAreaElement).value.trim() !== '') copyPreview();
            } }
          />
          { buildError !== '' && <div style={ { color: '#ff4d4f', marginTop: 6 } }>{ buildError }</div> }
        </div>

        {/* 操作按钮 */}
        <Space>
          <Button
            disabled={ preview === '' }
            icon={ <CopyOutlined /> }
            onClick={ copyPreview }
          >复制</Button>
          <Button
            disabled={ preview === '' }
            style={ { backgroundColor: '#28a745', color: '#fff' } }
            icon={ <SaveOutlined /> }
            onClick={ saveFile }
          >保存为 robots.txt</Button>
        </Space>
      </Space>

      <Divider>robots.txt 生成说明</Divider>

      <RobotsIntro />
    </div>
  );
}

export default RobotsTxtGenerator;
