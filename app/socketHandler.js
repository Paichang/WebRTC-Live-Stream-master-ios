module.exports = function(io, streams) {

  io.on('connection', function(client) {
    
    nickname = {};

    console.log('-- ' + client.id + ' joined --');
    client.emit('id', client.id);
    
    client.on('message', function (details) {
      var otherClient = io.sockets.connected[details.to];
      if (!otherClient) {
        return;
      }
        delete details.to;
        details.from = client.id;
        otherClient.emit('message', details);
    });
      
    client.on('readyToStream', function(options) {
      console.log('-- ' + client.id + ' is ready to stream --');
      
      streams.addStream(client.id, options.name); 
    });
    
    client.on('update', function(options) {
      streams.update(client.id, options.name);
    });

    function leave() {
      console.log('-- ' + client.id + ' left --');
      streams.removeStream(client.id);
    }

    client.on('disconnect', leave);
    client.on('leave', leave);
// -------------------------------------------- chat
    client.on('setnickname', function(m) {
      if(typeof nickname[m] === 'undefined') {
        nickname[m] = {count: 0};
        client.emit('nicknamesuccess', m);
     } 
     else {
        nickname[m].count++;
        var t = m + '' + nickname[m].count;
        client.emit('nicknamefail', t);
      }
    });
 // broadcast received message
    client.on('post', function(m) {
      console.log(m);
      client.broadcast.emit('msg', m);
    })

//----------------------------------------------- donate
    client.on('donate',function(detail){
      console.log(detail);
      client.broadcast.emit('MsgFromDonor',detail);
    })
  });
};