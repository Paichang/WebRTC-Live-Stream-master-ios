(function(){
 		var nickname = {};
		// setting nickname
 		
	// broadcast received message
 		socket.on('post', function(m) {
 			console.log(m);
 			socket.broadcast.emit('msg', m);
	 	})
	})
 }
)
