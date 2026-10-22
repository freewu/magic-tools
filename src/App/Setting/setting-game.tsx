import { Form } from "antd";
import { Game2048Setting } from "../Game2048/setting";
import { TetrisSetting } from "../Tetris/setting";
import { NesEmulatorSetting } from "../NesEmulator/setting";

export const SettingGame = () => {

  return (
    <Form labelCol={{ span: 5 }} wrapperCol={{ span: 18  }} layout="horizontal"  style={{ maxWidth: 800 }}>
      <Game2048Setting />
      <TetrisSetting />
      <NesEmulatorSetting />
    </Form>
  )
}
