function registerPushwooshAndroid(pushNotification, $state, $window, userid, $cordovaBadge) {

	document.addEventListener('push-notification',
		function(event) {
			console.log("Received a chat to display");
			var haveNewChat = event.notification.userdata.haveNewChat;
			var haveNewRequest = event.notification.userdata.haveNewRequest;
			var chatId = event.notification.userdata.chatId;
			var message = event.notification.message;
			var userData = event.notification.userdata;

			var eventCopy = "";

			//dump custom data to the console if it exists
			if (typeof(userData) != "undefined") {
				console.warn('user data: ' + JSON.stringify(userData));
				eventCopy = JSON.stringify(event.notification);
				var start = eventCopy.indexOf("title");
				var end = eventCopy.indexOf("google.message_id");
				message = eventCopy.substring(start+8,end-3);
			}

			//suppress notifications if we are already in chats
			if($state.is('tab.chats')||$state.is('tab.chat-detail')){
				// do nothing
				// refresh the window

				//CAUSING PROBLEM HERE
				/*
				if($state.is('tab.chats')){
					$window.location.reload();
				}
				*/
				// ideally we want to broadcast to the controller to refresh itself rather than reload

			} else if(haveNewChat){
				//navigator.notification.alert(notification.aps.alert,null,"Learnly","View Chat");
				//$state.go('tab.chats');

				function chatRoute(buttonIndex) {
				    //alert('We should redirect you');
				    switch(buttonIndex){
				    	case 1: break; //do nothing
				    	case 2: $state.go('tab.chats'); break;
				    }

				    //we should also add an update digit to the chat list

				}

			    navigator.notification.confirm(
			        message,  // message
			        chatRoute,              // callback to invoke with index of button pressed
			        'New Chat',            // title
			        ['Cancel','View']          // buttonLabels
			    );

			    chatvalue++;
			    console.log('chatvalue is '+chatvalue);

			    $cordovaBadge.hasPermission().then(function(yes) {
		           // You have permission
		          $cordovaBadge.set(chatvalue);
		        }, function(no) {
		            // You do not have permission
		        });


			} else if(haveNewRequest){
				//navigator.notification.alert(notification.aps.alert,null,"Learnly","View Chat");
				//$state.go('tab.chats');

				function route(buttonIndex) {
				    //alert('We should redirect you');
				    switch(buttonIndex){
				    	case 1: break; //do nothing
				    	case 2: $state.go('tab.ask'); break;
				    }

				    //we should also add an update digit to the chat list

				}

			    navigator.notification.confirm(
			        message,  // message
			        route,              // callback to invoke with index of button pressed
			        'New Request',            // title
			        ['Cancel','View']          // buttonLabels
			    );


			} else if(userData.haveNewBookmark){
				//navigator.notification.alert(notification.aps.alert,null,"Learnly","View Chat");
				//$state.go('tab.chats');

				function route(buttonIndex) {
				    //alert('We should redirect you');
				    switch(buttonIndex){
				    	case 1: break; //do nothing
				    	case 2: $state.go('tab.account'); break;
				    }

				    //we should also add an update digit to the chat list

				}

				navigator.notification.alert(message,route,"Learnly","OK");


			} else {
				navigator.notification.alert(message,null,"Learnly","OK");
				//callback to remove the chatbadge
			}

			//stopping geopushes
			//pushNotification.stopGeoPushes();
		}
	);

	//initialize Pushwoosh with projectid: "GOOGLE_PROJECT_ID", appid : "PUSHWOOSH_APP_ID". This will trigger all pending push notifications on start.
	pushNotification.onDeviceReady({appid : "427AA-CCB6A",projectid: "905490977808"});

	pushNotification.registerDevice(
	  function(status) {
	    pushToken = status.pushToken;
	      // handle successful registration here
		var pushRef = fb.child("pushtokens").child(userid);
	    pushRef.set({'token': pushToken});
	    console.log("Firebase notes token "+pushToken+" for "+userid);

	    storage.setItem("PWToken",pushToken);
	    onPushwooshAndroidInitialized(pushNotification);
	    //console.log("Successful pushwoosh with "+pushToken);

	  },
	  function(status) {
	    // handle registration error here
	    if(storage.getItem("PWToken")) {
	    	//have token
	    	pushToken = storage.getItem("PWToken");
	    } else {
	    	navigator.notification.alert('You may not be receiving lesson alerts. Please turn on from your phone\'s System Settings.',null,"You Disabled Push Notification","OK");
			//$scope.showAlert('You Disabled Push Notification','You may not be receiving lesson alerts. Please turn on from your phone\'s System Settings.');
	    }
	    console.log("Failed to register: " + status);

	  }
	);
}


function onPushwooshAndroidInitialized(pushNotification) {

	pushNotification.setEnableLED(true);

	//set single notification mode
	pushNotification.setSingleNotificationMode();

	//disable sound and vibration
	//pushNotification.setSoundType(1);
	pushNotification.setVibrateType(2);

	pushNotification.setLightScreenOnNotification(true);

	//if you need push token at a later time you can always get it from Pushwoosh plugin
	pushNotification.getPushToken(
		function(token) {
			console.info('push token: ' + token);
		}
	);

	//and HWID if you want to communicate with Pushwoosh API
	pushNotification.getPushwooshHWID(
		function(token) {
			console.info('Pushwoosh HWID: ' + token);
		}
	);

	//settings tags
	pushNotification.setTags({
			tagName: "tagValue",
			intTagName: 10
		},
		function(status) {
			console.info('setTags success: ' + JSON.stringify(status));
		},
		function(status) {
			console.warn('setTags failed');
		}
	);

	pushNotification.getTags(
		function(status) {
			console.info('getTags success: ' + JSON.stringify(status));
		},
		function(status) {
			console.warn('getTags failed');
		}
	);

	//start geo tracking.
	//pushNotification.startLocationTracking();
}

/*
function onPushwooshAndroidInitialized(pushToken) {
	//output the token to the console
	console.warn('push token: ' + pushToken);

	var pushNotification = cordova.require("pushwoosh-cordova-plugin.PushNotification");

	//if you need push token at a later time you can always get it from Pushwoosh plugin
	pushNotification.getPushToken(
		function(token) {
			console.warn('push token: ' + token);
		}
	);

	//and HWID if you want to communicate with Pushwoosh API
	pushNotification.getPushwooshHWID(
		function(token) {
			console.warn('Pushwoosh HWID: ' + token);
		}
	);

	pushNotification.getTags(
		function(tags) {
			console.warn('tags for the device: ' + JSON.stringify(tags));
		},
		function(error) {
			console.warn('get tags error: ' + JSON.stringify(error));
		}
	);


	//set multi notificaiton mode
	//pushNotification.setMultiNotificationMode();
	//pushNotification.setEnableLED(true);

	//set single notification mode
	pushNotification.setSingleNotificationMode();

	//disable sound and vibration
	//pushNotification.setSoundType(1);
	//pushNotification.setVibrateType(1);

	pushNotification.setLightScreenOnNotification(false);

	//setting list tags
	//pushNotification.setTags({"MyTag":["hello", "world"]});

	//settings tags
	pushNotification.setTags({
			deviceName: "hello",
			deviceId: 10
		},
		function(status) {
			console.warn('setTags success');
		},
		function(status) {
			console.warn('setTags failed');
		}
	);

	//Pushwoosh Android specific method that cares for the battery
	//pushNotification.startGeoPushes();
}
*/
