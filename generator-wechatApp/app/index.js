var generators = require('yeoman-generator'),
    _ = require('lodash'),
    glob = require('glob'),
    chalk = require('chalk'),
    log = console.log,
    fs = require('fs'),
    del = require('del'),
    Exec = require('child_process').exec,
    generatorName = 'wechatApp';

var isFile = false;

module.exports = generators.Base.extend({
    constructor: function(){
        generators.Base.apply(this, arguments);

        var dirs = glob.sync('+(src)');
        //now _.contains has been abandoned by lodash,use _.includes
        if(_.includes(dirs, 'src')){
            log(chalk.bold.green('资源已经初始化，退出...'));
            setTimeout(function(){
                process.exit(1);
            }, 200);
        }
    },
    // 询问用户创建信息
    prompting: function(){
        var questions = [
            {
                type: 'input',
                name: 'projectID',
                message: '输入项目ID',
                default: 'wechatApp'
            },
            {
                type: 'input',
                name: 'projectName',
                message: '输入项目名称',
                default: '项目标题'
            },
            {
                type: 'input',
                name: 'projectAuthor',
                message: '项目开发者',
                store: true,
                default: 'stenli'
            }
        ]
        return this.prompt(questions).then(
            function(answers){
                for(var item in answers){
                    answers.hasOwnProperty(item) && (this[item] = answers[item]);
                }
            }.bind(this)
        );
    },
    // 拷贝文件，搭建脚手架
    writing: function(){
        // 不在项目环境
        this.projectOutput = './'+this.projectID;
        isFile = fs.existsSync(this.projectOutput);

        if(isFile){
            log('      ====================================');
            log('========= 项目环境无法找到OR项目已存在 ===========');
            log('      ====                           ====');
            log('           ====                ====');
            log('                 ====    ====');
            log('                     ====');

            return false;
        }

        // 活动专题模版解析
        this.directory('./', this.projectOutput);
    },

    // 搭建完执行操作
    end: function(){
        if(isFile){
            return false;
        }
        var _pArr = __dirname.match(/(\S*)generator-wechatApp/)[0].split('\\');
        var _popped = _pArr.pop();
        var dirPath = _pArr.join('\\');

        del([this.projectOutput+'/**/.gitignore',this.projectOutput+'/**/.npmignore',this.projectOutput+'/**/**/.npmignore']);

        console.log('软链接创建中', process.cwd())
        //创建软连接
        var command = `mklink /d ${process.cwd()}\\${this.projectID}\\node_modules ${dirPath}\\common-packages\\${generatorName}\\node_modules`
        console.log(command)
        Exec(command, function(e, stdout, stderr) {
        　　if(!e) {
                console.log('node_modules软链创建成功')
        　　}
        });
    }
})

