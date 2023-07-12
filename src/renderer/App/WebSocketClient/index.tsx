import { Space,Input,Row,Col,Select,Button,Divider } from "antd";
const { TextArea } = Input;
import { useState } from "react";
import { debounce } from "../../lib";
import "./websocket-client.css"
import { arrayToOptions } from "../../lib/array"
import { codeList } from "./data"

const WebSocketClient = () => {

  const genSettingFormHeight = () => {
    return (window.innerHeight - 270) + "px";
  };

  const [ height, setHeight ] = useState(genSettingFormHeight()); // 窗口大小高度

  // 窗体大小发生变化,改变窗口大小
  window.addEventListener('resize', debounce(() => { setHeight(genSettingFormHeight()) },100) );

  const [ outputFormat, setOutputFormat ] = useState("String"); // 输出格式
  const [ inputFormat, setInputFormat ] = useState("String"); // 输入格式
  const [ url, setUrl ] = useState(""); // 连接

  return (
    <>
      <div style={ { height: height, overflowY: "auto" } } className="msg-box">
        <p>
          <div className="msg-to">
            <span>2019-01-01 00:00:00</span><br/>
            发送的消息
          </div>
        </p>
        <p>
          <div className="msg-from">
            <span>2019-01-01 00:00:00</span><br/>
            收到的消息
          </div>
        </p>
        <p>
          <div className="msg-to">
            <span>2019-01-01 00:00:00</span><br/>
            发送的消息
          </div>
        </p>
        <p>
          <div className="msg-from">
            <span>2019-01-01 00:00:00</span><br/>
            收到的消息
          </div>
        </p>
        <p>
          <div className="msg-to">
            <span>2019-01-01 00:00:00</span><br/>
            发送的消息
          </div>
        </p>
        <p>
          <div className="msg-from">
            <span>2019-01-01 00:00:00</span><br/>
            收到的消息
          </div>
        </p>
        <p>
          <div className="msg-to">
            <span>2019-01-01 00:00:00</span><br/>
            发送的消息
          </div>
        </p>
        <p>
          <div className="msg-from">
            <span>2019-01-01 00:00:00</span><br/>
            收到的消息
          </div>
        </p>

      </div>
      <div  className="msg-input">
        <Divider plain dashed />
        <Space>
          <label>输入编码:</label>
          <Select
            value={ inputFormat }
            style={{ width: 80 }}
            onChange={ (v :string) => { setInputFormat(v) } }
            options={ arrayToOptions(codeList) }
          />
          <label>输出编码:</label>
          <Select
            value={ outputFormat }
            style={{ width: 80 }}
            onChange={ (v :string) => { setOutputFormat(v) } }
            options={ arrayToOptions(codeList) }
          />
          <Input
            allowClear
            placeholder="ws://localhost:8086/ws"
            // status={ passphraseStatus }
            style={ { width: 340 } }
            onChange={ (e :React.ChangeEvent<HTMLInputElement>) => { setUrl(e.target.value.trim()) } }
            value= { url } />
          <Button 
            // onClick={ decode }
            style={ {"backgroundColor" : "#28a745","color": "#fff" }} 
          >连接</Button>
          <Button 
            onClick={ () => {  } }
            style={ {"backgroundColor" : "#dc3545","color": "#fff" }} 
          >清除</Button>
        </Space>
        <TextArea
          style={ { margin: "5px 0 5px 0" }}
          // onDoubleClick={ textareaDoubleClick }
          // onChange={ (e) => { setEncodeValue(e.target.value) } }
          title="回车发送信息"
          // value= { encodeValue }
          placeholder="输入需要发送内容或拖拽文件到框内打开,回车发送"
          autoSize={{ minRows: 4, maxRows: 4 }}
          // onDragOver={ (e) => { e.preventDefault(); } } // 必须加上，否则无法触发下面的方法
          // onDrop={ (e) => { e.preventDefault(); openFile(e.dataTransfer.files, setEncodeValue ); } }
        />
      </div>
    </>
  );
}

export default WebSocketClient;