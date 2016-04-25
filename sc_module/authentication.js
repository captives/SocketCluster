module.exports.attach = function (socket) {
    socket.on('login', function (data, respond) {
        if(data.name && data.room){
            socket.setAuthToken(data);
            respond(null);
        }else{
            respond('error','登录昵称或房间不能为空！');
        }
    });

};