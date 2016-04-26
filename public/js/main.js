var isAuthenticated = false;
var Alert = {};
Alert.show = function (text) {
  alert(text);
};

console.log = function () {
    var arr = Array.prototype.slice.call(arguments);;
    addMessage(arr.join(' '));
};

function addMessage(text){
    var li = document.createElement("li");
    li.innerText = text;
    $('#msgList > ul').append(li);
}

$('#clearBtn').on('click', function () {
   $('#msgList > ul').empty();
});

window.onload = function () {
    $('#outBtn').hide();
    $('.room').hide();
    $('.chat').hide();
};

$('#connBtn').click(function (e) {
    var socket = null;
    var options = {
        protocol: 'http',
        hostname: '192.168.10.31',
        port: 80,
        path:'/socket'
    };

    socket = socketCluster.connect(options);

    socket.on('error', function (err) {
        throw 'Socket error - ' + err;
    });

    socket.on('connect', function (status) {
        $('#connBtn').hide();
        $('#outBtn').show();
        $('.room').show();

        isAuthenticated = status.isAuthenticated;
        console.log("connect",status);
        socket.emit("login",{name:$('#inputName').val(),room:1000,uid:111}, function (err, failure) {
            var error = null;
            if (err) {
                error = 'Failed to login due to error: ' + err;
                isAuthenticated = false;
            } else if (failure) {
                error = failure;
                isAuthenticated = false;
            } else {
                error = '';
                isAuthenticated = true;
            }
            console.log(error,'认证通过',isAuthenticated);
        });
        console.log('CONNECTED', isAuthenticated);
    });

    //连接中断
    socket.on('connectAbort', function (code) {
        console.log('------连接中断 connectAbort -------',code);
    });

    socket.on('raw', function () {
        console.log('------ raw -------');
    });

    //踢出
    socket.on('kickOut', function (data) {
        console.log('------踢出 kickOut -------',data);
    });

    //认证
    socket.on('authenticate', function (data) {
        console.log('------认证 authenticate -------',data);
    });

    //认证状态更改
    socket.on('authStateChange', function (data) {
        console.log('------认证状态更改 authStateChange -------',data);
    });

    //移除认证
    socket.on("removeAuthToken", function (data) {
        isAuthenticated = false;
        console.log('------移除认证 removeAuthToken -------',data);
    });

    //订阅请求-2
    socket.on('subscribeRequest', function (name) {
        console.log('------订阅请求 subscribeRequest -------',name);
    });

    //订阅失败
    socket.on('subscribeFail', function (data) {
        console.log('------订阅失败 subscribeFail -------',data);
    });

    //订阅状态改变
    socket.on('subscribeStateChange', function (data) {
        console.log('------订阅状态改变 subscribeStateChange -------',data);
    });

    //订阅
    socket.on('subscribe', function (data) {
        $('.chat').show();
        console.log('------订阅 subscribe -------',data);
    });

    //取消订阅
    socket.on('unsubscribe', function (data) {
        watchChannel(false,name);
        $('.chat').hide();
        console.log('------取消订阅 unsubscribe -------',data);
    });

    //解除验证
    socket.on('deauthenticate', function (data) {
        console.log('------解除验证 deauthenticate -------',data);
    });

    //消息
    socket.on('message', function (data) {
        if($('#checkBox').is(':checked')){
            console.log('------ message -------',data);
        }
    });

    //断开
    socket.on("disconnect", function () {
        $('#connBtn').show();
        $('#outBtn').hide();
        console.log(' --------- UNCONNECTED  -----------');
    });

    /*********************************************
     *
     * 自定义事件监听
     *
     *********************************************/
    socket.on('logout', function (data) {
        alert(data.text);
    });

    // Listen to an event called 'rand' from the server
    socket.on('time', function (data) {
        var date = new Date();
        date.setTime = data.time;
        $('#time').html(date.toLocaleDateString() + date.toLocaleTimeString());
        $('#num').html("/client="+data.client);
    });

    //登录成功
    socket.on("success", function (data) {
        $('#pid').html("PID:" + data.pid);
    });

    //群发消息,可跨越组
    $('#broBtn').on('click', function (e) {
        socket.emit("broadcast",{text:$('#inputText').val()});
    });

    //发送聊天信息
    $('#sendBtn').on('click', function (e) {
        socket.emit("chat",{
            name:$('#inputRoom').val(),
            text:$('#inputText').val()
        });
    });

    $('#sBtn').on('click', function (e) {
        socket.publish('chat',{
            name:$('#inputRoom').val(),
            text:$('#inputText').val()
        });
    });

    //退出指定房间
    $('#unsubBtn').on('click', function (e) {
        var name = $('#inputRoom').val();
        if(socket.isSubscribed(name)){
            watchChannel(false,name);
        }else{
            Alert.show("无效的通道信息名称,已取消退订！");
        }
    });

    //退出系统
    $('#outBtn').on('click', function (e) {
        socket.disconnect();
    });

    //进入指定房间
    $('#subBtn').on('click', function (e) {
        var name = $('#inputRoom').val();
        if(name == null && name== ""){
            Alert.show('订阅名称不能为空');
        }else if(socket.isSubscribed(name)){
            Alert.show('不能重复订阅' + name + "通道！");
        }else{
            watchChannel(true, name);
        }
    });

    var channel = null;
    function watchChannel(monitor,name){
        function out(text) {
            console.log(name,'channel message:', text);
        }

        if(monitor){
            channel = socket.subscribe(name);
        }else{
            socket.unsubscribe(name);
            socket.destroyChannel(name);
        }

        channel.on('subscribe', function (name) {
            channel.watch(out);
            console.log('channel # subscribe',name);
        });

        channel.on('subscribeFail', function (err) {
            console.log('Failed to subscribe to the sample channel due to error: ' + err);
        });

        channel.on('unsubscribe', function (data) {
            console.log('channel # unsubscribe',data);
            channel.unwatch(out);
        });
    }
});

function DataChannel(){
    this.name = "example";
    var channel = this.channel = null;

    channel.on('subscribe', function (name) {
        console.log('channel # subscribe',name);
    });

    channel.on('subscribeFail', function (err) {
        console.log('Failed to subscribe to the sample channel due to error: ' + err);
    });

    channel.on('unsubscribe', function (data) {
        console.log('channel # unsubscribe',data);
    });
}

DataChannel.prototype.subscribe = function (scSocket, name) {
    this.channel = scSocket.subscribe(name);
    this.channel.watch(function (text) {
        console.log(name,'channel message:', text);
    });
};
DataChannel.prototype.unsubscribe = function (scSocket, name) {
    this.channel.unwatch(name);
    this.channel = scSocket.unsubscribe(name);
};
