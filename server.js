var argv = require('minimist')(process.argv.slice(2));
var SocketCluster = require("socketcluster").SocketCluster;
var cpus = require('os').cpus();

var socketCluster = new SocketCluster({
    brokers: Number(argv.b) || cpus.length /8,
    workers: Number(argv.w) || cpus.length,
    port: Number(argv.p) || 80,
    appName: argv.n || 'example',
    logLevel:1,
    path:'/socket',
    workerController: __dirname + '/worker.js',
    brokerController: __dirname + '/broker.js',
    crashWorkerOnError: argv['auto-reboot'] != false,
    socketChannelLimit: 1000,
    rebootWorkerOnCrash: false
});

socketCluster.on('ready', function () {
    console.log('socketCluster # ready');
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