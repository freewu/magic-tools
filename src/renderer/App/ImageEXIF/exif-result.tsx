import { Form, Input, Divider, Space, Row, Col } from "antd";

export const EXIFResult = ({ data } :EXIFResultProps) => {

  return (
    <Row wrap>
      <Col span={8}>
        <Divider dashed plain>EXIF 信息</Divider>
      </Col>
      <Col span={8}>
        <Divider dashed plain>Tiff 相关</Divider>
      </Col>
      <Col span={8}>
        <Divider dashed plain>GPS 相关</Divider>
      </Col>
    </Row>
  )
}


export type EXIFResultProps = {
  data: any
};