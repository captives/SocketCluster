var colorCodes = {
    red: 31,//红色
    green: 32,//绿色
    yellow: 33,//黄色
    blue: 34,//蓝色
    pink: 35,//粉红
    cyan: 36,//青色
    gray: 37,//灰色
};
function colorText (message, color) {
    if (colorCodes[color]) {
        return '\033[0;' + colorCodes[color] + 'm' + message + '\033[0m';
    } else if (color) {
        return '\033[' + color + 'm' + message + '\033[0m';
    }
    return message;
};

//console.log(colorText("[body]","red"));
//console.log(colorText("[body]","green"));
//console.log(colorText("[body]","yellow"));
//console.log(colorText("[body]","blue"));
//console.log(colorText("[body]","pink"));
//console.log(colorText("[body]","cyan"));
//console.log(colorText("[body]","gray"));
//for (var i=30; i<50;i++){
//    console.log("\u001b[0;"+i+"m[body "+i+"]\u001b[0m");
//}