'use strict';
// loader-utils可以解析webpack配置文件中loader传入的参数
const loaderUtils = require('loader-utils'),
    path = require('path'),
    fs = require('fs');

module.exports = function(source) { // source是字符串，包含静态资源的文件内容
    // webpack2 默认使用缓存，启动webpack-dev-server时，只热更新被修改的模块
    // 如果你想要禁止缓存功能，只要传入fasle参数即可
    // this.cacheable(false);  

    const params = loaderUtils.parseQuery(this.query),
        callback = this.async(); // 异步解析模块
    if (typeof params === "object") {
        // 添加个人签名
        if (params.signStr && typeof params.signStr === "string") {
            source = '<!-- ' + params.signStr + ' -->\n' + source;
        }
        // 自动替换掉敏感词汇
        if (params.dataPath && typeof params.dataPath === "string") {
            let dataPath = path.resolve(params.dataPath);  // 转换为绝对路径
            this.addDependency(dataPath); // 添加依赖关系，当文件修改时会被webpack检测到

            
            // 异步读取敏感词汇的json文件
            fs.readFile(dataPath, 'utf-8', function(err, text){
                if(err) {
                    console.error('数据文件路径出错', params.dataPath, '找不到该文件');
                    return callback(err, source);
                }
                let data = JSON.parse(text),
                    regexRule='(';

                for (let value in data) {
                    regexRule += data[value]+'|';
                }
                regexRule = regexRule.slice(0, -1) + ')';

                let regex = new RegExp(regexRule, 'g'); // 正则替换
                source = source.replace(regex, '');
                callback(null, source); // 异步回调处理结果
            });
        }else{
            callback({error: 'dataPath is not legal'}, source);
        }
        // console.log(source);
    }
};
