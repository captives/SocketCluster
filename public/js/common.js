function WebRTC(){

}

WebRTC.prototype.onMetedata = function(remotePeerConnection) {
    var bytesPrev = 0;
    var timestampPrev = 0;
    if (remotePeerConnection && remotePeerConnection.getRemoteStreams()[0]) {
        remotePeerConnection.getStats(null, function (results) {
            var statsString = dumpStats(results);
            //console.log('           Receiver stats ' + statsString);

            // calculate video bitrate
            Object.keys(results).forEach(function (result) {
                var report = results[result];
                var now = report.timestamp;

                var bitrate;
                if (report.type === 'inboundrtp' && report.mediaType === 'video') {
                    // firefox calculates the bitrate for us
                    // https://bugzilla.mozilla.org/show_bug.cgi?id=951496
                    bitrate = Math.floor(report.bitrateMean / 1024);
                } else if (report.type === 'ssrc' && report.bytesReceived && report.googFrameHeightReceived) {
                    // chrome does not so we need to do it ourselves
                    //https://github.com/webrtc/samples/blob/gh-pages/src/content/peerconnection/constraints/js/main.js
                    var bytes = report.bytesReceived;
                    if (timestampPrev) {
                        bitrate = 8 * (bytes - bytesPrev) / (now - timestampPrev);
                        bitrate = Math.floor(bitrate);
                    }
                    bytesPrev = bytes;
                    timestampPrev = now;
                }

                if (bitrate) {
                    bitrate += ' kbits/sec';
                    console.log('    Bitrate:' + bitrate);
                }
            });
        });
    }
    //递归
    setTimeout(function(){
        onMetedata(remotePeerConnection);
    }, 1000);
}