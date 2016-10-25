// 加载File System读写模块
var fs = require('fs');

function FileUtils(){

}

/**
 * 写文件
 * @param file  待写的文件
 * @param text  待写的文件内容
 */
exports.writeFile = function(file,text){
    // appendFile，如果文件不存在，会自动创建新文件
    // 如果用writeFile，那么会删除旧文件，直接写新文件
    fs.appendFile(file, text, function(err){
        if(err)
            console.log("fail " + err);
        else
            console.log("写入文件ok");
    });
};

/**
 * 读取文件
 * @param file
 */
exports.readFile = function(file){
    fs.readFile(file,"utf-8", function(err, data){
        if(err)
            console.log("读取文件fail " + err);
        else{
            // 读取成功时
            console.log(data);
        }
    });
};

//监视文件
exports.watchFile = function(file){
    fs.watchFile(file, {interval: 20}, function (curr, prev) {
            console.log(curr,prev);
           if(Date.parse(prev.ctime) == 0) {
               console.log('文件被创建!');
            } else if(Date.parse(curr.ctime) == 0) {
               console.log('文件被删除!')
            } else if(Date.parse(curr.mtime) != Date.parse(prev.mtime)) {
               console.log('文件有修改');
            }
        });

    fs.watchFile(file,{persistent:true}, function (curr, prev) {
        console.log('这是第二个watch,监视到文件有修改');
    });
};

//取消文件的监视
exports.unwatchFile = function(file,listen){
    fs.unwatchFile(file,listen);
};


exports.createDir = createDir;
exports.createDirTree = createDirTree;
function createDirTree(dirs,callback){
    //var dirs = path.split("/");
    var i = 0;
    var dir = dirs[0];
    createDir(dir,createSuccess);
    function createSuccess(error){
        if(!error){
            i++;
            if( i < dirs.length){
                dir = dir + "/" + dirs[i];
                createDir(dir,createSuccess);
            }else{
                //目录创建结束
                callback(dir);
            }
        }
    }
};

function createDir(dir,callback){
    fs.exists(dir, function (exists) {
        if(!exists){
            fs.mkdir(dir, function (err) {
                callback(err);
            });
        }else{
            callback();
        }
    });
}
