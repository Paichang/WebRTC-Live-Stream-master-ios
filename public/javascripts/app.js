(function(){
	var app = angular.module('projectRtc', [],
		function($locationProvider){$locationProvider.html5Mode(true);}
	);
	var socket = io();
	var client = new PeerManager();
	var MediaConfig = {
		audio: true,
		video: {
			width: {exact:1280},
			height: {exact:720}
		}
	};
	  var ScreenConfig = {
		audio: true,
		video: true
	  };
	  State = 0; // 0 : camera    1: screen

    app.factory('camera', ['$rootScope', '$window', function($rootScope, $window){
    	var camera = {};
		camera.preview = $window.document.getElementById('localVideo');
		
    	camera.start = function(Config){
			return requestUserMedia(Config,State) // get user stream
			.then(function(stream){
				camera.preview.setAttribute('autoplay', ''); 
				camera.preview.setAttribute('muted', '');
				camera.preview.setAttribute('playsinline', '');

				attachMediaStream(camera.preview, stream); // set LocalVideo.srcObject
				if(State == 0){
					client.setLocalStream(stream);
				}
				else{
					client.setLocalScreen(stream);
				}
				camera.stream = stream;
				$rootScope.$broadcast('cameraIsOn',true);
			})
			.catch(Error('Failed to get access to local media.'));
		};
    	camera.stop = function(){
    		return new Promise(function(resolve, reject){			
				try {
					//camera.stream.stop() no longer works
          for( var track in camera.stream.getTracks() ){
			track.stop();
			
          }
					camera.preview.src = '';
					resolve();
				} catch(error) {
					reject(error);
				}
    		})
    		.then(function(result){
    			$rootScope.$broadcast('cameraIsOn',false);
    		});	
		};
		return camera;
    }]);

	app.controller('RemoteStreamsController', ['camera', '$location', '$http', function(camera, $location, $http){
		var rtc = this;
		rtc.remoteStreams = [];
		function getStreamById(id) {
		    for(var i=0; i<rtc.remoteStreams.length;i++) {
		    	if (rtc.remoteStreams[i].id === id) {return rtc.remoteStreams[i];}
		    }
		}
		rtc.loadData = function () {
			// get list of streams from the server
			$http.get('/streams.json').success(function(data){
				// filter own stream
				var streams = data.filter(function(stream) {
			      	return stream.id != client.getId();
			    });
			    // get former state
			    for(var i=0; i<streams.length;i++) {
			    	var stream = getStreamById(streams[i].id);
			    	streams[i].isPlaying = (!!stream) ? stream.isPLaying : false;
			    }
			    // save new streams
			    rtc.remoteStreams = streams;
			});
		};

		rtc.view = function(stream){
			client.peerInit(stream.id);
			stream.isPlaying = !stream.isPlaying;
		};
		rtc.call = function(stream){
			/* If json isn't loaded yet, construct a new stream 
			 * This happens when you load <serverUrl>/<socketId> : 
			 * it calls socketId immediatly.
			**/
			if(!stream.id){
				stream = {id: stream, isPlaying: false};
				rtc.remoteStreams.push(stream);
			}
			if(camera.isOn){
				client.toggleLocalStream(stream.id);
				if(stream.isPlaying){
					client.peerRenegociate(stream.id);
				} else {
					client.peerInit(stream.id);
				}
				stream.isPlaying = !stream.isPlaying;
			} else {
				camera.start()
				.then(function(result) {
					client.toggleLocalStream(stream.id);
					if(stream.isPlaying){
						client.peerRenegociate(stream.id);
					} else {
						client.peerInit(stream.id);
					}
					stream.isPlaying = !stream.isPlaying;
				})
				.catch(function(err) {
					console.log(err);
				});
			}
		};

		//initial load
		rtc.loadData();
		setTimeout(rtc.loadData(),1000);
    	if($location.url() != '/'){
      		rtc.call($location.url().slice(1));
		};
	}]);

	app.controller('LocalStreamController',['camera', '$scope', '$window', function(camera, $scope, $window){
		var localStream = this;
		localStream.name = 'Guest';
		localStream.link = '';
		localStream.cameraIsOn = false;

		$scope.$on('cameraIsOn', function(event,data) {
    		$scope.$apply(function() {
		    	localStream.cameraIsOn = data;
		    });
		});

		localStream.Switch = function(){
			if(State == 0){
				State = 1;
				$window.document.getElementById("switch").src = "/images/camera.png";
				camera.start(ScreenConfig)
				.then(function(result) {
					client.UpdateLocalStream(State);
				})
				.catch(function(err) {
					console.log(err);
				});
			}
			else{
				State = 0;
				$window.document.getElementById("switch").src = "/images/screen.png";
				camera.start(MediaConfig)
					.then(function(result) {
						client.UpdateLocalStream(State);
					})
					.catch(function(err) {
						console.log(err);
					});
				
			}
		}

		localStream.toggleCam = function(){
			var username = $window.document.getElementById('username').innerHTML;
			$window.document.getElementById('flag').innerHTML = "1";
			if(username == ''){
				var Modal = $window.document.getElementById('myModal');
				Modal.style.display = "block";
			}
			else{
				$window.document.getElementById('switch').disabled = false;
				$window.document.getElementById('filter').disabled = false;
				$window.document.getElementById('popup_filter').className = "popup_fliter";
				$window.document.getElementById('popup_filter').innerHTML = "開始濾鏡吧~";
				$window.document.getElementById('popup_sw').className = "popup_sw";
				$window.document.getElementById('popup_sw').innerHTML = "切換你的畫面";
				localStream.name = username;
				camera.start(MediaConfig)
				.then(function(result) {
					localStream.link = $window.location.host + '/' + client.getId();
					client.send('readyToStream', { name: localStream.name });
				})
				.catch(function(err) {
					console.log(err);
				});
			}							
		};
	}]);
})();
