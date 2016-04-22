var express = require('express');
var path = require("path");
var http = require('http');
var socketClusterServer = require('socketcluster-server');
var app = express();
app.use(express.static(path.join(__dirname, 'public')));
var httpServer = http.createServer(app);

var scServer = socketClusterServer.attach(httpServer);
console.log("listen port:80",process.pid);
scServer.on('connection', function (ws) {
    console.log(ws.id);
    ws.on("message",function(message){
        console.log("message",ws.id,message);
       // ws.send(message);
    });

    ws.on("close",function(){
        console.log("---- close ----");
    });

    ws.on("error",function(e){
        console.log("---- error ----",e);
    });
    // ... Handle new socket connections here
});

httpServer.listen(80);