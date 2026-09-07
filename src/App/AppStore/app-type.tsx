import { Divider } from "antd";
import { default as AppItem } from "./app-item";
import type { AppItem as AI } from "../index"

export type AppTypeProps = {
  uri: string, //
  name: string, // 分类纯文本名称
  children?: Array<AI>,
}

const AppType = ({ uri, name, children } :AppTypeProps ) => {
  return (
    <div className="appstore-group">
      <Divider dashed orientation="left" plain className="appstore-group-divider">
        <span className="appstore-group-name">{ name }</span>
        <span className="appstore-group-count">( { children?.length ?? 0 } )</span>
      </Divider>
      {
        children?.map((item,i) => {
          return (
            <AppItem key={ item.key + i }  uri={ item.key } icon={ item.icon } label={ item.label } />
          )
        })
      }
    </div>
  );
}

export default AppType;
