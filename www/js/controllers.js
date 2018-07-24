angular.module('learnly.controllers', ['ionic', 'ngCordova', 'angularPayments'])

.config(function() {

})
//Opening Slider Controller
//Also controls Firebase Login
.controller('LoginCtrl', function($cordovaInAppBrowser, $rootScope, $scope, $ionicLoading, $ionicModal, $state, $ionicSlideBoxDelegate, Utilities, Auth, $ionicHistory, $timeout) {

  //stripe stuff
  //live
  //pk_live_PDbsw8vIknLgarPJaVqAz1ZV
  //test
  //pk_test_6PfENnEhnVWECPsnuuT3cp2d

  var options = {
     location: 'yes',
     clearcache: 'yes',
     toolbar: 'no'
  };

  $scope.openBrowser = function() {
    console.log("opening browers");
     $cordovaInAppBrowser.open('https://belearnly.com/pages/terms-conditions', '_blank', options)

     .then(function(event) {
        // success
     })

     .catch(function(event) {
        // error
     });
  };

  $scope.showAlert = Utilities.showAlert;

  // Called to navigate to the main app
  $scope.startApp = function() {
    $state.go('tab.dash');
  };
  $scope.next = function() {
    $ionicSlideBoxDelegate.next();
  };
  $scope.previous = function() {
    $ionicSlideBoxDelegate.previous();
  };

  // Called each time the slide changes
  $scope.slideChanged = function(index) {
    $scope.slideIndex = index;
  };

  //for storing the address and password
  $scope.emailData = {};

  $scope.emailLogin = function() {
    //$scope.email = {};
    console.log("Email Login");

    $ionicLoading.show({
      template: '<ion-spinner icon="spiral"></ion-spinner>'
    });
    var loadTimer = $timeout(checkConnection, 5000);

    Auth.login().$authWithPassword({
      email    : $scope.emailData.address,
      password : $scope.emailData.password
    }).then(function(userData){
      console.log("Successfully logged in uid:", userData.uid);
      $ionicLoading.hide();
      $scope.emailData = {};

      var hideVerficationModal = true;

      console.log("Attempt search for user "+userData.uid+" for LoginCtrl");


      var userRef = fb.child("users/"+userData.uid);
      var userAliasRef = userRef.child('alias');

      userAliasRef.once("value", function(snapshot) {
        var userAlias = snapshot.val();
        console.log("Retrieved user with alias "+userAlias);
        var existingUser = (snapshot.val() !== null);
        console.log("Existing User:"+ existingUser);

        hideVerficationModal = existingUser;

        if(hideVerficationModal){
          console.log("is exisitng user");

          userRef.once("value", function(snapshot){

            $scope.user = snapshot.val();
            if(($scope.user.tel == null)||($scope.user.tel.authyid == null)) {
              console.log("no authy id");
              $ionicHistory.nextViewOptions({
                disableBack: true
              });
              $state.go('intro-registerNumber',{"email":$scope.user.email});
              $timeout.cancel(loadTimer);
            }else{
              console.log("have authy id");
              if($scope.user.defaultcountry==null){
                console.log("no default country");
                var option ={};
                option.value = $scope.user.tel.country;

                switch(option.value){

                  case 65:
                  fbCountry = fb;
                  option.name = 'Singapore';
                  option.flag = 'img/countries/Singapore.png';
                  option.currency = "$";
                  break;

                  case 60:
                  fbCountry = fb.child(option.value);
                  option.name = 'Malaysia'
                  option.flag = 'img/countries/Malaysia.png';
                  option.currency = "RM";
                  break;

                  default:
                  fbCountry = fb;
                  option.name = 'Singapore'
                  option.flag = 'img/countries/Singapore.png';
                  option.currency = "$";
                  break;
                }

                //set defaultcountry in fb
                userRef.update({defaultcountry:option}).then(function(){
                  //set localstorage
                  storage.setItem("defaultCountry", JSON.stringify(option));
                  $state.go('tab.dash');
                  $timeout.cancel(loadTimer);
                });
              }else{
                console.log("set default country ");
                storage.setItem("defaultCountry", JSON.stringify($scope.user.defaultcountry));
                  $state.go('tab.dash');
                  $timeout.cancel(loadTimer);
              }
            }
          })
        }else{
          console.log("new user");
          $ionicHistory.nextViewOptions({
            disableBack: true
          });
          $state.go('intro-verification');
          $timeout.cancel(loadTimer);
        }
      })
    }).catch(function(error){
      $ionicLoading.hide();
      $timeout.cancel(loadTimer);
      $scope.showAlert("Error","Error logging in");
    });

  }

  //$scope.authData = fb.getAuth(); //should be null
  $scope.createEmailUser = function() {
    //$scope.email = {};

    if($scope.emailData.password!==$scope.emailData.password2){
      $scope.showAlert("Error","Passwords do not match");
      $scope.emailData.password = "";
      $scope.emailData.password2 = "";

    } else {

      $ionicLoading.show({
        template: '<ion-spinner icon="spiral"></ion-spinner>'
      });

      Auth.login().$createUser({
        email    : $scope.emailData.address,
        password : $scope.emailData.password
      }).then(function(userData){
        console.log("Successfully created user account with uid:", userData.uid);
        //proceed to login
        $scope.emailLogin();

      }).catch(function(error){
        console.log("Error creating user:"+error);
        $ionicLoading.hide();
        $scope.showAlert("Error","Error creating user");
      });
    }

  }

  $scope.login = function() {
    var appId = 724123877696428;
    //var appVersion = "v2.0";

    if (!window.cordova) {
      facebookConnectPlugin.browserInit(appId);
    }

    facebookConnectPlugin.login(["public_profile", "email", "user_friends"],
    function (success) {
      //alert(JSON.stringify(response))
    $ionicLoading.show({
      template: '<ion-spinner icon="spiral"></ion-spinner>'
    });
    var loadTimer = $timeout(checkConnection, 10000);
      console.log(success.authResponse.accessToken);

      Auth.login().$authWithOAuthToken("facebook", success.authResponse.accessToken).then(function(authData) {
        console.log("Logged in as:", authData.uid);
        console.log("Let's redirect "+authData.facebook.displayName+" "+authData.facebook.email+" to dash tabs");
        var hideVerficationModal = true;

        console.log("Attempt search for user "+authData.uid+" for LoginCtrl");


        var userRef = fb.child("users/"+authData.uid);
        var userAliasRef = userRef.child('alias');

        userAliasRef.once("value", function(snapshot) {
          var userAlias = snapshot.val();
          console.log("Retrieved user with alias "+userAlias);
          var existingUser = (snapshot.val() !== null);
          console.log("Existing User:"+ existingUser);

          hideVerficationModal = existingUser;

          if(hideVerficationModal){
            console.log("is exisitng user");
            userRef.once("value", function(snapshot){

              $scope.user = snapshot.val();
              if(($scope.user.tel == null)||($scope.user.tel.authyid == null)) {
                console.log("no authy id");
                $ionicHistory.nextViewOptions({
                  disableBack: true
                });
                $state.go('intro-registerNumber',{"email":$scope.user.email});
                $timeout.cancel(loadTimer);
              }else{

                if($scope.user.defaultcountry==null){
                  var option ={};
                  option.value = $scope.user.tel.country;

                  switch(option.value){

                    case 65:
                    fbCountry = fb;
                    option.name = 'Singapore';
                    option.flag = 'img/countries/Singapore.png';
                    option.currency = "$";
                    break;

                    case 60:
                    fbCountry = fb.child(option.value);
                    option.name = 'Malaysia'
                    option.flag = 'img/countries/Malaysia.png';
                    option.currency = "RM";
                    break;

                    default:
                    fbCountry = fb;
                    option.name = 'Singapore'
                    option.flag = 'img/countries/Singapore.png';
                    option.currency = "$";
                    break;
                  }

                  //set defaultcountry in fb
                  userRef.update({defaultcountry:option}).then(function(){
                    //set localstorage
                    storage.setItem("defaultCountry", JSON.stringify(option));
                    $state.go('tab.dash');
                    $timeout.cancel(loadTimer);
                  });
                }else{
                  console.log("set default country ");
                  storage.setItem("defaultCountry", JSON.stringify($scope.user.defaultcountry));
                  $state.go('tab.dash');
                  $timeout.cancel(loadTimer);
                }
              }
            })
          }else{
            console.log("new user");
            $ionicHistory.nextViewOptions({
              disableBack: true
            });
            $state.go('intro-verification');
            $timeout.cancel(loadTimer);
          }
        })

      }).catch(function(error) {
        console.error("Firebase Authentication failed:", error);
        $timeout.cancel(loadTimer);
        $scope.showAlert("Error","Login Error");
        $ionicLoading.hide();
      });


    }, function (response) {
      console.log(JSON.stringify(response));
    }
  );//fbLoginSuccess, fbLoginError);
  };


  if(fb.getAuth()){
    $ionicLoading.show({
      template: '<ion-spinner icon="spiral"></ion-spinner>'
    });

    var loadTimer = $timeout(checkConnection, 5000);

    var hideVerficationModal = true;
    var authData = fb.getAuth();
    console.log("Attempt search for user "+authData.uid+" for LoginCtrl");


    var userRef = fb.child("users/"+authData.uid);
    var userAliasRef = userRef.child('alias');

    userAliasRef.once("value", function(snapshot) {
      var userAlias = snapshot.val();
      console.log("Retrieved user with alias "+userAlias);
      var existingUser = (snapshot.val() !== null);
      console.log("Existing User:"+ existingUser);

      hideVerficationModal = existingUser;

      if(hideVerficationModal){
        console.log("is exisitng user");
        userRef.once("value", function(snapshot){

          $scope.user = snapshot.val();
          if(($scope.user.tel == null)||($scope.user.tel.authyid == null)) {
            console.log("no authy id");
            $ionicHistory.nextViewOptions({
              disableBack: true
            });
            $state.go('intro-registerNumber',{"email":$scope.user.email});
            $timeout.cancel(loadTimer);
          }else{
            if($scope.user.defaultcountry==null){
              console.log("default country is null");
              var option ={};
              option.value = $scope.user.tel.country;

              switch(option.value){

                case 65:
                fbCountry = fb;
                option.name = 'Singapore';
                option.flag = 'img/countries/Singapore.png';
                option.currency = "$";
                break;

                case 60:
                fbCountry = fb.child(option.value);
                option.name = 'Malaysia'
                option.flag = 'img/countries/Malaysia.png';
                option.currency = "RM";
                break;

                default:
                fbCountry = fb;
                option.name = 'Singapore'
                option.flag = 'img/countries/Singapore.png';
                option.currency = "$";
                break;
              }

              //set defaultcountry in fb
              userRef.update({defaultcountry:option}).then(function(){
                //set localstorage
                storage.setItem("defaultCountry", JSON.stringify(option));
                $state.go('tab.dash');
                $timeout.cancel(loadTimer);
              });
            }else{
              console.log("set default country");
              storage.setItem("defaultCountry", JSON.stringify($scope.user.defaultcountry));
              $state.go('tab.dash');
              $timeout.cancel(loadTimer);
            }
          }
        })
      }else{
        console.log("new user");
        $ionicHistory.nextViewOptions({
          disableBack: true
        });
        $state.go('intro-verification');
        $timeout.cancel(loadTimer);
      }
    })
  }


  Utilities.getAliasCount().then(function(count){
    $scope.numTutors = count;
  });

  $scope.slideTo = function(index) {
    $ionicSlideBoxDelegate.$getByHandle('login').slide(index);
  };
  $scope.activeSlide = 0;
  //$scope.slideIndex = 0;
  // Called each time the slide changes
  $scope.loginSlideChanged = function(index) {
    $scope.activeSlide = index;
  };

  function checkConnection() {
      $ionicLoading.hide();
      $scope.showAlert('Please check your Connection');
    }

})

.controller('introVerificationCtrl', function($scope, $state, ImageToken, $ionicPlatform, $ionicActionSheet, Utilities, imageUploader, UserAction, $cordovaCamera, $ionicHistory, $ionicLoading){

  console.log("new user");
  $ionicLoading.hide();
  $scope.authData = fb.getAuth();
  var aliasRef = fb.child("alias");
  var userRef = fb.child("users/"+$scope.authData.uid);

  $scope.showAlert = Utilities.showAlert;

  if($scope.authData.provider==="facebook"){
    $scope.user = {};
    $scope.user.alias = ($scope.authData.facebook.cachedUserProfile.first_name+''+$scope.authData.facebook.cachedUserProfile.last_name).toLowerCase().replace(/\s+/g, '');
    $scope.user.name = $scope.authData.facebook.displayName;
    $scope.user.email = $scope.authData.facebook.email;
    $scope.user.facebookid = $scope.authData.facebook.cachedUserProfile.id;
    $scope.user.face = "http://graph.facebook.com/v2.8/"+$scope.user.facebookid+"/picture?height=500&width=500";

  } else if($scope.authData.provider==="password"){
    $scope.user = {};
    $scope.user.alias = null;
    $scope.user.name = null
    $scope.user.email = $scope.authData.password.email;
    $scope.user.face = "img/assets/placeholder.png";
  }

    $scope.user.education = {"major": "None", "sch": {"shortname":"None","pic":"img/schools/SG/Default/None.png"}};
    $scope.user.writeup = "Short writeup about myself";
    $scope.user.skills = {};
    $scope.user.rating = 3;
    $scope.user.viewCount = 0;
    $scope.user.balance = 0;
    $scope.user.schedule = [{"name": "Morning"},{"name": "Afternoon"},{"name": "Night"}];
    $scope.user.showClassListings = false;

    $scope.user.memberSince = Firebase.ServerValue.TIMESTAMP;

    $scope.user.platform = {'isIOS': ionic.Platform.isIOS(), 'isAndroid': ionic.Platform.isAndroid(), 'platform': ionic.Platform.platform(), 'version': ionic.Platform.version()};

    ImageToken.setToken($scope.authData.uid);

    $scope.saveUser = function(name, email, alias) {
      if((typeof name === 'undefined')||(name===null)||(name==="")){
        $scope.showAlert('Missing Detail','Please enter your name');
      } else if(!$scope.verifyEmail(email)){
        $scope.showAlert('Missing Detail','Please enter your email');
      } else if((typeof alias === 'undefined')||(alias===null)||(alias==="")){
        $scope.showAlert('Missing Detail','Please enter a unique username');
      } else if(Utilities.checkIfAlphanumericViolation(alias)){
        $scope.showAlert('Bad Username','Please use only A-z and numbers 0-9 with no spaces. You cannot use: '+Utilities.checkIfAlphanumericViolation(alias));
      } else if($scope.isAliasTaken(alias)){
        $scope.showAlert("The username "+alias+" is already taken by another user", "Please try another one");
      } else {
        aliasRef.child($scope.user.alias).set({"uid": $scope.authData.uid}, function(error){
          console.log("Error is "+error);
          if(error){
            $scope.showAlert("The username "+alias+" is already taken by another user");
          } else {
            console.log("update userref");
            userRef.update({
              'alias': $scope.user.alias,
              'name': $scope.user.name,
              'education': $scope.user.education,
              'email': $scope.user.email,
              'writeup': $scope.user.writeup,
              'rating': $scope.user.rating,
              'viewCount': $scope.user.viewCount,
              'balance': $scope.user.balance,
              'schedule':$scope.user.schedule,
              'face': $scope.user.face,
              'memberSince': $scope.user.memberSince,
              'platform': $scope.user.platform
            }, function(){

              if(enableIntercom&&window.cordova){
                intercom.updateUser({ 'email': email, 'name': name });
              }

              console.log("User created "+$scope.user.alias);
              $ionicHistory.nextViewOptions({
                disableBack: true
              });
              $state.go("intro-registerNumber",{"email":$scope.user.email});
            });
          }
        });
      }
    }

  $scope.showMediaSelector = function(labelIndex) {

  // Show the action sheet
    var hideSheet = $ionicActionSheet.show({
    buttons: [{'text':"Take Photo"},{'text':"Choose Photo"}],
    cancelText: 'Cancel',
    cancel: function() {
      // prompt user for other name
    },
    buttonClicked: function(index) {
      //$scope.newSkill.level = levels[index];
      console.log(index);
      if(index==1){
        $scope.uploadImage();
      }else if(index==0){
        $scope.takePicture();
      }

        return true;
      }
    });
  };

  $scope.takePicture = function() {
        var options = {
            quality : 75,
            destinationType : Camera.DestinationType.DATA_URL,
            sourceType : Camera.PictureSourceType.CAMERA,
            allowEdit : true,
            encodingType: Camera.EncodingType.JPEG,
            targetWidth: 300,
            targetHeight: 300,
            popoverOptions: CameraPopoverOptions,
            saveToPhotoAlbum: false,
            correctOrientation: false
        };

      $cordovaCamera.getPicture(options).then(function(pictureData) {
        var imagedata = 'data:image/jpeg;base64,' + pictureData;
        var blob = Utilities.dataURItoBlob(imagedata);

        var imageTokenRef = fb.child("imagetokens/"+$scope.authData.uid);
        var imageToken = "";

        imageTokenRef.once("value", function(snapshot) {
          imageToken = snapshot.val();
          //console.log("Retrieved image token "+imageToken.token);
          var existingToken = (snapshot.val() !== null);
          console.log("Token exists? "+existingToken);

          $scope.user.face = "img/gif/loading_shaking.gif";

          if(!existingToken){
            ImageToken.setToken($scope.authData.uid).then(function(data){
              imageToken = data;

              //2 Get Presigned URL
              ImageToken.postImage($scope.authData.uid,imageToken,blob).then(function(url){
                //var url = data;
                console.log("URL obtained is "+url);
                $scope.user.face = url;
              });

            });
          } else {


            //2 Get Presigned URL  //3 Post to S3 is taken care inside
            ImageToken.postImage($scope.authData.uid,imageToken.token,blob).then(function(url){
              //var url = data["file-url"];
              console.log("URL obtained is "+url);

              $scope.user.face = url;
              //UserSkills.updateFace($scope.authData.uid, $scope.user.face);
              console.log("Uploaded new profile picture");
            });

          }

        });

      });
  }

  $scope.uploadImage = function() {
    imageUploader.getPicture()
    .then(function(pictureData) {

      //1 Token Retrieval or Creation
      var imagedata = 'data:image/jpeg;base64,' + pictureData;
      var blob = Utilities.dataURItoBlob(imagedata);

      var imageTokenRef = fb.child("imagetokens/"+$scope.authData.uid);
      var imageToken = "";

      imageTokenRef.once("value", function(snapshot) {
        imageToken = snapshot.val();
        //console.log("Retrieved image token "+imageToken.token);
        var existingToken = (snapshot.val() !== null);
        console.log("Token exists? "+existingToken);

        $scope.user.face = "img/gif/loading_shaking.gif";

        if(!existingToken){
          ImageToken.setToken($scope.authData.uid).then(function(data){
            imageToken = data;

            //2 Get Presigned URL
            ImageToken.postImage($scope.authData.uid,imageToken,blob).then(function(url){
              //var url = data;
              console.log("URL obtained is "+url);
              $scope.user.face = url;
            });

          });
        } else {


          //2 Get Presigned URL  //3 Post to S3 is taken care inside
          ImageToken.postImage($scope.authData.uid,imageToken.token,blob).then(function(url){
            //var url = data["file-url"];
            console.log("URL obtained is "+url);

            $scope.user.face = url;
            //UserSkills.updateFace($scope.authData.uid, $scope.user.face);
            console.log("Uploaded new profile picture");
          });

        }

      });

    })
  }

  $scope.verifyEmail = function(inputEmail) {
    console.log("input is "+ inputEmail);

    var re              = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    var verified        = re.test(inputEmail);

    console.log('email verification is: '+ verified);
    return verified;
  }

  $scope.isAliasTaken = function(suggested) {
    var existingUser = true;

    aliasRef.child(suggested).on("value", function(snapshot) {

      existingUser = (snapshot.val() !== null);
      console.log("Suggested Alias is taken? "+existingUser);
      return existingUser;
    });
  }
})

.controller('registerNumberCtrl', function($scope, $state, ImageToken, $ionicPlatform, Utilities, $ionicLoading, $http, $ionicHistory, $ionicLoading, $stateParams){

  $scope.authData = fb.getAuth();
  $ionicLoading.hide();
  console.log("No Tel Registered. Proceed to Authy registration");
  $scope.user = {};
  $scope.user.tel = {};
  $scope.user.tel.country = 65;
  $scope.user.email = $stateParams.email;

  $scope.showAlert = Utilities.showAlert;

    $scope.inputUp = function() {
    var isIOS = ionic.Platform.isWebView() && ionic.Platform.isIOS();
    if (isIOS) {
      $scope.data = {};
      $scope.data.keyboardHeight = 216;
      cordova.plugins.Keyboard.disableScroll(true);
    }
  };

  //OTP Portion

  $scope.registernumber = function (country, tel) {
    $ionicLoading.show({
      template: '<p>Requesting OTP</p><ion-spinner icon="spiral"></ion-spinner>'
    });

    $scope.user.tel = {};
    $scope.user.tel.num = tel;
    $scope.user.tel.country = country;

    if(typeof country === 'string'){
      if(country.indexOf("+")!=-1){
        //do substring
        $scope.user.tel.country = parseInt(country.substr(1));
        console.log("Detected +, replacing it");
      } else {
        $scope.user.tel.country = parseInt(country);
        console.log("Converting "+country+" to string");
      }

    } if(typeof tel === 'string'){
      $scope.user.tel.num = parseInt(tel);
      console.log("Conversion needed");
    } else if(typeof tel === 'undefined') {
      $ionicLoading.hide();
      $scope.showAlert('No Number Specified', 'Please specify number');
    }

    if(country == null) {
      $scope.user.tel.country = 65;
    }

    console.log('authy will send to ' + $scope.user.tel.country + ' '+$scope.user.tel.num);

    //Before that, let use check if existing number conflicts
    var telRef = fb.child("country/"+$scope.user.tel.country+"/tel/"+$scope.user.tel.num);
    telRef.once("value").then(function(snapshot) {

      var telExists = snapshot.exists(); // true
      console.log("Existing phone number? "+telExists);

      if(telExists){
        // show error
        $scope.showAlert('Registration Error', 'Sorry! '+tel+' is already registered');
        $ionicLoading.hide();

      } else {
        //proceed with registering

        $http({
          method: 'POST',
          url: 'http://ec2-54-169-215-80.ap-southeast-1.compute.amazonaws.com/register',
          data: { email: $scope.user.email, cellphone: $scope.user.tel.num, countrycode: $scope.user.tel.country }
        }).success(function (data, status, headers, config) {

          console.log('OTP Request Success!');
          console.log('data ' + JSON.stringify(data));
          console.log('status ' + JSON.stringify(status));
          console.log('headers ' + JSON.stringify(headers));
          console.log('config ' + JSON.stringify(config));

          //if("user.id" in data)
          if(data.success) {
            $ionicLoading.hide();
            $scope.user.tel.authyid = data.user.id;
            console.log('authy ' + 'authyid ' + $scope.user.tel.authyid);
            //user must now key in otp
            $ionicHistory.nextViewOptions({
              disableBack: true
            });
            $state.go('intro-verifyNumber',{"country":$scope.user.tel.country,"num":$scope.user.tel.num,"authyid":$scope.user.tel.authyid,"email":$scope.user.email});
          } else if (!data.success) {
            $ionicLoading.hide();
            $scope.showAlert('OTP Error', 'Invalid number');
          }

        }).error(function (data, status, headers, config) {
          $ionicLoading.hide();
          $scope.showAlert('OTP Error', 'Please try again later');
          console.log('error');
          console.log('data ' + JSON.stringify(data));
          console.log('status ' + JSON.stringify(status));
          console.log('config ' + JSON.stringify(config));
        });
      }


    });

  }

})

.controller('verifyNumberCtrl', function($scope, $ionicHistory, $stateParams, $state, ImageToken, $ionicPlatform, Utilities, $ionicLoading, $ionicActionSheet, $http, $ionicPopup){

  $scope.authData = fb.getAuth();
  $scope.showAlert = Utilities.showAlert;
  $scope.user = {};
  $scope.user.tel = {};
  $scope.user.tel.country = $stateParams.country;
  $scope.user.tel.num = $stateParams.num;
  $scope.user.tel.authyid = $stateParams.authyid;
  $scope.user.email = $stateParams.email;
  var userRef = fb.child("users/"+$scope.authData.uid);

  $scope.inputUp = function() {
    var isIOS = ionic.Platform.isWebView() && ionic.Platform.isIOS();
    if (isIOS) {
      $scope.data = {};
      $scope.data.keyboardHeight = 216;
      cordova.plugins.Keyboard.disableScroll(true);
    }
  };

  $scope.verifynumber = function (otp) {

    //first we register intercom without pushes
    try{
      if(window.cordova){
        intercom.registerIdentifiedUser({'userId': $scope.authData.uid});
      } else {
        console.log("Warning! Intercom Not Enabled Because Desktop Mode");
      }
    } catch (err){
      console.log("Warning! Intercom Not Enabled");
      //$scope.showAlert('Session Expired','Please login again');
    }

    $ionicLoading.show({
      template: '<p>Checking OTP</p><ion-spinner icon="spiral"></ion-spinner>'
    });



     if(typeof otp == 'undefined'){
      $scope.showAlert('Missing OTP', 'Please enter OTP');
      $ionicLoading.hide();
    } else {
      $http({
        method: 'POST',
        url: 'http://ec2-54-169-215-80.ap-southeast-1.compute.amazonaws.com/verify',
        data: { authyid: $scope.user.tel.authyid, verifycode: otp }
      }).success(function (data, status, headers, config) {
        console.log('OTP Submit Done!');
        console.log('data ' + JSON.stringify(data));
        console.log('status ' + JSON.stringify(status));
        console.log('config ' + JSON.stringify(config));

        $ionicLoading.hide();

        if(data) {
          var countryUsersRef = fb.child("country/"+$scope.user.tel.country+"/users/"+$scope.authData.uid);
          countryUsersRef.set($scope.user.tel.num);
          var countryTelRef = fb.child("country/"+$scope.user.tel.country+"/tel/"+$scope.user.tel.num);
          countryTelRef.set($scope.authData.uid);

          userRef.update({
            'tel': $scope.user.tel
          }, function(){

          
            if (enableIntercom&&window.cordova) {
              intercom.updateUser({ 'tel': $scope.user.tel.num, 'telCountry': $scope.user.tel.country });
            }

          });

          var option ={};
          option.value = $scope.user.tel.country;

          switch(option.value){

            case 65:
            fbCountry = fb;
            option.name = 'Singapore';
            option.flag = 'img/countries/Singapore.png';
            option.currency = "$";
            break;

            case 60:
            fbCountry = fb.child(option.value);
            option.name = 'Malaysia'
            option.flag = 'img/countries/Malaysia.png';
            option.currency = "RM";
            break;

            default:
            fbCountry = fb;
            option.name = 'Singapore'
            option.flag = 'img/countries/Singapore.png';
            option.currency = "$";
            break;
          }

      //set defaultcountry in fb
      userRef.update({defaultcountry:option}).then(function(){
        //set localstorage
        storage.setItem("defaultCountry", JSON.stringify(option));

        $scope.referralSurvey();
        //$state.go('tab.dash');
      });
        } else {
          $scope.showAlert('Incorrect OTP', 'Please check your SMS again');
        }

      }).error(function (data, status, headers, config) {
        $scope.showAlert('Incorrect OTP', 'Please check your SMS again');
        console.log('OTP Verification Fail!');
        console.log('data ' + JSON.stringify(data));
        console.log('status ' + JSON.stringify(status));
        console.log('headers ' + JSON.stringify(headers));
        console.log('config ' + JSON.stringify(config));
      });
    }
  }

  $scope.resendotp = function () {

    var confirmPopup = $ionicPopup.confirm({
      title: 'Resend OTP',
      template: 'Are you sure you want to resend your OTP?'
    });

    confirmPopup.then(function(res) {
      if(res) {
        console.log('reopening register number modal');
        $ionicHistory.nextViewOptions({
          disableBack: true
        });
        $state.go('intro-registerNumber',{"email":$scope.user.email})
      } else {
        console.log('resend cancelled');
      }
    });
  }

  $scope.referralSurvey = function() {

    var levelArray = [
      {'text':"Facebook Videos"},
      {'text':"Poster & Flyers"},
      {'text':"TuitionJiejie"},
      {'text':"Instagram"},
      {'text':"Internet Search"},
      {'text':"News & Tech Blogs"},
      {'text':"Word of Mouth"}
    ];

    // Show the action sheet
    var hideSheet = $ionicActionSheet.show({
      buttons: levelArray,
      titleText: 'How did you hear about Learnly?',
      destructiveText: 'Referral Code',
      cancelText: 'Cancel',
      cancel: function() {
        // prompt user for other name
        $state.go('tab.dash');
      },
      buttonClicked: function(index) {
        //$scope.newSkill.level = levels[index];
        console.log("Selected "+levelArray[index].text);
        $scope.user.origin = levelArray[index].text;
        //$scope.selectLevel(levelArray[index].text);
        if(enableIntercom&&window.cordova){
          intercom.updateUser({
            'custom_attributes': {
              'origin': $scope.user.origin
            }
          });

        }
        $state.go('tab.dash');

        return true;
      },
      destructiveButtonClicked: function(){
        console.log("Checking referral code");

        $scope.refItem = {};

        var myPopup = $ionicPopup.show({
          template: '<input type="text" ng-model="refItem.refCode">',
          title: 'Referral Code',
          subTitle: 'Please input referral code (case sensitive)',
          scope: $scope,
          buttons: [
            { text: 'Cancel',
              onTap: function(e) {
                $scope.referralSurvey();
              }
            },
            {
              text: '<b>Save</b>',
              type: 'button-positive',
              onTap: function(e) {
                console.log($scope.refItem.refCode);

                //check alias exist

                var checkRef = fb.child("alias/"+$scope.refItem.refCode);
                checkRef.once("value").then(function(snapshot) {

                  var refExists = snapshot.child("uid").exists(); // true
                  console.log(refExists);

                  if(refExists){
                    $scope.referrerid = snapshot.val().uid;
                    console.log($scope.referrerid);

                    userRef.update({'referralcode':$scope.referrerid});
  /*
                    var referrerRef = fb.child("users/"+$scope.referrerid);
                    referrerRef.once("value").then(function(snapshot) {
                      $scope.oldBalance = snapshot.val().balance;
                      console.log('old balance: '+$scope.oldBalance);

                      referrerRef.update({'balance': $scope.oldBalance+$scope.referralBonus})
                    });

                    var refereeRef = fb.child("users/"+$scope.authData.uid);
                    refereeRef.once("value").then(function(snapshot) {
                      $scope.oldBalance = snapshot.val().balance;
                      console.log('old balance: '+$scope.oldBalance);

                      refereeRef.update({'balance': $scope.oldBalance+$scope.referralBonus})
                    });
  */
                    //credit alias
                    //credit self
                    //success

                    if(enableIntercom&&window.cordova){
                      intercom.updateUser({ 'referralcode': $scope.referrerid });
                    }

                    var alertPopup = $ionicPopup.alert({
                      title: 'Great Job',
                      template: 'Refer your friends for more credits!'
                    });

                    $state.go('tab.dash');

                  }
                  else {

                    var alertPopup = $ionicPopup.alert({
                      title: 'Referral code does not exist',
                      template: 'Please try another one'
                    });
                    alertPopup.then(function(res) {
                      $scope.referralSurvey();
                    });

                  }

                });

              }
            }
          ]
        });


          return true;
        }
      });
    }

})

//tab controls for notifications

.controller('ChatTabCtrl', function ($scope, $rootScope, $ionicPlatform, $interval, $cordovaBadge) {

  $interval(function () {
    $scope.data = {
      badgeCount: chatvalue
    };
  }, 1000);

  $scope.clear = function () {
    //chatvalue
    chatvalue = 0;
    //chatvalue++;
    console.log('chatvalue is '+chatvalue);

    if(window.cordova){
      $cordovaBadge.hasPermission().then(function(yes) {
        // You have permission
        $cordovaBadge.clear();
      }, function(no) {
        // You do not have permission
      });
    }

  }

})

.controller('TabCtrl', function ($ionicScrollDelegate, $ionicTabsDelegate, $interval, $scope, $state, $window, $rootScope, $cordovaDevice, $ionicModal, $ionicActionSheet, $ionicLoading, Geolocation, Carousel, UserSkills, Push, $ionicHistory, $ionicSlideBoxDelegate, $q, $timeout, $http, $cordovaBadge, imageUploader, ImageToken, Utilities, UserAction, Skills, Auth) {

  $scope.authData = fb.getAuth();
  var aliasRef = fb.child("alias");

  $rootScope.showWorkshops = true;
  //Utilities.setPermissions();

/*
//inside html ng-click="myTabSelected(0)"

  $scope.myTabSelected = function(index){
    if ($ionicTabsDelegate.selectedIndex() == index){ // this is the index of the selected tab
        $ionicScrollDelegate.scrollTop(true);
    }
    // we need to change the tab by ourselves
    $ionicTabsDelegate.select(index);
  }
  */


})

//Main App Controllers



.controller('DashCtrl', function($ionicPopover, $ionicPlatform, $ionicPopup, $scope, $state, $window, $rootScope, $cordovaDevice, $ionicModal, $ionicActionSheet, $ionicLoading, Geolocation, Carousel, UserSkills, Push, $ionicHistory, $ionicSlideBoxDelegate, $q, $timeout, $http, $cordovaBadge, imageUploader, ImageToken, Utilities, UserAction, Skills, Auth, $cordovaCamera, $cordovaClipboard) {
  console.log("App version is "+appVersion);
  console.log("Viewing Dash View "+$state.current);
  //Help this controller determine the current Auth state
  $scope.authData = fb.getAuth();
  var aliasRef = fb.child("alias");

  $scope.defaultCountry = {};

  $scope.countryOptions = Utilities.getCountryOptions();

  Utilities.setCountry().then(function(){
    Utilities.setPermissions();
    $scope.defaultCountry = Utilities.getCurrentCountry();
    console.log("DashCtrl Country assigned "+$scope.defaultCountry.value);
    //console.log("dash1")
  }).then(function(){ 
  //localstorage

  $ionicPopover.fromTemplateUrl('templates/dash/locationpop.html', {
    scope: $scope,
  }).then(function(popover) {
    $scope.popover = popover;
  });

  $scope.openPopover = function($event) {
    $scope.popover.show($event);
    //document.querySelector('#countrypopover').click();
  };
  $scope.closePopover = function() {
    $scope.popover.hide();
  };
  // Execute action on hide popover
  $scope.$on('popover.hidden', function() {
    // Execute action
  });
  // Execute action on remove popover
  $scope.$on('popover.removed', function() {
    // Execute action
  });

  //takes a JSON option object
  $scope.selectCountry = function(option){
    console.log(JSON.stringify(option)+' selected');
    console.log("option name "+option.name)

    //if option name differs form what was stored
    //console.log(option.name);
    //console.log($scope.defaultCountry.name);
    //console.log($scope.user.defaultcountry);

    if(option.name!=$scope.defaultCountry.name||$scope.user.defaultcountry==null){
      console.log("country switch")
      switch(option.name){

        case 'Singapore':
        fbCountry = fb;
        break;

        case 'Malaysia':
        fbCountry = fb.child(option.value);
        break;

        case 'Thailand':
        fbCountry = fb.child(option.value);
        break;

        default:
        fbCountry = fb;
        break;
      }

      //set defaultcountry in fb
      userRef.update({defaultcountry:option}).then(function(){
        //set localstorage
        storage.setItem("defaultCountry", JSON.stringify(option));

        $scope.closePopover();
        //reload carousell
        $window.location.reload();
      });
    }
  };

  //logout users that are not properly logged in
  try{
    $ionicHistory.clearHistory();
    console.log("Attempt retrieve user "+$scope.authData.uid+" for DashCtrl");
  } catch (err){
    console.log("Warning! Session Expired");
    $scope.showAlert('Session Expired','Please login again');
    $scope.logout();
  }

  var userRef = fb.child("users/"+$scope.authData.uid);
  var userAliasRef = userRef.child('alias');
  var userHistoryRef = userRef.child('memberSince');

  try{
    if(window.cordova){
      intercom.registerIdentifiedUser({'userId': $scope.authData.uid});
      console.log("Let's start Pushes");
      var device = $cordovaDevice.getDevice();
      initPushwoosh($state,$window,$scope.authData.uid, device, $cordovaBadge);
    } else {
      console.log("Warning! Intercom Not Enabled Because Desktop Mode");
    }
  } catch (err){
    console.log("Warning! Intercom Not Enabled");
    //$scope.showAlert('Session Expired','Please login again');
  }

  $scope.openAppstore = function () {
    if ($ionicPlatform.is('ios')) {
      console.log("ios");
      window.open('itms-apps://itunes.apple.com/sg/app/learnly-find-tutor-singapore-tuition-teachers/id1059631214?mt=8&ign-mpt=uo%3D4');
    } else if ($ionicPlatform.is('android')) {
      console.log("Android");
      window.open('market://details?id=sg.belearnly.learnly&hl=en', '_system');
    }
  }

  $ionicModal.fromTemplateUrl('templates/utility/update.html', {
    id: '0',
    scope: $scope,
    backdropClickToClose: false,
    animation: 'slide-in-up',
    hardwareBackButtonClose: false
  }).then(function(modal) {
    $scope.oModal0 = modal;
  });

  $scope.openModal = function(index) {
    var selectedModal = 'oModal' + index;
    $scope[selectedModal].show();
  };

  var versionRef = fb.child("version");
  versionRef.on("value", function(snapshot){
    console.log(snapshot.val());
    //var legacyVer = snapshot.legacy;
    var betaVer = snapshot.val().beta;
    $scope.stableVer = snapshot.val().stable;
    console.log( $scope.stableVer + " vs " + appVersion);
    if(appVersion != '0.0.0'){
      if(appVersion==betaVer){
        //do nothing
      } else if($scope.stableVer > appVersion){
        console.log("prompt");
        $scope.openModal(0);
      }
    }
  });

  $scope.logout = function() {
    Auth.logout();
    $scope.authData = Auth.getAuth();
    $ionicHistory.nextViewOptions({
      disableBack: true
    }); //this should be null
    $state.go('intro');


    $timeout(function () {
      $ionicHistory.clearCache();
      $ionicHistory.clearHistory();
    }, 1500)
  }
/*
  Auth.userRef().$bindTo($scope, "user").then(function(){
*/
    $scope.setup = function(){
        //INTERCOM COLLECTION
        userRef.once("value", function(snapshot) {
            $scope.user = snapshot.val();

            var haveProfilePic = false;
            if($scope.user.face){
              if($scope.user.face==="img/assets/placeholder.png"){
                haveProfilePic = false;
              } else {
                haveProfilePic = true;
              }
            }

            var haveWriteup = false;
            if($scope.user.writeup){
              if($scope.user.writeup==="Short writeup about myself"){
                haveWriteup = false;
              } else {
                haveWriteup = true;
              }
            }

            var haveLocation = false;
            if($scope.user.location){
              if($scope.user.location.name){
                haveLocation = true;
              }
            }
            console.log("User has location "+haveLocation);

            var haveVerification = false;
            try {
              if(typeof $scope.user.verify !== 'undefined'){
                if($scope.user.verify.complete){
                  haveVerification = true;
                  UserSkills.updateVerified($scope.authData.uid,true);
                }
              }
              console.log("User has verification "+haveVerification);

            } catch(err){
              console.log("Do nothing");
            }


            var haveQualifications = false;
            if($scope.user.education.sch.shortname!=="None"){
              haveQualifications = true;
            }
            console.log("User has qualifications "+haveQualifications);

            var haveSchedule = false;
            if(Utilities.checkIfHaveSchedule($scope.user.schedule)){
              haveSchedule = true;
            }
            console.log("User has schedule "+haveSchedule);

            var haveSkills = 0;
            userRef.child("skills").once("value", function(data){
              haveSkills = data.numChildren();
              console.log("User has "+haveSkills+" skills");

              if(enableIntercom&&window.cordova&&(pushToken!="")){
                intercom.updateUser({
                  'email': $scope.user.email,
                  'name': $scope.user.name,
                  'custom_attributes': {
                    'haveWriteup': haveWriteup,
                    'haveProfilePic': haveProfilePic,
                    'haveSkills':haveSkills,
                    'haveQualifications': haveQualifications,
                    'haveSchedule': haveSchedule,
                    'haveLocation': haveLocation,
                    'havePush': true,
                    'haveVerification': haveVerification
                  }
                });
              }

            });

            //set default country

            console.log('checking default country '+JSON.stringify($scope.user.defaultcountry));
            if(($scope.user.defaultcountry == null)&&($scope.user.tel.country)){
              /*
              document.querySelector('#countrypopover').click();
              console.log("location popover open");
              */
              console.log("No Default Country, Automatic Assignment Using Telephone Country Code");

              var thisCountryOption = $scope.countryOptions[$scope.user.tel.country];
              console.log("Assigned "+thisCountryOption.name);

              //also auto assign for existing verified tutors
              $scope.selectCountry(thisCountryOption);


            }

            if(haveVerification && $scope.user.verify.origin == null){
                userRef.child("verify").update({"origin":$scope.user.tel.country});
            }

            //end of userref
        });

        if(pushToken==""){
          pushToken = storage.getItem("PWToken");
        }
        //if its still empty
        if(pushToken!=""){
          Push.setToken($scope.authData.uid,pushToken);

        } else if(pushToken==""){
          //$scope.showAlert('You Disabled Push Notification','You may not be receiving lesson alerts. Please turn on from your phone\'s System Settings.');

          $timeout(function() {
            if(pushToken==""){
              $scope.showAlert('You Disabled Push Notification','You may not be receiving lesson alerts. Please turn on from your phone\'s System Settings.');
              console.log("No push token found");
            }

          }, 15000);

        }else {
          console.log("No token was set");
        }

        console.log("End of push segment");
    }

    //loading spinner while the Carousels are being loaded
    $ionicLoading.show({
      template: '<p>Preparing Store</p><ion-spinner icon="spiral"></ion-spinner>'
    });

    var loadTimer = $timeout(checkConnection, 5000);

    function checkConnection() {
      $ionicLoading.hide();
      if ($scope.tuition==null||typeof $scope.tuition == 'undefined'){
        $scope.showAlert('Please check your Connection');
      }
    }


    console.log("Checking location for "+$scope.authData.uid+" for DashCtrl");
    //checks if user has existing location
    //if none, get a location from GPS and store it
    //also updates the user recent time
    Geolocation.setUserLocation($scope.authData.uid);

    $scope.setup();

    $scope.specialFestival = Carousel.getArray("specialFestival");
    //Slide Page 1
    $scope.tuition = Carousel.getArray("tuition");

    //Slider Page 2
    $scope.popular = Carousel.getArray("popular5");
    $scope.sports = Carousel.getArray("sports");
    $scope.music = Carousel.getArray("music");
    $scope.coding = Carousel.getArray("coding");


    $scope.displaySubject = "Physics";

    $scope.showRandomSubjectTutors = function() {
      switch(Math.floor((Math.random() * 10) + 1)){
        case 1:
        $scope.displaySubject = "GP";
        break;
        case 2:
        $scope.displaySubject = "Chinese";
        break;
        case 3:
        $scope.displaySubject = "Maths";
        break;
        case 4:
        $scope.displaySubject = "Biology";
        break;
        case 5:
        $scope.displaySubject = "Economics";
        break;
        case 6:
        $scope.displaySubject = "English";
        break;
        case 7:
        $scope.displaySubject = "Science";
        break;
        case 8:
        $scope.displaySubject = "Physics";
        break;
        case 9:
        $scope.displaySubject = "Chemistry";
        break;
      }

      UserSkills.getCoaches($scope.displaySubject,'location/time', 6).then(function(coachList){
        console.log('Quickly retrieved 6 coaches');
        $scope.results = coachList;
        //var counter = 0;
        //$timeout.cancel(loadTimer);
        $ionicLoading.hide();
      });
    }

    $scope.showRandomSubjectTutors();

    var jobsRef = fbCountry.child("jobs");
    jobsRef.orderByChild("time").limitToLast(3).on("value", function(snapshot){
      var tutorOffers = snapshot.val();
      console.log("Retrieving Jobs/Offers");

      $scope.tutorOffers = Utilities.convertToArrayWithKey(tutorOffers);

    });
/*
  });
*/

  $scope.abstract = Utilities.TextAbstract;
  $scope.showAlert = Utilities.showAlert;

  $scope.categorySlideIndex = 0;

  $scope.categorySlideTo = function(index) {
    $ionicSlideBoxDelegate.slide(index);
  };

  // Called each time the slide changes
  $scope.categorySlideChanged = function(index) {
    $scope.categorySlideIndex = index;
  };

  $scope.shareWithFriend = function(){

      $scope.whatsappShare = function(){
        var refCode = $scope.user.alias;
        window.open('whatsapp://send?text=Hey, check out the Learnly app! Simplest way for tutors and students to connect with each other. Download now at http%3A%2F%2Fhyperurl.co/learnlyapp Use my referral code : '+refCode +' to get started!', '_system');
        return false;

      }

      $scope.facebookShare = function(){
        var refCode = $scope.user.alias;
        window.open('fb-messenger://share?link=Hey, check out the Learnly app! Simplest way for tutors and students to connect with each other. Download now at http%3A%2F%2Fhyperurl.co/learnlyapp Use my referral code : '+refCode +' to get started!', '_system');
        return false;

      }

      $scope.share = function(){
        var refCode = $scope.user.alias;
        window.plugins.socialsharing.share(
          'Hey, check out the Learnly app! Simplest way for tutors and students to connect with each other. Use my referral code : '+refCode +' to get started!',
          'Use Learnly to Find Tutors or Teach Lessons',
          "https://learnly.sg/pics/learnly-logo.png",
          'http://hyperurl.co/learnlyapp'
        );
      }

      var hideSheet = $ionicActionSheet.show({
         buttons: [
           { text: 'Facebook' },
           { text: 'Whatsapp' },
           { text: 'Contacts' },
           { text: 'Copy Code'}
         ],
         //destructiveText: 'Delete',
         titleText: "Invite Friends Through",
         cancelText: 'Cancel',
         cancel: function() {
              // add cancel code..
            },
         buttonClicked: function(index) {
           console.log('BUTTON CLICKED', index);

           switch(index){
            case 0: $scope.facebookShare(); break;
            case 1: $scope.whatsappShare(); break;
            case 2: $scope.share($scope.authData.uid, $scope.user.name, $scope.user.alias, $scope.user.face); break;
            case 3: $cordovaClipboard.copy($scope.user.alias); break;
           }

           return true;
         }
       });
    }

  /*
  $scope.uploadImage = function() {
  imageUploader.getPicture()
  .then(function(data) {

  $scope.user.face = 'data:image/jpeg;base64,' + data;
  //Need to update the other assets
  //UserSkills & Jobs & Chats & Reviews
  //UserSkills.updateFace($scope.authData.uid, $scope.user.face);
  console.log("Uploaded new Base64 profile");
})
}
*/




  //used to generate the user rating picture array
  $scope.makeArrayOfSize = Utilities.makeArrayOfSize;
  Skills.all();
  });


//for coupon testing
//$scope.showSurvey();

})

//Learnly search page controller

.controller('SearchCtrl', function($rootScope, $scope, $state, $ionicScrollDelegate, $ionicLoading, $ionicActionSheet, Skills, UserSkills, Utilities, Geolocation, Categories, $stateParams, $timeout, $geofire, geohash, $cordovaGeolocation, moment, $ionicModal, Places) {

  $scope.authData = fb.getAuth();
  $scope.currentview = $state.current.name;
  $scope.places = Places.all();
  console.log("Now viewing "+$scope.currentview);

  $scope.search = {};  //needed for the keyWord, do not delete
  //Utilities.setCountry();
  $scope.defaultCountry = Utilities.getCurrentCountry();
  $scope.categories = Categories.all($scope.defaultCountry.value);
  $scope.originalKeyword = $stateParams.keyWord;
  $scope.location = {};
  $scope.activeFilter = "+distance";
  $scope.filtertosearch = 'distance';
  //default filter for search results displayed
  $scope.badSearchResult = false; //for checking if subject exists
  $scope.searchradius = 15;
  $scope.geofireload = [];
  //$scope.url = $stateParams.url;
  var geofirelistener;
  var geofirefinisher;
  var destroy = false;
  var geoQueryCallback;
  var geoQueryCallback2;
  var filterChangedAfterLevel = false;
  //shows a gif for the loading screen
  $scope.randomGif = Utilities.randomGif;

  //setCountry($rootScope);

  $scope.getSkillPic = function(skillName) {
    return Skills.getByName(skillName).pic;
  }


  if((typeof $stateParams !== "undefined")&&($scope.search.keyWord !== "")){
    $scope.search.keyWord = $stateParams.keyWord;
    if (enableIntercom&&window.cordova) {
        intercom.updateUser({ 'lastSearchedSubject': $scope.search.keyWord});
        intercom.logEvent("SearchCtrl", {
              'event_at': new Date().getTime(),
              'subject': $scope.search.keyWord
          });
    }
  }

  //AngularJS does not update the scope.results variable without any user input (i.e. touch)
  //Despite the fact that search.keyword has changed
  //Therefore we need to use scope.$watch to monitor for changes in search.keyword
  //And ask Firebase for new results

  //A Loading window is shown while results are being retrieved
  //Once $scope.watch notices that scope.results has changed, it will stop the Loading window

  $scope.$watch('search.keyWord', function() {

    console.log("CHANGE IN KEYWORD TO "+$scope.search.keyWord+" OCCURRED");
    $scope.badSearchResult = false;
    $scope.geofireload = [];

    //reset all variables
    $scope.currentSearchLimit = {
      "num": 30,
      "checked" : false
    };
    $scope.coachCount = null;
    UserSkills.getCoachCount($scope.search.keyWord, 'general').then(function(count){
        $scope.coachCount = count;
        $scope.currentSearchLimit.limit = count;
        $scope.currentSearchLimit.checked = true;
      });

    $ionicLoading.show({
      template: '<ion-spinner icon="spiral"></ion-spinner>'
    });

    if(($scope.search.keyWord == "")||(typeof $scope.search.keyWord == "undefined")){
      console.log("No valid input");
      $scope.results = [];

    } else {
      //var moment = require('moment');
      var activeDuration = 10368000000;
      //Asks UserSkills service to search the offline Categories/Subjects Service first before going online to asking FB
      //this would include autofilling in aliases
      UserSkills.checkIfExistingSubject($scope.search.keyWord).then(function(existing){
        //performs an internal check before going online to firebase

        if(existing){
          $scope.results = [];

            if($scope.search.keyWord==="Maths"||$scope.search.keyWord==="English"){
              $scope.searchradius = 10;
              console.log("Reduced radius to speed up popular search result");
            }
            var defaultOptions = { timeout: 5000, enableHighAccuracy: true };

            $cordovaGeolocation.getCurrentPosition(defaultOptions).then(function(position){
              console.log("Geolocation success!");
              $scope.location.lat = position.coords.latitude;
              $scope.location.lon = position.coords.longitude;
              //console.log("Retrieved current location Lat:"+$scope.location.lat+" Lon:"+$scope.location.lon);
              var geocoder = new google.maps.Geocoder();
              var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
              var request = {
                latLng: latlng
              };
              geocoder.geocode(request, function(data, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                  if (data[0] != null) {
                    console.log("address is: " + data[0].formatted_address);
                    $scope.location.name = data[0].formatted_address;
                  } else {
                    $scope.location.name = 'Unknown';
                  }
                }
              })
                $scope.search.currentLevel = "All Levels";
              //Testing Geofire
              var skillRef = fbCountry.child("userskills/"+$scope.search.keyWord+"/general");
              if (destroy == false) {
                var $geo = $geofire(skillRef);
                var query = $geo.$query({
                  center: [$scope.location.lat, $scope.location.lon],
                  radius: $scope.searchradius
                });
              }

              /*var listenerid = Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
              console.log(listenerid);*/
              if(!$scope.$$listeners.hasOwnProperty($scope.search.keyWord)){
                geofirelistener = $scope.$on($scope.search.keyWord, function (event, key, location, distance) {
                  // Do something interesting with object
                  skillRef.child(key).on("value", function(snapshot) {
                    var tempHolder = snapshot.val();
                    tempHolder.distance = distance*1000;
                    tempHolder.key = key;
                    var currentTime = (new Date()).getTime();
                    var expiryTime = currentTime - activeDuration;
                    //console.log("Current time "+moment(currentTime).format("Do MMMM YYYY")+" whereas Expiry "+moment(expiryTime).format("Do MMMM YYYY"));
                    if((tempHolder.hasOwnProperty('location'))&&(tempHolder.location.time > expiryTime)&&(tempHolder.location.hasOwnProperty('time'))){
                      $scope.geofireload.push(tempHolder);
                    }
                  });
                });
                geofirefinisher = $scope.$on($scope.search.keyWord+"finished", function () {
                  console.log("GeoQuery halted");
                  if($scope.activeFilter=='+distance'){
                      $scope.results = $scope.geofireload;
                      if($scope.results.length==0){
                        $scope.badSearchResult = true;
                      }
                      console.log("Number of tutors within location after active filter: " +$scope.results.length);
                    }
                });
              }
              if(destroy==false){
                geoQueryCallback = query.on("key_entered", $scope.search.keyWord);
                geoQueryCallback2 = query.on("ready", $scope.search.keyWord+"finished");
              }
            }, function(error){
              console.log("Could not get location");
              Geolocation.getExistingLocation($scope.authData.uid).then(function(existingLocation){

                $scope.location = {};

                if((existingLocation == null)){
                  $scope.location.lat = 1.351236;
                  $scope.location.lon = 103.848456;
                  $scope.location.name = 'Bishan';
                } else {
                  $scope.location = existingLocation;
                }

                console.log("Retrieved location from user profile in SearchCtrl", $scope.location);
                $scope.search.currentLevel = "All Levels";
                //Testing Geofire
                if (destroy == false) {
                var skillRef = fbCountry.child("userskills/"+$scope.search.keyWord+"/general");
                var $geo = $geofire(skillRef);
                var query = $geo.$query({
                  center: [$scope.location.lat, $scope.location.lon],
                  radius: $scope.searchradius
                });
              }
                if(!$scope.$$listeners.hasOwnProperty($scope.search.keyWord)){
                  geofirelistener = $scope.$on($scope.search.keyWord, function (event, key, location, distance) {
                    // Do something interesting with object
                    skillRef.child(key).on("value", function(snapshot) {
                      var tempHolder = snapshot.val();
                      tempHolder.distance = distance*1000;
                      tempHolder.key = key;
                      var currentTime = (new Date()).getTime();
                      var expiryTime = currentTime - activeDuration;
                     // console.log("Current time "+moment(currentTime).format("Do MMMM YYYY")+" whereas Expiry "+moment(expiryTime).format("Do MMMM YYYY"));
                      if((tempHolder.hasOwnProperty('location'))&&(tempHolder.location.time > expiryTime)&&(tempHolder.location.hasOwnProperty('time'))){
                        $scope.geofireload.push(tempHolder);
                      }
                    });
                  });
                  geofirefinisher = $scope.$on($scope.search.keyWord+"finished", function () {
                    console.log("GeoQuery halted on error");
                    if($scope.activeFilter=='+distance'){
                      $scope.results = $scope.geofireload;
                      if($scope.results.length==0){
                        $scope.badSearchResult = true;
                      }
                      console.log("Number of tutors within location after active filter: " +$scope.results.length);
                    }
                  });
                  if (destroy == false) {
                    geoQueryCallback = query.on("key_entered", $scope.search.keyWord);
                    geoQueryCallback2 = query.on("ready", $scope.search.keyWord+"finished");
                  }
                }
              });
            });

            if ($scope.activeFilter != '+distance'){
            UserSkills.getCoachesByLevel($scope.search.keyWord, level, $scope.filtertosearch, $scope.currentSearchLimit.num).then(function(coachList){
              console.log("Non distance search");
              for(var i=0;i<coachList.length;i++){
                if($scope.location.lat !=null&& $scope.location.lon!=null&&coachList[i].location.lat!=null&&coachList[i].location.lon!=null){
                coachList[i].distance = Geolocation.getDistanceBetween($scope.location.lat, $scope.location.lon, coachList[i].location.lat, coachList[i].location.lon);
              }
              }
            if(filterChangedAfterLevel == false){
              $scope.results = coachList;
              if($scope.results.length==0){
                $scope.badSearchResult = true;
              }
              console.log("Number of tutors within location after active filter: " +$scope.results.length);
            }
            }).catch(function(error){
              console.log(error);
              console.log("Bad search");
              $scope.badSearchResult = true;
              $ionicLoading.hide();
            });
          }
        } else {
          $scope.results = [];
          var onlineKeyword = $scope.search.keyWord;

          //checks if keyword is an existing Alias
          //if keyword contains a @ as first character
          //remove the @, for ease of searching the Alias
          if($scope.search.keyWord.substring(0,1)==="@"){

            onlineKeyword = $scope.search.keyWord.substring(1);
            console.log("Online keyword is now "+onlineKeyword);
          }

          Utilities.checkIfExistingAlias(onlineKeyword).then(function(useralias){
            //retrieves the user id if its an existing alias
            console.log("User id "+useralias);
            if(useralias!== null){
              UserSkills.getCoach(useralias).then(function(person){
                console.log("Retrieved person named "+person.name);
                $scope.results = ['placeholder'];
                $scope.results[0] = person;
                $scope.results[0].key = useralias;

                //Missing the rate and various subject levels
              });
            }
          });
          $scope.badSearchResult = true;
          $ionicLoading.hide();
        }
      });
    }
    //
    $timeout(function() {
      $ionicLoading.hide();
    }, 5000);

  });

  $scope.$on('$destroy', function() {
      console.log('Destroying modals...');
      $scope.oModal0.remove();
      destroy = true;
      if(geoQueryCallback != null){
      geoQueryCallback.cancel();
      geoQueryCallback2.cancel();
    }
  })

  //Collapsible list controllers
  $scope.toggleGroup = function(group) {
    if ($scope.isGroupShown(group)) {
      $scope.shownGroup = null;
    } else {
      $scope.shownGroup = group;
    }
  };
  $scope.isGroupShown = function(group) {
    return $scope.shownGroup === group;
  };

  //Sorting by price, distance or popularity
  $scope.distancefilter = function(){
    filterChangedAfterLevel = true;
    $scope.activeFilter = '+distance';
    $scope.filtertosearch = 'distance';
    $scope.results = $scope.geofireload
  }

  $scope.ratefilter = function(){
    $scope.currentSearchLimit.num = 30;
    filterChangedAfterLevel = true;
    $scope.activeFilter = '+rate';
    $scope.filtertosearch = 'rate';
    $scope.results = [];
    if(typeof $scope.search.currentLevel ===undefined|| $scope.search.currentLevel=='All Levels'){
      level = "general";
    }else{
      level = $scope.search.currentLevel;
    }
    UserSkills.getCoachesByLevel($scope.search.keyWord, level, $scope.filtertosearch, $scope.currentSearchLimit.num).then(function(coachList){
      for(var i=0;i<coachList.length;i++){
        if($scope.location.lat !=null&& $scope.location.lon!=null&&coachList[i].location.lat!=null&&coachList[i].location.lon!=null){
          coachList[i].distance = Geolocation.getDistanceBetween($scope.location.lat, $scope.location.lon, coachList[i].location.lat, coachList[i].location.lon);
        }
      }
      if($scope.activeFilter=='+rate'){
        $scope.results = coachList;
        if($scope.results.length==0){
          $scope.badSearchResult = true;
        }
        console.log("Number of tutors within location after active filter: " +$scope.results.length);
      }
    }).catch(function(error){
      console.log(error);
      $scope.badSearchResult = true;
      $ionicLoading.hide();

    });
  }

  /*$scope.ratingfilter = function(){
    $scope.currentSearchLimit = {
      "num": 30,
      "checked" : false
    };
    filterChangedAfterLevel = true;
    $scope.activeFilter = '-ratings';
    $scope.filtertosearch = 'rating';
    $scope.results = [];
    if($scope.search.currentLevel ===undefined || $scope.search.currentLevel == 'All Levels'){
      var level = "general";
    }else{
      level = $scope.search.currentLevel;
    }

    UserSkills.getCoachesByLevel($scope.search.keyWord, level, $scope.filtertosearch, $scope.currentSearchLimit.num).then(function(coachList){
      for(var i=0;i<coachList.length;i++){
        if($scope.location.lat !=null&& $scope.location.lon!=null&&coachList[i].location.lat!=null&&coachList[i].location.lon!=null){
          coachList[i].distance = Geolocation.getDistanceBetween($scope.location.lat, $scope.location.lon, coachList[i].location.lat, coachList[i].location.lon);
        }
      }
      if($scope.activeFilter=='-ratings'){
        $scope.results = coachList;
        if($scope.results.length==0){
          $scope.badSearchResult = true;
        }
        console.log("Number of tutors within location after active filter: " +$scope.results.length);
      }
      UserSkills.getCoachCount($scope.search.keyWord).then(function(count){
        $scope.coachCount = count;
        $scope.currentSearchLimit.limit = count;
        $scope.currentSearchLimit.checked = true;
      });

      $ionicLoading.hide();
    }).catch(function(error){
      console.log(error);
      console.log("Bad search");
      $scope.badSearchResult = true;

    });
  }

  $scope.verifiedfilter = function(){
    $scope.currentSearchLimit = {
      "num": 30,
      "checked" : false
    };
    filterChangedAfterLevel = true;
    $scope.activeFilter = '+verified';
    $scope.filtertosearch = 'verified';
    $scope.results = [];
    if($scope.search.currentLevel ===undefined || $scope.search.currentLevel=='All Levels'){
      var level = "general";
    }else{
      level = $scope.search.currentLevel;
    }

    UserSkills.getCoachesByLevel($scope.search.keyWord, level, $scope.filtertosearch, $scope.currentSearchLimit.num).then(function(coachList){
      for(var i=0;i<coachList.length;i++){
        if($scope.location.lat !=null&& $scope.location.lon!=null&&coachList[i].location.lat!=null&&coachList[i].location.lon!=null){
          coachList[i].distance = Geolocation.getDistanceBetween($scope.location.lat, $scope.location.lon, coachList[i].location.lat, coachList[i].location.lon);
        }
      }
      if($scope.activeFilter=='+verified'){
        $scope.results = coachList;
        if($scope.results.length==0){
          $scope.badSearchResult = true;
        }
        console.log("Number of tutors within location after active filter: " +$scope.results.length);
      }
      UserSkills.getCoachCount($scope.search.keyWord).then(function(count){
        $scope.coachCount = count;
        $scope.currentSearchLimit.limit = count;
        $scope.currentSearchLimit.checked = true;
      });

      $ionicLoading.hide();
    }).catch(function(error){
      console.log(error);
      $scope.badSearchResult = true;

    });
  }

  $scope.matchingfilter = function(){

    $scope.currentSearchLimit = {
      "num": 30,
      "checked" : false
    };
    filterChangedAfterLevel = true;
    $scope.activeFilter = '+matching';
    $scope.filtertosearch = 'matching';
    $scope.results = [];
    var matchedtutors = [];
    if($scope.search.currentLevel ==undefined || $scope.search.currentLevel=='All Levels'){
      var level = "general";
    }else{
      level = $scope.search.currentLevel;
    }

   UserSkills.getCoachesByLevel($scope.search.keyWord, level, $scope.filtertosearch, $scope.currentSearchLimit.num).then(function(coachList){
      if(coachList.length!=0){
        for(var i=0;i<coachList.length;i++){
          if($scope.location.lat !=null&& $scope.location.lon!=null&&coachList[i].location.lat!=null&&coachList[i].location.lon!=null){
            coachList[i].distance = Geolocation.getDistanceBetween($scope.location.lat, $scope.location.lon, coachList[i].location.lat, coachList[i].location.lon);
            if(coachList[i].distance<5&&matchedtutors.length<3){
              matchedtutors.push(coachList[i]);
            }else if(coachList[i].distance<5){
              for(var j=0;j<matchedtutors.length;j++){
                if(matchedtutors[j].distance>coachList[i].distance){
                  matchedtutors[j]= coachList[i];
                  break;
                }
              }
            }else{
              for(var i=0;i<$scope.geofireload.length;i++){
                if(matchedtutors.length<3){
                  matchedtutors.push($scope.geofireload[i]);
                }else{
                  for(var j=0;j<matchedtutors.length;j++){
                    if((matchedtutors[j].distance+(matchedtutors[j].rate/10))>($scope.geofireload[i].distance+($scope.geofireload.rate/10))){
                      matchedtutors[j] = $scope.geofireload[i];
                    }
                  }
                }
              }
            }
          }
        }
      }else{
        for(var i=0;i<$scope.geofireload.length;i++){
          if(matchedtutors.length<3){
            matchedtutors.push($scope.geofireload[i]);
          }else{
            for(var j=0;j<matchedtutors.length;j++){
              if((matchedtutors[j].distance+(matchedtutors[j].rate/5))>($scope.geofireload[i].distance+($scope.geofireload.rate/5))){
                matchedtutors[j] = $scope.geofireload[i];
              }
            }
          }
        }
      }
      if($scope.activeFilter=='+matching'){
        $scope.results = matchedtutors;
        if($scope.results.length==0){
          $scope.badSearchResult = true;
        }
        console.log("Number of tutors within location after active filter: " +$scope.results.length);
      }
      $scope.search.currentLevel = "All Levels";

      $ionicLoading.hide();
    }).catch(function(error){
      for(var i=0;i<$scope.geofireload.length;i++){
        if(matchedtutors.length<3){
          matchedtutors.push($scope.geofireload[i]);
          console.log($scope.geofireload[i]);
        }else{
          for(var j=0;j<matchedtutors.length;j++){
            if(((matchedtutors[j].distance/1000)+(matchedtutors[j].rate/5))>(($scope.geofireload[i].distance/1000)+($scope.geofireload[i].rate/5))){
              matchedtutors[j] = $scope.geofireload[i];
              break;
            }
          }
        }
      }
      if($scope.activeFilter=='+matching'){
        $scope.results = matchedtutors;
        if($scope.results.length==0){
          $scope.badSearchResult = true;
        }
        console.log("Number of tutors within location after active filter: " +$scope.results.length);
      }
      $scope.search.currentLevel = "All Levels";
      $ionicLoading.hide();
    });

  }*/

  $scope.resizeScroll = function(){
    var scrollresizeTimeout = $timeout(function() {
      $ionicScrollDelegate.resize();
    }, 250); // delay 250 ms
  }


  $scope.scrollTop = function() {
    $ionicScrollDelegate.scrollTop();
  };

  $scope.changeLocation = function(){
    $scope.location.name = $scope.search.locationName;
    $scope.location.lat = $scope.search.locationLat;
    $scope.location.lon = $scope.search.locationLon;
    console.log($scope.search.currentLevel);
    $scope.selectLevel($scope.search.currentLevel);
  }

  //change the results depending on the subject level selected by user
  $scope.selectLevel = function(level) {
    console.log(level);
    filterChangedAfterLevel = false;
    $scope.geofireload = [];
    $scope.results = [];
    UserSkills.getCoachCount($scope.search.keyWord, level).then(function(count){
      $scope.coachCount = count;
      $scope.currentSearchLimit.limit = count;
      $scope.currentSearchLimit.checked = true;
      $scope.currentSearchLimit.num = 30;
    });
    $ionicLoading.show({
      template: 'Loading'
    })

    if(level ==="All Levels"){
      level = "general";
    }

        //Testing Geofire
        var skillRef = fbCountry.child("userskills/"+$scope.search.keyWord+"/"+level);
        var $geo = $geofire(skillRef);
        var query = $geo.$query({
          center: [$scope.location.lat, $scope.location.lon],
          radius: $scope.searchradius
        });
        geoQueryCallback.cancel();
        geoQueryCallback2.cancel();

        geoQueryCallback = query.on("key_entered", $scope.search.keyWord);
        geoQueryCallback2 = query.on("ready", $scope.search.keyWord+"finished");

      if ($scope.activeFilter == '+rate'){
        $scope.filtertosearch = 'rate';
      }else if ($scope.activeFilter == '-rating'){
        $scope.filtertosearch = 'rating';
      } else if ($scope.activeFilter == '+verified'){
        $scope.filtertosearch = 'verified';
      } else if ($scope.activeFilter == '+matching'){
        $scope.filtertosearch = 'matching';
      }
      console.log(level);
      if ($scope.activeFilter != '+distance'){
      UserSkills.getCoachesByLevel($scope.search.keyWord, level, $scope.filtertosearch, $scope.currentSearchLimit.num).then(function(coachList){
        console.log("Non distance search");
        for(var i=0;i<coachList.length;i++){
          if($scope.location.lat !=null&& $scope.location.lon!=null&&coachList[i].location.lat!=null&&coachList[i].location.lon!=null){
          coachList[i].distance = Geolocation.getDistanceBetween($scope.location.lat, $scope.location.lon, coachList[i].location.lat, coachList[i].location.lon);
        }
        }
      if(filterChangedAfterLevel == false){
        $scope.results = coachList;
        if($scope.results.length==0){
          $scope.badSearchResult = true;
        }
        console.log("Number of tutors within location after active filter: " +$scope.results.length);
      }
      }).catch(function(error){
        console.log(error);
        console.log("Bad search");
        $scope.badSearchResult = true;
        $ionicLoading.hide();
      });
    }
  }

//Prompt for Levels when selecting a skill
$scope.showLevelSelector = function() {
  var levelArray = [];

  //Use the subject levels from Categories factory instead
  //faster performance
  console.log($scope.search.keyWord);
  var levels = Categories.getAvailableLevels($scope.search.keyWord,$scope.defaultCountry.value);
  for(var i=0;i<levels.length;i++){
    levelArray.push({'text':levels[i]});
  }

  levelArray.push({'text': "All Levels"});

  // Show the action sheet
  var hideSheet = $ionicActionSheet.show({
    buttons: levelArray,
    titleText: 'Choose Subject Level for '+$scope.search.keyWord,
    cancelText: 'Cancel',
    cancel: function() {
      // prompt user for other name
    },
    buttonClicked: function(index) {
      //$scope.newSkill.level = levels[index];
      console.log("Selected "+levelArray[index].text);
      $scope.search.currentLevel = levelArray[index].text;

      $scope.selectLevel(levelArray[index].text);

      return true;
    }
  });


};


$scope.getMoreResults = function(currentLimit) {

  //monitor the current limit
  //increment by 20 each time

  if($scope.badSearchResult){
    return false;
  } else if ($scope.activeFilter == '+distance'){
    return false;
  }else{
    //get the last item's location time series

    var startAt = $scope.currentSearchLimit.num+1;
    $scope.currentSearchLimit.num+=10;
    var endAt = $scope.currentSearchLimit.num;

    //download additional items
    console.log("Reached "+$scope.currentSearchLimit.num);
    if($scope.search.currentLevel == "All Levels"){
      UserSkills.getCoaches($scope.search.keyWord, $scope.filtertosearch, endAt,startAt).then(function(coachList){
      for(var i=0;i<coachList.length;i++){
        if($scope.location.lat !=null&& $scope.location.lon!=null&&coachList[i].location.lat!=null&&coachList[i].location.lon!=null){
          coachList[i].distance = Geolocation.getDistanceBetween($scope.location.lat, $scope.location.lon, coachList[i].location.lat, coachList[i].location.lon);
        }
      }
        //$scope.results2 = coachList;
        console.log("Retrieved between "+startAt+" and "+endAt);

        console.log(coachList);
        //lastMarker = coachList[coachList.length-1].location.time;
        //angular.extend($scope.results, coachList);

        //append to the current results
        /*
        for(var i=0; i<$scope.results.length; i++){
        coachList.push($scope.results[i]);
      }

      $scope.results = coachList;
      */

      $scope.results=coachList;

      $scope.$broadcast('scroll.infiniteScrollComplete');

      }).catch(function(error){
        console.log(error);
        $scope.badSearchResult = true;

      });
    }else{

      UserSkills.getCoachesByLevel($scope.search.keyWord, $scope.search.currentLevel, $scope.filtertosearch, endAt,startAt).then(function(coachList){

        //$scope.results2 = coachList;
        console.log("Retrieved between "+startAt+" and "+endAt);

        for(var i=0;i<coachList.length;i++){
          if($scope.location.lat !=null&& $scope.location.lon!=null&&coachList[i].location.lat!=null&&coachList[i].location.lon!=null){
            coachList[i].distance = Geolocation.getDistanceBetween($scope.location.lat, $scope.location.lon, coachList[i].location.lat, coachList[i].location.lon);
          }
        }

        console.log(coachList);
        //lastMarker = coachList[coachList.length-1].location.time;
        //angular.extend($scope.results, coachList);

        //append to the current results
        /*
        for(var i=0; i<$scope.results.length; i++){
        coachList.push($scope.results[i]);
      }

      $scope.results = coachList;
      */

      $scope.results=coachList;

      $scope.$broadcast('scroll.infiniteScrollComplete');

      }).catch(function(error){
        console.log(error);
        $scope.badSearchResult = true;

      });

    }

  }
}


//helps the infinite scroll to detect if more can be loaded
$scope.canWeLoadMoreContent = function() {

  //currentLimit being number of results taken
  if($scope.badSearchResult){
    return false;
  } else if($scope.activeFilter=='+distance'){
    return false;
  }
  else if($scope.currentSearchLimit.checked) {
    return ($scope.currentSearchLimit.limit > $scope.currentSearchLimit.num) ? true : false;
  } else {
    return false;
  }

  /*
  else if(!$scope.currentSearchLimit.checked){

  UserSkills.getCoachCount($scope.search.keyWord).then(function(count){
  console.log("Overall coaches for "+$scope.search.keyWord+" is "+count);
  //$scope.$broadcast('scroll.infiniteScrollComplete');
  console.log("Up to "+count+" coach available");
  $scope.currentSearchLimit.checked = true;
  $scope.currentSearchLimit.limit = count;
  console.log($scope.currentSearchLimit);
  return ($scope.currentSearchLimit.limit > $scope.currentSearchLimit.num) ? false : true;
})

}
*/
}


$scope.$watch('results', function() {
  console.log("Refreshed results!");
  $ionicLoading.hide();

});



$scope.doRefresh = function() {
  //$watch is watching for changes to keyword
  $scope.search.backupKeyWord = $scope.search.keyWord;
  $scope.search.keyWord = "";
  $scope.search.keyWord = $scope.search.backupKeyWord;
  $scope.badSearchResult = false;

  console.log("Refresh performed");

  $scope.$broadcast('scroll.refreshComplete');
}


console.log("SCOPE KEYWORD IS "+$scope.search.keyWord);
console.log("STATEPARAMS KEYWORD IS "+$stateParams.keyWord);


//used to generate the user rating picture array
$scope.makeArrayOfSize = Utilities.makeArrayOfSize;

$scope.stationSelected = function(name, lat, lon){
  $scope.locationLoading = true;
  $scope.search.locationName = name;
  $scope.search.locationLat = lat;
  $scope.search.locationLon = lon;

  setTimeout(function(){//here!
    getPositionAndShowOnMap();
  }, 1000);
}

$scope.getCurrentLocation = function(){
  $scope.locationLoading=true;
  $cordovaGeolocation.getCurrentPosition().then(function(position){
        console.log("Geolocation success!");
        console.log("Retrieved current location Lat:"+position.coords.latitude+" Lon:"+position.coords.longitude);
        var geocoder = new google.maps.Geocoder();
        var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        var request = {
          latLng: latlng
        };
        geocoder.geocode(request, function(data, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            if (data[0] != null) {
              console.log("address is: " + data[0].formatted_address);
              $scope.search.locationName = data[0].formatted_address;
              $scope.search.locationLat = position.coords.latitude;
              $scope.search.locationLon = position.coords.longitude;
              setTimeout(function(){//here!
                getPositionAndShowOnMap();
            }, 1000);
            } else {
              $scope.showAlert("No address found at current location");
              $scope.locationLoading=false;
            }
          }
        })
    }, function(error){
        console.log("Could not get location");
        $scope.locationLoading=false;
        $scope.showAlert('Please Turn on Location Settings');
    });
  }

  var typingTimer;                //timer identifier
  var doneTypingInterval = 5000;  //time in ms, 5 second for example
  var mapLoaded = false;

  $scope.addressChanged = function(){
    clearTimeout(typingTimer);
    typingTimer = setTimeout($scope.doneTyping(), doneTypingInterval);
  }

//user is "finished typing," do something

  $scope.doneTyping = function(){
    $scope.locationLoading=true;
    var address = $scope.search.locationName;
    console.log($scope.search.locationName);
    if(address.length!=0){
      var request = {
      'address': address + ' '+Utilities.getCurrentCountry().name
      };
      var geocoder = new google.maps.Geocoder();
      geocoder.geocode(request, function(results) {
        if(results){
          if (results.length!=0) {
            console.log(results);
            $scope.search.locationLat = results[0].geometry.location.lat();
            $scope.search.locationLon = results[0].geometry.location.lng();
            setTimeout(function(){//here!
                getPositionAndShowOnMap();
            }, 1000);
          }
        }
      })
    }
  }

  function getPositionAndShowOnMap(){

          $scope.initMap = function() {
              var myLatlng = new google.maps.LatLng($scope.search.locationLat,$scope.search.locationLon);
              console.log('entered map');
              var myOptions = {
                  zoom: 16,
                  center: myLatlng,
                  mapTypeId: google.maps.MapTypeId.ROADMAP,
                  disableDefaultUI: true
              };
              $scope.map = new google.maps.Map(document.getElementById("map3"), myOptions);

              var marker = new google.maps.Marker({
                  draggable: true,
                  position: myLatlng,
                  map: $scope.map,
                  title: "Your location"
              });
              //console.log("resize");
              google.maps.event.trigger( $scope.map, 'resize' );
              $scope.locationLoading=false;
          };
          $scope.initMap();
  }

$ionicModal.fromTemplateUrl('templates/search-location.html', {
    id: '0',
    scope: $scope,
    backdropClickToClose: false,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.oModal0 = modal;
  });


  $scope.openModal = function(index) {
  var selectedModal = 'oModal' + index;
  $scope[selectedModal].show();

  if(index==0){
    $scope.search.locationName = $scope.location.name;
    //scope.search.locationName = '';
    $scope.search.locationLat = $scope.location.lat;
    $scope.search.locationLon = $scope.location.lon;
    setTimeout(function(){//here!
                getPositionAndShowOnMap();
            }, 1000);
  }
};

$scope.closeModal = function(index) {
  var selectedModal = 'oModal' + index;
  $scope[selectedModal].hide();
};


$scope.$on('modal.shown', function(event, modal) {
  console.log('Modal ' + modal.id + ' is shown!');
});

$scope.$on('modal.hidden', function(event, modal) {
  console.log('Modal ' + modal.id + ' is hidden!');
});

})

//Person results from the Learnly Search page
.controller('SearchPersonCtrl', function($scope, $firebaseObject, $ionicActionSheet, $ionicPopup, $ionicLoading, $ionicHistory, $ionicModal, $state, $timeout, Auth, Schools, UserAction, Geolocation, Utilities, UserSkills, Bookmarks, Skills, $stateParams) {
  //$scope.person = "loading data...";
  $scope.currentview = $state.current.name;
  console.log("Now viewing "+$scope.currentview);
  $scope.authData = fb.getAuth();
  $scope.personUid = $stateParams.alias;
  $scope.distance = $stateParams.distance;
  $scope.bookmarkedPerson = false;

  $scope.preventBooking = false;
  $scope.preventBookingMessage = "You cannot book yourself";

  $scope.defaultCountry = Utilities.getCurrentCountry();

  $ionicLoading.show({
    template: '<ion-spinner icon="spiral"></ion-spinner>'
  });


  $scope.user = $firebaseObject(fb.child("users/"+$scope.authData.uid));
  Auth.userRef().$bindTo($scope, "user");

  $scope.user.$loaded().then(function(){

    //go and check if this alias exists
    Utilities.checkIfExistingAlias($stateParams.alias).then(function(existingId){
      if(existingId){
        console.log("Applying the id "+existingId+" found for alias "+$stateParams.alias);

        $stateParams.alias = existingId;
        $scope.personUid = existingId;
      }


      //used to prevent booking ownself
      //distance does not show up if determined to be ownself
      if($stateParams.alias===$scope.authData.uid){
        $scope.preventBooking = true;
        $scope.distance = 0;
        console.log("Own user, prevent self from booking!");
      } else if($stateParams.simple){
        //prevent complicated nesting of booking
        //when viewing profile from the ChatDetailCtrl
        //$scope.preventBooking = true;
      }

      //RETRIEVING COACH INFO
      var personRef = fb.child("users").child($stateParams.alias);
      personRef.on("value", function(snapshot) {
        $scope.person = snapshot.val();
        console.log("Searching for "+$stateParams.alias);
        console.log("Retrieved "+snapshot.numChildren()+" details");

        if($scope.person.verify){
            //person is not from this country
            //we do not allow cross country booking
            if($scope.person.verify.origin){
              if($scope.person.verify.origin != $scope.defaultCountry.value) {
                $scope.preventBooking = true;
                $scope.preventBookingMessage = "Tutor does not offer lessons in your country";
              }              
            }

        }

        if (enableIntercom&&window.cordova) {
        intercom.updateUser({ 'lastViewedTutor': $scope.personUid, 'lastViewedTutorName': $scope.person.name, 'lastViewTutorPic': $scope.person.face});
        intercom.logEvent("PersonCtrl", {
              'event_at': new Date().getTime(),
              'viewedTutor': $scope.personUid,
              'viewedTutorName': $scope.person.name,
              'vViewedTutorPic': $scope.person.face
          });
        }
        //console.log("Retrieved objects "+JSON.stringify($scope.person));

        UserSkills.getCoachViews($stateParams.alias).then(function(views){
          $scope.person.viewCount = views;
        });

        UserSkills.getCoachRating($stateParams.alias).then(function(rating){
          $scope.person.rating = rating.rating;
          $scope.person.ratingCount = rating.count;
        });

        Bookmarks.getLikePersonCount($stateParams.alias).then(function(likesCount){
          //show how many people are following this user
          $scope.person.followers = likesCount;
        });

        $scope.filteredWriteup = Utilities.filterUserWriteup($scope.person.writeup, "Contact me via 'Ask Me' button below");

        $scope.$apply();

        console.log(document.getElementById('writeup').style.height);
        document.getElementById('textareaCover').style.height = document.getElementById('writeup').style.height;
        margin = document.getElementById('textareaCover').style.height;
        document.getElementById('textareaCover').style.marginTop = "-"+margin;

        $ionicLoading.hide();
      });


      //UPDATE VIEWED BOOLEAN
      var viewedPersonRef = fb.child("viewed").child($stateParams.alias).child($scope.authData.uid);
      viewedPersonRef.on("value", function(snapshot){
        var recordExists = (snapshot.val() !== null);
        if(recordExists){
          //Do Nothing
          console.log($stateParams.alias+" has been viewed before");

        } else {
          console.log("Write new view entry");
          viewedPersonRef.set(true);
        }

        $ionicLoading.hide();

      });

      if(typeof $scope.user.likes != 'undefined'){
        $scope.bookmarkedPerson = $scope.user.likes.person[$stateParams.alias];
      }

    });

  });





  $scope.toggleBookmark = function() {
    console.log("Clicked toggle");
    //invert values between like and unlike
    if($scope.bookmarkedPerson) {
      Bookmarks.unlikePerson($stateParams.alias, $scope.authData.uid);
      $scope.bookmarkedPerson = false;

    } else {
      Bookmarks.likePerson($stateParams.alias, $scope.authData.uid, $scope.user.name);
      $scope.bookmarkedPerson = true;
    }

  }

  $scope.showImage = function(picture_url) {
    $scope.imageSrc = picture_url;
    $scope.openModal(0);
  }

  $scope.getTimeOfDayPicture = function (timeOfDay) {
    return 'img/assets/' + timeOfDay+'.png';
  };


  $scope.reLogin = function() {


    if($scope.authData.provider=='anonymous'){
      var userRef = fb.child("users/"+$scope.authData.uid);
      userRef.set(null);
    }
    //$ionicLoading.show({template:'Logging out....'});
    $scope.closeModal(2);

    console.log("Logging out "+$scope.authData.uid);
    Auth.logout();
    $scope.authData = Auth.getAuth(); //this should be null
    $state.go('intro');

    $timeout(function () {
      $ionicHistory.clearCache();
      $ionicHistory.clearHistory();
    }, 1500);
  }


  //Alert prompts
  $scope.showAlert = Utilities.showAlert;

  $scope.reportPost = function(postId, posterId, postText) {

    UserAction.addFeedback($scope.authData.uid, $stateParams.alias, 2, null, postText)
    .then(function(result){
      console.log("Created feedback", result);
      $scope.showAlert("Post Reported","We will be looking into it!");
    });

  }

  $scope.reportAlert = function(postId, posterId){

    var text = "Why are you Reporting this User?";

    function route(result) {
      switch(result.buttonIndex){
        case 1: break; //do nothing
        case 2: $scope.reportPost(postId, posterId, result.input1); break;
      }
    }

    navigator.notification.prompt(
      text,  // message
      route,              // callback to invoke with index of button pressed
      'Report',            // title
      ['Cancel', 'Report']          // buttonLabels
    );
  }

  //IMPLEMENT MODALS HERE TO CONFIRM USER DATA
  //Displays user profile picture
  $ionicModal.fromTemplateUrl('templates/utility/fullscreen.html', {
    id: '0',
    scope: $scope,
    backdropClickToClose: false,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.oModal0 = modal;
  });
  /*
  $ionicModal.fromTemplateUrl('templates/earn/relogin.html', {
  id: '2', // We need to use and ID to identify the modal that is firing the event!
  scope: $scope,
  backdropClickToClose: false,
  animation: 'slide-in-up'
}).then(function(modal) {
$scope.oModal2 = modal;
});
*/
//modal may have to take extra parameter _skill
$scope.openModal = function(index) {
  var selectedModal = 'oModal' + index;
  $scope[selectedModal].show();
};

$scope.closeModal = function(index) {
  var selectedModal = 'oModal' + index;
  $scope[selectedModal].hide();
};


$scope.$on('modal.shown', function(event, modal) {
  console.log('Modal ' + modal.id + ' is shown!');
});

$scope.$on('modal.hidden', function(event, modal) {
  console.log('Modal ' + modal.id + ' is hidden!');
});

// Cleanup the modals when we're done with them (i.e: state change)
// Angular will broadcast a $destroy event just before tearing down a scope
// and removing the scope from its parent.
$scope.$on('$destroy', function() {
  console.log('Destroying modals...');
  $scope.oModal0.remove();
  destroy = true;
  //$scope.oModal2.remove();
});


//used to generate the user rating picture array
$scope.makeArrayOfSize = Utilities.makeArrayOfSize;

$scope.checkIfHaveSchedule = Utilities.checkIfHaveSchedule;

$scope.getSkillPic = function(skillName) {
  return Skills.getByName(skillName).pic;
}

//Called when Share button is clicked
//Need to generate a link that can be sent via Whatsapp, Wechat, Twitter
$scope.shareWithFriend = UserAction.shareWithFriend;

})

//Arrange booking for one to one lessons from the Person Search Page
.controller('BookingCtrl', function($http, $scope, $state, $stateParams, $timeout, $ionicLoading, $window, Chats, Orders, Push, $ionicScrollDelegate, Utilities) {
  //Which schedule is the user selecting
  $scope.select = {};
  $scope.days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  $scope.newLesson = {};
  $scope.newLesson.details = {"name":"","rate":0};

  $scope.defaultCountry = Utilities.getCurrentCountry();

  $scope.authData = fb.getAuth();
  var userRef = fb.child("users/"+$scope.authData.uid);
  userRef.on("value", function(snapshot){
    $scope.user = snapshot.val();
  });

  console.log("Booking "+$stateParams.coach+" for "+$stateParams.lesson);

  //Retrieving coach details
  var coachRef = fb.child("users").child($stateParams.coach);
  coachRef.on("value", function(snapshot) {
    $scope.person = snapshot.val();
    $scope.person.showSchedule = false;
    for(var i=0;i<3;i++){
      for (var key in $scope.person.schedule[i]){
        if($scope.person.schedule[i][key]==true){
          $scope.person.showSchedule = true;
          break;
        }
      }
    }
    console.log("Searching for "+$stateParams.coach);
    console.log("Retrieved "+snapshot.numChildren()+" details");
    console.log("Retrieved objects "+JSON.stringify($scope.person));
    //return data;
  });

  $scope.lessonName = $stateParams.lesson;

  var lessonRef = fbCountry.child("userskills").child($scope.lessonName).child("general").child($stateParams.coach);
  lessonRef.on("value", function(snapshot) {
    $scope.lesson = snapshot.val();
    console.log("Searching for "+$stateParams.coach);
    console.log("Retrieved "+snapshot.numChildren()+" details");
    console.log("Retrieved objects "+JSON.stringify($scope.lesson));

    //return data;
    if(typeof $scope.lesson.levels !== 'undefined') {
      $scope.lesson.averaged = true;

    } else if(!$scope.lesson.averaged){
      $scope.newLesson.name = "General";
      $scope.newLesson.rate = $scope.lesson.rate;

    } else if(typeof $scope.lesson.levels == 'undefined') {
      console.log("Missing level fallback, we set rate as "+$scope.lesson.rate);
      $scope.newLesson.name = "General";
      $scope.newLesson.rate = $scope.lesson.rate;
      //$scope.$apply();
    }
  });

  $scope.duration = 2;

  var saveResult = function (data) {
    $scope.duration = data.from;
    $scope.$apply();
    console.log("Updated duration to "+$scope.duration);
  };

  var $range = $(".js-range-slider");

  $range.ionRangeSlider({
    type: "single",
    min: 1,
    max: 10,
    from: $scope.duration,
    step: 0.5,
    onFinish: function (data) {
      saveResult(data);
    }
  });

  $scope.resizeScroll = function(){
    var scrollresizeTimeout = $timeout(function() {
      $ionicScrollDelegate.resize();
    }, 250); // delay 250 ms
  }

  $scope.disclaimerAlert = function(text){

    function route(buttonIndex) {
      //alert('We should redirect you');
      switch(buttonIndex){
        case 1: break; //do nothing
        case 2: $scope.startChat(); break;
      }

      //we should also add an update digit to the chat list

    }

    navigator.notification.confirm(
      text,  // message
      route,              // callback to invoke with index of button pressed
      'Lesson Request',            // title
      'Cancel,I Accept'          // buttonLabels
    );
  }


  //initiate a chat with the coach
  $scope.startChat = function() {

    if($scope.lesson.averaged){
      $scope.newLesson.rate = $scope.lesson.levels[$scope.newLesson.name];
    }

    var message = "Hey "+$scope.person.name+", I am interested in your "+$scope.newLesson.name+" "+$scope.lessonName+" class at $"+$scope.newLesson.rate+"/hr";

    var sender = $scope.user;
    var receiver = $scope.person;
    var senderid = $scope.authData.uid;
    var receiverid = $stateParams.coach;
    var faces = {sender: sender.face, receiver: receiver.face};
    var names = {sender: sender.name, receiver: receiver.name};

    //INCLUDE MORE DETAILS LIKE DATE TIME PLACE IN FUTURE
    if($scope.select){
      //if user selected a preferred time
      message+= ". Please see Details for my preferred timing.";
      var orderDetails = {'lessonName': $scope.lessonName, 'level': $scope.newLesson.name, 'rate': $scope.newLesson.rate, 'schedule': $scope.select, 'duration': $scope.duration};
    } else {
      var orderDetails = {'lessonName': $scope.lessonName, 'level': $scope.newLesson.name, 'rate': $scope.newLesson.rate, 'duration': $scope.duration};
    }

    //make Order first, then pass Order key to the Chat
    Orders.openTransaction(senderid, receiverid, 2, orderDetails).then(function(orderId){

      $ionicLoading.show({
        template: '<p><Requesting/p><ion-spinner icon="spiral"></ion-spinner>'
      });

      console.log("Established Order "+orderId);
      Chats.startChat(senderid, receiverid, faces, names, message, orderId, 2).then(function(){

        console.log("Established Chat Regarding Private Class");
      });

      $timeout(function() {
        //$window.location.reload();
        $ionicLoading.hide();
        $state.go('tab.chats');
      }, 2000);

    });

    //twilio SMS
    var tutorNum = '+'+$scope.user.tel.country+$scope.user.tel.num;
    var smsMessage = "A student has expressed interest in your "+ $scope.lessonName +" lesson.";
    console.log('tutornum '+tutorNum);
    $http({
      method: 'POST',
      url: 'http://ec2-54-169-215-80.ap-southeast-1.compute.amazonaws.com/smsalert',
      data: { bodyText: smsMessage, senderID: senderid, receiverID: receiverid }
    }).success(function (data, status, headers, config) {

      console.log('SMS alert sent');
      console.log('data ' + JSON.stringify(data));
      console.log('status ' + JSON.stringify(status));
      console.log('headers ' + JSON.stringify(headers));
      console.log('config ' + JSON.stringify(config));

    }).error(function (data, status, headers, config) {
      console.log('twilio sms error');
      console.log('data ' + JSON.stringify(data));
      console.log('status ' + JSON.stringify(status));
      console.log('config ' + JSON.stringify(config));
    });


  }

  if (enableIntercom&&window.cordova) {
    intercom.logEvent("BookingCtrl", {
      'event_at': new Date().getTime(),
      'viewedTutor': $stateParams.coach,
      'subject': $stateParams.lesson
    });
  }


})

.controller('WorkshopCtrl', function($scope, $ionicScrollDelegate, $stateParams, $ionicModal, $ionicLoading, Utilities, Push, Carousel, Workshops) {

  $scope.authData = fb.getAuth();
  $scope.modifiedArray = [];
  $scope.featuredResults = [];

  $ionicLoading.show({
    template: '<ion-spinner icon="spiral"></ion-spinner>'
  });

  var workshopsRef = fb.child("carousel/workshops");
  workshopsRef.on("value", function(snapshot) {
    $scope.results = snapshot.val();
    $scope.workshops = Utilities.convertToArrayWithKey($scope.results);
    for(var k in $scope.workshops){
      var modifiedName = $scope.workshops[k].key.replace(/&/g,"and");
      var modifiedName = modifiedName.replace(/ /g,"space");
      $scope.modifiedArray.push(modifiedName);
    }
    $ionicLoading.hide();
  });
  var featuredWorkshopsRef = fb.child("workshops/featured");
  featuredWorkshopsRef.on("value",function(snapshot){
    $scope.featuredArray = snapshot.val();
    console.log($scope.featuredArray);
    $scope.featuredArray = Utilities.convertToArrayWithKey($scope.featuredArray);
    console.log($scope.featuredArray)
    for(var j in $scope.featuredArray){
      console.log($scope.featuredArray[j]);
      console.log($scope.featuredArray[j].key);
    Workshops.getWorkshop($scope.featuredArray[j].key,$scope.featuredArray[j].category).then(function(result){
        result.keyToPass = result.category.replace(/&/g,"and");
        result.keyToPass = result.keyToPass.replace(/ /g,"space");
        var currentTime = (new Date()).getTime();
        if(result.expiryTime > currentTime){
          $scope.featuredResults.push(result);
        }
        console.log($scope.featuredResults);
    })
    }
  })
  if (enableIntercom&&window.cordova) {
    intercom.logEvent("WorkshopCtrl", {
      'event_at': new Date().getTime()
    });
  }
})

.controller('WorkshopSearchCtrl', function($scope, $state, $ionicScrollDelegate, $stateParams, $ionicModal, $ionicLoading, Utilities, Push, Geolocation, $timeout, $geofire, geohash, $ionicSlideBoxDelegate,  $cordovaGeolocation, Places) {
  $scope.authData = fb.getAuth();
  $scope.currentview = $state.current.name;
  console.log("Now viewing "+$scope.currentview);
  $scope.search = {};
  $scope.places = Places.all();
  console.log($scope.places);

  $scope.location = {};
  //default filter for search results displayed
  $scope.searchradius = 50;
  $scope.geofireload = [];
  $scope.popularitems=[];
  $scope.expiredGeofire = [];
  console.log($stateParams.keyWord);
  $scope.search.keyWord = $stateParams.keyWord.replace(/space/g, " ");
  $scope.search.keyWord = $scope.search.keyWord.replace(/and/g, "&");
  $scope.search.keyWordtoPass = $stateParams.keyWord;
  console.log($scope.search.keyWord);
  var geofirelistener;
  var geofirefinisher;
  var geoQueryCallback;
  var geoQueryCallback2;
  var destroy = false;
  $scope.finishedgeofireload = false;
  $scope.finishedpopularload = false;

  $scope.categorySlideIndex = 0;

  $scope.categorySlideTo = function(index) {
    $ionicSlideBoxDelegate.slide(index);
  };

  // Called each time the slide changes
  $scope.categorySlideChanged = function(index) {
    $scope.categorySlideIndex = index;
  };

  var defaultOptions = { timeout: 5000, enableHighAccuracy: true };

  $cordovaGeolocation.getCurrentPosition(defaultOptions).then(function(position){
    console.log("Geolocation success!");
    $scope.location.lat = position.coords.latitude;
    $scope.location.lon = position.coords.longitude;
    var geocoder = new google.maps.Geocoder();
    var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    var request = {
      latLng: latlng
    };
    geocoder.geocode(request, function(data, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (data[0] != null) {
          console.log("address is: " + data[0].formatted_address);
          $scope.location.name = data[0].formatted_address;
        } else {
          $scope.location.name = 'Unknown';
        }
      }
    })
    //Testing Geofire
    var skillRef = fb.child("workshops/"+$scope.search.keyWord);
    if(destroy==false){
      var $geo = $geofire(skillRef);
      var query = $geo.$query({
        center: [$scope.location.lat, $scope.location.lon],
        radius: $scope.searchradius
      });
    }

    if(!$scope.$$listeners.hasOwnProperty($scope.search.keyWord)){
      geofirelistener = $scope.$on($scope.search.keyWord, function (event, key, location, distance) {
        // Do something interesting with object
        skillRef.child(key).on("value", function(snapshot) {
          var tempHolder = snapshot.val();
          tempHolder.distance = distance*1000;
          tempHolder.key = key;
          var currentTime = (new Date()).getTime();
          if(tempHolder.expiryTime > currentTime){
            $scope.geofireload.push(tempHolder);
          }else if(tempHolder.terminationTime>(currentTime+1814400000)){
            $scope.expiredGeofire.push(tempHolder);
          }
          $scope.expiredArray = $scope.expiredGeofire;
          $scope.results = $scope.geofireload;

          console.log($scope.results);
        });
      });
      geofirefinisher = $scope.$on($scope.search.keyWord+"finished", function () {
        console.log("GeoQuery halted on error");
        $scope.finishedgeofireload = true;
        $scope.geofireload = [];
      });
    }
    if(destroy==false){
      geoQueryCallback = query.on("key_entered", $scope.search.keyWord);
      geoQueryCallback2 = query.on("ready", $scope.search.keyWord+"finished");
    }
    var PopularRef = fb.child("workshops/"+$scope.search.keyWord);
    PopularRef.orderByChild("popular").equalTo(true).on("value", function(snapshot) {
      $scope.finishedpopularload = true;
      $scope.popularArray = Utilities.convertToArrayWithKey(snapshot.val());
      for(var item in $scope.popularArray){
        var currentTime = (new Date()).getTime();
        if($scope.popularArray[item].expiryTime > currentTime){
          $scope.popularitems.push($scope.popularArray[item]);
        }
      }
      $scope.popular = $scope.popularitems;
      $scope.popularitems = [];
      console.log($scope.popular);
    });
  }, function(error){

  Geolocation.getExistingLocation($scope.authData.uid).then(function(existingLocation){

    if((existingLocation == null)){
      $scope.location.lat = 1.351236;
      $scope.location.lon = 103.848456;
      $scope.location.name = 'Bishan';
    } else {
      $scope.location = existingLocation;
    }
    //Testing Geofire
    var skillRef = fb.child("workshops/"+$scope.search.keyWord);
    if(destroy==false){
      var $geo = $geofire(skillRef);
      var query = $geo.$query({
        center: [$scope.location.lat, $scope.location.lon],
        radius: $scope.searchradius
      });
    }
    geofirelistener = $scope.$on($scope.search.keyWord, function (event, key, location, distance) {
      // Do something interesting with object
      skillRef.child(key).on("value", function(snapshot) {
        var tempHolder = snapshot.val();
        tempHolder.distance = distance*1000;
        tempHolder.key = key;
        var currentTime = (new Date()).getTime();
        if(tempHolder.expiryTime > currentTime){
          $scope.geofireload.push(tempHolder);
        }else if(tempHolder.terminationTime>(currentTime+1814400000)){
          $scope.expiredGeofire.push(tempHolder);
        }
        $scope.expiredArray = $scope.expiredGeofire;
        $scope.results = $scope.geofireload;

        console.log($scope.results);
      });
    });
    geofirefinisher = $scope.$on($scope.search.keyWord+"finished", function () {
      console.log("GeoQuery halted on error");
      $scope.finishedgeofireload = true;
      $scope.geofireload = [];
    });
    if(destroy==false){
      geoQueryCallback = query.on("key_entered", $scope.search.keyWord);
      geoQueryCallback2 = query.on("ready", $scope.search.keyWord+"finished");
    }
    var PopularRef = fb.child("workshops/"+$scope.search.keyWord);
    PopularRef.orderByChild("popular").equalTo(true).on("value", function(snapshot) {
      $scope.finishedpopularload = true;
      $scope.popularArray = Utilities.convertToArrayWithKey(snapshot.val());
      for(var item in $scope.popularArray){
        var currentTime = (new Date()).getTime();
        if($scope.popularArray[item].expiryTime > currentTime){
          $scope.popularitems.push($scope.popularArray[item]);
        }
      }
      $scope.popular = $scope.popularitems;
      $scope.popularitems = [];
      console.log($scope.popular);
    });
  })
  })
  $scope.$on('$destroy', function() {
    console.log('Destroying modals...');
    destroy = true;
    if(geoQueryCallback != null){
    geoQueryCallback.cancel();
    geoQueryCallback2.cancel();
  }
  });

  $scope.randomGif = Utilities.randomGif;

  $scope.contactUs = function () {
    if(enableIntercom&&window.cordova){
      intercom.displayMessageComposer();
    }
  };

  $ionicModal.fromTemplateUrl('templates/workshop-location.html', {
    id: '0',
    scope: $scope,
    backdropClickToClose: false,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.oModal0 = modal;
  });

  $scope.stationSelected = function(name, lat, lon){
  $scope.locationLoading = true;
  $scope.search.locationName = name;
  $scope.search.locationLat = lat;
  $scope.search.locationLon = lon;

  setTimeout(function(){//here!
    getPositionAndShowOnMap();
  }, 1000);
}

$scope.getCurrentLocation = function(){
  $scope.locationLoading=true;
  $cordovaGeolocation.getCurrentPosition().then(function(position){
        console.log("Geolocation success!");
        console.log("Retrieved current location Lat:"+position.coords.latitude+" Lon:"+position.coords.longitude);
        var geocoder = new google.maps.Geocoder();
        var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        var request = {
          latLng: latlng
        };
        geocoder.geocode(request, function(data, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            if (data[0] != null) {
              console.log("address is: " + data[0].formatted_address);
              $scope.search.locationName = data[0].formatted_address;
              $scope.search.locationLat = position.coords.latitude;
              $scope.search.locationLon = position.coords.longitude;
              setTimeout(function(){//here!
                getPositionAndShowOnMap();
            }, 1000);
            } else {
              $scope.showAlert("No address found at current location");
              $scope.locationLoading=false;
            }
          }
        })
    }, function(error){
        console.log("Could not get location");
        $scope.locationLoading=false;
        $scope.showAlert('Please Turn on Location Settings');
    });
  }

  var typingTimer;                //timer identifier
  var doneTypingInterval = 5000;  //time in ms, 5 second for example
  var mapLoaded = false;

  $scope.addressChanged = function(){
    clearTimeout(typingTimer);
    typingTimer = setTimeout($scope.doneTyping(), doneTypingInterval);
  }

//user is "finished typing," do something

  $scope.doneTyping = function(){
    $scope.locationLoading=true;
    var address = $scope.search.locationName;
    console.log($scope.search.locationName);
    if(address.length!=0){
      var request = {
      'address': address + ' '+Utilities.getCurrentCountry().name
      };
      var geocoder = new google.maps.Geocoder();
      geocoder.geocode(request, function(results) {
        if(results){
          if (results.length!=0) {
            console.log(results);
            $scope.search.locationLat = results[0].geometry.location.lat();
            $scope.search.locationLon = results[0].geometry.location.lng();
            setTimeout(function(){//here!
                getPositionAndShowOnMap();
            }, 1000);
          }
        }
      })
    }
  }

  function getPositionAndShowOnMap(){

          $scope.initMap = function() {
              var myLatlng = new google.maps.LatLng($scope.search.locationLat,$scope.search.locationLon);
              console.log('entered map');
              var myOptions = {
                  zoom: 16,
                  center: myLatlng,
                  mapTypeId: google.maps.MapTypeId.ROADMAP,
                  disableDefaultUI: true
              };
              $scope.map = new google.maps.Map(document.getElementById("map7"), myOptions);

              var marker = new google.maps.Marker({
                  draggable: true,
                  position: myLatlng,
                  map: $scope.map,
                  title: "Your location"
              });
              console.log("resize");
              google.maps.event.trigger( $scope.map, 'resize' );
              $scope.locationLoading=false;
          };
          $scope.initMap();
  }

  $ionicModal.fromTemplateUrl('templates/workshop-location.html', {
      id: '0',
      scope: $scope,
      backdropClickToClose: false,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.oModal0 = modal;
    });


    $scope.openModal = function(index) {
    var selectedModal = 'oModal' + index;
    $scope[selectedModal].show();

    if(index==0){
      $scope.search.locationName = $scope.location.name;
      $scope.search.locationLat = $scope.location.lat;
      $scope.search.locationLon = $scope.location.lon;
      setTimeout(function(){//here!
                  getPositionAndShowOnMap();
              }, 1000);
    }
  };

  $scope.closeModal = function(index) {
    var selectedModal = 'oModal' + index;
    $scope[selectedModal].hide();
  };


  $scope.$on('modal.shown', function(event, modal) {
    console.log('Modal ' + modal.id + ' is shown!');
  });

  $scope.$on('modal.hidden', function(event, modal) {
    console.log('Modal ' + modal.id + ' is hidden!');
  });

  $scope.changeLocation = function(){
    $scope.location.name = $scope.search.locationName;
    $scope.location.lat = $scope.search.locationLat;
    $scope.location.lon = $scope.search.locationLon;

    var skillRef = fb.child("workshops/"+$scope.search.keyWord);
    var $geo = $geofire(skillRef);
    var query = $geo.$query({
      center: [$scope.location.lat, $scope.location.lon],
      radius: $scope.searchradius
    });
    geoQueryCallback.cancel();
    geoQueryCallback2.cancel();

    geoQueryCallback = query.on("key_entered", $scope.search.keyWord);
    geoQueryCallback2 = query.on("ready", $scope.search.keyWord+"finished");
  }

  //Collapsible list controllers
  $scope.toggleGroup = function(group) {
    if ($scope.isGroupShown(group)) {
      $scope.shownGroup = null;
    } else {
      $scope.shownGroup = group;
    }
  };
  $scope.isGroupShown = function(group) {
    return $scope.shownGroup === group;
  };

  if (enableIntercom&&window.cordova) {
        intercom.updateUser({ 'lastWorkshopCat': $scope.search.keyWord});
        intercom.logEvent("WorkshopSearchCtrl", {
              'event_at': new Date().getTime(),
              'workshopCat': $scope.search.keyWord
        });
  }

})

.controller('WorkshopIndividualCtrl', function($scope, $state, $ionicScrollDelegate, $stateParams, $ionicModal, $ionicLoading, Utilities, Push, Geolocation, $timeout, $geofire, geohash, $ionicSlideBoxDelegate, Workshops, Chats) {
  $scope.authData = fb.getAuth();
  $scope.currentview = $state.current.name;
  console.log("Now viewing "+$scope.currentview);
  $scope.search = {};
  console.log($stateParams.keyWord);
  $scope.search.keyWord = $stateParams.keyWord.replace(/space/g, " ");
  $scope.search.keyWord = $scope.search.keyWord.replace(/and/g, "&");
  $scope.search.keyWordtoPass = $stateParams.keyWord;
  $scope.workshopId = $stateParams.workshopId;
  var currentTime = (new Date()).getTime();

  var WorkshopRef = fb.child("workshops/"+$scope.search.keyWord+"/"+$stateParams.workshopId);
  WorkshopRef.on("value", function(snapshot) {

    $scope.workshop = snapshot.val();
    if($scope.workshop.workshopSchedule){
    $scope.workshop.workshopSchedule = Utilities.convertToArrayWithKey($scope.workshop.workshopSchedule);
     for(var i=$scope.workshop.workshopSchedule.length-1; i>=0; i--){
      if($scope.workshop.workshopSchedule[i].expiryTime < currentTime){
        $scope.workshop.workshopSchedule.splice(i,1);
      }
    }
  }
  if($scope.workshop.fixedSlots){
    $scope.workshop.fixedSlots = Utilities.convertToArrayWithKey($scope.workshop.fixedSlots);
    for(var i=$scope.workshop.fixedSlots.length-1; i>=0; i--){
      if($scope.workshop.fixedSlots[i].expiryTime < currentTime){
        $scope.workshop.fixedSlots.splice(i,1);
      }
    }
  }

  if($scope.workshop.views!=null){
    if(!$scope.test.hasOwnProperty($scope.authData.uid)){

    }
  }

    if($scope.workshop.promotions != null)
    {
      $scope.havePromo = true;
    }

  });

  var userRef = fb.child("users/"+$scope.authData.uid);
  userRef.on("value", function(snapshot){
    $scope.user = snapshot.val();
  });

  $scope.startChat = function() {

    $ionicLoading.show({
      template: '<ion-spinner icon="spiral"></ion-spinner>'
    });

    var message = "Hey, I have an enquiry about your workshop, "+$scope.workshop.workshopTitle+".";

    var sender = $scope.user;
    var receiver = $scope.workshop.provider;
    var senderid = $scope.authData.uid;
    var receiverid = $scope.workshop.provider.providerID;
    var faces = {sender: sender.face, receiver: receiver.providerCover};
    var names = {sender: sender.name, receiver: receiver.providerName};
    var orderId = {workshopId: $scope.workshopId, workshopCategory: $scope.search.keyWord};

    Chats.startChat(senderid, receiverid, faces, names, message, orderId, 4).then(function(){

      console.log("Established Chat Regarding Workshop");
    });

    $timeout(function() {
      //$window.location.reload();
      $ionicLoading.hide();
      $state.go('tab.chats');
    }, 2000);
  }

  $scope.ReadMore = function(){
    $scope.showDescription=true;
    $scope.resizeScroll();
  }

  $scope.resizeScroll = function(){
    var scrollresizeTimeout = $timeout(function() {
      $ionicScrollDelegate.resize();
    }, 250); // delay 250 ms
  }

  $scope.disclaimerAlert = function(text){

    function route(buttonIndex) {
      //alert('We should redirect you');
      switch(buttonIndex){
        case 1: break; //do nothing
        case 2: $scope.startChat(); break;
      }

      //we should also add an update digit to the chat list

    }

    navigator.notification.confirm(
      text,  // message
      route,              // callback to invoke with index of button pressed
      'Chat Request',            // title
      'Cancel,Yes'          // buttonLabels
    );
  }
if (enableIntercom&&window.cordova) {
        intercom.updateUser({ 'lastWorkshop': $stateParams.workshopId});
        intercom.logEvent("WorkshpoIndividualCtrl", {
              'event_at': new Date().getTime(),
              'workshopId': $stateParams.workshopId
          });
    }

})

.controller('WorkshopHolderCtrl', function($scope, $state, $ionicScrollDelegate, $ionicHistory, $stateParams, $ionicModal, $ionicLoading, Utilities, Push, Geolocation, $timeout, $geofire, geohash, $ionicSlideBoxDelegate, Workshops) {
  $scope.authData = fb.getAuth();
  $scope.currentview = $state.current.name;
  $scope.results = [];

  $scope.randomGif = Utilities.randomGif;

  var HolderRef = fb.child("workshopHolder/"+$stateParams.holderId);
  HolderRef.on("value", function(snapshot) {

    $scope.holder = snapshot.val();
    $scope.workshopsArray = Utilities.convertToArrayWithKey($scope.holder.HolderWorkshops);
    for(var i in $scope.workshopsArray){
      Workshops.getWorkshop($scope.workshopsArray[i].key, $scope.workshopsArray[i].WorkshopCategory).then(function(result){
        result.keyToPass = result.category.replace(/space/g, " ");
        result.keyToPass = result.keyToPass.replace(/and/g, "&");
        console.log($scope.results);
        $scope.results.push(result);
      });
    }

    var viewedPersonRef = fb.child("viewed").child($stateParams.holderId);
      viewedPersonRef.on("value", function(snapshot){
        var record = snapshot.val();
        if(record!=null&&record.hasOwnProperty($scope.authData.uid)){
          //Do Nothing
          console.log($stateParams.holderId+" has been viewed before");

        } else {
          console.log("Write new view entry");
          viewedPersonRef.child($scope.authData.uid).set(true);
        }
        HolderRef.update({'HolderViews':Object.keys(record).length});

      });
  });

  if (enableIntercom&&window.cordova) {
        intercom.updateUser({ 'lastWorkshopHolder': $stateParams.holderId});
        intercom.logEvent("WorkshopHolderCtrl", {
              'event_at': new Date().getTime(),
              'subject': $stateParams.holderId
          });
    }
})

.controller('WorkshopBookingCtrl', function($rootScope, moment, $http, $ionicPopup, $scope, $state, $ionicScrollDelegate, $ionicHistory, $stateParams, $ionicModal, $ionicLoading, Utilities, Push, Geolocation, $timeout, $geofire, geohash, $ionicSlideBoxDelegate, Workshops) {
  $scope.authData = fb.getAuth();
  $scope.currentview = $state.current.name;
  console.log("Now viewing "+$scope.currentview);
  $scope.search = {};
  console.log($stateParams.keyWord);
  $scope.search.keyWord = $stateParams.keyWord.replace(/space/g, " ");
  $scope.search.keyWord = $scope.search.keyWord.replace(/and/g, "&");
  $scope.search.keyWordtoPass = $stateParams.keyWord;
  $scope.workshopArray = [];
  $scope.bookingQuantity = 1;
  $scope.promotionSelected = false;
  var currentTime = (new Date()).getTime();

  var WorkshopRef = fb.child("workshops/"+$scope.search.keyWord+"/"+$stateParams.workshopId);
  WorkshopRef.on("value", function(snapshot) {

    $scope.workshop = snapshot.val();
    if($scope.workshop.ticketType=='date'){
      $scope.workshopArray = Utilities.convertToArrayWithKey($scope.workshop.workshopSchedule);

      for(var i=$scope.workshopArray.length-1; i>=0; i--){
        if($scope.workshopArray[i].expiryTime < currentTime){
          $scope.workshopArray.splice(i,1);
        }
      }

    }else if($scope.workshop.ticketType=='general'){
      console.log("general");
      $scope.workshopArray = Utilities.convertToArrayWithKey($scope.workshop.ticket);
    }else if($scope.workshop.ticketType=='fixedslots'){
      console.log("fixedslots");
      $scope.workshopArray = Utilities.convertToArrayWithKey($scope.workshop.fixedSlots);

      for(var i=$scope.workshopArray.length-1; i>=0; i--){
        if($scope.workshopArray[i].expiryTime < currentTime){
          $scope.workshopArray.splice(i,1);
        }
      }
    }

  });

  $scope.selectItem = function(index){

    if($scope.workshop.ticketType=='date'){
      for(var j in $scope.workshopArray){
        $scope.workshopArray[j].checked= false;
      }
      $scope.workshopArray[index].checked = true;
      $scope.checkedIndex = index;
      $scope.startTime = $scope.workshopArray[index].startTime;
      $scope.endTime = $scope.workshopArray[index].endTime;
    }else if($scope.workshop.ticketType=='general'){
      for(var j in $scope.workshopArray){
        $scope.workshopArray[j].checked= false;
      }
      $scope.workshopArray[index].checked = true;
      $scope.checkedIndex = index;
      $scope.startTime = 0;
      $scope.endTime = 0;
    }else if($scope.workshop.ticketType=='fixedslots'){
      for(var j in $scope.workshopArray){
        $scope.workshopArray[j].checked= false;
      }
      $scope.workshopArray[index].checked = true;
      $scope.checkedIndex = index;
      $scope.startTime = $scope.workshopArray[index].startTime;
      $scope.endTime = 0;
      $scope.bookeddescription = $scope.workshopArray[index].Description;
      console.log($scope.bookeddescription);
    }

    //add in index ID for timing
    //do conversion
    $scope.workshopPrice = $scope.workshop.price;
    $scope.workshopOption = moment($scope.startTime, "x").format("h:mm A dddd, MMMM Do YYYY");;
    $scope.selected = true;
    $scope.optionID = $scope.workshopArray[index].key;

    console.log($scope.optionID);

    //change here to specific stripeacc
    var merchantID = $scope.workshop.provider.providerID;
    var stripeAccRef = fb.child("stripeAccounts/"+merchantID);

    stripeAccRef.once("value", function(snapshot) {

      $scope.stripeAcc = snapshot.val().stripeID;
      console.log('merchant stripe acc: '+ $scope.stripeAcc);
    });

    /*
    var PermissionsRef = fb.child("permissions/65/payment/status");
    PermissionsRef.once("value", function(snapshot) {

    $scope.paymentStatus = snapshot.val();
    console.log('paymentStatus: '+ $scope.paymentStatus);
  });
  */
};

$scope.doCheckout = function(bookingQuantity1)
{

  if($scope.workshop.ticketType=='fixedslots'){
    $scope.workshop.bookeddescription = $scope.bookeddescription;
    console.log($scope.bookeddescription);
    console.log($scope.workshop.bookeddescription);
  }
  console.log("Proceeding to checkout");
  $scope.bookingQuantity = bookingQuantity1;
  $scope.promotionSelected = false;

  $scope.finalPrice = $scope.workshopPrice*$scope.bookingQuantity;
  $scope.promoHeader = "promo"+$scope.bookingQuantity;
  console.log($scope.promoHeader);

  var promoRef = fb.child("workshops/"+$scope.search.keyWord+"/"+$stateParams.workshopId+"/promotions/"+$scope.promoHeader);
  promoRef.once("value", function(snapshot) {

    //Null value if there is no promotion
    $scope.promoValue = snapshot.val().promovalue;
    console.log($scope.promoValue);
    $scope.finalPrice = $scope.promoValue;
    $scope.promotionSelected = true;
  });

  $scope.oModal1.show();
};

$scope.onSubmit = function () {
  console.log('submitting');


  $ionicLoading.show({
    template: 'Processing Transaction'
  });


  $scope.processing = true;
};

$scope.hideAlerts = function () {
  $scope.stripeError = null;
  $scope.stripeToken = null;
};

$scope.stripeCallback = function (code, result) {

  $scope.processing = false;
  $scope.hideAlerts();
  if (result.error) {
    $ionicLoading.hide();
    $scope.stripeError = result.error.message;
    console.log("Stripe returned an error "+ result.error.message);
    $ionicPopup.alert({
      title: 'Error!',
      template: result.error.message
    });
  } else {

    $scope.stripeToken = result.id;
    console.log("Stripe returned a token "+ result.id);
    console.log($scope.workshop);
    $http({
      method: 'POST',
      url: 'https://pay1.learnly.sg/charge',
      data: {paymentQuantity:$scope.bookingQuantity, optionID:$scope.optionID, paymentStatus:$rootScope.paymentStatus, stripeToken:result.id, stripeAmount:$scope.finalPrice*100, stripeDes:$scope.workshop.workshopTitle, stripeAcc:$scope.stripeAcc, workshopObj:$scope.workshop ,studentID:$scope.authData.uid, startTime:$scope.startTime, endTime:$scope.endTime }
    }).success(function (data, status, headers, config) {

      console.log('Stripe customer created');
      console.log('data ' + JSON.stringify(data));
      console.log('status ' + JSON.stringify(status));
      console.log('headers ' + JSON.stringify(headers));
      console.log('config ' + JSON.stringify(config));

      if(data!=null) {

        if(enableIntercom&&window.cordova){
                intercom.updateUser({
                  'custom_attributes': {
                    'Has_Booked_Workshop': true,
                  }
                });
        }

        $ionicLoading.hide();
        $scope.closeModal(1);
        $state.go('tab.account').then(function() {

          navigator.notification.alert(
            'Thank you, please enjoy your lessons!',  // message
            null,  // callback
            'Payment Succeeded', // title
            'OK'   // buttonName
          );

          //do push here
          Push.getToken($scope.workshop.provider.providerID).then(function(destinationToken){
            var notification = "A student has registered for your workshop!";
            Push.sendNotification(destinationToken, notification);
            console.log("workshop confirmation notification");
          });

        });



      } else {
        $ionicPopup.alert({
          title: 'Payment Error',
          template: 'Error in payment, please try again'
        });
      }

    }).error(function (data, status, headers, config) {
      console.log('Stripe customer creation error');
      console.log('data ' + JSON.stringify(data));
      console.log('status ' + JSON.stringify(status));
      console.log('headers ' + JSON.stringify(headers));
      console.log('config ' + JSON.stringify(config));
      $ionicLoading.hide();

      $ionicPopup.alert({
        title: 'Error!',
        template: 'Please try again'
      });


    });

  }

};

//IMPLEMENT MODALS HERE TO CONFIRM USER DATA
//Displays user profile picture
$ionicModal.fromTemplateUrl('templates/checkoutconnect.html', {
  id: '1',
  scope: $scope,
  backdropClickToClose: false,
  animation: 'slide-in-up'
}).then(function(modal) {
  $scope.oModal1 = modal;
});

$scope.openModal = function(index) {
  var selectedModal = 'oModal' + index;
  $scope[selectedModal].show();
};

$scope.closeModal = function(index) {
  var selectedModal = 'oModal' + index;
  $scope[selectedModal].hide();
};


$scope.$on('modal.shown', function(event, modal) {
  console.log('Modal ' + modal.id + ' is shown!');
});

$scope.$on('modal.hidden', function(event, modal) {
  console.log('Modal ' + modal.id + ' is hidden!');
});

// Cleanup the modals when we're done with them (i.e: state change)
// Angular will broadcast a $destroy event just before tearing down a scope
// and removing the scope from its parent.
$scope.$on('$destroy', function() {
  console.log('Destroying modals...');
  $scope.oModal1.remove();
});

if (enableIntercom&&window.cordova) {
        intercom.logEvent("WorkshopBookingCtrl", {
              'event_at': new Date().getTime(),
              'workshopId': $stateParams.workshopId
          });
    }


})

.controller('MapCtrl', function($scope, $state, $stateParams) {

  var myLatlng = new google.maps.LatLng($stateParams.Lat, $stateParams.Lon);

  var marker = new google.maps.Marker({
    position: myLatlng,
    map: map,
    title: 'Click to zoom'
  });

  var mapOptions = {
    center: myLatlng,
    zoom: 16,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  var map = new google.maps.Map(document.getElementById("map4"), mapOptions);

  $scope.map = map;

  marker = new google.maps.Marker({
    position: myLatlng,
    map: map,
    title: 'Click to zoom'
  });

})

.controller('OrderCtrl', function($scope, $ionicScrollDelegate, $stateParams, $ionicModal, $ionicLoading, Utilities, Reviews, Push, ionicDatePicker, ionicTimePicker) {

  $scope.orderId = $stateParams.id;
  $scope.orderType = $stateParams.type;
  $scope.authData = fb.getAuth();
  $scope.person = {};
  $scope.allowReview = false;
  $scope.chatId = $stateParams.chatId;
  $scope.addClass = false;
  $scope.classExpired = false;

  $scope.getTimeOfDayPicture = function (timeOfDay) {
    return 'img/assets/' + timeOfDay+'.png';
  };

  $ionicLoading.show({
    template: '<ion-spinner icon="spiral"></ion-spinner>'
  });

  var orderRef = fb.child("orders/"+$scope.orderType+"/open/"+$scope.orderId);
  orderRef.on("value", function(snapshot) {

    $scope.order = snapshot.val();

    var classRef = fb.child("orders/"+$scope.orderType+"/open/"+$scope.orderId+"/classes");
    classRef.orderByChild("bookingtime").limitToLast(1).on("value", function(bookings) {
      $scope.classExpired = false;
      $scope.addClass = false;
      $scope.lessons = bookings.val();
      $scope.classes = [];

      if($scope.lessons){
            bookings.forEach(function(value) {
              $scope.classes.push({'value':value.val(),'key':value.key()});
              var currentTime = new Date().getTime();
              if($scope.classes[0].value.bookingtime<currentTime){
                $scope.classExpired = true;
                $scope.addClass = true;
              }
            });
              console.log("There are classes specified");
            } else {
              $scope.classes = null;
              console.log("No classes have been specified");
              $scope.addClass = true;
            }

          });

    if($scope.authData.uid===$scope.order.requesterid){
      if(typeof $scope.order.requester_reviewed === 'undefined'){
        $scope.allowReview = true;
      }


    } else if ($scope.authData.uid===$scope.order.providerid){
      if(typeof $scope.order.provider_reviewed === 'undefined'){
        $scope.allowReview = true;
      }
    }

    // TOGGLING PERSON TO DISPLAY
    if($scope.orderType==='gigs'){
      $scope.idToRetrieve = $scope.order.requesterid;
    } else if ($scope.authData.uid == $scope.order.requesterid) {
      $scope.idToRetrieve = $scope.order.providerid;
    } else {
      $scope.idToRetrieve = $scope.order.requesterid;
    }

    console.log("id to use is "+$scope.idToRetrieve);

    //RETRIEVING  INFO Of PERSON TO DISPLAY
    var personRef = fb.child("users").child($scope.idToRetrieve);
    personRef.on("value", function(snapshot) {
      $scope.person = snapshot.val();
      //$scope.$apply();
    });

    var userRef = fb.child("users").child($scope.authData.uid);
    userRef.on("value", function(snapshot) {
      $scope.user = snapshot.val();
      //$scope.$apply();
    });

    if($scope.order.provider_reviewed){
      console.log("Retrieving provider's review");
      Reviews.getOrderReview($scope.order.requesterid,$scope.orderId).then(function(result){
        $scope.provider_review = result;
      });
    }

    if($scope.order.requester_reviewed){
      //retrieve for 2 persons
      console.log("Retrieving requester's review");
      Reviews.getOrderReview($scope.order.providerid,$scope.orderId).then(function(result){
        $scope.requester_review = result;
      });
    }

    $ionicLoading.hide();

  });


  $scope.loadAllClasses = function(){
    var classRef = fb.child("orders/"+$scope.orderType+"/open/"+$scope.orderId+"/classes");
    classRef.orderByChild("bookingtime").on("value", function(snapshot) {
      $scope.lessons = snapshot.val();
      var arraylength = Utilities.convertToArrayWithKey($scope.lessons).length;
      var itemnumber = 0;
      var numberofitemstoadd = arraylength-4;
      snapshot.forEach(function(value) {
        if (itemnumber < numberofitemstoadd){
          console.log(value.val());
          $scope.classes.splice(itemnumber,0,({'value':value.val(),'key':value.key()}));
          itemnumber++;
        }else{
          return true;
        }
      });
    });
    $scope.loadedAll = true;
    setTimeout(function () {
      console.log('expand scroll');
      $ionicScrollDelegate.resize();

    },150);
  }

  /*
  //make a function to get user by user id

  //get requester's info
  var requsterRef = fb.child("users/")

  */

  //Ratings
  $scope.testimonial = {};
  $scope.testimonial.rating = 2;

  $scope.ratingsObject = {
    iconOn: 'ion-ios-star',    //Optional
    iconOff: 'ion-ios-star-outline',   //Optional
    iconOnColor: 'rgb(200, 200, 100)',  //Optional
    iconOffColor:  'rgb(200, 100, 100)',    //Optional
    rating:  2, //Optional
    minRating:1,    //Optional
    readOnly: false, //Optional
    callback: function(rating) {    //Mandatory
      $scope.ratingsCallback(rating);
    }
  };

  $scope.ratingsCallback = function(rating) {
    console.log('Selected rating is : ', rating);
    $scope.testimonial.rating = rating;
  };

  $scope.setReview = function() {
    var idToReview = $scope.order.requesterid;
    //Review should be targeted at the other party
    if(idToReview===$scope.authData.uid){
      idToReview = $scope.order.providerid;
    }
    console.log("using",idToReview);

    $scope.testimonial.reviewer_face = $scope.user.face;
    $scope.testimonial.reviewer_id = $scope.authData.uid;
    $scope.testimonial.reviewer_name = $scope.user.name;
    $scope.testimonial.orderType = $scope.orderType;

    Reviews.setReview(idToReview, $scope.orderId, $scope.testimonial);
    /*
    if(typeof $scope.order.reviewed ==='undefined'){
    orderRef.update({"reviewed": $scope.authData.uid});
  } else {
  orderRef.update({"reviewed": true});
}
*/
if($scope.authData.uid===$scope.order.requesterid){
  orderRef.update({"requester_reviewed": true});
} else if ($scope.authData.uid===$scope.order.providerid){
  orderRef.update({"provider_reviewed": true});
}


$scope.allowReview = false;


Push.getToken(idToReview).then(function(destinationToken){
  var notification = $scope.user.name+" has left you a review";

  console.log("Destination found", destinationToken);
  Push.sendNotification(destinationToken, notification);
});

};

//IMPLEMENT MODALS HERE TO CONFIRM USER DATA
// Modal 1
$ionicModal.fromTemplateUrl('templates/booking/writetestimonial.html', {
  id: '1', // We need to use and ID to identify the modal that is firing the event!
  scope: $scope,
  backdropClickToClose: false,
  animation: 'slide-in-up'
}).then(function(modal) {
  $scope.oModal1 = modal;
});

//modal may have to take extra parameter _skill
$scope.openModal = function(index, _skill) {
  var selectedModal = 'oModal' + index;
  $scope[selectedModal].show();
  $scope.skill = _skill;
};

$scope.closeModal = function(index) {
  var selectedModal = 'oModal' + index;
  $scope[selectedModal].hide();
};

/* Listen for broadcasted messages */

$scope.$on('modal.shown', function(event, modal) {
  console.log('Modal ' + modal.id + ' is shown!');
});

$scope.$on('modal.hidden', function(event, modal) {
  console.log('Modal ' + modal.id + ' is hidden!');
});

// Cleanup the modals when we're done with them (i.e: state change)
// Angular will broadcast a $destroy event just before tearing down a scope
// and removing the scope from its parent.
$scope.$on('$destroy', function() {
  console.log('Destroying modals...');
  $scope.oModal1.remove();
});

  if (enableIntercom&&window.cordova) {
    intercom.logEvent("OrderCtrl", {
      'event_at': new Date().getTime()
    });
  }

})

.controller('OrderCreateCtrl', function($scope, $ionicHistory, $stateParams, $ionicModal, Utilities, Reviews, Push, ionicDatePicker, ionicTimePicker) {
  $scope.orderId = $stateParams.id;
  $scope.orderType = $stateParams.type;
  $scope.authData = fb.getAuth();
  $scope.person = {};
  $scope.allowReview = false;
  var currentDate = new Date();
  $scope.duration = {};
  $scope.pickedprice = {};
  $scope.paymentEnabled = false;
  $scope.paymentMethod = 'Cash';

  var ipObj1 = {
    callback: function (val) {  //Mandatory
        console.log('Return value from the datepicker popup is : ' + val, new Date(val));
        $scope.pickeddate = new Date(val);
      },
      disabledDates: [            //Optional
      ],
      from: new Date(2016, 1, 1), //Optional
      to: new Date(2020, 10, 30), //Optional
      inputDate: new Date(),      //Optional
      mondayFirst: true,          //Optional
      closeOnSelect: false,       //Optional
      templateType: 'popup'       //Optional
    };

    $scope.openDatePicker = function(){
      ionicDatePicker.openDatePicker(ipObj1);
    };

    var ipObj2 = {
    callback: function (val) {      //Mandatory
      if (typeof (val) === 'undefined') {
        console.log('Time not selected');
      } else {
        var selectedTime = new Date(val * 1000);
        console.log('Selected epoch is : ', val, 'and the time is ', selectedTime.getUTCHours(), 'H :', selectedTime.getUTCMinutes(), 'M');
        $scope.pickedtime = new Date();
        $scope.pickedtime.setMinutes(selectedTime.getUTCMinutes());
        $scope.pickedtime.setHours(selectedTime.getUTCHours());
        console.log('Return value from the datepicker popup is : ' + $scope.confirmeddate, $scope.pickeddate, new Date($scope.confirmeddate), new Date($scope.pickeddate));
      }
    },
    inputTime: 50400,   //Optional
    format: 12,         //Optional
    step: 15,           //Optional
    setLabel: 'Set'    //Optional
  };

  var saveResult = function (data) {
    $scope.duration = data.from;
    console.log("this is" + $scope.duration);
  };

  var savePrice = function (data) {
    $scope.pickedprice = data.from;
    console.log("this is" + $scope.pickedprice);
  };

  $scope.openTimePicker = function(){
    ionicTimePicker.openTimePicker(ipObj2);

  }

  $scope.getTimeOfDayPicture = function (timeOfDay) {
    return 'img/assets/' + timeOfDay+'.png';
  };

  var orderRef = fb.child("orders/"+$scope.orderType+"/open/"+$scope.orderId);
  orderRef.on("value", function(snapshot) {
          $scope.order = snapshot.val();

        $scope.pickedprice = $scope.order.orderDetails.rate;
        if(typeof $scope.order.orderDetails.duration != 'undefined'){
          $scope.duration = $scope.order.orderDetails.duration;
        }else{
          $scope.duration = 2;
        }
        console.log($scope.duration);
        console.log("duration");
        if($scope.order.paymentEnabled==true){
          $scope.paymentEnabled = true;
          $scope.paymentMethod = 'Online';
        }

          var $range = $(".js-range-slider");

          $range.ionRangeSlider({
            type: "single",
            min: 1,
            max: 10,
            from: $scope.duration,
            step: 0.5,
            onFinish: function (data) {
              saveResult(data);
            }
          });

          var $range2 = $(".js-range-slider2");

          $range2.ionRangeSlider({
            type: "single",
            min: 10,
            max: 150,
            from: $scope.pickedprice,
            step: 5,
            prefix: '$',
            onFinish: function (data) {
              savePrice(data);
            }
          });

          // TOGGLING PERSON TO DISPLAY
          if($scope.orderType==='gigs'){
            $scope.idToRetrieve = $scope.order.requesterid;
          } else if($scope.authData.uid == $scope.order.requesterid){
            $scope.idToRetrieve = $scope.order.providerid;
          } else {
            $scope.idToRetrieve = $scope.order.requesterid;
          }

          console.log("id to use is "+$scope.idToRetrieve);

    //RETRIEVING  INFO Of PERSON TO DISPLAY
    var personRef = fb.child("users").child($scope.idToRetrieve);
    personRef.on("value", function(snapshot) {
      $scope.person = snapshot.val();
      //$scope.$apply();
    });

    var userRef = fb.child("users").child($scope.authData.uid);
    userRef.on("value", function(snapshot) {
      $scope.user = snapshot.val();
      //$scope.$apply();
    });
  });


  /*
  //make a function to get user by user id

  //get requester's info
  var requsterRef = fb.child("users/")

  */

$scope.createOrder = function(receiverid){
    if ($scope.pickeddate&&$scope.pickedtime) {
      $scope.confirmeddate = $scope.pickeddate;
      $scope.confirmeddate.setMinutes($scope.pickedtime.getMinutes());
      $scope.confirmeddate.setHours($scope.pickedtime.getHours());
      console.log($scope.confirmeddate);
      var thetime = $scope.confirmeddate;
      thetime = thetime.getTime();
      var thePrice = $scope.duration * $scope.pickedprice;
      var theOrderDetails = { "duration":$scope.duration, "rate" : $scope.pickedprice, "bookingtime":thetime, "totalPrice": thePrice}
      var orderRef = fb.child("orders/"+$scope.orderType+"/open/"+$scope.orderId+"/orderDetails");
      orderRef.update({"rate":$scope.pickedprice, "duration":$scope.duration});
      var classRef = fb.child("orders/"+$scope.orderType+"/open/"+$scope.orderId+"/classes");
      var newclassRef = classRef.push({ "duration":$scope.duration, "rate" : $scope.pickedprice, "bookingtime":thetime, "totalPrice": thePrice, "paymentMethod":$scope.paymentMethod});
      console.log("the lesson reference is " + newclassRef.key());
      var chatRefChild = fb.child("chats/"+$stateParams.chatId);
      var newChatRefChild = chatRefChild.push({
        'sender': $scope.authData.uid,
        'order': theOrderDetails,
        'lessonId': newclassRef.key(),
        'time': Firebase.ServerValue.TIMESTAMP,
        'payment': $scope.paymentMethod,
        'text': 'Refer to the Offer Details below or tap on Details to view the offer.'
      }, function(){
        newclassRef.update({messageId: newChatRefChild.key()});
        console.log("Pushed order to message");
      //Need to also alter the last message of the chat items
      });
        Push.getToken(receiverid).then(function(destinationToken){
      var notification = $scope.user.name+" has offered a lesson";
      console.log("Destination found", destinationToken);
      Push.sendNotification(destinationToken, notification);
    });

    if (enableIntercom&&window.cordova) {
      intercom.logEvent("class_created", {
        'event_at': new Date().getTime(),
        'classId': newclassRef.key()
      });
    }
    $ionicHistory.goBack(-2);
    }else{

    navigator.notification.alert(
      'Please Select a Lesson Date and Timing',  // message
      null,  // callback
      'Request Error', // title
      'OK'   // buttonName
    );
    }
  }

  if (enableIntercom&&window.cordova) {
    intercom.logEvent("OrderCreateCtrl", {
      'event_at': new Date().getTime()
    });
  }

})

.controller('OrderDetailCtrl', function($scope, $ionicHistory, $stateParams, $ionicModal, Utilities, Reviews, Push, ionicDatePicker, ionicTimePicker) {
  $scope.orderId = $stateParams.id;
  $scope.orderType = $stateParams.type;
  $scope.classId = $stateParams.class;
  $scope.authData = fb.getAuth();
  $scope.person = {};
  $scope.allowReview = false;
  $scope.pickeddate = new Date();
  $scope.pickedtime = new Date();
  $scope.duration = {};
  $scope.pickedprice = {};
  $scope.chatId = $stateParams;
  $scope.currentTime = new Date().getTime();

 var ipObj1 = {
      callback: function (val) {  //Mandatory
        console.log('Return value from the datepicker popup is : ' + val, new Date(val));
        $scope.pickeddate = new Date(val);
        $scope.pickeddate.setHours($scope.pickedtime.getHours());
        $scope.pickeddate.setMinutes($scope.pickedtime.getMinutes());
        $scope.confirmeddate = $scope.pickeddate;
        console.log('Return value from the datepicker popup is : ' + $scope.confirmeddate, $scope.pickeddate, new Date($scope.confirmeddate), new Date($scope.pickeddate));
      },
      disabledDates: [            //Optional
      ],
      from: new Date(2016, 1, 1), //Optional
      to: new Date(2020, 10, 30), //Optional
      inputDate: new Date(),      //Optional
      mondayFirst: true,          //Optional
      closeOnSelect: false,       //Optional
      templateType: 'popup'       //Optional
    };

    $scope.openDatePicker = function(){
      ionicDatePicker.openDatePicker(ipObj1);
    };

    var ipObj2 = {
    callback: function (val) {      //Mandatory
      if (typeof (val) === 'undefined') {
        console.log('Time not selected');
      } else {
        var selectedTime = new Date(val * 1000);
        console.log('Selected epoch is : ', val, 'and the time is ', selectedTime.getUTCHours(), 'H :', selectedTime.getUTCMinutes(), 'M');
        $scope.pickeddate.setMinutes(selectedTime.getUTCMinutes());
        $scope.pickeddate.setHours(selectedTime.getUTCHours());
        $scope.pickedtime.setMinutes(selectedTime.getUTCMinutes());
        $scope.pickedtime.setHours(selectedTime.getUTCHours());
        $scope.confirmeddate = $scope.pickeddate;
        console.log('Return value from the datepicker popup is : ' + $scope.confirmeddate, $scope.pickeddate, new Date($scope.confirmeddate), new Date($scope.pickeddate));
      }
    },
    inputTime: 50400,   //Optional
    format: 12,         //Optional
    step: 15,           //Optional
    setLabel: 'Set'    //Optional
  };

  $scope.openTimePicker = function(){

    ionicTimePicker.openTimePicker(ipObj2);

  }

  $scope.getTimeOfDayPicture = function (timeOfDay) {
    return 'img/assets/' + timeOfDay+'.png';
  };

  var orderRef = fb.child("orders/"+$scope.orderType+"/open/"+$scope.orderId);
  orderRef.on("value", function(snapshot) {
    $scope.order = snapshot.val();

    // TOGGLING PERSON TO DISPLAY
    if($scope.orderType==='gigs'){
      $scope.idToRetrieve = $scope.order.requesterid;
    } else if($scope.authData.uid == $scope.order.requesterid){
      $scope.idToRetrieve = $scope.order.providerid;
    } else{
      $scope.idToRetrieve = $scope.order.requesterid;
    }

    console.log("id to use is "+$scope.idToRetrieve);

    //RETRIEVING  INFO Of PERSON TO DISPLAY
    var personRef = fb.child("users").child($scope.idToRetrieve);
    personRef.on("value", function(snapshot) {
      $scope.person = snapshot.val();
    });

    var userRef = fb.child("users").child($scope.authData.uid);
    userRef.on("value", function(snapshot) {
      $scope.user = snapshot.val();
      //$scope.$apply();
    });

    var classRef = fb.child("orders/"+$scope.orderType+"/open/"+$scope.orderId+"/classes/"+$stateParams.class);
    classRef.on("value", function(snapshot) {
      $scope.class = snapshot.val();
      console.log($scope.class);

      if(typeof $scope.class.paymentMethod == 'undefined'){
        $scope.class.paymentMethod = 'Cash'
      }

      $scope.pickedprice = $scope.class.rate;
      $scope.pickeddate = new Date($scope.class.bookingtime);
      $scope.pickedtime = new Date($scope.class.bookingtime);
      $scope.duration = $scope.class.duration;
      $scope.confirmeddate = new Date($scope.class.bookingtime);
      console.log($scope.class.rate);

      var $range = $(".js-range-slider");

      $range.ionRangeSlider({
        type: "single",
        min: 1,
        max: 10,
        from: $scope.duration,
        step: 0.5,
        onFinish: function (data) {
          saveResult(data);
        },
        from_fixed: ($scope.class.confirmed || ($scope.authData.uid!=$scope.order.requesterid))
      });

      var $range2 = $(".js-range-slider2");

      $range2.ionRangeSlider({
        type: "single",
        min: 10,
        max: 150,
        from: $scope.pickedprice,
        step: 5,
        prefix: '$',
        onFinish: function (data) {
          savePrice(data);
        },
        from_fixed: ($scope.class.confirmed || ($scope.authData.uid!=$scope.order.requesterid))
      });
    });
  });


  /*
  //make a function to get user by user id

  //get requester's info
  var requsterRef = fb.child("users/")

  */
  $scope.confirmOrder = function(receiverid){
    var classRef = fb.child("orders/"+$scope.orderType+"/open/"+$scope.orderId+"/classes/"+$stateParams.class);
    classRef.update({"confirmed":true});
    var messageRef = fb.child("chats/"+$stateParams.chatId+"/"+$scope.class.messageId);
    messageRef.once("value", function(snapshot){
      var messageExist = snapshot.exists();
      if(messageExist){
        messageRef.update({"confirmed":true});
      }
    })
    var orderRef = fb.child("orders/"+$scope.orderType+"/open/"+$scope.orderId);

      orderRef.update({"accepted":true});
      Push.getToken(receiverid).then(function(destinationToken){
      var notification = $scope.user.name+" has accepted your offer";
      console.log("Destination found", destinationToken);
      Push.sendNotification(destinationToken, notification);
    });
  }

$scope.deleteclass = function(){
    if(typeof $scope.class.messageId != 'undefined'){
    var messagetoDelete = fb.child("chats/"+$stateParams.chatId+"/"+$scope.class.messageId);
    messagetoDelete.update({"cancelled":true});
    var classToDelete = fb.child("orders/"+$scope.orderType+"/open/"+$scope.orderId+"/classes/"+$stateParams.class);
    classToDelete.set(null);
  }

    $ionicHistory.goBack();
  }


  if (enableIntercom&&window.cordova) {
    intercom.logEvent("OrderDetailCtrl", {
      'event_at': new Date().getTime()
    });
  }

})

.controller('ReviewCtrl', function($scope, Utilities, $stateParams, Orders, Reviews, $state) {
  //$scope.person = this.person;
  //$scope.person = Users.getByAlias($stateParams.coach);

  //we should be using the one from Reviews
  $scope.currentview = $state.current.name;
  console.log($state.current);
  $scope.getOrderTypeName = Orders.getOrderTypeName;

  var personRef = fb.child("users").child($stateParams.coach);
  personRef.on("value", function(snapshot) {
    $scope.person = snapshot.val();
    console.log("Searching for "+$stateParams.coach);
    console.log("Retrieved "+snapshot.numChildren()+" details");
    console.log("Retrieved objects "+JSON.stringify($scope.person));
    //return data;

  });


  var reviewRef = Reviews.getReview($stateParams.coach).then(function(results){
    $scope.reviews = results;
    console.log("Display results");
  });

  $scope.makeArrayOfSize = Utilities.makeArrayOfSize;

  if (enableIntercom&&window.cordova) {
    intercom.logEvent("ReviewCtrl", {
      'event_at': new Date().getTime()
    });
  }

})

.controller('AskCtrl', function($rootScope, $scope, $ionicModal, $ionicActionSheet, $ionicLoading, $ionicSlideBoxDelegate, $state, $window, $ionicHistory, $firebaseObject, $ionicLoading, $filter, $timeout,
  imageUploader, ImageToken, UserAction, Utilities, Skills, Chats, Orders, Push, Bookmarks, UserSkills, Auth, Categories, $cordovaGeolocation, geohash, $ionicScrollDelegate,$geofire, $cordovaCamera) {
    $scope.jobloading=true;
    $scope.requestloading=true;
    $scope.authData = fb.getAuth();
    $scope.replies = {};
    $scope.person = {};
    //Utilities.setCountry();
    $scope.defaultCountry = Utilities.getCurrentCountry();
    $scope.categories = Categories.all($scope.defaultCountry.value);
    $scope.choice = 'Request';

    var userRef = fb.child("users").child($scope.authData.uid);
    userRef.on("value", function(snapshot) {
      $scope.user=snapshot.val();
    });

    //general purpose function for checking if User liked/applied an offer
    function storeLiked(userLiked, results){
      for(var k in results) {
        if(results.hasOwnProperty(k)){
          if(typeof results[k].liked === 'undefined'){
            results[k].liked = userLiked;
            return true;
          }
        }
      }
    }


    var RequestsRef = fbCountry.child("requests");
    var OffersRef = fbCountry.child("jobs");

    function populateResultsBy(childOrderType) {
      //PART 1

      RequestsRef.orderByChild(childOrderType).limitToLast(20).on("value", function(snapshot){

        var requestResults = snapshot.val();
        console.log("Retrieving Requests");
        //console.log("Retrieved objects "+JSON.stringify(results));

        //DETERMINE IF REQUEST HAS BEEN ANSWERED IN THE LIKED OBJECTS
        angular.forEach(requestResults, function(value, job){
          if(requestResults.hasOwnProperty(job)){
            var likedRef = fb.child("liked/jobs").child(job).child($scope.authData.uid);
            likedRef.on("value", function(snapshot){
              var answered = snapshot.val();
              storeLiked(answered, requestResults);
              //requestResults[job].liked = answered;
            });
            var reportRef = fb.child("feedback").child("gigs").child(requestResults[job].requester.id);
            reportRef.on("value", function(snapshot){
              requestResults[job].isReported = snapshot.exists();
            })
          }

            requestResults[job].task.writeup = Utilities.filterUserWriteup(requestResults[job].task.writeup,"the 'Answer' button below");
        });

        $scope.requests = Utilities.convertToArrayWithKey(requestResults);
        $scope.requestloading=false;

      });

      //PART 2

      OffersRef.orderByChild(childOrderType).limitToLast(20).on("value", function(snapshot){
        var offerResults = snapshot.val();
        console.log("Retrieving Jobs/Offers");

        //DETERMINE IF TUTOR HAS BEEN BOOKMARKED
        angular.forEach(offerResults, function(value, person){
          if(offerResults.hasOwnProperty(person)){

            Bookmarks.getLikePersonCount(offerResults[person].requester.id).then(function(likesCount){
              //do nothing
              //storeBookmarkedCount(likesCount, offerResults);
              offerResults[person].personLikes = likesCount;
            });


            offerResults[person].task.writeup = Utilities.filterUserWriteup(offerResults[person].task.writeup, "My Learnly Profile (View Me Button)");

          }
        });

        $scope.jobs = Utilities.convertToArrayWithKey(offerResults);
        $ionicLoading.hide();
        $scope.jobloading=false;

      });
    }

    populateResultsBy("time");

    $scope.categorySlideIndex = 0;

    $scope.categorySlideTo = function(index) {
      $ionicSlideBoxDelegate.slide(index);
    };

    // Called each time the slide changes
    $scope.categorySlideChanged = function(index) {

      $scope.categorySlideIndex = index;
    };

    $scope.reLogin = function() {
      //$ionicLoading.show({template:'Logging out....'});
      $scope.closeModal(2);

      if($scope.authData.provider=='anonymous'){
        var userRef = fb.child("users/"+$scope.authData.uid);
        userRef.set(null);
      }

      console.log("Logging out "+$scope.authData.uid);
      Auth.logout();
      $scope.authData = Auth.getAuth(); //this should be null
      $state.go('intro');

      $timeout(function () {
        $ionicHistory.clearCache();
        $ionicHistory.clearHistory();
      }, 1500);
    }

    $scope.showAlert = Utilities.showAlert;
    $scope.filterUserWriteup = Utilities.filterUserWriteup;

    $scope.showImage = function(picture_url) {
      $scope.imageSrc = picture_url;
      $scope.openModal(0);
    }

    //tutor offers
    $scope.saveTutor = function(subjectId, currentCount, postId){
      Bookmarks.likePerson(subjectId, $scope.authData.uid, $scope.user.name);
      //$scope.jobs[postId].liked = true;
      $scope.jobs[postId].personLikes++;
    };

    $scope.removeTutor = function(subjectId, currentCount, postId){
      Bookmarks.unlikePerson(subjectId, $scope.authData.uid);
      //$scope.jobs[postId].liked = false;
      $scope.jobs[postId].personLikes--;
    };

    //counter that increments when a tutor responds to this ad
    $scope.requestlike = function(jobId, currentCount, jobCreatorId){
      var likedRef = fb.child("liked/jobs").child(jobId).child($scope.authData.uid);
      likedRef.set(true);

      var countRef = fbCountry.child("requests").child(jobId);
      currentCount++;
      countRef.update({"likesCount": currentCount});

      console.log("INCREMENT SUCCESS "+currentCount);
    };

  $scope.deleteJob = function(jobId, jobOwnerId){
    $scope.currentfilter="";
    var jobRef = fbCountry.child("jobs/"+jobId);

    jobRef.set(null);

    //Delete from user model
    var userJobRef = fb.child("users/"+jobOwnerId+"/gigs/"+jobId);
    userJobRef.set(null);

    //Delete from likes
    var userJobLikeRef = fb.child("liked/jobs/"+jobId);
    userJobLikeRef.set(null);


  }

  $scope.chooseTutorToClose = function(request){
    if(typeof request.replies != 'undefined'){
      $scope.replies = Utilities.convertToArrayWithKey(request.replies);
      $scope.requestToClose = request.key;
      $scope.openModal(5);
    }else{
      $scope.confirmCloseRequest(request.key, null);
    }
  }

  $scope.confirmCloseRequest = function(requestId, tutorId){

    var text = "Is this your Chosen Tutor?"

    if(tutorId == null){
      text = "Have you found your tutor?";
    }

    function route(buttonIndex) {
      switch(buttonIndex){
        case 1: break; //do nothing
        case 2: $scope.closeRequest(requestId, tutorId); break;
      }
    }

    navigator.notification.confirm(
      text,  // message
      route,              // callback to invoke with index of button pressed
      'Close Request',            // title
      'No, Yes'          // buttonLabels
    );
  }

  //close a request after tutor has been found
  $scope.closeRequest = function(requestId, tutorId){
    var jobRef = fbCountry.child("requests/"+requestId);

    //jobRef.set(null);
    jobRef.update({'foundTutor': Firebase.ServerValue.TIMESTAMP,'foundTutorId': tutorId}, function(){
      console.log("Indicated tutor was found");
    });

    //Update in user model
    var userJobRef = fb.child("users/"+$scope.authData.uid+"/gigs/"+requestId);
    userJobRef.update({'foundTutor': Firebase.ServerValue.TIMESTAMP, 'foundTutorId': tutorId}, function(){
      console.log("Indicated tutor was found");
    });

    $scope.closeModal(5);
  }

  $scope.deleteRequest = function(requestId, requestOwnerId){
    $scope.currentfilter="";
    var jobRef = fbCountry.child("requests/"+requestId);

    jobRef.set(null);

    //Delete from user model
    var userJobRef = fb.child("users/"+requestOwnerId+"/gigs/"+requestId);
    userJobRef.set(null);

    //Delete from likes
    var userJobLikeRef = fb.child("liked/jobs/"+requestId);
    userJobLikeRef.set(null);
  }

  $scope.randomGif = Utilities.randomGif;

  $scope.reportPost = function(postId, posterId, postText) {

    UserAction.addFeedback($scope.authData.uid, posterId, 1, postId, postText)
    .then(function(result){
      console.log("Created feedback", result);
      $scope.showAlert("Post Reported","We will be looking into it!");
    });

  }

  $scope.reportAlert = function(postId, posterId){

    var text = "Why are you Reporting this User?";

    function route(result) {
      switch(result.buttonIndex){
        case 1: break; //do nothing
        case 2: $scope.reportPost(postId, posterId, result.input1); break;
      }
    }

    navigator.notification.prompt(
      text,  // message
      route,              // callback to invoke with index of button pressed
      'Report',            // title
      ['Cancel', 'Report']          // buttonLabels
    );
  }

  $scope.disclaimerAlert = function(text, gig){

    function route(buttonIndex) {
      //alert('We should redirect you');
      switch(buttonIndex){
        case 1: break; //do nothing
        case 2: $scope.startChat(gig); break;
        //$scope.job.key, $scope.job.task.writeup, $scope.job.price, $scope.job.requester
      }

      //we should also add an update digit to the chat list

    }

    navigator.notification.confirm(
      text,  // message
      route,              // callback to invoke with index of button pressed
      'Answer Request',            // title
      ['Cancel','I Accept']          // buttonLabels
    );
  }

  $scope.needToBeVerifiedTutor = function(notificationType){

    var text = "You need to be a verified tutor to answer this request";

    switch(notificationType){
      case 1: break; //do nothing
      case 2: text = "You need to be a verified tutor to post promotions"; break;
      //$scope.job.key, $scope.job.task.writeup, $scope.job.price, $scope.job.requester
    }

    function route(buttonIndex) {
      //alert('We should redirect you');
      switch(buttonIndex){
        case 1: break; //do nothing
        case 2: $state.go('tab.account'); break;
        //$scope.job.key, $scope.job.task.writeup, $scope.job.price, $scope.job.requester
      }

      //we should also add an update digit to the chat list

    }

    navigator.notification.confirm(
      text,  // message
      route,              // callback to invoke with index of button pressed
      'Answer Request',            // title
      'Cancel,Verify Me'          // buttonLabels
    );
  }

  //initiate a chat with the coach //gigId, gigDesc, gigRate, receiver
  $scope.startChat = function(gig) {

    //increment the tutor response counter
    $scope.requestlike(gig.key, gig.likesCount, $scope.authData.uid);
    //ES6

    if (gig.meta.requestNature == 'Class'){
      var message = "Hey "+gig.requester.name+", I can help you with your request: "+gig.task.writeup+" for $ "+gig.price;
    }else if (gig.meta.requestNature == 'Homework'){
      var message = "Hey "+gig.requester.name+", I can help you with your homework: "+gig.task.writeup;
    }
    //var message = `Hey ${receiver.name}, I can help you with your request: ${gigDesc} for $ ${gigRate}`;

    var senderid = $scope.authData.uid;
    var receiverid = gig.requester.id;
    var faces = {sender: $scope.user.face, receiver: gig.requester.face};
    var names = {sender: $scope.user.name, receiver: gig.requester.name};

    if(typeof gig.duration == 'undefined'){
      gig.duration =null;
    }

    if(gig.meta.requestNature == 'Homework'){
      var orderDetails = {'gigId': gig.key, 'gigDesc': gig.task.writeup, 'gigImage':gig.task.pic};
    }else if(gig.meta.requestNature == 'Class'){
        var orderDetails = {'gigId': gig.key, 'gigDesc': gig.task.writeup, 'rate': gig.price, 'duration': gig.duration};
    }

    //make Order first, then pass Order key to the Chat
    Orders.openTransaction(senderid, receiverid, 1, orderDetails).then(function(orderId){

      $ionicLoading.show({
        template: '<p>Requesting Gig</p><ion-spinner icon="spiral"></ion-spinner>'
      });

      console.log("Established Order "+orderId);
      Chats.startChat(senderid, receiverid, faces, names, message, orderId, 1, gig.task.pic).then(function(){

        var requestRef = fbCountry.child("requests/"+gig.key+"/replies/"+$scope.authData.uid);

        requestRef.update({name: $scope.user.name, face:$scope.user.face});

        console.log("Established Chat Regarding Gig");
        //Push notification is handled by the startchat function

        $timeout(function() {
          //$window.location.reload();
          $ionicLoading.hide();
          $state.go('tab.chats');
        }, 2000);
    });
  });
  }

  $(document).ready(function(){
    //Here your view content is fully loaded !!
  //IMPLEMENT MODALS HERE TO CONFIRM USER DATA
  console.log("loaded");
  // Modal 0
  $ionicModal.fromTemplateUrl('templates/utility/fullscreen.html', {
    id: '0',
    scope: $scope,
    backdropClickToClose: false,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.oModal0 = modal;
  });

  $ionicModal.fromTemplateUrl('templates/ask/relogin.html', {
    id: '2',
    scope: $scope,
    backdropClickToClose: false,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.oModal2 = modal;
  });

  // Modal 5
  $ionicModal.fromTemplateUrl('templates/ask/closeRequest.html', {
    id: '5', // We need to use and ID to identify the modal that is firing the event!
    scope: $scope,
    backdropClickToClose: false,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.oModal5 = modal;
  });

  });

  $scope.openModal = function(index) {
    var selectedModal = 'oModal' + index;
    $scope[selectedModal].show();
  };

  $scope.closeModal = function(index) {
    var selectedModal = 'oModal' + index;
    $scope[selectedModal].hide();
    $scope.shownGroup = null;
    if ((index==1) || (index==4)){
      console.log('reset job');
      $scope.edittingMode = false;
      var geoHash = geohash.encode($scope.user.location.lat,$scope.user.location.lon);
      $scope.job = {'anonymous':false, 'pic':null,'price':50,'writeup':null,'location': $scope.user.location.name,'locationLat': $scope.user.location.lat, 'locationLon': $scope.user.location.lon, 'geoHash':geoHash, 'frequencyType': 'Weekly', 'frequency':1, 'duration':1};
    }
  };

  /* Listen for broadcasted messages */

  $scope.$on('modal.shown', function(event, modal) {
    console.log('Modal ' + modal.id + ' is shown!');
  });

  $scope.$on('modal.hidden', function(event, modal) {
    console.log('Modal ' + modal.id + ' is hidden!');
  });

  // Cleanup the modals when we're done with them (i.e: state change)
  // Angular will broadcast a $destroy event just before tearing down a scope
  // and removing the scope from its parent.
  $scope.$on('$destroy', function() {
    console.log('Destroying modals...');
    $scope.oModal1.remove();
    $scope.oModal2.remove();
    $scope.oModal5.remove();
  });


  //Called when Share button is clicked
  //Need to generate a link that can be sent via Whatsapp, Wechat, Twitter
  $scope.showActionsheet = function() {

    // Show the action sheet
    var hideSheet = $ionicActionSheet.show({
      buttons: [
        { text: 'Copy Link' },
        { text: 'Whatsapp' },
        { text: 'Twitter' }
      ],
      //destructiveText: 'Delete',
      titleText: 'Share This Assignment',
      cancelText: 'Cancel',
      cancel: function() {
        // add cancel code..
      },
      buttonClicked: function(index) {
        return true;
      }
    });

    // For example's sake, hide the sheet after two seconds
    $timeout(function() {
      hideSheet();
    }, 5000);

  };

  $scope.resizeScroll = function(){
    var scrollresizeTimeout = $timeout(function() {
      $ionicScrollDelegate.resize();
    }, 250); // delay 250 ms
  }


  if (enableIntercom&&window.cordova) {
    intercom.logEvent("AskCtrl", {
      'event_at': new Date().getTime()
    });
  }

})

.controller('RequestCtrl', function($rootScope, $scope, $ionicModal, $ionicActionSheet, $ionicLoading, $ionicSlideBoxDelegate, $state, $window, $ionicHistory, $firebaseObject, $ionicLoading, $filter, $timeout,
  imageUploader, ImageToken, UserAction, Utilities, Jobs, Skills, Chats, Orders, Push, Bookmarks, UserSkills, Auth, Categories, $cordovaGeolocation, geohash, $ionicScrollDelegate,$geofire, $cordovaCamera, $stateParams) {

  $scope.authData = fb.getAuth();
  $scope.userLoading = true;
  $scope.submitJobButtonClicked = false;
  //Utilities.setCountry();
  $scope.defaultCountry = Utilities.getCurrentCountry();
  $scope.categories = Categories.all($scope.defaultCountry.value);
  $scope.locationLoading = false;
  $scope.job = {'anonymous':false, 'pic':null, 'price':50, 'frequencyType':'Weekly', 'frequency':1, 'duration':2};

  if($stateParams.requestId!=null&&typeof $stateParams.requestId!='undefined'){
    console.log("edit Request");
    $scope.edittingMode = true;
    var requestRef = fbCountry.child("requests/"+$stateParams.requestId);
    requestRef.on("value", function(snapshot) {
      $scope.job = snapshot.val();
      if($scope.job.task.pic){
        $scope.job.pic = $scope.job.task.pic;
      }
      $scope.job.writeup = $scope.job.task.writeup;
      $scope.job.role = $scope.job.meta.role;
      $scope.job.category = $scope.job.categories;
      $scope.job.requestNature = $scope.job.meta.requestNature;
      $scope.job.tuitionType = $scope.job.meta.tuitionType;
      $scope.job.tuitionGender = $scope.job.meta.tuitionGender;
      $scope.job.locationLat = $scope.job.l[0];
      $scope.job.locationLon = $scope.job.l[1];
      setTimeout(function(){//here!
        getPositionAndShowOnMap();
      }, 1000);
      $scope.userLoading = false;
    });
  }else{
    console.log("Create Request");
    $scope.edittingMode = false;
    var userRef = fb.child("users").child($scope.authData.uid);
    userRef.on("value", function(snapshot) {
      $scope.user = snapshot.val();
      if(typeof $scope.user.location!='undefined') {
        $scope.job.location = $scope.user.location.name;
        if($scope.user.location.lat&&$scope.user.location.lon){
          $scope.job.locationLat = $scope.user.location.lat;
          $scope.job.locationLon = $scope.user.location.lon;
          $scope.job.geoHash = geohash.encode($scope.user.location.lat,$scope.user.location.lon);
        }
      }
      $scope.userLoading = false;
    });
  }

  var $range = $(".js-range-slider");

  $range.ionRangeSlider({
    type: "single",
    min: 15,
    max: 150,
    from: $scope.job.price,
    step: 5,
    prefix: '$',
    onFinish: function (data) {
      saveResult(data);
    }
  });

  var $durationRange = $(".js-range-slider2");

  $durationRange.ionRangeSlider({
    type: "single",
    min: 1,
    max: 10,
    from: $scope.job.duration,
    step: 0.5,
    postfix: 'hr',
    onFinish: function (data) {
      saveDuration(data);
    }
  });

  var $frequencyRange = $(".js-range-slider3");

  $frequencyRange.ionRangeSlider({
    type: "single",
    min: 1,
    max: 10,
    from: $scope.job.frequency,
    step: 1,
    onFinish: function (data) {
      saveFrequency(data);
    }
  });
  var priceSlider = $range.data("ionRangeSlider");
  var durationSlider = $durationRange.data("ionRangeSlider");
  var frequencySlider = $frequencyRange.data("ionRangeSlider");

  var saveResult = function (data) {
      $scope.job.price = data.from;
      $scope.$apply();
  };
  var saveDuration = function (data) {
    $scope.job.duration = data.from;
    $scope.$apply();
  };
  var saveFrequency = function (data) {
    $scope.job.frequency = data.from;
    $scope.$apply();
  };

  $scope.resetFrequency = function(){
    $scope.job.frequency = 1;
    frequencySlider.reset();
    console.log( 'job frequency is ' +$scope.job.frequency);
  }

  $scope.getCurrentLocation = function(){
  $scope.locationLoading=true;
  $cordovaGeolocation.getCurrentPosition().then(function(position){
        console.log("Geolocation success!");
        console.log("Retrieved current location Lat:"+position.coords.latitude+" Lon:"+position.coords.longitude);
        var geocoder = new google.maps.Geocoder();
        var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        var request = {
          latLng: latlng
        };
        geocoder.geocode(request, function(data, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            if (data[0] != null) {
              console.log("address is: " + data[0].formatted_address);
              $scope.job.location = data[0].formatted_address;
              $scope.job.locationLat = position.coords.latitude;
              $scope.job.locationLon = position.coords.longitude;
              $scope.job.geoHash = geohash.encode(position.coords.latitude,position.coords.longitude);
              setTimeout(function(){//here!
                getPositionAndShowOnMap();
            }, 1000);
            } else {
              $scope.showAlert("No address found at current location");
              $scope.locationLoading=false;
            }
          }
        })
    }, function(error){
        console.log("Could not get location");
        $scope.locationLoading=false;
        $scope.showAlert('Please Turn on Location Settings');
    });
  }

  var typingTimer;                //timer identifier
  var doneTypingInterval = 5000;  //time in ms, 5 second for example
  var mapLoaded = false;

  $scope.addressChanged = function(){
    clearTimeout(typingTimer);
    typingTimer = setTimeout($scope.doneTyping(), doneTypingInterval);
  }

//user is "finished typing," do something

  $scope.doneTyping = function(){
    $scope.locationLoading=true;
    var address = $scope.job.location;
    if(address.length!=0){
      var request = {
      'address': address + ' '+Utilities.getCurrentCountry().name
      };
      var geocoder = new google.maps.Geocoder();
      geocoder.geocode(request, function(results) {
        if(results){
          if (results.length!=0) {
            console.log(results);
            $scope.job.locationLat = results[0].geometry.location.lat();
            $scope.job.locationLon = results[0].geometry.location.lng();
            $scope.job.geoHash = geohash.encode($scope.job.locationLat,$scope.job.locationLon);
            setTimeout(function(){//here!
                getPositionAndShowOnMap();
            }, 1000);
          }
        }
      })
    }
  }

  function getPositionAndShowOnMap(){
    $scope.initMap = function() {
      var myLatlng = new google.maps.LatLng($scope.job.locationLat,$scope.job.locationLon);
      console.log('entered map');
      var myOptions = {
        zoom: 16,
        center: myLatlng,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true
      };
      $scope.map = new google.maps.Map(document.getElementById("map"), myOptions);

      var marker = new google.maps.Marker({
        draggable: true,
        position: myLatlng,
        map: $scope.map,
        title: "Your location"
      });
      google.maps.event.trigger( $scope.map, 'resize' );
      $scope.locationLoading=false;
    };
    $scope.initMap();
  }

  $scope.$watch('job.writeup', function(newValue, oldValue) {
    if(newValue){
        if(newValue.length>20){
          $scope.resizeScroll();
          if(mapLoaded == false){
            setTimeout(function(){//here!
                getPositionAndShowOnMap();
            }, 2000);
          }
          mapLoaded = true;
        }else{
          mapLoaded = false;
        }
    }
  });

  $scope.resizeScroll = function(){
    var scrollresizeTimeout = $timeout(function() {
      $ionicScrollDelegate.resize();
    }, 250); // delay 250 ms
  }

  $scope.getSkillPic = function(skillName) {
    if(skillName!=null){
      return Skills.getByName(skillName).pic;
    }
  }

  $scope.toggleGroup = function(group) {
    if ($scope.isGroupShown(group)) {
      $scope.shownGroup = null;
    } else {
      $scope.shownGroup = group;
    }
  };
  $scope.isGroupShown = function(group) {
    return $scope.shownGroup === group;
  };

  $scope.updateRequest = function(request){
    console.log(request);
    var requestRef = fbCountry.child("requests/"+$stateParams.requestId);

      if (request.requestNature == 'Class'){
        var requestDetails = {
          "price": request.price,
          "location": request.location,
          "task": {
            "writeup": request.writeup
          },
          "meta": {
            "role": request.role,
            "requestNature": request.requestNature,
            "tuitionType": request.tuitionType,
            "tuitionGender": request.tuitionGender
          },
          "categories": request.category,
          "duration": request.duration,
          "frequency": request.frequency,
          "frequencyType": request.frequencyType
        };
      }else if(request.requestNature == 'Homework'){
        var requestDetails = {
          "location": request.location,
          "task": {
            "pic": request.pic,
            "writeup": request.writeup
          },
          "meta": {
            "role": request.role,
            "requestNature": request.requestNature,
            "tuitionType": request.tuitionType,
            "tuitionGender": request.tuitionGender
          },
          "categories": request.category,
        };
      }

    var editedJob = requestRef.update(requestDetails);
    $ionicHistory.goBack();
  }

  $scope.showMediaSelector = function(labelIndex) {

  // Show the action sheet
    var hideSheet = $ionicActionSheet.show({
    buttons: [{'text':"Take Photo"},{'text':"Choose Photo"}],
    cancelText: 'Cancel',
    cancel: function() {
      // prompt user for other name
    },
    buttonClicked: function(index) {
      //$scope.newSkill.level = levels[index];
      console.log(index);
      if(index==1){
        $scope.uploadImage();
      }else if(index==0){
        $scope.takePicture();
      }

        return true;
      }
    });
  };

  $scope.takePicture = function() {
        var options = {
            quality : 75,
            destinationType : Camera.DestinationType.DATA_URL,
            sourceType : Camera.PictureSourceType.CAMERA,
            allowEdit : true,
            encodingType: Camera.EncodingType.JPEG,
            targetWidth: 300,
            targetHeight: 300,
            popoverOptions: CameraPopoverOptions,
            saveToPhotoAlbum: false,
            correctOrientation: false
        };

      $cordovaCamera.getPicture(options).then(function(pictureData) {
         var imagedata = 'data:image/jpeg;base64,' + pictureData;
      var blob = Utilities.dataURItoBlob(imagedata);

      var imageTokenRef = fb.child("imagetokens/"+$scope.authData.uid);
      var imageToken = "";

      imageTokenRef.once("value", function(snapshot) {
        imageToken = snapshot.val();
        //console.log("Retrieved image token "+imageToken.token);
        var existingToken = (snapshot.val() !== null);
        console.log("Token exists? "+existingToken);

        $scope.job.pic = "img/gif/loading_shaking.gif";

        if(!existingToken){
          ImageToken.setToken($scope.authData.uid).then(function(data){
            imageToken = data;

            //2 Get Presigned URL
            ImageToken.postImage($scope.authData.uid,imageToken,blob).then(function(url){
              //var url = data;
              console.log("URL obtained is "+url);
              $scope.job.pic = url;
              console.log("Uploaded job picture");
            });

          });
        } else {

          //2 Get Presigned URL  //3 Post to S3 is taken care inside
          ImageToken.postImage($scope.authData.uid,imageToken.token,blob).then(function(url){
            //var url = data["file-url"];
            console.log("URL obtained is "+url);

            $scope.job.pic = url;
            //UserSkills.updateFace($scope.authData.uid, $scope.user.face);
            console.log("Uploaded job picture");
          });

        }

      });

    })
  }

  $scope.uploadImage = function() {
    imageUploader.getPicture()
    .then(function(pictureData) {

      //1 Token Retrieval or Creation
      var imagedata = 'data:image/jpeg;base64,' + pictureData;
      var blob = Utilities.dataURItoBlob(imagedata);

      var imageTokenRef = fb.child("imagetokens/"+$scope.authData.uid);
      var imageToken = "";

      imageTokenRef.once("value", function(snapshot) {
        imageToken = snapshot.val();
        //console.log("Retrieved image token "+imageToken.token);
        var existingToken = (snapshot.val() !== null);
        console.log("Token exists? "+existingToken);

        $scope.job.pic = "img/gif/loading_shaking.gif";

        if(!existingToken){
          ImageToken.setToken($scope.authData.uid).then(function(data){
            imageToken = data;

            //2 Get Presigned URL
            ImageToken.postImage($scope.authData.uid,imageToken,blob).then(function(url){
              //var url = data;
              console.log("URL obtained is "+url);
              $scope.job.pic = url;
              console.log("Uploaded job picture");
            });

          });
        } else {

          //2 Get Presigned URL  //3 Post to S3 is taken care inside
          ImageToken.postImage($scope.authData.uid,imageToken.token,blob).then(function(url){
            //var url = data["file-url"];
            console.log("URL obtained is "+url);

            $scope.job.pic = url;
            //UserSkills.updateFace($scope.authData.uid, $scope.user.face);
            console.log("Uploaded job picture");
          });

        }

      });

    })
  }

  $scope.contactUs = function () {
    if(enableIntercom&&window.cordova){
      intercom.displayMessageComposer();
    }
  };

  $scope.addJob = function(job, price, writeup, location, pic, choice, category, duration, frequency, frequencyType, requestNature){
/*
    $ionicLoading.show({
      template: '<ion-spinner icon="spiral"></ion-spinner>'
    })
*/
    if(typeof job.tuitionType == 'undefined'){
      job.tuitionType = false;
    }

    if(typeof job.tuitionGender == 'undefined'){
      job.tuitionGender = false;
    }


    if(typeof category == 'undefined'){
      navigator.notification.alert(
        'You need to pick a subject',  // message
        null,  // callback
        'Missing Subject', // title
        'OK'   // buttonName
      );
    } else{

      console.log('Making Request');
      var jobRef = fbCountry.child("requests");

      if (requestNature == 'Class'){
        var jobDetails = {
          "anonymous": false,
          "likes": {},
          "likesCount": 0,
          "price": price,
          "location": location,
          "requester": {
            "face": $scope.user.face,
            "id": $scope.authData.uid,
            "name": $scope.user.name
          },
          "task": {
            "writeup": writeup,
            "pic": pic
          },
          "meta": {
            "role": job.role,
            "requestNature": job.requestNature,
            "tuitionType": job.tuitionType,
            "tuitionGender": job.tuitionGender
          },
          "time": Firebase.ServerValue.TIMESTAMP,
          "categories": category,
          "choice" : choice,
          "duration": duration,
          "frequency": frequency,
          "frequencyType": frequencyType,
          "l": {
            "0":$scope.job.locationLat,
            "1":$scope.job.locationLon
          },
          "g": $scope.job.geoHash
        };
      }else if(requestNature == 'Homework'){
        var jobDetails = {
          "anonymous": false,
          "likes": {},
          "likesCount": 0,
          "location": location,
          "requester": {
            "face": $scope.user.face,
            "id": $scope.authData.uid,
            "name": $scope.user.name
          },
          "task": {
            "writeup": writeup,
            "pic": pic
          },
          "meta": {
            "role": job.role,
            "requestNature": job.requestNature,
            "tuitionType": job.tuitionType,
            "tuitionGender": job.tuitionGender
          },
          "time": Firebase.ServerValue.TIMESTAMP,
          "categories": category,
          "choice" : choice,
          "l": {
            "0":$scope.job.locationLat,
            "1":$scope.job.locationLon
          },
          "g": $scope.job.geoHash
        };
      }
      var newJob = jobRef.push(jobDetails);

      //need to keep a reference in the user object as well
      var newJobId = newJob.key();
      var userJobRef = fb.child("users/"+$scope.authData.uid+"/gigs/"+newJobId);
      userJobRef.set({"active": true});

      //geofire
      $scope.searchradius = 15;
      $scope.geofireload = [];
      var activeDuration = 10368000000;
      var geofirelistener;
      var geofirefinisher;


      var skillRef = fbCountry.child("userskills/"+category+"/general");
      var $geo = $geofire(skillRef);
      var query = $geo.$query({
        center: [$scope.job.locationLat, $scope.job.locationLon],
        radius: $scope.searchradius
      });

      var geoQueryCallback = query.on("key_entered", category);
      var geoQueryCallback2 = query.on("ready", category+"finished");

      if(!$scope.$$listeners.hasOwnProperty(category)){
        geofirelistener = $scope.$on(category, function (event, key, location, distance) {
        // Do something interesting with object
          skillRef.child(key).on("value", function(snapshot) {
            var tempHolder = snapshot.val();
            tempHolder.distance = distance*1000;
            tempHolder.key = key;
            var currentTime = (new Date()).getTime();
            var expiryTime = currentTime - activeDuration;
            console.log("Current time "+moment(currentTime).format("Do MMMM YYYY")+" whereas Expiry "+moment(expiryTime).format("Do MMMM YYYY"));
            if((tempHolder.hasOwnProperty('location'))&&(tempHolder.location.time > expiryTime)&&(tempHolder.location.hasOwnProperty('time'))){
              $scope.geofireload.push(tempHolder);
            }
          });
        });
        geofirefinisher = $scope.$on(category+"finished", function () {
          console.log("GeoQuery halted");
          geoQueryCallback.cancel();
          geoQueryCallback2.cancel();
          $scope.results = $scope.geofireload;
          for(var count=0; count<$scope.geofireload.length;count++){
            for(var count2=count+1; count2<$scope.geofireload.length;count2++){
              if($scope.geofireload[count].distance>$scope.geofireload[count2].distance){
                var temp = $scope.geofireload[count];
                $scope.geofireload[count] = $scope.geofireload[count2];
                $scope.geofireload[count2] = temp;
              }
            }
          }
          $scope.results = $scope.geofireload;
          if($scope.results.length>10){
            $scope.results.splice(10 , $scope.results.length-10);
          }
          console.log($scope.results);
          console.log("Number of tutors within location after active filter: " +$scope.results.length);


          if($scope.results!=null){
            console.log("Can potentially speak to "+JSON.stringify($scope.results));

            for(coach in $scope.results){
              if($scope.results[coach].key != $scope.authData.uid){
                Push.getToken($scope.results[coach].key).then(function(destinationToken){
                  var notification = "New "+category+" Request by "+$scope.user.name+": "+jobDetails.task.writeup;
                  console.log("Destination found", destinationToken);
                  Push.sendNotification(destinationToken, notification);
                });
              }
            }

            //$ionicLoading.hide();
            geoQueryCallback.cancel();
            geoQueryCallback2.cancel();
            $scope.submitJobButtonClicked = false;
            $ionicHistory.goBack();
          } else {
            geoQueryCallback.cancel();
            geoQueryCallback2.cancel();
            $scope.submitJobButtonClicked = false;
            //$ionicLoading.hide();
            $ionicHistory.goBack()
          }
        });
      }
    }
  }
})

.controller('PromotionCtrl', function($rootScope, $scope, $ionicModal, $ionicActionSheet, $ionicLoading, $ionicSlideBoxDelegate, $state, $window, $ionicHistory, $firebaseObject, $ionicLoading, $filter, $timeout,
  imageUploader, ImageToken, UserAction, Utilities, Jobs, Skills, Chats, Orders, Push, Bookmarks, UserSkills, Auth, Categories, $ionicScrollDelegate,$geofire, $cordovaCamera, $stateParams) {

  $scope.authData = fb.getAuth();
  $scope.userLoading = true;
  $scope.submitJobButtonClicked = false;
  //Utilities.setCountry();
  $scope.defaultCountry = Utilities.getCurrentCountry();
  $scope.categories = Categories.all($scope.defaultCountry.value);
  $scope.job = {'anonymous':false, 'pic':null, 'price':50, 'frequencyType':'Weekly', 'frequency':1, 'duration':2};

  if($stateParams.promotionId!=null&&typeof $stateParams.promotionId!='undefined'){
    console.log("Edit Promotion");
    $scope.edittingMode = true;
    var requestRef = fbCountry.child("jobs").child($stateParams.promotionId);
    requestRef.on("value", function(snapshot) {
      $scope.job = snapshot.val();
      if($scope.job.task.pic){
        $scope.job.pic = $scope.job.task.pic;
      }
      $scope.job.writeup = $scope.job.task.writeup;
      $scope.job.role = $scope.job.meta.role;
      $scope.job.category = $scope.job.categories;
      $scope.job.requestNature = $scope.job.meta.requestNature;
      $scope.job.tuitionType = $scope.job.meta.tuitionType;
      $scope.job.tuitionGender = $scope.job.meta.tuitionGender;
      var userRef = fb.child("users").child($scope.authData.uid);
      userRef.on("value", function(snapshot) {
        $scope.user = snapshot.val();
        $scope.userLoading = false;
      });
    });
  }else{
    console.log("Create Promotion");
    $scope.edittingMode = false;
    var userRef = fb.child("users").child($scope.authData.uid);
    userRef.on("value", function(snapshot) {
      $scope.user = snapshot.val();
      $scope.userLoading = false;
    });
  }

  var $range = $(".js-range-slider");

  $range.ionRangeSlider({
    type: "single",
    min: 15,
    max: 150,
    from: $scope.job.price,
    step: 5,
    prefix: '$',
    onFinish: function (data) {
      saveResult(data);
    }
  });

  var priceSlider = $range.data("ionRangeSlider");
  var saveResult = function (data) {
      $scope.job.price = data.from;
      $scope.$apply();
  };

  $scope.getSkillPic = function(skillName) {
    if(skillName!=null){
      return Skills.getByName(skillName).pic;
    }
  }

  $scope.toggleGroup = function(group) {
    if ($scope.isGroupShown(group)) {
      $scope.shownGroup = null;
    } else {
      $scope.shownGroup = group;
    }
  };
  $scope.isGroupShown = function(group) {
    return $scope.shownGroup === group;
  };

  $scope.resizeScroll = function(){
    var scrollresizeTimeout = $timeout(function() {
      $ionicScrollDelegate.resize();
    }, 250); // delay 250 ms
  }

  $scope.updatePromotion = function(promotion){
    $scope.edittingMode=false;
    var promotionRef = fbCountry.child("jobs/"+$stateParams.promotionId);
    if(typeof promotion.pic==undefined){
      promotion.pic = null;
    }
    var jobDetails = {
      "price": promotion.price,
      "location": promotion.location,
      "task": {
        "writeup": promotion.writeup,
        "pic": promotion.pic
      },
      "meta": {
        "role": promotion.role,
        "requestNature": promotion.requestNature,
        "tuitionType": promotion.tuitionType
      },
      "categories": promotion.category
    };

    var editedJob = promotionRef.update(jobDetails);
    $ionicHistory.goBack();
  }

  $scope.showMediaSelector = function(labelIndex) {

  // Show the action sheet
    var hideSheet = $ionicActionSheet.show({
    buttons: [{'text':"Take Photo"},{'text':"Choose Photo"}],
    cancelText: 'Cancel',
    cancel: function() {
      // prompt user for other name
    },
    buttonClicked: function(index) {
      //$scope.newSkill.level = levels[index];
      console.log(index);
      if(index==1){
        $scope.uploadImage();
      }else if(index==0){
        $scope.takePicture();
      }

        return true;
      }
    });
  };

  $scope.takePicture = function() {
    var options = {
      quality : 75,
      destinationType : Camera.DestinationType.DATA_URL,
      sourceType : Camera.PictureSourceType.CAMERA,
      allowEdit : true,
      encodingType: Camera.EncodingType.JPEG,
      targetWidth: 300,
      targetHeight: 300,
      popoverOptions: CameraPopoverOptions,
      saveToPhotoAlbum: false,
      correctOrientation: false
    };

    $cordovaCamera.getPicture(options).then(function(pictureData) {
      var imagedata = 'data:image/jpeg;base64,' + pictureData;
      var blob = Utilities.dataURItoBlob(imagedata);

      var imageTokenRef = fb.child("imagetokens/"+$scope.authData.uid);
      var imageToken = "";

      imageTokenRef.once("value", function(snapshot) {
        imageToken = snapshot.val();
        //console.log("Retrieved image token "+imageToken.token);
        var existingToken = (snapshot.val() !== null);
        console.log("Token exists? "+existingToken);

        $scope.job.pic = "img/gif/loading_shaking.gif";

        if(!existingToken){
          ImageToken.setToken($scope.authData.uid).then(function(data){
            imageToken = data;

            //2 Get Presigned URL
            ImageToken.postImage($scope.authData.uid,imageToken,blob).then(function(url){
              //var url = data;
              console.log("URL obtained is "+url);
              $scope.job.pic = url;
              console.log("Uploaded job picture");
            });

          });
        } else {

          //2 Get Presigned URL  //3 Post to S3 is taken care inside
          ImageToken.postImage($scope.authData.uid,imageToken.token,blob).then(function(url){
            //var url = data["file-url"];
            console.log("URL obtained is "+url);

            $scope.job.pic = url;
            //UserSkills.updateFace($scope.authData.uid, $scope.user.face);
            console.log("Uploaded job picture");
          });

        }

      });

    })
  }

  $scope.uploadImage = function() {
    imageUploader.getPicture()
    .then(function(pictureData) {

      //1 Token Retrieval or Creation
      var imagedata = 'data:image/jpeg;base64,' + pictureData;
      var blob = Utilities.dataURItoBlob(imagedata);

      var imageTokenRef = fb.child("imagetokens/"+$scope.authData.uid);
      var imageToken = "";

      imageTokenRef.once("value", function(snapshot) {
        imageToken = snapshot.val();
        //console.log("Retrieved image token "+imageToken.token);
        var existingToken = (snapshot.val() !== null);
        console.log("Token exists? "+existingToken);

        $scope.job.pic = "img/gif/loading_shaking.gif";

        if(!existingToken){
          ImageToken.setToken($scope.authData.uid).then(function(data){
            imageToken = data;

            //2 Get Presigned URL
            ImageToken.postImage($scope.authData.uid,imageToken,blob).then(function(url){
              //var url = data;
              console.log("URL obtained is "+url);
              $scope.job.pic = url;
              console.log("Uploaded job picture");
            });

          });
        } else {

          //2 Get Presigned URL  //3 Post to S3 is taken care inside
          ImageToken.postImage($scope.authData.uid,imageToken.token,blob).then(function(url){
            //var url = data["file-url"];
            console.log("URL obtained is "+url);

            $scope.job.pic = url;
            //UserSkills.updateFace($scope.authData.uid, $scope.user.face);
            console.log("Uploaded job picture");
          });

        }

      });

    })
  }

  $scope.addJob = function(job, price, writeup, location, pic, choice, category, duration, frequency, frequencyType, requestNature){

    $ionicLoading.show({
      template: '<ion-spinner icon="spiral"></ion-spinner>'
    })

    if(typeof job.tuitionType == 'undefined'){
      job.tuitionType = false;
    }

    if(typeof job.tuitionGender == 'undefined'){
      job.tuitionGender = false;
    }


    if(typeof category == 'undefined'){
      navigator.notification.alert(
        'You need to pick a subject',  // message
        null,  // callback
        'Missing Subject', // title
        'OK'   // buttonName
      );
    }else{
      var jobRef = fbCountry.child("jobs");
      var jobDetails = {
        "anonymous": false,
        "likes": {},
        "likesCount": 0,
        "price": price,
        "requester": {
          "face": $scope.user.face,
          "id": $scope.authData.uid,
          "name": $scope.user.name
        },
        "task": {
          "writeup": writeup,
          "pic": pic
        },
        "meta": {
          "role": job.role,
          "requestNature": job.requestNature,
          "tuitionType": job.tuitionType
        },
        "time": Firebase.ServerValue.TIMESTAMP,
        "categories": category,
        "choice": choice
      };
      var newJob = jobRef.push(jobDetails);
      //need to keep a reference in the user object as well
      var newJobId = newJob.key();
      var userJobRef = fb.child("users/"+$scope.authData.uid+"/gigs/"+newJobId);
      userJobRef.set({"active": true});
      $scope.submitJobButtonClicked = false;
      $ionicLoading.hide();
      $ionicHistory.goBack();
    }
  }
})

.controller('ChatsCtrl', function($scope, $timeout, $state, $ionicLoading, $window, $ionicHistory, Auth, Chats, Orders, Utilities) {
  console.log("Now viewing chats"+$state.current.name);
  $scope.thisTime = new Date();
  $scope.authData = fb.getAuth();

  $scope.showAlert = Utilities.showAlert;

  //List of chats from User object
  //Chat items are referencing the Id of chat threads in Chats

  $scope.$on('$ionicView.enter', function() {
    // code to run each time view is entered
    $ionicLoading.show({
      template: '<ion-spinner icon="spiral"></ion-spinner>'
    });

    var loadTimer = $timeout(checkConnection, 5000);

    if($scope.authData.provider!=='anonymous'){
      console.log("Attempt retrieve user "+$scope.authData.uid+" for ChatCtrl");
      Chats.getAllChatsFor($scope.authData.uid).then(function(allChats){
        $scope.chats = allChats;
        //console.log($scope.chats);
        $timeout.cancel(loadTimer);
        $ionicLoading.hide();
      });


    }

  });

  function checkConnection() {
    $ionicLoading.hide();
    $scope.showAlert('Please check your Connection');
  }

  $scope.contactUs = function () {
    if(enableIntercom&&window.cordova){
      intercom.displayMessageComposer();
    }
  };

  $scope.getOrderTypeName = Orders.getOrderTypeName;


  $scope.remove = function(chatitem) {
    var key = chatitem.key;

    var chatRef = fb.child("chats").child(key);

    if(chatitem.active){
      //Announce in active chat that user is leaving the chat
      chatRef.push({
        'sender': $scope.authData.uid,
        'text': 'Left The Chat',
        'time': Firebase.ServerValue.TIMESTAMP
      }, function(){
        console.log("Left the chat");
      });
      //CHATTI
      //Modify other user's chat preview to indicate inactive chat
      var receiver = chatitem.receiver.uid;
      var receiverRef = fb.child("chatpreviews/"+receiver).child(key);
      //var receiverRef = fb.child("users/"+receiver+"/chats").child(key);
      receiverRef.update({'active': false}, function(){
        console.log("Indicated inactive chat to receiver");
      });

    } else {
      //Delete the chat entirely if no one else is left in the chat
      chatRef.set(null);
    }

    //CHATTI
    //Delete the chat preview item in the user model
    //var chatToDelete = fb.child("users/"+$scope.authData.uid+"/chats").child(key);
    var chatToDelete = fb.child("chatpreviews/"+$scope.authData.uid).child(key);
    chatToDelete.set(null);
    console.log("Deleted chat item");

    Chats.getAllChatsFor($scope.authData.uid).then(function(allChats){
      $scope.chats = allChats;
    });

  }

  $scope.reLogin = function() {
    //$ionicLoading.show({template:'Logging out....'});

    if($scope.authData.provider=='anonymous'){
      var userRef = fb.child("users/"+$scope.authData.uid);
      userRef.set(null);
    }

    console.log("Logging out "+$scope.authData.uid);
    Auth.logout();
    $scope.authData = Auth.getAuth(); //this should be null
    $state.go('intro');

    $timeout(function () {
      $ionicHistory.clearCache();
      $ionicHistory.clearHistory();
    }, 1500);
  }

  $scope.doRefresh = function() {
    //Let's retrieve new set of chats
    Chats.getAllChatsFor($scope.authData.uid).then(function(allChats){
      $scope.chats = allChats;
    });
    console.log("Refresh performed");

    $scope.$broadcast('scroll.refreshComplete');
  }

  $scope.$on('$destroy', function() {
    $timeout.cancel(loadTimer);
  });


})

.controller('ChatDetailCtrl', function($scope, $rootScope, $timeout, $firebaseArray, $firebaseObject, $ionicScrollDelegate, $ionicHistory, $stateParams, Chats, Push, Auth, $ionicModal, $ionicActionSheet, Utilities, imageUploader, ImageToken, $http, $cordovaCamera, Reviews) {

  //stateParams contains chatid, recipientname, recipient picture

  $scope.person = {
    'name' : $stateParams.name,
    'face' : $stateParams.face,
    'id' : $stateParams.id
  };

  $scope.doneLoading = false;
  $scope.messages = []
  $scope.authData = fb.getAuth();
  $scope.chatId = $stateParams.chatId;
  $scope.currentTime = new Date().getTime();
  $scope.tutorFound = true;
  console.log($stateParams.active);
  if ($stateParams.active == 'true'){
    $scope.chatActive = true;
  }else{
    $scope.chatActive = false;
  }

  $scope.replierId = $stateParams.id;

  $scope.showAlert = Utilities.showAlert;

  var isIOS = ionic.Platform.isWebView() && ionic.Platform.isIOS();

  $scope.user = $firebaseObject(fb.child("users/"+$scope.authData.uid));
  Auth.userRef().$bindTo($scope, "user");

  var chatRef = fb.child("chats/"+$stateParams.chatId);

  console.log("Attempt retrieve chat "+$stateParams.chatId+" for ChatDetailCtrl");

  /*
  //Question: how often does firebase watch for changes to value? Time lag to update when new child comes in?
  chatRef.limitToLast(15).on("value", function(snapshot) {
  var JSONMessages = snapshot.val();
  //convert the JSON object into an array for use with angular collect-repeat
  //provides better performance
  $scope.messages = Object.keys(JSONMessages).map(function(k) { return JSONMessages[k] });

  console.log("Retrieved "+snapshot.numChildren()+" chat pongs");
  console.log("Retrieved objects "+JSON.stringify(JSONMessages));
  $ionicScrollDelegate.scrollBottom(true);
});
*/
$scope.messages = $firebaseArray(fb.child("chats/"+$stateParams.chatId));
$scope.messages.$loaded().then(function(){
  console.log("Retrieved "+$scope.messages.length+" chat items from Firebase");
  //$scope.apply();
  $ionicScrollDelegate.$getByHandle('chatDetailScroll').scrollBottom(true);

  if(isIOS){
    cordova.plugins.Keyboard.disableScroll(true);
    $ionicScrollDelegate.$getByHandle('chatDetailScroll').scrollBottom(true);
  }

  if($scope.messages[0].orderType) {
    //retrieve order details
    $scope.orderId = $scope.messages[0].orderId;

    switch($scope.messages[0].orderType){
      case 1:
      $scope.orderTypeName = "gigs"; break;
      case 2:
      $scope.orderTypeName = "private"; break;
      case 3:
      $scope.orderTypeName = "group"; break;
      default:
      $scope.orderTypeName = "others"; break;
    }
  }

    var orderRef = fb.child("orders/"+$scope.orderTypeName+"/open/"+$scope.orderId);
      orderRef.on("value", function(snapshot) {
        $scope.order = snapshot.val();
        console.log("order loaded");
        if($scope.messages[0].orderType == 1){
          if($scope.order.requesterid==$scope.authData.uid){
            $scope.isTutor = false;
          }else{
            $scope.isTutor = true;
          }
          var jobRef = fbCountry.child("requests/"+$scope.order.orderDetails.gigId+"/foundTutor");
          jobRef.on("value", function(snapshot) {
            if($scope.messages[0].pic){
              $scope.orderTypeName = "Homework";
            }
            $scope.tutorFound = snapshot.val();
            if($scope.tutorFound == null){
              $scope.tutorFound = false;
            }
          var tutorJobRef = fbCountry.child("requests/"+$scope.order.orderDetails.gigId+"/foundTutorId");
          tutorJobRef.on("value", function(snapshot) {
            $scope.doneLoading = true;
            $scope.tutorFoundId = snapshot.val();
           })
        })
        }else{
          if(typeof $scope.order.foundTutor == 'undefined'){
            $scope.tutorFound = true;
            $scope.tutorFoundId = $scope.order.requesterid;
            console.log("old chat");
            console.log($scope.tutorFoundId);
          }else{
            $scope.tutorFound = $scope.order.foundTutor;
            if(typeof $scope.order.foundTutorId != 'undefined'){
              $scope.tutorFoundId = $scope.order.foundTutorId;
            }
            console.log($scope.tutorFound);
          }
          if($scope.order.providerid==$scope.authData.uid){
            $scope.isTutor = false;
          }else{
            $scope.isTutor = true;
          }
          $scope.doneLoading = true;
        }
      });

});

//$ionicScrollDelegate.scrollBottom(true);

//trying to create scroll bottom when new chat arrives
$scope.lastMessage = Chats.getLastText($stateParams.chatId).then(function(){
  //$scope.apply();
  $ionicScrollDelegate.$getByHandle('chatDetailScroll').scrollBottom(true);
  console.log("Last text for chat has changed");
});

$scope.hideTime = true;

//var isIOS = ionic.Platform.isWebView() && ionic.Platform.isIOS();
$scope.checkIOS = isIOS;

$scope.sendMessage = function() {
  //alternate = !alternate;
  if((typeof $scope.data.pic==undefined)||($scope.data.pic==null)){
    $scope.data.pic = null;
    var messageForPush = $scope.data.message;
  }else{
    var messageForPush = 'Has sent you an Image. ' + $scope.data.message;
  }
  //push last input into the server
  //add some FB code
  var chatRefChild = fb.child("chats/"+$stateParams.chatId);
  chatRefChild.push({
    'sender': $scope.authData.uid,
    'text': $scope.data.message,
    'time': Firebase.ServerValue.TIMESTAMP,
    'pic': $scope.data.pic
  }, function(){
    console.log("Pushed new message to "+$stateParams.id);
    $scope.$apply();
    //Need to also alter the last message of the chat items
  });

  //We send push notification here
  Push.getToken($stateParams.id).then(function(destinationToken){
    //console.log("Destination found", destinationToken);
    //name used here is wrong!!!

    Push.sendNotification(destinationToken, $scope.user.name+": "+messageForPush,$stateParams.chatId);
  });

  //clear the input box
  delete $scope.data.message;
  delete $scope.data.pic;
  $ionicScrollDelegate.$getByHandle('chatDetailScroll').scrollBottom(true);

  console.log("After Push "+JSON.stringify($scope.messages));

};

$scope.$watch('messages', function() {
  console.log("Refreshed results!");
  //$scope.$apply();
  $ionicScrollDelegate.$getByHandle('chatDetailScroll').scrollBottom(true);

  //$ionicLoading.hide();
});

$("textarea").focus(function(event) {
  console.log("focus");
  if (isIOS) {
    $scope.data.keyboardHeight = 216;
    cordova.plugins.Keyboard.disableScroll(true);
  }
  setTimeout(function(){//here!
                $ionicScrollDelegate.$getByHandle('chatDetailScroll').scrollBottom(true);
            }, 500);
});


$("textarea").blur(function() {

  if (isIOS) $scope.data.keyboardHeight = 0;
  setTimeout(function(){//here!
                $ionicScrollDelegate.resize();
            }, 500);
  $ionicScrollDelegate.resize();

});

$scope.closeKeyboard = function() {
  // cordova.plugins.Keyboard.close();
};


$scope.data = {};
$scope.myId = $scope.authData.uid;

//END OF CHAT PORTION
//START OF ORDER DETAILS

  $scope.showImage = function(picture_url) {
    $scope.imageSrc = picture_url;
    $scope.openModal(0);
  }

  $scope.rowWidth = function(txt, font){
    this.element = document.createElement('canvas');
    this.context = this.element.getContext("2d");
    this.context.font = font;
    var tsize = this.context.measureText(txt).width;
    if(tsize>233){
      tsize=233;
    }
    return tsize;
  }

 $ionicModal.fromTemplateUrl('templates/utility/fullscreen.html', {
    id: '0',
    scope: $scope,
    backdropClickToClose: false,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.oModal0 = modal;
  });

  $ionicModal.fromTemplateUrl('templates/booking/writetestimonial.html', {
  id: '2', // We need to use and ID to identify the modal that is firing the event!
  scope: $scope,
  backdropClickToClose: false,
  animation: 'slide-in-up'
}).then(function(modal) {
  $scope.oModal1 = modal;
});

  //modal may have to take extra parameter _skill
  $scope.openModal = function(index) {
    var selectedModal = 'oModal' + index;
    $scope[selectedModal].show();
  };

  $scope.closeModal = function(index) {
    var selectedModal = 'oModal' + index;
    $scope[selectedModal].hide();
    //$scope[selectedModal].remove();
  };

  /* Listen for broadcasted messages */

  $scope.$on('modal.shown', function(event, modal) {
    console.log('Modal ' + modal.id + ' is shown!');
  });

  $scope.$on('modal.hidden', function(event, modal) {
    console.log('Modal ' + modal.id + ' is hidden!');
  });

  $scope.showMediaSelector = function(labelIndex) {

  // Show the action sheet
    var hideSheet = $ionicActionSheet.show({
    buttons: [{'text':"Take Photo"},{'text':"Choose Photo"}],
    cancelText: 'Cancel',
    cancel: function() {
      // prompt user for other name
    },
    buttonClicked: function(index) {
      //$scope.newSkill.level = levels[index];
      console.log(index);
      if(index==1){
        $scope.uploadImage(labelIndex);
      }else if(index==0){
        $scope.takePicture(labelIndex);
      }

        return true;
      }
    });
  };

  $scope.takePicture = function(labelIndex) {
        var options = {
            quality : 75,
            destinationType : Camera.DestinationType.DATA_URL,
            sourceType : Camera.PictureSourceType.CAMERA,
            allowEdit : true,
            encodingType: Camera.EncodingType.JPEG,
            targetWidth: 300,
            targetHeight: 300,
            popoverOptions: CameraPopoverOptions,
            saveToPhotoAlbum: false
        };

      $cordovaCamera.getPicture(options).then(function(pictureData) {
        var imagedata = 'data:image/jpeg;base64,' + pictureData;
        var blob = Utilities.dataURItoBlob(imagedata);

        var imageTokenRef = fb.child("imagetokens/"+$scope.authData.uid);
        var imageToken = "";

        imageTokenRef.once("value", function(snapshot) {
          imageToken = snapshot.val();
          //console.log("Retrieved image token "+imageToken.token);
          var existingToken = (snapshot.val() !== null);
          console.log("Token exists? "+existingToken);

          $scope.data.pic = "img/gif/loading_spinner.gif";
          //$scope.user.face = "img/gif/loading_shaking.gif";

          if(!existingToken){
            ImageToken.setToken($scope.authData.uid).then(function(data){
              imageToken = data;

              //2 Get Presigned URL
              ImageToken.postImage($scope.authData.uid,imageToken,blob).then(function(url){
                //var url = data;
                console.log("URL obtained is "+url);

                $scope.data.pic = url;
                //$scope.user.face = url;
                //UserSkills.updateFace($scope.authData.uid, $scope.user.face);
              });


            });
          } else {

            //2 Get Presigned URL  //3 Post to S3 is taken care inside
            console.log(imageToken.token);
            console.log(blob);
            ImageToken.postImage($scope.authData.uid,imageToken.token,blob).then(function(url){
              //var url = data["file-url"];
              console.log("URL obtained is "+url);


              //$scope.user.face = url;
              //UserSkills.updateFace($scope.authData.uid, $scope.user.face);
              $scope.data.pic = url;

              console.log("Uploaded new Base64 profile");
            });

          }

        });

      });
    }

    $scope.uploadImage = function(labelIndex) {
      console.log("Preparing upload for "+labelIndex);

      imageUploader.getPicture()
      .then(function(pictureData) {
        /*
        * Here we could push the dataURI to S3 or even to db/firebase as string.
        */

        //1 Token Retrieval or Creation
        var imagedata = 'data:image/jpeg;base64,' + pictureData;

        var blob = Utilities.dataURItoBlob(imagedata);

        var imageTokenRef = fb.child("imagetokens/"+$scope.authData.uid);
        var imageToken = "";

        imageTokenRef.once("value", function(snapshot) {
          imageToken = snapshot.val();
          //console.log("Retrieved image token "+imageToken.token);
          var existingToken = (snapshot.val() !== null);
          console.log("Token exists? "+existingToken);

          $scope.data.pic = "img/gif/loading_spinner.gif";
          //$scope.user.face = "img/gif/loading_shaking.gif";

          if(!existingToken){
            ImageToken.setToken($scope.authData.uid).then(function(data){
              imageToken = data;

              //2 Get Presigned URL
              ImageToken.postImage($scope.authData.uid,imageToken,blob).then(function(url){
                //var url = data;
                console.log("URL obtained is "+url);

                $scope.data.pic = url;
                //$scope.user.face = url;
                //UserSkills.updateFace($scope.authData.uid, $scope.user.face);
              });


            });
          } else {
            console.log(imageToken.token);
            console.log(blob);

            //2 Get Presigned URL  //3 Post to S3 is taken care inside
            ImageToken.postImage($scope.authData.uid,imageToken.token,blob).then(function(url){
              //var url = data["file-url"];
              console.log("URL obtained is "+url);

              //$scope.user.face = url;
              //UserSkills.updateFace($scope.authData.uid, $scope.user.face);
              $scope.data.pic = url;

              console.log("Uploaded new Base64 profile");
            });

          }

        });

      })
    };

    $scope.confirmCloseRequest = function(){

    var text = "Is this your Chosen Tutor?";

    function route(buttonIndex) {
      switch(buttonIndex){
        case 1: break; //do nothing
        case 2: $scope.closeRequest($scope.order.orderDetails.gigId, $stateParams.id); break;
      }
    }

    navigator.notification.confirm(
      text,  // message
      route,              // callback to invoke with index of button pressed
      'Close Request',            // title
      'No, Yes'          // buttonLabels
    );
  }

  $scope.closeRequest = function(requestId, tutorId){
    var jobRef = fbCountry.child("requests/"+requestId);

    //jobRef.set(null);
    jobRef.update({'foundTutor': Firebase.ServerValue.TIMESTAMP,'foundTutorId': tutorId}, function(){
      console.log("Indicated tutor was found");
    });

    //Update in user model
    var userJobRef = fb.child("users/"+$scope.authData.uid+"/gigs/"+requestId);
    userJobRef.update({'foundTutor': Firebase.ServerValue.TIMESTAMP, 'foundTutorId': tutorId}, function(){
      console.log("Indicated tutor was found");
    });
  }

  $scope.confirmStartLesson = function(){

    var text = "Is this your Chosen Tutor?";

    function route(buttonIndex) {
      switch(buttonIndex){
        case 1: break; //do nothing
        case 2: $scope.startLesson(); break;
      }
    }

    navigator.notification.confirm(
      text,  // message
      route,              // callback to invoke with index of button pressed
      'Confirm Tutor',            // title
      'No, Yes'          // buttonLabels
    );
  }

  $scope.startLesson = function(){

    var lessonsref = fb.child("lessons").child($scope.authData.uid);
    lessonsref.orderByChild("searchKey").equalTo($scope.order.orderDetails.lessonName + " " + $scope.order.orderDetails.level).once("value", function(snapshot){

      var similarOrders = snapshot.val();

      for(var singleOrder in similarOrders){
        if(similarOrders[singleOrder].orderId!= $scope.orderId && similarOrders[singleOrder].foundTutor == false){
          var similarOrderRef = fb.child("orders/private/open/"+similarOrders[singleOrder].orderId);
          similarOrderRef.update({'foundTutor': Firebase.ServerValue.TIMESTAMP, 'foundTutorId': $stateParams.id});
          lessonsref.child(singleOrder).set(null);
          console.log("disabling order: " + similarOrders[singleOrder].orderId)
        }else if(similarOrders[singleOrder].orderId == $scope.orderId){
          var similarOrderRef = fb.child("orders/private/open/"+similarOrders[singleOrder].orderId);
          similarOrderRef.update({'foundTutor': Firebase.ServerValue.TIMESTAMP, 'foundTutorId': $stateParams.id});
          lessonsref.child(singleOrder).update({'foundTutor': Firebase.ServerValue.TIMESTAMP, 'foundTutorId': $stateParams.id});
        }
      }
      var orderRef = fb.child("orders/"+$scope.orderTypeName+"/open/"+$scope.orderId);
      orderRef.update({'foundTutor': Firebase.ServerValue.TIMESTAMP, 'foundTutorId': $stateParams.id}, function(){
          console.log("order reference updated");
      });
    });
  }

  //Ratings
  $scope.testimonial = {};
  $scope.testimonial.rating = 2;

  $scope.ratingsObject = {
    iconOn: 'ion-ios-star',    //Optional
    iconOff: 'ion-ios-star-outline',   //Optional
    iconOnColor: 'rgb(200, 200, 100)',  //Optional
    iconOffColor:  'rgb(200, 100, 100)',    //Optional
    rating:  2, //Optional
    minRating:1,    //Optional
    readOnly: false, //Optional
    callback: function(rating) {    //Mandatory
      $scope.ratingsCallback(rating);
    }
  };

  $scope.ratingsCallback = function(rating) {
    console.log('Selected rating is : ', rating);
    $scope.testimonial.rating = rating;
  };

  $scope.setReview = function() {
    var idToReview = $scope.order.requesterid;
    //Review should be targeted at the other party
    if(idToReview===$scope.authData.uid){
      idToReview = $scope.order.providerid;
    }
    console.log("using",idToReview);

    var reviewRef = fb.child("reviews/"+idToReview+"/"+$scope.orderId);
    reviewRef.once('value', function(snapshot){
      reviewExist = snapshot.exists();
      if(reviewExist){
        $scope.showAlert("You have already reviewed this Tutor.");
      }else{

        $scope.testimonial.reviewer_face = $scope.user.face;
        $scope.testimonial.reviewer_id = $scope.authData.uid;
        $scope.testimonial.reviewer_name = $scope.user.name;
        $scope.testimonial.orderType = $scope.messages[0].orderType;
        console.log($scope.testimonial);

        Reviews.setReview(idToReview, $scope.orderId, $scope.testimonial);

        var orderRef = fb.child("orders/"+$scope.orderTypeName+"/open/"+$scope.orderId);
        if($scope.authData.uid===$scope.order.requesterid){
          orderRef.update({"requester_reviewed": true});
        } else if ($scope.authData.uid===$scope.order.providerid){
          orderRef.update({"provider_reviewed": true});
        }
        $scope.allowReview = false;


        Push.getToken(idToReview).then(function(destinationToken){
          var notification = $scope.user.name+" has left you a review";

          console.log("Destination found", destinationToken);
          Push.sendNotification(destinationToken, notification);
        });
      }
    })
  };

  $scope.confirmOrder = function(classId, orderInfo, messageId){
    var classRef = fb.child("orders/"+$scope.orderTypeName+"/open/"+$scope.orderId+"/classes/"+ classId);
    classRef.update({"confirmed":true});
    var messageRef = fb.child("chats/"+$stateParams.chatId+"/"+messageId);
    messageRef.update({"confirmed":true});
    var orderRef = fb.child("orders/"+$scope.orderTypeName+"/open/"+$scope.orderId);
      orderRef.update({"accepted":true});

      Push.getToken($stateParams.id).then(function(destinationToken){
      var notification = $scope.user.name+" has accepted your offer";
      console.log("Destination found", destinationToken);
      Push.sendNotification(destinationToken, notification);
    });
  }
})

//Tabbed view account of own user
//User should be able to customize his own settings here
.controller('AccountCtrl', function($rootScope, $scope, $firebaseObject, $state, $timeout,
  $ionicModal, $ionicActionSheet, $ionicHistory, $ionicLoading, $ionicPopup, $ionicScrollDelegate, Categories,
  Schools, UserSkills, Utilities, Skills, Auth, Geolocation, Push, Places, imageUploader, ImageToken, geohash, Bookmarks, Workshops,geohash, $cordovaGeolocation, $cordovaCamera,
  Requests, UserAction, $cordovaClipboard) {

   $ionicLoading.show({
    template: '<ion-spinner icon="spiral"></ion-spinner>'
  });

    $scope.randomGif = Utilities.randomGif;

    $scope.viewTitle = 'My Account';
    $scope.authData = fb.getAuth();
    $scope.pressed = false; //used for geolocation modal
    $scope.dirtyName = false; //used for editface modal
    //$scope.getPicture = imageUploader.getPicture;
    $scope.results=[];
    $scope.places = Places.all();
    $scope.profile = {'location':null}; //store the temporary edits to education during user updates
    $scope.countryArray = Utilities.getCountryOptions(true);
    $scope.defaultCountry = Utilities.getCurrentCountry();

    try{
      console.log("Attempt retrieve user "+$scope.authData.uid+" for AccountCtrl");

    } catch (err){
      $scope.showAlert("Session Error","Please force shut and restart the app");
      $scope.logout();
    }

    $scope.showAlert = Utilities.showAlert;

    $scope.user = $firebaseObject(fb.child("users/"+$scope.authData.uid));

    Auth.userRef().$bindTo($scope, "user").then(function(){
      $ionicLoading.hide();

      if($scope.defaultCountry.name == "Singapore"){
        if(typeof $scope.user.occupation == 'undefined'){
          $scope.showSurvey();
        } else if($scope.user.occupation == 'NA') {
          $scope.showSurvey();
        }
      }

      if($scope.user.location){
        $scope.profile.location = $scope.user.location.name;
        $scope.profile.locationLat = $scope.user.location.lat;
        $scope.profile.locationLon = $scope.user.location.lon;
        $scope.geoHash = geohash.encode($scope.profile.locationLat,$scope.profile.locationLon);
      }

      if($scope.user.writeup){
        $scope.profile.writeup = $scope.user.writeup;
      }

      if($scope.user.gigs) {
        var gigReport = Utilities.summariseRequestStatus($scope.user.gigs);
        console.log(gigReport);
        var requestsRef = fbCountry.child("requests");
        requestsRef.orderByChild("requester/id").equalTo($scope.authData.uid).limitToLast(1).on("value", function(snapshot){

          $scope.jobs = snapshot.val();

          for(var key in $scope.jobs){
            $scope.job = $scope.jobs[key];
            $scope.job.key = key;
          }
          $scope.resizeScroll();
        });

        //intercom tracking for request statuses

        if(enableIntercom&&window.cordova){
          intercom.updateUser({
            'custom_attributes': {
              'userFoundTutors': gigReport.userFoundTutors,
              'userMadeRequests': gigReport.userMadeRequests
            }
          });
        }
      }

      Bookmarks.getLikePersonCount($scope.authData.uid).then(function(likesCount){
        //show how many people are following this user
        $scope.followers = likesCount;
      });

      if($scope.user.isWorkshopHolder!=true){
        var workshopsRef = fb.child("workshopBookings/users/"+$scope.authData.uid);
        workshopsRef.orderByChild("time").limitToLast(3).on("value", function(snapshot){
          //console.log(snapshot.val());
          if(snapshot.val() != null){
            $scope.workshops = Utilities.convertToArrayWithKey(snapshot.val());
          console.log("number of workshops booked: "+$scope.workshops.length);
          if(enableIntercom&&window.cordova){
            intercom.updateUser({
              'custom_attributes': {
                'Workshop_Booking_Count': $scope.workshops.length
              }
            });
          }
          }

        })

      }else{
        var workshopsRef = fb.child("workshopHolder/"+$scope.authData.uid);
        workshopsRef.on("value", function(snapshot){

          $scope.holder = snapshot.val();
          $scope.workshopsArray = Utilities.convertToArrayWithKey($scope.holder.HolderWorkshops);
          for(var i in $scope.workshopsArray){
            Workshops.getWorkshop($scope.workshopsArray[i].key, $scope.workshopsArray[i].WorkshopCategory).then(function(result){
              result.keyToPass = result.category.replace(/ /g,"space");
              result.keyToPass = result.keyToPass.replace(/&/g,"and");
              result.key = $scope.workshopsArray[i].key;
              $scope.results.push(result);
              console.log(result);
            });
          }
        });
      }

      if(typeof $scope.user.verify == 'undefined'){
        console.log("redefine verify");
        $scope.user.verify = {};
      }

      if(($scope.user.defaultcountry.value == $scope.user.verify.origin)|| ($scope.user.verify.complete == null)){

        $scope.canEdit = true;
        console.log("Allowed Edit");
      }else{
        $scope.canEdit = false;
        console.log("Block Edit");

      }

    });

    $scope.shareWithFriend = function(){

      $scope.whatsappShare = function(){
        var refCode = $scope.user.alias;
        window.open('whatsapp://send?text=Hey, check out the Learnly app! Simplest way for tutors and students to connect with each other. Download now at http%3A%2F%2Fhyperurl.co/learnlyapp Use my referral code : '+refCode +' to get started!', '_system');
        return false;

      }

      $scope.facebookShare = function(){
        var refCode = $scope.user.alias;
        window.open('fb-messenger://share?link=Hey, check out the Learnly app! Simplest way for tutors and students to connect with each other. Download now at http%3A%2F%2Fhyperurl.co/learnlyapp Use my referral code : '+refCode +' to get started!', '_system');
        return false;

      }

      $scope.share = function(){
        var refCode = $scope.user.alias;
        window.plugins.socialsharing.share(
          'Hey, check out the Learnly app! Simplest way for tutors and students to connect with each other. Use my referral code : '+refCode +' to get started!',
          'Use Learnly to Find Tutors or Teach Lessons',
          "https://learnly.sg/pics/learnly-logo.png",
          'http://hyperurl.co/learnlyapp'
        );
      }

      var hideSheet = $ionicActionSheet.show({
         buttons: [
           { text: 'Facebook' },
           { text: 'Whatsapp' },
           { text: 'Contacts' },
           { text: 'Copy Code'}
         ],
         //destructiveText: 'Delete',
         titleText: "Invite Friends Through",
         cancelText: 'Cancel',
         cancel: function() {
              // add cancel code..
            },
         buttonClicked: function(index) {
           console.log('BUTTON CLICKED', index);

           switch(index){
            case 0: $scope.facebookShare(); break;
            case 1: $scope.whatsappShare(); break;
            case 2: $scope.share($scope.authData.uid, $scope.user.name, $scope.user.alias, $scope.user.face); break;
            case 3: $cordovaClipboard.copy($scope.user.alias); break;
           }

           return true;
         }
       });
    }

    $scope.editRequest = function(){
      if($scope.job.task.pic){
        $scope.job.pic = $scope.job.task.pic;
      }
      $scope.job.writeup = $scope.job.task.writeup;
      $scope.job.role = $scope.job.meta.role;
      $scope.job.category = $scope.job.categories;
      $scope.job.requestNature = $scope.job.meta.requestNature;
      $scope.job.tuitionType = $scope.job.meta.tuitionType;
      $scope.job.tuitionGender = $scope.job.meta.tuitionGender;
      $scope.job.locationLat = $scope.job.l[0];
      $scope.job.locationLon = $scope.job.l[1];
      console.log($scope.job);

      $scope.openModal(8);
      setTimeout(function(){//here!
                getPositionAndShowOnMap();
            }, 1000);
    }

     $scope.updateRequest = function(request){
      console.log(request);
      var requestRef = fbCountry.child("requests/"+request.key);

      if (request.requestNature == 'Class'){
              var requestDetails = {
                "price": request.price,
                "location": request.location,
                "task": {
                  "writeup": request.writeup
                },
                "meta": {
                  "role": request.role,
                  "requestNature": request.requestNature,
                  "tuitionType": request.tuitionType,
                  "tuitionGender": request.tuitionGender
                },
                "categories": request.category,
                "duration": request.duration,
                "frequency": request.frequency,
                "frequencyType": request.frequencyType
                };
            }else if(request.requestNature == 'Homework'){
              var requestDetails = {
                "location": request.location,
                "task": {
                  "pic": request.pic,
                  "writeup": request.writeup
                },
                "meta": {
                  "role": request.role,
                  "requestNature": request.requestNature,
                  "tuitionType": request.tuitionType,
                  "tuitionGender": request.tuitionGender
                },
                "categories": request.category,
              };
            }

            var editedJob = requestRef.update(requestDetails);
            $scope.closeModal(8);

    }

     var saveResult = function (data) {
      $scope.job.price = data.from;
      $scope.$apply();
      console.log("job price is " + $scope.job.price);
      console.log("job duration is " + $scope.job.duration);
      console.log("job frequency is " + $scope.job.frequency);
    };
    var saveDuration = function (data) {
      $scope.job.duration = data.from;
      $scope.$apply();
      console.log("job price is " + $scope.job.price);
      console.log("job duration is " + $scope.job.duration);
      console.log("job frequency is " + $scope.job.frequency);
    };
    var saveFrequency = function (data) {
      $scope.job.frequency = data.from;
      $scope.$apply();
      console.log("job price is " + $scope.job.price);
      console.log("job duration is " + $scope.job.duration);
      console.log("job frequency is " + $scope.job.frequency);
    };

    $scope.$on('modal.shown', function(event, modal) {
    console.log('Modal ' + modal.id + ' is shown!');

    if(modal.id == 8){

    var $range = $(".js-range-slider");

    $range.ionRangeSlider({
      type: "single",
      min: 20,
      max: 150,
      from: $scope.job.price,
      step: 5,
      prefix: '$',
      onFinish: function (data) {
        saveResult(data);
      }
    });

    var $durationRange = $(".js-range-slider2");

    $durationRange.ionRangeSlider({
      type: "single",
      min: 1,
      max: 10,
      from: $scope.job.duration,
      step: 0.5,
      postfix: 'hr',
      onFinish: function (data) {
        saveDuration(data);
      }
    });

    var $frequencyRange = $(".js-range-slider3");

    $frequencyRange.ionRangeSlider({
      type: "single",
      min: 1,
      max: 10,
      from: $scope.job.frequency,
      step: 1,
      onFinish: function (data) {
        saveFrequency(data);
      }
    });
    var priceSlider = $range.data("ionRangeSlider");
    var durationSlider = $durationRange.data("ionRangeSlider");
    var frequencySlider = $frequencyRange.data("ionRangeSlider");
  }
  });

  $scope.$on('modal.hidden', function(event, modal) {
    console.log('Modal ' + modal.id + ' is hidden!');
  });

  $scope.resetFrequency = function(){
    $scope.job.frequency = 1;
    frequencySlider.reset();
    console.log( 'job frequency is ' +$scope.job.frequency);
  }


  $scope.getCurrentLocationJob = function(){
  $scope.locationLoading=true;
  $cordovaGeolocation.getCurrentPosition().then(function(position){
        console.log("Geolocation success!");
        console.log("Retrieved current location Lat:"+position.coords.latitude+" Lon:"+position.coords.longitude);
        var geocoder = new google.maps.Geocoder();
        var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        var request = {
          latLng: latlng
        };
        geocoder.geocode(request, function(data, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            if (data[0] != null) {
              console.log("address is: " + data[0].formatted_address);
              $scope.job.location = data[0].formatted_address;
              $scope.job.locationLat = position.coords.latitude;
              $scope.job.locationLon = position.coords.longitude;
              $scope.job.geoHash = geohash.encode(position.coords.latitude,position.coords.longitude);
              setTimeout(function(){//here!
                getPositionAndShowOnMap();
            }, 1000);
            } else {
              $scope.showAlert("No address found at current location");
              $scope.locationLoading=false;
            }
          }
        })
    }, function(error){
        console.log("Could not get location");
        $scope.locationLoading=false;
        $scope.showAlert('Please Turn on Location Settings');
    });
  }

  var typingTimer;                //timer identifier
  var doneTypingInterval = 5000;  //time in ms, 5 second for example
  var mapLoaded = false;

  $scope.addressChangedJob = function(){
    clearTimeout(typingTimer);
    typingTimer = setTimeout($scope.doneTypingJob(), doneTypingInterval);
  }

//user is "finished typing," do something

  $scope.doneTypingjob = function(){
    $scope.locationLoading=true;
    var address = $scope.job.location;
    if(address.length!=0){
      var request = {
      'address': address + ' '+Utilities.getCurrentCountry().name
      };
      var geocoder = new google.maps.Geocoder();
      geocoder.geocode(request, function(results) {
        if(results){
          if (results.length!=0) {
            console.log(results);
            $scope.job.locationLat = results[0].geometry.location.lat();
            $scope.job.locationLon = results[0].geometry.location.lng();
            $scope.job.geoHash = geohash.encode($scope.job.locationLat,$scope.job.locationLon);
            setTimeout(function(){//here!
                getPositionAndShowOnMap();
            }, 1000);
          }
        }
      })
    }
  }

  $scope.$watch('job.writeup', function(newValue, oldValue) {
    if(newValue){
      console.log($scope.job.choice);
        if(newValue.length>20){
          $scope.resizeScroll();
          if(mapLoaded == false&& $scope.job.choice!='Offer'){
            setTimeout(function(){//here!
                getPositionAndShowOnMap();
            }, 2000);
          }
          mapLoaded = true;
        }else{
          mapLoaded = false;
        }
    }
  });

    $scope.resizeScroll = function(){

      var scrollresizeTimeout = $timeout(function() {
        $ionicScrollDelegate.resize();
      }, 250); // delay 250 ms
    }

    $scope.chooseTutorToClose = function(request){
    console.log(request.replies);
    if(typeof request.replies != 'undefined'){
      $scope.replies = Utilities.convertToArrayWithKey(request.replies);
      $scope.requestToClose = request.key;
      $scope.openModal(9);
    }else{
      $scope.confirmCloseRequest(request.key, null);
    }
  }

  $scope.confirmCloseRequest = function(requestId, tutorId){

    var text = "Is this your Chosen Tutor?"

    if(tutorId == null){
      text = "Have you found your tutor?";
    }

    function route(buttonIndex) {
      switch(buttonIndex){
        case 1: break; //do nothing
        case 2: $scope.closeRequest(requestId, tutorId); break;
      }
    }

    navigator.notification.confirm(
      text,  // message
      route,              // callback to invoke with index of button pressed
      'Close Request',            // title
      'No, Yes'          // buttonLabels
    );
  }

  //close a request after tutor has been found
  $scope.closeRequest = function(requestId, tutorId){
    var jobRef = fbCountry.child("requests/"+requestId);

    //jobRef.set(null);
    jobRef.update({'foundTutor': Firebase.ServerValue.TIMESTAMP,'foundTutorId': tutorId}, function(){
      console.log("Indicated tutor was found");
    });

    //Update in user model
    var userJobRef = fb.child("users/"+$scope.authData.uid+"/gigs/"+requestId);
    userJobRef.update({'foundTutor': Firebase.ServerValue.TIMESTAMP, 'foundTutorId': tutorId}, function(){
      console.log("Indicated tutor was found");
    });

    $scope.closeModal(9);
  }

    //Retrieve the user location
    $scope.setLocation = function() {

      $ionicLoading.show({
        template: '<ion-spinner icon="spiral"></ion-spinner>'
      });

      Geolocation.setUserLocation($scope.authData.uid,true).then(function(){
        //Ensure that all the UserSkills have the latest location
        UserSkills.updateLocations($scope.authData.uid, $scope.user.location);
      });

      if(typeof $scope.user.location !=='undefined'){
        var latLng = new google.maps.LatLng($scope.user.location.lat, $scope.user.location.lon);
        $scope.map = Geolocation.getGoogleMaps($scope.user.location.lat, $scope.user.location.lon);

        var myLocation = new google.maps.Marker({
          position: latLng,
          map: $scope.map,
          content: 'Your location'
        });

        $ionicLoading.hide();
      } else {
        $ionicLoading.hide();
        $scope.showAlert('Cannot Retrieve Your Location','Please enable your GPS and restart Learnly');
      }

    }

    $scope.setSchedule = function() {

      if(typeof $scope.user.schedule === 'undefined'){
        $scope.user.schedule = [{"name": "Morning"},{"name": "Afternoon"},{"name": "Night"}];
      }

    }

    //Collapsible list controllers
    $scope.toggleGroup = function(group) {
      if ($scope.isGroupShown(group)) {
        $scope.shownGroup = null;
      } else {
        $scope.shownGroup = group;
      }
    };
    $scope.isGroupShown = function(group) {
      return $scope.shownGroup === group;
    };

    $scope.user.$loaded().then(function(){

      $ionicLoading.show({
        template: '<ion-spinner icon="spiral"></ion-spinner>'
      });


      if($scope.authData.provider!='anonymous'){
        $scope.viewTitle = '@'+$scope.user.alias;
        //console.log("Firebase says alias "+$scope.user.alias);

        var userRef = fb.child("users/"+$scope.authData.uid);

        var haveProfilePic = false;
        if($scope.user.face){
          if($scope.user.face==='img/assets/nologin.png'){
            haveProfilePic = false;
          } else {
            haveProfilePic = true;
          }
        }

        var haveWriteup = false;
        if($scope.user.writeup){
          if($scope.user.writeup==='Short writeup about myself'){
            haveWriteup = false;
          } else {
            haveWriteup = true;
          }
        }

        var haveVerification = false;
        try {
          if(typeof $scope.user.verify !== 'undefined'){
            if($scope.user.verify.complete){
              haveVerification = true;
            }
          }
          console.log("User has verification "+haveVerification);

        } catch(err){
          console.log("Do nothing");
        }

        var haveLocation = false;
        if($scope.user.location){
          if($scope.user.location.name){
            haveLocation = true;
          }
        }
        console.log("User has location "+haveLocation);

        var haveQualifications = false;
        if($scope.user.education.sch.shortname!=="None"){
          haveQualifications = true;
        }
        console.log("User has qualifications "+haveQualifications);

        var haveSchedule = false;
        if(Utilities.checkIfHaveSchedule($scope.user.schedule)){
          haveSchedule = true;
        }
        console.log("User has schedule "+haveSchedule);

        var appViewCount = 0;
        if(typeof $scope.user.viewCount != "undefined"){
          appViewCount = $scope.user.viewCount;
        }
        console.log("User has schedule "+haveSchedule);

        var haveSkills = 0;
        userRef.child("skills").on("value", function(data){
          haveSkills = data.numChildren();
          console.log("User has "+haveSkills+" skills");

          if(enableIntercom&&window.cordova){
            intercom.updateUser({
              'email': $scope.user.email,
              'name': $scope.user.name,
              'custom_attributes': {
                'haveWriteup': haveWriteup,
                'haveProfilePic': haveProfilePic,
                'haveSkills':haveSkills,
                'haveQualifications': haveQualifications,
                'haveLocation': haveLocation,
                'haveSchedule': haveSchedule,
                'haveVerification': haveVerification,
                'appViewCount': appViewCount
              }
            });
          }
        });

        $scope.skills = Skills.all();

        UserSkills.getCoachViews($scope.authData.uid).then(function(views){
          $scope.user.viewCount = views;
        });

        UserSkills.getCoachRating($scope.authData.uid).then(function(rating){
          $scope.user.rating = rating.rating;
          $scope.user.ratingCount = rating.count;
          UserSkills.updateRatings($scope.authData.uid, rating.rating);
        });

        $scope.newSkill = {};
        $scope.newSkill.rate = 50;
      }

      $ionicLoading.hide();

      $scope.shouldShowDelete = false;
      $scope.shouldShowReorder = false;
      $scope.listCanSwipe = true

      $scope.settings = {
        enableFriends: true
      };

      $scope.getSkillPic = function(skillName) {
        if(skillName!=null){
          return Skills.getByName(skillName).pic;
        }
      }

      $scope.checkIfHaveSchedule = Utilities.checkIfHaveSchedule;
      $scope.makeArrayOfSize = Utilities.makeArrayOfSize;

      //check what Skills user does not already have
      $scope.getUniqueSkills = function() {
        //console.log("Running get unique skills function");
        //skills in the universal catalogue
        var allSkills = Skills.all();
        //need to populate this
        var results = [];


        for(var i=0;i<allSkills.length;i++){
          if(!UserSkills.fbUserHasThisSkill($scope.user,allSkills[i].name)){
            results.push(allSkills[i]);
          }

        }
        //console.log("Results "+results.length);
        return results;
      }

    });

    $scope.getCurrentLocation = function(){
  $scope.locationLoading=true;
  $cordovaGeolocation.getCurrentPosition().then(function(position){
        console.log("Geolocation success!");
        console.log("Retrieved current location Lat:"+position.coords.latitude+" Lon:"+position.coords.longitude);
        var geocoder = new google.maps.Geocoder();
        var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        var request = {
          latLng: latlng
        };
        geocoder.geocode(request, function(data, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            if (data[0] != null) {
              console.log("address is: " + data[0].formatted_address);
              $scope.profile.location = data[0].formatted_address;
              $scope.profile.locationLat = position.coords.latitude;
              $scope.profile.locationLon = position.coords.longitude;
              $scope.geoHash = geohash.encode(position.coords.latitude,position.coords.longitude);
              setTimeout(function(){//here!
                getPositionAndShowOnMap();
            }, 1000);
            } else {
              $scope.showAlert("No address found at current location");
              $scope.locationLoading=false;
            }
          }
        })
    }, function(error){
        console.log("Could not get location");
        $scope.locationLoading=false;
        $scope.showAlert('Please Turn on Location Settings');
    });
  }

  var typingTimer;                //timer identifier
  var doneTypingInterval = 5000;  //time in ms, 5 second for example
  var mapLoaded = false;

  $scope.addressChanged = function(){
    clearTimeout(typingTimer);
    typingTimer = setTimeout($scope.doneTyping(), doneTypingInterval);
  }

//user is "finished typing," do something

  $scope.doneTyping = function(){
    $scope.locationLoading=true;
    var address = $scope.profile.location;
    console.log($scope.profile.location);
    if(address.length!=0){
      var request = {
      'address': address + ' '+Utilities.getCurrentCountry().name
      };
      var geocoder = new google.maps.Geocoder();
      geocoder.geocode(request, function(results) {
        if(results){
          if (results.length!=0) {
            console.log(results);
            $scope.profile.locationLat = results[0].geometry.location.lat();
            $scope.profile.locationLon = results[0].geometry.location.lng();
            $scope.geoHash = geohash.encode($scope.profile.locationLat,$scope.profile.locationLon);
            setTimeout(function(){//here!
                getPositionAndShowOnMap();
            }, 1000);
          }
        }
      })
    }
  }

  function getPositionAndShowOnMap(){

          $scope.initMap = function() {
              var myLatlng = new google.maps.LatLng($scope.profile.locationLat,$scope.profile.locationLon);
              console.log('entered map');
              var myOptions = {
                  zoom: 16,
                  center: myLatlng,
                  mapTypeId: google.maps.MapTypeId.ROADMAP,
                  disableDefaultUI: true
              };
              $scope.map = new google.maps.Map(document.getElementById("map2"), myOptions);

              var marker = new google.maps.Marker({
                  draggable: true,
                  position: myLatlng,
                  map: $scope.map,
                  title: "Your location"
              });
              console.log("resize");
              google.maps.event.trigger( $scope.map, 'resize' );
              $scope.locationLoading=false;
          };
          $scope.initMap();
  }

  $scope.saveLocation = function(){
    $ionicLoading.show();

    if($scope.user.skills){
      for(var skill in $scope.user.skills){
        console.log(skill);
        console.log($scope.profile.location.Lat);
        console.log('accounts '+fbCountry);
        var skillRef = fbCountry.child("userskills/"+skill+"/general/"+$scope.authData.uid);
        skillRef.once("value").then(function(snapshot) {
          $scope.sameCountry = snapshot.child("name").exists();
          console.log('exists '+$scope.sameCountry);
          console.log('skillref '+JSON.stringify(snapshot.val()));
        }).then(function(){
          if($scope.sameCountry){
            console.log('same country');
            skillRef.update({'g': $scope.geoHash, 'l':{'0':$scope.profile.locationLat, '1':$scope.profile.locationLon}, 'location':{'name':$scope.profile.location,'lat':$scope.profile.locationLat,'lon':$scope.profile.locationLon,'time':Firebase.ServerValue.TIMESTAMP}});
              for(var level in $scope.user.skills[skill]){
                if(level!='trial'||$scope.user.skills[skill][level]!=false){
                var skillRef2 = fbCountry.child("userskills/"+skill+"/"+level+"/"+$scope.authData.uid);
                skillRef2.update({'g': $scope.geoHash, 'l':{'0':$scope.profile.locationLat, '1':$scope.profile.locationLon}, 'location':{'name':$scope.profile.location,'lat':$scope.profile.locationLat,'lon':$scope.profile.locationLon,'time':Firebase.ServerValue.TIMESTAMP}});
                console.log(level);
                }
              }
          }else{
            $scope.transferSkills=null;
            //different country
            console.log('different country');
            //find data
            //$scope.countrySkillRef = fb;

            for (var val in $scope.countryArray) {
              $scope.countrySkillRef = fb;
              $scope.countryValue = $scope.countryArray[val].value;
              console.log("checking "+$scope.countryValue);
              if($scope.countryValue != 65){
                $scope.countrySkillRef = $scope.countrySkillRef.child($scope.countryValue);
                console.log("11111"+$scope.countrySkillRef)
              }
              $scope.countrySkillRef = $scope.countrySkillRef.child("userskills/"+skill+"/general/"+$scope.authData.uid);
              console.log("2222"+$scope.countrySkillRef)
              $scope.countrySkillRef.once("value").then(function(snapshot) {
                //console.log(snapshot.val())
                if(snapshot.exists()){
                  $scope.transferSkills = snapshot.val();
                  console.log("found in "+$scope.countryValue);
                  console.log(JSON.stringify($scope.transferSkills))
                }
              }).then(function(){
                //bring data over
                console.log("transferring data");
                console.log("3333"+skillRef)
                console.log("data"+JSON.stringify($scope.transferSkills))
                skillRef.update($scope.transferSkills);
                skillRef.update({'g': $scope.geoHash, 'l':{'0':$scope.profile.locationLat, '1':$scope.profile.locationLon}, 'location':{'name':$scope.profile.location,'lat':$scope.profile.locationLat,'lon':$scope.profile.locationLon,'time':Firebase.ServerValue.TIMESTAMP}});
                for(var level in $scope.user.skills[skill]){
                  if(level!='trial'||$scope.user.skills[skill][level]!=false){
                    var skillRef2 = fbCountry.child("userskills/"+skill+"/"+level+"/"+$scope.authData.uid);
                    skillRef2.update($scope.transferSkills);
                    skillRef2.update({'g': $scope.geoHash, 'l':{'0':$scope.profile.locationLat, '1':$scope.profile.locationLon}, 'location':{'name':$scope.profile.location,'lat':$scope.profile.locationLat,'lon':$scope.profile.locationLon,'time':Firebase.ServerValue.TIMESTAMP}});
                    console.log(level);
                  }
                }
                //delete old data
                console.log('delete old data');
                //$scope.countrySkillRef.set(null);
              });
            }
          }
        }).then(function(){
          $scope.user.location.name = $scope.profile.location;
          $scope.user.location.lat = $scope.profile.locationLat;
          $scope.user.location.lon = $scope.profile.locationLon;
          $ionicLoading.hide();
          console.log("new location "+$scope.user.location.name);
        });
      }
    }else{
      $scope.user.location.name = $scope.profile.location;
      $scope.user.location.lat = $scope.profile.locationLat;
      $scope.user.location.lon = $scope.profile.locationLon;
      $ionicLoading.hide();
      console.log("new location "+$scope.user.location.name);

    }
  }

    //END OF USER LOADED
    $scope.showSurvey = function() {
      var occupation = "NA";

      var levelArray = [
        {'text':"JC/University Student"},
        {'text':"Tuition Coordinator"},
        {'text':"Full Time Tutor"},
        {'text':"Full Time Employee"},
        {'text':"(Ex) MOE Teacher"},
        {'text':"Stay At Home Parent"}
      ];

      // Show the action sheet
      var hideSheet = $ionicActionSheet.show({
        buttons: levelArray,
        titleText: 'Which best describes your occupation?',
        destructiveText: 'Others',
        cancelText: 'Cancel',
        cancel: function() {
          // prompt user for other name
        },
        buttonClicked: function(index) {
          //$scope.newSkill.level = levels[index];
          console.log("Selected "+levelArray[index].text);
          $scope.user.occupation = levelArray[index].text;
          //$scope.selectLevel(levelArray[index].text);
          if(enableIntercom&&window.cordova){
            intercom.updateUser({
              'custom_attributes': {
                'occupation': $scope.user.occupation
              }
            });

          }

          return true;
        },
        destructiveButtonClicked: function(){
          console.log("Acquiring new level");
          $scope.enterCustomSurvey();
          return true;
        }
      });
    }

    $scope.enterCustomSurvey = function(){
      var subject = "Other Occupation";
      //Uses Cordova Dialog Plugin
      function onPrompt(results){
        $scope.user.occupation = results.input1;
        console.log("Entered "+$scope.user.occupation);
        if(enableIntercom&&window.cordova){
          intercom.updateUser({
            'custom_attributes': {
              'occupation': $scope.user.occupation
            }
          });

        }

        $scope.$apply();
      }

      if(ionic.Platform.isAndroid()){
        navigator.notification.prompt(
          'Describe Occupation',  // message
          onPrompt,  // callback
          subject, // title
          ['OK','Cancel'],   // buttonName
          'Custom Occupation' //default text
        );
      } else if(ionic.Platform.isIOS()){
        navigator.notification.prompt(
          'Describe Occupation',  // message
          onPrompt,  // callback
          subject, // title
          ['OK','Cancel'],   // buttonName
          '' //default text
        );
      }
    };

    //NEED TO REWRITE TO ACCOMODATE LEVELS
    //ES6
    //$scope.editSkillRate = function(skillName, newSkillRatesArray = [], trial) {
    $scope.editSkillRate = function(skillName, newSkillRatesArray, trial) {
      var counter = 0;
      var sumOfRates = 0;
      //var averageRate = 0;

      var newSkillRates = angular.copy(newSkillRatesArray);
      delete newSkillRates['trial'];
      //if(typeof trial == 'undefined') {trial = false;}
      trial = trial || false;

      for(var k in newSkillRates) {
        console.log("EXAMINE: "+JSON.stringify(newSkillRates));

        if(newSkillRates.hasOwnProperty(k)&&k!=='trial'){
          console.log("We are gonna go update "+skillName+" "+k);
          var newRate = newSkillRates[k];
          console.log("Acting on "+k);
          if(typeof newRate === 'string'){
            newRate = parseInt(newRate);
            //sometimes the slider range returns as a string
            //this screws up the price sorting during search
            //so we enforce conversion to integer
            console.log("Conversion needed");
          }


          //Update the rate in the UserSkills model
          // PROBLEMATIC k
          var coachRateToEdit = fbCountry.child('userskills').child(skillName).child("general").child($scope.authData.uid).child("levels");
          var updateItem = {};
          updateItem[k] = newRate;

          //coachRateToEdit.update({[k]: newRate}, function(){
          coachRateToEdit.update(updateItem, function(){
            console.log("Updated "+skillName+" "+k+" to "+newRate);
          });

          var coachRateToEdit = fbCountry.child('userskills').child(skillName).child(k).child($scope.authData.uid);
          coachRateToEdit.update({'rate': newRate}, function(){
            console.log("Updated "+skillName+" "+k+" to "+newRate);
          });
          counter++;
          sumOfRates += newRate;

        }

      }
      var averageRate = sumOfRates/counter;
      var coachAverageRate = fbCountry.child('userskills').child(skillName).child("general").child($scope.authData.uid);
      coachAverageRate.update({'rate': averageRate, 'trial': trial}, function(){
        console.log("Updated average to "+averageRate);
      });

    }

    $scope.removeLevel = function(skillName, level) {

      var skillManifestLevels = fbCountry.child('userskills').child(skillName).child("general").child($scope.authData.uid).child("levels");

      skillManifestLevels.once("value", function(snapshot) {
        var numLevels = snapshot.numChildren();

          if(numLevels>1){
          console.log("There are "+numLevels+" items");
          //delete the userskills/subject/level/

          var levelToDelete = fbCountry.child('userskills').child(skillName).child(level).child($scope.authData.uid);
          levelToDelete.set(null);

          skillManifestLevels.child(level).set(null);

          //remove skill from the User model
          delete $scope.user.skills[skillName][level];

          var averageRate = 0;
          var sumOfRates = 0;
          var counter = 0;

          //SUM ALL THE RATES IN THE REMAINING LEVELS
          for(var k in $scope.user.skills[skillName]) {
            if($scope.user.skills[skillName].hasOwnProperty(k)){
              sumOfRates += $scope.user.skills[skillName][k];
              counter++;
            }
          }
          //DERIVE THE AVERAGE RATE
          if(counter>0){
            averageRate = sumOfRates / (counter);
            var newAvgRate = fbCountry.child('userskills').child(skillName).child("general").child($scope.authData.uid).child("rate");
            newAvgRate.set(averageRate);
          }

          //skillManifestLevels.off("value");

          console.log("Deleted "+level+" "+skillName);
          $scope.$apply();

        } else if(numLevels===1) {
          console.log("Only 1 level item");
          $scope.removeSkill(skillName,level);
          //skillManifestLevels.off("value");
          $scope.closeModal(3);
          //otherwise delete individual level and recalculate

        }

      });


    }


    $scope.removeSkill = function(skillName, level) {
      //remove skill from the UserSkills model

      for (var val in $scope.countryArray) {
        $scope.countrySkillRef = fb;
        $scope.countryValue = $scope.countryArray[val].value;
        console.log("checking "+$scope.countryValue);
        if($scope.countryValue != 65){
          $scope.countrySkillRef = $scope.countrySkillRef.child($scope.countryValue);
          console.log("11111"+$scope.countrySkillRef)
        }
        console.log("2222"+$scope.countrySkillRef)

        //DELETE ALL THE LEVELS skill first
        for(var k in $scope.user.skills[skillName]) {
          if($scope.user.skills[skillName].hasOwnProperty(k)){

            var levelToDelete = $scope.countrySkillRef.child('userskills').child(skillName).child(k).child($scope.authData.uid);
            console.log("deleting "+levelToDelete);
            levelToDelete.set(null);

          }

        }

        var coachToDelete = $scope.countrySkillRef.child('userskills').child(skillName).child("general").child($scope.authData.uid);
        coachToDelete.set(null);



      }

      //remove skill from the User model
      delete $scope.user.skills[skillName];
      console.log("Deleted "+skillName+" during removeSkill");

    }

    $scope.showMediaSelector = function(labelIndex) {

  // Show the action sheet
    var hideSheet = $ionicActionSheet.show({
    buttons: [{'text':"Take Photo"},{'text':"Choose Photo"}],
    cancelText: 'Cancel',
    cancel: function() {
      // prompt user for other name
    },
    buttonClicked: function(index) {
      //$scope.newSkill.level = levels[index];
      console.log(index);
      if(index==1){
        $scope.uploadImage();
      }else if(index==0){
        $scope.takePicture();
      }

        return true;
      }
    });
  };

  $scope.takePicture = function() {
        var options = {
            quality : 75,
            destinationType : Camera.DestinationType.DATA_URL,
            sourceType : Camera.PictureSourceType.CAMERA,
            allowEdit : true,
            encodingType: Camera.EncodingType.JPEG,
            targetWidth: 300,
            targetHeight: 300,
            popoverOptions: CameraPopoverOptions,
            saveToPhotoAlbum: false
        };

      $cordovaCamera.getPicture(options).then(function(pictureData) {
        var imagedata = 'data:image/jpeg;base64,' + pictureData;

        var blob = Utilities.dataURItoBlob(imagedata);

        var imageTokenRef = fb.child("imagetokens/"+$scope.authData.uid);
        var imageToken = "";

        imageTokenRef.once("value", function(snapshot) {
          imageToken = snapshot.val();
          //console.log("Retrieved image token "+imageToken.token);
          var existingToken = (snapshot.val() !== null);
          console.log("Token exists? "+existingToken);

          $scope.user.face = "img/gif/loading_shaking.gif";

          if(!existingToken){
            ImageToken.setToken($scope.authData.uid).then(function(data){
              imageToken = data;

              //2 Get Presigned URL
              ImageToken.postImage($scope.authData.uid,imageToken,blob).then(function(url){
                //var url = data;
                console.log("URL obtained is "+url);

                $scope.user.face = url;
                UserSkills.updateFace($scope.authData.uid, $scope.user.face);
              });


            });
          } else {

            //2 Get Presigned URL  //3 Post to S3 is taken care inside
            ImageToken.postImage($scope.authData.uid,imageToken.token,blob).then(function(url){
              //var url = data["file-url"];
              console.log("URL obtained is "+url);

              $scope.user.face = url;
              UserSkills.updateFace($scope.authData.uid, $scope.user.face);
              console.log("Uploaded new Base64 profile");
            });

          }

        });

      });
    }



    $scope.uploadImage = function() {
      imageUploader.getPicture()
      .then(function(pictureData) {
        /*
        * Here we could push the dataURI to S3 or even to db/firebase as string.
        */

        //1 Token Retrieval or Creation
        var imagedata = 'data:image/jpeg;base64,' + pictureData;

        var blob = Utilities.dataURItoBlob(imagedata);

        var imageTokenRef = fb.child("imagetokens/"+$scope.authData.uid);
        var imageToken = "";

        imageTokenRef.once("value", function(snapshot) {
          imageToken = snapshot.val();
          //console.log("Retrieved image token "+imageToken.token);
          var existingToken = (snapshot.val() !== null);
          console.log("Token exists? "+existingToken);

          $scope.user.face = "img/gif/loading_shaking.gif";

          if(!existingToken){
            ImageToken.setToken($scope.authData.uid).then(function(data){
              imageToken = data;

              //2 Get Presigned URL
              ImageToken.postImage($scope.authData.uid,imageToken,blob).then(function(url){
                //var url = data;
                console.log("URL obtained is "+url);

                $scope.user.face = url;
                UserSkills.updateFace($scope.authData.uid, $scope.user.face);
              });


            });
          } else {

            //2 Get Presigned URL  //3 Post to S3 is taken care inside
            ImageToken.postImage($scope.authData.uid,imageToken.token,blob).then(function(url){
              //var url = data["file-url"];
              console.log("URL obtained is "+url);

              $scope.user.face = url;
              UserSkills.updateFace($scope.authData.uid, $scope.user.face);
              console.log("Uploaded new Base64 profile");
            });

          }

        });

      })
    };

    $scope.nameTouched = function() {

      $scope.dirtyName = true;
    }


    $scope.updateName = function(name) {

      if(typeof name!=="undefined"){
        if($scope.dirtyName){
          UserSkills.updateName($scope.authData.uid,name);
        }
        $scope.dirtyName = false;
        $scope.closeModal(6);
      } else {
        $scope.showAlert("Empty Name","Please enter a name");
      }

      //what about chat, and asks
    };

    $scope.enableTeaching = function(){
      $scope.user.showClassListings = true;
      console.log("User skill listing enabled");

      if($scope.user.skills){
        UserSkills.updateTime($scope.authData.uid,Firebase.ServerValue.TIMESTAMP).then(function(){
          console.log("Re-enabled user listings");
        });
      }

    }

     $(document).ready(function(){
    //Here your view content is fully loaded !!
  //IMPLEMENT MODALS HERE TO CONFIRM USER DATA
  console.log("loaded");

  // Modal 2
  $ionicModal.fromTemplateUrl('templates/account/referralFAQ.html', {
    id: '2',
    scope: $scope,
    backdropClickToClose: false,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.oModal2 = modal;
  });
  // Modal 3
  $ionicModal.fromTemplateUrl('templates/account/editskillrate.html', {
    id: '3',
    scope: $scope,
    backdropClickToClose: false,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.oModal3 = modal;
  });

  // Modal 4
  $ionicModal.fromTemplateUrl('templates/account/setlocation.html', {
    id: '4', // We need to use and ID to identify the modal that is firing the event!
    scope: $scope,
    backdropClickToClose: false,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.oModal4 = modal;
  });

  // Modal 5
  $ionicModal.fromTemplateUrl('templates/account/setschedule.html', {
    id: '5', // We need to use and ID to identify the modal that is firing the event!
    scope: $scope,
    backdropClickToClose: false,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.oModal5 = modal;
  });

  // Modal 6
  $ionicModal.fromTemplateUrl('templates/account/editface.html', {
    id: '6', // We need to use and ID to identify the modal that is firing the event!
    scope: $scope,
    backdropClickToClose: false,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.oModal6 = modal;
  });

  // Modal 9
  $ionicModal.fromTemplateUrl('templates/account/closeRequest.html', {
    id: '9', // We need to use and ID to identify the modal that is firing the event!
    scope: $scope,
    backdropClickToClose: false,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.oModal9 = modal;
  });

  });

  $scope.openModal = function(index, _skill) {
    var selectedModal = 'oModal' + index;
    $scope[selectedModal].show();
    $scope.skill = _skill;
        if(index==4){
          setTimeout(function(){//here!
                getPositionAndShowOnMap();
            }, 1000);
        }
  };

  $scope.closeModal = function(index) {
    var selectedModal = 'oModal' + index;
    $scope[selectedModal].hide();
    $scope.map = null;
  };

    $scope.checkIfProfileIsComplete = function () {
      var test1 = true;
      var test2 = true;
      var test3 = true;
      var test4 = true;

      //Never include school
      if($scope.user.education.sch.shortname=="None"){
        test1 = false;
      }

      //Never do proper writeup
      if($scope.user.writeup == 'Short writeup about myself'){
        test2 = false;
      } else if($scope.user.writeup.length<=12) {
        test2 = false;
      }

      //Never upload proper picture
      if(($scope.user.face=='img/assets/placeholder.png')||($scope.user.face=='img/assets/nologin.png')) {
        test3 = false;
      }

      //Never include location
      if(typeof $scope.user.location == 'undefined') {
        test4 = false;
      }

      if(test1&&test2&&test3&&test4){
        $state.go('tab.account-verify');
      } else {
        $scope.showAlert('Incomplete Profile','Learnly will verify you once you add your Profile Picture, Background Writeup, Lesson Location and Education');
      }
    };

    // Cleanup the modals when we're done with them (i.e: state change)
    // Angular will broadcast a $destroy event just before tearing down a scope
    // and removing the scope from its parent.
    $scope.$on('$destroy', function() {
      console.log('Destroying modals...');
      $scope.oModal3.remove();
      $scope.oModal4.remove();
      $scope.oModal5.remove();
      $scope.oModal6.remove();
      $scope.oModal9.remove();
    });

    /*
    //controller for the Map element in the Set Location modal
    function initMap() {
    //var lat = $scope.user.location.lat;

    var mapDiv = document.getElementById('map');
    var map = new google.maps.Map(mapDiv, {
    center: {lat: $scope.user.location.lat, lng: $scope.user.location.lon},
    zoom: 8
  });
}
*/

$scope.confirmLocation = function(text, station){

function route(buttonIndex) {
  //alert('We should redirect you');
  switch(buttonIndex){
    case 1: break; //do nothing
    case 2: Geolocation.setStationLocation($scope.authData.uid, station, true)
    .then(function(){

      $scope.$apply();


    });
    $scope.closeModal(4);
    break;
  }


  //we should also add an update digit to the chat list

}

navigator.notification.confirm(
  text,  // message
  route,              // callback to invoke with index of button pressed
  'Location Change',            // title
  'Cancel,Update'          // buttonLabels
);

};

$scope.enterCustomLevel = function(subject){
  //Uses Cordova Dialog Plugin
  function onPrompt(results){
    if(results.input1!='Custom Class Name'){
      $scope.newSkill.level = results.input1;
    } else {
      $scope.newSkill.level = 'General';
    }
    console.log("Selected "+$scope.newSkill.level);
    $scope.$apply();
  }

  if(ionic.Platform.isAndroid()){
    navigator.notification.prompt(
      'Enter Your Own',  // message
      onPrompt,  // callback
      subject, // title
      ['OK','Cancel'],   // buttonName
      'Custom Class Name' //default text
    );

  } else if(ionic.Platform.isIOS()){
    navigator.notification.prompt(
      'Custom Class Name',  // message
      onPrompt,  // callback
      subject, // title
      ['OK','Cancel'],   // buttonName
      '' //default text
    );

  }


};

//Prompt for Levels when selecting a skill
$scope.showLevelSelector = function(subject, levels, allowCustomSubject) {
  console.log(levels);
  var levelArray = [];
  for(var i=0;i<levels.length;i++){
    levelArray.push({'text':levels[i]});
  }

  if(allowCustomSubject){
    // Show the action sheet
    var hideSheet = $ionicActionSheet.show({
      buttons: levelArray,
      destructiveText: 'Enter My Own',
      titleText: 'Choose Subject Level for '+subject,
      cancelText: 'Cancel',
      cancel: function() {
        // prompt user for other name
        $scope.newSkill.level = 'General';
        $scope.showAlert('No Level Specified','You did not specify a level. Less users will be able to find you.');
      },
      buttonClicked: function(index) {
        $scope.newSkill.level = levels[index];
        console.log("Selected "+$scope.newSkill.level);
        $scope.resizeScroll();
        //$ionicScrollDelegate.$getByHandle('addSkillScroll').scrollBottom(true);
        //$scope.$apply();
        return true;
      },
      destructiveButtonClicked: function(){
        console.log("Acquiring new level");
        $scope.enterCustomLevel(subject);
        $scope.resizeScroll();
        return true;
      }
    });
  } else {
    // Show the action sheet
    var hideSheet = $ionicActionSheet.show({
      buttons: levelArray,
      titleText: 'Choose Subject Level for '+subject,
      cancelText: 'Cancel',
      cancel: function() {
        // prompt user for other name
        $scope.newSkill.level = 'General';
        $scope.showAlert('No Level Selected','You did not select a level. Less users will be able to find you.');
      },
      buttonClicked: function(index) {
        $scope.newSkill.level = levels[index];
        console.log("Selected "+$scope.newSkill.level);

        return true;
      }
    });
  }

};

//call a function from fixed string names
$scope.callFunction = function (name){
  console.log("Calling "+name);
  if(angular.isFunction($scope[name]))
  $scope[name]();
}

$scope.getTimeOfDayPicture = function (timeOfDay) {
  return 'img/assets/' + timeOfDay+'.png';
};

})


.controller('VerifyCtrl', function($scope, $rootScope, $timeout, $firebaseArray, $firebaseObject, $ionicActionSheet, $ionicScrollDelegate, $ionicHistory, $ionicLoading, $state, $stateParams, Push, Auth, Utilities, imageUploader, ImageToken, $http, $cordovaCamera) {

  $scope.authData = fb.getAuth();

  $scope.user = $firebaseObject(fb.child("users/"+$scope.authData.uid));
  Auth.userRef().$bindTo($scope, "user");

  $scope.showAlert = Utilities.showAlert;

  $scope.checkUploads = function(occupation){

    $ionicLoading.show({
      template: '<p>Submitting</p><ion-spinner icon="spiral"></ion-spinner>'
    });
    //minimally require legal id

    if($scope.labels[0].img){
      if($scope.labels[1].img || $scope.labels[2].img || $scope.labels[3].img ){

        $http({
          method: 'POST',
          url: 'http://ec2-54-169-215-80.ap-southeast-1.compute.amazonaws.com/email',
          data: { alias: $scope.user.alias, id: $scope.authData.uid, origin: $scope.user.defaultcountry.value,
            link1:$scope.labels[0].img, link2:$scope.labels[1].img, link3:$scope.labels[2].img, link4:$scope.labels[3].img },
          }).success(function (data, status, headers, config) {
            console.log('works')
            console.log('data ' + JSON.stringify(data))
            console.log('status ' + JSON.stringify(status))
            console.log('headers ' + JSON.stringify(headers))
            console.log('config ' + JSON.stringify(config))


            if(data === true) {


              $scope.showAlert("Upload Success","Please give the Learnly team 3-5 working days to process your documents");


              $scope.user.verify = {
                'inprogress': true,
                'complete': false,
                'id': $scope.labels[0].img,
                'origin': $scope.user.defaultcountry.value
              };

              if($scope.labels[1].img){
                $scope.user.verify.schoolid = $scope.labels[1].img;

              }

              if($scope.labels[2].img){
                $scope.user.verify.certificate = $scope.labels[2].img;

              }

              if($scope.labels[3].img){
                $scope.user.verify.supportingdoc = $scope.labels[3].img;
              }


              var defaultcountry = $scope.user.defaultcountry.value;
              var timeStamp = new Date().getTime();

              console.log("Email sending complete");
              if(enableIntercom&&window.cordova){
                intercom.updateUser({
                  'custom_attributes': {
                    'requestVerification': true,
                    'requestVerification_at': timeStamp,
                    'occupation': occupation,
                    'tutorOrigin': defaultcountry
                  }
                });
              }

              $ionicLoading.hide();
              $ionicHistory.goBack();
            }

          }).error(function (data, status, headers, config) {
            console.log('error');
            console.log('data ' + JSON.stringify(data));
            console.log('status ' + JSON.stringify(status));
            console.log('headers ' + JSON.stringify(headers));
            console.log('config ' + JSON.stringify(config));
            $ionicLoading.hide();
          });



        } else {
          $scope.showAlert("Missing Item","Please provide either Student ID or Qualification or Supporting Doc");
          $ionicLoading.hide();
        }

      } else {
        $scope.showAlert("Missing Item","Please attach Legal ID");
        $ionicLoading.hide();
      }


    }

    $scope.showSurvey = function() {
      if(typeof $scope.user.occupation != 'undefined'){
        $scope.checkUploads($scope.user.occupation);
      } else {
        var occupation = "NA";

        var levelArray = [
          {'text':"JC/University Student"},
          {'text':"Class Coordinator"},
          {'text':"Full Time Tutor/Coach"},
          {'text':"Full Time Employee"},
          {'text':"(Ex) MOE Teacher"},
          {'text':"Stay At Home Parent"}
        ];

        // Show the action sheet
        var hideSheet = $ionicActionSheet.show({
          buttons: levelArray,
          destructiveText: 'Others',
          titleText: 'Which best describes your occupation?',
          cancelText: 'Cancel',
          cancel: function() {
            // prompt user for other name
          },
          buttonClicked: function(index) {
            //$scope.newSkill.level = levels[index];
            console.log("Selected "+levelArray[index].text);
            $scope.user.occupation = levelArray[index].text;
            //$scope.selectLevel(levelArray[index].text);
            $scope.checkUploads($scope.user.occupation);
            return true;
          },
          destructiveButtonClicked: function(){
            console.log("Acquiring new level");
            $scope.enterCustomLevel();
            return true;
          }
        });

      }

    }

    $scope.enterCustomLevel = function(){
      var subject = "Other Occupation";
      //Uses Cordova Dialog Plugin
      function onPrompt(results){
        $scope.user.occupation = results.input1;
        console.log("Entered "+$scope.user.occupation);
        $scope.checkUploads($scope.user.occupation);
        $scope.$apply();
      }

      if(ionic.Platform.isAndroid()){
        navigator.notification.prompt(
          'Describe Occupation',  // message
          onPrompt,  // callback
          subject, // title
          ['OK','Cancel'],   // buttonName
          'Custom Occupation' //default text
        );
      } else if(ionic.Platform.isIOS()){
        navigator.notification.prompt(
          'Describe Occupation',  // message
          onPrompt,  // callback
          subject, // title
          ['OK','Cancel'],   // buttonName
          '' //default text
        );
      }


    };

    //call a function from fixed string names
    $scope.callFunction = function (name, index){
      console.log("Calling "+name);
      if(angular.isFunction($scope[name]))
      $scope[name](index);
    }

    $scope.labels = {
      "0": {
        "name": "Legal Photo ID",
        "description": "NRIC or Passport",
        "action": "showMediaSelector",
        "icon": "ion-at",
        "mandatory": false
      },
      "1": {
        "name": "School ID Card",
        "description": "",
        "action": "showMediaSelector",
        "icon": "ion-person-stalker"
      },
      "2": {
        "name": "Qualification",
        "description": "Certificate Attained",
        "action": "showMediaSelector",
        "icon": "ion-android-list"
      },
      "3": {
        "name": "Supporting Document",
        "description": "Transcript or Testimonial",
        "action": "showMediaSelector",
        "icon": "ion-briefcase"
      }

    };

  $scope.showMediaSelector = function(labelIndex) {

  // Show the action sheet
    var hideSheet = $ionicActionSheet.show({
    buttons: [{'text':"Take Photo"},{'text':"Choose Photo"}],
    cancelText: 'Cancel',
    cancel: function() {
      // prompt user for other name
    },
    buttonClicked: function(index) {
      //$scope.newSkill.level = levels[index];
      console.log(index);
      if(index==1){
        $scope.uploadImage(labelIndex);
      }else if(index==0){
        $scope.takePicture(labelIndex);
      }

        return true;
      }
    });
  };

  $scope.takePicture = function(labelIndex) {
        var options = {
            quality : 75,
            destinationType : Camera.DestinationType.DATA_URL,
            sourceType : Camera.PictureSourceType.CAMERA,
            allowEdit : true,
            encodingType: Camera.EncodingType.JPEG,
            targetWidth: 300,
            targetHeight: 300,
            popoverOptions: CameraPopoverOptions,
            saveToPhotoAlbum: false
        };

      $cordovaCamera.getPicture(options).then(function(pictureData) {
        var imagedata = 'data:image/jpeg;base64,' + pictureData;
        var blob = Utilities.dataURItoBlob(imagedata);

        var imageTokenRef = fb.child("imagetokens/"+$scope.authData.uid);
        var imageToken = "";

        imageTokenRef.once("value", function(snapshot) {
          imageToken = snapshot.val();
          //console.log("Retrieved image token "+imageToken.token);
          var existingToken = (snapshot.val() !== null);
          console.log("Token exists? "+existingToken);

          $scope.labels[labelIndex].img = "img/gif/loading_spinner.gif";
          //$scope.user.face = "img/gif/loading_shaking.gif";

          if(!existingToken){
            ImageToken.setToken($scope.authData.uid).then(function(data){
              imageToken = data;

              //2 Get Presigned URL
              ImageToken.postImage($scope.authData.uid,imageToken,blob).then(function(url){
                //var url = data;
                console.log("URL obtained is "+url);

                $scope.labels[labelIndex].img = url;
                //$scope.user.face = url;
                //UserSkills.updateFace($scope.authData.uid, $scope.user.face);
              });


            });
          } else {

            //2 Get Presigned URL  //3 Post to S3 is taken care inside
            console.log(imageToken.token);
            console.log(blob);
            ImageToken.postImage($scope.authData.uid,imageToken.token,blob).then(function(url){
              //var url = data["file-url"];
              console.log("URL obtained is "+url);

              //$scope.user.face = url;
              //UserSkills.updateFace($scope.authData.uid, $scope.user.face);
              $scope.labels[labelIndex].img = url;

              console.log("Uploaded new Base64 profile");
            });

          }

        });

      });
    }


    $scope.uploadImage = function(labelIndex) {
      console.log("Preparing upload for "+labelIndex);

      imageUploader.getPicture()
      .then(function(pictureData) {
        /*
        * Here we could push the dataURI to S3 or even to db/firebase as string.
        */

        //1 Token Retrieval or Creation
        var imagedata = 'data:image/jpeg;base64,' + pictureData;

        var blob = Utilities.dataURItoBlob(imagedata);

        var imageTokenRef = fb.child("imagetokens/"+$scope.authData.uid);
        var imageToken = "";

        imageTokenRef.once("value", function(snapshot) {
          imageToken = snapshot.val();
          //console.log("Retrieved image token "+imageToken.token);
          var existingToken = (snapshot.val() !== null);
          console.log("Token exists? "+existingToken);

          $scope.labels[labelIndex].img = "img/gif/loading_spinner.gif";
          //$scope.user.face = "img/gif/loading_shaking.gif";

          if(!existingToken){
            ImageToken.setToken($scope.authData.uid).then(function(data){
              imageToken = data;

              //2 Get Presigned URL
              ImageToken.postImage($scope.authData.uid,imageToken,blob).then(function(url){
                //var url = data;
                console.log("URL obtained is "+url);

                $scope.labels[labelIndex].img = url;
                //$scope.user.face = url;
                //UserSkills.updateFace($scope.authData.uid, $scope.user.face);
              });


            });
          } else {
            console.log(imageToken.token);
            console.log(blob);

            //2 Get Presigned URL  //3 Post to S3 is taken care inside
            ImageToken.postImage($scope.authData.uid,imageToken.token,blob).then(function(url){
              //var url = data["file-url"];
              console.log("URL obtained is "+url);

              //$scope.user.face = url;
              //UserSkills.updateFace($scope.authData.uid, $scope.user.face);
              $scope.labels[labelIndex].img = url;

              console.log("Uploaded new Base64 profile");
            });

          }

        });

      })
    };
  })

  .controller('AccountWorkshopCtrl', function($scope, $state, $ionicScrollDelegate, $ionicHistory, $stateParams, $ionicModal, $ionicLoading, Utilities, Push, Geolocation, $timeout, $geofire, geohash, $ionicSlideBoxDelegate, Workshops) {
    $scope.authData = fb.getAuth();
    $scope.currentview = $state.current.name;
    console.log("Now viewing "+$scope.currentview);
    $scope.viewTitle = 'My Account';
    $scope.search = {};
    $scope.workshopBookingId = $stateParams.workshopBookingId;

    var myLatlng = new google.maps.LatLng(37.3000, -120.4833);

    var marker = new google.maps.Marker({
      position: myLatlng,
      map: map,
      title: 'Click to zoom'
    });

    var mapOptions = {
      center: myLatlng,
      zoom: 16,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      draggable: false
    };

    var map = new google.maps.Map(document.getElementById("map"), mapOptions);

    map.addListener('center_changed', function() {
      // 3 seconds after the center of the map has changed, pan back to the
      // marker.
      window.setTimeout(function() {
        map.panTo(marker.getPosition());
      }, 0);
    });

    marker.addListener('click', function() {
      map.setZoom(8);
      map.setCenter(marker.getPosition());
    });

    $scope.map = map;

    google.maps.event.trigger( map, 'resize' );

    var WorkshopRef = fb.child("workshopBookings/users/"+$scope.authData.uid+"/"+$stateParams.workshopBookingId);
    WorkshopRef.on("value", function(snapshot) {

      $scope.workshop = snapshot.val();
      console.log($scope.workshop);

      var location = $scope.workshop.location;

      myLatlng = new google.maps.LatLng(location.lat,location.lon);
      marker = new google.maps.Marker({
        position: myLatlng,
        map: map,
        title: 'Click to zoom'
      });
      map.setCenter(new google.maps.LatLng(location.lat, location.lon));
      var myLocation = new google.maps.Marker({
        position: new google.maps.LatLng(location.lat, location.lon),
        map: map,
        title: "My Location"
      });
    });

    $scope.ReadMore = function(){
      $scope.showDescription=true;
      $scope.resizeScroll();
    }

    $scope.resizeScroll = function(){
    var scrollresizeTimeout = $timeout(function() {
      $ionicScrollDelegate.resize();
    }, 250); // delay 250 ms
  }
  })

  .controller('AccountWorkshopHolderCtrl', function($scope, $state, $ionicScrollDelegate, $ionicHistory, $stateParams, $ionicModal, $ionicLoading, Utilities, Push, Geolocation, $timeout, $geofire, geohash, $ionicSlideBoxDelegate, Workshops) {
    $scope.authData = fb.getAuth();
    $scope.currentview = $state.current.name;
    console.log("Now viewing "+$scope.currentview);
    $scope.viewTitle = 'My Account';
    $scope.search = {};
    console.log($stateParams.keyWord);
    $scope.search.keyWord = $stateParams.keyWord.replace(/space/g, " ");
    $scope.search.keyWord = $scope.search.keyWord.replace(/and/g, "&");
    $scope.search.keyWordtoPass = $stateParams.keyWord;
    $scope.workshopId = $stateParams.workshopId;

    var WorkshopRef = fb.child("workshops/"+$scope.search.keyWord+"/"+$stateParams.workshopId);
    WorkshopRef.on("value", function(snapshot) {

      $scope.workshop = snapshot.val();
    });

    var myLatlng = new google.maps.LatLng(37.3000, -120.4833);

    var marker = new google.maps.Marker({
      position: myLatlng,
      map: map,
      title: 'Click to zoom'
    });

    var mapOptions = {
      center: myLatlng,
      zoom: 16,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      draggable: false
    };

    var map = new google.maps.Map(document.getElementById("map"), mapOptions);

    Workshops.getWorkshopLocation($stateParams.workshopId,$scope.search.keyWord).then(function(location){
      myLatlng = new google.maps.LatLng(location.lat,location.lon);
      marker = new google.maps.Marker({
        position: myLatlng,
        map: map,
        title: 'Click to zoom'
      });
      map.setCenter(new google.maps.LatLng(location.lat, location.lon));
      var myLocation = new google.maps.Marker({
        position: new google.maps.LatLng(location.lat, location.lon),
        map: map,
        title: "My Location"
      });
    });

    map.addListener('center_changed', function() {
      // 3 seconds after the center of the map has changed, pan back to the
      // marker.
      window.setTimeout(function() {
        map.panTo(marker.getPosition());
      }, 0);
    });

    marker.addListener('click', function() {
      map.setZoom(8);
      map.setCenter(marker.getPosition());
    });

    $scope.map = map;

    google.maps.event.trigger( map, 'resize' );

    $scope.ReadMore = function(){
      $scope.showDescription=true;
    }
  })

  .controller('AccountWorkshopScheduleCtrl', function($scope, $state, $ionicScrollDelegate, $ionicHistory, $stateParams, $ionicModal, $ionicLoading, Utilities, Push, Geolocation, $timeout, $geofire, geohash, $ionicSlideBoxDelegate, Workshops) {
    $scope.authData = fb.getAuth();
    $scope.currentview = $state.current.name;
    console.log("Now viewing "+$scope.currentview);
    $scope.workshopTitle = $stateParams.workshopTitle;
    $scope.workshopStart = $stateParams.workshopStart;
    $scope.workshopEnd = $stateParams.workshopEnd;
    $scope.workshopId = $stateParams.workshopId;
    $scope.workshopBookingId = $stateParams.workshopBookingId;
    $scope.expiryTime = $stateParams.expiryTime;
    $scope.results = [];
    $scope.keyWord = $stateParams.category.replace(/space/g, " ");
    $scope.keyWord = $scope.keyWord.replace(/and/g, "&");
    $scope.keyWordtoPass = $stateParams.category;

    var WorkshopBookingRef = fb.child("workshopBookings/holders/"+$scope.authData.uid+"/"+$scope.workshopId+"/"+$scope.workshopBookingId);
    WorkshopBookingRef.on("value", function(snapshot) {
      var Bookingresults = snapshot.val();
      $scope.BookingsArray = Utilities.convertToArrayWithKey(Bookingresults);
      for(var i in $scope.BookingsArray){

        console.log($scope.BookingsArray[i].user+","+$scope.BookingsArray[i].key);
        Workshops.getUserBooking($scope.BookingsArray[i].user,$scope.BookingsArray[i].key).then(function(result){
          $scope.results.push(result);
          console.log($scope.results);
        });
      }
    })

    $scope.hideLesson = function(){

      if($scope.workshopStart){
      var WorkshopScheduleRef = fb.child("workshops/"+$scope.keyWord+"/"+$scope.workshopId+"/workshopSchedule/"+$scope.workshopBookingId);
      WorkshopScheduleRef.update({'expiryTime':0});
      }else{
        var Workshop = fb.child("workshops/"+$scope.keyWord+"/"+$scope.workshopId);
        Workshop.update({'expiryTime': 0});
      }
      console.log("hidden");
      $scope.expiryTime = 0;
    }

    $scope.unhideLesson = function(){

      if($scope.workshopStart){
        var WorkshopScheduleRef = fb.child("workshops/"+$scope.keyWord+"/"+$scope.workshopId+"/workshopSchedule/"+$scope.workshopBookingId);
        WorkshopScheduleRef.update({'expiryTime': $scope.workshopStart});
      }else{
        var Workshop = fb.child("workshops/"+$scope.keyWord+"/"+$scope.workshopId);
        Workshop.update({'expiryTime': 9000000000000});
      }
      console.log("unhidden");
      $scope.expiryTime = $scope.workshopStart;
    }

    $scope.HidedisclaimerAlert = function(text){

    function route(buttonIndex) {
      //alert('We should redirect you');
      switch(buttonIndex){
        case 1: break; //do nothing
        case 2: $scope.hideLesson(); break;
      }
      //we should also add an update digit to the chat list
    }
    navigator.notification.confirm(
      text,  // message
      route,              // callback to invoke with index of button pressed
      'Hide Lesson',            // title
      'Cancel,Yes'          // buttonLabels
    );
  }

  $scope.UnhidedisclaimerAlert = function(text){

    function route(buttonIndex) {
      //alert('We should redirect you');
      switch(buttonIndex){
        case 1: break; //do nothing
        case 2: $scope.unhideLesson(); break;
      }

      //we should also add an update digit to the chat list

    }

    navigator.notification.confirm(
      text,  // message
      route,              // callback to invoke with index of button pressed
      'Show Lesson',            // title
      'Cancel,Yes'          // buttonLabels
    );
  }

  })

  .controller('AccountWorkshopEmailCtrl', function($scope, $state, $ionicScrollDelegate, $ionicHistory, $stateParams, $ionicModal, $ionicLoading, Utilities, Push, Geolocation, $timeout, $geofire, geohash, $ionicSlideBoxDelegate, Workshops) {
    $scope.authData = fb.getAuth();
    $scope.currentview = $state.current.name;
    console.log("Now viewing "+$scope.currentview);
    $scope.isVendor = $stateParams.isVendor;
    $scope.studentID = $stateParams.studentID;
    $scope.referenceID = $stateParams.referenceID;

    BookingRef = fb.child("workshopBookings/users/"+$scope.studentID+"/"+$scope.referenceID);
    BookingRef.on("value", function(snapshot) {
      $scope.Booking = snapshot.val();
      console.log($scope.Booking);
    })
  })


  .controller('FavoritesCtrl', function($scope, $rootScope, $firebaseObject, $state, Auth, UserSkills, Utilities, Bookmarks) {

    $scope.currentview = $state.current.name;
    console.log("Now viewing "+$scope.currentview);

    $scope.authData = fb.getAuth();

    $scope.user = $firebaseObject(fb.child("users/"+$scope.authData.uid));
    Auth.userRef().$bindTo($scope, "user");

    $scope.user.$loaded().then(function(){
      console.log("Favorites ready");

      $scope.listFavorites = [];
      if(typeof $scope.user.likes.person != "undefined"){
        $scope.retrieveUserDetails();
      }


    });

    $scope.abstract = Utilities.TextAbstract;

    $scope.removeBookmark = function(unlikeId) {
      console.log("Clicked remove");
      Bookmarks.unlikePerson(unlikeId, $scope.authData.uid);
    }

    $scope.retrieveUserDetails = function() {
      var likedPersons = $scope.user.likes.person;
      var populatedDetails = [];

      angular.forEach(likedPersons, function(value, uid){
        if(likedPersons.hasOwnProperty(uid)){
          UserSkills.getCoach(uid).then(function(coach){

            var thisCoach = {};
            thisCoach.name = coach.name;
            thisCoach.face = coach.face;
            thisCoach.alias = coach.alias;
            thisCoach.key = uid;
            thisCoach.time = likedPersons[uid];
            thisCoach.writeup = Utilities.TextAbstract(coach.writeup,120);

            populatedDetails.push(thisCoach);

          });
          //json[k].key = k;
        }
      });
      /*  //ES6
      for(var uid in likedPersons) {

      if(likedPersons.hasOwnProperty(uid)){
      UserSkills.getCoach(uid).then(function(coach){
      //ES6
      //let thisCoach = {};
      var thisCoach = {};
      thisCoach.name = coach.name;
      thisCoach.face = coach.face;
      thisCoach.alias = coach.alias;
      thisCoach.key = uid;
      thisCoach.time = likedPersons[uid];
      thisCoach.writeup = Utilities.TextAbstract(coach.writeup,120);

      populatedDetails.push(thisCoach);

    });
    //json[k].key = k;
  }
}
*/
console.log(populatedDetails);
$scope.listFavorites = populatedDetails;

}

$scope.$watch('user.likes.person', function() {
  console.log("New favorite results! Refresh results!");
  //$scope.$apply();
  $scope.retrieveUserDetails();
  //$ionicLoading.hide();
});

})

.controller('AccountRequestsCtrl', function($scope, $rootScope, $timeout, $firebaseArray, $firebaseObject, $ionicScrollDelegate, $ionicHistory, $ionicLoading, $state, $stateParams, Push, Auth, Utilities, Requests, $ionicModal) {

  $scope.authData = fb.getAuth();
  $scope.locationLoading = false;

  $scope.randomGif = Utilities.randomGif;
  $scope.defaultCountry = Utilities.getCurrentCountry();

  var requestsRef = fbCountry.child("requests");
  requestsRef.orderByChild("requester/id").equalTo($scope.authData.uid).on("value", function(snapshot){

        $scope.requests = Utilities.convertToArrayWithKey(snapshot.val());
  });

  $scope.chooseTutorToClose = function(request){
    console.log(request.replies);
    if(typeof request.replies != 'undefined'){
      $scope.replies = Utilities.convertToArrayWithKey(request.replies);
      $scope.requestToClose = request.key;
      $scope.openModal(9);
    }else{
      $scope.confirmCloseRequest(request.key, null);
    }
  }

  $scope.confirmCloseRequest = function(requestId, tutorId){

    var text = "Is this your Chosen Tutor?"

    if(tutorId == null){
      text = "Have you found your tutor?";
    }

    function route(buttonIndex) {
      switch(buttonIndex){
        case 1: break; //do nothing
        case 2: $scope.closeRequest(requestId, tutorId); break;
      }
    }

    navigator.notification.confirm(
      text,  // message
      route,              // callback to invoke with index of button pressed
      'Close Request',            // title
      'No, Yes'          // buttonLabels
    );
  }

  //close a request after tutor has been found
  $scope.closeRequest = function(requestId, tutorId){
    var jobRef = fbCountry.child("requests/"+requestId);

    //jobRef.set(null);
    jobRef.update({'foundTutor': Firebase.ServerValue.TIMESTAMP,'foundTutorId': tutorId}, function(){
      console.log("Indicated tutor was found");
    });

    //Update in user model
    var userJobRef = fb.child("users/"+$scope.authData.uid+"/gigs/"+requestId);
    userJobRef.update({'foundTutor': Firebase.ServerValue.TIMESTAMP, 'foundTutorId': tutorId}, function(){
      console.log("Indicated tutor was found");
    });

    $scope.closeModal(9);
  }

  $ionicModal.fromTemplateUrl('templates/account/closeRequest.html', {
    id: '9', // We need to use and ID to identify the modal that is firing the event!
    scope: $scope,
    backdropClickToClose: false,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.oModal9 = modal;
  });

  $scope.openModal = function(index) {
    var selectedModal = 'oModal' + index;
    $scope[selectedModal].show();
  };

  $scope.closeModal = function(index) {
    var selectedModal = 'oModal' + index;
    $scope[selectedModal].hide();
    $scope.shownGroup = null;
  };

  /* Listen for broadcasted messages */

  $scope.$on('modal.shown', function(event, modal) {
    console.log('Modal ' + modal.id + ' is shown!');
  });

  $scope.$on('modal.hidden', function(event, modal) {
    console.log('Modal ' + modal.id + ' is hidden!');
  });

  // Cleanup the modals when we're done with them (i.e: state change)
  // Angular will broadcast a $destroy event just before tearing down a scope
  // and removing the scope from its parent.
  $scope.$on('$destroy', function() {
    console.log('Destroying modals...');
    $scope.oModal9.remove();
  });

  $scope.resizeScroll = function(){
    var scrollresizeTimeout = $timeout(function() {
      $ionicScrollDelegate.resize();
    }, 250); // delay 250 ms
  }
})

.controller('AccountEditRequestCtrl', function($rootScope, $scope, $ionicModal, $ionicActionSheet, $ionicLoading, $ionicSlideBoxDelegate, $state, $window, $ionicHistory, $firebaseObject, $ionicLoading, $filter, $timeout,
  imageUploader, ImageToken, UserAction, Utilities, Jobs, Skills, Chats, Orders, Push, Bookmarks, UserSkills, Auth, Categories, $cordovaGeolocation, geohash, $ionicScrollDelegate,$geofire, $cordovaCamera, $stateParams) {

  $scope.authData = fb.getAuth();
  $scope.userLoading = true;
  //Utilities.setCountry();
  $scope.defaultCountry = Utilities.getCurrentCountry();
  $scope.categories = Categories.all($scope.defaultCountry.value);
  $scope.locationLoading = false;
  $scope.job = {'anonymous':false, 'pic':null, 'price':50, 'frequencyType':'Weekly', 'frequency':1, 'duration':2};

  if($stateParams.requestId!=null&&typeof $stateParams.requestId!='undefined'){
    console.log("edit Request");
    $scope.edittingMode = true;
    var requestRef = fbCountry.child("requests").child($stateParams.requestId);
    requestRef.on("value", function(snapshot) {
      $scope.job = snapshot.val();
      if($scope.job.task.pic){
        $scope.job.pic = $scope.job.task.pic;
      }
      $scope.job.writeup = $scope.job.task.writeup;
      $scope.job.role = $scope.job.meta.role;
      $scope.job.category = $scope.job.categories;
      $scope.job.requestNature = $scope.job.meta.requestNature;
      $scope.job.tuitionType = $scope.job.meta.tuitionType;
      $scope.job.tuitionGender = $scope.job.meta.tuitionGender;
      $scope.job.locationLat = $scope.job.l[0];
      $scope.job.locationLon = $scope.job.l[1];
      setTimeout(function(){//here!
        getPositionAndShowOnMap();
      }, 1000);
      $scope.userLoading = false;
    });
  }else{
    console.log("Create Request");
    $scope.edittingMode = false;
    var userRef = fb.child("users").child($scope.authData.uid);
    userRef.on("value", function(snapshot) {
      $scope.user = snapshot.val();
      if(typeof $scope.user.location!='undefined') {
        $scope.job.location = $scope.user.location.name;
        if($scope.user.location.lat&&$scope.user.location.lon){
          $scope.job.locationLat = $scope.user.location.lat;
          $scope.job.locationLon = $scope.user.location.lon;
          $scope.job.geoHash = geohash.encode($scope.user.location.lat,$scope.user.location.lon);
        }
      }
      $scope.userLoading = false;
    });
  }

  var $range = $(".js-range-slider");

  $range.ionRangeSlider({
    type: "single",
    min: 15,
    max: 150,
    from: $scope.job.price,
    step: 5,
    prefix: '$',
    onFinish: function (data) {
      saveResult(data);
    }
  });

  var $durationRange = $(".js-range-slider2");

  $durationRange.ionRangeSlider({
    type: "single",
    min: 1,
    max: 10,
    from: $scope.job.duration,
    step: 0.5,
    postfix: 'hr',
    onFinish: function (data) {
      saveDuration(data);
    }
  });

  var $frequencyRange = $(".js-range-slider3");

  $frequencyRange.ionRangeSlider({
    type: "single",
    min: 1,
    max: 10,
    from: $scope.job.frequency,
    step: 1,
    onFinish: function (data) {
      saveFrequency(data);
    }
  });
  var priceSlider = $range.data("ionRangeSlider");
  var durationSlider = $durationRange.data("ionRangeSlider");
  var frequencySlider = $frequencyRange.data("ionRangeSlider");

  var saveResult = function (data) {
      $scope.job.price = data.from;
      $scope.$apply();
  };
  var saveDuration = function (data) {
    $scope.job.duration = data.from;
    $scope.$apply();
  };
  var saveFrequency = function (data) {
    $scope.job.frequency = data.from;
    $scope.$apply();
  };

  $scope.resetFrequency = function(){
    $scope.job.frequency = 1;
    frequencySlider.reset();
    console.log( 'job frequency is ' +$scope.job.frequency);
  }

  $scope.getCurrentLocation = function(){
  $scope.locationLoading=true;
  $cordovaGeolocation.getCurrentPosition().then(function(position){
        console.log("Geolocation success!");
        console.log("Retrieved current location Lat:"+position.coords.latitude+" Lon:"+position.coords.longitude);
        var geocoder = new google.maps.Geocoder();
        var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        var request = {
          latLng: latlng
        };
        geocoder.geocode(request, function(data, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            if (data[0] != null) {
              console.log("address is: " + data[0].formatted_address);
              $scope.job.location = data[0].formatted_address;
              $scope.job.locationLat = position.coords.latitude;
              $scope.job.locationLon = position.coords.longitude;
              $scope.job.geoHash = geohash.encode(position.coords.latitude,position.coords.longitude);
              setTimeout(function(){//here!
                getPositionAndShowOnMap();
            }, 1000);
            } else {
              $scope.showAlert("No address found at current location");
              $scope.locationLoading=false;
            }
          }
        })
    }, function(error){
        console.log("Could not get location");
        $scope.locationLoading=false;
        $scope.showAlert('Please Turn on Location Settings');
    });
  }

  var typingTimer;                //timer identifier
  var doneTypingInterval = 5000;  //time in ms, 5 second for example
  var mapLoaded = false;

  $scope.addressChanged = function(){
    clearTimeout(typingTimer);
    typingTimer = setTimeout($scope.doneTyping(), doneTypingInterval);
  }

//user is "finished typing," do something

  $scope.doneTyping = function(){
    $scope.locationLoading=true;
    var address = $scope.job.location;
    if(address.length!=0){
      var request = {
      'address': address + ' '+Utilities.getCurrentCountry().name
      };
      var geocoder = new google.maps.Geocoder();
      geocoder.geocode(request, function(results) {
        if(results){
          if (results.length!=0) {
            console.log(results);
            $scope.job.locationLat = results[0].geometry.location.lat();
            $scope.job.locationLon = results[0].geometry.location.lng();
            $scope.job.geoHash = geohash.encode($scope.job.locationLat,$scope.job.locationLon);
            setTimeout(function(){//here!
                getPositionAndShowOnMap();
            }, 1000);
          }
        }
      })
    }
  }

  function getPositionAndShowOnMap(){
    $scope.initMap = function() {
      var myLatlng = new google.maps.LatLng($scope.job.locationLat,$scope.job.locationLon);
      console.log('entered map');
      var myOptions = {
        zoom: 16,
        center: myLatlng,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true
      };
      $scope.map = new google.maps.Map(document.getElementById("map6"), myOptions);

      var marker = new google.maps.Marker({
        draggable: true,
        position: myLatlng,
        map: $scope.map,
        title: "Your location"
      });
      google.maps.event.trigger( $scope.map, 'resize' );
      $scope.locationLoading=false;
    };
    $scope.initMap();
  }

  $scope.$watch('job.writeup', function(newValue, oldValue) {
    if(newValue){
        if(newValue.length>20){
          $scope.resizeScroll();
          if(mapLoaded == false){
            setTimeout(function(){//here!
                getPositionAndShowOnMap();
            }, 2000);
          }
          mapLoaded = true;
        }else{
          mapLoaded = false;
        }
    }
  });

  $scope.resizeScroll = function(){
    var scrollresizeTimeout = $timeout(function() {
      $ionicScrollDelegate.resize();
    }, 250); // delay 250 ms
  }

  $scope.getSkillPic = function(skillName) {
    if(skillName!=null){
      return Skills.getByName(skillName).pic;
    }
  }

  $scope.toggleGroup = function(group) {
    if ($scope.isGroupShown(group)) {
      $scope.shownGroup = null;
    } else {
      $scope.shownGroup = group;
    }
  };
  $scope.isGroupShown = function(group) {
    return $scope.shownGroup === group;
  };

  $scope.updateRequest = function(request){
    console.log(request);
    var requestRef = fbCountry.child("requests/"+$stateParams.requestId);

      if (request.requestNature == 'Class'){
        var requestDetails = {
          "price": request.price,
          "location": request.location,
          "task": {
            "writeup": request.writeup
          },
          "meta": {
            "role": request.role,
            "requestNature": request.requestNature,
            "tuitionType": request.tuitionType,
            "tuitionGender": request.tuitionGender
          },
          "categories": request.category,
          "duration": request.duration,
          "frequency": request.frequency,
          "frequencyType": request.frequencyType
        };
      }else if(request.requestNature == 'Homework'){
        var requestDetails = {
          "location": request.location,
          "task": {
            "pic": request.pic,
            "writeup": request.writeup
          },
          "meta": {
            "role": request.role,
            "requestNature": request.requestNature,
            "tuitionType": request.tuitionType,
            "tuitionGender": request.tuitionGender
          },
          "categories": request.category,
        };
      }

    var editedJob = requestRef.update(requestDetails);
    $ionicHistory.goBack();
  }

  $scope.showMediaSelector = function(labelIndex) {

  // Show the action sheet
    var hideSheet = $ionicActionSheet.show({
    buttons: [{'text':"Take Photo"},{'text':"Choose Photo"}],
    cancelText: 'Cancel',
    cancel: function() {
      // prompt user for other name
    },
    buttonClicked: function(index) {
      //$scope.newSkill.level = levels[index];
      console.log(index);
      if(index==1){
        $scope.uploadImage();
      }else if(index==0){
        $scope.takePicture();
      }

        return true;
      }
    });
  };

  $scope.takePicture = function() {
        var options = {
            quality : 75,
            destinationType : Camera.DestinationType.DATA_URL,
            sourceType : Camera.PictureSourceType.CAMERA,
            allowEdit : true,
            encodingType: Camera.EncodingType.JPEG,
            targetWidth: 300,
            targetHeight: 300,
            popoverOptions: CameraPopoverOptions,
            saveToPhotoAlbum: false,
            correctOrientation: false
        };

      $cordovaCamera.getPicture(options).then(function(pictureData) {
         var imagedata = 'data:image/jpeg;base64,' + pictureData;
      var blob = Utilities.dataURItoBlob(imagedata);

      var imageTokenRef = fb.child("imagetokens/"+$scope.authData.uid);
      var imageToken = "";

      imageTokenRef.once("value", function(snapshot) {
        imageToken = snapshot.val();
        //console.log("Retrieved image token "+imageToken.token);
        var existingToken = (snapshot.val() !== null);
        console.log("Token exists? "+existingToken);

        $scope.job.pic = "img/gif/loading_shaking.gif";

        if(!existingToken){
          ImageToken.setToken($scope.authData.uid).then(function(data){
            imageToken = data;

            //2 Get Presigned URL
            ImageToken.postImage($scope.authData.uid,imageToken,blob).then(function(url){
              //var url = data;
              console.log("URL obtained is "+url);
              $scope.job.pic = url;
              console.log("Uploaded job picture");
            });

          });
        } else {

          //2 Get Presigned URL  //3 Post to S3 is taken care inside
          ImageToken.postImage($scope.authData.uid,imageToken.token,blob).then(function(url){
            //var url = data["file-url"];
            console.log("URL obtained is "+url);

            $scope.job.pic = url;
            //UserSkills.updateFace($scope.authData.uid, $scope.user.face);
            console.log("Uploaded job picture");
          });

        }

      });

    })
  }

  $scope.uploadImage = function() {
    imageUploader.getPicture()
    .then(function(pictureData) {

      //1 Token Retrieval or Creation
      var imagedata = 'data:image/jpeg;base64,' + pictureData;
      var blob = Utilities.dataURItoBlob(imagedata);

      var imageTokenRef = fb.child("imagetokens/"+$scope.authData.uid);
      var imageToken = "";

      imageTokenRef.once("value", function(snapshot) {
        imageToken = snapshot.val();
        //console.log("Retrieved image token "+imageToken.token);
        var existingToken = (snapshot.val() !== null);
        console.log("Token exists? "+existingToken);

        $scope.job.pic = "img/gif/loading_shaking.gif";

        if(!existingToken){
          ImageToken.setToken($scope.authData.uid).then(function(data){
            imageToken = data;

            //2 Get Presigned URL
            ImageToken.postImage($scope.authData.uid,imageToken,blob).then(function(url){
              //var url = data;
              console.log("URL obtained is "+url);
              $scope.job.pic = url;
              console.log("Uploaded job picture");
            });

          });
        } else {

          //2 Get Presigned URL  //3 Post to S3 is taken care inside
          ImageToken.postImage($scope.authData.uid,imageToken.token,blob).then(function(url){
            //var url = data["file-url"];
            console.log("URL obtained is "+url);

            $scope.job.pic = url;
            //UserSkills.updateFace($scope.authData.uid, $scope.user.face);
            console.log("Uploaded job picture");
          });

        }

      });

    })
  }

  $scope.addJob = function(job, price, writeup, location, pic, choice, category, duration, frequency, frequencyType, requestNature){

    $ionicLoading.show({
      template: '<ion-spinner icon="spiral"></ion-spinner>'
    })

    if(typeof job.tuitionType == 'undefined'){
      job.tuitionType = false;
    }

    if(typeof job.tuitionGender == 'undefined'){
      job.tuitionGender = false;
    }


    if(typeof category == 'undefined'){
      navigator.notification.alert(
        'You need to pick a subject',  // message
        null,  // callback
        'Missing Subject', // title
        'OK'   // buttonName
      );
    } else{

      console.log('Making Request');
      var jobRef = fbCountry.child("requests");

      if (requestNature == 'Class'){
        var jobDetails = {
          "anonymous": false,
          "likes": {},
          "likesCount": 0,
          "price": price,
          "location": location,
          "requester": {
            "face": $scope.user.face,
            "id": $scope.authData.uid,
            "name": $scope.user.name
          },
          "task": {
            "writeup": writeup,
            "pic": pic
          },
          "meta": {
            "role": job.role,
            "requestNature": job.requestNature,
            "tuitionType": job.tuitionType,
            "tuitionGender": job.tuitionGender
          },
          "time": Firebase.ServerValue.TIMESTAMP,
          "categories": category,
          "choice" : choice,
          "duration": duration,
          "frequency": frequency,
          "frequencyType": frequencyType,
          "l": {
            "0":$scope.job.locationLat,
            "1":$scope.job.locationLon
          },
          "g": $scope.job.geoHash
        };
      }else if(requestNature == 'Homework'){
        var jobDetails = {
          "anonymous": false,
          "likes": {},
          "likesCount": 0,
          "location": location,
          "requester": {
            "face": $scope.user.face,
            "id": $scope.authData.uid,
            "name": $scope.user.name
          },
          "task": {
            "writeup": writeup,
            "pic": pic
          },
          "meta": {
            "role": job.role,
            "requestNature": job.requestNature,
            "tuitionType": job.tuitionType,
            "tuitionGender": job.tuitionGender
          },
          "time": Firebase.ServerValue.TIMESTAMP,
          "categories": category,
          "choice" : choice,
          "l": {
            "0":$scope.job.locationLat,
            "1":$scope.job.locationLon
          },
          "g": $scope.job.geoHash
        };
      }
      var newJob = jobRef.push(jobDetails);

      //need to keep a reference in the user object as well
      var newJobId = newJob.key();
      var userJobRef = fb.child("users/"+$scope.authData.uid+"/gigs/"+newJobId);
      userJobRef.set({"active": true});

      //geofire
      $scope.searchradius = 15;
      $scope.geofireload = [];
      var activeDuration = 10368000000;
      var geofirelistener;
      var geofirefinisher;


      var skillRef = fbCountry.child("userskills/"+category+"/general");
      var $geo = $geofire(skillRef);
      var query = $geo.$query({
        center: [$scope.job.locationLat, $scope.job.locationLon],
        radius: $scope.searchradius
      });

      var geoQueryCallback = query.on("key_entered", category);
      var geoQueryCallback2 = query.on("ready", category+"finished");

      if(!$scope.$$listeners.hasOwnProperty(category)){
        geofirelistener = $scope.$on(category, function (event, key, location, distance) {
        // Do something interesting with object
          skillRef.child(key).on("value", function(snapshot) {
            var tempHolder = snapshot.val();
            tempHolder.distance = distance*1000;
            tempHolder.key = key;
            var currentTime = (new Date()).getTime();
            var expiryTime = currentTime - activeDuration;
            console.log("Current time "+moment(currentTime).format("Do MMMM YYYY")+" whereas Expiry "+moment(expiryTime).format("Do MMMM YYYY"));
            if((tempHolder.hasOwnProperty('location'))&&(tempHolder.location.time > expiryTime)&&(tempHolder.location.hasOwnProperty('time'))){
              $scope.geofireload.push(tempHolder);
            }
          });
        });
        geofirefinisher = $scope.$on(category+"finished", function () {
          console.log("GeoQuery halted");
          geoQueryCallback.cancel();
          geoQueryCallback2.cancel();
          $scope.results = $scope.geofireload;
          for(var count=0; count<$scope.geofireload.length;count++){
            for(var count2=count+1; count2<$scope.geofireload.length;count2++){
              if($scope.geofireload[count].distance>$scope.geofireload[count2].distance){
                var temp = $scope.geofireload[count];
                $scope.geofireload[count] = $scope.geofireload[count2];
                $scope.geofireload[count2] = temp;
              }
            }
          }
          $scope.results = $scope.geofireload;
          if($scope.results.length>10){
            $scope.results.splice(10 , $scope.results.length-10);
          }
          console.log($scope.results);
          console.log("Number of tutors within location after active filter: " +$scope.results.length);


          if($scope.results!=null){
            console.log("Can potentially speak to "+JSON.stringify($scope.results));

            for(coach in $scope.results){
              if($scope.results[coach].key != $scope.authData.uid){
                Push.getToken($scope.results[coach].key).then(function(destinationToken){
                  var notification = "New "+category+" Request by "+$scope.user.name+": "+jobDetails.task.writeup;
                  console.log("Destination found", destinationToken);
                  Push.sendNotification(destinationToken, notification);
                });
              }
            }

            $ionicLoading.hide();
            geoQueryCallback.cancel();
            geoQueryCallback2.cancel();
            $ionicHistory.goBack();
          } else {
            geoQueryCallback.cancel();
            geoQueryCallback2.cancel();
            $ionicLoading.hide();
            $ionicHistory.goBack()
          }
        });
      }
    }
  }
})

.controller('AccountAddSkillCtrl', function($rootScope, $scope, $rootScope, $timeout, $firebaseArray, $firebaseObject, $ionicScrollDelegate, $ionicHistory, $ionicLoading, $state, Push, Auth, Utilities, $ionicModal, Categories, $ionicActionSheet, Skills, UserSkills, geohash) {

  $scope.authData = fb.getAuth();
  //Utilities.setCountry();
  $scope.defaultCountry = Utilities.getCurrentCountry();
  $scope.categories = Categories.all($scope.defaultCountry.value);
  $scope.newSkill = {};
  $scope.newSkill.rate = 50;
  $scope.showAlert = Utilities.showAlert;
  $scope.userLoading = true;

  var userRef = fb.child("users").child($scope.authData.uid);
    userRef.on("value", function(snapshot) {
      $scope.user = snapshot.val();
      $scope.userLoading = false;
    });

  var $skillrange = $(".js-range-slider4");

    $skillrange.ionRangeSlider({
      type: "single",
      min: 20,
      max: 150,
      from: $scope.newSkill.rate,
      step: 5,
      prefix: '$',
      onFinish: function (data) {
        saveSkillRate(data);
      }
  });


  var saveSkillRate = function (data) {
      $scope.newSkill.rate = data.from;
      $scope.$apply();
      console.log("New Skill rate " + $scope.newSkill.rate);
  };

  $scope.resizeScroll = function(){
    var scrollresizeTimeout = $timeout(function() {
      $ionicScrollDelegate.resize();
    }, 250); // delay 250 ms
  }

  $scope.toggleGroup = function(group) {
      if ($scope.isGroupShown(group)) {
        $scope.shownGroup = null;
      } else {
        $scope.shownGroup = group;
        $scope.resizeScroll();
      }
  };
  $scope.isGroupShown = function(group) {
    return $scope.shownGroup === group;
  };
  //Prompt for Levels when selecting a skill
  $scope.showLevelSelector = function(subject, levels, allowCustomSubject) {
    console.log(levels);
    var levelArray = [];
    for(var i=0;i<levels.length;i++){
      levelArray.push({'text':levels[i]});
    }

    if(allowCustomSubject){
      // Show the action sheet
      var hideSheet = $ionicActionSheet.show({
        buttons: levelArray,
        destructiveText: 'Enter My Own',
        titleText: 'Choose Subject Level for '+subject,
        cancelText: 'Cancel',
        cancel: function() {
          // prompt user for other name
          $scope.newSkill.level = 'General';
          $scope.showAlert('No Level Specified','You did not specify a level. Less users will be able to find you.');
        },
        buttonClicked: function(index) {
          $scope.newSkill.level = levels[index];
          console.log("Selected "+$scope.newSkill.level);
          $scope.resizeScroll();
          return true;
        },
        destructiveButtonClicked: function(){
          console.log("Acquiring new level");
          $scope.enterCustomLevel(subject);
          $scope.resizeScroll();
          return true;
        }
      });
    } else {
      // Show the action sheet
      var hideSheet = $ionicActionSheet.show({
        buttons: levelArray,
        titleText: 'Choose Subject Level for '+subject,
        cancelText: 'Cancel',
        cancel: function() {
          // prompt user for other name
          $scope.newSkill.level = 'General';
          $scope.showAlert('No Level Selected','You did not select a level. Less users will be able to find you.');
        },
        buttonClicked: function(index) {
          $scope.newSkill.level = levels[index];
          console.log("Selected "+$scope.newSkill.level);

          return true;
        }
      });
    }
  };

  $scope.getSkillPic = function(skillName) {
    if(skillName!=null){
      return Skills.getByName(skillName).pic;
    }
  }

  //rewrite the undefined with ECMA2015 safe code
    $scope.addSkill = function(skillName, rate, level, trial) {

      level = level || 'General';

      if(level == ''){
        level = 'General';
      }

      if(typeof skillName === 'undefined'){
        $scope.showAlert('Missing Detail','Please select a skill to teach');
      } else if((typeof rate === 'undefined')||(rate<10)){
        $scope.showAlert('Lesson Rate','Please enter minimum rate of $10');
      } else if(UserSkills.fbUserHasThisSkill($scope.user,skillName)&&(level==false)){
        //do nothing
        console.log("Error in adding skill");
        $scope.showAlert('Existing Skill','Please edit the rate from your account');
      } else {

        //adding skill to the user model
        if(typeof $scope.user.skills === 'undefined'){
          $scope.user.skills = {};
        }

        if(typeof $scope.user.skills[skillName] === 'undefined'){
          $scope.user.skills[skillName] = {};
        }

        //some subjects may not have a level
        if(typeof level == 'undefined') {
          $scope.user.skills[skillName] = {'General': rate};

        } else {
          // for user with existing skills
          $scope.user.skills[skillName][level] = rate;
        }

        $scope.user.skills[skillName]['trial'] = trial || false;

        //add a new coach to the public skills model
        //2 sets of data are created
        //1st set in the general summary
        //2nd set in the specific level (if any is specified)

        var coachLocation = {};
        //these are for geofire
        var geoHash = {};
        var geofireLocation = {};
        var userIsVerified = {};

        if(typeof $scope.user.location !== 'undefined'){
          coachLocation = {
            'lat': $scope.user.location.lat,
            'lon': $scope.user.location.lon,
            'time': $scope.user.location.time,
            'name': $scope.user.location.name
          };
          geoFireLocation = {
            '0': $scope.user.location.lat,
            '1': $scope.user.location.lon
          };

          geoHash = geohash.encode($scope.user.location.lat,$scope.user.location.lon);
        }

        if(typeof $scope.user.verify !== 'undefined'){
          if($scope.user.verify.complete ==true){
            userIsVerified = true;
          }
        }

        var averageRate = 0;
        var sumOfRates = 0;
        var counter = 0;

        //SUM ALL THE RATES IN THE LEVELS
        for(var k in $scope.user.skills[skillName]) {
          if($scope.user.skills[skillName].hasOwnProperty(k)&&k!='trial'){
            sumOfRates += $scope.user.skills[skillName][k];
            counter++;
          }

        }
        //DERIVE THE AVERAGE RATE
        if(counter>0){
          sumOfRates+= rate;
          averageRate = sumOfRates / (counter+1);
        } else {
          averageRate = rate;
        }

        var rateShownIsAnAverage = (rate!==averageRate)||(counter>0);

               var newSkillCoach = fbCountry.child('userskills').child(skillName).child("general").child($scope.authData.uid);
        newSkillCoach.set({
          'name': $scope.user.name,
          'face': $scope.user.face,
          'rate': averageRate,
          'rating': $scope.user.rating,
          'location': coachLocation,
          'l': geoFireLocation,
          'averaged': rateShownIsAnAverage,
          'trial': $scope.user.skills[skillName]['trial'],
          'g': geoHash,
          'verified' : userIsVerified
        });
        //specifying levels
        if(level) {
          //specify in the general summary that there is a sub level
          newSkillCoach.child("levels").set($scope.user.skills[skillName]);
          newSkillCoach.child("levels/trial").set(null);
          //writing the sub level item
          var newSkillCoachLevel = fbCountry.child('userskills').child(skillName).child(level).child($scope.authData.uid);
          newSkillCoachLevel.set({
            'name': $scope.user.name,
            'rate': rate,
            'face': $scope.user.face,
            'rating': $scope.user.rating,
            'location': coachLocation,
            'l': geoFireLocation,
            'trial': $scope.user.skills[skillName]['trial'],
            'g': geoHash,
            'verified' : userIsVerified
          });
        }

        userRef.child("skills").child(skillName).update($scope.user.skills[skillName]);

        //$scope.user.skills.count++;
        console.log("Added "+level+" "+skillName+" at $"+rate);
        $ionicHistory.goBack();

        return true;
      }

    }

})

.controller('AccountEditBackgroundCtrl', function($scope, $rootScope, $timeout, $firebaseArray, $firebaseObject, $ionicScrollDelegate, $ionicHistory, $ionicLoading, $state, Push, Auth, Utilities, $ionicModal, $ionicActionSheet, Schools) {
  $scope.authData = fb.getAuth();

  var userRef = fb.child("users").child($scope.authData.uid);
    userRef.on("value", function(snapshot) {
      $scope.user = snapshot.val();
  })

  $scope.updateBackground = function(){
    userRef.update({"writeup":$scope.user.writeup});
    $ionicHistory.goBack();
  }
})

.controller('AccountEducationCtrl', function($scope, $rootScope, $timeout, $firebaseArray, $firebaseObject, $ionicScrollDelegate, $ionicHistory, $ionicLoading, $state, Push, Auth, Utilities, $ionicModal, $ionicActionSheet, Schools) {

  $scope.authData = fb.getAuth();
  $scope.educationUpdateHolder = {};
  $scope.userLoading = true;
  $scope.defaultCountry = Utilities.getCurrentCountry();

  var userRef = fb.child("users").child($scope.authData.uid);
    userRef.on("value", function(snapshot) {
      $scope.user = snapshot.val();

      if($scope.user.education) {
        $scope.educationUpdateHolder = $scope.user.education;
      }
      if($scope.user.education.country){
        $scope.schoolCountry = $scope.user.education.country;
      } else {
        $scope.schoolCountry = $scope.defaultCountry.name;
      }
      $scope.userLoading = false;
    });

  $scope.getSchools = function(country) {
    $scope.schoolCountry = country;
    Schools.getSchools(country).then(function(result){
      $scope.schools = result;
      console.log("Retrieved "+country+" from Firebase");
    });
  }

  $scope.resizeScroll = function(){
    var scrollresizeTimeout = $timeout(function() {
      $ionicScrollDelegate.resize();
    }, 250); // delay 250 ms
  }


  $scope.toggleGroup = function(group) {
      if ($scope.isGroupShown(group)) {
        $scope.shownGroup = null;
      } else {
        $scope.shownGroup = group;
        $scope.resizeScroll();
      }
  };
  $scope.isGroupShown = function(group) {
    return $scope.shownGroup === group;
  };

  $scope.verifyEducation = function() {

      var text = "By changing education details, you will lose your verification status and have to be re-verified.";

      function route(buttonIndex) {
        switch(buttonIndex){
          case 1: break; //do nothing
          case 2: $scope.updateEducation(); break;
        }
      }

      //typeof $scope.user.location !== 'undefined'

      if(typeof $scope.user.verify !== 'undefined'){
        //kill verified status
        console.log("Verification status present");

        navigator.notification.confirm(
          text,  // message
          route, // callback to invoke with index of button pressed
          'Edit Education',            // title
          ['Cancel', 'I Agree']          // buttonLabels
        );

      } else {
        console.log("No verified status present");
        $scope.updateEducation();
      }

    }

  $scope.updateEducation = function() {

      //kill verified status if any
      if(typeof $scope.user.verify !== 'undefined') {
        $scope.user.verify = null;
        userRef.update({"verify":null});
      }

      $scope.user.education.sch = $scope.educationUpdateHolder.sch;
      $scope.user.education.major = $scope.educationUpdateHolder.major;

      console.log('Current school is: '+$scope.user.education.sch.shortname);
      $scope.user.education.country = $scope.schoolCountry;
      //$scope.user.education.school = Schools.get($scope.user.education.id);

      if(enableIntercom&&window.cordova){
        intercom.updateUser({
          'custom_attributes': {
            'school': $scope.user.education.sch.shortname,
            'schoolCountry': $scope.user.education.country,
            'schoolEmail': $scope.user.education.email
          }
        });

      }

      userRef.child("education").update({"major":$scope.user.education.major, "sch":$scope.user.education.sch, "country":$scope.user.education.country});
      $ionicHistory.goBack();
      //update FB
      //ionic back

    }

})

.controller('SettingsCtrl', function($scope, $rootScope, $timeout, $firebaseArray, $firebaseObject, $ionicScrollDelegate, $ionicHistory, $ionicLoading, $state, $stateParams, Push, Auth, Utilities, UserSkills, $ionicPopup) {

  $scope.authData = fb.getAuth();

  $scope.user = $firebaseObject(fb.child("users/"+$scope.authData.uid));
  Auth.userRef().$bindTo($scope, "user");

  //call a function from fixed string names
  $scope.callFunction = function (name){
    console.log("Calling "+name);
    if(angular.isFunction($scope[name]))
    $scope[name]();
  }

  $scope.invites = {
    "0": {
      "name": "Facebook",
      "description": "Facebook Invite friends",
      "action": "facebookShare",
      "icon": "img/brands/facebook.png"
    },
    "1": {
      "name": "Whatsapp",
      "description": "WA Share",
      "action": "whatsappShare",
      "icon": "img/brands/whatsapp.png"
    },
    "2": {
      "name": "Contacts",
      "description": "Contact Book",
      "action": "share",
      "icon": "img/brands/contactbook.png"
    }

  };

  $scope.labels = {
    "0": {
      "name": "Reset Username",
      "description": "Deletes current alias",
      "action": "resetAliasConfirmation",
      "icon": "ion-at"
    },
    "1": {
      "name": "Enter Referral Code",
      "description": "Enter Referral Code",
      "action": "referralInput",
      "icon": "ion-cash"
    },
    "2": {
      "name": "Hide My Class Listings",
      "description": "Do not display classes",
      "action": "disableClassListings",
      "icon": "ion-eye-disabled"
    },
    "3": {
      "name": "Contact Us",
      "description": "If you need some help",
      "action": "contactUs",
      "icon": "ion-chatbubbles"
    },
    "4": {
      "name": "Statistics",
      "description": "Some app stats",
      "action": "statistics",
      "icon": "ion-speedometer"
    },
    "5": {
      "name": "Logout",
      "description": "Exit the app",
      "action": "logoutConfirmation",
      //"action": "logoutConfirmation",
      "icon": "ion-power"
    }

  };

  $scope.showAlert = Utilities.showAlert;


  $scope.user.$loaded().then(function(){
    console.log("Displaying Settings for "+$scope.user.alias);

    if(typeof $scope.user.showClassListings != 'undefined'){

      if(typeof $scope.user.verify != 'undefined') {
        if((!$scope.user.showClassListings)&&$scope.user.verify.complete){
          //allow user to disable this
          $scope.labels["2"] = {
            "name": "Show My Class Listings",
            "description": "Display classes",
            "action": "enableClassListings",
            "icon": "ion-eye"
          }
        }

      } else {
        $scope.labels["2"] = {
          "name": "Verify Me",
          "description": "Verify User",
          "action": "verifyUser",
          "icon": "ion-eye"
        }
      }

    }

  });

  $scope.verifyUser = function(){
    $ionicHistory.goBack();
  }

  $scope.enableClassListings = function(){
    $scope.user.showClassListings = true;
    console.log("Class Listings Enabled");
    $ionicLoading.show({
      template: '<ion-spinner icon="spiral"></ion-spinner>'
    });

    $scope.labels["2"] = {
      "name": "Hide My Class Listings",
      "description": "Do not display classes",
      "action": "disableClassListings",
      "icon": "ion-eye-disabled"
    }

    UserSkills.updateTime($scope.authData.uid,Firebase.ServerValue.TIMESTAMP).then(function(){
      $ionicLoading.hide();
    });



  }

  $scope.disableClassListings = function(){
    $scope.user.showClassListings = false;
    console.log("Class Listings Disabled");
    $ionicLoading.show({
      template: '<ion-spinner icon="spiral"></ion-spinner>'
    });

    $scope.labels["2"] = {
      "name": "Show My Class Listings",
      "description": "Display classes",
      "action": "enableClassListings",
      "icon": "ion-eye"
    }
    UserSkills.updateTime($scope.authData.uid,0).then(function(){
      $ionicLoading.hide();
    });

  }

  $scope.referralInput = function(){
    $scope.refItem = {};
    var myPopup = $ionicPopup.show({
      template: '<input type="text" ng-model="refItem.refCode">',
      title: 'Referral Code',
      subTitle: 'Please input referral code (case sensitive)',
      scope: $scope,
      buttons: [
        { text: 'Cancel',
          onTap: function(e) {
            myPopup.close();
          }
        },{
          text: '<b>Save</b>',
          type: 'button-positive',
          onTap: function(e) {
            console.log($scope.refItem.refCode);

            if($scope.user.referralcode == null){

              var checkRef = fb.child("alias/"+$scope.refItem.refCode);
              checkRef.once("value").then(function(snapshot) {

                var refExists = snapshot.child("uid").exists(); // true
                console.log(refExists);

                if(refExists){
                  $scope.referrerid = snapshot.val().uid;
                  console.log($scope.referrerid);
                  $scope.user.referralcode = $scope.referrerid;

                  if(enableIntercom&&window.cordova){
                    intercom.updateUser({ 'referralcode': $scope.referrerid });
                  }

                  var alertPopup = $ionicPopup.alert({
                    title: 'Great Job',
                    template: 'Refer your friends for more credits!'
                  });

                } else {

                  var alertPopup = $ionicPopup.alert({
                    title: 'Referral code does not exist',
                    template: 'Please try another one'
                  });
                  alertPopup.then(function(res) {
                    $scope.referralSurvey();
                  });
                }
              });
            }else{
              var alertPopup = $ionicPopup.alert({
                    title: 'You have already entered a Referral Code',
                    template: 'Referral Invalid'
                  });
            }
          }
        }
      ]
    });
  }


  $scope.statistics = function(){
    //popup some statistical info


    $ionicLoading.show({
      template: '<ion-spinner icon="spiral"></ion-spinner>'
    });


    //user count
    Utilities.getAliasCount().then(function(count){
      $scope.numTutors = count;
      console.log("Got tutors "+$scope.numTutors);
      Utilities.getChatCount().then(function(chats){
        $scope.numChats = chats;
        console.log("Got chats "+$scope.numChats);

        var text = $scope.numTutors+" users & "+$scope.numChats+" classes requested";

        $ionicLoading.hide();

        $scope.showAlert("Statistics",text);


      });

    });

  }

  $scope.facebookInvite = function(){

    console.log("Going to Facebook invite");
    var fbOptions={
      url: "https://fb.me/1035078313267648",// App link that you got from facebook
      picture:"https://scontent-sit4-1.xx.fbcdn.net/t31.0-8/14753451_1333067696704327_8882158960728181821_o.png" // Link to any image on the web
    };
    facebookConnectPlugin.appInvite(fbOptions,
      function(obj){
        if(obj) {
          if(obj.completionGesture == "cancel") {
            // user canceled, bad guy
          } else {
            // user really invited someone :)
          }
        } else {
          // user just pressed done, bad guy
        }
      },
      function(error){
        console.log("failure");
        console.log(error);
      }
    );


  }

  $scope.whatsappShare = function(){
    var refCode = $scope.user.alias;
    window.open('whatsapp://send?text=Hey, check out the Learnly app! Simplest way for tutors and students to connect with each other. Download now at http%3A%2F%2Fhyperurl.co/learnlyapp Use my referral code : '+refCode +' to get started!', '_system');
    return false;

  }

  $scope.facebookShare = function(){
    var refCode = $scope.user.alias;
    window.open('fb-messenger://share?link=Hey, check out the Learnly app! Simplest way for tutors and students to connect with each other. Download now at http%3A%2F%2Fhyperurl.co/learnlyapp Use my referral code : '+refCode +' to get started!', '_system');
    return false;

  }

  $scope.resetAlias = function(){


    var aliasRef = fb.child("alias").child($scope.user.alias);
    aliasRef.set(null);
    //wipe the alias in user object
    $scope.user.alias = null;
    console.log("Wiping alias complete");

    $state.go('tab.dash');
    //$scope.logout();
  }

  $scope.resetAliasConfirmation = function(){

    var text = "You will be asked to choose a new Username during next login";

    function route(buttonIndex) {
      switch(buttonIndex){
        case 1: break; //do nothing
        case 2: $scope.resetAlias(); break;
      }
    }

    navigator.notification.confirm(
      text,  // message
      route,              // callback to invoke with index of button pressed
      'Reset Username',            // title
      'Cancel, Reset'          // buttonLabels
    );
  }


  $scope.share = function(){
    var refCode = $scope.user.alias;
    window.plugins.socialsharing.share(
      'Hey, check out the Learnly app! Simplest way for tutors and students to connect with each other. Use my referral code : '+refCode +' to get started!',
      'Use Learnly to Find Tutors or Teach Lessons',
      "https://learnly.sg/pics/learnly-logo.png",
      'http://hyperurl.co/learnlyapp'
    );
  }

  $scope.contactUs = function () {
    if(enableIntercom&&window.cordova){
      intercom.displayMessageComposer();
    }
  };

  $scope.logoutConfirmation = function(){

    var text = "Are you sure you want to logout?";

    function route(buttonIndex) {
      switch(buttonIndex){
        case 1: break; //do nothing
        case 2: $scope.logout(); break;
      }
    }

    navigator.notification.confirm(
      text,  // message
      route,              // callback to invoke with index of button pressed
      'Account Logout',            // title
      'Cancel, Logout'          // buttonLabels
    );
  }


  $scope.logout = function() {
    $ionicLoading.show({template:'<p>Logging out</p><ion-spinner icon="spiral"></ion-spinner>'});
    console.log("Logging out "+$scope.authData.uid);


    //Delete the pushtoken
    if($scope.authData.provider!='anonymous'){
      Push.removeToken($scope.authData.uid).then(function(message){
        console.log(message);
      });
    }

    if(enableIntercom&&window.cordova){
      intercom.reset();
    }


    Auth.logout();
    $scope.authData = Auth.getAuth(); //this should be null

      $ionicLoading.hide();
      $ionicHistory.nextViewOptions({
        disableBack: true
      });
      $state.go('intro');
      $timeout(function () {
      $ionicHistory.clearCache();
      $ionicHistory.clearHistory();
    }, 1500)
  }

});
