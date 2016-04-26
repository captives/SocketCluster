module.exports.attach = function (socket) {
    socket.on('login', function (data, respond) {
        if(data.name && data.room){
            socket.setAuthToken(data);
            respond(null);
            socket.emit('success',{pid:process.pid});
            //setTimeout(function () {
            //    respond('error',"超时已断开");
            //},1000 * 30);
        }else{
            respond('error','登录昵称或房间不能为空！');
        }

        setTimeout(function () {
            socket.emit('logout',{text:'已超时'});
        }, 1000 * 60 * 60 * 2);//有效期2小时
    });

    socket.once('disconnect', function (data) {
        socket.deauthenticate();//从客户端销毁token
        console.log("Client " + socket.id + " socket has disconnected!");
    });
};