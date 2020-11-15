$(document).ready(function() {
	var socket = io();
	var nickname = '';
	var modal = document.getElementById('myModal');
	var span_name = document.getElementsByClassName("close")[0];
	var span_donate = document.getElementsByClassName("close")[1];
	var MsgFromDonor = document.getElementById('MsgFromDonor');
	
	socket.on('nicknamesuccess', function(m) {
		console.log("success!" + m);
		nickname = m;
		$('#greeting').prop('className','enabled');
		$('#username').text(m);
	});

	socket.on('nicknamefail', function(m) {
		alert('Nickname conflict. Your nickname will be changed to "'+m+'"');
		nickname = m;
		$('#nickname').val(m);
		$('#nickname').prop('disabled', true);
		$('#sendnickname').prop('disabled', true);
		$('#msg').prop('disabled', false).focus();
		$('#send').prop('disabled', false);
		$('#msglabel').prop('className', 'enabled');
	});

	$('#form2').submit(function(e) {
		var username = $('#username').text();
		if(username == ''){
			$('#myModal').css('display','block');
			$('#nickname').focus();		
		}
		else{
			e.preventDefault();
			var m = $('#msg').val();
			socket.emit('post', {nickname: nickname, msg: m});
			$('#msg').val('');
			updateMsg({nickname:nickname,msg:m});
		}
	})

	socket.on('msg', function(m) {
		console.log('got msg',m);
		updateMsg(m);
	});

	socket.on('MsgFromDonor',function(detail){		
		displayDonation(detail);
	})

	function updateMsg(msg) {
		var ta = $("#panel");
		var t = new Date();
		var s = t.getHours() + ':' + t.getMinutes() + ':' + t.getSeconds();
		var m = '[ ' + msg.nickname + ' (' + s + ')]: ' + msg.msg;
		ta.val(ta.val()+'\n'+m);
		setTimeout(function(){
			ta.scrollTop(ta[0].scrollHeight - ta.innerHeight());
		},10);
	}

	function displayDonation(detail){
		var info = detail.username + "剛剛抖了" + detail.money;
		var msg = detail.msg;
		$('#DonationDetail').text(info);
		$('#DonorMsg').text(msg);
		$('#MsgFromDonor').prop('className','show');
	}

	MsgFromDonor.addEventListener('animationend',function(){
		$('#MsgFromDonor').prop('className','hidden');
	})

	$('#msg').focus();
	
//-------------------------------------------------------------------
    $('#sendName').click(function(){
		var name = $('#nickname').val();
		socket.emit('setnickname',name);
		$('#myModal').css('display','none');
	})

	$('#nickname').keyup(function(e){
		if(e.keyCode === 13){
			$('#sendName').click();
		}
	})

   	span_name.onclick = function() {
		$('.modal').css('display','none');
		$('#nickname').val('');
	}
	
	span_donate.onclick = function() {
		$('.modal').css('display','none');
		$('#money').text('');
		$('#donateMsg').val('');
		$('.money-btn').css('border','0px');
    }

    window.onclick = function(event) {
        if (event.target == modal) {
        	$('.modal').css('display','none');
        }
	}

	$('#donate-btn').click(function(){
		if(nickname == ''){
			$('#myModal').css('display','block');
			$('#nickname').focus();		
		}
		else{$('#donate-modal').css('display','block');
		}
	})
	
	$('.search-bar').focus(function(){
		$('.search-bar').css('background-color','white');
	})

	$('.search-bar').blur(function(){
		$('.search-bar').css('background-color','#D4D4D4');
	})

	$('#msg').focus(function(){
		$('#msg').css('background-color','white');
	})

	$('#msg').blur(function(){
		$('#msg').css('background-color','#D4D4D4');
	})

	$('#donate-btn').hover(function(){
		$('#popup').css('visibility','visible');
	},function(){
		$('#popup').css('visibility','hidden');
	})

	$('#NT20').click(function(){
		$('.money-btn').css('border','0px');
		$('#img20').css('border','2px solid black');
		$('#money').prop('innerHTML','20元');
		$('#error').text('');
	})

	$('#NT100').click(function(){
		$('.money-btn').css('border','0px');
		$('#img100').css('border','2px solid black');
		$('#money').prop('innerHTML','100元');
		$('#error').text('');
	})

	$('#NT300').click(function(){
		$('.money-btn').css('border','0px');
		$('#img300').css('border','2px solid black');
		$('#money').prop('innerHTML','300元');
		$('#error').text('');
	})

	$('#donateMoney').click(function(){
		var money = $('#money').text();
		var donateMsg = $('#donateMsg').val();
		
		if(money == ''){
			$('#error').text('請選擇您想捐出的面額!');
		}
		else{
			$('#money').text('');
			$('#donateMsg').val('');
			$('.money-btn').css('border','0px');
			$('.modal').css('display','none');
			socket.emit('donate',{username : nickname, money : money, msg : donateMsg});
			displayDonation({username : nickname, money : money, msg : donateMsg});
		}
	})
});