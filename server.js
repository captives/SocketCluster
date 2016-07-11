var argv = require('minimist')(process.argv.slice(2));
var SocketCluster = require("socketcluster").SocketCluster;
var KurentoServer = require('./server/KurentoServerManager');
var cpus = require('os').cpus();
var fs = require("fs");

var kms = new KurentoServer();
var socketCluster = new SocketCluster({
    brokers: Number(argv.b) || cpus.length ,//% 4,
    workers: Number(argv.w) || cpus.length ,//% 4,
    port: Number(argv.p) || 443,
    host: argv.h || 'localhost',
    appName: argv.n || 'example',
    logLevel:1,
    path:'/socketcluster',
    wsEngine: 'ws',
    workerController: __dirname + '/worker.js',
    brokerController: __dirname + '/broker.js',
    crashWorkerOnError: argv['auto-reboot'] != false,
    socketChannelLimit: 1000,
    rebootWorkerOnCrash: false,
    protocol:"https",
    protocolOptions: {
        key:  fs.readFileSync('keys/server.key'),
        cert: fs.readFileSync('keys/server.crt'),
        passphrase: 'passphase4privkey'
    }
});

socketCluster.on('ready', function (data) {
    var options = socketCluster.options;
    // console.log('SocketCluster startup success',options);
    console.log("Open your browser to access %s://localhost:%s", options.protocol, options.port);
    console.log("Client connection %s://localhost:%s%s",options.wsEngine, options.port, options.path);
    kms.init({ws_uri: "ws://192.168.10.10:8866/kurento"});
    var intervalId = setInterval(function () {
        var data = {
            event:'time',
            data:{
                time:Date.now()
            }
        };
        var workers = socketCluster.options.workers;
        for(var id = 0; id < workers; id++){
            socketCluster.sendToWorker(id, data);
        }
    },1000);
});

socketCluster.on('fail', function (data) {
    console.log('socketCluster # fail',data);
});

socketCluster.on('worker', function (data) {
    console.log('socketCluster # worker',data);
});

socketCluster.on('workerMessage', function (workerId, data) {
    workerManager(workerId, data);
    var workers = socketCluster.options.workers;
    for(var id = 0; id < workers; id++){
        socketCluster.sendToWorker(id, data);
    }
    console.log('socketCluster # workerMessage',workerId, JSON.stringify(data));
});

socketCluster.on('brokerMessage', function (brokerId, data) {
    var brokers = socketCluster.options.brokers;
    // for(var id = 0; id < brokers; id++){
    //     socketCluster.sendToBroker(id, data);
    // }
    console.log('socketCluster # brokerMessage', brokerId, data);
});

function workerManager(workerId, json) {
    if(json.event){
        switch (json.event){
            case 'presenter':
                kms.publish(json.wid, json.sdpOffer, function (message) {
                    message.event = 'socket';
                    message.wid = json.wid;
                    socketCluster.sendToWorker(workerId, message);
                });
                break;
            case 'viewer':
                kms.subscribe(json.wid, json.sdpOffer, function (message) {
                    message.event = 'socket';
                    message.wid = json.wid;
                    socketCluster.sendToWorker(workerId, message);
                });
                break;
            case 'onIceCandidate':
                kms.iceCandidate(json.wid, json.candidate);
                break;
            case 'stop':
                kms.stop(json.wid);
                break;
            default:
                console.log('workerManager',workerId,JSON.stringify(json));
                break;
        }
    }
};