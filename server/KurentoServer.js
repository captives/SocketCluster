var kurento = require('kurento-client');

module.exports = {
    init:init,
    stop: stop,
    publish:publish,
    subscribe:subscribe,
    iceCandidate:onIceCandidate
};

/*
 * 全局变量定义
 */
//candidates队列
var candidatesQueue = {};
//kurentoClient
var kurentoClient = null;
//主持者
var presenter = null;
//订阅者集合
var viewers = [];
//没有主持者消息提示
var noPresenterMessage = 'No active presenter. Try again later...';
var argv = null;

function init(_argv){
    argv = _argv;
    getKurentoClient(function () {
        console.log('kurento server startup success', _argv.ws_uri);
    });
}

function sendMessage(message){
    if(send != null &&( typeof send == 'function')){
        send(message);
    }else{
        console.error('KurentoServer消息发送回调函数为空！');
    }
}

function stop (sessionId) {
    if (presenter !== null && presenter.id == sessionId) {
        for (var i in viewers) {
            var viewer = viewers[i];
            if(viewer.send && typeof viewer.send == 'function'){
                viewer.send({
                    id : 'stopCommunication'
                });
            }else{
                console.log(' viewer.send 不是函数');
            }
        }
        presenter.pipeline.release();
        presenter = null;
        viewers = [];

    } else if (viewers[sessionId]) {
        viewers[sessionId].webRtcEndpoint.release();
        delete viewers[sessionId];
    }

    clearCandidatesQueue(sessionId);
}

//清除 candidates 队列
function clearCandidatesQueue(sessionId) {
    if (candidatesQueue[sessionId]) {
        delete candidatesQueue[sessionId];
    }
}

//主持者发布
function publish(sessionId, sdpOffer, sendMessage) {
    startPresenter(sessionId, sdpOffer, sendMessage, function(error, sdpAnswer) {
        if (error) {
            return sendMessage({
                id : 'presenterResponse',
                response : 'rejected',
                message : error
            });
        }
        sendMessage({
            id : 'presenterResponse',
            response : 'accepted',
            sdpAnswer : sdpAnswer
        });
    });
}

//观察者订阅
function subscribe(sessionId, sdpOffer, sendMessage) {
    startViewer(sessionId, sdpOffer, sendMessage, function(error, sdpAnswer) {
        if (error) {
            return sendMessage({
                id : 'viewerResponse',
                response : 'rejected',
                message : error
            });
        }

        sendMessage({
            id : 'viewerResponse',
            response : 'accepted',
            sdpAnswer : sdpAnswer
        });
    });
}

//开始主持
function startPresenter(sessionId, sdpOffer, sendMessage, callback) {
    //清空candidates队列
    clearCandidatesQueue(sessionId);

    if (presenter !== null) {
        stop(sessionId);
        return callback("Another user is currently acting as presenter. Try again later ...");
    }

    presenter = {
        id : sessionId,
        pipeline : null,
        webRtcEndpoint : null
    };

    getKurentoClient(function(error, kurentoClient) {
        if (error) {
            stop(sessionId);
            return callback(error);
        }

        if (presenter === null) {
            stop(sessionId);
            return callback(noPresenterMessage);
        }

        kurentoClient.create('MediaPipeline', function(error, pipeline) {
            if (error) {
                stop(sessionId);
                return callback(error);
            }

            if (presenter === null) {
                stop(sessionId);
                return callback(noPresenterMessage);
            }

            presenter.pipeline = pipeline;
            pipeline.create('WebRtcEndpoint', function(error, webRtcEndpoint) {
                if (error) {
                    stop(sessionId);
                    return callback(error);
                }

                if (presenter === null) {
                    stop(sessionId);
                    return callback(noPresenterMessage);
                }

                presenter.webRtcEndpoint = webRtcEndpoint;

                if (candidatesQueue[sessionId]) {
                    while(candidatesQueue[sessionId].length) {
                        var candidate = candidatesQueue[sessionId].shift();
                        webRtcEndpoint.addIceCandidate(candidate);
                    }
                }

                webRtcEndpoint.on('OnIceCandidate', function(event) {
                    var candidate = kurento.getComplexType('IceCandidate')(event.candidate);
                    sendMessage({
                        id : 'iceCandidate',
                        candidate : candidate
                    });
                });

                webRtcEndpoint.processOffer(sdpOffer, function(error, sdpAnswer) {
                    if (error) {
                        stop(sessionId);
                        return callback(error);
                    }

                    if (presenter === null) {
                        stop(sessionId);
                        return callback(noPresenterMessage);
                    }

                    callback(null, sdpAnswer);
                });

                webRtcEndpoint.gatherCandidates(function(error) {
                    if (error) {
                        stop(sessionId);
                        return callback(error);
                    }
                });
            });
        });
    });
}

//开始订阅
function startViewer(sessionId, sdpOffer, sendMessage, callback) {
    clearCandidatesQueue(sessionId);

    if (presenter === null) {
        stop(sessionId);
        return callback(noPresenterMessage);
    }

    presenter.pipeline.create('WebRtcEndpoint', function(error, webRtcEndpoint) {
        if (error) {
            stop(sessionId);
            return callback(error);
        }

        viewers[sessionId] = {
            "webRtcEndpoint" : webRtcEndpoint,
            send:sendMessage
        };

        if (presenter === null) {
            stop(sessionId);
            return callback(noPresenterMessage);
        }

        if (candidatesQueue[sessionId]) {
            while(candidatesQueue[sessionId].length) {
                var candidate = candidatesQueue[sessionId].shift();
                webRtcEndpoint.addIceCandidate(candidate);
            }
        }

        webRtcEndpoint.on('OnIceCandidate', function(event) {
            var candidate = kurento.getComplexType('IceCandidate')(event.candidate);
            sendMessage({
                id : 'iceCandidate',
                candidate : candidate
            });
        });

        webRtcEndpoint.processOffer(sdpOffer, function(error, sdpAnswer) {
            if (error) {
                stop(sessionId);
                return callback(error);
            }
            if (presenter === null) {
                stop(sessionId);
                return callback(noPresenterMessage);
            }

            presenter.webRtcEndpoint.connect(webRtcEndpoint, function(error) {
                if (error) {
                    stop(sessionId);
                    return callback(error);
                }
                if (presenter === null) {
                    stop(sessionId);
                    return callback(noPresenterMessage);
                }

                callback(null, sdpAnswer);
                webRtcEndpoint.gatherCandidates(function(error) {
                    if (error) {
                        stop(sessionId);
                        return callback(error);
                    }
                });
            });
        });
    });
}

function onIceCandidate(sessionId, _candidate) {
    var candidate = kurento.getComplexType('IceCandidate')(_candidate);

    if (presenter && presenter.id === sessionId && presenter.webRtcEndpoint) {
        console.info('Sending presenter candidate');
        presenter.webRtcEndpoint.addIceCandidate(candidate);
    }
    else if (viewers[sessionId] && viewers[sessionId].webRtcEndpoint) {
        console.info('Sending viewer candidate');
        viewers[sessionId].webRtcEndpoint.addIceCandidate(candidate);
    }
    else {
        console.info('Queueing candidate');
        if (!candidatesQueue[sessionId]) {
            candidatesQueue[sessionId] = [];
        }
        candidatesQueue[sessionId].push(candidate);
    }
}

/*****************************************************************************
 *
 *  获取 Kurento 服务器客户端
 *
 *****************************************************************************/
// Recover kurentoClient for the first time.
function getKurentoClient(callback) {
    if (kurentoClient !== null) {
        return callback(null, kurentoClient);
    }

    //启动Kurento
    kurento(argv.ws_uri, function(error, _kurentoClient) {
        if (error) {
            console.log("Could not find media server at address " + argv.ws_uri);
            return callback("Could not find media server at address" + argv.ws_uri
                + ". Exiting with error " + error);
        }

        kurentoClient = _kurentoClient;
        callback(null, kurentoClient);
    });
}

