var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');
var AccessControl = require('./sc_module/access-control.js');
var Auth = require('./sc_module/authentication.js');

module.exports.run = function(worker) {
    console.log(" >> Worker PID:", process.pid);
    var httpServer = worker.httpServer;
    var scServer = worker.scServer;
    AccessControl.attach(scServer);
    var app = express();
    app.use(serveStatic(path.resolve(__dirname, 'public')));
    httpServer.on('request', app);

    //实例通道数名称集合
    var channels = [];
    var count = 0;
    //连接
    scServer.on('connection', function (socket) {
        Auth.attach(socket);//身份验证的中间件

        console.log("client " + socket.id + " has connected # pid=", process.pid);
        setInterval(function () {
            socket.emit('time',{
                time:Date.now(),
                client:Object.keys(scServer.clients).length,
            });
        },1000);

        socket.emit('success',{pid:process.pid});
        //接受广播消息,发送所有聊天通道
        socket.on('broadcast', function (data) {
            count++;
            console.log('Handled sampleClientEvent', data);
            for(var i in channels){
                console.log(channels[i]);
                scServer.exchange.publish(channels[i], data.text);
            }
        });

        //私聊
        socket.on('chat', function (data) {
            scServer.exchange.publish(data.name, data.text);
        });

        socket.on('raw', function (data) {
            console.log('------ socket # raw -------',data);
        });

        socket.on('disconnect', function (data) {
            socket.deauthenticate();//从客户端销毁token
            console.log("Client " + socket.id + " socket has disconnected!");
        });

        //订阅
        socket.on('subscribe', function (name) {
            if(channels.indexOf(name) == -1){
                channels.push(name);
            }
            console.log('------ socket # subscribe -------',name);
        });

        //取消订阅
        socket.on('unsubscribe', function (name) {
            var i = channels.indexOf(name);
            if(i != -1){
                channels.splice(i, 1);
            }
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