//Firebase universal declaration
//Available throughout the app
var fb = new Firebase("https://learnlybe.firebaseio.com/");
var fbCountry = fb; //defaultSG
var appVersion = '0.0.0'; //set to empty and let cordova derive it
var enableIntercom = false; //set to false in browser environment, true for phones
var pushToken = "";
var storage = window.localStorage;
var chatvalue = 0;
"use strict";

function initPushwoosh($state, $window, uid, device, $cordovaBadge) {
  var pushNotification = cordova.require("pushwoosh-cordova-plugin.PushNotification");

  if (window.device.platform == "Android") {
    console.log("REGISTER PUSHWOOSH ANDROID");
    registerPushwooshAndroid(pushNotification, $state, $window, uid, $cordovaBadge);
  } else if (window.cordova) {
    console.log("REGISTER PUSHWOOSH IOS");
    registerPushwooshIOS(pushNotification, $state, $window, uid, $cordovaBadge);
  } else {
    console.log("WARNING, failed to set IOS or ANDROID for Pushwoosh");
    navigator.notification.alert('You Disabled Push Notification','You may not be receiving lesson alerts. Please turn on from your phone\'s System Settings.');
  }

  //This runs on the very first registration
  pushNotification.getLaunchNotification(
    function(notification) {
      if (notification != null) {
        console.log("Received a launch notification");

        if($state.is('tab.chats')||$state.is('tab.ask')){
          $window.location.reload();
        } else {
          //$state.go('tab.chats');
          //do nothing
        }

      } else {
        //alert("No launch notification");
      }
    }
  );
/*
  pushNotification.getLaunchNotification(function(event) {
      var notification = event.notification

      if(notification.u.haveNewChat){
        //navigator.notification.alert(notification.aps.alert,null,"Learnly","View Chat");
        //$state.go('tab.chats');
        function route(buttonIndex) {

            switch(buttonIndex){
              case 1: break; //do nothing
              case 2: alert('Launch Notification'); $state.go('tab.chats'); break;
            }

        }

          navigator.notification.confirm(
              notification.aps.alert,  // message
              route,              // callback to invoke with index of button pressed
              'New Chat',            // title
              'Cancel,View'          // buttonLabels
          );

      } else {
        navigator.notification.alert(notification.aps.alert,null,"Learnly","OK");
      }
  });
*/
}


angular.module('learnly', ['ionic', 'ionic.native','ngCordova','firebase','learnly.controllers', 'learnly.services', 'learnly.directives', 'learnly.filters','ionic-ratings','angularMoment','monospaced.elastic', 'ionic-datepicker', 'ionic-timepicker', 'angularGeoFire', 'angular-geohash'])

.run(function($ionicPlatform, $cordovaDeeplinks, $timeout, $rootScope, $cordovaStatusbar, $state, $window, $cordovaBadge) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      enableIntercom = true;
    }

    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleLightContent();
      StatusBar.overlaysWebView(true);
      StatusBar.backgroundColorByHexString('#000000');
    }

    if (window.cordova) {
/*
      cordova.getAppVersion.getVersionCode(function (version) {
          appVersion = version;
      });
      */

      if(appVersion=='0.0.0'){
        cordova.getAppVersion.getVersionNumber(function (version) {
            appVersion = version;
        });
      }
    }

    //window.addEventListener('native.keyboardshow', keyboardShowHandler);
    //ionic.Platform.isFullScreen = true;
    //function keyboardShowHandler(e) {
        //alert("It works!");
    //}
    $ionicPlatform.on('resume', function() {
      navigator.splashscreen.hide();
    });
    $ionicPlatform.on('pause', function() {
      navigator.splashscreen.show();
    });

    $cordovaDeeplinks.route({
      '/tutor/:alias': {
        target: 'tab.dash-person',
        parent: 'tab.dash'
      }
    }).subscribe(function(match) {
      // One of our routes matched, we will quickly navigate to our parent
      // view to give the user a natural back button flow
      $timeout(function() {
        $state.go(match.$route.parent, match.$args);

        // Finally, we will navigate to the deeplink page. Now the user has
        // the 'product' view visibile, and the back button goes back to the
        // 'products' view.
        $timeout(function() {
          $state.go(match.$route.target, match.$args);
        }, 800);
      }, 100); // Timeouts can be tweaked to customize the feel of the deeplink
    }, function(nomatch) {
      console.warn('No match', nomatch);
    });


  });
})

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // Immediate shown when App is first launched before login
 .state('intro', {
    url: '/',
    templateUrl: 'templates/intro-slider.html',
    controller: 'LoginCtrl'
  })

 .state('intro-verification', {
    url: '/verification',
    templateUrl: 'templates/dash/verification.html',
    controller: 'introVerificationCtrl'
  })

 .state('intro-registerNumber', {
    url: '/registerNumber?email',
    templateUrl: 'templates/dash/registernumber.html',
    controller: 'registerNumberCtrl'
  })

 .state('intro-verifyNumber', {
    url: '/verifyNumber?country&num&authyid&email',
    templateUrl: 'templates/dash/verifynumber.html',
    controller: 'verifyNumberCtrl'
  })

 // Use this search where there are no search Keywords to pass in
 .state('search', {
    url: '/search',
    templateUrl: 'templates/search.html',
    controller: 'SearchCtrl'
  })

  // Use this search where there is a Keyword to pass in
  .state('search-para', {
    url: '/search-para?keyWord&url',
    templateUrl: 'templates/search-parameters.html',
    controller: 'SearchCtrl'
  })


  //Displays the profile of a coach you are viewing
  .state('person', {
    url: '/person?alias&distance',
    templateUrl: 'templates/person.html',
    controller: 'SearchPersonCtrl',
  })

  //Shows the reviews left about that coach
  .state('review', {
    url: '/review?coach',
    templateUrl: 'templates/reviews-person.html',
    controller: 'ReviewCtrl',
    hasSpecialBackButton: true
  })

  //Make a booking for the coach skills
  .state('booking', {
    url: '/booking?coach&lesson',
    templateUrl: 'templates/person-booking.html',
    controller: 'BookingCtrl'
  })


  // setup an abstract state for the tabs directive
  .state('tab', {
    url: "/tab",
    abstract: true,
    cache:false,
    templateUrl: "templates/tabs.html",
    controller: 'TabCtrl'
  })

  // Each tab has its own nav history stack:

  .state('tab.dash', {
    url: '/dash',
    views: {
      'tab-dash': {
        templateUrl: 'templates/tab-dash.html',
        controller: 'DashCtrl'
      }
    }
  })

    .state('tab.dash-search-para', {
      url: '/search-para?keyWord&url',
      views: {
        'tab-dash': {
          templateUrl: 'templates/search-parameters.html',
          controller: 'SearchCtrl'
        }
      }
    })

    .state('tab.dash-person', {
      url: '/person?alias&distance',
      views: {
        'tab-dash': {
          templateUrl: 'templates/person.html',
          controller: 'SearchPersonCtrl'
        }
      }
    })
    .state('tab.dash-favorites', {
      url: '/favorites',
      views: {
        'tab-dash': {
          templateUrl: 'templates/account/favorites.html',
          controller: 'FavoritesCtrl'
        }
      }
    })
    .state('tab.dash-person-review', {
      url: '/review?coach',
      views: {
        'tab-dash': {
      templateUrl: 'templates/reviews-person.html',
      controller: 'ReviewCtrl',
        }
      }
    })
    .state('tab.dash-person-booking', {
      url: '/booking?coach&lesson',
      views: {
        'tab-dash': {
      templateUrl: 'templates/person-booking.html',
      controller: 'BookingCtrl'
        }
      }
    })

    //WORKSHOPS
    .state('tab.worksops', {
    url: '/workshops',
    views: {
      'tab-workshops': {
        templateUrl: 'templates/tab-workshops.html',
        controller: 'WorkshopCtrl'
        }
      }
    })
    .state('tab.workshops-search', {
    url: '/search-workshops?keyWord',
    views: {
      'tab-workshops': {
        templateUrl: 'templates/workshops-search.html',
        controller: 'WorkshopSearchCtrl'
        }
      }
    })
    .state('tab.workshops-individual', {
    url: '/individual-workshops?workshopId&keyWord',
    views: {
      'tab-workshops': {
        templateUrl: 'templates/workshops-individual.html',
        controller: 'WorkshopIndividualCtrl'
        }
      }
    })
    .state('tab.workshops-holder', {
    url: '/holder-workshops?holderId',
    views: {
      'tab-workshops': {
        templateUrl: 'templates/workshops-holder.html',
        controller: 'WorkshopHolderCtrl'
        }
      }
    })
    .state('tab.workshops-map', {
    url: '/map-workshops?Lat&Lon',
    views: {
      'tab-workshops': {
        templateUrl: 'templates/map.html',
        controller: 'MapCtrl'
        }
      }
    })
    .state('tab.workshops-booking', {
    url: '/booking-workshops?workshopId&keyWord',
    views: {
      'tab-workshops': {
        templateUrl: 'templates/workshops-booking.html',
        controller: 'WorkshopBookingCtrl'
        }
      }
    })

    //EARN

  .state('tab.ask', {
    url: '/ask',
    views: {
      'tab-ask': {
        templateUrl: 'templates/tab-ask.html',
        controller: 'AskCtrl'
      }
    }
  })
    .state('tab.ask-person', {
      url: '/person?alias&simple',
      views: {
        'tab-ask': {
          templateUrl: 'templates/person.html',
          controller: 'SearchPersonCtrl'
        }
      }
    })

    .state('tab.ask-person-review', {
      url: '/review?coach',
      views: {
        'tab-ask': {
      templateUrl: 'templates/reviews-person.html',
      controller: 'ReviewCtrl',
        }
      }
    })
    .state('tab.ask-person-booking', {
      url: '/booking?coach&lesson',
      views: {
        'tab-ask': {
      templateUrl: 'templates/person-booking.html',
      controller: 'BookingCtrl'
        }
      }
    })
    .state('tab.ask-map', {
    url: '/ask-map?Lat&Lon',
    views: {
      'tab-ask': {
        templateUrl: 'templates/map.html',
        controller: 'MapCtrl'
        }
      }
    })
    .state('tab.ask-request', {
      url: '/request?requestId',
      views: {
        'tab-ask': {
          templateUrl: 'templates/ask/request.html',
          controller: 'RequestCtrl'
        }
      }
    })
    .state('tab.ask-promotion', {
      url: '/promotion?promotionId',
      views: {
        'tab-ask': {
          templateUrl: 'templates/ask/promotion.html',
          controller: 'PromotionCtrl'
        }
      }
    })

    //CHAT

  .state('tab.chats', {
      url: '/chats',
      views: {
        'tab-chats': {
          cache: false,
          templateUrl: 'templates/tab-chats.html',
          controller: 'ChatsCtrl'
        }
      }
    })
    .state('tab.chat-detail', {
      url: '/chats/?chatId&id&name&face&active',
      views: {
        'tab-chats': {
          templateUrl: 'templates/chat-detail.html',
          controller: 'ChatDetailCtrl'
        }
      }
    })
    .state('tab.chat-person', {
      url: '/person?alias&simple',
      views: {
        'tab-chats': {
          templateUrl: 'templates/person.html',
          controller: 'SearchPersonCtrl'
        }
      }
    })
    .state('tab.chat-person-review', {
      url: '/review?coach',
      views: {
        'tab-chats': {
          templateUrl: 'templates/reviews-person.html',
          controller: 'ReviewCtrl'
        }
      }
    })
    .state('tab.chat-person-booking', {
      url: '/booking?coach&lesson',
      views: {
        'tab-chats': {
          templateUrl: 'templates/person-booking.html',
          controller: 'BookingCtrl'
        }
      }
    })
    .state('tab.chat-order', {
      url: '/order?id&type&chatId',
      views: {
        'tab-chats': {
          templateUrl: 'templates/booking-order.html',
          controller: 'OrderCtrl'
        }
      }
    })

    .state('tab.chat-ordercreate',{
      url: '/ordercreate?id&type&chatId',
      views: {
        'tab-chats': {
          templateUrl: 'templates/booking-create.html',
          controller: 'OrderCreateCtrl'
        }
      }
    })

    .state('tab.chat-orderdetail',{
      url: '/orderdetails?id&type&class&chatId',
      views: {
        'tab-chats': {
          templateUrl: 'templates/booking-details.html',
          controller: 'OrderDetailCtrl'
        }
      }
    })

    //ACCOUNT

  .state('tab.account', {
      url: '/account',
      views: {
        'tab-account': {
          templateUrl: 'templates/tab-account.html',
          controller: 'AccountCtrl'
        }
      }
    })
    .state('tab.account-person', {
      url: '/person?alias',
      views: {
        'tab-account': {
          templateUrl: 'templates/person.html',
          controller: 'SearchPersonCtrl'
        }
      }
    })
    .state('tab.account-workshop', {
        url: '/accountworkshop?workshopBookingId',
        views: {
          'tab-account': {
            templateUrl: 'templates/account-workshop.html',
            controller: 'AccountWorkshopCtrl'
          }
        }
    })
    .state('tab.account-workshopHolder', {
        url: '/accountworkshopHolder?workshopId&keyWord',
        views: {
          'tab-account': {
            templateUrl: 'templates/account-workshopHolder.html',
            controller: 'AccountWorkshopHolderCtrl'
          }
        }
    })
    .state('tab.account-workshopSchedule', {
        url: '/accountworkshopSchedule?workshopId&workshopTitle&workshopStart&workshopEnd&workshopBookingId&category&expiryTime',
        views: {
          'tab-account': {
            templateUrl: 'templates/account-workshopSchedule.html',
            controller: 'AccountWorkshopScheduleCtrl'
          }
        }
    })
    .state('tab.account-workshopEmail', {
        url: '/accountworkshopEmail?isVendor&studentID&referenceID',
        views: {
          'tab-account': {
            templateUrl: 'templates/account-workshopEmail.html',
            controller: 'AccountWorkshopEmailCtrl'
          }
        }
    })
   .state('tab.account-map', {
    url: '/map-accounts?Lat&Lon',
    views: {
      'tab-account': {
        templateUrl: 'templates/map.html',
        controller: 'MapCtrl'
        }
      }
    })
    .state('tab.account-review', {
      url: '/account/:coach',
      views: {
        'tab-account': {
          templateUrl: 'templates/reviews-person.html',
          controller: 'ReviewCtrl'
        }
      }
    })
    .state('tab.account-verify', {
      url: '/verify',
      views: {
        'tab-account': {
          templateUrl: 'templates/account/verify.html',
          controller: 'VerifyCtrl'
        }
      }
    })
    .state('tab.account-favorites', {
      url: '/favorites',
      views: {
        'tab-account': {
          templateUrl: 'templates/account/favorites.html',
          controller: 'FavoritesCtrl'
        }
      }
    })
    .state('tab.account-person-review', {
      url: '/review?coach',
      views: {
        'tab-account': {
      templateUrl: 'templates/reviews-person.html',
      controller: 'ReviewCtrl',
        }
      }
    })
    .state('tab.account-person-booking', {
      url: '/booking?coach&lesson',
      views: {
        'tab-account': {
          templateUrl: 'templates/person-booking.html',
          controller: 'BookingCtrl'
        }
      }
    })
    .state('tab.account-requests', {
      url: '/requests',
      views: {
        'tab-account': {
          templateUrl: 'templates/account/account-requests.html',
          controller: 'AccountRequestsCtrl'
        }
      }
    })
    .state('tab.account-settings', {
      url: '/settings',
      views: {
        'tab-account': {
          templateUrl: 'templates/account/settings.html',
          controller: 'SettingsCtrl'
        }
      }
    })
    .state('tab.account-addnewskill', {
      url: '/addskill',
      views: {
        'tab-account': {
          templateUrl: 'templates/account/addnewskill.html',
          controller: 'AccountAddSkillCtrl'
        }
      }
    })
    .state('tab.account-editBackground', {
      url: '/editBackground',
      views: {
        'tab-account': {
          templateUrl: 'templates/account/editbackground.html',
          controller: 'AccountEditBackgroundCtrl'
        }
      }
    })
    .state('tab.account-education', {
      url: '/education',
      views: {
        'tab-account': {
          templateUrl: 'templates/account/update-education.html',
          controller: 'AccountEducationCtrl'
        }
      }
    })
    .state('tab.account-editRequest', {
      url: '/editrequest?requestId',
      views: {
        'tab-account': {
          templateUrl: 'templates/account/request.html',
          controller: 'AccountEditRequestCtrl'
        }
      }
    });


  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/');

});
