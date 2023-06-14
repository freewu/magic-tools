// 帮助页面
import { Layout,Card, Avatar, Space } from 'antd';
import "./help.css";

const Help = () => {

  return (
    <Layout>
      <Card title="开发者" className='help-card'>
        <Space>
          <a href="https://github.com/freewu" target="_blank" title='bluefrog' >
            <Avatar 
              size={64} 
              src="https://www.gravatar.com/avatar/c2bd3e109318983039778c259cc78db890c1b1f93b574a95c76807759c386db9" />
          </a>
        </Space>
      </Card>

      <Card title="使用组件" className='help-card'>
        <p><a target="_blank" href="https://github.com/electron-react-boilerplate/electron-react-boilerplate">Electron React Boilerplate</a></p>   
        <p><a target="_blank" href="https://react.dev/">React 18</a></p>   
        <p><a target="_blank" href="https://www.electronjs.org/">Electron 23</a></p>  
        <p><a target="_blank" href="https://ant.design/">Ant Design 5</a></p>  
        <p><a target="_blank" href="https://github.com/brix/crypto-js">CryptoJS</a></p>  
        <p><a target="_blank" href="https://github.com/dankogai/js-base64">js-base64</a></p>   
        <p><a target="_blank" href="https://github.com/Qix-/color-convert">color-convert</a></p>   
        <p><a target="_blank" href="https://github.com/sql-formatter-org/sql-formatter">SQL Formatter</a></p>   
        <p><a target="_blank" href="https://highlightjs.org/">highlight.js</a></p>   
        <p><a target="_blank" href="github.com/cryptocoinjs/base-x">base-x</a></p>   
        
      </Card>
      
    </Layout>
  );
}

export default Help;