function registerPushwooshIOS(pushNotification, $state, $window, userid, $cordovaBadge) {

	document.addEventListener('push-notification',
		function(event) {
			console.log("Received PW payload");
			//var notification = event.notification;

			console.log("Received a chat to display");

			var userData = event.notification.userdata;
			var haveNewChat = userData.haveNewChat;
			var haveNewRequest = userData.haveNewRequest;
			var haveNewBookmark = userData.haveNewBookmark;
			var chatId = userData.chatId;

			var message = event.notification.message;
			
			//alert(JSON.stringify(userData));

			pushNotification.addToApplicationIconBadgeNumber(1);
			//navigator.notification.alert(notification.aps.alert,null,"Learnly","OK");
			//CUSTOM DATA Tag for deep linking
			
			//suppress notifications if we are already in chats
			if($state.is('tab.chats')||$state.is('tab.chat-detail')){
				// do nothing
				// refresh the window
				if($state.is('tab.chats')){
					$window.location.reload();
				}
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
				    pushNotification.setApplicationIconBadgeNumber(0);
				}

			    navigator.notification.confirm(
			        message,  // message
			        chatRoute,              // callback to invoke with index of button pressed
			        'New Chat',            // title
			        'Cancel,View'          // buttonLabels
			    );

			    //adding badges
			    chatvalue++;

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
			        ['Cancel','Answer']          // buttonLabels
			    );


			} else if(haveNewBookmark){
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
			//alert(JSON.stringify(notification));

			//clear the app badge
			
		}
	);

	//initialize the plugin
    pushNotification.onDeviceReady({appid:"427AA-CCB6A",projectid: "905490977808"});

	pushNotification.registerDevice(
	  function(status) {
	    pushToken = status.pushToken;
	      // handle successful registration here
		var pushRef = fb.child("pushtokens").child(userid);
	    pushRef.set({'token': pushToken});
	    console.log("Firebase notes token "+pushToken+" for "+userid);

	    storage.setItem("PWToken",pushToken);
	    onPushwooshiOSInitialized(pushNotification);

	    //console.log("Successful pushwoosh with "+pushToken);
	    pushNotification.setApplicationIconBadgeNumber(0);
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

/*
	//register for pushes
	pushNotification.registerDevice(
		function(status) {
			var deviceToken = status['deviceToken'];
			console.warn('registerDevice: ' + deviceToken);
			onPushwooshiOSInitialized(deviceToken);
			pushToken = deviceToken;
		},
		function(status) {
			console.warn('failed to register : ' + JSON.stringify(status));
			//alert(JSON.stringify(['failed to register ', status]));
		}
	);
*/
	//reset badges on start
	//pushNotification.cancelAllLocalNotifications();
}

function onPushwooshiOSInitialized(pushNotification) {

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
function onPushwooshiOSInitialized(pushToken) {
	var pushNotification = cordova.require("pushwoosh-cordova-plugin.PushNotification");
	//retrieve the tags for the device
	pushNotification.getTags(
		function(tags) {
			console.warn('tags for the device: ' + JSON.stringify(tags));
		},
		function(error) {
			console.warn('get tags error: ' + JSON.stringify(error));
		}
	);

	//example how to get push token at a later time 
	pushNotification.getPushToken(
		function(token) {
			console.warn('push token device: ' + token);
		}
	);

	//example how to get Pushwoosh HWID to communicate with Pushwoosh API
	pushNotification.getPushwooshHWID(
		function(token) {
			console.warn('Pushwoosh HWID: ' + token);
		}
	);


	//start geo tracking.
	//pushNotification.startLocationTracking();
}
*/
