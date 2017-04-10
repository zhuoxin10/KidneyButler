angular.module('kidney.services', ['ionic','ngResource'])


// 客户端配置
.constant('CONFIG', {
    role: "Patient",
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
    },
    
    appKey: 'b4ad7a831d5f3273acca5025',
    path: {
        base: 'media/b4ad7a831d5f3273acca5025/',
        img: 'images/thumbnails/',
        voice: 'voice/'
    },
    baseUrl: 'http://121.43.107.106:4050/'
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
.factory('Camera', ['$q','$cordovaCamera','CONFIG', '$cordovaFileTransfer','Storage',function($q,$cordovaCamera,CONFIG,$cordovaFileTransfer,Storage) { //LRZ
  return {
    getPicture: function() {

      var options = { 
          quality : 75, 
          destinationType : 0, 
          sourceType : 1, 
          allowEdit : true,
          encodingType: 0,
          targetWidth: 300,
          targetHeight: 300,
          popoverOptions: CONFIG.popoverOptions,
          saveToPhotoAlbum: false
      };

     var q = $q.defer();

      $cordovaCamera.getPicture(options).then(function(imageData) {
          imgURI = "data:image/jpeg;base64," + imageData;
          // console.log("succeed" + imageData);
          q.resolve(imgURI);
      }, function(err) {
          // console.log("sth wrong");
          imgURI = undefined;
          q.resolve(err);
      });      
      return q.promise; //return a promise
    },

    getPictureFromPhotos: function(){
      var options = { 
          quality : 75, 
          destinationType : 0, 
          sourceType : 0, 
          allowEdit : true,
          encodingType: 0,
          targetWidth: 300,
          targetHeight: 300
      };
        //从相册获得的照片不能被裁减 调研~
     var q = $q.defer();
      $cordovaCamera.getPicture(options).then(function(imageData) {
          imgURI = "data:image/jpeg;base64," + imageData;
          // console.log("succeed" + imageData);
          q.resolve(imgURI);
      }, function(err) {
          // console.log("sth wrong");
          imgURI = undefined;
          q.resolve(err);
      });      
      return q.promise; //return a promise      
    },

    uploadPicture : function(imgURI, temp_photoaddress){
        // document.addEventListener('deviceready', onReadyFunction,false);
        // function onReadyFunction(){
          var uri = encodeURI(CONFIG.ImageAddressIP + "/upload.php");
          var photoname = Storage.get("UID"); // 取出病人的UID作为照片的名字
          var options = {
            fileKey : "file",
            fileName : temp_photoaddress,
            chunkedMode : true,
            mimeType : "image/jpeg"
          };
          var q = $q.defer();
          //console.log("jinlaile");
          $cordovaFileTransfer.upload(uri,imgURI,options)
            .then( function(r){
              console.log("Code = " + r.responseCode);
              console.log("Response = " + r.response);
              console.log("Sent = " + r.bytesSent);
              var result = "上传成功";
              q.resolve(result);        
            }, function(error){
              console.log(error);
              alert("An error has occurred: Code = " + error.code);
              console.log("upload error source " + error.source);
              console.log("upload error target " + error.target);
              q.resolve(error);          
            }, function (progress) {
              console.log(progress);
            })

            ;
          return q.promise;  
        // }


        // var ft = new FileTransfer();
        // $cordovaFileTransfer.upload(imgURI, uri, win, fail, options);
      
    },

  uploadPicture2: function(imgURI){
    document.addEventListener("deviceready", onDeviceReady, false);

    function onDeviceReady() {
   // as soon as this function is called FileTransfer "should" be defined
      console.log(FileTransfer);
      console.log(File);
    }
  }
  }
}])



//缓存数据


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
            getCounsel:{method:'GET', params:{route: 'getCounsels'}, timeout: 100000}
        });
    };

    var Patients =function(){
        return $resource(CONFIG.baseUrl + ':path/:route',{path:'patient'},{
            getPatientDetail:{method:'GET', params:{route: 'getPatientDetail'}, timeout: 100000}
        });
    }

    var Doctors =function(){
        return $resource(CONFIG.baseUrl + ':path/:route',{path:'doctor'},{
            createDoc:{method:'POST', params:{route: 'postDocBasic'}, timeout: 100000}
        });
    }

    var Health = function(){
        return $resource(CONFIG.baseUrl + ':path/:route',{path:'healthInfo'},{
            createHealth:{method:'POST', params:{route: 'insertHealthInfo'}, timeout: 100000}
        });
    }

    serve.abort = function ($scope) {
        abort.resolve();
        $interval(function () {
            abort = $q.defer();
            serve.Counsels = Counsels();
            serve.Patients = Patients();
            serve.Doctors = Doctors();
            serve.Health = Health();
        }, 0, 1);
    };
    serve.Counsels = Counsels();
    serve.Patients = Patients();
    serve.Doctors = Doctors();
    serve.Health = Health();
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


.factory('Patients', ['$q', 'Data', function($q, Data){
    var self = this;
    //params->0:{userId:'p01'}
    self.getPatientDetail = function(params){
        var deferred = $q.defer();
        Data.Patients.getPatientDetail(
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


.factory('Doctors', ['$q', 'Data', function($q, Data){
    var self = this;
    //params->{
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
    self.createDoctor = function(params){
        var deferred = $q.defer();
        Data.Doctors.createDoc(
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
    return self;
}])








