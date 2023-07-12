import { Tabs, Form, Switch } from "antd";
import { useState } from "react";
import { debounce } from "../../lib";
import "./websocket-client.css"

const WebSocketClient = () => {
  const genSettingFormHeight = () => {
    return (window.innerHeight - 270) + "px";
  };

  const [ height, setHeight ] = useState(genSettingFormHeight()); // 窗口大小高度

  // 窗体大小发生变化,改变窗口大小
  window.addEventListener('resize', debounce(() => { setHeight(genSettingFormHeight()) },100) );

  return (
    <>
      <div style={ { height: height, overflowY: "auto" } } className="msg-box">
        <p className="msg-to">
          <span>2019-01-01 00:00:00</span><br/>
          发送的消息
        </p>
        <p className="msg-from">
          <span>2019-01-01 00:00:00</span><br/>
          收到的消息
        </p>
        <p className="msg-to">
          <span>2019-01-01 00:00:00</span><br/>
          发送的消息
        </p>
        <p className="msg-from">
          <span>2019-01-01 00:00:00</span><br/>
          收到的消息
        </p>
        <p className="msg-to">
          <span>2019-01-01 00:00:00</span><br/>
          发送的消息
        </p>
        <p className="msg-from">
          <span>2019-01-01 00:00:00</span><br/>
          收到的消息
        </p>
        <p className="msg-to">
          <span>2019-01-01 00:00:00</span><br/>
          发送的消息
        </p>
        <p className="msg-from">
          <span>2019-01-01 00:00:00</span><br/>
          收到的消息
        </p>
        <p className="msg-to">
          <span>2019-01-01 00:00:00</span><br/>
          发送的消息
        </p>
        <p className="msg-from">
          <span>2019-01-01 00:00:00</span><br/>
          收到的消息
        </p>
      </div>
      <div  className="msg-input">
        输入框
      </div>
    </>
  );
}

export default WebSocketClient;