# web-simple-deploy

使用方法

```javascript
	const {deploy} = require("web-simple-deploy")
	const config = {
	    script:"npm run aaa",
	    host: "192.168.1.11",
	    port: 22,
	    username: "root",
	    password: "123456",
	    distDir: 'dist',  // 本地打包dist目录
	    clearWebDir:true, // 是否删除服务器上的目录
	    webPath: '/home/www/test',  // 测试环境服务器地址
	}
	deploy(config)
```