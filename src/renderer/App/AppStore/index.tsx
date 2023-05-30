import { Space } from "antd";
import { appList } from "../index";
import { useNavigate } from "react-router-dom"
import "./appstore.css"
import Icon from '@ant-design/icons';

const AppStore = () => {
  const navigate = useNavigate();

  const colClick = ( e:any ) => {
    const uri = e.currentTarget.getAttribute('data-uri');
    navigate("/" + uri, { replace: true })
  }

  const handStyle = { cursor: "pointer",margin: "5px 5px 5px 5px;" };

  return (
    <div className="appstore">
    {
      appList.map((item, index) => {
        if ("" == item.icon) {
          return (
            <div className="app" onClick={ colClick } style={ handStyle } data-uri={ item.key }>
              <Space>
                { item.label }
              </Space>
            </div>
          );
        } else {
          return (
            <div className="app" onClick={ colClick } style={ handStyle } data-uri={ item.key }>
              <Space>
                { item.icon }
                { item.label }
              </Space>
            </div>
          );
        }
      })
    }
    </div>
  );
}

export default AppStore;