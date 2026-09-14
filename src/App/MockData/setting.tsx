import { Divider, Form, Input, InputNumber, Select, Typography } from "antd";
import { useState } from "react";
import { useLocale } from "../../hook/locale-context";
import { row as _r, rowT } from "../Setting/rows-lang";
import { COUNT_MAX, COUNT_MIN, DEFAULT_COUNT, FORMAT_LIST, type MockFormat } from "./data";
import {
  getDefaultCount, getDefaultFormat, getDefaultTable,
  setDefaultCount, setDefaultFormat, setDefaultTable,
} from "./lib";

const { Text } = Typography;

/** 数据生成 设置面板 (设置 → 其它) */
export const MockDataSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const [ format, setFormat ] = useState<MockFormat>(getDefaultFormat()); // 默认输出格式
  const [ table, setTable ] = useState<string>(getDefaultTable()); // 默认表名 (SQL)
  const [ count, setCount ] = useState<number>(getDefaultCount()); // 默认生成数量

  return (
    <>
      <Divider orientation="left" plain>{ st('数据生成') }</Divider>
      <Form.Item label={ st('默认输出格式') }>
        <Select
          value={ format }
          style={ { width: 160 } }
          onChange={ (value: MockFormat) => { setFormat(value); setDefaultFormat(value); } }
          options={ FORMAT_LIST.map((v) => ({ value: v.value, label: v.label })) }
        />
      </Form.Item>
      <Form.Item label={ st('默认表名') } extra={ st('SQL 输出的默认表名, 仅保留字母 / 数字 / 下划线 / $') }>
        <Input
          value={ table }
          style={ { width: 240 } }
          onChange={ (e) => { setTable(e.target.value); setDefaultTable(e.target.value); } }
          onBlur={ () => setTable(getDefaultTable()) }
          placeholder="mock_data"
        />
      </Form.Item>
      <Form.Item label={ st('默认生成数量') }>
        <div style={ { display: 'flex', alignItems: 'center', gap: 12, maxWidth: 520 } }>
          <InputNumber
            min={ COUNT_MIN }
            max={ COUNT_MAX }
            step={ 10 }
            value={ count }
            style={ { flex: 1, minWidth: 0 } }
            onChange={ (value: number | null) => {
              const n = value === null ? DEFAULT_COUNT : value;
              setCount(n);
              setDefaultCount(n);
            } }
          />
          <Text code style={ { fontSize: 12, minWidth: 150, textAlign: 'center' } }>
            { rowT(locale, '${min} - ${max} 条, 默认 ${d}', { min: COUNT_MIN, max: COUNT_MAX, d: DEFAULT_COUNT }) }
          </Text>
        </div>
      </Form.Item>
    </>
  );
};

export default MockDataSetting;
