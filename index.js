/**
 * Created by Administrator on 2016/3/14.
 */
var argv = require('minimist')(process.argv.slice(2));
var SocketCluster = require("socketcluster").SocketCluster;
var cpus = require('os').cpus();
var socketCluster = new SocketCluster({
    brokers: Number(argv.b) || 1,
    workers: Number(argv.w) || cpus.length /2,
    port: Number(argv.p) || 3000,
    appName: argv.n || 'example',
    logLevel:2,
    path:'/socketcluster/',
    workerController: __dirname + '/worker.js',
    brokerController: __dirname + '/broker.js',
    crashWorkerOnError: argv['auto-reboot'] != false,
    socketChannelLimit: 1000,
    rebootWorkerOnCrash: true
});

