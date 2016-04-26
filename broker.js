/**
 * Created by Administrator on 2016/3/14.
 */
module.exports.run = function(broker){
  console.log(" >> Broker PID:", process.pid);

  broker.on('subscribe', function (data) {
    console.log('broker # subscribe', data);
  });

  broker.on('unsubscribe', function (data) {
    console.log('broker # unsubscribe', data);
  });

  broker.on('publish', function (channelName) {
    console.log('broker # publish', channelName);
  });

  broker.on('masterMessage', function (data) {
    console.log('broker # masterMessage', data);
  });
};