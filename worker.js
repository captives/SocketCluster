var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');
var AccessControl = require('./sc_module/access-control.js');
var Auth = require('./sc_module/authentication.js');
var Router = require('./sc_module/Router.js');
var kms = require('./server/KurentoServer');

module.exports.run = function(worker) {
    console.log(" >> Worker PID:", process.pid);
    kms.init({ws_uri: "ws://121.43.108.40:8888/kurento"});

    var httpServer = worker.httpServer;
    var scServer = worker.scServer;
    
    AccessControl.attach(scServer);
    var app = express();
    app.use(Router.attach(express));
    app.use(serveStatic(path.resolve(__dirname, 'public')));
    //app.use(serveStatic(path.resolve(__dirname, 'node_modules/socketcluster-client')));
    httpServer.on('request', app);
    //连接
    scServer.on('connection', function (socket) {
        Auth.attach(socket);//身份验证的中间件
        scServer.exchange.publish('socketClient',{
            event:'addClient',
            data:{
                client:socket.id,
                address:socket.remoteAddress
            }
        });

        console.log("服务器socket",scServer.clientsCount,Object.keys(scServer.clients).length);
        console.log("client " + socket.id + " has connected # pid=", process.pid);
        var intervalId = setInterval(function () {
            socket.emit('time',{
                time:Date.now(),
                client:Object.keys(scServer.clients).length,
            });
        },1000);

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
            socket.emit(message.id, message);
        }
        socket.on('presenter', function (message) {
            kms.publish(socket.id, message.sdpOffer, sendMessage);
        });
        socket.on('viewer', function (message) {
            kms.subscribe(socket.id, message.sdpOffer, sendMessage);
        });
        socket.on('stop', function () {
            kms.stop(socket.id);
        });
        socket.on('onIceCandidate', function (message) {
            kms.iceCandidate(socket.id, message.candidate);
        });
        socket.on("disconnect", function () {
            kms.stop(socket.id);
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
            clearInterval(intervalId);
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