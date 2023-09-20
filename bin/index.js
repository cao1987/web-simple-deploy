#!/usr/bin/env node
const fs = require('fs');
const childProcess = require('child_process');
const { Client } = require("ssh2");
const archiver = require('archiver');
const ora = require('ora');
const chalk = require('chalk')

const {validator,question} = require("../lib/index")

const conn = new Client();
const projectDir = process.cwd();



//连接服务器
const connect = (params) => {
    return new Promise((resolve, reject) => {
        conn.on("ready", async () => {
            resolve()
        }).on("error",(error) => {
            reject("服务器连接失败，请检查登录配置",error);
        }).connect(params);
    })
}

//执行打包
const build = async (script) => {
    return new Promise((resolve, reject) => {
        try {
            childProcess.execSync(script, { cwd: projectDir });
            resolve()
        } catch (err) {
            reject(err)
        }
    })
    
}

//压缩打包文件夹
const zip = async (zipDir, zipName) => {
    return new Promise((resolve, reject)=>{
        let output = fs.createWriteStream(projectDir+'/'+zipName) // 创建⽂件写⼊流
        const archive = archiver('zip', { zlib: { level: 9 } }) // 设置压缩等级
        output.on('close', () => {
            resolve()
        }).on('error', (err) => {
            reject(err)
        })
        archive.pipe(output)
        archive.directory(zipDir, false)
        archive.finalize() 
    })
}

//执行命令行
const runcmd = (cmd) => {
    return new Promise((resolve, reject)=>{
        conn.exec(cmd,(err, stream) => {
            if(err){
                reject(err)
            }
            stream.on('close', function(err){
                if(err){
                    reject(err)
                }else{
                    resolve();
                }
            }).on('data', function(data){
                
            }).stderr.on('data', function(data) {
                reject(data.toString())
            });
        })
    })
}

//上传文件
const upload = (distPath,webPath) => {
    return new Promise((resolve, reject)=>{
        conn.sftp((err, sftp) => {
            sftp.fastPut(distPath, webPath, (err, result) => {
                if(err){
                    reject()
                }else{
                    resolve()
                }
            });
        })
    })
}


exports.deploy = async (config) => {
    let spinner;
    try {
        //验证参数
        config = await validator(config);

        //判断是否需要填写密码交互
        if(config.inquirer){
            config = await question(config)
        }

        //执行打包程序
        spinner = ora().start("执行打包中...");
        await build(config.script);
        spinner.succeed("打包完成");

        //压缩文件夹
        spinner.start("开始压缩zip包")
        const distPath = projectDir+'/'+config.distDir;
        const distName = config.distDir+'.zip';
        await zip(distPath, distName);
        spinner.succeed("压缩完成")


        //连接服务器
        spinner.start("连接服务器")
        await connect(config);
        spinner.succeed("连接服务器成功")

        //上传文件
        spinner.start("上传文件")
        if(config.clearWebDir){
            //如果需要清空目录执行
            await runcmd("cd "+config.webPath);
            await runcmd("rm -rf "+config.webPath+"/*");
        }
        await upload(projectDir+'/'+distName,config.webPath+'/'+distName);
        spinner.succeed("上传压缩包成功")

        //解压并覆盖
        spinner.start("正在解压文件")
        await runcmd("cd " + config.webPath);
        await runcmd("unzip -q -o " + config.webPath+"/"+distName + " -d "+config.webPath);
        await runcmd("rm -rf "+config.webPath+'/'+distName);
        spinner.succeed("文件解压成功")

        //完成 
        spinner.succeed("本次操作完成")
        spinner.stop();
        conn.end();

    } catch (error) {
        error = typeof error === 'string' ? error : "执行失败"
        console.log(chalk.red(error))
        if(spinner){
            spinner.stop();
        }
        conn.end();
        process.exit(1);
    }

}
