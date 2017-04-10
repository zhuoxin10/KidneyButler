// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('kidney',['ionic','kidney.services','kidney.controllers','kidney.directives','kidney.filters','ngCordova'])

.run(function($ionicPlatform, $state, Storage, $location, $ionicHistory, $ionicPopup,$rootScope) {
  $ionicPlatform.ready(function() {


    var isSignIN=Storage.get("isSignIN");
    if(isSignIN=='YES'){
      $state.go('tab.tasklist');
    }

    $rootScope.conversation = {
            type: null,
            id: ''
        }
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
    if (window.JPush) {
        window.JPush.init();
    }
    if (window.JMessage) {
        // window.Jmessage.init();
        JM.init();
        window.JMessage.login('18868800011', '123456',
        function(response) {
            window.JMessage.username = '18868800011';
            //gotoConversation();
        },
        function(err) {
            console.log(err);
            // JM.register($scope.useruserID, $scope.passwd);
        });
        document.addEventListener('jmessage.onOpenMessage', function(msg) {
            console.info('[jmessage.onOpenMessage]:');
            console.log(msg);
            $state.go('tab.chat-detail', { chatId: msg.fromName, fromUser: msg.fromUser });
        }, false);
        document.addEventListener('jmessage.onReceiveMessage', function(msg) {
            console.info('[jmessage.onReceiveMessage]:');
            console.log(msg);
            $rootScope.$broadcast('receiveMessage', msg);
            if (device.platform == "Android") {
                // message = window.JMessage.message;
                // console.log(JSON.stringify(message));
            }
        }, false);
        document.addEventListener('jmessage.onReceiveCustomMessage', function(msg) {
            console.log('[jmessage.onReceiveCustomMessage]: ' + msg);
            // $rootScope.$broadcast('receiveMessage',msg);
            if (msg.targetType == 'single' && msg.fromID != $rootScope.conversation.id) {
                if (device.platform == "Android") {
                    window.plugins.jPushPlugin.addLocalNotification(1, '本地推送内容test', msg.content.contentStringMap.type, 111, 0, null)
                        // message = window.JMessage.message;
                        // console.log(JSON.stringify(message));
                } else {
                    window.plugins.jPushPlugin.addLocalNotificationForIOS(0, msg.content.contentStringMap.type + '本地推送内容test', 1, 111, null)
                }
            }

        }, false);

    }
    window.addEventListener('native.keyboardshow', function(e) {
        $rootScope.$broadcast('keyboardshow', e.keyboardHeight);
    });
    window.addEventListener('native.keyboardhide', function(e) {
        $rootScope.$broadcast('keyboardhide');
    });

  });
})

// --------路由, url模式设置----------------
.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  //注册与登录
  $stateProvider
    .state('signin', {
      cache: false,
      url: '/signin',
      templateUrl: 'partials/login/signin.html',
      controller: 'SignInCtrl'
    })
    .state('phonevalid', { 
      cache: false,
      url: '/phonevalid',
      templateUrl: 'partials/login/phonevalid.html',
      controller: 'phonevalidCtrl'
    })
    .state('setpassword', {
      cache:false,
      url: '/setpassword',
      templateUrl: 'partials/login/setPassword.html',
      controller: 'setPasswordCtrl'
    })
    .state('userdetail',{
      cache:false,
      url:'mine/userdetail',
      templateUrl:'partials/login/userDetail.html',
      controller:'userdetailCtrl'
    })
    .state('messages',{
      cache:false,
      url:'/messages',
      templateUrl:'partials/messages/AllMessage.html',
      controller:'messageCtrl'
    })
    .state('messagesDetail',{
      cache:false,
      url:'/messagesDetail',
      params:{messageType:null},
      templateUrl:'partials/messages/VaryMessage.html',
      controller:'VaryMessageCtrl'
    })
    .state('about',{
      cache:false,
      url:'/about',
      templateUrl:'partials/about.html',
      controller:'aboutCtrl'
    })
    .state('changePassword',{
      cache:false,
      url:'/changePassword',
      templateUrl:'partials/changePassword.html',
      controller:'changePasswordCtrl'
    });   
    
    //主页面    
  $stateProvider
    .state('tab', {
      cache:false,
      abstract: true,
      url: '/tab',
      templateUrl: 'partials/tabs/tabs.html',
      controller:'GoToMessageCtrl'
    })
    .state('tab.tasklist', {
      url: '/tasklist',
      views: {
        'tab-tasks': {
          cache:false,
          templateUrl: 'partials/tabs/task/tasklist.html',
          controller: 'tasklistCtrl'
        }
      }
    })
    .state('tab.forum', {
      url: '/forum',
      views: {
        'tab-forum': {
          cache:false,
          templateUrl: 'partials/tabs/forum.html',
          controller: 'forumCtrl'
        }
      }
    })
    .state('tab.myDoctors', {
      url: '/myDoctors',
      views: {
        'tab-consult': {
          cache:false,
          templateUrl: 'partials/tabs/consult/myDoctors.html',
          controller: 'DoctorCtrl'
        }
      }
    })
    .state('tab.consult-chat', {
      url: '/consult/chat/:docId',
      views: {
        'tab-consult': {
          cache:false,
          templateUrl: 'partials/tabs/consult/consult-chat.html',
          controller: 'ChatCtrl'
        }
      }
    })
    .state('tab.consult-chat', {
      url: '/consult/chat/:docId',
      views: {
        'tab-consult': {
          cache:false,
          templateUrl: 'partials/tabs/consult/consult-chat.html',
          controller: 'ChatCtrl'
        }
      }
    })
    .state('tab.AllDoctors', {
      url: '/AllDoctors',
      views: {
        'tab-consult': {
          cache:false,
          templateUrl: 'partials/tabs/consult/allDoctors.html',
          controller: 'DoctorCtrl'
        }
      }
    })
    .state('tab.DoctorDetail', {
      url: '/DoctorDetail',
      params:{doctorId:null},
      views: {
        'tab-consult': {
          cache:false,
          templateUrl: 'partials/tabs/consult/DoctorDetail.html',
          controller: 'DoctorDetailCtrl'
        }
      }
    })
    .state('tab.consultquestion1', {
      url: '/consultquestion1',
      views: {
        'tab-consult': {
          cache:false,
          templateUrl: 'partials/tabs/consult/consultquestion1.html',
          controller: 'consultquestionCtrl'
        }
      }
    })
    .state('tab.consultquestion2', {
      url: '/consultquestion2',
      views: {
        'tab-consult': {
          cache:false,
          templateUrl: 'partials/tabs/consult/consultquestion2.html',
          controller: 'consultquestionCtrl'
        }
      }
    })
    .state('tab.consultquestion3', {
      url: '/consultquestion3',
      views: {
        'tab-consult': {
          cache:false,
          templateUrl: 'partials/tabs/consult/consultquestion3.html',
          controller: 'consultquestionCtrl'
        }
      }
    })

    .state('tab.mine', {
        url: '/mine',
        views: {
          'tab-mine': {
            templateUrl: 'partials/tabs/mine/mine.html',
            controller: 'MineCtrl'
          }

        }
         
    })
    .state('tab.myConsultRecord', {
        url: '/mine/ConsultRecord',
        views: {
          'tab-mine': {
            templateUrl: 'partials/tabs/mine/ConsultRecord.html',
            controller: 'ConsultRecordCtrl'
          }

        }
         
    })
    .state('tab.myHealthInfo', {
        url: '/mine/HealthInfo',
        views: {
          'tab-mine': {
            templateUrl: 'partials/tabs/mine/HealthInfo.html',
            controller: 'HealthInfoCtrl'
          }

        }
         
    })
    .state('tab.myHealthInfoDetail', {
        url: '/mine/HealthInfoDetail/',
        params: {id:null},
        views: {
          'tab-mine': {
            templateUrl: 'partials/tabs/mine/editHealthInfo.html',
            controller: 'HealthDetailCtrl'
          }

        }
         
    })
     .state('tab.myMoney', {
        url: '/mine/Account/',
        views: {
          'tab-mine': {
            templateUrl: 'partials/tabs/mine/money.html',
            controller: 'MoneyCtrl'
          }

        }     
         
    })

    .state('tab.taskSet', {
        url: '/mine/taskSet/',
        views: {
          'tab-mine': {
            templateUrl: 'partials/tabs/task/taskSet.html',
            controller: 'TaskSetCtrl'
          }
        }           
    })
    
    
     .state('task', {
           url: '/task',
           abstract: true,
           template:'<ion-nav-view/>'
         })

    .state('task.r', {
        url: '/:t',   
        templateUrl: 'partials/tabs/task/taskFill.html',
        controller: 'TaskFillCtrl'     
        // templateUrl:function($stateParams)
        // {
        //   switch($stateParams.t)
        //   {
        //       case 'taskSet':return "partials/tabs/task/taskSet.html";break; //任务情况填写页面
        //       default:return "partials/tabs/task/taskFill.html";break; //任务设置页面
        //   }
        // },
        // controllerProvider:function($stateParams)
        // {
        //   switch($stateParams.t)
        //   {
        //       case 'taskSet':return "TaskSetCtrl";break;
        //       default:return "TaskFillCtrl";break;
        //   }
        // }                
      })

     //肾病保险
  $stateProvider
    .state('insurance', {
      cache: false,
      url: '/insurance',
      templateUrl: 'partials/insurance/insurance.html',
      controller: 'insuranceCtrl'
    })
    .state('intension', {
      cache: false,
      url: '/intension',
      templateUrl: 'partials/insurance/intension.html',
      controller: 'insuranceCtrl'
    })
    .state('insuranceexpense', {
      cache: false,
      url: '/insuranceexpense',
      templateUrl: 'partials/insurance/insuranceexpense.html',
      controller: 'insurancefunctionCtrl'
    })
    .state('kidneyfunction', {
      cache: false,
      url: '/kidneyfunction',
      templateUrl: 'partials/insurance/kidneyfunction.html',
      controller: 'insurancefunctionCtrl'
    })
    .state('insurancestafflogin', {
      cache: false,
      url: '/insurancestafflogin',
      templateUrl: 'partials/insurance/insurancestafflogin.html',
      controller: 'insurancestaffCtrl'
    })
    .state('insurancestaff', {
      cache: false,
      url: '/insurancestaff',
      templateUrl: 'partials/insurance/insurancestaff.html',
      controller: 'insurancestaffCtrl'
    });

  $urlRouterProvider.otherwise('/signin');



   
 



});   


 
