angular.module('learnly.services', [])


//Firebase authentication using Facebook Login
//App user is logged in from AccountCtrl in controllers.js
.factory('Auth', function($firebaseAuth, $firebaseObject) {
    //fb is referenced from app.js first line

    return {
      //this is for initial user login
      login: function(){
        return $firebaseAuth(fb);
      },
      logout: function(){
        if(enableIntercom){
          intercom.reset();
        }


        return fb.unauth();
      },
      //this is for use within controllers
      //to check if user is authenticated and pass the user details around
      getAuth: function(){
        return fb.getAuth();
      },
      root: function(){
        return fb;
      },
      userRef: function(){
        console.log("Local user binded to firebase user "+fb.getAuth().uid);
        console.log("Auth provider "+fb.getAuth().provider);
        return $firebaseObject(fb.child("users/"+fb.getAuth().uid));
      },
      //this is also not working
      checkIfExistingUser: function(){
          var uid = fb.getAuth().uid;
          fb.child("users/"+uid).once("value", function(snapshot){
            console.log("Run user existence check");
            var userExists = (snapshot.val() !== null);
            //var uid = fb.getAuth().uid;
            return userExists;
        //returns true if existing user, false otherwise
          });
          console.log("Failed to check whether user exists");
      }

    };
})

.factory('localstorage', ['$window', '$localStorage','$q', function ($window, $localStorage,$q) {
    return {
        set: function (key, value) {
            $window.localStorage.setItem(key, value);
        },
        get: function (key, defaultValue) {
            return $window.localStorage.getItem(key) || defaultValue;
        },
        setObject: function (key, value) {
            $window.localStorage.setItem(key, JSON.stringify(value));
        },
        getObject: function (key) {
            return JSON.parse($window.localStorage.getItem(key) || '{}');
        },
        clear: function () {
            $window.localStorage.clear();
        }
    }

}])


.factory('Carousel', function(Utilities,$firebaseArray) {

  function getArray(topic) {

    //Utilities.setCountry();
    //console.log("carousel "+fbCountry);

      var topics = $firebaseArray(fbCountry.child("carousel/"+topic));
      topics.$loaded().then(function(){
        //console.log("Retrieved "+topics.length+" carousel items for "+topic);
        if(topics.length == 0){
          //console.log("NULL RETURN");
          return null;
        }

        //console.log("carousel "+JSON.stringify(topics))
        return topics;
      });
      return topics;
  }

  return {
    getArray: getArray
  };
})

.factory('Chats', function($q, $firebaseArray, UserSkills, Push) {
  function getSimpleChatsFor(userid) {
      //var userChatRef = fb.child("users/"+userid+"/chats");
      var userChatRef = fb.child("chatpreviews/"+userid);
      var deferred = $q.defer();

      userChatRef.on("value", function(snapshot) {
              var chatResults = snapshot.val();
              console.log("Retrieved "+snapshot.numChildren()+" chat threads");
              console.log("Retrieved objects "+JSON.stringify(chatResults));
              deferred.resolve(chatResults);

      });
      return deferred.promise;
  }
  //retrieves the last chat message object of a chatroom
  //chat message object contains 'text', 'time', 'sender'
  function getLastText(chatid){
      var chatLastTextRef = fb.child("chats/"+chatid);
      var deferred = $q.defer();
      console.log("Retrieving chatid "+chatid);
      chatLastTextRef.limitToLast(1).on("value", function(snapshot){
        var lastChat = snapshot.val();
        console.log("Retrieved objects "+JSON.stringify(lastChat)+" during "+chatid);
        //$scope.storeLastText(lastChat[Object.keys(lastChat)[0]].text);
        deferred.resolve(lastChat[Object.keys(lastChat)[0]]);
        //.text is the message
        //.time is the time
      })
      return deferred.promise;
  }

  //gets chats with the last text applied
  function getAllChatsFor(userid){
    var deferred = $q.defer();
    getSimpleChatsFor(userid)
      .then(function(chatResults){

        function storeLastText(lastText){
          for(var k in chatResults) {
              if(chatResults.hasOwnProperty(k)){
                  if(typeof chatResults[k].lastText === 'undefined'){
                      chatResults[k].lastText = lastText;
                      return true;
                  }
              }
          }
        }

        for(var k in chatResults) {
          console.log("Loop "+k+" is running");
          if(chatResults.hasOwnProperty(k)){
              getLastText(k).then(function(lastTextResult){
                  console.log("Storing during "+k);
                  storeLastText(lastTextResult);
                  //chatResults[k].lastText = lastTextResult;
              });
          }

        }

        if(chatResults===null){
          deferred.resolve(chatResults);
        }

        //key will be lost after converting to array
        //store the key as a property
        for(var k in chatResults) {
          if(chatResults.hasOwnProperty(k)){
              chatResults[k].key = k;
          }
        }

        //convert objects to an array and return the result
        chatResults = Object.keys(chatResults).map(function(k) { return chatResults[k] });
        deferred.resolve(chatResults);

    });

    return deferred.promise;
  }
/*
  //retrieves the chatid with all messages
  function viewChat(chatid) {
      var chatThread = $firebaseArray(fb.child("chats/"+chatid));
      chatThread.$loaded().then(function(){
        console.log("Retrieved "+chatThread.length+" skill items from Firebase");
        return chatThread;
      });
      return chatThread;
  }
*/

  //order refers to a related order ID
  //can be for coach booking or gig
  function startChat(senderid, receiverid, faces, names, message, order, orderType, pic){
    //MISSING ITEMS
    //sender Face and Name

    var deferred = $q.defer();
    var receiver = {};

    if(pic == undefined){
      pic = null;
    }
/*
    var orderTypeName = {};
    switch(orderType){
      case 1:
        orderTypeName = "gigs"; break;
      case 2:
        orderTypeName = "private"; break;
      case 3:
        orderTypeName = "group"; break;
      default:
        orderTypeName = "others"; break;
    }
*/
    console.log("starting Chat");
    var newChatRef = fb.child("chats");

    var newChat = newChatRef.push({
          'time': Firebase.ServerValue.TIMESTAMP
        }, function(){
          console.log("Forming new chat enquiry");
          //retrieve key of the chat item and add to user own preview
          var chatId = newChat.key();

          //clear the root of the child chat
          var pushChild = fb.child("chats").child(chatId);
          pushChild.set(null);
          console.log("test");
          //create new child within the child
          var newChatRefChild = fb.child("chats").child(chatId).child(chatId);
          newChatRefChild.set({
            'sender': senderid,
            'text': message,
            'time': Firebase.ServerValue.TIMESTAMP,
            'orderId': false,
            'orderType': false,
            'pic': pic
            }
          );

          //write a new chat preview to the senders own chat log
          var chatPreview1 = fb.child("chatpreviews").child(senderid).child(chatId);
          //var chatPreview1 = fb.child("users").child(senderid).child("chats").child(chatId);
          chatPreview1.set({

            'active': true,
            //'lastText': m,
            'receiver': {
              'face': faces.receiver,
              'name': names.receiver,
              'uid': receiverid
            },
            'orderId': false
          }, function(){
            console.log("Created chat preview for Sender");
          });

          //write a new chat preview to the receivers own chat log
          var chatPreview2 = fb.child("chatpreviews").child(receiverid).child(chatId);
          //var chatPreview2 = fb.child("users").child(receiverid).child("chats").child(chatId);
          chatPreview2.set({

            'active': true,
            //'lastText': m,
            'receiver': {
              'face': faces.sender,
              'name': names.sender,
              'uid': senderid
            },
            'orderId': false
          }, function(){
            console.log("Created chat preview for Receiver");
          });

          if(orderType!=4){
            console.log("order Type is not 4")
            newChatRefChild.update({'orderId': order, 'orderType': orderType});
            chatPreview1.update({'orderId': order,'orderType': orderType});
            chatPreview2.update({'orderId': order, 'orderType': orderType});
          }else{
             newChatRefChild.update({'workshop': order, 'orderType': orderType});
            chatPreview1.update({'workshop': order,'orderType': orderType});
            chatPreview2.update({'workshop': order, 'orderType': orderType});
          }

          //Send Push Notification
          //We can use the orderType switch above
          Push.getToken(receiverid).then(function(destinationToken){
            var notification = names.sender+" has sent you a new chat";

                switch(orderType){
                  case 1:
                    notification = names.sender+" wants to answer your Ask"; break;
                  case 2:
                    notification = names.sender+" is requesting a Private Class"; break;
                  case 3:
                    notification = names.sender+" is requesting a Group Class"; break;
                  case 4:
                    notification = names.sender + " is interested in your Workshop"; break;
                  default:
                    //do nothing
                    break;
                }

            console.log("Destination found", destinationToken);
            Push.sendNotification(destinationToken, notification, chatId);
          });


          deferred.resolve();
      });

    return deferred.promise;
  }


  return {
    //retrieve all the user model's known active chats
    getSimpleChatsFor: getSimpleChatsFor,
    //retrieves the last text of a chat
    getLastText: getLastText,
    //retrieve all chats with the last text added
    getAllChatsFor: getAllChatsFor,
    //views the chat messages in a chatid
    //viewChat: viewChat,
    //starts a chat between 2 parties
    startChat : startChat
  };
})

.factory('Requests', function($q, Utilities) {

  function getSimpleRequest(requestId) {
    var deferred = $q.defer();
    console.log(requestId);
    var requestRef = fb.child("requests").child(requestId);
    requestRef.once("value", function(snapshot){
      var request = snapshot.val();
      request.key = requestId;
      deferred.resolve(request);
    })
    return deferred.promise;
  }
  return {
    getSimpleRequest: getSimpleRequest
  };
})

.factory('Jobs', function($q, Utilities) {
  // Might use a resource here that returns a JSON array
  function getSimpleJobs() {
    var deferred = $q.defer();
    var jobsRef = fbCountry.child("jobs");
    jobsRef.limitToLast(20).on("value", function(snapshot){
      var allJobs = snapshot.val();
      console.log("Retrieved objects "+JSON.stringify(allJobs));
      allJobs = Utilities.convertToArrayWithKey(allJobs);
      deferred.resolve(allJobs);
    });

    return deferred.promise;
  }

  return {
    getSimpleJobs : getSimpleJobs,
    add: function(job){
      jobs.push(job);
    },
    remove: function(job) {
      jobs.splice(jobs.indexOf(job), 1);
    },
    get: function(jobId) {
      for(var i = 0; i < jobs.length; i++) {
        if (jobs[i].id === parseInt(jobId)) {
          return jobs[i];
        }
      }
      return null;
    }
  };
})

//Record details of class requests between student and coach
.factory('Orders', function($firebaseArray, $q) {

  //Open Transaction
  //Gigs - requesterid is the one who posted the gig
  //Classes- requestedid is the one who messages the coach

  function openTransaction(providerid, requesterid, orderType, orderDetails){
    //orderType - private class, gig, group class
    //orderDetails - description, rates, gig id (if any)
    var orderTypeName = {};
    switch(orderType){
      case 1:
        orderTypeName = "gigs"; break;
      case 2:
        orderTypeName = "private"; break;
      case 3:
        orderTypeName = "group"; break;
      default:
        orderTypeName = "others"; break;
    }

    var deferred = $q.defer();
    var newOrderRef = fb.child("orders/"+orderTypeName+"/open");


    var newOrder = newOrderRef.push({
          'time': Firebase.ServerValue.TIMESTAMP,
          'providerid': providerid,
          'requesterid': requesterid,
          'orderDetails': orderDetails,
          'foundTutor': false
        }, function(){
          
          if(orderTypeName == "private"){
            var lessonsRef = fb.child("lessons").child(providerid);
            lessonsRef.push({
              'orderId': newOrder.key(),
              'time': Firebase.ServerValue.TIMESTAMP,
              'providerid': providerid,
              'requesterid': requesterid,
              'orderDetails': orderDetails,
              'searchKey': orderDetails.lessonName + " " + orderDetails.level,
              'foundTutor': false
            })
          }

          var intercomOrderDetails = orderTypeName;
          var intercomOrderRate = orderTypeName;
          if(orderTypeName=="private"){
            intercomOrderDetails = orderDetails.lessonName;
            intercomOrderRate = orderDetails.rate;
          } else if(orderTypeName=="gigs"){
            intercomOrderDetails = orderDetails.gigDesc;
            intercomOrderRate = orderDetails.gigRate;
          }

          intercom.logEvent("ordered_item", {
              'order_date': new Date().getTime(),
              'order_number': newOrder.key(),
              'providerid': providerid,
              'requesterid': requesterid,
              'order_details': intercomOrderDetails,
              'order_rate': intercomOrderRate
          });

          deferred.resolve(newOrder.key());
      });

    return deferred.promise;
  }

  function getOrderTypeName(orderType){
    var orderTypeName = "Others"
    switch(orderType){
      case 1:
        orderTypeName = "Gig Request"; break;
      case 2:
        orderTypeName = "Private Class"; break;
      case 3:
        orderTypeName = "Group Class"; break;
      case "gigs":
        orderTypeName = "Gig Request"; break;
      case "private":
        orderTypeName = "Private Class"; break;
      case "group":
        orderTypeName = "Group Class"; break;
      default:
        orderTypeName = "Others"; break;
    }

    return orderTypeName;
  }


  //Close Transaction



  return {
    openTransaction : openTransaction,
    getOrderTypeName: getOrderTypeName
  };
})

//Record reviews left by users for each other
.factory('Reviews', function($q) {


  function setReview(userid, orderid, review) {

      var ReviewRef = fb.child("reviews").child(userid).child(orderid);
      review.time = Firebase.ServerValue.TIMESTAMP;
      ReviewRef.set(review);
      console.log("Firebase accepts review");
  }

  //get all reviews pertaining to a user
  function getReview(userid) {
      var deferred = $q.defer();
      var ReviewRef = fb.child("reviews").child(userid);
      ReviewRef.on("value", function(snapshot) {
              var result  = snapshot.val();
              console.log("Retrieved objects "+JSON.stringify(result));
              deferred.resolve(result);

      });
      return deferred.promise;
  }

  //get specific review of user pertaining to an order
  function getOrderReview(userid, orderid) {
      var deferred = $q.defer();
      var ReviewRef = fb.child("reviews").child(userid).child(orderid);
      ReviewRef.on("value", function(snapshot) {
              var result  = snapshot.val();
              console.log("Retrieved objects "+JSON.stringify(result));
              deferred.resolve(result);

      });
      return deferred.promise;
  }

  return {

    setReview: setReview,
    getReview: getReview,
    getOrderReview: getOrderReview
  };
})

//Report any kind of feedback, bugs, or feature request from users
.factory('UserAction', function($firebaseArray, $q, $ionicActionSheet, $timeout) {

  function addFeedback(reporterid, offenderid, feedbackType, exhibit, text){

    var feedbackTypeName = {};
    switch(feedbackType){
      case 1:
        feedbackTypeName = "gigs"; break;
      case 2:
        feedbackTypeName = "profile"; break;
      case 3:
        feedbackTypeName = "bugs"; break;
      default:
        feedbackTypeName = "others"; break;
    }

    var deferred = $q.defer();
    var newFeedbackRef = fb.child("feedback/"+feedbackTypeName+"/"+offenderid);

    var newFeedback = newFeedbackRef.push({
          'time': Firebase.ServerValue.TIMESTAMP,
          'reporterid': reporterid,
          'exhibit': exhibit,
          'text': text
        }, function(){
          console.log("Forming new abuse report regarding", offenderid);
          deferred.resolve(newFeedback.key());
      });

    return deferred.promise;
  }

  function shareWithFriend(uid,name,alias,face) {

    //we may wish to generate a deeplink using the uid
    var shareTitle = "Invite Friends Through";
    if(uid) {
      shareTitle = 'Share This Coach To';
    }

    function whatsappShare(){
      window.open('whatsapp://send?text=Hey, this tutor on Learnly might be able to help you https%3A%2F%2Flearnly.sg/tutor/'+alias, '_system');
      //window.open('whatsapp://send?text=http%3A%2F%2Fhyperurl.co/learnlyapp', '_system');
      return false;
    }

    function facebookShare(){
      window.open('fb-messenger://share?link=Hey, this tutor on Learnly might be able to help you https%3A%2F%2Flearnly.sg/tutor/'+alias, '_system');
      //window.open('fb-messenger://share?link=http%3A%2F%2Fhyperurl.co/learnlyapp', '_system');
      return false;
    }

    function share(uid, name, alias, face){
      if(uid){
        window.plugins.socialsharing.share(
            "Hey, "+name+" on Learnly might be able to help you",
            'Learnly',
            face,
            'https://learnly.sg/tutor/'+alias
        );
      } else {
        window.plugins.socialsharing.share(
            'Hey, check out the Learnly app! Simplest way for tutors and students to connect with each other',
            'Use Learnly to Find Tutors or Teach Lessons',
            "https://learnly.sg/pics/learnly-logo.png",
            'http://hyperurl.co/learnlyapp'
        );
      }

    }

   // Show the action sheet
   var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: 'Facebook' },
       { text: 'Whatsapp' },
       { text: 'Contacts' }
     ],
     //destructiveText: 'Delete',
     titleText: shareTitle,
     cancelText: 'Cancel',
     cancel: function() {
          // add cancel code..
        },
     buttonClicked: function(index) {
       console.log('BUTTON CLICKED', index);

       switch(index){
        case 0: facebookShare(); break;
        case 1: whatsappShare(); break;
        case 2: share(uid, name, alias, face); break;
       }

       return true;
     }
   });

   // For example's sake, hide the sheet after two seconds
   $timeout(function() {
     hideSheet();
   }, 10000);

  }


  return {
    addFeedback : addFeedback,
    shareWithFriend: shareWithFriend
  };
})


.factory('Skills', function($firebaseArray, Utilities, $q) {

  var skills = {};
  var skillsRef = fb.child("subjects");
  skillsRef.on("value", function(snapshot){
      skills = snapshot.val();
      console.log("Retrieved subject items "+snapshot.numChildren());
      //console.log(JSON.stringify(skills));
  });

  return {
    all: function() {
      return skills;
    },
    getByName: function(name) {
      var placeholder = {};
      placeholder.pic = "img/assets/placeholder.png";

      if(skills.hasOwnProperty(name)){
        if(skills[name].pic!=null){
          //console.log("Load request for "+name+" completed");
          //console.log("Returning ",skills[name].pic);
          return skills[name];
        }
      }

      return placeholder;

    }
  };
})

.factory('Schools', function($q) {

  function getSchools(country){

    var deferred = $q.defer();
    var schoolRef = fb.child("schools/"+country);

    schoolRef.on("value", function(snapshot){
        var schools = snapshot.val();
        //console.log(JSON.stringify(schools));
        console.log("Retrieved schools of "+country);
        deferred.resolve(schools);
    });

    return deferred.promise;
  }

  return {
    all: function() {
      return schools;
    },
    getSchools: getSchools
  };
})

.factory('Categories', function($q) {

  var categories = {


      60:[
        {"name":"Academics", "subjects":["Accounts","Bahasa Melayu","Biology","Chemistry","Chinese","Economics","English","Geography","Maths","Physics","Science","Sejarah"], "levels":["UPSR","PT3","SPM","STPM","O-Level","A-Level"],"customSubject":false},
      /*
        {"name":"Coding", "subjects":["Java","Excel","C","C++","C#","HTML","Python","Javascript","Matlab","PHP","R","Ruby","Robotics","Scratch","Swift","Visual Basic"], "levels":["Beginner","Intermediate","Advanced"],"customSubject":true},
        {"name":"Dance", "subjects":["Breakdance","Hiphop","Modern Dance","Poledance"], "levels":["Beginner","Intermediate","Advanced"],"customSubject":true},
        {"name":"Fun", "subjects":["Balloon Sculpting","Chess","Dating","DotA","Drone","Magic","Kendama","Nail Art","Photography","Rollerblading","Robotics","Parkour"], "levels":["Beginner","Intermediate","Advanced"],"customSubject":true},
      */
        {"name":"Languages", "subjects":["Japanese","Korean"], "levels":["Beginner","Intermediate","Advanced"],"customSubject":true},
        {"name":"Music", "subjects":["Piano","Guitar"], "levels":["Beginner","Intermediate","Advanced", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"],"customSubject":true},
        {"name":"Lifestyle","subjects":["Swimming","Photography"], "levels":["Beginner","Intermediate","Advanced"],"customSubject":true}

      ],

      65:[
        {"name":"Academics", "subjects":["Economics","Maths","Physics","Chemistry","Statistics","Biology","GP","POA","Geography","History","Social Studies","Science","English","Chinese","Malay","Tamil"], "levels":["PSLE","O-Level (Special Express)","O-Level (Normal Academic)","A-Level","International Baccalaureate","Undergraduate"],"customSubject":false},
        {"name":"Coding", "subjects":["Java","Excel","C","C++","C#","HTML","Python","Javascript","Matlab","PHP","R","Ruby","Robotics","Scratch","Swift","Visual Basic"], "levels":["Beginner","Intermediate","Advanced"],"customSubject":true},
        {"name":"Dance", "subjects":["Breakdance","Hiphop","Modern Dance","Poledance"], "levels":["Beginner","Intermediate","Advanced"],"customSubject":true},
        {"name":"Fun", "subjects":["Balloon Sculpting","Chess","Dating","DotA","Drone","Magic","Kendama","Nail Art","Photography","Rollerblading","Robotics","Parkour"], "levels":["Beginner","Intermediate","Advanced"],"customSubject":true},
        {"name":"Languages", "subjects":["English","Japanese","Korean","French","Thai","Vietnamese","Indonesian","Spanish","German","Italian","Mandarin","Cantonese","Arabic"], "levels":["Beginner","Intermediate","Advanced"],"customSubject":true},
        {"name":"Lifeskill", "subjects":["Baking","Cooking","Cycling","Driving","Finance","Nail Art","Swimming"], "levels":["Beginner","Intermediate","Advanced"],"customSubject":true},
        {"name":"Music", "subjects":["Piano","Guitar","Harmonica","Violin","Ukulele","Drums"], "levels":["Beginner","Intermediate","Advanced", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"],"customSubject":true},
        {"name":"Workout","subjects":["Bowling","Golf","Gymnastics","Muay Thai","Swimming","Squash","Soccer","Table Tennis","Tennis","Yoga"], "levels":["Beginner","Intermediate","Advanced"],"customSubject":true}
      ]

  }

  ;

  function getAvailableLevels(thisSubject, country) {
    //search through the offline categories object, to determine what are the levels for this subject
    for(var i=0;i<categories[country].length;i++){
      for(var j=0;j<categories[country][i].subjects.length;j++){
        if(categories[country][i].subjects[j] === thisSubject) {
          console.log("Levels match determined for "+thisSubject);
          console.log("Levels available: "+categories[country][i].levels);

          return categories[country][i].levels;
        }
      }
    }
    return null;
    //returns array
  }

  return {
    all: function(countryValue) {

      //console.log(JSON.stringify(categories[countryValue]));

      return categories[countryValue];
    },
    getAvailableLevels: getAvailableLevels

  };
})

.factory('Places', function($q) {
  // Might use a resource here that returns a JSON array

  //only contains the category headers
  var lines = [
    {"name": "Circle Line", "color":"#FF9A00",
    "stations" : [
      {
       "name" : "Bartley",
        "lat" : 1.342756,
        "lon" : 103.879697,
        "num" : 12
      },{
       "name" : "Bishan",
        "lat" : 1.351236,
        "lon" : 103.848456,
        "num" : 15
      },{
       "name" : "Botanic Gardens",
        "lat" : 1.322519,
        "lon" : 103.815406,
        "num" : 19
      },{
       "name" : "Bras Basah",
        "lat" : 1.296931,
        "lon" : 103.850631,
        "num" : 2
      },{
      "name": "Buona Vista",
        "lat" : 1.306817,
        "lon" : 103.790428,
        "num" : 21
      },{
      "name": "Caldecott",
        "lat" : 1.337761,
        "lon" : 103.839447,
        "num" : 17
      },{
      "name": "Dakota",
        "lat" : 1.308289,
        "lon" : 103.888253,
        "num" : 8
      },{
      "name": "Dhoby Ghaut",
        "lat" : 1.299156,
        "lon" : 103.845736,
        "num" : 1
      },{
       "name" : "Esplanade",
        "lat" : 1.293436,
        "lon" : 103.855381,
        "num" : 3
      },{
       "name" : "Farrer Road",
        "lat" : 1.317319,
        "lon" : 103.807431,
        "num" : 20
      },{
       "name" : "Harbourfront",
        "lat" : 1.265297,
        "lon" : 103.82225,
        "num" : 29
      },{
       "name" : "Haw Par Villa",
        "lat" : 1.282386,
        "lon" : 103.781867,
        "num" : 25
      },{
       "name" : "Holland Village",
        "lat" : 1.312078,
        "lon" : 103.796208,
        "num" : 21
      },{
       "name" : "Kent Ridge",
        "lat" : 1.293383,
        "lon" : 103.784394,
        "num" : 24
      },{
       "name" : "Labrador Park",
        "lat" : 1.272267,
        "lon" : 103.802908,
        "num" : 27
      },{
       "name" : "Lorong Chuan",
        "lat" : 1.351636,
        "lon" : 103.864064,
        "num" : 14
      },{
       "name" : "MacPherson",
        "lat" : 1.32665,
        "lon" : 103.890019,
        "num" : 10
      },{
       "name" : "Marymount",
        "lat" : 1.349078,
        "lon" : 103.839492,
        "num" : 16
      },{
       "name" : "Mountbatten",
        "lat" : 1.306306,
        "lon" : 103.882531,
        "num" : 7
      },{
       "name" : "Nicoll Highway",
        "lat" : 1.299697,
        "lon" : 103.863611,
        "num" : 5
      },{
       "name" : "One-north",
        "lat" : 1.299331,
        "lon" : 103.787067,
        "num" : 23
      },{
       "name" : "Pasir Panjang",
        "lat" : 1.276167,
        "lon" : 103.791358,
        "num" : 26
      },{
       "name" : "Payar Lebar",
        "lat" : 1.317767,
        "lon" : 103.892381,
        "num" : 9
      },{
       "name" : "Promenade",
        "lat" : 1.293131,
        "lon" : 103.861064,
        "num" : 4
      },{
       "name" : "Serangoon",
        "lat" : 1.349944,
        "lon" : 103.873092,
        "num" : 13
      },{
       "name" : "Stadium",
        "lat" : 1.302856,
        "lon" : 103.875306,
        "num" : 6
      },{
       "name" : "Tai Seng",
        "lat" : 1.335833,
        "lon" : 103.887942,
        "num" : 11
      },{
       "name" : "Telok Blangah",
        "lat" : 1.270572,
        "lon" : 103.809678,
        "num" : 28
      }
    ]},
    {"name": "Downtown Line","color":"#0354A6",
    "stations" : [
      {
       "name" : "Bayfront",
        "lat" : 1.282347,
        "lon" : 103.859317,
        "num" : 16
      },{
       "name" : "Beauty World",
        "lat" : 1.341133,
        "lon" : 103.775797,
        "num" : 5
      },{
       "name" : "Botanic Garden",
        "lat" : 1.322519,
        "lon" : 103.815406,
        "num" : 9
      },{
       "name" : "Bugis",
        "lat" : 1.300194,
        "lon" : 103.85615,
        "num" : 14
      },{
       "name" : "Bukit Panjang",
        "lat" : 1.378436,
        "lon" : 103.761767,
        "num" : 1
      },{
       "name" : "Cashew",
        "lat" : 1.368975,
        "lon" : 103.764803,
        "num" : 2
      },{
       "name" : "Chinatown",
        "lat" : 1.28485,
        "lon" : 103.844006,
        "num" : 19
      },{
       "name" : "Downtown",
        "lat" : 1.279458,
        "lon" : 103.852931,
        "num" : 17
      },{
       "name" : "Hillview",
        "lat" : 1.362472,
        "lon" : 103.767389,
        "num" : 3
      },{
       "name" : "King Albert Park",
        "lat" : 1.335628,
        "lon" : 103.783983,
        "num" : 6
      },{
       "name" : "Little India",
        "lat" : 1.306725,
        "lon" : 103.849175,
        "num" : 12
      },{
       "name" : "Newton",
        "lat" : 1.312956,
        "lon" : 103.838442,
        "num" : 11
      },{
       "name" : "Promenade",
        "lat" : 1.293131,
        "lon" : 103.861064,
        "num" : 15
      },{
       "name" : "Rocher",
        "lat" : 1.303764,
        "lon" : 103.852581,
        "num" : 13
      },{
       "name" : "Sixth Avenue",
        "lat" : 1.330714,
        "lon" : 103.797633,
        "num" : 7
      },{
       "name" : "Stevens",
        "lat" : 1.320069,
        "lon" : 103.825997,
        "num" : 10
      },{
       "name" : "Tan Kah Kee",
        "lat" : 1.326039,
        "lon" : 103.807169,
        "num" : 8
      },{
       "name" : "Telok Ayer",
        "lat" : 1.282125,
        "lon" : 103.848472,
        "num" : 18
      }
    ]},
    {"name": "East West Line","color":"#009530",
    "stations" : [
      {
       "name" : "Aljunied",
        "lat" : 1.316442,
        "lon" : 103.882981,
        "num" : 9
      },{
       "name" : "Bedok",
        "lat" : 1.324039,
        "lon" : 103.930036,
        "num" : 5
      },{
       "name" : "Boon Lay",
        "lat" : 1.338883,
        "lon" : 103.706208,
        "num" : 27
      },{
       "name" : "Bugis",
        "lat" : 1.300194,
        "lon" : 103.85615,
        "num" : 12
      },{
       "name" : "Buona Vista",
        "lat" : 1.306817,
        "lon" : 103.790428,
        "num" : 21
      },{
       "name" : "Changi Airport",
        "lat" : 1.357372,
        "lon" : 103.988836,
        "num" : "CG2"
      },{
       "name" : "Chinese Garden",
        "lat" : 1.342711,
        "lon" : 103.732467,
        "num" : 25
      },{
       "name" : "City Hall",
        "lat" : 1.293239,
        "lon" : 103.852219,
        "num" : 13
      },{
       "name" : "Clementi",
        "lat" : 1.315303,
        "lon" : 103.765244,
        "num" : 23
      },{
       "name" : "Commonwealth",
        "lat" : 1.302558,
        "lon" : 103.798225,
        "num" : 20
      },{
       "name" : "Dover",
        "lat" : 1.311314,
        "lon" : 103.778658,
        "num" : 22
      },{
       "name" : "Eunos",
        "lat" : 1.319725,
        "lon" : 103.903108,
        "num" : 7
      },{
       "name" : "Expo",
        "lat" : 1.335469,
        "lon" : 103.961767,
        "num" : "CG1"
      },{
       "name" : "Joo Koon",
        "lat" : 1.327739,
        "lon" : 103.678486,
        "num" : 29
      },{
       "name" : "Jurong East",
        "lat" : 1.333134,
        "lon" : 103.742288,
        "num" : 24
      },{
       "name" : "Kallang",
        "lat" : 1.311469,
        "lon" : 103.8714,
        "num" : 10
      },{
       "name" : "Kembangan",
        "lat" : 1.320983,
        "lon" : 103.912842,
        "num" : 6
      },{
       "name" : "Lakeside",
        "lat" : 1.344589,
        "lon" : 103.721139,
        "num" : 26
      },{
       "name" : "Lavender",
        "lat" : 1.307167,
        "lon" : 103.863008,
        "num" : 11
      },{
       "name" : "Outram Park",
        "lat" : 1.280225,
        "lon" : 103.839486,
        "num" : 16
      },{
       "name" : "Pasir Ris",
        "lat" : 1.372411,
        "lon" : 103.949369,
        "num" : 1
      },{
       "name" : "Paya Lebar",
        "lat" : 1.317767,
        "lon" : 103.892381,
        "num" : 8
      },{
       "name" : "Pioneer",
        "lat" : 1.337578,
        "lon" : 103.697217,
        "num" : 28
      },{
       "name" : "Queenstown",
        "lat" : 1.294442,
        "lon" : 103.806114,
        "num" : 19
      },{
       "name" : "Raffles Place",
        "lat" : 1.283881,
        "lon" : 103.851533,
        "num" : 14
      },{
       "name" : "Redhill",
        "lat" : 1.289733,
        "lon" : 103.81675,
        "num" : 18
      },{
       "name" : "Simei",
        "lat" : 1.343444,
        "lon" : 103.953172,
        "num" : 3
      },{
       "name" : "Tampines",
        "lat" : 1.352528,
        "lon" : 103.945322,
        "num" : 2
      },{
       "name" : "Tanah Merah",
        "lat" : 1.327358,
        "lon" : 103.946344,
        "num" : 4
      },{
       "name" : "Tanjong Pagar",
        "lat" : 1.276439,
        "lon" : 103.845711,
        "num" : 15
      },{
       "name" : "Tiong Bahru",
        "lat" : 1.286081,
        "lon" : 103.826958,
        "num" : 17
      }
    ]},
    {"name": "North East Line","color":"#9016B2",
    "stations" : [
      {
      "name" : "Boon Keng",
        "lat" : 1.319483,
        "lon" : 103.861722,
        "num" : 9
      },{
       "name" : "Buangkok",
        "lat" : 1.382728,
        "lon" : 103.892789,
        "num" : 15
      },{
       "name" : "Chinatown",
        "lat" : 1.28485,
        "lon" : 103.844006,
        "num" : 4
      },{
       "name" : "Clarke Quay",
        "lat" : 1.288708,
        "lon" : 103.846606,
        "num" : 5
      },{
       "name" : "Dhoby Ghaut",
        "lat" : 1.299156,
        "lon" : 103.845736,
        "num" : 6
      },{
      "name" : "Farrer Park",
        "lat" : 1.312314,
        "lon" : 103.854028,
        "num" : 8
      },{
       "name" : "Harbourfront",
        "lat" : 1.265297,
        "lon" : 103.82225,
        "num" : 1
      },{
       "name" : "Hougang",
        "lat" : 1.371292,
        "lon" : 103.892161,
        "num" : 14
      },{
       "name" : "Kovan",
        "lat" : 1.360214,
        "lon" : 103.884864,
        "num" : 13
      },{
       "name" : "Little India",
        "lat" : 1.306725,
        "lon" : 103.849175,
        "num" : 7
      },{
       "name" : "Outram Park",
        "lat" : 1.280225,
        "lon" : 103.839486,
        "num" : 3
      },{
       "name" : "Potong Pasir",
        "lat" : 1.331161,
        "lon" : 103.869058,
        "num" : 10
      },{
       "name" : "Punggol",
        "lat" : 1.405264,
        "lon" : 103.902097,
        "num" : 17
      },{
       "name" : "Sengkang",
        "lat" : 1.391653,
        "lon" : 103.895133,
        "num" : 16
      },{
       "name" : "Serangoon",
        "lat" : 1.349944,
        "lon" : 103.873092,
        "num" : 12
      },{
       "name" : "Woodleigh",
        "lat" : 1.339181,
        "lon" : 103.870744,
        "num" : 11
      }
    ]},
    {"name": "North South Line","color":"#DC241F",
    "stations" : [
      {
       "name" : "Admiralty",
        "lat" : 1.440689,
        "lon" : 103.800933,
        "num" : 10
      },{
       "name" : "Ang Mo Kio",
        "lat" : 1.370017,
        "lon" : 103.84945,
        "num" : 16
      },{
       "name" : "Bishan",
        "lat" : 1.351236,
        "lon" : 103.848456,
        "num" : 17
      },{
       "name" : "Braddell",
        "lat" : 1.340339,
        "lon" : 103.846725,
        "num" : 18
      },{
       "name" : "Bukit Batok",
        "lat" : 1.349073,
        "lon" : 103.749664,
        "num" : 2
      },{
       "name" : "Bukit Gombak",
        "lat" : 1.358702,
        "lon" : 103.751787,
        "num" : 3
      },{
       "name" : "Choa Chu Kang",
        "lat" : 1.385092,
        "lon" : 103.744322,
        "num" : 4
      },{
       "name" : "City Hall",
        "lat" : 1.293239,
        "lon" : 103.852219,
        "num" : 25
      },{
       "name" : "Dhoby Ghaut",
        "lat" : 1.299156,
        "lon" : 103.845736,
        "num" : 24
      },{
       "name" : "Jurong East",
        "lat" : 1.333134,
        "lon" : 103.742288,
        "num" : 1
      },{
       "name" : "Khatib",
        "lat" : 1.417167,
        "lon" : 103.8329,
        "num" : 14
      },{
       "name" : "Kranji",
        "lat" : 1.425047,
        "lon" : 103.761853,
        "num" : 7
      },{
       "name" : "Marina Bay",
        "lat" : 1.276097,
        "lon" : 103.854675,
        "num" : 27
      },{
       "name" : "Marina South Pier",
        "lat" : 1.270958,
        "lon" : 103.863242,
        "num" : 28
      },{
       "name" : "Marsiling",
        "lat" : 1.432636,
        "lon" : 103.774283,
        "num" : 8
      },{
       "name" : "Newton",
        "lat" : 1.312956,
        "lon" : 103.838442
      },{
       "name" : "Novena",
        "lat" : 1.320394,
        "lon" : 103.843689,
        "num" : 20
      },{
       "name" : "Orchard",
        "lat" : 1.304314,
        "lon" : 103.831939,
        "num" : 22
      },{
       "name" : "Raffles Place",
        "lat" : 1.283881,
        "lon" : 103.851533,
        "num" : 26
      },{
       "name" : "Sembawang",
        "lat" : 1.449025,
        "lon" : 103.820153,
        "num" : 11
      },{
       "name" : "Somerset",
        "lat" : 1.300514,
        "lon" : 103.839028,
        "num" : 23
      },{
       "name" : "Toa Payoh",
        "lat" : 1.332703,
        "lon" : 103.847808,
        "num" : 19
      },{
       "name" : "Woodlands",
        "lat" : 1.437094,
        "lon" : 103.786483,
        "num" : 9
      },{
       "name" : "Yew Tee",
        "lat" : 1.385092,
        "lon" : 103.744322,
        "num" : 5
      },{
       "name" : "Yio Chu Kang",
        "lat" : 1.381906,
        "lon" : 103.844817,
        "num" : 15
      },{
       "name" : "Yishun",
        "lat" : 1.429464,
        "lon" : 103.835239,
        "num" : 13
      }
    ]}
  ];


  return {
    all: function() {
      return lines;
    }

  };
})


.factory('Geolocation', function($q, $cordovaGeolocation, UserSkills) {
  // Handles location retrieval
  //ES6
  //function getNewLocation(inputOptions = {}) {
  function getNewLocation(inputOptions) {
      var defaultOptions = { timeout: 10000, enableHighAccuracy: false };

      var options = Object.assign({},defaultOptions,inputOptions);

      var deferred = $q.defer();

      $cordovaGeolocation.getCurrentPosition(options)
        .then(function(position){
          console.log("Geolocation success!");
          deferred.resolve(position);

        }, function(error){
          console.log("Could not get location");
          deferred.reject();

      });
      return deferred.promise;
  }

  function getExistingLocation(userid) {
      var deferred = $q.defer();
      var locationRef = fb.child("users").child(userid).child("location");
      locationRef.on("value", function(snapshot){
          var existingLocation = snapshot.val();
          console.log(JSON.stringify(existingLocation));
          console.log("Retrieved existing location from user profile");
          deferred.resolve(existingLocation);
      });
      return deferred.promise;
  }


  function getGoogleMaps(lat,lon) {
      //var deferred = $q.defer();

      //SETUP Google Maps based on the Coordinates obtained by GPS
      var latLng = new google.maps.LatLng(lat, lon);
      var mapOptions = {
        center: latLng,
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };

      var mapResult = new google.maps.Map(document.getElementById("map"), mapOptions);

      //only sets up the google map
      //map marker is to be called separately
      return mapResult;
  }

  function getStreetName(lat,lon) {
        var deferred = $q.defer();
        var geocoder = new google.maps.Geocoder;
        var latlng = {lat: parseFloat(lat), lng: parseFloat(lon)};
        geocoder.geocode({'location': latlng}, function(streetNameResults, status) {
          console.log("Running reverse geocode to retrieve streetname");
          if (status === google.maps.GeocoderStatus.OK) {
            if (streetNameResults[0]) {
              console.log(streetNameResults[0]);
              console.log(streetNameResults[1]);
              deferred.resolve(streetNameResults[1]['formatted_address']);

            } else {
              deferred.reject('No results found');
            }
          } else {
            deferred.reject('Geocoder failed due to: ' + status);
          }
        });

        return deferred.promise;
  }

  function getDistanceBetween(lat1,lon1,lat2,lon2){
    if((typeof lat1==='undefined')||(typeof lat2==='undefined')||(typeof lon1==='undefined')||(typeof lon2==='undefined')){
      return null;
    } else {
      var loc1 = new google.maps.LatLng(lat1, lon1);
      var loc2 = new google.maps.LatLng(lat2, lon2);

      var distance = google.maps.geometry.spherical.computeDistanceBetween(loc1, loc2);
      //console.log("Calculated as "+distance+" meters");
      return distance;
    }
  }

  function getCurrentLocation(userid) {
    var deferred = $q.defer();
    var currentLocation = {};
    var defaultOptions = { timeout: 5000, enableHighAccuracy: true };
    $cordovaGeolocation.getCurrentPosition(defaultOptions).then(function(position){
      console.log("Geolocation success!");
      currentLocation.lat = position.coords.latitude;
      currentLocation.lon = position.coords.longitude;
      console.log("Retrieved current location Lat:"+currentLocation.lat+" Lon:"+currentLocation.lon);
      deferred.resolve(currentLocation);
    }, function(error){
      console.log("Could not get location");
      getExistingLocation(userid).then(function(existingLocation){
        currentLocation = existingLocation;
        console.log("Retrieved location from user profile in SearchCtrl", location);
        deferred.resolve(currentLocation);
      },function(error){
        console.log("Fallback to Bishan");
        currentLocation.lat = 1.351236;
        currentLocation.lon = 103.848456;
        deferred.resolve(currentLocation);
      })
    })
    return deferred.promise;
  }

  //for general service calls

  return {
    //returns positional coordinates from GPS
    getNewLocation: getNewLocation,
    //returns existing coordinates from Firebase
    getExistingLocation: getExistingLocation,
    //creates a Google Map object based on coordinates
    getGoogleMaps: getGoogleMaps,
    //returns a street name for a given lat and lon
    getStreetName: getStreetName,
    //compute the distance between 2 coordinates
    getDistanceBetween: getDistanceBetween,
    //returns current location of user if not a fallback
    getCurrentLocation: getCurrentLocation,
    // retrieves and writes the user location to user object in firebase
    setUserLocation: function(userid, mandatoryOverwrite) {
      var deferred = $q.defer();
      var userLocationRef = fb.child("users/"+userid).child("location");
      userLocationRef.once("value", function(snapshot){
        //check if any location data exists in user model
        var locationExists = (snapshot.val() !== null);
        var currentLocation = snapshot.val();

        if(mandatoryOverwrite){
          locationExists = false;
          //forcibly overwrite the existing location
        }

        if(!locationExists){
          getNewLocation().then(function(locationResults){

            console.log("Geolocation says "+locationResults.coords.longitude);
            //now retrieve the streetname
            getStreetName(locationResults.coords.latitude,locationResults.coords.longitude)
              .then(function(streetNameResults){
              userLocationRef.set({
                        'lat': locationResults.coords.latitude,
                        'lon': locationResults.coords.longitude,
                        'time': Firebase.ServerValue.TIMESTAMP,
                        'name': streetNameResults

              });
              console.log("Retrieved and set new location: "+streetNameResults);



              UserSkills.updateLocations(userid, {
                        'lat': locationResults.coords.latitude,
                        'lon': locationResults.coords.longitude,
                        'name': streetNameResults
              });



              deferred.resolve();
            });

          });


        } else {
          console.log("User already has a location, we will update their last online time, pageviews and g");

          //Updates the User profile timer
          userLocationRef.update({'time': Firebase.ServerValue.TIMESTAMP}, function(){

            console.log("Updated user last online time");
          });

          var userAllowListingRef = fb.child("users/"+userid).child("showClassListings");
          userAllowListingRef.once("value", function(snapshot){
            var userAllowListingRef = snapshot.val();
            console.log("User Allow Classes To List "+userAllowListingRef);

            if((userAllowListingRef)||(userAllowListingRef===null)) {
              //updates using actual time
              UserSkills.updateTime(userid,Firebase.ServerValue.TIMESTAMP);
              UserSkills.updateLocations(userid, currentLocation);
            } else {
              //updates to unix time zero
              UserSkills.updateTime(userid,0);
            }

          });
          //Updates the UserSkills individually
          /*
          if(enableIntercom&&window.cordova){
            intercom.updateUser({
              'custom_attributes': {
                'appViewCount': $scope.user.viewCount
              }
            });

          }
*/
          deferred.resolve();
        }

      });

      return deferred.promise;

    },
    setStationLocation: function(userid, station, mandatory) {
      var deferred = $q.defer();

      var userLocationRef = fb.child("users/"+userid).child("location");
      userLocationRef.once("value", function(snapshot){
        //check if any location data exists in user model
        var locationExists = (snapshot.val() !== null);

        if(mandatory){
          locationExists = false;
          //forcibly overwrite the existing location
        }

        if(!locationExists){

              console.log("Station provided is "+station.name);
              console.log("Lat provided is "+station.lat);
              console.log("Lon provided is "+station.lon);

              userLocationRef.set({
                        'lat': station.lat,
                        'lon': station.lon,
                        'time': Firebase.ServerValue.TIMESTAMP,
                        'name': station.name+', Singapore'

              });
              console.log("Set new location: "+station.name);

              userLocationRef.once("value", function(snapshot2){
                UserSkills.updateLocations(userid, snapshot2.val());
              });
              //we must update the userskill locations too


        } else {
          console.log("User already has a location");
          deferred.resolve();
        }

      });

      return deferred.promise;

    }

  };


})



.factory('Bookmarks', function($q, Push) {

  //allows liker to like a userid
  function likePerson(subjectId, likerId, name) {
      var likedRef = fb.child("liked/person").child(subjectId).child(likerId);
      likedRef.set(Firebase.ServerValue.TIMESTAMP);
      console.log(likerId+" liked "+subjectId);

      //store in the liker's own db
      var userLikeRef = fb.child("users").child(likerId).child("likes/person/"+subjectId);
      userLikeRef.set(Firebase.ServerValue.TIMESTAMP);

      Push.getToken(subjectId).then(function(destinationToken){
        var notification = name+" has bookmarked you";
        Push.sendNotification(destinationToken, notification, likerId,"bookmark");
        console.log("Notifying recipient about bookmark");
      });
  }

  //allows liker to unlike a userid
  function unlikePerson(subjectId, likerId) {
      var likedRef = fb.child("liked/person").child(subjectId).child(likerId);
      likedRef.set(null);
      console.log(likerId+" unliked "+subjectId);
      //store in the liker's own db
      var userLikeRef = fb.child("users").child(likerId).child("likes/person/"+subjectId);
      userLikeRef.set(null);
  }

  //allows liker to check if he previously liked this subject person
  //returns true or false
  function checkIfLikePerson(subjectId, likerId) {
      var deferred = $q.defer();

      var likedRef = fb.child("liked/person").child(subjectId).child(likerId);
      likedRef.on("value", function(snapshot){
        var like = snapshot.val();

        deferred.resolve(like);
      });

      return deferred.promise;
  }

  //find how many people have liked this person
  function getLikePersonCount(subjectId) {
      var deferred = $q.defer();

      var likedRef = fb.child("liked/person").child(subjectId);
      likedRef.once("value", function(snapshot){
        var count = snapshot.numChildren();

        deferred.resolve(count);
      });

      return deferred.promise;
  }


  //allows liker to like a userid
  function likeRequest(subjectId, likerId) {
      var likedRef = fb.child("liked/jobs").child(subjectId).child(likerId);
      likedRef.set(Firebase.ServerValue.TIMESTAMP);
      console.log(likerId+" liked "+subjectId);

      //store in the liker's own db
      var userLikeRef = fb.child("users").child(likerId).child("likes/request/"+subjectId);
      userLikeRef.set(Firebase.ServerValue.TIMESTAMP);
  }

  //allows liker to unlike a userid
  function unlikeRequest(jobId, likerId) {
      var likedRef = fb.child("liked/jobs").child(jobId).child(likerId);
      likedRef.set(false);
      console.log(likerId+" unliked "+jobId);
  }

  return {
    likePerson: likePerson,
    unlikePerson: unlikePerson,
    checkIfLikePerson: checkIfLikePerson,
    getLikePersonCount: getLikePersonCount,
    likeRequest: likeRequest,
    unlikeRequest: unlikeRequest
  };
})

.factory('Push', function($q, $http) {


  function setToken(userid, token) {
      var pushRef = fb.child("pushtokens").child(userid);
      pushRef.set({'token': token});
      console.log("Firebase notes token "+token+" for "+userid);
  }

  function getToken(userid) {
      var deferred = $q.defer();
      var pushRef = fb.child("pushtokens").child(userid);
      pushRef.on("value", function(snapshot) {
              var result  = snapshot.val();
              console.log("Retrieved objects "+JSON.stringify(result));
              deferred.resolve(result.token);

      });
      return deferred.promise;
  }

  function removeToken(userid) {
      var deferred = $q.defer();
      var pushRef = fb.child("pushtokens").child(userid);
      pushRef.set(null);

      deferred.resolve("Pushwoosh Token Removed");

      return deferred.promise;
  }

  function sendNotification(destinationToken, message, chatId, like) {
      var haveNewChat = false;
      var haveNewRequest = false;
      var haveNewBookmark = false;
      var haveNewPostLike = false;

      if(like){
        chatId = false;
        if(like=="bookmark"){
          haveNewBookmark = true;
        } else if(like="post"){
          haveNewPostLike = true;
        }
      } else if(chatId){
        haveNewChat = true;
      } else {
        chatId = false;
        haveNewRequest = true;
      }
      //go retrieve the token for userid
      console.log("Destination is "+destinationToken);

      var pw_appId = "427AA-CCB6A";
      var apiToken = "2m9bh6jpubN2CIVWQ5sLcFcQ7vfmRfUTY1ae8SYQ3EZTZbhzmSqGyjgoYC2l3MfUKi84qOXsSc1eDnja5WLi";
      //var tokens = [usertoken];
      var data = {
            "request": {
                "application": pw_appId,
                "auth": apiToken,
                "notifications": [{
                    "send_date": "now", // YYYY-MM-DD HH:mm  OR 'now'
                    "ignore_user_timezone": true, // or false
                    "content": message,
                    "data":{                     // JSON string or JSON object, will be passed as "u" parameter in the payload
                          "haveNewChat": haveNewChat,
                          "chatId": chatId,
                          "haveNewRequest": haveNewRequest,
                          "haveNewBookmark": haveNewBookmark,
                          "haveNewPostLike": haveNewPostLike
                    },
                    "android_priority": 1,
                    "devices":[destinationToken]
                }]
            }
      };
      var JSONData = JSON.stringify(data);

      // Encode your key
      //var auth = btoa(reqN + ':');

      // Build the request object
      var req = {
        method: 'POST',
        url: 'https://cp.pushwoosh.com/json/1.3/createMessage',
        headers: {
          'Content-Type': 'application/json'
        },
        data: JSONData
      };
/*
      console.log("Data is "+JSONData);

      var url = 'https://cp.pushwoosh.com/json/1.3/createMessage';

      $http.post(url,JSONData,req).then(function(success){
        console.log("Push sucess");
      }, function(error){
        console.log("Push error "+JSON.stringify(error));
      });
*/

      // Make the API call
      $http(req).success(function(resp){
        // Handle success
        console.log("Push success!");
      }).error(function(error){
        // Handle error
        console.log("Push error...");
        console.log(JSON.stringify(error));
      });

  }

  return {
    setToken: setToken,
    getToken: getToken,
    removeToken: removeToken,
    sendNotification: sendNotification
  };
})

.factory('ImageToken', function($q, $http, Utilities, geohash, $geofire) {


  function setToken(userid) {
      var deferred = $q.defer();
      var imageRef = fb.child("imagetokens").child(userid);
      var token = Utilities.randomString(20);
      console.log("Generated random string "+token);

      imageRef.set({'token': token});
      console.log("Firebase notes token "+token+" for "+userid);
      deferred.resolve(token);
      return deferred.promise;
  }

  function getToken(userid) {
      var deferred = $q.defer();
      var imageRef = fb.child("imagetokens").child(userid);
      imageRef.on("value", function(snapshot) {
              var result  = snapshot.val();
              console.log("Retrieved objects "+JSON.stringify(result));
              deferred.resolve(result.token);

      });
      return deferred.promise;
  }

  function getURL(userid, destinationToken, imagedata) {
      var deferred = $q.defer();

      //go retrieve the token for userid
      console.log("Imagetoken is "+destinationToken+" for "+userid);

      var url = 'http://sign.belearnly.com/v1.0/upload-token.php?'+'userid='+userid+'&token='+destinationToken+'&content-type='+'image/jpeg';

      // Build the request object
      var req = {
        "method": 'GET',
        "url": url,
        "headers": {
          'Content-Type': 'application/json'
        }
      };

      // Make the API call
      $http(req).success(function(resp){
        // Handle success
        console.log("GET URL success!");

        console.log(JSON.stringify(resp));

/*
        var uploadurl = resp['upload-url'];
        var fields = resp['form-fields'];

        console.log("Upload to "+uploadurl);

        postImage(uploadurl,fields, imagedata);
*/
        deferred.resolve(resp);

      }).error(function(error){
        // Handle error
        console.log("Push error...");
        console.log(error);
      });

      return deferred.promise;

  }

  //accepts blob data
  function postImage(userid, destinationToken, imagedata) {
      var deferred = $q.defer();

      getURL(userid, destinationToken).then(function(response){

        var uploadurl = response['upload-url'];
        var fields = response['form-fields'];
        var fileurl = response["file-url"]


        console.log(typeof data);
        console.log("IMAGE DATA AS FOLLOWS "+imagedata);

        var fd = new FormData();
        fd.append('acl', fields['acl']);
        fd.append('key', fields['key']);
        fd.append('policy', fields['policy']);
        fd.append('x-amz-algorithm', fields['x-amz-algorithm']);
        fd.append('x-amz-credential', fields['x-amz-credential']);
        fd.append('x-amz-date', fields['x-amz-date']);
        fd.append('x-amz-signature', fields['x-amz-signature']);

        fd.append('Content-Type', fields['content-type']);
        fd.append('x-amz-meta-userid', fields['x-amz-meta-userid']);
        fd.append('x-amz-storage-class', fields['x-amz-storage-class']);

        fd.append('file', imagedata);

        // Build the request object //multipart/form-data
        var req = {
          "method": 'POST',
          "url": uploadurl,
          transformRequest: angular.identity,
          "headers": {
            'Content-Type': undefined
          },
          "data": fd
        };

        // Make the API call
        $http(req).success(function(resp){
          // Handle success
          console.log("POST success!");

          console.log(JSON.stringify(resp));

          deferred.resolve(fileurl);

        }).error(function(error){
          // Handle error
          console.log("POST error...");
          console.log(error);
        });

      });

      return deferred.promise;

  }

  return {

    setToken: setToken,
    getToken: getToken,
    getURL: getURL,
    postImage: postImage
  };
})


.factory('UserSkills', function($q, Utilities, Categories, $geofire, geohash, moment) {
  // Denormalized table that provides public list of coaches teaching a skill

  //converts JSON to an array
  //normally, key is lost during conversion to array
  //before conversion, we copy the JSON key and add it as 'key' attribute to array item
  function convertToArrayWithKey(json) {
    //loop through an attach the key as a value property
    for(var k in json) {
      if(json.hasOwnProperty(k)){
          json[k].key = k;
      }
    }

    //convert objects to an array and return the result
    json = Object.keys(json).map(function(k) { return json[k] });

    return json;
  }

  //Rather than going online to Firebase
  //Checks offline in the Category service, whether this is an existing subject
  function checkIfExistingSubject(keyword) {
      var deferred = $q.defer();
      var dirty = false;

      console.log("CHECKING EXISTING SUBJECT CATALOGUE");

      var categories = Categories.all(Utilities.getCurrentCountry().value);

      outerloop:
      for(var category in categories){
        if(categories.hasOwnProperty(category)){

            var subjects = categories[category]["subjects"];

            for(var subject in subjects){
              if(subjects[subject] == keyword){
                console.log("HIT!!!!!");
                dirty = true;
                break outerloop;
              }
            }

        }
      }

      console.log("Subject "+keyword+" exists? "+dirty);

      //dirty is true if the subject exists
      //go online to retrieve if it really exists
      //return dirty;
      deferred.resolve(dirty);
      return deferred.promise;
  }

  function getAvailableLevels(keyword) {
      var deferred = $q.defer();

      var skillRef = fbCountry.child("userskills").child(keyword);
      //any kind of sorting to be done?
      skillRef.orderByKey().on("value", function(snapshot) {
          var coachList = snapshot.val();
          console.log("Searching for "+keyword);
          console.log("Retrieved "+snapshot.numChildren()+" levels");
          //console.log("Retrieved objects "+JSON.stringify(coachList));

          if(coachList===null){
            deferred.resolve(coachList);
          }


          //key will be lost after converting to array
          //store the key as a property
          coachList = Utilities.convertToArrayWithKey(coachList);

          deferred.resolve(coachList);

      });

      return deferred.promise;
  }


  function getCoaches(keyword, filter, endAt, startAt) {
      var deferred = $q.defer();
      console.log("Running UserSkills Search Service");
      var skillRef = fbCountry.child("userskills").child(keyword).child("general");
      //any kind of sorting to be done?
      //1000ms * 60 * 60 * 24 * x days
      const activeDuration = 10368000000;
      //const activeDuration = 7776000000;

      if(startAt&&endAt&&(filter=='rate')){

        skillRef.orderByChild(filter).limitToFirst(endAt).on("value", function(snapshot) {
          var delta = [];
          snapshot.forEach(function(childSnapshot) {
              var tempHolder = childSnapshot.val();
              tempHolder.key = childSnapshot.key();
              var currentTime = (new Date()).getTime();
              var expiryTime = currentTime - activeDuration;
              console.log("current time "+ currentTime);
              if(tempHolder.hasOwnProperty('location')){
                console.log(tempHolder.location.time + " vs " + expiryTime);
              if(tempHolder.location.time>expiryTime){
                delta.push(tempHolder);
              }
            }
              //delta.push(childSnapshot.val());
              //console.log(childSnapshot.key());
          });
            var coachList = delta;
            console.log("Searching for "+keyword);
            console.log("Retrieved "+snapshot.numChildren()+" coach");
            //console.log("Retrieved objects "+JSON.stringify(coachList));

            if(snapshot.numChildren()==0){
              deferred.reject("No results");
              return deferred.promise;
              //deferred.resolve(coachList);
            }

          //var coachList = Utilities.convertToArrayWithKey(delta);
          deferred.resolve(delta);

        });

      } else if(startAt&&endAt&&(filter=='rating')){

        skillRef.orderByChild(filter).limitToLast(endAt).on("value", function(snapshot) {
          var delta = [];
          snapshot.forEach(function(childSnapshot) {
              var tempHolder = childSnapshot.val();
              tempHolder.key = childSnapshot.key();

              var currentTime = (new Date()).getTime();
              var expiryTime = currentTime - activeDuration;
              console.log("current time "+ currentTime);
              if(tempHolder.hasOwnProperty('location')){
                console.log(tempHolder.location.time + " vs " + expiryTime);
              if(tempHolder.location.time>expiryTime){
                delta.push(tempHolder);
              }
            }
              //delta.push(childSnapshot.val());
              //console.log(childSnapshot.key());
          });
            var coachList = delta;
            console.log("Searching for "+keyword);
            console.log("Retrieved "+snapshot.numChildren()+" coach");
            //console.log("Retrieved objects "+JSON.stringify(coachList));

            if(snapshot.numChildren()==0){
              deferred.reject("No results");
              return deferred.promise;
              //deferred.resolve(coachList);
            }

          //var coachList = Utilities.convertToArrayWithKey(delta);
          deferred.resolve(delta);

        });

      } else if(endAt&&startAt&&(filter=='verified')){
        console.log("Number of coaches retrieved: " + endAt);

        skillRef.orderByChild(filter).limitToLast(endAt).on("value", function(snapshot) {
          var delta = [];
          snapshot.forEach(function(childSnapshot) {
              var tempHolder = childSnapshot.val();
              tempHolder.key = childSnapshot.key();

              var currentTime = (new Date()).getTime();
              var expiryTime = currentTime - activeDuration;
              console.log("current time "+ currentTime);
              if(tempHolder.hasOwnProperty('location')){
                console.log(tempHolder.location.time + " vs " + expiryTime);
              if(tempHolder.location.time>expiryTime){
                delta.push(tempHolder);
              }
            }
              //delta.push(childSnapshot.val());
              //console.log(childSnapshot.key());
          });
          console.log("test");
          var coachList = delta;
          console.log("Searching for "+keyword);
          console.log("Retrieved "+snapshot.numChildren()+" coach");
          //console.log("Retrieved objects "+JSON.stringify(coachList));

          if(snapshot.numChildren()==0){
            deferred.reject("No results");
            return deferred.promise;
            //deferred.resolve(coachList);
          }

          //var coachList = Utilities.convertToArrayWithKey(delta);
          deferred.resolve(delta);

        });
      } else if(endAt&&(filter=='rate')){
        console.log("Number of "+filter+" coaches to retrieve: " + endAt);

        skillRef.orderByChild(filter).limitToFirst(endAt).on("value", function(snapshot) {
          var delta = [];
          snapshot.forEach(function(childSnapshot) {
              var tempHolder = childSnapshot.val();
              tempHolder.key = childSnapshot.key();
              var currentTime = (new Date()).getTime();
              var expiryTime = currentTime - activeDuration;
              console.log("Current time is "+moment(currentTime).format("Do MMMM YYYY"));
              if(tempHolder.hasOwnProperty('location')){
                //console.log(tempHolder.location.time + " vs " + expiryTime);
                if(tempHolder.location.time>expiryTime){
                  console.log()
                  delta.push(tempHolder);
                } else {
                  console.log("Excluded because "+moment(tempHolder.location.time).format("Do MMMM YYYY")+" is older than "+moment(expiryTime).format("Do MMMM YYYY"));
                }
              }
              //delta.push(childSnapshot.val());
              //console.log(childSnapshot.key());
          });
            var coachList = delta;
            console.log("Searching for "+keyword);
            console.log("Retrieved "+snapshot.numChildren()+" coach");
            //console.log("Retrieved objects "+JSON.stringify(coachList));

            if(snapshot.numChildren()==0){
              deferred.reject("No results");
              return deferred.promise;
              //deferred.resolve(coachList);
            }

            //key will be lost after converting to array
            //store the key as a property
            /*coachList = Utilities.convertToArrayWithKey(coachList);
            for(var i=0; i<coachList.length;i++){
              console.log(coachList[i].rate + " " +coachList[i].key);
            }*/

          //var coachList = Utilities.convertToArrayWithKey(delta);
          deferred.resolve(delta);

        });
      } else if(endAt&&(filter=='rating')){
        console.log("Number of "+filter+" coaches to retrieve: " + endAt);

        skillRef.orderByChild(filter).limitToLast(endAt).on("value", function(snapshot) {
          var delta = [];
          snapshot.forEach(function(childSnapshot) {
              var tempHolder = childSnapshot.val();
              tempHolder.key = childSnapshot.key();

              var currentTime = (new Date()).getTime();
              var expiryTime = currentTime - activeDuration;
              console.log("current time "+ currentTime);
              if(tempHolder.hasOwnProperty('location')){
                console.log(tempHolder.location.time + " vs " + expiryTime);
              if(tempHolder.location.time>expiryTime){
                delta.push(tempHolder);
              }
            }
              //delta.push(childSnapshot.val());
              //console.log(childSnapshot.key());
          });
            var coachList = delta;
            console.log("Searching for "+keyword);
            console.log("Retrieved "+snapshot.numChildren()+" coach");
            //console.log("Retrieved objects "+JSON.stringify(coachList));

            if(snapshot.numChildren()==0){
              deferred.reject("No results");
              return deferred.promise;
              //deferred.resolve(coachList);
            }

          deferred.resolve(delta);

        });
      } else if(endAt&&(filter=='verified')){
        console.log("Number of "+filter+" coaches to retrieve: " + endAt);
        skillRef.orderByChild(filter).equalTo(true).limitToLast(endAt).on("value", function(snapshot) {
          var delta = [];
          snapshot.forEach(function(childSnapshot) {
              var tempHolder = childSnapshot.val();
              tempHolder.key = childSnapshot.key();

             var currentTime = (new Date()).getTime();
              var expiryTime = currentTime - activeDuration;
              console.log("current time "+ currentTime);
              if(tempHolder.hasOwnProperty('location')){
                console.log(tempHolder.location.time + " vs " + expiryTime);
              if(tempHolder.location.time>expiryTime){
                delta.push(tempHolder);
              }
            }
              //delta.push(childSnapshot.val());
              //console.log(childSnapshot.key());
          });
          var coachList = delta;
          console.log("Searching for "+keyword);
          console.log("Retrieved "+snapshot.numChildren()+" coach");
          //console.log("Retrieved objects "+JSON.stringify(coachList));

          if(snapshot.numChildren()==0){
            deferred.reject("No results");
            return deferred.promise;
            //deferred.resolve(coachList);
          }

          //key will be lost after converting to array
          //store the key as a property
          /*coachList = Utilities.convertToArrayWithKey(coachList);
          for(var i=0; i<coachList.length;i++){
            console.log(coachList[i].rate + " " +coachList[i].key);
          }*/

          //var coachList = Utilities.convertToArrayWithKey(delta);
          //deferred.resolve(coachList);
          deferred.resolve(delta);

        });
      } else if(endAt&&(filter=='location/time')){
        console.log("Number of "+filter+" coaches to retrieve: " + endAt);
        console.log("Filtering by most recent");

        skillRef.orderByChild(filter).limitToLast(endAt).on("value", function(snapshot) {
          var delta = [];
          snapshot.forEach(function(childSnapshot) {
              var tempHolder = childSnapshot.val();
              tempHolder.key = childSnapshot.key();

              var currentTime = (new Date()).getTime();
              var expiryTime = currentTime - activeDuration;
              //console.log("current time "+ currentTime);
              if(tempHolder.hasOwnProperty('location')){
                //console.log(tempHolder.location.time + " vs " + expiryTime);
              if(tempHolder.location.time>expiryTime){
                delta.push(tempHolder);
              }
            }
              //delta.push(childSnapshot.val());
              //console.log(childSnapshot.key());
          });
            var coachList = delta;
            console.log("Searching for "+keyword);
            console.log("Retrieved "+snapshot.numChildren()+" coach");
            //console.log("Retrieved objects "+JSON.stringify(coachList));

            if(snapshot.numChildren()==0){
              deferred.reject("No results");
              return deferred.promise;
              //deferred.resolve(coachList);
            }

          //var coachList = Utilities.convertToArrayWithKey(delta);
          deferred.resolve(delta);

        });
      } else if(endAt){
        console.log("Filtering by last X search");
        console.log("Number of coaches retrieved: " + endAt);

        skillRef.limitToLast(endAt).on("value", function(snapshot) {
            var coachList = snapshot.val();
            console.log("Searching for "+keyword);
            console.log("Retrieved "+snapshot.numChildren()+" coach");
            //console.log("Retrieved objects "+JSON.stringify(coachList));

            if(snapshot.numChildren()==0){
              deferred.reject("No results");
              return deferred.promise;
              //deferred.resolve(coachList);
            }


            //key will be lost after converting to array
            //store the key as a property
            coachList = Utilities.convertToArrayWithKey(coachList);

            deferred.resolve(coachList);

        });
      }else {
        skillRef.on("value", function(snapshot) {
            console.log("RUNNING BASIC FALLBACK SEARCH");
            var coachList = snapshot.val();
            console.log("Searching for "+keyword);
            console.log("Retrieved "+snapshot.numChildren()+" coach");
            //console.log("Retrieved objects "+JSON.stringify(coachList));

            if(snapshot.numChildren()==0){
              deferred.reject("No results");
              return deferred.promise;
              //deferred.resolve(coachList);
            }


            //key will be lost after converting to array
            //store the key as a property
            coachList = Utilities.convertToArrayWithKey(coachList);

            deferred.resolve(coachList);

        });
      }

      return deferred.promise;
  }

  function getCoachesByLevel(keyword, level, filter, endAt, startAt) {
      var deferred = $q.defer();

      var skillRef = fbCountry.child("userskills").child(keyword).child(level);
      //any kind of sorting to be done?
      const activeDuration = 10368000000;

      if(startAt&&endAt&&(filter=='rate')){
        skillRef.orderByChild(filter).limitToFirst(endAt).on("value", function(snapshot) {
          var delta = [];
          snapshot.forEach(function(childSnapshot) {
              var tempHolder = childSnapshot.val();
              tempHolder.key = childSnapshot.key();

              var currentTime = (new Date()).getTime();
              var expiryTime = currentTime - activeDuration;
              if(tempHolder.hasOwnProperty('location')){
              if(tempHolder.location.time>expiryTime){
                delta.push(tempHolder);
              }
            }
              //delta.push(childSnapshot.val());
              //console.log(childSnapshot.key());
          });
            var coachList = delta;
            console.log("Searching for "+keyword);
            console.log("Retrieved "+snapshot.numChildren()+" coach");
            //console.log("Retrieved objects "+JSON.stringify(coachList));

            if(snapshot.numChildren()==0){
              deferred.reject("No results");
              return deferred.promise;
              //deferred.resolve(coachList);
            }

          deferred.resolve(delta);

        });

      } else if(startAt&&endAt&&(filter=='rating')){

        skillRef.orderByChild(filter).limitToLast(endAt).on("value", function(snapshot) {
          var delta = [];
          snapshot.forEach(function(childSnapshot) {
              var tempHolder = childSnapshot.val();
              tempHolder.key = childSnapshot.key();

              var currentTime = (new Date()).getTime();
              var expiryTime = currentTime - activeDuration;
              console.log("current time "+ currentTime);
              if(tempHolder.hasOwnProperty('location')){
                console.log(tempHolder.location.time + " vs " + expiryTime);
              if(tempHolder.location.time>expiryTime){
                delta.push(tempHolder);
              }
            }
              //delta.push(childSnapshot.val());
              //console.log(childSnapshot.key());
          });
            var coachList = delta;
            console.log("Searching for "+keyword);
            console.log("Retrieved "+snapshot.numChildren()+" coach");
            //console.log("Retrieved objects "+JSON.stringify(coachList));

            if(snapshot.numChildren()==0){
              deferred.reject("No results");
              return deferred.promise;
              //deferred.resolve(coachList);
            }

            //key will be lost after converting to array
            //store the key as a property
            /*coachList = Utilities.convertToArrayWithKey(coachList);
            for(var i=0; i<coachList.length;i++){
              console.log(coachList[i].rate + " " +coachList[i].key);
            }*/

          //var coachList = Utilities.convertToArrayWithKey(delta);
          deferred.resolve(delta);

        });

      }else if(endAt&&startAt&&(filter=='verified')){
        console.log("Number of coaches retrieved: " + endAt);

        skillRef.orderByChild(filter).limitToLast(endAt).on("value", function(snapshot) {
          var delta = [];
          snapshot.forEach(function(childSnapshot) {
              var tempHolder = childSnapshot.val();
              tempHolder.key = childSnapshot.key();

              var currentTime = (new Date()).getTime();
              var expiryTime = currentTime - activeDuration;
              console.log("current time "+ currentTime);
              if(tempHolder.hasOwnProperty('location')){
                console.log(tempHolder.location.time + " vs " + expiryTime);
              if(tempHolder.location.time>expiryTime){
                delta.push(tempHolder);
              }
            }
              //delta.push(childSnapshot.val());
              //console.log(childSnapshot.key());
          });
            var coachList = delta;
            console.log("Searching for "+keyword);
            console.log("Retrieved "+snapshot.numChildren()+" coach");
            //console.log("Retrieved objects "+JSON.stringify(coachList));

            if(snapshot.numChildren()==0){
              deferred.reject("No results");
              return deferred.promise;
              //deferred.resolve(coachList);
            }

            //key will be lost after converting to array
            //store the key as a property
            /*coachList = Utilities.convertToArrayWithKey(coachList);
            for(var i=0; i<coachList.length;i++){
              console.log(coachList[i].rate + " " +coachList[i].key);
            }*/

          //var coachList = Utilities.convertToArrayWithKey(delta);
          deferred.resolve(delta);

        });
      }else if(endAt&&(filter=='rate')){
        console.log("Number of coaches retrieved: " + endAt);
        skillRef.orderByChild(filter).limitToFirst(endAt).on("value", function(snapshot) {
          var delta = [];
          snapshot.forEach(function(childSnapshot) {
              var tempHolder = childSnapshot.val();
              tempHolder.key = childSnapshot.key();

              var currentTime = (new Date()).getTime();
              var expiryTime = currentTime - activeDuration;
              if(tempHolder.hasOwnProperty('location')){
              if(tempHolder.location.time>expiryTime){
                delta.push(tempHolder);
              }
            }
              //delta.push(childSnapshot.val());
              //console.log(childSnapshot.key());
          });
            var coachList = delta;
            console.log("Searching for "+keyword);
            console.log("Retrieved "+snapshot.numChildren()+" coach");
            //console.log("Retrieved objects "+JSON.stringify(coachList));

            if(snapshot.numChildren()==0){
              deferred.reject("No results");
              return deferred.promise;
              //deferred.resolve(coachList);
            }

          deferred.resolve(delta);

        });
        }else if(endAt&&(filter=='rating')){
        console.log("Number of coaches retrieved: " + endAt);

        skillRef.orderByChild(filter).limitToFirst(endAt).on("value", function(snapshot) {
          var delta = [];
          snapshot.forEach(function(childSnapshot) {
              var tempHolder = childSnapshot.val();
              tempHolder.key = childSnapshot.key();

              var currentTime = (new Date()).getTime();
              var expiryTime = currentTime - activeDuration;
              console.log("current time "+ currentTime);
              if(tempHolder.hasOwnProperty('location')){
                console.log(tempHolder.location.time + " vs " + expiryTime);
              if(tempHolder.location.time>expiryTime){
                delta.push(tempHolder);
              }
            }
              //delta.push(childSnapshot.val());
              //console.log(childSnapshot.key());
          });
            var coachList = delta;
            console.log("Searching for "+keyword);
            console.log("Retrieved "+snapshot.numChildren()+" coach");
            //console.log("Retrieved objects "+JSON.stringify(coachList));

            if(snapshot.numChildren()==0){
              deferred.reject("No results");
              return deferred.promise;
              //deferred.resolve(coachList);
            }

          deferred.resolve(delta);

        });
      }else if(endAt&&(filter=='verified')){
        console.log("Number of coaches retrieved: " + endAt);
        console.log(filter);

        skillRef.orderByChild(filter).equalTo(true).limitToLast(endAt).on("value", function(snapshot) {
          var delta = [];
          snapshot.forEach(function(childSnapshot) {
              var tempHolder = childSnapshot.val();
              tempHolder.key = childSnapshot.key();

              var currentTime = (new Date()).getTime();
              var expiryTime = currentTime - activeDuration;
              console.log("current time "+ currentTime);
              if(tempHolder.hasOwnProperty('location')){
                console.log(tempHolder.location.time + " vs " + expiryTime);
              if(tempHolder.location.time>expiryTime){
                delta.push(tempHolder);
              }
            }
              //delta.push(childSnapshot.val());
              //console.log(childSnapshot.key());
          });
            var coachList = delta;
            console.log("Searching for "+keyword);
            console.log("Retrieved "+snapshot.numChildren()+" coach");
            //console.log("Retrieved objects "+JSON.stringify(coachList));

            if(snapshot.numChildren()==0){
              deferred.reject("No results");
              return deferred.promise;
              //deferred.resolve(coachList);
            }
          deferred.resolve(delta);

        });
      }else {

        skillRef.on("value", function(snapshot) {
            var coachList = snapshot.val();
            console.log("Searching for "+keyword);
            console.log("Retrieved "+snapshot.numChildren()+" coach");
            //console.log("Retrieved objects "+JSON.stringify(coachList));

            if(snapshot.numChildren()==0){
              deferred.reject("No results");
              return deferred.promise;
              //deferred.resolve(coachList);
            }


            //key will be lost after converting to array
            //store the key as a property
            coachList = Utilities.convertToArrayWithKey(coachList);

            deferred.resolve(coachList);

        });
      }

      return deferred.promise;
  }

  //retrieves all info about this coach
  function getCoach(coachId) {
      var deferred = $q.defer();

      var coachRef = fb.child("users").child(coachId);
      //any kind of sorting to be done?
      coachRef.on("value", function(snapshot) {
          var coach = snapshot.val();

          if(coach===null){
            deferred.resolve(coach);
          }

          deferred.resolve(coach);
      });

      return deferred.promise;
  }

  function getCoachAlias(coachId) {
      var deferred = $q.defer();

      var coachRef = fb.child("users").child(coachId).child("alias");
      //any kind of sorting to be done?
      coachRef.on("value", function(snapshot) {
          var coachAlias = snapshot.val();

          if(coachAlias===null){
            deferred.resolve(coachAlias);
          }

          deferred.resolve(coachAlias);
      });

      return deferred.promise;
  }


  function getCoachCount(keyword, level) {
      var deferred = $q.defer();

      var skillRef = fbCountry.child("userskills").child(keyword).child("general");
      //any kind of sorting to be done?

      skillRef.once("value", function(snapshot) {
          var count = snapshot.numChildren();
          console.log("test");
          console.log(count);
          //console.log("Searching for "+keyword);
          //console.log("Up to "+snapshot.numChildren()+" coach available");
          deferred.resolve(count);
      });


      return deferred.promise;
  }

  function getCoachName(coachId) {
      var deferred = $q.defer();

      var coachRef = fb.child("users").child(coachId).child("name");
      //any kind of sorting to be done?
      coachRef.once("value", function(snapshot) {
          var coachName = snapshot.val();

          if(coachName===null){
            deferred.resolve(coachName);
          }

          deferred.resolve(coachName);
      });

      return deferred.promise;
  }

  function getCoachFace(coachId) {
      var deferred = $q.defer();

      var coachRef = fb.child("users").child(coachId).child("face");
      //any kind of sorting to be done?
      coachRef.once("value", function(snapshot) {
          var coachFace = snapshot.val();

          if(coachFace===null){
            deferred.resolve(coachFace);
          }

          deferred.resolve(coachFace);
      });

      return deferred.promise;
  }

  function getCoachViews(coachId) {
      var deferred = $q.defer();

      var coachRef = fb.child("viewed").child(coachId);
      //any kind of sorting to be done?
      coachRef.once("value", function(snapshot) {
          var views = snapshot.numChildren();
          console.log("Coach has "+views+" views");
          if(views===null){
            deferred.resolve(0);
          }

          deferred.resolve(views);
      });

      return deferred.promise;
  }

  function getCoachRating(coachId) {
      var deferred = $q.defer();

      var sumRating = 0;

      var coachRef = fb.child("reviews").child(coachId);
      //any kind of sorting to be done?
      coachRef.once("value", function(snapshot) {
          var count = snapshot.numChildren();
          var ratings = snapshot.val();

          for(var k in ratings) {
            if(ratings.hasOwnProperty(k)){
                sumRating += ratings[k].rating;
            }
          }

          var avgRating = sumRating/count;
          var result = {"rating": avgRating,"count":count};


          console.log("Calculating ratings",avgRating);
          if(ratings===null){
            result = {"rating": 3,"count":0};
            deferred.resolve(result);
          }


          deferred.resolve(result);
      });

      return deferred.promise;
  }

  function getCoachRatingCounts(coachId) {
      var deferred = $q.defer();

      var coachRef = fb.child("reviews").child(coachId);
      //any kind of sorting to be done?
      coachRef.once("value", function(snapshot) {
          var views = snapshot.numChildren();
          console.log("Coach has "+views+" ratings");
          if(views===null){
            deferred.resolve(0);
          }

          deferred.resolve(views);
      });

      return deferred.promise;
  }

  return {
    checkIfExistingSubject: checkIfExistingSubject,
    getAvailableLevels : getAvailableLevels,
    getCoaches : getCoaches,
    getCoachesByLevel : getCoachesByLevel,
    getCoach: getCoach,
    getCoachAlias: getCoachAlias,
    getCoachCount: getCoachCount,
    getCoachName : getCoachName,
    getCoachFace : getCoachFace,
    getCoachViews : getCoachViews,
    getCoachRating : getCoachRating,
    getCoachRatingCounts : getCoachRatingCounts,
    //for use with firebase
    fbUserHasThisSkill: function(user, skillName, level) {
      //Performs a check to see if user has a particular skill
      skillName = skillName.toUpperCase();

      for(var k in user.skills) {
        if(user.skills.hasOwnProperty(k)){
          if (k.toUpperCase() === skillName) {
            if(typeof user.skills[k][level] !== 'undefined') {
              return true;
            }
          }
        }

      }

      return false;
    },
    //Updates all the user's UserSkill objects with the new user Name (Not the same as alias)
    updateName: function(userid, newName) {
      var sameCountry = false;
      //Retrieve user userskills
      var userRef = fb.child("users").child(userid).child("skills");
      userRef.on("value", function(snapshot){
          var userSkillList = snapshot.val();
          console.log("Retrieved all of user's skills");

          angular.forEach(userSkillList, function(levels, subject){
            if(userSkillList.hasOwnProperty(subject)){

                var userSkillRef = fbCountry.child("userskills").child(subject).child("general").child(userid);
                userSkillRef.once("value").then(function(snapshot) {
                  sameCountry = snapshot.child("name").exists();
                }).then(function(){
                  if(sameCountry){

                    userSkillRef.update({'name': newName}, function(){
                      console.log("Updated name for "+subject);
                    });
                    //specific level update
                    angular.forEach(userSkillList[subject], function(rate, level){
                      if(userSkillList[subject].hasOwnProperty(level)&&(level!='trial')){

                        var levelSkillRef = fbCountry.child("userskills").child(subject).child(level).child(userid);
                        levelSkillRef.update({'name': newName}, function(){
                          console.log("Updated name for "+level);
                        });
                      }
                    });

                  }
                });


            }
          });

/*
          for(var subject in userSkillList) {
            if(userSkillList.hasOwnProperty(subject)){

                var userSkillRef = fb.child("userskills").child(subject).child("general").child(userid);
                userSkillRef.update({'name': newName}, function(){
                  console.log("Updated name for "+subject);
                });
                //specific level update
                for(var level in userSkillList[subject]){
                  if(userSkillList[subject].hasOwnProperty(level)&&(level!='trial')){

                    var levelSkillRef = fb.child("userskills").child(subject).child(level).child(userid);
                    levelSkillRef.update({'name': newName}, function(){
                      console.log("Updated name for "+level);
                    });
                  }
                }

            }

          }
*/
          console.log("Completed updating names for all skills of "+userid);
          return true;
      });
      return false;
    },
    //Updates all the user's UserSkill objects with the user's verification status
    //true or false
    updateVerified: function(userid, newVerified) {
      //Retrieve user userskills
      var userRef = fb.child("users").child(userid).child("skills");
      var sameCountry = false;
      userRef.on("value", function(snapshot){
          var userSkillList = snapshot.val();
          console.log("Retrieved all of user's skills");

          angular.forEach(userSkillList, function(levels, subject){
            if(userSkillList.hasOwnProperty(subject)){

                var userSkillRef = fbCountry.child("userskills").child(subject).child("general").child(userid);

                userSkillRef.once("value").then(function(snapshot) {
                  sameCountry = snapshot.child("name").exists();
                  //need to make sure doesnt add a child in wrong country userskills
                }).then(function(){
                  if(sameCountry){
                    userSkillRef.update({'verified': newVerified}, function(){
                      console.log("Updated verification status for "+subject);
                    });

                    //specific level update
                    angular.forEach(userSkillList[subject], function(rate, level){
                      if(userSkillList[subject].hasOwnProperty(level)&&(level!='trial')){

                        var levelSkillRef = fbCountry.child("userskills").child(subject).child(level).child(userid);
                        levelSkillRef.update({'verified': newVerified}, function(){
                          //console.log("Updated verification status at "+level);
                        });
                      }
                    });

                  }
                });


            }
          });

/*
          for(var subject in userSkillList) {
            if(userSkillList.hasOwnProperty(subject)){

                var userSkillRef = fb.child("userskills").child(subject).child("general").child(userid);
                userSkillRef.update({'verified': newVerified}, function(){
                  console.log("Updated verification status for "+subject);
                });

                //specific level update
                for(var level in userSkillList[subject]){
                  if(userSkillList[subject].hasOwnProperty(level)&&(level!='trial')){

                    var levelSkillRef = fb.child("userskills").child(subject).child(level).child(userid);
                    levelSkillRef.update({'verified': newVerified}, function(){
                      //console.log("Updated verification status at "+level);
                    });
                  }
                }

            }


          }
*/
          console.log("Completed updating profile pic for all skills of "+userid);
          return true;
      });
      return false;
    },
    //Updates all the user's UserSkill objects with the user last online time
    updateTime: function(userid, newTime) {
      //Retrieve user userskills
      var deferred = $q.defer();
      var userRef = fb.child("users").child(userid).child("skills");
      var sameCountry = false;

      userRef.on("value", function(snapshot){
          var userSkillList = snapshot.val();
          console.log("Retrieved all of user's skills");
          //angular.forEach needed

          angular.forEach(userSkillList, function(levels, subject){
            if(userSkillList.hasOwnProperty(subject)){

                var userSkillRef = fbCountry.child("userskills").child(subject).child("general").child(userid).child('location');

                userSkillRef.once("value").then(function(snapshot) {
                  sameCountry = snapshot.child("name").exists();
                }).then(function(){

                  if(sameCountry){

                    userSkillRef.update({'time': newTime}, function(){
                      console.log("Updated time for "+subject+" to "+JSON.stringify(newTime));
                    });

                    //specific level update
                    angular.forEach(userSkillList[subject], function(rate, level){
                      if(userSkillList[subject].hasOwnProperty(level)&&(level!="trial")){

                        var levelSkillRef = fbCountry.child("userskills").child(subject).child(level).child(userid).child('location');
                        levelSkillRef.update({'time': newTime}, function(){
                          //console.log("Updated time at "+level);
                        });
                      }
                    });
                  }
                });


            }
          });

          /*
          for(var subject in userSkillList) {
            if(userSkillList.hasOwnProperty(subject)){

                var userSkillRef = fb.child("userskills").child(subject).child("general").child(userid).child('location');
                userSkillRef.update({'time': newTime}, function(){
                  console.log("Updated time for "+subject+" to "+JSON.stringify(newTime));
                });

                //specific level update
                for(var level in userSkillList[subject]){
                  if(userSkillList[subject].hasOwnProperty(level)&&(level!="trial")){

                    var levelSkillRef = fb.child("userskills").child(subject).child(level).child(userid).child('location');
                    levelSkillRef.update({'time': newTime}, function(){
                      //console.log("Updated time at "+level);
                    });
                  }
                }

            }


          }
          */
          console.log("Completed updating profile pic for all skills of "+userid);
          deferred.resolve(true);
      });
      return deferred.promise;
    },
    //Updates all the user's UserSkill objects with the new user profile pic
    updateFace: function(userid, newImage) {
      var sameCountry = false;
      //Retrieve user userskills
      var userRef = fb.child("users").child(userid).child("skills");
      userRef.on("value", function(snapshot){
          var userSkillList = snapshot.val();
          console.log("Retrieved all of user's skills");

          angular.forEach(userSkillList, function(levels, subject){
            if(userSkillList.hasOwnProperty(subject)){

                var userSkillRef = fbCountry.child("userskills").child(subject).child("general").child(userid);
                userSkillRef.once("value").then(function(snapshot) {
                  sameCountry = snapshot.child("name").exists();
                }).then(function(){
                  if(sameCountry){

                    userSkillRef.update({'face': newImage}, function(){
                      console.log("Updated face for "+subject);
                    });

                    //specific level update
                    angular.forEach(userSkillList[subject], function(rate, level){
                      if(userSkillList[subject].hasOwnProperty(level)&&(level!='trial')){

                        var levelSkillRef = fbCountry.child("userskills").child(subject).child(level).child(userid);
                        levelSkillRef.update({'face': newImage}, function(){
                          //console.log("Updated face at "+level);
                        });
                      }
                    });

                  }
                });

            }
          });
/*
          for(var subject in userSkillList) {
            if(userSkillList.hasOwnProperty(subject)){

                var userSkillRef = fb.child("userskills").child(subject).child("general").child(userid);
                userSkillRef.update({'face': newImage}, function(){
                  console.log("Updated face for "+subject);
                });

                //specific level update
                for(var level in userSkillList[subject]){
                  if(userSkillList[subject].hasOwnProperty(level)&&(level!='trial')){

                    var levelSkillRef = fb.child("userskills").child(subject).child(level).child(userid);
                    levelSkillRef.update({'face': newImage}, function(){
                      //console.log("Updated face at "+level);
                    });
                  }
                }

            }


          }
*/
          console.log("Completed updating profile pic for all skills of "+userid);
          return true;
      });
      return false;
    },
    //Updates all the user's UserSkill objects with the new user location
    updateLocations: function(userid, newLocation) {
      var deferred = $q.defer();
      var sameCountry = false;
      //Retrieve user userskills
      var userRef = fb.child("users").child(userid).child("skills");
      userRef.on("value", function(snapshot){
          var userSkillList = snapshot.val();
          console.log("Retrieved all of user's skills");

          angular.forEach(userSkillList, function(levels, subject){
            if(userSkillList.hasOwnProperty(subject)){

                var userSkillRef = fbCountry.child("userskills").child(subject).child("general").child(userid);
                userSkillRef.once("value").then(function(snapshot) {
                  sameCountry = snapshot.child("name").exists();
                }).then(function(){
                  if(sameCountry){
              //geofire preparation
                    var geofire = {};
                    var geoHashLoc = {};

                    geofire[0] = newLocation.lat;
                    geofire[1] = newLocation.lon;

                    geoHashLoc = geohash.encode(newLocation.lat,newLocation.lon);


                    userSkillRef.update({'location': newLocation, 'g': geoHashLoc}, function(){
                      //general level update
                      console.log("Updated location for "+subject+" with geofire "+geoHashLoc+" at "+geofire[0]);
                    });




                    //specific level update
                    angular.forEach(userSkillList[subject], function(rate, level){
                      if(userSkillList[subject].hasOwnProperty(level)&&(level!='trial')){

                        var levelSkillRef = fbCountry.child("userskills").child(subject).child(level).child(userid);

                        levelSkillRef.update({'location': newLocation, 'g': geoHashLoc}, function(){
                          console.log("Updated location for "+subject+": "+level+" with "+geoHashLoc);
                        });

                      }
                    });
                  }

                });


              }

          });

/*
          for(var subject in userSkillList) {
            if(userSkillList.hasOwnProperty(subject)){

                var userSkillRef = fb.child("userskills").child(subject).child("general").child(userid);
                //geofire preparation
                var geofire = {};
                var geoHashLoc = {};

                geofire[0] = newLocation.lat;
                geofire[1] = newLocation.lon;

                geoHashLoc = geohash.encode(newLocation.lat,newLocation.lon);

                userSkillRef.update({'location': newLocation, 'g': geoHashLoc}, function(){
                  //general level update
                  console.log("Updated location for "+subject+" with geofire "+geoHashLoc+" at "+geofire[0]);

                });

                //specific level update
                for(var level in userSkillList[subject]){
                  if(userSkillList[subject].hasOwnProperty(level)&&(level!='trial')){

                    var levelSkillRef = fb.child("userskills").child(subject).child(level).child(userid);
                    levelSkillRef.update({'location': newLocation, 'g': geoHashLoc}, function(){
                      console.log("Updated location for "+subject+": "+level+" with "+geoHashLoc);

                    });


                  }
                }

            }

          }
          */
          console.log("Completed updating location for all skills of "+userid);
          deferred.resolve(true);

      });
      return deferred.promise;
    },
    //Updates all the user's UserSkill objects with the new user ratings
    updateRatings: function(userid, newRating) {
      //Retrieve user userskills
      var userRef = fb.child("users").child(userid).child("skills");
      var sameCountry = false;
      userRef.on("value", function(snapshot){
          var userSkillList = snapshot.val();
          console.log("Retrieved all of user's skills");
          angular.forEach(userSkillList, function(levels, subject){
            if(userSkillList.hasOwnProperty(subject)){

                var userSkillRef = fbCountry.child("userskills").child(subject).child("general").child(userid);

                userSkillRef.once("value").then(function(snapshot) {
                  sameCountry = snapshot.child("name").exists();
                }).then(function(){
                  if(sameCountry){
                    userSkillRef.update({'rating': newRating}, function(){
                      console.log("Updated ratings for "+subject+" to "+newRating);
                    });

                    angular.forEach(userSkillList[subject], function(rate, level){
                      if(userSkillList[subject].hasOwnProperty(level)&&(level!='trial')){

                        var levelSkillRef = fbCountry.child("userskills").child(subject).child(level).child(userid);
                        levelSkillRef.update({'rating': newRating}, function(){
                          console.log("Updated ratings for "+subject+" level "+level);
                        });
                      }

                    });
                  }
                });


            }

          });

/*
          for(var subject in userSkillList) {
            if(userSkillList.hasOwnProperty(subject)){

                var userSkillRef = fb.child("userskills").child(subject).child("general").child(userid);
                userSkillRef.update({'rating': newRating}, function(){
                  console.log("Updated ratings for "+subject);
                });

                for(var level in userSkillList[subject]){
                  if(userSkillList[subject].hasOwnProperty(level)&&(level!='trial')){

                    var levelSkillRef = fb.child("userskills").child(subject).child(level).child(userid);
                    levelSkillRef.update({'rating': newRating}, function(){
                      //console.log("Updated ratings at "+subject+": "+level);
                    });


                  }
                }


            }

          }
          */
          console.log("Completed updating ratings for all skills of "+userid);
          return true;
      });
      return false;
    },

  }

})


.factory('imageUploader', ['$rootScope', '$q', '$cordovaCamera', function($rootScope, $q) {
  return {
    getPicture: function(options) {

      /*
       * This first branch has been created to open the posibility of browser
       * testing as the current cordovaCamera is just available on emulators
       */

      if (false) {

        // create file input without appending to DOM
        // var fileInput = document.createElement('input');
        // fileInput.setAttribute('type', 'file');
        //
        // fileInput.onchange = function() {
        //
        //   var file   = fileInput.files[0],
        //       reader = new FileReader();
        //
        //   reader.readAsDataURL(file);
        //   reader.onloadend = function onloadend () {
        //     $rootScope.$apply(function() {
        //       // strip beginning from string
        //       var encodedData = reader.result.replace(/data:image\/jpeg;base64,/, '');
        //       deferred.resolve(encodedData);
        //     });
        //   };
        // };
        //
        // fileInput.click();

      } else {

        var deferred = $q.defer();

        var defaultOptions = {
          quality:          75,
          destinationType:  Camera.DestinationType.DATA_URL,
          sourceType:       Camera.PictureSourceType.PHOTOLIBRARY,
          allowEdit:        true,
          encodingType:     Camera.EncodingType.JPEG,
          targetWidth:      640,
          targetHeight:     640
        };

        cameraOptions = angular.extend(defaultOptions, options);

        var cameraSuccess = function(imageData) {
          $rootScope.$apply(function() {
            deferred.resolve(imageData);
          });
        };

        var cameraError = function(message) {
          $rootScope.$apply(function() {
            deferred.reject(message);
          });
        };

        navigator.camera.getPicture(cameraSuccess, cameraError, cameraOptions);

      }

      return deferred.promise;
    }
  };

}])

.factory('Utilities', function($q, $rootScope) {

  var gifCache = false;

  //generate random token string
  function randomGif() {

    var gif = "img/gif/loading_flying.gif";

    return gif;
  }


  function getAliasCount() {
      var deferred = $q.defer();

      var aliasRef = fb.child("alias");
      //any kind of sorting to be done?

      aliasRef.once("value", function(snapshot) {
          var count = snapshot.numChildren();
          //console.log("Searching for "+keyword);
          //console.log("Up to "+snapshot.numChildren()+" coach available");
          deferred.resolve(count);
      });


      return deferred.promise;
  }

  function getChatCount() {
      var deferred = $q.defer();

      var chatRef = fb.child("chats");
      //any kind of sorting to be done?

      chatRef.once("value", function(snapshot) {
          var count = snapshot.numChildren();
          //console.log("Searching for "+keyword);
          //console.log("Up to "+snapshot.numChildren()+" coach available");
          deferred.resolve(count);
      });


      return deferred.promise;
  }

  function summariseRequestStatus(requests) {
    var numOfRequests = 0;
    var numOfRequestsHaveFoundTutors = 0;

    //do something to the gigs
    for(var k in requests) {
      if(requests.hasOwnProperty(k)){
        numOfRequests++;

        if(requests[k].foundTutor){
          console.log("Request "+k+" Found Tutor");
          numOfRequestsHaveFoundTutors++;
        } else {
          console.log("Request "+k);
        }
      }

    }
    return {"userMadeRequests": numOfRequests, "userFoundTutors": numOfRequestsHaveFoundTutors};

  }

  function checkIfAlphanumericViolation(text){
      //var outcome = true;
      var testArray = text.split('');
      //break the text into individual arrays
      //run through and test each char
      for(var i in testArray){

        if( /[^a-zA-Z0-9\-\/]/.test( testArray[i] ) ) {
            console.log('Input '+testArray[i]+' is not alphanumeric');
            return testArray[i];
        }
      }


      return null;

  }

  function checkIfExistingAlias(alias){
      var deferred = $q.defer();

      var userAliasRef = fb.child('alias/'+alias);

      userAliasRef.on("value", function(snapshot) {
        var userData = snapshot.val();
        //console.log("Retrieved user with alias "+userData);
        var existing = (snapshot.val() !== null);
        //console.log("Existing user? "+existing);

        if(existing){
          deferred.resolve(userData.uid);
        } else {
          deferred.resolve(null);
        }

      });

      return deferred.promise;
  }


  function checkIfHaveSchedule(schedule){
    //loops through a schedule object to look for any "true" value
    outerloop:

    for(var k in schedule) {
      if(schedule.hasOwnProperty(k)){

        //console.log(schedule[k]);
        var intermediate = JSON.stringify(schedule[k]);
        var n = intermediate.indexOf("true");
        //console.log(intermediate+" with n value "+n);

        if(n>-1){
          return true;
          break outerloop;
        }

      }

    }

    return false;

  }

  //generate random token string
  function randomString(length) {
    var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result = '';
    for(var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
  }

  function convertToArrayWithKey(json) {
    //var output = JSON.parse(JSON.stringify(json));
    //loop through an attach the key as a value property
    for(var k in json) {
      if(json.hasOwnProperty(k)){
          json[k].key = k;
      }
    }
    //console.log("After key addition: "+JSON.stringify(json));
/*
    angular.forEach(json, function(k){
      if(json.hasOwnProperty(k)){
        json[k].key = k;
      }
    });
*/
    //convert objects to an array and return the result
    return Object.keys(json).map(function(k) { return json[k] });
  }

  //commonly used with ratings
  function makeArrayOfSize(rating) {
    var results = [];
    for(var i=0; i<rating; i++){
      results.push(i);
    }

    return results;
  }

  function b64toBlob(b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    //var byteCharacters = atob(b64Data);
    var byteCharacters = decodeURIComponent(escape(window.atob(b64Data)));
    var byteArrays = [];

    for(var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);

        var byteNumbers = new Array(slice.length);
        for(var i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        var byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, {type: contentType});
    return blob;
  }

  function dataURItoBlob(dataURI, callback) {
      // convert base64 to raw binary data held in a string
      // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
      var byteString = atob(dataURI.split(',')[1]);

      // separate out the mime component
      var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

      // write the bytes of the string to an ArrayBuffer
      var ab = new ArrayBuffer(byteString.length);
      var ia = new Uint8Array(ab);
      for(var i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
      }

      // write the ArrayBuffer to a blob, and you're done
      var bb = new Blob([ab]);
      return bb;
  }

  //shortens long writeup text
  function TextAbstract(text, length) {
      if (text == null) {
          return "";
      }
      if (text.length <= length) {
          return text;
      }
      text = text.substring(0, length);
      last = text.lastIndexOf(" ");
      text = text.substring(0, last);
      return text + "...";
  }

  function showAlert(title,text) {
    //Uses Cordova Dialog Plugin
    if(window.cordova){
      navigator.notification.alert(
          text,  // message
          null,  // callback
          title, // title
          'OK'   // buttonName
      );
    } else {
      console.log("Alert says "+text);
    }

  }
  //ES6
  //function filterUserWriteup(text="",response="Contact me via 'Ask Me' button below") {
  function filterUserWriteup(text, replacementText) {
    var response = replacementText;
    //remove phone numbers
    //remove websites
    var violation = false;
    var replace = text;

    var regex0=new RegExp(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b/i);
    if (regex0.test(text))
      {
        violation = true;
        //console.log("Email address!");
        replace = replace.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b/i, response);
      //"Text appears to have email address in it (not allowed\n";
      }


    var regex1=new RegExp(/\b(@|www|WWW|http|hotmail|gmail|.com|fuck|cheebye|CB)\b/i);
    if (regex1.test(text))
       {
        violation = true;
        //console.log("Email address and website!");
        replace = replace.replace(/\b[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&/=]*)?/g, response);
       //"Text appears to have disallowed words (e.g. profanity, email, web address, @ symbol, etc.)\n";
       }

    var regex2=new RegExp(/\b\d{4}[-.\s]?\d{4}[-.]?/i);
    if (regex2.test(text))
      {
        violation = true;
        //console.log("Phone Number!");
        replace = replace.replace(/\b\d{4}[-.\s]?\d{4}[-.]?/i, response);
        //replace = replace.replace(/\b\d{4}[-.]?\d{4}[-.]?/i, response);
      //"Text appears to have a phone number in it (not allowed)\n";
      }
    //console.log("Violation happened? "+violation);

    return replace;
  };

  //ES6
  //function filterUserWriteupLength(text="",response="Your writeup is too short to display.") {
  function filterUserWriteupLength(text) {
    //complain about short writeups
    var response = "Your writeup is too short to display.";

    var replace = text;

    var defaultText = "Short writeup about myself";

    if(replace.length<=defaultText.length){
      replace = response;
    }

    return replace;
  };

  function getCountryOptions(needArray){
    var countryOptions = {

      "65":{name:'Singapore', flag:'img/countries/Singapore.png', value:65, currency:"$"},
      "60":{name:'Malaysia', flag:'img/countries/Malaysia.png', value:60, currency:"RM"}
      //"66":{name:'Thailand', flag:'img/countries/Thailand.png', value:66}

    };

    if(needArray){
      return convertToArrayWithKey(countryOptions);
    }

    return countryOptions;
  };

  function getCurrentCountry(){

    return JSON.parse(storage.getItem("defaultCountry"));

  }

  function setCountry(){

    //retrieve country from storage or fb

    var deferred = $q.defer();
    //console.log("setCountry1 "+JSON.stringify($rootScope.defaultCountry));

    if(getCurrentCountry() == null){

      var userid = fb.getAuth().uid;

            //go to firebase, to get the country value, then overwrite the local storage
            console.log("Storage country not found, getting country from fb")
            var userLocRef = fb.child("users/"+userid+"/defaultcountry");
            var locExists = null;
            var loc = null;

            userLocRef.once("value", function(snapshot){

              locExists = snapshot.exists();
              loc = snapshot.val();

            }).then(function(){
              if(locExists){
                //update loc to storage
                storage.setItem("defaultCountry", JSON.stringify(loc));

              }else{
                loc = {name:'Singapore', flag:'img/countries/Singapore.png', value:65, currency:"$"};
                storage.setItem("defaultCountry", JSON.stringify(loc));
              }
            }).then(function(){

              if(loc.value != 65){
                fbCountry = fb.child(loc.value);
                console.log("fbcountry "+fbCountry);
              }
              deferred.resolve();

            });
    }else{

      if(getCurrentCountry().value != 65){
        fbCountry = fb.child(getCurrentCountry().value);
        console.log("fbcountry "+fbCountry)
      };
      //stick to default fb for 65

      deferred.resolve();
    }



        return deferred.promise;

  }

function setPermissions(){

var deferred = $q.defer();

  console.log("setPermission for "+getCurrentCountry().value);
  var PermissionsRef = fb.child("permissions").child(getCurrentCountry().value);

  PermissionsRef.on("value", function(snapshot) {
    $rootScope.paymentStatus = snapshot.val().payment.status;
    console.log('paymentStatus: '+ $rootScope.paymentStatus);

    if($rootScope.paymentStatus == "live"){
      window.Stripe.setPublishableKey('pk_live_PDbsw8vIknLgarPJaVqAz1ZV');
    }else {
      window.Stripe.setPublishableKey('pk_test_6PfENnEhnVWECPsnuuT3cp2d');
    }

    $rootScope.showWorkshops = snapshot.val().workshop.v186;
    console.log('showWorkshops: '+ $rootScope.showWorkshops);

    deferred.resolve();
  });

  return deferred.promise;

}

  return {
    randomGif: randomGif,
    getAliasCount: getAliasCount,
    getChatCount: getChatCount,
    summariseRequestStatus: summariseRequestStatus,
    checkIfAlphanumericViolation: checkIfAlphanumericViolation,
    checkIfExistingAlias: checkIfExistingAlias,
    checkIfHaveSchedule: checkIfHaveSchedule,
    randomString : randomString,
    convertToArrayWithKey : convertToArrayWithKey,
    makeArrayOfSize : makeArrayOfSize,
    b64toBlob: b64toBlob,
    dataURItoBlob: dataURItoBlob,
    TextAbstract: TextAbstract,
    showAlert: showAlert,
    filterUserWriteup: filterUserWriteup,
    filterUserWriteupLength: filterUserWriteupLength,
    getCountryOptions: getCountryOptions,
    getCurrentCountry: getCurrentCountry,
    setCountry: setCountry,
    setPermissions: setPermissions

  };

})

.factory('Workshops', function($q) {

  function getWorkshopLocation(workshopId, workshopCategory){
    var deferred = $q.defer();

    var WorkshopRef = fb.child("workshops/"+workshopCategory+"/"+workshopId+"/location");
    WorkshopRef.on("value", function(snapshot) {
      var location = snapshot.val();
      deferred.resolve(location);
    })
    return deferred.promise;
  }

  function getWorkshop(workshopId, workshopCategory){
    var deferred = $q.defer();
    var WorkshopRef = fb.child("workshops/"+workshopCategory+"/"+workshopId);
    WorkshopRef.on("value", function(snapshot) {
      var results = snapshot.val();
      //console.log(results);
      //results.key = snapshot.key();
      deferred.resolve(results);
    })
    return deferred.promise;
  }

  function getUserBooking(userId, workshopBookingId){
    console.log(workshopBookingId);
    var deferred = $q.defer();
     var WorkshopBookingRef = fb.child("workshopBookings/users/"+userId+"/"+workshopBookingId);
    WorkshopBookingRef.on("value", function(snapshot) {
      var results = snapshot.val();
      results.key = snapshot.key();
      results.RegistrationCode = workshopBookingId
      results.studentID = userId
      console.log(results);
      deferred.resolve(results);
    })
    return deferred.promise;
  }

  return{
    getWorkshopLocation: getWorkshopLocation,
    getWorkshop: getWorkshop,
    getUserBooking: getUserBooking
  }
})
