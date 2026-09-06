import { Select, Form, Divider } from "antd";
import { useState } from "react";
import { getFormat, setFormat, GZIP_FORMAT_OPTIONS } from "./lib";
import type { GzipFormat } from "./lib";

// 设置页: 编解码分类 -> Gzip 编解码默认展示格式
export const GzipCodecSetting = () => {
  const [ fmt, setFmt ] = useState<GzipFormat>(getFormat());

  return (
    <>
      <Divider orientation="left" plain>Gzip 编解码</Divider>
      <Form.Item
        label="压缩结果展示格式"
        tooltip="Gzip 压缩结果默认以哪种格式展示 (Base64 更紧凑, Hex 可读性更好, 解压时两种格式都能自动识别)"
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
