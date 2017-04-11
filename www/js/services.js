angular.module('kidney.services', ['ionic','ngResource'])

// 客户端配置
.constant('CONFIG', {
    appKey: 'cf32b94444c4eaacef86903e',
    baseUrl: 'http://121.43.107.106:4050/',
    cameraOptions: {
        cam: {
            quality: 60,
            destinationType: 1,
            sourceType: 1,
            allowEdit: true,
            encodingType: 0,
            targetWidth: 1000,
            targetHeight: 1000,
            popoverOptions: false,
            saveToPhotoAlbum: false
        },
        gallery: {
            quality: 60,
            destinationType: 1,
            sourceType: 0,
            allowEdit: true,
            encodingType: 0,
            targetWidth: 1000,
            targetHeight: 1000
        }
    }
})

// 本地存储函数
.factory('Storage', ['$window', function ($window) {
  return {
    set: function(key, value) {
      $window.localStorage.setItem(key, value);
    },
    get: function(key) {
      return $window.localStorage.getItem(key);
    },
    rm: function(key) {
      $window.localStorage.removeItem(key);
    },
    clear: function() {
      $window.localStorage.clear();
    }
  };
}])


// --------上传头像---------------- 
//跟我写的Camera同名了，这是旧的，不一定有用，就先注释了 XJZ

  // .factory('Camera', ['$q','$cordovaCamera','CONFIG', '$cordovaFileTransfer','Storage',function($q,$cordovaCamera,CONFIG,$cordovaFileTransfer,Storage) { //LRZ
  //   return {
  //     getPicture: function() {

  //       var options = { 
  //           quality : 75, 
  //           destinationType : 0, 
  //           sourceType : 1, 
  //           allowEdit : true,
  //           encodingType: 0,
  //           targetWidth: 300,
  //           targetHeight: 300,
  //           popoverOptions: CONFIG.popoverOptions,
  //           saveToPhotoAlbum: false
  //       };

  //      var q = $q.defer();

  //       $cordovaCamera.getPicture(options).then(function(imageData) {
  //           imgURI = "data:image/jpeg;base64," + imageData;
  //           // console.log("succeed" + imageData);
  //           q.resolve(imgURI);
  //       }, function(err) {
  //           // console.log("sth wrong");
  //           imgURI = undefined;
  //           q.resolve(err);
  //       });      
  //       return q.promise; //return a promise
  //     },

  //     getPictureFromPhotos: function(){
  //       var options = { 
  //           quality : 75, 
  //           destinationType : 0, 
  //           sourceType : 0, 
  //           allowEdit : true,
  //           encodingType: 0,
  //           targetWidth: 300,
  //           targetHeight: 300
  //       };
  //         //从相册获得的照片不能被裁减 调研~
  //      var q = $q.defer();
  //       $cordovaCamera.getPicture(options).then(function(imageData) {
  //           imgURI = "data:image/jpeg;base64," + imageData;
  //           // console.log("succeed" + imageData);
  //           q.resolve(imgURI);
  //       }, function(err) {
  //           // console.log("sth wrong");
  //           imgURI = undefined;
  //           q.resolve(err);
  //       });      
  //       return q.promise; //return a promise      
  //     },

  //     uploadPicture : function(imgURI, temp_photoaddress){
  //         // document.addEventListener('deviceready', onReadyFunction,false);
  //         // function onReadyFunction(){
  //           var uri = encodeURI(CONFIG.ImageAddressIP + "/upload.php");
  //           var photoname = Storage.get("UID"); // 取出病人的UID作为照片的名字
  //           var options = {
  //             fileKey : "file",
  //             fileName : temp_photoaddress,
  //             chunkedMode : true,
  //             mimeType : "image/jpeg"
  //           };
  //           var q = $q.defer();
  //           //console.log("jinlaile");
  //           $cordovaFileTransfer.upload(uri,imgURI,options)
  //             .then( function(r){
  //               console.log("Code = " + r.responseCode);
  //               console.log("Response = " + r.response);
  //               console.log("Sent = " + r.bytesSent);
  //               var result = "上传成功";
  //               q.resolve(result);        
  //             }, function(error){
  //               console.log(error);
  //               alert("An error has occurred: Code = " + error.code);
  //               console.log("upload error source " + error.source);
  //               console.log("upload error target " + error.target);
  //               q.resolve(error);          
  //             }, function (progress) {
  //               console.log(progress);
  //             })

  //             ;
  //           return q.promise;  
  //         // }


  //         // var ft = new FileTransfer();
  //         // $cordovaFileTransfer.upload(imgURI, uri, win, fail, options);
        
  //     },

  //   uploadPicture2: function(imgURI){
  //     document.addEventListener("deviceready", onDeviceReady, false);

  //     function onDeviceReady() {
  //    // as soon as this function is called FileTransfer "should" be defined
  //       console.log(FileTransfer);
  //       console.log(File);
  //     }
  //   }
  //   }
  // }])

//media文件操作 XJZ
.factory('fs',['$q','$cordovaFile','$filter',function($q,$cordovaFile,$filter){
    return {
        mvMedia:function(type,fileName,ext){
            return $q(function(resolve, reject) {
                if(type=='voice') var path=cordova.file.externalRootDirectory;
                else if(type=='image') var path=cordova.file.externalCacheDirectory;
                else reject("type must be voice or image");
                var time=new Date();
                var newName= $filter('date')(time,'yyyyMMddHHmmss')+ext;
                $cordovaFile.moveFile(path, fileName, cordova.file.dataDirectory,newName)
                  .then(function (success) {
                    // console.log(success);
                    resolve(success.nativeURL);
                  }, function (error) {
                    console.log(error);
                    reject(error);
                  });
              });
        }
    }

}])

//voice recorder XJZ
.factory('voice', ['$filter', '$q', '$ionicLoading', '$cordovaFile', 'CONFIG', 'Storage', 'fs', function($filter, $q, $ionicLoading, $cordovaFile, CONFIG, Storage, fs) {
    //funtion audio(){};
    var audio = {};
    audio.src = '';
    audio.media = {};

    audio.record = function(receiver, onSuccess, onError) {
        return $q(function(resolve, reject) {
            if (audio.media.src) audio.media.release();
            var time = new Date();
            audio.src = $filter('date')(time, 'yyyyMMddHHmmss') + '.amr';
            audio.media = new Media(audio.src,
                function() {
                    console.info("recordAudio():Audio Success");
                    console.log(audio.media);
                    $ionicLoading.hide();

                    fs.mvMedia('voice', audio.src, '.amr')
                        .then(function(fileUrl) {
                            console.log(fileUrl);
                            resolve(fileUrl);
                            // window.JMessage.sendSingleVoiceMessage(receiver, fileUrl, CONFIG.appKey,
                            //     function(res) {
                            //         resolve(res);
                            //     },
                            //     function(err) {
                            //         reject(err)
                            //     });
                            // resolve(fileUrl.substr(fileUrl.lastIndexOf('/')+1));
                        }, function(err) {
                            console.log(err);
                            reject(err);
                        });
                },
                function(err) {
                    console.error("recordAudio():Audio Error");
                    console.log(err);
                    reject(err);
                });
            audio.media.startRecord();
            $ionicLoading.show({ template: 'recording' });
        });
    }
    audio.stopRec = function() {
        audio.media.stopRecord();
    }
    audio.open = function(fileUrl) {
        if(audio.media.src)audio.media.release();
        return $q(function(resolve, reject) {
            audio.media = new Media(fileUrl,
                function(success) {
                    resolve(audio.media)
                },
                function(err) {
                    reject(err);
                })
        });

    }
    audio.play = function(src) {
        audio.media.play();
    }
    audio.stop = function() {
        audio.media.stop();
    }
    audio.sendAudio = function(fileUrl, receiver) {
        // return $q(function(resolve, reject) {
        window.JMessage.sendSingleVoiceMessage(receiver, cordova.file.externalRootDirectory + fileUrl, CONFIG.appKey,
            function(response) {
                console.log("audio.send():OK");
                console.log(response);
                //$ionicLoading.show({ template: 'audio.send():[OK] '+response,duration:1500});
                // resolve(response);
            },
            function(err) {
                //$ionicLoading.show({ template: 'audio.send():[failed] '+err,duration:1500});
                console.log("audio.send():failed");
                console.log(err);
                // reject(err);
            });
        // });
    }
    return audio;
}])
//jmessage XJZ
.factory('JM', ['Storage', function(Storage) {
    var ConversationList = [];
    var messageLIsts = {};

    function checkIsLogin() {
        console.log("checkIsLogin...");
        window.JMessage.getMyInfo(function(response) {
            console.log("user is login" + response);
            var myInfo = JSON.parse(response);
            window.JMessage.username = myInfo.userName;
            window.JMessage.nickname = myInfo.nickname;
            window.JMessage.gender = myInfo.mGender;
            usernameForConversation = myInfo.userName;
            // gotoConversation();
        }, function(response) {
            console.log("User is not login.");
            window.JMessage.username = "";
            window.JMessage.nickname = "";
            window.JMessage.gender = "unknown";
        });
    }

    function getPushRegistrationID() {
        try {
            window.JPush.getRegistrationID(onGetRegistrationID);
            if (device.platform != "Android") {
                window.JPush.setDebugModeFromIos();
                window.JPush.setApplicationIconBadgeNumber(0);
            } else {
                window.JPush.setDebugMode(true);
            }
        } catch (exception) {
            console.log(exception);
        }
    }

    function updateUserInfo() {
        window.JMessage.getMyInfo(
            function(response) {
                var myInfo = JSON.parse(response);
                console.log("user is login" + response);
                window.JMessage.username = myInfo.userName;
                window.JMessage.nickname = myInfo.nickname;
                window.JMessage.gender = myInfo.mGender;
                $('#myInfoUsername').val(myInfo.userName);
                $('#myInfoNickname').val(myInfo.nickname);
                $('#myInfoGender').val(myInfo.gender);
            }, null);
    }

    function getUserDisplayName() {
        if (window.JMessage.nickname.length == 0) {
            return window.JMessage.username;
        } else {
            return window.JMessage.nickname;
        }
    }

    function login() {
        var username = $("#loginUsername").val();
        var password = $("#loginPassword").val();
        window.JMessage.login(username, password,
            function(response) {
                window.JMessage.username = username;
                alert("login ok");
                gotoConversation();
            }, null);
    }

    function register(userID, passwd) {
        window.JMessage.register(userID, passwd,
            function(response) {
                console.log("login callback success" + response);
                alert("register ok");
            },
            function(response) {
                console.log("login callback fail" + response);
                alert(response);
            }
        );
    }

    function updateConversationList() {
        $('#conversationList').empty().listview('refresh');
        console.log("updateConversationList");
        window.JMessage.getConversationList(
            function(response) {
                conversationList = JSON.parse(response);
            },
            function(response) {
                alert("Get conversation list failed.");
                console.log(response);
            });
    }

    function onReceiveMessage(message) {
        console.log("onReceiveSingleMessage");
        if (device.platform == "Android") {
            message = window.JMessage.message;
            console.log(JSON.stringify(message));
        }
        // messageArray.unshift(message);
        //refreshConversation();
    }
    // function getMessageHistory(username) {
    //     $('#messageList').empty().listview('refresh');
    //     //读取的是从 0 开始的 50 条聊天记录，可按实现需求传不同的值。
    //     window.JMessage.getHistoryMessages("single", username,
    //         '', 0, 50, function (response) {
    //             console.log("getMessageHistory ok: " + response);
    //             messageArray = JSON.parse(response);
    //             refreshConversation();
    //         }, function (response) {
    //             alert("getMessageHistory failed");
    //             console.log("getMessageHistory fail" + response);
    //         }
    //     );
    // }
    // function sendMessage() {
    //     var messageContentString = $("#messageContent").val();
    //     window.JMessage.sendSingleTextMessage(
    //         usernameForConversation, messageContentString, null,
    //         function (response) {
    //             var msg = JSON.parse(response);
    //             messageArray.unshift(msg);
    //             refreshConversation();
    //         }, function (response) {
    //             console.log("send message fail" + response);
    //             alert("send message fail" + response);
    //         });
    // }
    function onGetRegistrationID(response) {
        console.log("registrationID is " + response);
        Storage.set('jid', response);
        //$("#registrationId").html(response);
    }

    function getPushRegistrationID() {
        try {
            window.JPush.getRegistrationID(onGetRegistrationID);
            if (device.platform != "Android") {
                window.JPush.setDebugModeFromIos();
                window.JPush.setApplicationIconBadgeNumber(0);
            } else {
                window.JPush.setDebugMode(true);
            }
        } catch (exception) {
            console.log(exception);
        }

    }

    function onOpenNotification(event) {
        console.log("index onOpenNotification");
        try {
            var alertContent;
            if (device.platform == "Android") {
                alertContent = event.alert;
            } else {
                alertContent = event.aps.alert;
            }
            alert("open Notification:" + alertContent);
        } catch (exception) {
            console.log("JPushPlugin:onOpenNotification" + exception);
        }
    }

    function onReceiveNotification(event) {
        console.log("index onReceiveNotification");
        try {
            var alertContent;
            if (device.platform == "Android") {
                alertContent = event.alert;
            } else {
                alertContent = event.aps.alert;
            }
            $("#notificationResult").html(alertContent);
        } catch (exception) {
            console.log(exception)
        }
    }

    function onReceivePushMessage(event) {
        try {
            var message;
            if (device.platform == "Android") {
                message = event.message;
            } else {
                message = event.content;
            }
            console.log(message);
            $("#messageResult").html(message);
        } catch (exception) {
            console.log("JPushPlugin:onReceivePushMessage-->" + exception);
        }
    }

    function onSetTagsWithAlias(event) {
        try {
            console.log("onSetTagsWithAlias");
            var result = "result code:" + event.resultCode + " ";
            result += "tags:" + event.tags + " ";
            result += "alias:" + event.alias + " ";
            $("#tagAliasResult").html(result);
        } catch (exception) {
            console.log(exception)
        }
    }

    function setTagWithAlias() {
        try {
            var username = $("#loginUsername").val();
            var tag1 = $("#tagText1").val();
            var tag2 = $("#tagText2").val();
            var tag3 = $("#tagText3").val();
            var alias = $("#aliasText").val();
            var dd = [];
            if (tag1 != "") {
                dd.push(tag1);
            }
            if (tag2 != "") {
                dd.push(tag2);
            }
            if (tag3 != "") {
                dd.push(tag3);
            }
            window.JPush.setTagsWithAlias(dd, alias);
        } catch (exception) {
            console.log(exception);
        }
    }
    return {
        init: function() {
            window.JPush.init();
            checkIsLogin();
            getPushRegistrationID();
            // document.addEventListener("jmessage.onReceiveMessage", onReceiveMessage, false);
            // document.addEventListener("deviceready", onDeviceReady, false);
            // document.addEventListener("jpush.setTagsWithAlias",
            //     onSetTagsWithAlias, false);
            // document.addEventListener("jpush.openNotification",
            //     onOpenNotification, false);
            // document.addEventListener("jpush.receiveNotification",
            //     onReceiveNotification, false);
            // document.addEventListener("jpush.receiveMessage",
            //     onReceivePushMessage, false);
        },
        register: register,
        checkIsLogin: checkIsLogin,
        getPushRegistrationID: getPushRegistrationID,
        updateUserInfo: function() {
            window.JMessage.getMyInfo(
                function(response) {
                    var myInfo = JSON.parse(response);
                    console.log("user is login" + response);
                    window.JMessage.username = myInfo.userName;
                    window.JMessage.nickname = myInfo.nickname;
                    window.JMessage.gender = myInfo.mGender;
                    $('#myInfoUsername').val(myInfo.userName);
                    $('#myInfoNickname').val(myInfo.nickname);
                    $('#myInfoGender').val(myInfo.gender);
                }, null);
        },
        getUserDisplayName: function() {
            if (window.JMessage.nickname.length == 0) {
                return window.JMessage.username;
            } else {
                return window.JMessage.nickname;
            }
        }
    }
}])
//获取图片，拍照or相册，见CONFIG.cameraOptions。return promise。xjz
.factory('Camera', ['$q','$cordovaCamera','CONFIG','fs',function($q,$cordovaCamera,CONFIG,fs) { 
  return {
    getPicture: function(type){
        return $q(function(resolve, reject) {
            $cordovaCamera.getPicture(CONFIG.cameraOptions[type]).then(function(imageUrl) {
              // file manipulation
              var tail=imageUrl.lastIndexOf('?');
              if(tail!=-1) var fileName=imageUrl.slice(imageUrl.lastIndexOf('/')+1,tail);
              else var fileName=imageUrl.slice(imageUrl.lastIndexOf('/')+1);
              fs.mvMedia('image',fileName,'.jpg')
              .then(function(res){
                console.log(res);
                //res: file URL
                resolve(res);
              },function(err){
                console.log(err);
                reject(err);
              })
          }, function(err) {
            console.log(err);
              reject('fail to get image');
          });
      })
    }
  }
}])




//--------健康信息的缓存数据--------
.factory('HealthInfo', [function () {
  var self = this;
  var HealthTable= TAFFY([
    {
      id:1,
      img:"img/healthInfo.jpg",
      type:{Name:"检查",Type:1},
      time:"2017/03/04",
      description:"血常规检查"
    },
    {
      id:2,
      img:"img/healthInfo.jpg",
      type:{Name:"用药",Type:3},
      time:"2017/01/04",
      description:"阿司匹林"
    },
     {
      id:3,
      img:"img/healthInfo.jpg",
      type:{Name:"病历",Type:4},
      time:"2016/03/04",
      description:"晕厥入院，在医院住了3天，双侧颈动脉无异常搏动，双侧颈静脉怒张，肝颈静脉回流征阳性，气管居中，甲状腺不肿大，未触及结节无压痛、震颤，上下均为闻及血管杂音。胸廓对称，桶状胸，乳房对称，无压痛及乳头分泌物，为触及包块。肋间隙增宽。"
    },
    {
      id:4,
      img:"img/healthInfo.jpg",
      type:{Name:"化验",Type:3},
      time:"2016/01/04",
      description:"尿检"
    },
    {
      id:5,
      img:"img/healthInfo.jpg",
      type:{Name:"检查",Type:1},
      time:"2016/01/01",
      description:"超声等检查我们不认其他医院的结果，几乎都要重做，因为这些结果的质量非常依赖于操作者的经验（operator-dependent），并且也取决于你做这个检查的目的——你希望找什么，才找得到什么，如果两次做目标不同，结果也可能不一样。国外喜欢把超声的图像刻成光盘拷贝给患者，以便以后再分析，可能也有拿到其他医院方便的意思。国内一般纸质报告，那上面的图是没法再分析的。"
    }
  ]);
  self.getall = function(){
    var records = new Array();
    HealthTable().each(function(r) {records.push(r)});
    return records;
  }
  self.remove = function(removeId){
    HealthTable({id:removeId}).remove();
  }
  self.edit = function(editId,editInfo){
    HealthTable({id:editId}).update({img:editInfo.imgurl,type:editInfo.label,time:editInfo.date,description:editInfo.text});
  }
  self.new = function(newInfo){
    var last = HealthTable().last();
    var number = last.id++;
    HealthTable.insert({id:number,img:newInfo.imgurl,type:newInfo.label,time:newInfo.date,description:newInfo.text});
  }
  self.search = function(searchId){
    var record = HealthTable({id:searchId}).first();
    return record;
  }
  
  return self;
}])
//--------健康信息的缓存结束---------








//数据模型
.factory('Data',['$resource', '$q','$interval' ,'CONFIG' , function($resource,$q,$interval ,CONFIG){
    var serve={};
    var abort = $q.defer();

    var Counsels = function(){
        return $resource(CONFIG.baseUrl + ':path/:route',{path:'counsel'},{
            getCounsel:{method:'GET', params:{route: 'getCounsels'}, timeout: 100000},
            questionaire:{method:'POST', params:{route: 'questionaire'}, timeout: 100000}
        });
    };

    var Patient =function(){
        return $resource(CONFIG.baseUrl + ':path/:route',{path:'patient'},{
            getPatientDetail:{method:'GET', params:{route: 'getPatientDetail'}, timeout: 100000},
            getMyDoctors:{method:'GET',params:{route:'getMyDoctors'},timeout:10000},
            getDoctorLists:{method:'GET',params:{route:'getDoctorLists'},timeout:10000},
            getCounselRecords:{method:'GET',params:{route:'getCounselRecords'},timeout:10000},
            insertDiagnosis:{method:'POST',params:{route:'insertDiagnosis'},timeout:10000},
            newPatientDetail:{method:'POST',params:{route:'newPatientDetail'},timeout:10000},
            editPatientDetail:{method:'POST',params:{route:'editPatientDetail'},timeout:10000}
        });
    }

    var Doctor =function(){
        return $resource(CONFIG.baseUrl + ':path/:route',{path:'doctor'},{
            createDoc:{method:'POST', params:{route: 'postDocBasic'}, timeout: 100000}
        });
    }

    var Health = function(){
        return $resource(CONFIG.baseUrl + ':path/:route',{path:'healthInfo'},{
            createHealth:{method:'POST', params:{route: 'insertHealthInfo'}, timeout: 100000}
        });
    }

    var Comment =function(){
        return $resource(CONFIG.baseUrl + ':path/:route',{path:'comment'},{
            getComments:{method:'GET', params:{route: 'getComments'}, timeout: 100000}
        });
    }

    var VitalSign =function(){
        return $resource(CONFIG.baseUrl + ':path/:route',{path:'vitalSign'},{
            getVitalSigns:{method:'GET', params:{route: 'getVitalSigns'}, timeout: 100000}
        });
    }

    var Account =function(){
        return $resource(CONFIG.baseUrl + ':path/:route',{path:'account'},{
            getAccountInfo:{method:'GET', params:{route: 'getAccountInfo'}, timeout: 100000}
        });
    }

    var Message =function(){
        return $resource(CONFIG.baseUrl + ':path/:route',{path:'message'},{
            getMessages:{method:'GET', params:{route: 'getMessages'}, timeout: 100000}
        });
    }

    var Communication =function(){
        return $resource(CONFIG.baseUrl + ':path/:route',{path:'communication'},{
            getCounselReport:{method:'GET', params:{route: 'getCounselReport'}, timeout: 100000},
            getTeam:{method:'GET', params:{route: 'getTeam'}, timeout: 100000},
            insertMember:{method:'POST', params:{route: 'insertMember'}, timeout: 100000},
            removeMember:{method:'POST', params:{route: 'removeMember'}, timeout: 100000}
        });
    }

    serve.abort = function ($scope) {
        abort.resolve();
        $interval(function () {
            abort = $q.defer();
            serve.Counsels = Counsels();
            serve.Patient = Patient();
            serve.Doctor = Doctor();
            serve.Health = Health();
            serve.Comment = Comment();
            serve.VitalSign = VitalSign();
            serve.Account = Account();
            serve.Message = Message();
            serve.Communication = Communication();
        }, 0, 1);
    };
    serve.Counsels = Counsels();
    serve.Patient = Patient();
    serve.Doctor = Doctor();
    serve.Health = Health();
    serve.Comment = Comment();
    serve.VitalSign = VitalSign();
    serve.Account = Account();
    serve.Message = Message();
    serve.Communication = Communication();
    return serve;
}])

.factory('Health', ['$q', 'Data', function($q, Data){
    var self = this;
    //params->{
            //  userId:'U201704010003',//unique
            //  type:1,
            //  time:'2014/02/22 11:03:37',
            //  url:'c:/wf/img.jpg',
            //  label:'abc',
            //  description:'wf',
            //  comments:''
           // }
    self.createHealth = function(params){
        var deferred = $q.defer();
        Data.Health.createHealth(
            params,
            function(data, headers){
                deferred.resolve(data);
            },
            function(err){
                deferred.reject(err);
        });
        return deferred.promise;
    };
    return self;
}])


.factory('Patient', ['$q', 'Data', function($q, Data){
    var self = this;
    //params->0:{userId:'p01'}
    self.getPatientDetail = function(params){
        var deferred = $q.defer();
        Data.Patient.getPatientDetail(
            params,
            function(data, headers){
                deferred.resolve(data);
            },
            function(err){
                deferred.reject(err);
        });
        return deferred.promise;
    };

    //params->0:{userId:'p01'}
    self.getMyDoctors = function(params){
        var deferred = $q.defer();
        Data.Patient.getMyDoctors(
            params,
            function(data, headers){
                deferred.resolve(data);
            },
            function(err){
                deferred.reject(err);
        });
        return deferred.promise;
    };

    //params->0:{workUnit:'浙江省人民医院'}
    //        1:{workUnit:'浙江省人民医院',name:'医生01'}
    self.getDoctorLists = function(params){
        var deferred = $q.defer();
        Data.Patient.getDoctorLists(
            params,
            function(data, headers){
                deferred.resolve(data);
            },
            function(err){
                deferred.reject(err);
        });
        return deferred.promise;
    };

    //params->0:{userId:'p01'}
    self.getCounselRecords = function(params){
        var deferred = $q.defer();
        Data.Patient.getCounselRecords(
            params,
            function(data, headers){
                deferred.resolve(data);
            },
            function(err){
                deferred.reject(err);
        });
        return deferred.promise;
    };

    //params->0:{
            //     patientId:'ppost01',
            //     doctorId:'doc01',
            //     diagname:'慢性肾炎',
            //     diagtime:'2017-04-06',
            //     diagprogress:'吃药',
            //     diagcontent:'blabla啥啥啥的'
            // }
    self.insertDiagnosis = function(params){
        var deferred = $q.defer();
        Data.Patient.insertDiagnosis(
            params,
            function(data, headers){
                deferred.resolve(data);
            },
            function(err){
                deferred.reject(err);
        });
        return deferred.promise;
    };

    //params->0:{
            //     userId:'ppost01',
            //     name:'患者xx',
            //     birthday:'1987-03-25',
            //     gender:2,
            //     IDNo:123456123456781234,
            //     height:183,
            //     weight:70,
            //     bloodType:2,
            //     class:'class1',
            //     class_info:'info_1',
            //     operationTime:'2017-04-05',
            //     hypertension:1,
            //     photoUrl:'http://photo/ppost01.jpg'
            // }
    self.newPatientDetail = function(params){
        var deferred = $q.defer();
        Data.Patient.newPatientDetail(
            params,
            function(data, headers){
                deferred.resolve(data);
            },
            function(err){
                deferred.reject(err);
        });
        return deferred.promise;
    };

    //params->0:{
                // userId:'ppost01',
                // name:'新名字2',
                // birthday:1987-03-03,
                // gender:1,
                // IDNo:123456123456781234,
                // height:183,
                // weight:70,
                // bloodType:2,
                // class:'class1',
                // class_info:'info3',
                // hypertension:1,
                // photoUrl:'http://photo/ppost01.jpg'
            // }
    self.editPatientDetail = function(params){
        var deferred = $q.defer();
        Data.Patient.editPatientDetail(
            params,
            function(data, headers){
                deferred.resolve(data);
            },
            function(err){
                deferred.reject(err);
        });
        return deferred.promise;
    };

    return self;
}])


.factory('Doctor', ['$q', 'Data', function($q, Data){
    var self = this;
    //params->0:{
           //   userId:'docpostTest',//unique
           //   name:'姓名',
           //   birthday:'1956-05-22',
           //   gender:1,
           //   workUnit:'浙江省人民医院',
           //   department:'肾内科',
           //   title:'副主任医师',
           //   major:'慢性肾炎',
           //   description:'经验丰富',
           //   photoUrl:'http://photo/docpost3.jpg',
           //   charge1:150,
           //   charge2:50
           // }
    self.postDocBasic = function(params){
        var deferred = $q.defer();
        Data.Doctor.postDocBasic(
            params,
            function(data, headers){
                deferred.resolve(data);
            },
            function(err){
                deferred.reject(err);
        });
        return deferred.promise;
    };
    return self;
}])


.factory('Counsels', ['$q', 'Data', function($q, Data){
    var self = this;
    //params->0:{userId:'doc01',status:1}
    //        1:{userId:'doc01'}
    //        1:{userId:'doc01',type:1}
    //        1:{userId:'doc01',status:1,type:1}
    self.getCounsels = function(params){
        var deferred = $q.defer();
        Data.Counsels.getCounsel(
            params,
            function(data, headers){
                deferred.resolve(data);
            },
            function(err){
                deferred.reject(err);
        });
        return deferred.promise;
    };
    //params->0:{
    //              counselId:'counselpost02',
    //              patientId:'p01',
    //              doctorId:'doc01',
    //              sickTime:'3天',
    //              symptom:'腹痛',
    //              symptomPhotoUrl:'http://photo/symptom1',
    //              help:'帮助'
    //          }
    self.questionaire = function(params){
        var deferred = $q.defer();
        Data.Counsel.questionaire(
            params,
            function(data, headers){
                deferred.resolve(data);
            },
            function(err){
                deferred.reject(err);
        });
        return deferred.promise;
    };
    return self;
}])

.factory('Communication', ['$q', 'Data', function($q, Data){
    var self = this;
    //params->0:{counselId:'counsel01'}
    self.getCounselReport = function(params){
        var deferred = $q.defer();
        Data.Communication.getCounselReport(
            params,
            function(data, headers){
                deferred.resolve(data);
            },
            function(err){
                deferred.reject(err);
        });
        return deferred.promise;
    };

    //params->0:{teamId:'team1'}
    self.getTeam = function(params){
        var deferred = $q.defer();
        Data.Communication.getTeam(
            params,
            function(data, headers){
                deferred.resolve(data);
            },
            function(err){
                deferred.reject(err);
        });
        return deferred.promise;
    };

    //params->0:{
            //      teamId:'teampost2',
            //      membersuserId:'id1',
            //      membersname:'name2'
            //  }
    self.insertMember = function(params){
        var deferred = $q.defer();
        Data.Communication.insertMember(
            params,
            function(data, headers){
                deferred.resolve(data);
            },
            function(err){
                deferred.reject(err);
        });
        return deferred.promise;
    };

    //params->0:{
            //      teamId:'teampost2',
            //      membersuserId:'id2'
            //  }
    self.removeMember = function(params){
        var deferred = $q.defer();
        Data.Communication.removeMember(
            params,
            function(data, headers){
                deferred.resolve(data);
            },
            function(err){
                deferred.reject(err);
        });
        return deferred.promise;
    };

    return self;
}])
.factory('Message', ['$q', 'Data', function($q, Data){
    var self = this;
    //params->0:{type:1}
    self.getMessages = function(params){
        var deferred = $q.defer();
        Data.Message.getMessages(
            params,
            function(data, headers){
                deferred.resolve(data);
            },
            function(err){
                deferred.reject(err);
        });
        return deferred.promise;
    };
    return self;
}])
.factory('Account', ['$q', 'Data', function($q, Data){
    var self = this;
    //params->0:{userId:'p01'}
    self.getAccountInfo = function(params){
        var deferred = $q.defer();
        Data.Account.getAccountInfo(
            params,
            function(data, headers){
                deferred.resolve(data);
            },
            function(err){
                deferred.reject(err);
        });
        return deferred.promise;
    };
    return self;
}])
.factory('VitalSign', ['$q', 'Data', function($q, Data){
    var self = this;
    //params->0:{userId:'p01',type:'type1'}
    self.getVitalSigns = function(params){
        var deferred = $q.defer();
        Data.VitalSign.getVitalSigns(
            params,
            function(data, headers){
                deferred.resolve(data);
            },
            function(err){
                deferred.reject(err);
        });
        return deferred.promise;
    };
    return self;
}])
.factory('Comment', ['$q', 'Data', function($q, Data){
    var self = this;
    //params->0:{userId:'doc01'}
    self.getComments = function(params){
        var deferred = $q.defer();
        Data.Comment.getComments(
            params,
            function(data, headers){
                deferred.resolve(data);
            },
            function(err){
                deferred.reject(err);
        });
        return deferred.promise;
    };
    return self;
}])

//--------医生的缓存数据--------
.factory('DoctorsInfo', [function () {
  var self = this;
  var DoctorTable= TAFFY([
    {
      id:"doc001",
      img:"img/doctor1.PNG",
      name:"李芳 ",
      department:"肾脏内科",
      title:"副主任医师",
      workUnit:"浙江大学医学院附属第一医院",
      major:"肾小球肾炎",
      description:"女，教授、副主任医师，担任中华医学会肾脏病学分会副主任委员、卫生部中国肾移植科学登记系统管理委员会副主任委员兼秘书长、浙江省医学会肾脏病学分会主任委员、器官移植学分会副主任委员等学术职务。",
      charge1:15,
      charge2:100,
      score:"9.0",
      count1:30,
      count2:100
    },
    {
      id:"doc002",
      img:"img/doctor2.PNG",
      name:"张三",
      department:"肾脏病中心",
      title:"主任医师",
      workUnit:"浙江大学医学院附属第二医院",
      major:"临床难治肾病治疗",
      description:"男，教授、主任医师、博士生导师，现任浙江大学附属第二医院党委副书记，浙江大学附属第一医院肾脏病中心主任。",
      charge1:30,
      charge2:200,
      score:"9.3",
      count1:35,
      count2:127
    },
    {
      id:"doc003",
      img:"img/doctor3.PNG",
      name:"李四",
      department:"肾内科",
      title:"副主任医师",
      workUnit:"徐汇区中心医院",
      major:"慢性肾病一体化治疗，尤其是肾移植",
      description:"男，教授、副主任医师、硕士生导师，参与的研究课题获国家科技进步一等奖一项。浙江省科技进步一等奖三项。国内外专业刊物发表论文数篇。擅长急慢性肾功能衰竭的透析治疗以及临床肾移植。在肾移植手术及术后管理，排斥早期诊断及治疗方面有相当丰富的临床经验。",
      charge1:20,
      charge2:180,
      score:"9.2",
      count1:23,
      count2:267
    },
    {
      id:"doc004",
      img:"img/doctor4.PNG",
      name:"董星",
      department:"血透室",
      title:"主任医师",
      workUnit:"上海第一人民医院东院",
      major:"慢性肾炎、肾病综合症、紫癜性肾炎、狼疮性肾炎",
      description:"女，主任医师、硕士生导师。获浙江省卫生科技创新奖三等奖 1项，在国内外杂志上公开发表论文10余篇，SCI收录论文1篇。",
      charge1:30,
      charge2:220,
      score:"9.4",
      count1:25,
      count2:263
    },
    {
      id:"doc005",
      img:"img/doctor5.PNG",
      name:"赵冰低",
      department:"血液净化中心",
      title:"副主任医师",
      workUnit:"浙江大学医学院附属第二医院",
      major:"免疫性肾病",
      description:"男，副主任医师，擅长肾脏疑难疾病的综合诊治，尤其擅长免疫性肾病（系统性红斑狼疮肾炎、系统性血管炎、过敏性紫癜肾炎等）的诊治。主持或主参国家自然科学基金4项，参与课题获省科技进步一等奖１项，在国内外杂志上公开发表论文26篇，以第一作者发表SCI收录论文5篇。",
      charge1:20,
      charge2:200,
      score:"8.9",
      count1:16,
      count2:78
    }
  ]);
  
  self.getalldoc = function(){
    var records = new Array();
    DoctorTable().each(function(r) {records.push(r)});
    console.log(records);
    return records;
  }
  
  self.searchdoc = function(searchId){
    var record = DoctorTable({id:searchId}).first();
    return record;
  }
  
  return self;
}])
//--------医生的缓存结束---------






