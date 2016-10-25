var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');
var AccessControl = require('./sc_module/access-control.js');
var Auth = require('./sc_module/authentication.js');
var Router = require('./sc_module/Router.js');
var WebServer = require('./server/SocketClusterWebServer');
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

    var webServer = new WebServer();
    //连接
    scServer.on('connection', function (socket) {
        Auth.attach(socket);//身份验证的中间件
        webServer.init(socket);

        webServer.on('message',function (message) {
            sendMaster(message.event, message.data);
        });

        socket.emit('mark',{time:Date.now(),workerId:worker.id, socketId:socket.id, processId:process.pid});
        scServer.exchange.publish('socketClient',{
            event:'addClient',
            data:{
                client:socket.id,
                address:socket.remoteAddress
            }
        });

        function masterMessageHandler(json) {
            console.log('masterMessage  --|--',socket.id, worker.id, process.pid, JSON.stringify(json));
            switch (json.event){
                case 'time':
                    socket.emit('time', json.data);
                    break;
                case 'info'://发送消息管理类
                    sendMessage(json.wid, json.data);
                    break;
            }
        };
        //监听主进程消息
        worker.on('masterMessage',masterMessageHandler);


        console.log("服务器socket",socket.id,scServer.clientsCount,Object.keys(scServer.clients).length);
        console.log("client " + socket.id + " has connected # pid=", process.pid);

        //接受广播消息,发送所有聊天通道
        socket.on('broadcast', function (data) {
            console.log('broadcast', data);
        });

        var channel = scServer.exchange.subscribe('simplex');
        channel.watch(function (data) {
            console.log('----------- simplex-----------',data);
        });

        /***************************************************************************
         * KMS, WebRTC 视频部分
         ****************************************************************************/
        // function sendMessage(wid, message){
        //     var ws = socketList[wid];
        //     if(ws){
        //         ws.emit(message.id, message);
        //     }
        // }

        //发送信息到主进程
        function sendMaster(event, message){
            worker.sendToMaster({event:event, wid:socket.id, data:message});
        }

        /***************************************************************************
        * 系统事件
        ****************************************************************************/
        socket.on('raw', function (data) {
            console.log('------ socket # raw -------',data);
        });

        socket.on('disconnect', function (data) {
            //移除监听主进程消息
            worker.off('masterMessage',masterMessageHandler);


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