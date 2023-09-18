#!/usr/bin/env node
const fs = require('fs');
const childProcess = require('child_process');
const lineLog = require('single-line-log').stdout;
const { Client } = require("ssh2");
const archiver = require('archiver');
const ora = require('ora');

const conn = new Client();
const projectDir = process.cwd();

const log = {
    success: (...msg) => {
        console.log('\x1B[32m', '✔', ...msg)
    },
    error: (...msg) => {
        console.log('\x1B[31m', '✗', ...msg)
    },
    info: (...msg) => {
        console.log('\x1B[37m', ' ', ...msg)
    }
}

//执行打包程序
const build = async (script) => {
    try {
        childProcess.execSync(script, { cwd: projectDir });
        // spinner.stop();
    } catch (err) {
        log.error(err);
        process.exit(1);
    }
}

const zip = async (zipDir, zipName) => {
    return new Promise((resolve, reject)=>{
        let output = fs.createWriteStream(projectDir+'/'+zipName) // 创建⽂件写⼊流
        const archive = archiver('zip', { zlib: { level: 9 } }) // 设置压缩等级
        output.on('close', () => {
            resolve()
        }).on('error', (err) => {
            reject()
        })
        archive.pipe(output)
        archive.directory(zipDir, false)
        archive.finalize() 
    })
}

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
                console.log("data2",data.toString())
            });
        })
    })
}

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
    if(config && config.script){
        
        const spinner = ora('执行打包中...').start();
        build(config.script);
        spinner.succeed("打包完成")
        spinner.start("开始压缩zip包")
        const distPath = projectDir+'/'+config.distDir;
        const distName = config.distDir+'.zip';
        await zip(distPath, distName);
        spinner.succeed("压缩完成")
        spinner.start("连接服务器")
        conn.on("ready", async () => {
            try {
                spinner.succeed("连接服务器成功")
                spinner.start("上传zip压缩包")
                if(config.clearWebDir){
                    await runcmd("cd "+config.webPath);
                    await runcmd("rm -rf "+config.webPath+"/*");
                }
                await upload(projectDir+'/'+distName,config.webPath+'/'+distName);
                spinner.succeed("上传压缩包成功")
                spinner.start("正在解压缩zip包")
                await runcmd("cd " + config.webPath);
                await runcmd("unzip -q -o " + config.webPath+"/"+distName + " -d "+config.webPath);
                await runcmd("rm -rf "+config.webPath+'/'+distName);
                spinner.succeed("压缩包解压成功")
                spinner.succeed("本次操作完成")
                spinner.stop();
                conn.end();
            } catch (error) {
                console.fail(error ? error : "操作失败！")
                conn.end();
            }
        }).connect(config);
    }
}
