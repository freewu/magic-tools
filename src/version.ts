import config from '../package.json'
console.log(config.version)

// 当前版本
export const getVersion = () :string => {
    return config.version;
} 