var argv = require('minimist')(process.argv.slice(2));
var SocketCluster = require("socketcluster").SocketCluster;
var cpus = require('os').cpus();

var socketCluster = new SocketCluster({
    brokers: Number(argv.b) || 1,
    workers: Number(argv.w) || 2,
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
