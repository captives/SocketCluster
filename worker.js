var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');
module.exports.run = function(worker) {
    console.log(" >> Worker PID:", process.pid);
    var httpServer = worker.httpServer;
    var scServer = worker.scServer;

    var app = express();
    app.use(serveStatic(path.resolve(__dirname, 'public')));
    httpServer.on('request', app);

    var count = 0;
    //连接
    scServer.on('connection', function (socket) {
        console.log("client " + socket.id + " has connected # pid=", process.pid);
        setInterval(function () {
            socket.emit('time',{
                time:Date.now()
            });
        },1000);

        socket.on('sampleClientEvent', function (data) {
            count++;
            console.log('Handled sampleClientEvent', data);
            scServer.exchange.publish('sample', count);
        });


        socket.on('raw', function (data) {
            console.log('------ socket # raw -------',data);
        });

        socket.on('disconnect', function (data) {
            console.log("Client " + socket.id + " socket has disconnected!");
        });

        //订阅
        socket.on('subscribe', function (data) {
            console.log('------ socket # subscribe -------',data);
        });

        //取消订阅
        socket.on('unsubscribe', function (data) {
            console.log('------ socket # unsubscribe -------',data);
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