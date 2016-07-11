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
    var webRtc = new WebRTC();
    var webRtcPeer = null;
    var socket = socketCluster.connect(options);
    this.socket = socket;
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
                mediaConstraints:{
                    video:{
                        width:video.offsetWidth,
                        height:video.offsetHeight,
                        frameRate:30
                    }
                },
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

            //webRtc.onMetedata(webRtcPeer.peerConnection);
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

    // Dumping a stats variable as a string.
    // might be named toString?
    function dumpStats(results) {
        var statsString = '';
        Object.keys(results).forEach(function(key, index) {
            var res = results[key];
            statsString += '<h3>Report ';
            statsString += index;
            statsString += '</h3>\n';
            statsString += 'time ' + res.timestamp + '<br>\n';
            statsString += 'type ' + res.type + '<br>\n';
            Object.keys(res).forEach(function(k) {
                if (k !== 'timestamp' && k !== 'type') {
                    statsString += k + ': ' + res[k] + '<br>\n';
                }
            });
        });
        return statsString;
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

ServerClient.prototype.toggleVideoMute = function() {
    var videoTracks = this.localStream_.getVideoTracks();
    if (videoTracks.length === 0) {
        trace("No local video available.");
        return;
    }
    trace("Toggling video mute state.");
    for (var i = 0;i < videoTracks.length;++i) {
        videoTracks[i].enabled = !videoTracks[i].enabled;
    }
    trace("Video " + (videoTracks[0].enabled ? "unmuted." : "muted."));
};

ServerClient.prototype.toggleAudioMute = function() {
    var audioTracks = this.localStream_.getAudioTracks();
    if (audioTracks.length === 0) {
        trace("No local audio available.");
        return;
    }
    trace("Toggling audio mute state.");
    for (var i = 0;i < audioTracks.length;++i) {
        audioTracks[i].enabled = !audioTracks[i].enabled;
    }
    trace("Audio " + (audioTracks[0].enabled ? "unmuted." : "muted."));
};

ServerClient.prototype.serverTime = function (callback) {
    this.socket.on('time', function (message) {
        if(typeof callback == 'function'){
            callback(message);
        }
    });
};

ServerClient.prototype.serverMark = function (callback) {
    this.socket.on('mark', function (message) {
        if(typeof callback == 'function'){
            callback(message);
        }
    });
};