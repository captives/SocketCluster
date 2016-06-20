var EventEmitter = require('events').EventEmitter;
var ks = require('./KurentoServer');

function WebServer(sc) {
    this.scServer = sc;
}

WebServer.prototype = new EventEmitter();

WebServer.prototype.init = function (ws) {
    var that = this;
    console.log("socket connected pid:",process.pid);
    function sendMessage(message){
        ws.send(JSON.stringify(message));
    }

    ws.emit('success', {pid:process.pid});
    ws.on("open", function () {
        console.log(ws.id,"--open");
    });

    var interval = setInterval(function () {
        ws.emit('time', {time:Date.now()});
    }, 1000);

    /*********************** video *************************/
    ws.on('presenter', function (message) {
        ks.publish(ws.id, message.sdpOffer, sendMessage);
    });
    ws.on('viewer', function (message) {
        ks.subscribe(ws.id, message.sdpOffer, sendMessage);
    });
    ws.on('stop', function () {
        ks.stop(ws.id);
    });
    ws.on('onIceCandidate', function (message) {
        ks.iceCandidate(ws.id, message.candidate);
    });
    ws.on("disconnect", function () {
        ks.stop(ws.id);
        clearInterval(interval);
        console.log(ws.id,"-- disconnect");
    });
};

module.exports.attach = function (sc) {
    sc.webServer = new WebServer(sc);
    sc.on('connection', function (ws) {
       //Auth.attach(sc, ws);
       this.webServer.init(ws);
    });

    //kms server
    ks.init({ws_uri: "ws://121.43.108.40:8888/kurento"});
    return sc.webServer;
};