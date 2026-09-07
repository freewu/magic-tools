
import { appList, genMenuList } from "../index";
import "./appstore.css"
import { default as AppType } from "./app-type";

const AppStore = () => {
  return (
    <div className="appstore" style={ { height: '100%', overflowY: "auto" } }>
    {
      genMenuList(appList).map((parent, index) => {
        return (
          <AppType 
            uri= { parent.key } 
            key= { parent.key + index } 
            name= { parent.name } 
            children={ parent.children }/>
        );
      })
    }
    </div>
  );
}

export default AppStore;
