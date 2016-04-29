var EventEmitter = require('events').EventEmitter;
function WebServer(sc) {
    this.scServer = sc;
}

WebServer.prototype = new EventEmitter();

WebServer.prototype.init = function (ws) {
    var that = this;
    console.log("socket connected pid:",process.pid);
    ws.emit('success', {pid:process.pid});
    ws.on("open", function () {
        console.log(ws.id,"--open");
    });

    var interval = setInterval(function () {
        ws.emit('time', {time:Date.now()});
    }, 1000);

    ws.on("disconnect", function () {
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
    return sc.webServer;
};