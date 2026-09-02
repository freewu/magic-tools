// 帮助页面
import { Layout,Card, Avatar, Space,Row, Col,Timeline } from 'antd';
import { compomentList, developerList, eventList } from "./data"
import "./help.css";

const Help = () => {
  return (
    <Layout style={ { height: '100%', overflowY: "auto" } } >
      <Card title="开发者" className='help-card'>
        <Space>
        {
          developerList.map((item, index) => {
            return (
              <a key={ item.name + index } href={ item.url } target="_blank" title={ item.name } >
                <Avatar size={64} src={ item.avater } />
              </a>  
            );
          })
        }
        </Space>
      </Card>

      <Row>
        <Col span={ 8 }>
          <Card title="使用组件" className='help-card'>
          {
            compomentList.map((item, index) => {
              return (
                <p key={ item.name + index } >
                  <a target="_blank" href={ item.url }>{ item.name }</a>
                </p>   
              );
            })
          }
          </Card>
        </Col>
        <Col span={ 16 }>
          <Card title="开发时间线" className='help-card'>
            <Timeline
              mode={ "left"}
              items={ eventList }
            />
          </Card>
        </Col>
      </Row>

      
    </Layout>
  );
}

export default Help;