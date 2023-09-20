# web-simple-deploy

安装

```javascript
npm install web-simple-deploy --save-dev
```
在根目录下架创建文件`deploy.config.js`，如下内容

```javascript
const {deploy} = require("web-simple-deploy")

const config = {
    script:"npm run build", //必填 打包执行命令 npm run build
    host: "192.168.1.11", //必填 服务器ip地址
    port: 22, //必填 端口一般为22
    inquirer:true, //开启后通过将提问输入用户名和密码
    //或者
    username: "root", //用户名
    password: "123456", //密码

    distDir: 'dist',  //必填 本地打包的dist目录
    clearWebDir:false, // 开启后将在上传前清空服务器上的目录，请先测试路径填写正确再开启，以免误删内容
    webPath: '/home/www/test',  //必填 测试环境服务器地址
}

deploy(config)
```
在`package.json`文件的script添加命令，打包时运行`npm run deploy`即可

```javascript
    "scripts": {
        "deploy": "node deploy.config.js"
    }
```