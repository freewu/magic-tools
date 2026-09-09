import { Select, Form, Divider } from "antd";
import { useState } from "react";
import { getFormat, setFormat, GZIP_FORMAT_OPTIONS } from "./lib";
import type { GzipFormat } from "./lib";
import { useLocale } from "../../hook/locale-context";
import { row as _r, rowT } from "../Setting/rows-lang";

// 设置页: 编解码分类 -> Gzip 编解码默认展示格式
export const GzipCodecSetting = () => {
  const { locale } = useLocale();
  const st = (zh: string) => _r(locale, zh);
  const [ fmt, setFmt ] = useState<GzipFormat>(getFormat());

  return (
    <>
      <Divider orientation="left" plain>{ st('Gzip 编解码') }</Divider>
      <Form.Item
        label={ st('压缩结果展示格式') }
        tooltip={ st('Gzip 压缩结果默认以哪种格式展示 (Base64 更紧凑, Hex 可读性更好, 解压时两种格式都能自动识别)') }
      >
        <Select
          value={ fmt }
          style={ { width: 180 } }
          onChange={ (v: GzipFormat) => { setFmt(v); setFormat(v); } }
          options={ [ ...GZIP_FORMAT_OPTIONS ] }
        />
      </Form.Item>
    </>
  );
}
