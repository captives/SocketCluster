function ServerClient(){
    this.startPresenter = presenter;
    this.startSubscriptionLive = viewer;
    this.stop = stop;
    var options = {
        protocol: 'https',
        hostname: 'localhost',
        port: 443,
        path:'/socketcluster'
    };
    var video = document.querySelector('#video');
    var webRtcPeer = null;
    var socket = socketCluster.connect(options);
    socket.on('connect', function (status) {
        isAuthenticated = status.isAuthenticated;
        console.log('CONNECTED', isAuthenticated, Math.random());
    });

    socket.on('presenterResponse',function (message) {
        if (message.response != 'accepted') {
            var errorMsg = message.message ? message.message : 'Unknow error';
            console.warn('Call not accepted for the following reason: ' + errorMsg);
            dispose();
        } else {
            webRtcPeer.processAnswer(message.sdpAnswer);
        }
    });

    socket.on('viewerResponse',function (message) {
        if (message.response != 'accepted') {
            var errorMsg = message.message ? message.message : 'Unknow error';
            console.warn('Call not accepted for the following reason: ' + errorMsg);
            dispose();
        } else {
            webRtcPeer.processAnswer(message.sdpAnswer);
        }
    });

    socket.on('stopCommunication',function (message) {
        dispose();
    });

    socket.on('iceCandidate',function (message) {
        webRtcPeer.addIceCandidate(message.candidate);
    });

    /***************************** 功能函数 ******************************/

    function sendMessage(message){
        socket.emit(message.id, message);
    }

    function onError(){

    }

    /***************************** 直播视频 ******************************/

    function presenter() {
        if(!webRtcPeer){
            var options = {
                localVideo: video,
                onicecandidate : onIceCandidate
            }
            webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, function (err) {
                if(err) return onError(err);
                this.generateOffer(onOfferPresenter);
            });
        }
    }

    function onOfferPresenter(error, offerSdp) {
        if (error) return onError(error);
        var message = {
            id : 'presenter',
            sdpOffer : offerSdp
        };
        sendMessage(message);
    }

    /***************************** 订阅直播 ******************************/
    function viewer(){
        if(!webRtcPeer){
            var options = {
                remoteVideo: video,
                onicecandidate : onIceCandidate
            };

            webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function (err) {
                if(err) return onError(err);

                this.generateOffer(onOfferViewer);
            });
        }
    }
    function onOfferViewer(error, offerSdp) {
        if (error) return onError(error);

        var message = {
            id : 'viewer',
            sdpOffer : offerSdp
        };

        sendMessage(message);
    }

    /***************************** webrtc ******************************/
    function onIceCandidate(candidate) {
        console.log('Local candidate' + JSON.stringify(candidate));

        var message = {
            id : 'onIceCandidate',
            candidate : candidate
        };

        sendMessage(message);
    };

    function stop() {
        if (webRtcPeer) {
            var message = {
                id : 'stop'
            };
            sendMessage(message);
            dispose();
        }
        if(socket){
            socket.close();
        }
    };

    function dispose() {
        if (webRtcPeer) {
            webRtcPeer.dispose();
            webRtcPeer = null;
        }
    };

}
