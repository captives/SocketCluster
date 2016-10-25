var util = require('util');
var EventEmitter = require('events').EventEmitter;

var Logger = require('./../resource/LoggerResource');
function Remote(){
    this.logger = new Logger();
};

Remote.prototype = new EventEmitter();

/**
 * 已经登陆的客户端列表
 * @param ws
 * @param data      已经登陆的客户端数据
 */
Remote.prototype.repEnter = function(ws,data){
    var data = {
        eventName : 'repEnter',
        data : data
    };

    this.call(ws, data);
};

/**
 * 指定的Socket下线通知
 * @param ws
 * @param id       已登陆的id
 * @param time     已登陆的时间
 * @param type     已登陆的客户端类型
 */
Remote.prototype.offLine = function(ws, id, time, type, info){
    var data = {
        eventName : 'offline',
        data : {
            id:id, time:time, type:type, info:info
        }
    };
    this.call(ws, data);
};

/**
 * 用户进入
 * @param ws
 * @param id
 * @param userdata
 * @param type
 * @param time
 */
Remote.prototype.userEnter = function(ws,id,userdata,type,time){
    var data = {
        eventName : 'userEnter',
        data : {
            time : time,
            id : id,
            type:type,
            userdata : userdata
        }
    };

    this.call(ws, data);
};

/**
 * 用户退出
 * @param ws
 * @param id
 * @param userdata
 * @param time
 */
Remote.prototype.userQuit = function(ws,id,userdata,time){
    var data ={
        'eventName':'userQuit',
        'data':{
            id:id,
            'time':time,
            'userdata':userdata
        }
    };
    this.call(ws, data);
};

/**
 * 登陆成功
 * @param ws
 * @param room
 * @param list
 * @param user
 * @param time
 */
Remote.prototype.enterSuccess = function(ws, room, list, user, time){
    var data = {
        eventName: 'enterSuccess',
        data : {
            id : ws.id,
            time : time,
            room : room,
            list : list,
            userdata : user
        }
    };

    this.call(ws, data);
};

/**
 * 连接拒绝
 * @param ws
 * @param room
 * @param time
 */
Remote.prototype.enterReject = function(ws,room,time,text){
    var data = {
        eventName: 'enterReject',
        data : {
            id : ws.id,
            time : time,
            room : room,
            text : text
        }
    };

    this.call(ws, data);
};

Remote.prototype.sendIceCandidate = function (ws, id, label, candidate) {
    var data = {
        eventName: 'icecandidate',
        data : {
            id : id,
            label : label,
            candidate : candidate
        }
    };

    this.call(ws, data);
};

Remote.prototype.sendOffer = function (ws, id, sdp) {
    var data = {
        eventName: 'offer',
        data : {
            id : id,
            sdp : sdp
        }
    };

    this.call(ws, data);
};

Remote.prototype.sendAnswer = function (ws, id, sdp) {
    var data = {
        eventName: 'answer',
        data : {
            id : id,
            sdp : sdp
        }
    };

    this.call(ws, data);
};

Remote.prototype.sending = function(ws, message, userdata, time){
    var data = {
        eventName : 'share',
        data : {
            time : time,
            userdata : userdata,
            message : message
        }
    };

    this.call(ws, data);
};
//****************************************
//
//
//
//****************************************
/***
 * 在指定的WebSocket对象上发送数据
 * @param ws        事件源WebSocket对象
 * @param data      事件消息
 */
Remote.prototype.call = function(ws,data){
    //console.log(ws.id, data);
    var that = this;
    ws.send(JSON.stringify(data), function(error){
       that.emit("error", error, ws.id);
    });


    //去除共享事件中的鼠标事件日志
    if(data.eventName ==="share"){
        var result = data.data;
        if(result.message) {
            if (result.message.action != "6") {
                this.debug("接收",data.eventName,ws,result);
            }
        }else{
            this.debug("接收",data.eventName,ws,result);
        }
    }
};

Remote.prototype.debug = function(info,type,ws,data){
    var user = ws.userdata;
    this.logger.includeTime = true;
    this.logger.path = "logs/" + ws.room;
    this.logger.fileName = user.userType + "_" + user.userId + "_" + user.userName + ".log";
    if(typeof(data) == "object"){
        this.logger.info(info,"[" + type + "]",JSON.stringify(data));
    }else{
        this.logger.info(info,"[" + type + "]",data);
    }

};

//
//Remote.prototype.remoteNotice = function(eventName){
//    this.emit(eventName);
//};

module.exports = Remote;