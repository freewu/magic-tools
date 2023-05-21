## 说明

    一个开发工具集

## 功能

## 开发 & 运行
```
# 初始化项目

    git clone https://github.com/freewu/magic-tools.git
    cd magic-tools
    npm install

# 预览

    npm start

# 打包 

    npm run package
```


## 组件

<a href="https://github.com/electron-react-boilerplate/electron-react-boilerplate">Electron React Boilerplate</a>   
<a href="https://react.dev/">React 18</a>   
<a href="https://www.electronjs.org/">Electron 23</a>  
<a href="https://ant.design/">Ant Design 5</a>  
<a href="https://github.com/brix/crypto-js">CryptoJS</a>  
crypto-js


## Q&A
```
## windows 打包出现下载 winCodeSign / nsis / nsis-resources 出错

    问题:
    Get "https://github.com/electron-userland/electron-builder-binaries/releases/download/nsis-resources-3.4.1/nsis-resources-3.4.1.7z": read tcp xxx.xxx.xxx.xxx:zzz->xxx.xxx.xxx.xxx:443: wsarecv: An existing connection was forcibly closed by the remote host.

    
    解决：
        1 复制链接，手动下载下来
        2 进入目录  C:\Users\<username>\AppData\Local\electron-builder\cache\
        3 把下载的文件解压（整体目录 ）
            winCodeSign-xx.7z 解压到 winCodeSign/winCodeSign-xx
            nsis-xx.7z 解压到 nsis/nsis-xx
            nsis-resources-xx.7z 解压到 nsis/nsis-resources-xx
        4 重新执行打包命令 npn run package

```