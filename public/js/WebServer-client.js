function WebServerUtils() {
    this.webServerClient = null;
    function WebServerClient() {
        this.ws = null;
        this.remote = null;
        this.connected = false;
        this.data = null;
    }

    /**********************************************************
     *  单例模式对象
     **********************************************************/

    WebServerClient.prototype.connect = function () {
        this.remote = new RemoteClient({
            path:'/socket'
        });

        var socket = this.remote.webSocket;
        socket.on('logout', function (data) {
            alert(data.text);
        });

        // Listen to an event called 'rand' from the server
        socket.on('time', function (data) {
            var date = new Date();
            date.setTime = data.time;
            $('#time').html(date.toLocaleDateString() + date.toLocaleTimeString());
            $('#pid').html("client="+data.client);
        });

        //登录成功
        socket.on("success", function (data) {
           $('#pid').html("进程ID:" + data.pid);
        });
    };

    /**********************************************************
     *  单例模式对象
     **********************************************************/
    if (this.webServerClient === null) {
        this.webServerClient = new WebServerClient();
        console.log("WebSocket Client init");
    }
    return this.webServerClient;
};

function RemoteClient(options) {
    var socket = socketCluster.connect(options);
    Object.defineProperties(this,{
        "webSocket":{
            get:function(){
                return socket;
            }
        }
    });

    socket.on('connect', function (status) {

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
        console.log('------订阅 subscribe -------',data);
    });

    //取消订阅
    socket.on('unsubscribe', function (data) {
        console.log('------取消订阅 unsubscribe -------',data);
    });

    //解除验证
    socket.on('deauthenticate', function (data) {
        console.log('------解除验证 deauthenticate -------',data);
    });

    //消息
    socket.on('message', function (data) {
        console.log('------ message -------',data);
    });

    //断开
    socket.on("disconnect", function () {
        console.log(' --------- UNCONNECTED  -----------');
    });
};

RemoteClient.prototype.connect = function (options) {

};