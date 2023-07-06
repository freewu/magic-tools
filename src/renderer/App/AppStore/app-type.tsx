
import { Divider } from "antd";
import { default as AppItem,AppItemProps } from "./app-item";
import type { AppItem as AI} from "../index"

export type AppTypeProps = {
  uri: string, // 
  icon: any,
  label: string,
  children?: Array<AI>,
}

const AppType = ({ uri, label, icon, children } :AppTypeProps ) => {
  return (
    <>
    <Divider dashed  orientation="left" plain>{ label + ' ( ' + children?.length + ' )' }</Divider>
    {
      children?.map((item,i) => {
        return (
          <AppItem key={ item.key + i }  uri={ item.key } icon={ item.icon } label={ item.label } />
        )
      })
    }
    </>
  );
}

export default AppType;