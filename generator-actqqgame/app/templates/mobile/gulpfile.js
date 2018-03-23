/**
 * 活动专题构建环境
 * Author: stenli
 */
/*
 * Gulp Plugins
 */
var fs = require('fs');
var path = require('path');

var gulp 		 = require('gulp'),
    sass    = require('gulp-sass'),
    watch      = require('gulp-watch'),
    replace      = require('gulp-replace'),
    imagemin   = require('gulp-imagemin'),
    pngquant   = require('imagemin-pngquant'),
    rename = require('gulp-rename'),
    concatJS = require('gulp-concat'),
    concatCSS = require('gulp-concat-css'),
    minifyCSS = require('gulp-minify-css'),
    browserSync = require('browser-sync'),
    contentIncluder = require('gulp-content-includer'),
    utf8Convert = require('gulp-utf8-convert'),  // 将gbk转换成utf8
    gbkConvert = require('gulp-gbk-convert'),  // 将utf8转换成gbk

    // 雪碧图
    buffer = require('vinyl-buffer'),
    spritesmash = require('gulp-spritesmash'),
    spritesmith = require('gulp.spritesmith');

var paths = {
    root: '.',
    urlPath:'http://ossweb-img.qq.com/images/qqgame/act/'
};

//sass文件监控
gulp.task('watch', function () {
    gulp.watch([paths.root+'/css/*.scss',paths.root+'/images/sprite/*.png'], function(){
        gulp.run('sass'); //实时刷新浏览器
        gulp.run('sprite');
    });
});

// px转rem
function px2rem(arr){
  var remArr = [];
  arr.forEach(function(item, index){
    if(item != undefined) {
      remArr[index] = parseInt(item)/50 + 'rem';
    }
  })
  return remArr;
}

gulp.task('sprite', function () {    
    gulp.src(paths.root + '/images/sprite/*.png')
      .pipe(spritesmith({
        imgName: 'images/sprite.png',
        cssName: 'css/_sprite.scss',
        padding: 2,
        algorithm: 'binary-tree',
        cssTemplate:function(data){
          let arr = [],
              width = data.spritesheet.px.width,
              height = data.spritesheet.px.height,
              url =  data.spritesheet.image
          // console.log(data)
          data.sprites.forEach(function(sprite) {
              var remData = px2rem([width,height,sprite.px.offset_x,sprite.px.offset_y,sprite.px.width,sprite.px.height]);
              console.log(remData)
              arr.push(
                  ".icon-"+sprite.name+
                  "{"+
                      "background: url('"+url+"') "+
                      "no-repeat "+
                      remData[2]+" "+remData[3]+";"+
                      "background-size: "+ remData[0]+" "+remData[1]+";"+
                      "width: "+remData[4]+";"+                       
                      "height: "+remData[5]+";"+
                      "display: inline-block;" +
                  "}\n"
              )
          })
          // return "@fs:108rem;\n"+arr.join("")
          return arr.join("");
        }
      }))
      .pipe(buffer())
      .pipe(spritesmash())
      .pipe(gulp.dest(paths.root+'/'));
});

gulp.task('sass', function(){
    gulp.src(paths.root+'/css/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(paths.root+'/css'))
        .pipe(browserSync.reload({stream:true}));
})

// 启动服务，监听
gulp.task('bs', function() {
    var files = [
        paths.root + '/images/*.+(png|jpg|gif)',
        paths.root + '/css/*.css',
        paths.root + '/*.html'
    ];

    console.log(files)

    browserSync.init(files, {
      // 本地
       server: { 
          baseDir: paths.root + '/',
       }
    });
});

//默认任务监控编译sass
gulp.task('default',['sass', 'sprite'], function(){
  gulp.run('watch'); // 监听项目
  gulp.run('bs'); //实时刷新浏览器  不支持活动专题gbk格式
});

//==============================================================
//移动样式
var pageDev = process.cwd().split('\\').pop();
gulp.task('movecss', function () {
  var cssFile = paths.root + '/css/*.css';
  var outputCssFile = paths.root + '/server/';

  return gulp.src(cssFile)
      .pipe(concatCSS("style.css"))
      //样式内图片地址替换成绝对地址
      .pipe(replace('../images/', paths.urlPath + pageDev + '/'))
      .pipe(minifyCSS({
          advanced: false,//类型：Boolean 默认：true [是否开启高级优化（合并选择器等）]
          compatibility: 'ie7',//保留ie7及以下兼容写法 类型：String 默认：''or'*' [启用兼容模式； 'ie7'：IE7兼容模式，'ie8'：IE8兼容模式，'*'：IE9+兼容模式]
          keepBreaks: true,//类型：Boolean 默认：false [是否保留换行]
          keepSpecialComments: '*'
      }))
      .pipe(gulp.dest(outputCssFile));
});

// 发布模式：图片移动并压缩
gulp.task('moveimg', function () {
  return gulp.src(paths.root +'/images/*.{jpg,gif,png,jpeg,ico}')
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use: [pngquant()]
    }))
    .pipe(gulp.dest(paths.root + '/server/images'));
});

//分离html（替换路径+css内联到页面）
gulp.task('dev',function(){
    console.log('开始移动css,图片');
    gulp.run('movecss');
    gulp.run('moveimg');
    gulp.run('devhtml');
});

// 移动HTML，生成includer, 可选择使用
gulp.task('devhtml', function(){
  gulp.src(paths.root + '/*.html')
    .pipe(contentIncluder({
          includerReg:/<!\-\-include\s+"([^"]+)"\-\->/g,
          deepConcat: true
    }))
   .pipe(replace('utf-8', 'gbk'))
   .pipe(replace('css/',''))
   .pipe(gbkConvert())
   .pipe(gulp.dest(paths.root + '/server/'))
})

// html内嵌
gulp.task('devinlinehtml', function(){
  var readCssStyle = fs.readFileSync(paths.root + '/css/style.css');
  gulp.src(paths.root + '/*.html')
    .pipe(contentIncluder({
          includerReg:/<!\-\-include\s+"([^"]+)"\-\->/g,
          deepConcat: true
    }))
   .pipe(replace('utf-8', 'gbk'))
   .pipe(replace(/<link href="css\/style.css"[^>]*>/, `<style>${readCssStyle}</style>`))
   .pipe(replace('../images/', paths.urlPath + pageDev + '/'))
   .pipe(gbkConvert())
   .pipe(gulp.dest(paths.root + '/server/'))
})

// 将CSS样式内嵌
gulp.task('dev-inline', function () {
  gulp.run('moveimg');
  gulp.run('devinlinehtml');
});

