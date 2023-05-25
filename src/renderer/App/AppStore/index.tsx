import { Card, Col, Row } from "antd";
import { appList } from "../index";
import { useNavigate } from "react-router-dom"
// import { MenuUnfoldOutlined, MenuFoldOutlined, AppstoreOutlined, SettingOutlined } from '@ant-design/icons';

const AppStore = () => {
  const navigate = useNavigate();

  const colClick = ( e:any ) => {
    const uri = e.currentTarget.getAttribute('data-uri');
    navigate("/" + uri, { replace: true })
  }

  const handStyle = { cursor: "pointer",margin: "5px 5px 5px 5px;" };

  return (
    <Row gutter={8}>
    {
      appList.map((item, index) => {
        return (
          <Col onClick={ colClick } style={ handStyle } data-uri={ item.key }>
            <Card>
              {/* <MenuUnfoldOutlined /> &nbsp; &nbsp; */}
              { item.label }
            </Card>
          </Col>
        );
      })
    }
    </Row>
  );
}

export default AppStore;