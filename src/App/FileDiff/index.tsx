import { Button, Divider, Empty, Space, Typography, message } from 'antd';
import {
  ClearOutlined,
  FileTextOutlined,
  SwapOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useMemo, useRef, useState } from 'react';
import { decodeText, diffText } from './lib';
import { useLocale } from '../../hook/locale-context';
import { u, uT } from '../ui-lang';
import type { DiffRow, DiffResult } from './lib';
import './filediff.css';

const { Text } = Typography;

interface FileState {
  name: string;
  text: string;
}

type Side = 'a' | 'b';

const RENDER_LIMIT = 2000; // 超过此行数截断渲染 (避免巨量 DOM)

const DiffCell = ({ row, side }: { row: DiffRow; side: Side }) => {
  const line = side === 'a' ? row.a : row.b;
  if (!line) return <td className="diff-cell diff-empty" />;
  return (
    <td className={ `diff-cell diff-${line.kind}` }>
      <span className="diff-no">{ line.n }</span>
      <span className="diff-code">{ line.text === '' ? '\u00a0' : line.text }</span>
    </td>
  );
};

const FileDiff = () => {
  const { locale } = useLocale();
  const t = (zh: string) => u(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => uT(locale, zh, v);
  const [ fileA, setFileA ] = useState<FileState | null>(null);
  const [ fileB, setFileB ] = useState<FileState | null>(null);
  const [ dragSide, setDragSide ] = useState<Side | null>(null);
  const [ notice, contextHolder ] = message.useMessage();
  const inputARef = useRef<HTMLInputElement | null>(null);
  const inputBRef = useRef<HTMLInputElement | null>(null);

  const readFile = async (side: Side, file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const text = decodeText(buf);
      const set = side === 'a' ? setFileA : setFileB;
      set({ name: file.name, text });
      notice.success(tt('已载入 {s}侧文件: {name} ({n} 行)', { s: t(side === 'a' ? '左' : '右'), name: file.name, n: text.split('\n').length }));
    } catch (err) {
      notice.error(tt('读取文件失败: {m}', { m: (err as Error).message }));
    }
  };

  const onInputChange = (side: Side) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void readFile(side, f);
    e.target.value = '';
  };

  const dropZone = (side: Side) => ({
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setDragSide(side); },
    onDragLeave: () => setDragSide((s) => (s === side ? null : s)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragSide(null);
      const f = e.dataTransfer.files?.[0];
      if (f) void readFile(side, f);
    },
    onClick: () => (side === 'a' ? inputARef.current?.click() : inputBRef.current?.click()),
  });

  const diff: DiffResult | null = useMemo(
    () => (fileA && fileB ? diffText(fileA.text, fileB.text) : null),
    [ fileA, fileB ],
  );

  const rows = diff?.rows ?? [];
  const renderRows = rows.slice(0, RENDER_LIMIT);

  const sameCount = rows.filter((r) => r.a && r.b).length;

  const swap = () => {
    setFileA(fileB);
    setFileB(fileA);
  };
  const clearAll = () => {
    setFileA(null);
    setFileB(null);
  };

  const zone = (side: Side, state: FileState | null, active: boolean) => (
    <div
      className={ `diff-zone${active && dragSide === side ? ' diff-drag' : ''}${state ? ' diff-zone-filled' : ''}` }
      { ...dropZone(side) }
    >
      { state ? (
        <div className="diff-zone-info">
          <FileTextOutlined style={ { marginRight: 6, color: '#1677ff' } } />
          <span className="diff-filename">{ state.name }</span>
          <span className="diff-filemeta">{ tt('{n} 行 · {s} KB', { n: state.text.split('\n').length, s: (state.text.length / 1024).toFixed(1) }) }</span>
        </div>
      ) : (
        <div className="diff-zone-empty">
          <UploadOutlined style={ { fontSize: 20, display: 'block', marginBottom: 6 } } />
          {t('点击选择文件，或将文件拖到此处')}
        </div>
      ) }
      { active && (
        <div className="diff-zone-side-tag">{ side === 'a' ? t('左文件 (被比较基准)') : t('右文件 (待比较)') }</div>
      ) }
    </div>
  );

  const status = diff ? (
    <Space size="large" style={ { marginBottom: 8 } }>
      <Text type="secondary" style={ { fontSize: 12 } }>
        { tt('{n} 行相同', { n: sameCount }) }
      </Text>
      <Text style={ { fontSize: 12, color: '#cf1322' } }>{ tt('{n} 行仅左侧有', { n: diff.delCount }) }</Text>
      <Text style={ { fontSize: 12, color: '#389e0d' } }>{ tt('{n} 行仅右侧有', { n: diff.insCount }) }</Text>
      { diff.truncated && <Text type="warning" style={ { fontSize: 12 } }>{t('文本超长已截断比较前 4000 行')}</Text> }
    </Space>
  ) : null;

  return (
    <div>
      {contextHolder}
      <Space wrap style={ { marginBottom: 10 } }>
        <Button
          icon={ <FileTextOutlined /> }
          style={ { backgroundColor: '#1677ff', color: '#fff' } }
          onClick={ () => inputARef.current?.click() }
        >{t('选择左侧文件')}</Button>
        <Button
          icon={ <FileTextOutlined /> }
          style={ { backgroundColor: '#389e0d', color: '#fff' } }
          onClick={ () => inputBRef.current?.click() }
        >{t('选择右侧文件')}</Button>
        <Button icon={ <SwapOutlined /> } onClick={ swap } disabled={ !fileA && !fileB }>{t('交换左右')}</Button>
        <Button icon={ <ClearOutlined /> } onClick={ clearAll } disabled={ !fileA && !fileB }>{t('清除')}</Button>
        <input ref={ inputARef } type="file" style={ { display: 'none' } } onChange={ onInputChange('a') } />
        <input ref={ inputBRef } type="file" style={ { display: 'none' } } onChange={ onInputChange('b') } />
      </Space>

      <div className="diff-zones">
        { zone('a', fileA, true) }
        { zone('b', fileB, true) }
      </div>

      <Divider dashed style={ { margin: '10px 0' } } />
      { status }

      { rows.length === 0 ? (
        <Empty
          style={ { marginTop: 60 } }
          description={t('在左右区域各载入一个文件 (点击选择 / 拖拽), 自动按行 diff, 左侧红色 = 删除行, 右侧绿色 = 新增行')}
        />
      ) : (
        <div className="diff-table-wrap">
          <table className="diff-table">
            <thead>
              <tr>
                <th className="diff-th diff-th-a">← { fileA?.name ?? t('左侧文件') } {t('(删除行红色)')}</th>
                <th className="diff-th diff-th-b">{ fileB?.name ?? t('右侧文件') } {t('(新增行绿色)')} →</th>
              </tr>
            </thead>
            <tbody>
              { renderRows.map((row, i) => (
                <tr key={ i }>
                  <DiffCell row={ row } side="a" />
                  <DiffCell row={ row } side="b" />
                </tr>
              )) }
            </tbody>
          </table>
          { rows.length > RENDER_LIMIT && (
            <div className="diff-more">{ tt('共 {n} 个 diff 行, 仅渲染前 {m} 行', { n: rows.length, m: RENDER_LIMIT }) }</div>
          ) }
        </div>
      ) }
    </div>
  );
};

export default FileDiff;
