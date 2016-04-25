var isAuthenticated = false;
function addMessage(text){
    var li = document.createElement("li");
    li.innerText = text;
    $('#msgList').append(li);
}

window.onload = function () {
    $('#outBtn').hide();
    $('.room').hide();
    $('.chat').hide();
};

$('#connBtn').click(function (e) {
    var socket = null;
    var sampleChannel = null;

    var options = {
        protocol: 'http',
        hostname: '192.168.10.31',
        port: 80
    };

    socket = socketCluster.connect({
        path:'/socket'
    });

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
            console.log(error,isAuthenticated);
        });
        console.log('CONNECTED', isAuthenticated);
    });

    //连接中断
    socket.on('connectAbort', function (data) {
        console.log('------连接中断 connectAbort -------',data);
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

    //订阅
    socket.on('subscribe', function (data) {
        $('.chat').show();
        console.log('------订阅 subscribe -------',data);
    });

    //订阅失败
    socket.on('subscribeFail', function (data) {
        console.log('------订阅失败 subscribeFail -------',data);
    });

    //取消订阅
    socket.on('unsubscribe', function (data) {
        $('.chat').hide();
        console.log('------取消订阅 unsubscribe -------',data);
    });

    //订阅状态改变
    socket.on('subscribeStateChange', function (data) {
        console.log('------订阅状态改变 subscribeStateChange -------',data);
    });

    //订阅请求
    socket.on('subscribeRequest', function (data) {
        console.log('------订阅请求 subscribeRequest -------',data);
    });

    //解除验证
    socket.on('deauthenticate', function (data) {
        console.log('------解除验证 deauthenticate -------',data);
    });

    //消息
    socket.on('message', function (data) {
        // console.log('------ message -------',data);
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
        // Listen to an event called 'rand' from the server
    socket.on('time', function (data) {
        var date = new Date();
        date.setTime = data.time;
        $('#time').html(date.toLocaleDateString() + date.toLocaleTimeString());
    });

    //登录成功
    socket.on("success", function (data) {
        $('#pid').html("进程ID:" + data.pid);
    });

    //群发消息,可跨越组
    $('#broBtn').on('click', function (e) {
        socket.emit("sampleClientEvent",{text:$('#inputText').val()});
    });

    //发送聊天信息
    $('#sendBtn').on('click', function (e) {
        socket.emit("chat",{
            name:$('#inputRoom').val(),
            text:$('#inputText').val()
        });
    });


    //退出指定房间
    $('#cancelBtn').on('click', function (e) {
        socket.unsubscribe($('#inputRoom').val());
    });

    //退出系统
    $('#outBtn').on('click', function (e) {
        socket.disconnect();
    });

    //进入指定房间
    $('#subBtn').on('click', function (e) {
        sampleChannel = socket.subscribe($('#inputRoom').val());
        sampleChannel.on('subscribe', function (data) {
            console.log('channel # subscribe',data);
        });
        sampleChannel.on('subscribeFail', function (err) {
            console.log('Failed to subscribe to the sample channel due to error: ' + err);
        });
        sampleChannel.on('unsubscribe', function (data) {
            console.log('channel # subscribe',data);
        });

        sampleChannel.watch(function (num) {
            addMessage(num);
            console.log('Sample channel message:', num);
        });
    });
});



