// import Ripemd from "crypto-api/src/hasher/ripemd";
// import {  } from "";
// import {  } from "crypto-api/src/encoder/utf";



/*
ts直接引用没有@types(ts声明文件)的js文件包，会报错（找不到目标模块）；原因就是因为没有声明文件的JS模块会隐式的获得any类型，不符合ts的类型检查。

解决方案：
    1.(推荐)那就直接 const xx:any = require('package') 当js来写，弹警告就屏蔽警告；
    2.或者自己写声明文件xxx.d.ts（仅限目标模块是自己写的情况，xxx必须和目标文件同名）
    3.没有types不能import, 也就是ts不能用import引入js模块;
*/
// const Ripemd:any = require('@/crypto-api/src/hasher/ripemd.mjs');
// const { toHex } = require("@/crypto-api/src/encoder/hex")
// const { fromUtf }= require('@/crypto-api/src/encoder/utf');

// console.log(Ripemd);
// console.log(toHex);
// console.log(fromUtf);

// export const Ripemd160 = (msg :string) :string => {
//     let hasher = new Ripemd();
//     hasher.update(fromUtf(msg));
//     return toHex(hasher.finalize());
// }
