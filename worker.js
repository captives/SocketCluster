var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');
var AccessControl = require('./sc_module/access-control.js');
var Auth = require('./sc_module/authentication.js');
var Router = require('./sc_module/Router.js');

module.exports.run = function(worker) {
    console.log(" >> Worker PID:", process.pid, worker.id);

    var httpServer = worker.httpServer;
    var scServer = worker.scServer;

    AccessControl.attach(scServer);
    var app = express();
    app.use(Router.attach(express));
    app.use(serveStatic(path.resolve(__dirname, 'public')));
    //app.use(serveStatic(path.resolve(__dirname, 'node_modules/socketcluster-client')));
    httpServer.on('request', app);

    var socketList = {};
    //连接
    scServer.on('connection', function (socket) {
        socketList[socket.id] = socket;
        socket.emit('mark',{time:Date.now(),workerId:worker.id, socketId:socket.id, processId:process.pid});

        Auth.attach(socket);//身份验证的中间件
        scServer.exchange.publish('socketClient',{
            event:'addClient',
            data:{
                client:socket.id,
                address:socket.remoteAddress
            }
        });

        // worker.sendToMaster('发送给主进程消息');
        worker.on('masterMessage',function (json) {
            switch (json.event){
                case 'time':
                    socket.emit('time', json.data);
                    break;
                case 'socket':
                    delete json.event;
                    sendMessage(json);
                    break;
            }
        });

        console.log("服务器socket",socket.id,scServer.clientsCount,Object.keys(scServer.clients).length);
        console.log("client " + socket.id + " has connected # pid=", process.pid);

        //接受广播消息,发送所有聊天通道
        socket.on('broadcast', function (data) {
            console.log('broadcast', data);
        });

        //私聊
        socket.on('chat', function (data) {
            console.log("当前socket订阅的通道数组", socket.subscriptions());
            console.log("scServer.exchange",scServer.exchange.subscriptions());
            scServer.exchange.publish(data.name, data.text);
        });

        var channel = scServer.exchange.subscribe('simplex');
        channel.watch(function (data) {
            console.log('----------- simplex-----------',data);
        });
        /***************************************************************************
         * KMS, WebRTC 视频部分
         ****************************************************************************/
        function sendMessage(message){
            var ws = socketList[message.wid];
            if(ws){
                ws.emit(message.id, message);
            }
        }

        function sendMaster(message){
            message.wid = socket.id;
            worker.sendToMaster(message);
        }

        socket.on('presenter', function (message) {
            message.event = 'presenter';
            sendMaster(message);
        });
        socket.on('viewer', function (message) {
            message.event = 'viewer';
            sendMaster(message);
        });
        socket.on('stop', function () {
            var message = {};
            message.event = 'stop';
            sendMaster(message);
        });
        socket.on('onIceCandidate', function (message) {
            message.event = 'onIceCandidate';
            sendMaster(message);
        });
        socket.on("disconnect", function () {
            var message = {};
            message.event = 'stop';
            sendMaster(message);
            delete socketList[socket.id];
            console.log(socket.id,"-- disconnect");
        });
        /***************************************************************************
        * 系统事件
        ****************************************************************************/
        socket.on('raw', function (data) {
            console.log('------ socket # raw -------',data);
        });

        socket.on('disconnect', function (data) {
            scServer.exchange.publish('socketClient',{
                event:'removeClient',
                data:{
                    client:socket.id,
                    address:socket.remoteAddress
                }
            });
            console.log("Client " + socket.id + " socket has disconnected!");
        });

        //订阅
        socket.on('subscribe', function (name) {
            scServer.exchange.publish('remoteSubscribe',{
                client:socket.id,
                address:socket.remoteAddress,
                names:socket.subscriptions()    //scServer.exchange.subscriptions()
            });
            console.log('------ socket # subscribe -------',name);
        });

        //取消订阅
        socket.on('unsubscribe', function (name) {
            scServer.exchange.publish('remoteSubscribe',{
                client:socket.id,
                address:socket.remoteAddress,
                names:socket.subscriptions()    //scServer.exchange.subscriptions()
            });
            console.log('------ socket # unsubscribe -------',name);
        });

        //失败验证
        socket.on('badAuthToken', function (data) {
            console.log('------ socket # badAuthToken -------',data);
        });

        //消息
        socket.on('message', function (data) {
            //console.log('------ socket # message -------',data);
        });

        //错误
        socket.on('error', function (err) {
            console.error(err);
        });
    });
};