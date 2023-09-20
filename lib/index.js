
const chalk = require('chalk');
var inquirer = require('inquirer');


//验证参数
const validator = (config) => {
    return new Promise((resolve, reject) => {
        try {
            if(!config || config.toString() !== '[object Object]'){
                console.log('1',!config)
                console.log('2',config.toString() !== '[object Object]')
                throw "请输入配置文件"
            }
            if(!config.host || !config.port){
                throw "请配置服务器地址"
            }
            if(!config.script){
                throw "请配置打包命令"
            }
    
            if(!config.inquirer && (!config.username || !config.password)){
                throw "请配置用户名和密码"
            }
            resolve(config);
        } catch (error) {
            reject(error);
        }
    })
    
}

//填写用户名和密码交互
const question = (config) => {
    return new Promise((resolve, reject) => {
        inquirer.prompt([
            {
                type:"input",
                name:"username",
                message:"请填写登录用户名"
            },
            {
                type:"password",
                name:"password",
                message:"请填写登录密码"
            }
        ])
        .then((answers) => {
            answers.username = answers.username.trim()
            answers.password = answers.password.trim()
            if(answers.username && answers.password){
                let params = Object.assign(config,answers)
                resolve(params);
            }else{
                reject("请输入正确的用户名和密码");
            }
        })
        .catch((error) => {
            reject(error)
        });
    })
}


module.exports = {
    validator:validator,
    question:question
};