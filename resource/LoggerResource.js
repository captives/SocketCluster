//var log4js = require('log4js');
//log4js.configure({
//    appenders:[
//        {
//            type:'console'
//        },
//        {
//            type:'dateFile',
//            filename:'logs/server_log_',
//            pattern: "yyMMdd_hh.log",//_hh_mm_ss
//            alwaysIncludePattern: true
//        }],
//    replaceConsole : true
//});
//
//module.exports.logger = function(name){
//    var log = log4js.getLogger(name);
//    log.debug("Some debug messages");
//    return log;
//};

module.exports = Debug;

var FileResource = require('./../resource/FileResource');
// 加载File System读写模块
var fs = require('fs');

function Debug(){
    this.record = false;
    this.path = "/";
    this.fileName = "";
    this.includeTime = false;
}

Debug.prototype.print = function (){
    this.trace("[PRINT]", arguments);
};

Debug.prototype.info = function (){
    this.trace("[LOG]", arguments);
};

Debug.prototype.error = function (){
    this.trace("[ERROR]", arguments);
};

Debug.prototype.warn = function (){
    this.trace("[WARN]", arguments);
};

Debug.prototype.trace = function(level, arguments){
    var that = this;
    var arr = [level];
    for(var i in arguments){
        arr.push(arguments[i]);
    }

    var text = arr.join(" ");
    FileResource.createDirTree(this.path.split("/"),function(err){
        if(that.includeTime){
            var date = new Date();
            var time = formatTime(date);
            writeFile(time + " " + text);
        }else{
            writeFile(text);
        }
    });

    function writeFile(text){
        var name = that.path +"/" + that.fileName;
       fs.appendFile(name, text + "\r\n", function(err){
           if(err){
               console.log(err);
           //}else{
           //    console.log(name,text);
           }
       });
    }

    function formatTime(date){
        var h = date.getHours();
        var m = date.getMinutes();
        if(m<10){
           m = "0" + m;
        }
        var s = date.getSeconds();
        if(s<10){
            s = "0" + s;
        }

        var ms = date.getMilliseconds();
        if(ms < 100){
            if(ms < 10){
                ms = "00"+ ms;
            }else{
                ms = "0"+ ms;
            }
        }
      return  h + ":" + m + ":" + s + "." + ms;
    }
};