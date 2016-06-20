var argv = require('minimist')(process.argv.slice(2));
var SocketCluster = require("socketcluster").SocketCluster;
var kms = require('./server/KurentoServer');
var cpus = require('os').cpus();
var fs = require("fs");

var socketCluster = new SocketCluster({
    brokers: Number(argv.b) || cpus.length % 3,
    workers: Number(argv.w) || cpus.length % 3,
    port: Number(argv.p) || 443,
    appName: argv.n || 'example',
    logLevel:1,
    path:'/socketcluster',
    wsEngine: 'wss',
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
    console.log('SocketCluster startup success');
    console.log("Open your browser to access %s://localhost:%s", options.protocol, options.port);
    console.log("Client connection %s://localhost:%s%s",options.wsEngine, options.port, options.path);
    // kms.init({ws_uri: "ws://121.43.108.40:8888/kurento"});
});

socketCluster.on('fail', function (data) {
    console.log('socketCluster # fail',data);
});

socketCluster.on('worker', function (data) {
    console.log('socketCluster # worker',data);
});

socketCluster.on('workerMessage', function (data) {
    console.log('socketCluster # workerMessage',data);
});

socketCluster.on('brokerMessage', function (data) {
    console.log('socketCluster # brokerMessage',data);
});

/**
var socketCluster2 = new SocketCluster({
    brokers: Number(argv.b) || cpus.length,
    workers: Number(argv.w) || cpus.length,
    balancers: Number(argv.b) || 1,
    stores: Number(argv.s) || 1,
    port: Number(argv.p) || 3000,
    appName: argv.n || 'example2',
    logLevel:1,
    path:'/socket',
    workerController: __dirname + '/worker.js',
    brokerController: __dirname + '/broker.js',
    balancerController: __dirname + '/balancer.js',
    storeController: __dirname + '/store.js',
    crashWorkerOnError: argv['auto-reboot'] != false,
    socketChannelLimit: 1000,
    rebootWorkerOnCrash: false
});
**/