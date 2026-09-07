import { useEffect, useState } from "react";
import { Divider, Button, Table, message, Tag } from "antd";
import { keyLabel, locationNameOf, modsText, formatDuration, clockText } from "./lib";
import "./keyboard.css";

type PressInfo = {
  key :string;
  code :string;
  keyCode :number;
  locationName :string;
  mods :string;
  downAt :number;
  repeat :number;
};

type LockState = { caps :boolean; num :boolean; scroll :boolean };

type HistoryRow = {
  id :number;
  ts :number;
  key :string;
  code :string;
  keyCode :number;
  locationName :string;
  mods :string;
  duration :string;
};

const KeyboardKeyInfo = () => {
  const [ press, setPress ] = useState<PressInfo | null>(null);
  const [ locks, setLocks ] = useState<LockState>({ caps: false, num: false, scroll: false });
  const [ history, setHistory ] = useState<Array<HistoryRow>>([]);
  const [ tick, setTick ] = useState(0); // 驱动按住时长的实时刷新

  useEffect(() => {
    const readLocks = (e :KeyboardEvent) => setLocks({
      caps: e.getModifierState('CapsLock'),
      num: e.getModifierState('NumLock'),
      scroll: e.getModifierState('ScrollLock'),
    });

    const onDown = (e :KeyboardEvent) => {
      readLocks(e);
      if(e.repeat) {
        setPress((p) => (p ? { ...p, repeat: p.repeat + 1 } : p));
        return;
      }
      setPress({
        key: e.key,
        code: e.code,
        keyCode: e.keyCode,
        locationName: locationNameOf(e.location),
        mods: modsText({ ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey, meta: e.metaKey }),
        downAt: Date.now(),
        repeat: 0,
      });
    };

    const onUp = (e :KeyboardEvent) => {
      readLocks(e);
      setPress((p) => {
        if(!p) return p;
        // 匹配 code (存在) 或 key (空格/字符兜底), 未抬起前松开则也结束
        const hit = (p.code !== '' && p.code === e.code) || p.key === e.key;
        if(!hit) return p;
        const dur = Date.now() - p.downAt;
        const row :HistoryRow = {
          id: p.downAt,
          ts: Date.now(),
          key: keyLabel(p.key),
          code: p.code || '(无 code)',
          keyCode: p.keyCode,
          locationName: p.locationName,
          mods: p.mods,
          duration: formatDuration(dur),
        };
        setHistory((h) => [ row, ...h ].slice(0, 50));
        return null;
      });
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  // 按住期间每 500ms 刷新一次时长
  useEffect(() => {
    if(!press) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 500);
    return () => window.clearInterval(id);
  }, [ press ]);

  const pressDuration = press ? Date.now() - press.downAt : 0;

  const lockItems = [
    { key: 'caps' as const, label: 'CapsLock', on: locks.caps },
    { key: 'num' as const, label: 'NumLock', on: locks.num },
    { key: 'scroll' as const, label: 'ScrollLock', on: locks.scroll },
  ];

  const columns = [
    { title: '时间', dataIndex: 'ts', width: 84, render: (v :number) => clockText(v) },
    { title: '按键', dataIndex: 'key', width: 150 },
    { title: 'Code', dataIndex: 'code', width: 130 },
    { title: 'keyCode', dataIndex: 'keyCode', width: 84 },
    { title: '位置', dataIndex: 'locationName', width: 84 },
    { title: '修饰键', dataIndex: 'mods', width: 110 },
    { title: '时长', dataIndex: 'duration', width: 96 },
  ];

  return (
    <div>
      <div className="kb-hint">
        按键信息会实时捕获: 无需聚焦本页面, 在应用任意位置按下/松开键盘即可看到结果。
      </div>

      <div className="kb-stage">
        <div className="kb-key">{ press ? keyLabel(press.key) : '?' }</div>
        <div className="kb-sub">{ press ? `${press.code} · keyCode ${press.keyCode}` : '按任意键查看按键信息…' }</div>
        { press && (
          <div className="kb-chips">
            <Tag color="blue">位置: { press.locationName }</Tag>
            <Tag color="geekblue">修饰键: { press.mods }</Tag>
            <Tag color="purple">按住: { formatDuration(pressDuration) }</Tag>
            { press.repeat > 0 && <Tag color="orange">自动重复 ×{ press.repeat }</Tag> }
          </div>
        ) }
      </div>

      <div className="kb-lock-row">
        { lockItems.map((item) => (
          <span key={ item.key } className={ `kb-lock-item${ item.on ? ' on' : '' }` }>
            <i className={ `kb-dot${ item.on ? ' on' : '' }` } />{ item.label }
          </span>
        )) }
        <span className="kb-lock-tip">(按键时同步刷新; 修饰键组合见上方 Tag)</span>
      </div>

      <Divider dashed>最近按键记录</Divider>

      <Button
        style={ { marginBottom: 8, backgroundColor: '#dc3545', color: '#fff' } }
        onClick={ () => setHistory([]) }
      >清空记录</Button>

      <Table
        rowKey="id"
        size="small"
        columns={ columns }
        dataSource={ history }
        pagination={ false }
        scroll={ { y: 320 } }
      />
    </div>
  );
}

export default KeyboardKeyInfo;
