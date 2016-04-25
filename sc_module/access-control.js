module.exports.attach = function (scServer) {
    //握手
    scServer.addMiddleware(scServer.MIDDLEWARE_HANDSHAKE, function (req, next) {
        console.log('middleware_handshake', req.remoteAddress,req.headers);
        if(req.headers.host == "192.168.10.31"){
            console.log("拒绝连接", process.pid);
            req.socket.emit('logout',{text:"黑名单用户,不能登录"});
        }else{
            next();
        }
    });

    //订阅
    scServer.addMiddleware(scServer.MIDDLEWARE_SUBSCRIBE, function (req, next) {
        console.log('middleware_subscribe',req.socket.id, req.channel, req.data);
        next();
    });

    //发布
    scServer.addMiddleware(scServer.MIDDLEWARE_PUBLISH_IN, function (req, next) {
        console.log('middleware_publish_in',req.socket.id);
        next();
    });

    //发布
    scServer.addMiddleware(scServer.MIDDLEWARE_PUBLISH_OUT, function (req, next) {
        console.log('middleware_publish_out',req.socket.id);
        next();
    });

    //事件派发
    scServer.addMiddleware(scServer.MIDDLEWARE_EMIT, function (req, next) {
        console.log('middleware_emit',req.socket.id, req.event, req.data);
        next();
    });

    //错误
    scServer.on('error', function (err) {
        console.log('------ scServer # error -------',err);
    });

    //通知
    scServer.on('notice', function () {
        console.log('------ scServer # notice -------');
    });

    //握手
    scServer.on('handshake', function () {
        console.log('------ scServer # handshake -------');
    });

    //认证失败
    scServer.on('badSocketAuthToken', function () {
        console.log('------ scServer # badSocketAuthToken -------');
    });
};