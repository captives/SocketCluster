var EventEmitter = require('events').EventEmitter;
var Remote = require('./../resource/RemoteResource');

/**
 * 当前类专处理socket信息
 * @constructor
 */
function WebServer() {
    //远程消息管理对象
    this.remote = new Remote();
    //存放服务器上接入所有socket对象,不分组
    this.clientSockets = [];
    //存放服务器上接入所有房间room列表,不分组(以room为键名,值为为socket对象集合)
    this.roomList = {};
}

WebServer.prototype = new EventEmitter();

//输出共享事件
WebServer.prototype.debug = function(type,ws,data){
    this.remote.debug("发送",type,ws,data);
};

/**
 * 设备信息
 * @param info
 * @returns {*}
 */
WebServer.prototype.devInfo = function(info){
    if(info =="" || info == undefined || info == null  || !info){
        return "unknown device";
    }

    info = JSON.parse(info);
    var dev = info.device;
    var bw = info.browser;
    var os = info.os;
    var text = "";
    if(dev.type){
        if(dev.vendor){
            text = dev.vendor + " " + dev.model;
        }else{//山寨产品
            text = os.name + " " + dev.type;
        }
    }else{//桌面设备
        if(os.version){
            text = os.name + " " + subVersion(os.version);
        }else{
            text = os.name;
        }
    }

    function subVersion(version){
        var text = "";
        var index = version.indexOf(".");
        if(index == -1){
            text = version;
        }else{
            text = version.substring(0,index);
        }
        return text;
    }
    return [text,bw.name +" " + subVersion(bw.version)];
};


WebServer.prototype.register = function (ws, room, userdata, clientIP, type) {
    //如果传入的房间id为空,则使用默认房间0000
    var room = room || "0000";
    //接入时间戳
    var time = Date.now();
    //把新接入的socket添加到当前组内
    ws.time = time;//登入的时间戳
    ws.room = room;//当前socket归属的room
    ws.activated = false;//是否激活可用
    ws.loginType = type;//当前登录的客户端类型(mac,pc,pad,phone,web)
    ws.clientIP = clientIP,
    ws.userdata = userdata;//当前登入的用户数据
    if(userdata.userType == 3){
        ws.manager = true;
    }else{
        ws.manager = false;
    }

    this.debug("join", ws, "{ip:"+clientIP+", device:"+this.devInfo(type)+"}");
    console.log("register", room, ws.id, JSON.stringify(userdata));
    var status = this.checkLogin(ws, room, userdata, time, type);
    if (status) {
        this.online(ws, "进入");
    }
};


/**
 * 检查登陆
 * @param ws
 * @param room
 * @param user
 * @returns {boolean}      允许登入true,拒绝登入false
 */
WebServer.prototype.checkLogin = function (ws, room, user) {
    var data = [];
    var list = this.searchSocket(room, user.userId,user.userType);
    console.log("检查登陆",room,JSON.stringify(user),"已登入连接数：",list.length);
    if (list.length > 0) {
        if(user.userType == 4){//指定类型次数限制
            if(list.length >= 1000){
                this.remote.enterReject(ws,ws.room, ws.time, "#00001");
                return false;
            }else{
                return true;
            }
        }else{//检查重复登陆
            for (var i in list) {
                data.push({id: list[i].id, time: list[i].time, type: list[i].loginType});
            }
            this.remote.repEnter(ws, data);
            return false;
        }
    }
    return true;
};

/**
 * 下线
 * @param ws
 * @param list
 */
WebServer.prototype.offline = function (ws, list) {
    //向客户端发送下线通知
    //for (var i in list) {
    //   var tw = this.getSocket(list[i].id);
    //    if (tw) {
    //        this.remote.offLine(tw, ws.id, ws.time, ws.loginType, "强制登陆");
    //        this.removeSocketByRoom(tw, "被迫下线");
    //        console.log(tw.id, "已经下线");
    //    }
    //}
    var list = this.searchSocket(ws.room,ws.userdata.userId,ws.userdata.userType);
    for(var i in list){
        var tw = list[i];
        this.remote.offLine(tw, ws.id, ws.time, ws.loginType, "强制登陆");
        this.removeSocketByRoom(tw, "被迫下线");
        console.log(tw.id, "已经下线");
    }
};

/**
 * 踢出
 * @param id
 */
WebServer.prototype.kickoff = function (id) {
    var time = Date.now();
    var tw = this.getSocket(id);
    if (tw) {
        this.remote.offLine(tw, "00", time, "kickoff", "踢出房间");
        this.removeSocketByRoom(tw, "踢出房间");
        this.emit("kickoff", id, "已经被踢出房间");
    }
    return time;
};

/**
 * 上线
 * @param ws
 */
WebServer.prototype.online = function (ws, status) {
    var room = ws.room;
    //数组,以room为键名,值为为socket对象集合的返回值,若不存在实例变量
    var wsGroup = this.roomList[room] = this.roomList[room] || [];
    var onlineList = [];
    //遍历房间内所有的连接,用来通知别人和通知自己,当前房间组内的所有用户
    for (var i in wsGroup) {
        var tws = wsGroup[i];
        if (tws.id === ws.id) {
            continue;
        }

        var linedata = {
            time: tws.time,
            id: tws.id,
            type:"",
            userdata: tws.userdata
        };

        if(ws.manager) {
            linedata.type = tws.loginType;
        }
        onlineList.push(linedata);

        if(tws.manager){
            //通知当前组内的所有用户,添加在线用户列表
            this.remote.userEnter(tws, ws.id, ws.userdata, ws.loginType, ws.time);
        }else{
            this.remote.userEnter(tws, ws.id, ws.userdata, "", ws.time);
        }
    }

    ws.activated = true;
    //添加到房间
    wsGroup.push(ws);

    this.debug("online",ws,"{status:"+status+",id:" + ws.id + ",time:"+ws.time+",device:" + this.devInfo(ws.loginType)+"}");

    //通知自己的客户端,告知自己登陆成功
    this.remote.enterSuccess(ws, room, onlineList, ws.userdata, ws.time);
    console.log(ws.id, "激活成功", JSON.stringify(ws.userdata));
    this.emit('userEnter', ws, room, ws.userdata);
};

/**
 * 在指定房间内查找用户socket对象
 * @param room          房间
 * @param id            用户ID
 * @param type          用户类型
 * @returns {Array}     客户端socket集合对象
 */
WebServer.prototype.searchSocket = function (room, id, type) {
    var list = [];
    var socketGroup = this.roomList[room] || [];
    for (var i = 0; i < socketGroup.length; i++) {
        if (socketGroup[i].userdata.userId == id && socketGroup[i].userdata.userType == type) {
            list.push(socketGroup[i]);
        }
    }
    return list;
};

/**
 * 在指定房间内查找用户socket对象
 * @param room          房间
 * @param id            指定用户的id
 * @returns {Array}     所有客户端socket集合对象
 */
WebServer.prototype.searchSocketById = function (room, id) {
    var list = [];
    var socketGroup = this.roomList[room] || [];
    for (var i = 0; i < socketGroup.length; i++) {
        if (socketGroup[i].userdata.userId == id) {
            list.push(socketGroup[i]);
        }
    }
    return list;
};

/**
 * 在指定房间内查找类型用户socket对象
 * @param room          房间
 * @param type          指定用户类型
 * @returns {Array}     所有客户端socket集合对象
 */
WebServer.prototype.searchSocketByType = function (room, type) {
    var list = [];
    var socketGroup = this.roomList[room];
    for (var i = 0; i < socketGroup.length; i++) {
        if (socketGroup[i].userdata.userType == type) {
            list.push(socketGroup[i]);
        }
    }
    return list;
};

/**
 * 指定房间内广播消息
 * @param room      房间
 * @param ws        事件源socket
 * @param data      广播消息内容
 * @param time      广播时间戳
 */
WebServer.prototype.broadcast = function (room, ws, data, time) {
    var direct = true;
    if((data.toId == "" || data.toId == null || data.toId == []) &&
        (data.toType == "" || data.toType == null || data.toType == [])){
        direct = false;
    }

    //单个房间内所有socket对象集合
    var socketGroup = this.roomList[room];
    var list = [];
    //所有的客户端
    if (data.toId instanceof Array) {
        for (var tid in data.toId) {
            list = list.concat(this.searchSocketById(room, data.toId[tid]));
        }
    }else{
        list = list.concat(this.searchSocketById(room, data.toId));
    }

    //所有类型的客户端
    if (data.toType instanceof Array) {
        for (var t in data.toType) {
            list = list.concat(this.searchSocketByType(room, data.toType[t]));
        }
    }else{
        list = list.concat(this.searchSocketByType(room, data.toType));
    }

    //去重
    function unRepeat(list){
        var temp = [];
        for(var i=0; i < list.length; i++){
            var j = temp.indexOf(list[i]);
            if(j == -1){
                temp.push(list[i]);
                console.log("目标用户", JSON.stringify(list[i].userdata));
            }
        }
        return temp;
    };

    list = unRepeat(list);
    if (list.length == 0 && direct == false) {
        this.broadcaseInGroup(socketGroup, ws, data, time);
    } else {
        //console.log("定向发送消息");
        this.broadcaseInGroup(list, ws, data, time);
    }
};

/**
 * 在指定组内进行广播
 * @param wsGroup       指定组,
 * @param ws            发送者socket;
 * @param data          发送消息内容
 * @param back          是否返回给事件端;
 * @param time          广播时间戳
 */
WebServer.prototype.broadcaseInGroup = function (wsGroup, ws, data, time) {
    if (data.back) {
        delete data.back;
        this.sending(ws, ws.userdata, data, time);
    }

    if (wsGroup) {
        for (var i = 0; i < wsGroup.length; i++) {
            //console.log("消息接收者",JSON.stringify(wsGroup[i].userdata));
            if (wsGroup[i].id !== ws.id) {
                delete data.back;
                this.sending(wsGroup[i], ws.userdata, data, time);
            }
        }
    }
};

/***
 * 消息发送
 * @param ws            目标socket
 * @param userdata      消息发送者;
 * @param data          消息内容
 * @param time          时间戳
 */
WebServer.prototype.sending = function (ws, userdata, data, time) {
    // console.log(ws.room,ws.id, JSON.stringify(userdata), JSON.stringify(data));
    this.remote.sending(ws, data, userdata, time);
};

/**
 * 获取所有的房间,返回是数组
 * @returns {Array}
 */
WebServer.prototype.getRooms = function () {
    var roomList = [];
    for (var room in this.roomList) {
        roomList.push(room);
    }
    return roomList;
};

/**
 * 根据用户的socketId获取socket对象
 * @param id        socket ID
 * @returns {Socket}   socket对象
 */
WebServer.prototype.getSocket = function (id) {
    if (!this.clientSockets) {
        return;
    }

    for (var i = 0; i < this.clientSockets.length; i++) {
        var ws = this.clientSockets[i];
        if (id === ws.id) {
            return ws;
        }
    }

};

/**
 * 添加socket到列表中
 * @param ws
 */
WebServer.prototype.addSocket = function (ws) {
    this.clientSockets.push(ws);
};

WebServer.prototype.removeSocketByList = function (ws) {
    //从所有socket列表中查找指定socket
    var i = this.clientSockets.indexOf(ws);
    if (i !== -1) {
        console.log("从全局列表中清除" + JSON.stringify(ws.userdata));
        //删除连接数：在客户端socket队列中，删除一个元素
        this.clientSockets.splice(i, 1);
    }
};

WebServer.prototype.removeSocketByRoom = function (ws, text) {
    this.debug("offline",ws,"{status:"+text+",id:" + ws.id + ",time:"+ ws.time+", device:" + this.devInfo(ws.loginType)+"}");
    if(ws){
        ws.activated = false;
        ws.close();
    }
    //需要移除的房间
    var room = ws.room;
    if (room) {
        var i = this.roomList[room].indexOf(ws);
        //在房间room集合中，移除当前房间room对象
        if (i !== -1) {
            console.log("从房间列表中清除" + JSON.stringify(ws.userdata));
            this.roomList[room].splice(i, 1);
        }

        //删除房间
        if (this.roomList[room].length === 0) {
            console.log(room + "已经被清空,房间销毁");
            delete this.roomList[room];
        }
    }
};
/***
 * 移除指定socket
 * @param ws        待移除的socket
 */
WebServer.prototype.removeSocket = function (ws) {
    this.removeSocketByRoom(ws, "退出");
    this.removeSocketByList(ws);
};

/***
 * socket关闭后的处理
 * @param ws
 */
WebServer.prototype.socketClose = function (ws) {
    var that = this;
    var room = ws.room;
    if (room) {
        //获取当前房间连接数组
        var wsGroup = that.roomList[room] || [];
        //时间戳
        var time = Date.now();
        for (var i = 0; i < wsGroup.length; i++) {
            //获取当前房间内指定socket对象
            var tempSocket = wsGroup[i];
            //通知其他用户，自己已经退出
            if (tempSocket.id != ws.id) {
                that.emit('userQuit', ws, ws.room, ws.userdata);
                if (!tempSocket._closeCode) {
                    //console.log(tempSocket._closeCode > 0?'掉线':'在线');
                    this.remote.userQuit(tempSocket, ws.id, ws.userdata, time);
                    console.log("退出消息已发送");
                }
            }
        }
    }
    this.removeSocket(ws);
};

WebServer.prototype.init = function (socket) {
    var that = this;
    //私聊
    socket.on('chat', function (message) {
        that.addWorker('info', message);
    });

    socket.on('presenter', function (message) {
        that.addWorker('presenter', message);
    });

    socket.on('viewer', function (message) {
        that.addWorker('viewer', message);
    });

    socket.on('stop', function () {
        that.addWorker('stop', null);
    });

    socket.on('onIceCandidate', function (message) {
        that.addWorker('onIceCandidate', message);
    });
    
    socket.on("disconnect", function () {
        that.addWorker('stop', null);
        that.socketClose(socket);
        console.log(socket.id,"-- disconnect");
    });
};


/**
 * 获取所有的socket列表
 */
WebServer.prototype.getServer = function () {
    var list = [];
    for (var i = 0; i < this.clientSockets.length; i++) {
        var ws = this.clientSockets[i];
        list.push({time: ws.time, room: ws.room, id: ws.id, userdata: ws.userdata});
    }

    var rooms = {};
    for (var key in this.roomList) {
        var wss = this.roomList[key];
        rooms[key] = rooms[key] || [];
        for (var j in wss) {
            var ws = wss[j];
            rooms[key].push({time: ws.time, id: ws.id, userdata: ws.userdata});
        }
    }

    return JSON.stringify({list: list, rooms: rooms});
};

WebServer.prototype.addWorker = function(event, message) {
    var data =　{
        event: event,
        data: message
    };
    this.emit('message', data);
};

module.exports = WebServer;