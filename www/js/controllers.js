angular.module('kidney.controllers', ['ionic','kidney.services','ngResource','ionic-datepicker','kidney.directives'])//,'ngRoute'
//登录--PXY
.controller('SignInCtrl', ['$scope','$timeout','$state','Storage','$ionicHistory','$http','Data','User', function($scope, $timeout,$state,Storage,$ionicHistory,$http,Data,User) {
  $scope.barwidth="width:0%";


  //-------------评论页面----------------
  $scope.test = function(){
    $state.go('tab.consult-comment');

  }
  //------------测试结束----------------------
  

  if(Storage.get('USERNAME')!=null){
    $scope.logOn={username:Storage.get('USERNAME'),password:""};

  }else{
    $scope.logOn={username:"",password:""};
  }
  $scope.signIn = function(logOn) {  
    $scope.logStatus='';
    if((logOn.username!="") && (logOn.password!="")){
      var phoneReg=/^(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/;
      //手机正则表达式验证
      if(!phoneReg.test(logOn.username)){
            $scope.logStatus="手机号验证失败！";
            return;
        }
      else{
            Storage.set('USERNAME',logOn.username);
        var logPromise = User.logIn({username:logOn.username,password:logOn.password,role:"patient"});
            logPromise.then(function(data){
                if(data.results==1){
                    if(data.mesg== "User doesn't Exist!"){
                        $scope.logStatus="账号不存在！";
                        return;
                    }
                    else if(data.mesg== "User password isn't correct!"){
                        $scope.logStatus = "账号或密码错误！";
                        return;
                    }
                }
                else if(data.results.mesg=="login success!"){
                    $scope.logStatus = "登录成功！";
                    $ionicHistory.clearCache();
                    $ionicHistory.clearHistory();
                    Storage.set('TOKEN',data.results.token);//token作用目前还不明确
                    Storage.set('isSignIn',true);
                    Storage.set('UID',data.results.userId);
                    $timeout(function(){$state.go('tab.tasklist');},500);

                }

            },function(err){
                if(err.results==null && err.status==0){
                    $scope.logStatus = "网络错误！";
                    return;
                }
                if(err.status==404){
                    $scope.logStatus = "连接服务器失败！";
                    return;
                }

            });
      }
      

    }
    else{
      $scope.logStatus="请输入完整信息！";
    }
  }

  
  $scope.toRegister = function(){
    
    $state.go('phonevalid',{phonevalidType:'register'});
   
  }
  $scope.toReset = function(){
    $state.go('phonevalid',{phonevalidType:'reset'});
  } 
  
}])


//手机号码验证--PXY
.controller('phonevalidCtrl', ['$scope','$state','$interval', '$stateParams','Storage','User','$timeout', function($scope, $state,$interval,$stateParams,Storage,User,$timeout) {
  $scope.barwidth="width:0%";
  Storage.set("personalinfobackstate","register")
  
  $scope.Verify={Phone:"",Code:""};
  $scope.veritext="获取验证码";
  $scope.isable=false;
  var unablebutton = function(){      
     //验证码BUTTON效果
        $scope.isable=true;
        $scope.veritext="180S再次发送"; 
        var time = 179;
        var timer;
        timer = $interval(function(){
            if(time==0){
                $interval.cancel(timer);
                timer=undefined;        
                $scope.veritext="获取验证码";       
                $scope.isable=false;
            }else{
                $scope.veritext=time+"S再次发送";
                time--;
            }
        },1000);
  }
  //发送验证码
    var sendSMS = function(phone){
        var SMS = User.sendSMS({mobile:phone,smsType:1});
            SMS.then(function(data){
                unablebutton();
                if(data.mesg.substr(0,8)=="您的邀请码已发送"){
                    $scope.logStatus = "您的验证码已发送，重新获取请稍后";
                }else{
                    $scope.logStatus ="验证码发送成功！";
                }
            },function(err){
                if(err.results==null && err.status==0){
                    $scope.logStatus ="连接超时!";
                    return;
                }
                $scope.logStatus = "验证码发送失败！";

            });
    }

    // console.log($stateParams.phonevalidType);




    //点击获取验证码
    $scope.getcode=function(Verify){
        $scope.logStatus='';
    
        if (Verify.Phone=="") {
            $scope.logStatus="手机号码不能为空！";
            return;
        }
        var phoneReg=/^(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/;
        //手机正则表达式验证
        if(!phoneReg.test(Verify.Phone)){
            $scope.logStatus="手机号验证失败！";
            return;
        }

        //如果为注册，注册过的用户不能获取验证码；如果为重置密码，没注册过的用户不能获取验证码
        if($stateParams.phonevalidType=='register'){
            User.getUserId({phoneNo:Verify.Phone}).then(function(data){
                if(data.results == 0){
                    $scope.logStatus = "该手机号码已经注册！";
                }else if(data.results == 1){
                    sendSMS(Verify.Phone);
                }
            },function(){
                $scope.logStatus="连接超时！";
            });
        }
        else if($stateParams.phonevalidType=='reset'){
            User.getUserId({phoneNo:Verify.Phone}).then(function(data){
                if(data.results == 1){
                    $scope.logStatus = "该账户不存在！";
                }else if(data.results == 0){
                    sendSMS(Verify.Phone);
                }
            },function(){
                $scope.logStatus="连接超时！";
            });
        }
    }

    //判断验证码和手机号是否正确
    $scope.gotoReset = function(Verify){

        $scope.logStatus = '';
        if(Verify.Phone!="" && Verify.Code!=""){
        //结果分为三种：(手机号验证失败)1验证成功；2验证码错误；3连接超时，验证失败
            var phoneReg=/^(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/;
            //手机正则表达式验证
            if(phoneReg.test(Verify.Phone)){ 
                var verifyPromise =  User.verifySMS({mobile:Verify.Phone,smsType:1,smsCode:Verify.Code});
                verifyPromise.then(function(data){
                    if(data.results==0){
                        $scope.logStatus = "验证成功";
                        Storage.set('USERNAME',Verify.Phone);
                        $timeout(function(){$state.go('setpassword',{phonevalidType:$stateParams.phonevalidType,phoneNumber:Verify.Phone});},500);
                    }else{
                        $scope.logStatus = data.mesg;
                        return;
                    }
                },function(){
                    $scope.logStatus = "连接超时！";
                })
            }
            else{$scope.logStatus="手机号验证失败！";}
      
     
    
        
        }
        else{$scope.logStatus = "请输入完整信息！";}
  }

 
  
}])




//设置密码  --PXY 
.controller('setPasswordCtrl', ['$scope','$state','$rootScope' ,'$timeout' ,'Storage','$stateParams','User',function($scope,$state,$rootScope,$timeout,Storage,$stateParams,User) {
    $scope.barwidth="width:0%";
    $scope.BackMain = function(){
        $state.go('signin');
    }
    var setPassState=$stateParams.phonevalidType;
    if(setPassState=='reset'){
        $scope.headerText="重置密码";
        $scope.buttonText="确认修改";
    }else{
        $scope.headerText="设置密码";
        $scope.buttonText="下一步";
    }
    $scope.setPassword={newPass:"" , confirm:""};


    $scope.resetPassword=function(setPassword){
        $scope.logStatus='';
        if((setPassword.newPass!="") && (setPassword.confirm!="")){
            if(setPassword.newPass == setPassword.confirm){
                var phone = $stateParams.phoneNumber;
                console.log(phone);
                //如果是注册
                if(setPassState=='register'){
                    //结果分为连接超时或者注册成功
                    $rootScope.password=setPassword.newPass;
                    var codePromise = User.register({phoneNo:phone,password:setPassword.newPass,role:"patient"});
                    codePromise.then(function(data){
                        if(data.results==0){
                            Storage.set('USERNAME',phone);
                            $scope.logStatus ="注册成功！";
                            $timeout(function(){$state.go('userdetail');} , 500);
                        }else{
                            $scope.logStatus = "该手机号码已经注册！";
                        }
                    },function(){
                        $scope.logStatus = "连接超时！";
                    })
                }else if(setPassState == 'reset'){
                //如果是重置密码
                //结果分为连接超时或者修改成功
                    var codePromise = User.changePassword({phoneNo:phone,password:setPassword.newPass});
                    codePromise.then(function(data){
                        if(data.results==0){
                            Storage.set('USERNAME',phone);
                            $scope.logStatus ="重置密码成功！";
                            $timeout(function(){$state.go('signin');} , 500);
                        }else{
                            $scope.logStatus =  "该账户不存在！";
                        }
                        
                    },function(){
                        $scope.logStatus = "连接超时！";
                    })
                    
          
                }
            }else{
            $scope.logStatus="两次输入的密码不一致";
            }
        }else{
            $scope.logStatus="请输入两遍新密码";
        }
    }
}])


//个人信息--PXY
.controller('userdetailCtrl',['$scope','$state','$ionicHistory','$timeout' ,'Storage', '$ionicPopup','$ionicLoading','$ionicPopover',function($scope,$state,$ionicHistory,$timeout,Storage, $ionicPopup,$ionicLoading, $ionicPopover){
  $scope.barwidth="width:0%";
  //注册时可跳过个人信息
  $scope.CanSkip = function(){
    if(Storage.get('setPasswordState')=='register'){
      return true;
    }
    else{
      return false;}
  }

  $scope.Skip = function(){
    $state.go('tab.tasklist');
    Storage.set('setPasswordState','sign');
  }


  $scope.Goback = function(){
    if (Storage.get("personalinfobackstate") == "mine")
    {

      $state.go("tab.mine")
    }
    else
    {
      $ionicHistory.goBack();
    }
  }

  
     
     //初始待选项出现一条空白
      // 获取性别类型
      $scope.Genders = {};// 初始化
      $scope.Genders =
        [
        {Name:"男",Type:1},
        {Name:"女",Type:2}
        ]
      ; 
      //$scope.User.Gender =$scope.Genders[0];//默认选项
      // 获取血型类型
      $scope.BloodTypes = {}; // 初始化
      $scope.BloodTypes =
        [
        {Name:"A型",Type:1},
        {Name:"B型",Type:2},
        {Name:"AB型",Type:3},
        {Name:"O型",Type:4}
        ]
      ; 
      //$scope.User.BloodType={Name:"A型",Type:1};//默认选项
      // 获取是否高血压类型
      $scope.Hypers = {}; // 初始化
      $scope.Hypers =
      [
        {Name:"是",Type:1},
        {Name:"否",Type:2},
        ];
      
      //$scope.User.Hypertension={Name:"是",Type:1};//默认选项
      // 获取肾病类型
      $scope.Diseases = {}; // 初始化
      $scope.Diseases =
      [
        {Name:"肾移植",Type:1},
        {Name:"CKD1-2期",Type:2},
        {Name:"CKD3-4期",Type:3},
        {Name:"CDK5期未透析",Type:4},
        {Name:"腹透",Type:5},
        {Name:"血透",Type:6},
        ];
      //$scope.User.KidneyDisease={t:{Name:"肾移植",Type:1}};//默认选项

      $scope.DiseaseDetails = {};
      $scope.DiseaseDetails =
      [
        {Name:"稳定",Type:1},
        {Name:"控制不佳",Type:2},
      ]


$scope.showProgress = function(){
  //console.log($scope.User.KidneyDisease.t.Type);
  if($scope.User.KidneyDisease.t.Type == 1){
    //console.log("肾移植");
    return false;}
  else{
    //console.log("疾病进程");
    return true;}
}

      

  

        
  


var initUserDetail = function(){
  $ionicLoading.show({
          template: '<ion-spinner style="height:2em;width:2em"></ion-spinner>'
         });
//先到个人信息表里查询有无此人，如果有从数据库读取个人信息显示在页面，如果没有则全显示空（注册用户）
//初始化
  var someone = Storage.get("user.name");
  if(someone!== null){
    //localStorage存储json对象需要和字符串之间进行相互转化
    var blood = JSON.parse(Storage.get("user.bloodtype"));
    var sex = JSON.parse(Storage.get("user.gender"));
    var disease = JSON.parse(Storage.get("user.kiddisease"));
    var hyperten = JSON.parse(Storage.get("user.hypertension"));
    $scope.User={
    Name:Storage.get("user.name"),
    Gender:sex,
    BloodType:blood,
    Hypertension:hyperten,
    KidneyDisease:{t:disease},
    DiseaseDetail:Storage.get("user.diseasedetail"),
    OperationDate:Storage.get("user.operationdate"),
    Height:Storage.get("user.height"),
    Weight:Storage.get("user.weight"),
    Birthday:Storage.get("user.birthday"),
    IDCard:Storage.get("user.idcard"),
    LastHospital:Storage.get("user.hospital"),
    LastDiagnosisTime:Storage.get("user.diagnosisitime"),
    LastDiagnosis:Storage.get("user.diagnosis")};

  }
  else{
    $scope.User={
    Name:"",
    Gender:{Name:"男",Type:1},//默认选项
    BloodType:{Name:"A型",Type:1},
    Hypertension:{Name:"是",Type:1},
    KidneyDisease:{t:{Name:"肾移植",Type:1}},
    DiseaseDetail:{t:{Name:"稳定",Type:1}},
    OperationDate:"",
    Height:"",
    Weight:"",
    Birthday:"",
    IDCard:"",
    LastHospital:"",
    LastDiagnosisTime:"",
    LastDiagnosis:""};

  }
  

  setTimeout(function(){$ionicLoading.hide();},400);

}

initUserDetail();
  

  

  
   
 

  // --------datepicker设置----------------
  var  monthList=["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];
  var weekDaysList=["日","一","二","三","四","五","六"];
  
  // --------诊断日期----------------
  var DiagnosisdatePickerCallback = function (val) {
    if (typeof(val) === 'undefined') {
      console.log('No date selected');
    } else {
      $scope.datepickerObject1.inputDate=val;
      var dd=val.getDate();
      var mm=val.getMonth()+1;
      var yyyy=val.getFullYear();
      var d=dd<10?('0'+String(dd)):String(dd);
      var m=mm<10?('0'+String(mm)):String(mm);
      //日期的存储格式和显示格式不一致
      $scope.User.LastDiagnosisTime=yyyy+'/'+m+'/'+d;
    }
  };
  
  $scope.datepickerObject1 = {
    titleLabel: '诊断日期',  //Optional
    todayLabel: '今天',  //Optional
    closeLabel: '取消',  //Optional
    setLabel: '设置',  //Optional
    setButtonType : 'button-assertive',  //Optional
    todayButtonType : 'button-assertive',  //Optional
    closeButtonType : 'button-assertive',  //Optional
    inputDate: new Date(),    //Optional
    mondayFirst: false,    //Optional
    //disabledDates: disabledDates, //Optional
    weekDaysList: weekDaysList,   //Optional
    monthList: monthList, //Optional
    templateType: 'popup', //Optional
    showTodayButton: 'false', //Optional
    modalHeaderColor: 'bar-positive', //Optional
    modalFooterColor: 'bar-positive', //Optional
    from: new Date(1900, 1, 1),   //Optional
    to: new Date(),    //Optional
    callback: function (val) {    //Mandatory
      DiagnosisdatePickerCallback(val);
    }
  };  
  // --------手术日期----------------
  var OperationdatePickerCallback = function (val) {
    if (typeof(val) === 'undefined') {
      console.log('No date selected');
    } else {
      $scope.datepickerObject2.inputDate=val;
      var dd=val.getDate();
      var mm=val.getMonth()+1;
      var yyyy=val.getFullYear();
      var d=dd<10?('0'+String(dd)):String(dd);
      var m=mm<10?('0'+String(mm)):String(mm);
      //日期的存储格式和显示格式不一致
      $scope.User.OperationDate=yyyy+'/'+m+'/'+d;
    }
  };
  $scope.datepickerObject2 = {
    titleLabel: '手术日期',  //Optional
    todayLabel: '今天',  //Optional
    closeLabel: '取消',  //Optional
    setLabel: '设置',  //Optional
    setButtonType : 'button-assertive',  //Optional
    todayButtonType : 'button-assertive',  //Optional
    closeButtonType : 'button-assertive',  //Optional
    mondayFirst: false,    //Optional
    //disabledDates: disabledDates, //Optional
    weekDaysList: weekDaysList,   //Optional
    monthList: monthList, //Optional
    templateType: 'popup', //Optional
    showTodayButton: 'false', //Optional
    modalHeaderColor: 'bar-positive', //Optional
    modalFooterColor: 'bar-positive', //Optional
    from: new Date(1900, 1, 1),   //Optional
    to: new Date(),    //Optional
    callback: function (val) {    //Mandatory
      OperationdatePickerCallback(val);
    }
  };  
  // --------出生日期----------------
  var BirthdatePickerCallback = function (val) {
    if (typeof(val) === 'undefined') {
      console.log('No date selected');
    } else {
      $scope.datepickerObject3.inputDate=val;
      var dd=val.getDate();
      var mm=val.getMonth()+1;
      var yyyy=val.getFullYear();
      var d=dd<10?('0'+String(dd)):String(dd);
      var m=mm<10?('0'+String(mm)):String(mm);
      //日期的存储格式和显示格式不一致
      $scope.User.Birthday=yyyy+'/'+m+'/'+d;
    }
  };
  $scope.datepickerObject3 = {
    titleLabel: '出生日期',  //Optional
    todayLabel: '今天',  //Optional
    closeLabel: '取消',  //Optional
    setLabel: '设置',  //Optional
    setButtonType : 'button-assertive',  //Optional
    todayButtonType : 'button-assertive',  //Optional
    closeButtonType : 'button-assertive',  //Optional
    mondayFirst: false,    //Optional
    //disabledDates: disabledDates, //Optional
    weekDaysList: weekDaysList,   //Optional
    monthList: monthList, //Optional
    templateType: 'popup', //Optional
    showTodayButton: 'false', //Optional
    modalHeaderColor: 'bar-positive', //Optional
    modalFooterColor: 'bar-positive', //Optional
    from: new Date(1900, 1, 1),   //Optional
    to: new Date(),    //Optional
    callback: function (val) {    //Mandatory
      BirthdatePickerCallback(val);
    }
  };  
  // --------datepicker设置结束----------------


   //////////////////////////////////////////////////////////////////////////
      $scope.change = function(d)
      {
        console.log(d);
      }

      
      //////////////////////////////////////////////////////////////////////////
      // 修改信息后的保存
  var InsertUserDetail = function(User){
    console.log(User.BloodType);
    Storage.set("user.name",User.Name);
    Storage.set("user.gender",JSON.stringify(User.Gender));
    Storage.set("user.bloodtype",JSON.stringify(User.BloodType));
    Storage.set("user.hypertension",JSON.stringify(User.Hypertension));
    Storage.set("user.kiddisease",JSON.stringify(User.KidneyDisease.t));
    Storage.set("user.diseasedetail",User.DiseaseDetail);
    Storage.set("user.operationdate",User.OperationDate);
    Storage.set("user.height",User.Height);
    Storage.set("user.weight",User.Weight);
    Storage.set("user.birthday",User.Birthday);
    Storage.set("user.idcard",User.IDCard);
    Storage.set("user.hospital" ,User.LastHospital);
    Storage.set("user.diagnosisitime",User.LastDiagnosisTime);
    Storage.set("user.diagnosis",User.LastDiagnosis);
    $ionicPopup.alert({
      title: '保存成功',
      template: '个人信息修改完成！'
    })
    
  }
     


  $scope.infoSetup = function(User){
    //console.log(User.Name);
    if (User.Name!=undefined && User.Name!='') {
      //如果必填信息不为空
      console.log("不为空");
      var IDreg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
      var PositiveReg = /^\d+(?=\.{0,1}\d+$|$)/;


      if (User.IDCard!='' && IDreg.test(User.IDCard) == false){
            console.log("身份证");
            $ionicLoading.show({
            template: '保存失败,请输入正确的身份证号',
            duration:1000
            });
      }
      else if((User.Height!='' && PositiveReg.test(User.Height) == false )||(User.Weight!=''&&PositiveReg.test(User.Weight) == false) ){
          console.log("身高体重");
          $ionicLoading.show({
            template: '保存失败,请输入正确的身高体重',
            duration:1000
            });
      }
    
      else if(User.KidneyDisease.t.Type==1){
        if(User.OperationDate==""){
          console.log("手术");
          $ionicLoading.show({
            template: '保存失败,请输入手术日期',
            duration:1000
            });
        }
        else{InsertUserDetail(User);}
      }
      else if(User.KidneyDisease.t.Type!=1){
        if(User.DiseaseDetail==""){
          console.log("进程");
          $ionicLoading.show({
            template: '保存失败,请输入疾病进程',
            duration:1000
            });
        }
        else{InsertUserDetail(User);}
      }

    }
    else{
      console.log("不完整");
      $ionicLoading.show({
        template: '保存失败,信息填写不完整',
        duration:1000
      });
    }

  }




}])

//主页面--PXY
.controller('GoToMessageCtrl', ['$scope','$timeout','$state', function($scope, $timeout,$state) {

  $scope.GoToMessage = function(){
    $state.go('messages');
  }
  

}])

//任务列表--GL
.controller('tasklistCtrl', ['$scope','$timeout','$state','Storage','$ionicHistory', '$ionicPopup', '$ionicModal', 'Compliance', '$window', 'Task', function($scope, $timeout,$state,Storage,$ionicHistory,$ionicPopup,$ionicModal,Compliance, $window, Task) {
  $scope.barwidth="width:0%";
  var UserId = Storage.get('UID');//U201511120002
  $scope.Tasks = {}; //任务

   $scope.$on('$ionicView.enter', function() {
        //GetDoneTask();
        ChangeLongFir();
  });  
  

  //获取对应任务模板
   function GetTask(TaskCode)
   { 
     console.log(1);
     var promise =  Task.getTask({userId:'Admin',sortNo:TaskCode[0]});
     promise.then(function(data){
       if(data.results.length != 0)
       {
          $scope.Tasks.Other = {};
          var AllTasks = data.results[0].task;          
          for(var i=0; i<AllTasks.length;i++)
          {
             if (AllTasks[i].type == 'Measure') //测量
             {
                $scope.Tasks.Measure = AllTasks[i].details;
                for(var j=0;j<$scope.Tasks.Measure.length;j++)
                {
                    $scope.Tasks.Measure[j].Name = NameMatch($scope.Tasks.Measure[j].code);                    
                }
             }            
             else if(AllTasks[i].type == 'ReturnVisit') //复诊
             {
                $scope.Tasks.ReturnVisit = AllTasks[i].details[TaskCode[1]];
                $scope.Tasks.ReturnVisit = TimeSelectBind($scope.Tasks.ReturnVisit);                         
             }
             else if(AllTasks[i].type == 'LabTest') //化验
             {
                $scope.Tasks.LabTest = AllTasks[i].details[TaskCode[2]];
                $scope.Tasks.LabTest = TimeSelectBind($scope.Tasks.LabTest);               
             }
             else if(AllTasks[i].type == 'SpecialEvaluate') //特殊评估
             {
                $scope.Tasks.SpecialEvaluate = AllTasks[i].details[0];                
                for(j=1;j< AllTasks[i].details.length;j++)
                {
                    $scope.Tasks.SpecialEvaluate.instruction += '，' + AllTasks[i].details[j].instruction;
                }
                $scope.Tasks.SpecialEvaluate = TimeSelectBind($scope.Tasks.SpecialEvaluate);               
             }
             //console.log($scope.Tasks);            
          }         
       }
     },function(){
                    
     })
   }
  //任务暂且写死
  $scope.Tasks = [
        {
          "type": "Measure",
          "details": [
            {
              "code": "Temperature",
              "instruction": "",
              "content": "",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 1,
              "timesUnits": "次",
              "frequencyTimes": 1,
              "frequencyUnits": "天"
            },
            {
              "code": "Weight",
              "instruction": "",
              "content": "",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 1,
              "timesUnits": "次",
              "frequencyTimes": 1,
              "frequencyUnits": "天"
            },
            {
              "code": "BloodPressure",
              "instruction": "",
              "content": "",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 2,
              "timesUnits": "次",
              "frequencyTimes": 1,
              "frequencyUnits": "天"
            },
            {
              "code": "Vol",
              "instruction": "",
              "content": "",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 1,
              "timesUnits": "次",
              "frequencyTimes": 1,
              "frequencyUnits": "天"
            },
            {
              "code": "HeartRate",
              "instruction": "",
              "content": "",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 2,
              "timesUnits": "次",
              "frequencyTimes": 1,
              "frequencyUnits": "天"
            }
          ]
        },
        {
          "type": "ReturnVisit",
          "details": [            
            {
              "code": "TimeInterval_3",
              "instruction": "术后时间>3年",
              "content": "",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 1,
              "timesUnits": "次",
              "frequencyTimes": 2,
              "frequencyUnits": "月"
            }
          ]
        },
        {
          "type": "LabTest",
          "details": [
            {
              "code": "LabTest_3",
              "instruction": "术后时间>3年",
              "content": "血常规、血生化、尿常规、尿生化、移植肾彩超、血药浓度",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 1,
              "timesUnits": "次",
              "frequencyTimes": 2,
              "frequencyUnits": "周"
            }
          ]
        },
        {
          "type": "SpecialEvaluate",
          "details": [
            {
              "code": "ECG",
              "instruction": "",
              "content": "心电图，胸片，移植肾B超",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 1,
              "timesUnits": "次",
              "frequencyTimes": 1,
              "frequencyUnits": "年"
            }            
          ]
        }
      ];
  function Temp()
  {
    $scope.Tasks.Other = [];
    for (var i=0;i<$scope.Tasks.length;i++)
    {
       var task = $scope.Tasks[i];
       if(task.type == 'Measure')
       {
          $scope.Tasks.Measure = task.details;
          for(var j=0;j<$scope.Tasks.Measure.length;j++)
          {
              $scope.Tasks.Measure[j].Name = NameMatch($scope.Tasks.Measure[j].code);
              $scope.Tasks.Measure[j].Freq = $scope.Tasks.Measure[j].frequencyTimes + $scope.Tasks.Measure[j].frequencyUnits +$scope.Tasks.Measure[j].times + $scope.Tasks.Measure[j].timesUnits;
              $scope.Tasks.Measure[j].Flag = false;   
              $scope.Tasks.Measure[j].instruction = "";                
          }
       }
       else //复诊
       {
          var newTask = task.details[0];
          newTask.type = task.type;
          newTask.Name = NameMatch(newTask.type);
          newTask.Freq = newTask.frequencyTimes + newTask.frequencyUnits +newTask.times + newTask.timesUnits;
          newTask.Flag = false;
          newTask.instruction = "";
          $scope.Tasks.Other.push(newTask);                                
       }       
    }
    //console.log($scope.Tasks);
  }  
  //名称转换
   function NameMatch(name)
   {
     var Tbl = [
                 {Name:'体温', Code:'Temperature'},
                 {Name:'体重', Code:'Weight'},
                 {Name:'血压', Code:'BloodPressure'},
                 {Name:'尿量', Code:'Vol'},
                 {Name:'心率', Code:'HeartRate'},
                 {Name:'复诊', Code:'ReturnVisit'},
                 {Name:'化验', Code:'LabTest'},
                 {Name:'特殊评估', Code:'SpecialEvaluate'}
                ];
      for (var i=0;i<Tbl.length;i++)
      {
         if(Tbl[i].Code == name)
         {
            name = Tbl[i].Name
            break;
         }
      }
      return name;
   }
   
  //获取今日已执行任务
    function GetDoneTask()
    {               
         var nowDay = ChangeTimeForm(new Date());
         var promise1 = Compliance.getcompliance({userId:UserId, date:nowDay});
         promise1.then(function(data){
           if(data.results)
           {
              var doneTasks = data.results;  
              //console.log(doneTasks);                
              for(i=0;i< doneTasks.length;i++)
              {  
                  var Code = doneTasks[i].code;               
                  for (var j=0;j<$scope.Tasks.Measure.length;j++)
                  {
                     if($scope.Tasks.Measure[j].code == Code)
                     {                        
                        $scope.Tasks.Measure[j].Flag = true;
                        break;
                     }
                     else if($scope.Tasks.Other[j].code == Code)
                     {
                        $scope.Tasks.Other[j].Flag = true;
                        break;
                     }
                  }
              }                            
           }              
           //console.log(data.results);      
          
         },function(){
                        
         })
    }   

  //插入任务    
    function Postcompliance(task)
    {              
         var promise1 = Compliance.postcompliance(task);
         promise1.then(function(data){
           if(data.results)
           {
              //console.log(data.results);
              var Code = data.results.code;
              var time;
              for (var i=0;i<$scope.Tasks.Measure.length;i++)
              {
                if ($scope.Tasks.Measure[i].code == Code)
                {
                   $scope.Tasks.Measure[i].Flag = true;
                   time = SetNextTime($scope.Tasks.Measure[i].frequencyTimes, $scope.Tasks.Measure[i].frequencyUnits, $scope.Tasks.Measure[i].times);
                   //$scope.Tasks.Measure[i].Value = data.results.description;                 
                   break;
                }
              }
              for (var i=0;i<$scope.Tasks.Other.length;i++)
              {
                if ($scope.Tasks.Other[i].code == Code)
                {
                   $scope.Tasks.Other[i].Flag = true;
                   time = SetNextTime($scope.Tasks.Other[i].frequencyTimes, $scope.Tasks.Other[i].frequencyUnits, $scope.Tasks.Other[i].times);                   
                   break;
                }
              }
              //设定下次任务执行时间
              var timeStr = ChangeTimeForm(time);
              var item = {
                  userId:UserId,//unique
                  sortNo:1,
                  type:task.type,
                  code:task.code,
                  startTime:timeStr
               };
               ChangeTasktime(item);

           }                        
         },function(){                        
         });
    }
    
  //设定下次任务执行时间（长期任务）
    function SetNextTaskTime(Type, Addition)
    {      
      var Date1 = new Date(CurrentTime);
      var Date2;
      if(Type == "周") //周
      {
          Date2 = new Date(Date1.setDate(Date1.getDate() + Addition));
      }
      else if(Type == '月') //月
      {
          Date2 = new Date(Date1.setMonth(Date1.getMonth() + Addition));
      }
      else //年
      {
          Date2 = new Date(Date1.setMonth(Date1.getFullYear() + Addition));
      }    
      return Date2;
    }

  //修改任务执行时间
    function ChangeTasktime(task)
    {
      /*var promise = Task.changeTasktime(task);
       promise.then(function(data){
         //console.log(data);
         if(data.results)
         {
          console.log(data.results);
         };
       },function(){                    
       })*/
    }
    //ChangeTasktime();

  Temp();                        

  //修改长期任务第一次时间  
    function ChangeLongFir()
    {
        for (var i=0;i<$scope.Tasks.Other.length;i++)
        {
          if($scope.Tasks.Other[i].startTime == '2050-11-02T07:58:51.718Z') //未设定时间时
          {
            $scope.Tasks.Other[i].startTime = SetTaskTime($scope.Tasks.Other[i].frequencyUnits, $scope.Tasks.Other[i].times);
          }
        }
        //console.log($scope.Tasks.Other);
        /*for (var i=0;i<$scope.Tasks.Other.length;i++)
        {
          if($scope.Tasks.Other[i].startTime != '2050-11-02T07:58:51.718Z') //修改任务执行时间
          {
             var task = {
                userId:UserId,//unique
                sortNo:1,
                type:$scope.Tasks.Other[i].type,
                code:$scope.Tasks.Other[i].code,
                startTime:$scope.Tasks.Other[i].startTime
              };

              ChangeTasktime(task);
          }
        }*/
    }
  
  //设定长期任务第一次时间
   function SetTaskTime (Type, Times)
   {
      //暂时就用本地时间
      var CurrentDate = new Date();
      var NewDate;
      var WeekDay = CurrentDate.getDay(); //0-6 0为星期日
      var Day = CurrentDate.getDate(); //1-31
      var Month = CurrentDate.getMonth(); //0-11,0为1月
      
      var Num = 0;     
      if(Type == "周")
      {
         Num = 1;//默认周一

         if(Num >= WeekDay) //所选日期未过，选择本星期
         {
            NewDate = new Date(CurrentDate.setDate(Day + Num - WeekDay));
         }
         else //下个星期
         {
            NewDate = new Date(CurrentDate.setDate(Day + Num + 7 - WeekDay));
         }        
      }
      else if(Type == "月")
      {
         Num = 1; //默认1日
         NewDate = new Date(CurrentDate.setDate(Num));
         if (Num < Day) //所选日期已过，选择下月
         {
            NewDate = new Date(CurrentDate.setMonth(CurrentDate.getMonth() + 1));
         }         
      }
      else if(Type == "年")
      {
         if(Times == 2) //一年2次 -- 6月1次
         {
            Num = 1;
            NewDate = new Date(CurrentDate.setDate(Num));
            if (Num < Day) //所选日期已过，选择下月
            {
              NewDate = new Date(CurrentDate.setMonth(CurrentDate.getMonth() + 1));
            }  
         }
         else
         {
             Num = 0; //默认1月
             NewDate = new Date(CurrentDate.setMonth(Num));
             if(Num < Month)//所选日期已过，选择明年
             {
                NewDate = new Date(CurrentDate.setYear(CurrentDate.getFullYear() + 1));
             }
             }
         
      }
      //console.log(ChangeTimeForm(NewDate));
      return ChangeTimeForm(NewDate);
   }

  //弹框格式
   var PopTemplate = {
                        Input:'<input type="text" ng-model="data.value">',
                        Textarea:'<textarea type="text" ng-model="data.value" rows="10" cols="100"></textarea>',
                        Select:'<select ng-model = "data.value"><option >请选择</option><option >是</option><option >否</option></select>'
                    };//Textarea：VascularAccess；
  
  //自定义弹窗
    $scope.showPopup = function(task, flag) {
      $scope.data = {};
      //console.log(task);
      var Template = PopTemplate.Input;
      var word = "";
      if(flag == 'textarea')
      {
          Template = PopTemplate.Textarea;
          word = "情况";
      }
      var myPopup = $ionicPopup.show({
         template: Template,     
         title: '请填写'+ task.Name + word,
         scope: $scope,
         buttons: [
           { text: '取消' },
           {
             text: '<b>保存</b>',
             type: 'button-positive',
             onTap: function(e) {
               if (!$scope.data.value) {
                 // 不允许用户关闭，除非输入内容
                 e.preventDefault();
               } else {
                return $scope.data.value;
               }  
               }    
           },
         ]
       });
       myPopup.then(function(res) {
        if(res)
        {
              for (var i=0;i<$scope.Tasks.Measure.length;i++)
              {
                if ($scope.Tasks.Measure[i].Name == task.Name)
                {
                   $scope.Tasks.Measure[i].instruction = res;
                   break;
                }
              }
              for (var i=0;i<$scope.Tasks.Other.length;i++)
              {
                if ($scope.Tasks.Other[i].Name == task.Name)
                {
                   $scope.Tasks.Other[i].instruction = res;
                   break;
                }
              }

          //向任务表中插入数据
          var item = {
                      "userId": UserId,
                      "type": task.type,
                      "code": task.code,
                      "date": ChangeTimeForm(new Date()),
                      "status": 0,
                      "description": res
                    };
          
          //console.log($scope.measureTask); 
          Postcompliance(item);
        }  
      });
    };
 
  //任务完成后设定下次任务执行时间,CurrentTime为整数
    function SetNextTime(FreqTimes, Unit, Times)
    {
        var NextTime;       
        if (Unit == "周")
        {
            NextTime = DateCalc("周",FreqTimes*7);
        }
        else if(Unit == "月")
        {
            NextTime = DateCalc("月", FreqTimes);
        }
        else //年
        {
            NextTime = DateCalc("年", FreqTimes);
            if((FreqTimes == 1)&&(Times == 2))
            {
              NextTime = DateCalc("月", 6);//1年2次转为6月1次
            }
        } 
        //console.log(NextTime);     
        return NextTime;
    }

  //日期延后计算
    function DateCalc(Type, Addition)
    {      
      var Date1 = new Date();
      var Date2;
      if(Type == "周") //周
      {
          Date2 = new Date(Date1.setDate(Date1.getDate() + Addition));
      }
      else if(Type == "月")
      {
          Date2 = new Date(Date1.setMonth(Date1.getMonth() + Addition));
      }
      else //年
      {
          Date2 = new Date(Date1.setYear(Date1.getFullYear() + Addition));
      }     
      return Date2;
    }
 
 //医生排班表数据
    $scope.Docweek = ["周一","周二","周三","周四","周五","周六","周日"];
    $scope.TblColor1 = ["gray", "green", "gray" ,"gray", "green", "green", "gray"];
    $scope.TblColor2 = ["gray", "green", "green" ,"green", "gray", "gray", "gray"];

 //弹窗：医生排班表
    $ionicModal.fromTemplateUrl('templates/modal.html', {
        scope: $scope,
        animation: 'slide-in-up'
       }).then(function(modal) {
        $scope.modal = modal;
      });
       $scope.openModal = function() {
       $scope.modal.show();
     };
     $scope.closeModal = function() {
       $scope.modal.hide();
     };
     //清除
     $scope.$on('$destroy', function() {
       $scope.modal.remove();
     });  

 //修改日期格式Date → yyyy-mm-dd
   function ChangeTimeForm(date)
   {
      var mon = date.getMonth() + 1;
      var day = date.getDate();
      var nowDay = date.getFullYear() + "-" + (mon<10?"0"+mon:mon) + "-" +(day<10?"0"+day:day);
      return nowDay;
   }

//页面刷新
    $scope.Refresh = function()
    {
        //$window.location.reload();
    }
}])

//任务设置--GL
.controller('TaskSetCtrl', ['$scope', '$state', '$ionicHistory', 'Storage', 'Patient', 'Task', function($scope, $state, $ionicHistory, Storage, Patient, Task) {
  var UserId = Storage.get('UID'); 
  var TmpMatchTbl = {};  //模板匹配表
  var DisaClass={}; //疾病进程 
  $scope.Tasks = {};
  $scope.$on('$ionicView.enter', function() {
        Temp();
  });  
  
  //获取患者任务模板
   function GetTask(TaskCode)
   { 
     var promise =  Task.getTask({userId:UserId});
     promise.then(function(data){
       if(data.results.length != 0)
       {          
          var AllTasks = data.results[0].task;          
          for(var i=0; i<AllTasks.length;i++)
          {
             if (AllTasks[i].type == 'Measure') //测量
             {
                $scope.Tasks.Measure = AllTasks[i].details;
                for(var j=0;j<$scope.Tasks.Measure.length;j++)
                {
                    $scope.Tasks.Measure[j].Name = NameMatch($scope.Tasks.Measure[j].code);                    
                }
             }            
             else if(AllTasks[i].type == 'ReturnVisit') //复诊
             {
                $scope.Tasks.ReturnVisit = AllTasks[i].details[TaskCode[1]];
                $scope.Tasks.ReturnVisit = TimeSelectBind($scope.Tasks.ReturnVisit);                         
             }
             else if(AllTasks[i].type == 'LabTest') //化验
             {
                $scope.Tasks.LabTest = AllTasks[i].details[TaskCode[2]];
                $scope.Tasks.LabTest = TimeSelectBind($scope.Tasks.LabTest);               
             }
             else if(AllTasks[i].type == 'SpecialEvaluate') //特殊评估
             {
                $scope.Tasks.SpecialEvaluate = AllTasks[i].details[0];                
                for(j=1;j< AllTasks[i].details.length;j++)
                {
                    $scope.Tasks.SpecialEvaluate.instruction += '，' + AllTasks[i].details[j].instruction;
                }
                $scope.Tasks.SpecialEvaluate = TimeSelectBind($scope.Tasks.SpecialEvaluate);               
             }
             //console.log($scope.Tasks);            
          }         
       }
     },function(){
                    
     })
   }

  //任务先写死
  $scope.Tasks = [
        {
          "type": "Measure",
          "details": [
            {
              "code": "Temperature",
              "instruction": "",
              "content": "",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 1,
              "timesUnits": "次",
              "frequencyTimes": 1,
              "frequencyUnits": "天"
            },
            {
              "code": "Weight",
              "instruction": "",
              "content": "",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 1,
              "timesUnits": "次",
              "frequencyTimes": 1,
              "frequencyUnits": "天"
            },
            {
              "code": "BloodPressure",
              "instruction": "",
              "content": "",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 2,
              "timesUnits": "次",
              "frequencyTimes": 1,
              "frequencyUnits": "天"
            },
            {
              "code": "Vol",
              "instruction": "",
              "content": "",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 1,
              "timesUnits": "次",
              "frequencyTimes": 1,
              "frequencyUnits": "天"
            },
            {
              "code": "HeartRate",
              "instruction": "",
              "content": "",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 2,
              "timesUnits": "次",
              "frequencyTimes": 1,
              "frequencyUnits": "天"
            }
          ]
        },
        {
          "type": "ReturnVisit",
          "details": [            
            {
              "code": "TimeInterval_3",
              "instruction": "术后时间>3年",
              "content": "",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 1,
              "timesUnits": "次",
              "frequencyTimes": 2,
              "frequencyUnits": "月"
            }
          ]
        },
        {
          "type": "LabTest",
          "details": [
            {
              "code": "LabTest_3",
              "instruction": "术后时间>3年",
              "content": "血常规、血生化、尿常规、尿生化、移植肾彩超、血药浓度",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 1,
              "timesUnits": "次",
              "frequencyTimes": 2,
              "frequencyUnits": "周"
            }
          ]
        },
        {
          "type": "SpecialEvaluate",
          "details": [
            {
              "code": "ECG",
              "instruction": "",
              "content": "心电图，胸片，移植肾B超",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 1,
              "timesUnits": "次",
              "frequencyTimes": 1,
              "frequencyUnits": "年"
            }            
          ]
        }
      ];
  
  
  function Temp()
  {
    for (var i=0;i<$scope.Tasks.length;i++)
    {
       var task = $scope.Tasks[i];
       var temp;
       if(task.type == 'Measure')
       {
          $scope.Tasks.Measure = task.details;
          for(var j=0;j<$scope.Tasks.Measure.length;j++)
          {
              $scope.Tasks.Measure[j].Name = NameMatch($scope.Tasks.Measure[j].code);
              temp = $scope.Tasks.Measure[j];
              $scope.Tasks.Measure[j].Freq = temp.frequencyTimes + temp.frequencyUnits + temp.times + temp.timesUnits;                    
          }
       }
       else if(task.type == 'ReturnVisit') //复诊
       {
          $scope.Tasks.ReturnVisit = task.details[0];
          temp = $scope.Tasks.ReturnVisit;
          $scope.Tasks.ReturnVisit.Freq = temp.frequencyTimes + temp.frequencyUnits + temp.times + temp.timesUnits;    
          $scope.Tasks.ReturnVisit = TimeSelectBind($scope.Tasks.ReturnVisit);                         
       }
       else if(task.type == 'LabTest') //化验
       {
          $scope.Tasks.LabTest =task.details[0];
          temp = $scope.Tasks.LabTest;
          $scope.Tasks.LabTest.Freq = temp.frequencyTimes + temp.frequencyUnits + temp.times + temp.timesUnits;    
          $scope.Tasks.LabTest = TimeSelectBind($scope.Tasks.LabTest);               
       }
       else if(task.type == 'SpecialEvaluate') //特殊评估
       {
          $scope.Tasks.SpecialEvaluate = task.details[0];  
          temp = $scope.Tasks.SpecialEvaluate;
          $scope.Tasks.SpecialEvaluate.Freq = temp.frequencyTimes + temp.frequencyUnits + temp.times + temp.timesUnits;    
          $scope.Tasks.SpecialEvaluate = TimeSelectBind($scope.Tasks.SpecialEvaluate);                
       }
    }
    //console.log($scope.Tasks);
  }
  
  //名称转换
   function NameMatch(name)
   {
     var Tbl = [
                 {Name:'体温', Code:'Temperature'},
                 {Name:'体重', Code:'Weight'},
                 {Name:'血压', Code:'BloodPressure'},
                 {Name:'尿量', Code:'Vol'},
                 {Name:'心率', Code:'HeartRate'},
                 {Name:'复诊', Code:'ReturnVisit'},
                 {Name:'化验', Code:'LabTest'},
                 {Name:'特殊评估', Code:'SpecialEvaluate'}
                ];
      for (var i=0;i<Tbl.length;i++)
      {
         if(Tbl[i].Code == name)
         {
            name = Tbl[i].Name
            break;
         }
      }
      return name;
   }

  //时间下拉框绑定
   function TimeSelectBind(item)
   {
        var Unit = item.frequencyUnits;
        if (Unit == "周")
        {
          item.Days = $scope.Week;
          item.Type = "week"; 
          item.SelectedDay = "星期一"; //默认时间
        }
        else if(Unit == "月")
        {
          item.Days = $scope.Days;
          item.Type = "month"; 
          item.SelectedDay = "1日";//默认时间
        }
        else if(Unit == '年')
        {
          item.Days = $scope.Month;
          item.Type = "year"; 
          item.SelectedDay = "1月";//默认时间
        }
        return item;     
   }

  //时间下拉框数据
   $scope.Week = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
   $scope.Days = ["1日","2日","3日","4日","5日","6日","7日","8日","9日","10日","11日","12日","13日","14日","15日","16日","17日","18日","19日","20日","21日","22日","23日","24日","25日","26日","27日","28日"];
   $scope.Month = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  
  //页面跳转
   $scope.SetDate = function()
   {
     $scope.Tasks.ReturnVisit.startTime =  SetTaskTime($scope.Tasks.ReturnVisit. SelectedDay, $scope.Tasks.ReturnVisit.frequencyUnits);
     $scope.Tasks.LabTest.startTime =  SetTaskTime($scope.Tasks.LabTest. SelectedDay, $scope.Tasks.LabTest.frequencyUnits);
     $scope.Tasks.SpecialEvaluate.startTime =  SetTaskTime($scope.Tasks.SpecialEvaluate. SelectedDay, $scope.Tasks.SpecialEvaluate.frequencyUnits);
     //console.log($scope.Tasks);
      var Tasks = [                                      
                    {
                        userId:UserId,//unique
                        sortNo:1,
                        type:$scope.Tasks.ReturnVisit.type,
                        code:$scope.Tasks.ReturnVisit.code,
                        startTime:$scope.Tasks.ReturnVisit.startTime
                    },
                    {
                        userId:UserId,//unique
                        sortNo:1,
                        type:$scope.Tasks.LabTest.type,
                        code:$scope.Tasks.LabTest.code,
                        startTime:$scope.Tasks.LabTest.startTime
                    },
                    {
                        userId:UserId,//unique
                        sortNo:1,
                        type:$scope.Tasks.SpecialEvaluate.type,
                        code:$scope.Tasks.SpecialEvaluate.code,
                        startTime:$scope.Tasks.SpecialEvaluate.startTime
                    }
                 ];
     for (var i=0;i<Tasks.length;i++)
     {
        ChangeTasktime(Tasks[i]);
     }
     $ionicHistory.goBack();
   }

   $scope.Goback = function(){
     $ionicHistory.goBack();
   }
  
  //修改任务执行时间
    function ChangeTasktime(task)
    {     
     /* var promise = Task.changeTasktime(task);
       promise.then(function(data){
         //console.log(data);
         if(data.results)
         {
          console.log(data.results);
         };
       },function(){                    
       })*/
    }
    //ChangeTasktime();

  //选定星期或号数后，默认为离当前日期最近的日期
   function SetTaskTime (SelectedDay, Type)
   {
      //暂时就用本地时间
      var CurrentDate = new Date();
      var NewDate;
      var WeekDay = CurrentDate.getDay(); //0-6 0为星期日
      var Day = CurrentDate.getDate(); //1-31
      var Month = CurrentDate.getMonth(); //0-11,0为1月
      
      var Num = 0;     
      if(Type == "周")
      {
         Num = $scope.Week.indexOf(SelectedDay);

         if(Num >= WeekDay) //所选日期未过，选择本星期
         {
            NewDate = new Date(CurrentDate.setDate(Day + Num - WeekDay));
         }
         else //下个星期
         {
            NewDate = new Date(CurrentDate.setDate(Day + Num + 7 - WeekDay));
         }        
      }
      else if(Type == "月")
      {
         Num = $scope.Days.indexOf(SelectedDay) + 1;
         NewDate = new Date(CurrentDate.setDate(Num));
         if (Num < Day) //所选日期已过，选择下月
         {
            NewDate = new Date(CurrentDate.setMonth(CurrentDate.getMonth() + 1));
         }         
      }
      else if(Type == "年")
      {
         Num = $scope.Month.indexOf(SelectedDay);
         NewDate = new Date(CurrentDate.setMonth(Num));
         if(Num < Month)//所选日期已过，选择明年
         {
            NewDate = new Date(CurrentDate.setYear(CurrentDate.getFullYear() + 1));
         }
      }
      //console.log(NewDate);
      return ChangeTimeForm(NewDate);
   }
 
   //编辑按钮
   $scope.EnableEdit = function ()
   {
      $('select').attr("disabled", false);
   }   

  //修改日期格式Date → yyyy-mm-dd
   function ChangeTimeForm(date)
   {
      var mon = date.getMonth() + 1;
      var day = date.getDate();
      var nowDay = date.getFullYear() + "-" + (mon<10?"0"+mon:mon) + "-" +(day<10?"0"+day:day);
      return nowDay;
   }

}])


//我的 页面--PXY
.controller('MineCtrl', ['$scope','$ionicHistory','$state','$ionicPopup','$resource','Storage','CONFIG','$ionicLoading','$ionicPopover','Camera', function($scope, $ionicHistory, $state, $ionicPopup, $resource, Storage, CONFIG, $ionicLoading, $ionicPopover, Camera) {
  $scope.barwidth="width:0%";
  Storage.set("personalinfobackstate","mine")
  //页面跳转---------------------------------
  $scope.GoUserDetail = function(){
    $state.go('userdetail');
  }
  $scope.GoConsultRecord = function(){
    $state.go('tab.myConsultRecord');
  }
  $scope.GoHealthInfo = function(){
    $state.go('tab.myHealthInfo');
  }
  $scope.GoManagement = function(){
    $state.go('tab.taskSet');
  }

  $scope.GoMoney = function(){
    $state.go('tab.myMoney');
  }

  $scope.SignOut = function(){
    var myPopup = $ionicPopup.show({
            template: '<center>确定要退出登录吗?</center>',
            title: '退出',
            //subTitle: '2',
            scope: $scope,
            buttons: [
              { text: '取消',
                type: 'button-small',
                onTap: function(e) {
                  
                }
              },
              {
                text: '<b>确定</b>',
                type: 'button-small button-positive ',
                onTap: function(e) {
                    $state.go('signin');
                    Storage.rm('TOKEN');
                    var USERNAME=Storage.get("USERNAME");
                    //Storage.clear();
                    Storage.set("IsSignIn","No");
                     Storage.set("USERNAME",USERNAME);
                     //$timeout(function () {
                     $ionicHistory.clearCache();
                     $ionicHistory.clearHistory();
                    //}, 30);
                    //$ionicPopup.hide();
                }
              }
            ]
          });

  }

  $scope.About = function(){
    $state.go('about');
  }

  $scope.ChangePassword = function(){
    $state.go('changePassword');
  }


  //根据用户ID查询用户头像
  var readImage = function(){
    var PhotoAddress = Storage.get("user.image");
    if(PhotoAddress=="" || PhotoAddress == null){
      $scope.imgurl = "img/DefaultAvatar.jpg";
    }
    else{
      $scope.imgurl = PhotoAddress;//待修改，读取头像地址
    }
  }
  readImage();

  // 上传头像的点击事件----------------------------
  $scope.onClickCamera = function($event){
    $scope.openPopover($event);
  };
 
 // 上传照片并将照片读入页面-------------------------
  var photo_upload_display = function(imgURI){
   // 给照片的名字加上时间戳
    var temp_photoaddress = Storage.get("USERNAME") + "_" + new Date().getTime() + ".jpg";
    Camera.uploadPicture(imgURI, temp_photoaddress).then(function(r){
            // 上传照片
      Storage.set("user.image",imgURI);
      readImage();

        
    }) // 上传照片结束
  };
  //-----------------------上传头像---------------------
      // ionicPopover functions 弹出框的预定义
        //--------------------------------------------
        // .fromTemplateUrl() method
      $ionicPopover.fromTemplateUrl('my-popover.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(popover) {
        $scope.popover = popover;
      });
      $scope.openPopover = function($event) {
        $scope.popover.show($event);
      };
      $scope.closePopover = function() {
        $scope.popover.hide();
      };
      //Cleanup the popover when we're done with it!
      $scope.$on('$destroy', function() {
        $scope.popover.remove();
      });
      // Execute action on hide popover
      $scope.$on('popover.hidden', function() {
        // Execute action
      });
      // Execute action on remove popover
      $scope.$on('popover.removed', function() {
        // Execute action
      });

  // 相册键的点击事件---------------------------------
    $scope.onClickCameraPhotos = function(){        
       // console.log("选个照片"); 
       $scope.choosePhotos();
       $scope.closePopover();
    };      
    $scope.choosePhotos = function() {
      Camera.getPictureFromPhotos().then(function(data) {
          // data里存的是图像的地址
          // console.log(data);
          var imgURI = data; 
          photo_upload_display(imgURI);
        }, function(err) {
          // console.err(err);
          var imgURI = undefined;
        });// 从相册获取照片结束
      }; // function结束
      // 照相机的点击事件----------------------------------
      $scope.getPhoto = function() {
        // console.log("要拍照了！");
        $scope.takePicture();
        $scope.closePopover();
      };
      $scope.takePicture = function() {
       Camera.getPicture().then(function(data) {
          // data里存的是图像的地址
          // console.log(data);
          var imgURI = data;
          photo_upload_display(imgURI);
        }, function(err) {
            // console.err(err);
            var imgURI = undefined;
        })// 照相结束
      }; // function结束


}])

//咨询记录--PXY
.controller('ConsultRecordCtrl', ['$scope','$timeout','$state','$ionicHistory',function($scope, $timeout,$state,$ionicHistory) {
  $scope.barwidth="width:0%";

  $scope.Goback = function(){
    $state.go('tab.mine')
  }
  //根据患者ID查询其咨询记录,对response的长度加一定限制
  $scope.items =[
  {
    img:"img/doctor1.PNG",
    name:"李芳",
    time:"2017/03/04",
    response:"您好,糖尿病患者出现肾病的,一般会出现低蛋白血症.低蛋白血症患者一般会出现浮肿.治疗浮肿时就需要适当的补充蛋白,但我们一般提倡使用优质蛋白,我不知道您的蛋白粉是不是植物蛋白,所以您还是慎重一点好."

  },
  {
    img:"img/doctor2.PNG",
    name:"张三",
    time:"2017/03/01",
    response:"糖尿病肾损害的发生发展分5期.Ⅰ期,为糖尿病初期,肾体积增大,肾小球滤过滤增高,肾小球入球小动脉扩张,肾小球内压升高.Ⅱ期,肾小球毛细血管基底膜增厚,尿白蛋白排泄率多正常,或间歇性升高。"

  },
  {
    img:"img/doctor3.PNG",
    name:"李四",
    time:"2017/02/01",
    response:"糖尿病肾损害的发生发展分5期.Ⅰ期,为糖尿病初期,肾体积增大,肾小球滤过滤增高,肾小球入球小动脉扩张,肾小球内压升高.Ⅱ期,肾小球毛细血管基底膜增厚,尿白蛋白排泄率多正常,或间歇性升高。"

  },
  {
    img:"img/doctor4.PNG",
    name:"董星",
    time:"2017/01/01",
    response:"糖尿病肾损害的发生发展分5期.Ⅰ期,为糖尿病初期,肾体积增大,肾小球滤过滤增高,肾小球入球小动脉扩张,肾小球内压升高.Ⅱ期,肾小球毛细血管基底膜增厚,尿白蛋白排泄率多正常,或间歇性升高。"

  },
  {
    img:"img/doctor5.PNG",
    name:"赵冰低",
    time:"2016/01/01",
    response:"糖尿病肾损害的发生发展分5期.Ⅰ期,为糖尿病初期,肾体积增大,肾小球滤过滤增高,肾小球入球小动脉扩张,肾小球内压升高.Ⅱ期,肾小球毛细血管基底膜增厚,尿白蛋白排泄率多正常,或间歇性升高。"

  }
  

  ]
    
  $scope.getConsultRecordDetail = function() {
    $state.go("tab.consult-chat")
  }

  
}])
//聊天 XJZ 
.controller('ChatCtrl',['$scope', '$state', '$rootScope', '$ionicModal', '$ionicScrollDelegate', '$ionicHistory', 'Camera', 'voice','$http', function($scope, $state, $rootScope, $ionicModal, $ionicScrollDelegate, $ionicHistory, Camera, voice,$http) {
    $scope.input = {
        text: ''
    }
    $scope.params = {
        msgCount: 0,
        helpDivHeight: 30,
        hidePanel: true,
        moreMsgs:true
    }
    $scope.msgs = [];
    $scope.scrollHandle = $ionicScrollDelegate.$getByHandle('myContentScroll');
    //render msgs 
    $scope.$on('$ionicView.beforeEnter', function() {
        $state.params.chatId='13709553333';
        if($state.params.type=='0') $scope.params.hidePanel=false;
        // if (window.JMessage) {
        //     window.JMessage.enterSingleConversation($state.params.chatId, "");
        //     getMsg(30);
        // }
        getMsg(30);
    });
    $scope.$on('$ionicView.enter', function() {
        $rootScope.conversation.type = 'single';
        $rootScope.conversation.id = $state.params.chatId;
    })
    // function msgsRender(first,last){
    //     while(first!=last){
    //         $scope.msgs[first+1].diff=($scope.msgs[first+1].createTimeInMillis-$scope.msgs[first].createTimeInMillis)>300000?true:false;
    //         first++;
    //     }
    // }
    function getMsg(num){
      if (!window.JMessage){
        function msgsRender(first,last){
                $scope.msgs[first].diff=true;
                while(first!=last){
                    $scope.msgs[first+1].diff=($scope.msgs[first+1].createTimeInMillis-$scope.msgs[first].createTimeInMillis)>300000?true:false;
                    first++;
                }
            }
            $http.get("data/sampleMsgs.json").success(function(data) {
                $scope.msgs = data;
                // $scope.$apply(function(){
                    msgsRender(0,data.length-1);
                // });
                // 

            });
            return;
      }


        window.JMessage.getHistoryMessages("single",$state.params.chatId,"",$scope.params.msgCount,num,
            function(response){
                // console.log(response);
                $scope.$broadcast('scroll.refreshComplete');
                if(!response) $scope.params.moreMsgs=false;
                else{
                    var res=JSON.parse(response);
                console.log(res);
                    $scope.$apply(function(){
                        if($scope.msgs[0]) $scope.msgs[0].diff=($scope.msgs[0].createTimeInMillis-res[0].createTimeInMillis)>300000?true:false;
                        for(var i=0;i<res.length-1;++i){
                            res[i].diff=(res[i+1].createTimeInMillis-res[i].createTimeInMillis)>300000?true:false;
                            $scope.msgs.unshift(res[i]);
                        }
                        $scope.msgs.unshift(res[i]);
                        $scope.msgs[0].diff=true;
                        // msgsRender(0,i-1);
                    });
                    // console.log($scope.msgs);
                    setTimeout(function(){
                        $scope.scrollHandle.scrollBottom(true);
                    },100);
                    // $ionicScrollDelegate.scrollBottom();
                    $scope.params.msgCount+=res.length;
                }
                
            },
            function(err){
                $scope.$broadcast('scroll.refreshComplete');
            });
    }

    function viewUpdate(length,scroll){
        if($scope.params.msgCount==0) getMsg(1);
        var num = $scope.params.msgCount<length?$scope.params.msgCount:length;
        if(num==0) return;
         window.JMessage.getHistoryMessages("single",$state.params.chatId,"",0,num,
            function(response){

                var res=JSON.parse(response);
                $scope.$apply(function(){
                    for(var i=res.length-1,j=$scope.params.msgCount-res.length;i>=0;){
                        if(j==$scope.params.msgCount){
                            $scope.params.msgCount+=i+1;
                        while(i>-1){
                            res[i].diff= (res[i+1].createTimeInMillis-res[i].createTimeInMillis)>300000?true:false;
                            $scope.msgs.push(res[i]);
                            i--;
                        }
                            // for(var k=0;k<i)
                            // $scope.msgs=$scope.msgs.concat(res.slice(0,i+1));
                            // msgsRender($scope.msgs.length-res.length,$scope.msgs.length-1);
                            // break;
                        }else if($scope.msgs[j]['_id']==res[i]['_id']){
                            $scope.msgs[j].status=res[i].status;
                            ++j;--i;
                        }else{
                             ++j;
                        }

                    }   
                });
                // if(scroll){
                    setTimeout(function(){
                        $scope.scrollHandle.scrollBottom();
                    },100);
                // }
            },function(){

            });
    }
    //receiving new massage
    $scope.$on('receiveMessage', function(event, msg) {
        if (msg.targetType == 'single' && msg.fromName == $state.params.chatId) {
            viewUpdate(5);
        }
    });

    $scope.DisplayMore = function() {
        getMsg(30);
    }
    $scope.scrollBottom = function() {
        $scope.scrollHandle.scrollBottom(true);
    }


    //view image
    $scope.zoomMin = 1;
    $scope.imageUrl = '';
    $scope.sound = {};
    $ionicModal.fromTemplateUrl('partials/tabs/consult/msg/imageViewer.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.modal = modal;
        // $scope.modal.show();
        $scope.imageHandle = $ionicScrollDelegate.$getByHandle('imgScrollHandle');
    });

    function onImageLoad(path) {
        $scope.$apply(function() {
            $scope.imageUrl = path;
        })

    }

    function onImageLoadFail(err) {

    }
    $scope.$on('image', function(event, args) {
        console.log(args)
        event.stopPropagation();
        $scope.imageHandle.zoomTo(1, true);
        $scope.imageUrl = args[2];
        $scope.modal.show();
        if (args[1] == 'img') {
            window.JMessage.getOriginImageInSingleConversation($state.params.chatId, args[3], onImageLoad, onImageLoadFail);
        } else {
            // getImage(url,onImageLoad,onImageLoadFail)
            $scope.imageUrl = args[3];
        }
    })
    $scope.closeModal = function() {
        $scope.imageHandle.zoomTo(1, true);
        $scope.modal.hide();
        // $scope.modal.remove()
    };
    $scope.switchZoomLevel = function() {
        if ($scope.imageHandle.getScrollPosition().zoom != $scope.zoomMin)
            $scope.imageHandle.zoomTo(1, true);
        else {
            $scope.imageHandle.zoomTo(5, true);
        }
    }
    $scope.$on('voice', function(event, args) {
        console.log(args)
        event.stopPropagation();
        $scope.sound = new Media(args[1],
            function() {
                // resolve(audio.media)
            },
            function(err) {
                console.log(err);
                // reject(err);
            })
        $scope.sound.play();
    })
    $scope.$on('profile', function(event, args) {
            console.log(args)
            event.stopPropagation();
        })

    //病例Panel
    $scope.togglePanel = function() {
        $scope.params.hidePanel = !$scope.params.hidePanel;
    }
    $scope.content = {
        pics: [
            'img/avatar.png',
            'img/max.png',
            'img/mike.png'
        ]
    }
    $scope.viewPic = function(url) {
            $scope.imageUrl = url;
            $scope.modal.show();
        }
    // send message--------------------------------------------------------------------------------
        //
    function onSendSuccess(res) {
        viewUpdate(10);
    }

    function onSendErr(err) {
        console.log(err);
        alert('[send msg]:err');
        viewUpdate(20);
    }
    $scope.submitMsg = function() {
            window.JMessage.sendSingleTextMessage($state.params.chatId, $scope.input.text, '', onSendSuccess, onSendErr);
            $scope.input.text = '';
            viewUpdate(5, true);
            // window.JMessage.getHistoryMessages("single",$state.params.chatId,"",0,3,addNewSend,null);
            
        }
        //get image
    $scope.getImage = function(type) {
            Camera.getPicture(type)
                .then(function(url) {
                    console.log(url);

                    window.JMessage.sendSingleImageMessage($state.params.chatId, url, '', onSendSuccess, onSendErr);
                    viewUpdate(5, true);
                    // window.JMessage.getHistoryMessages("single",$state.params.chatId,"",0,3,addNewSend,null);

                }, function(err) {
                    console.log(err)
                })
        }
        //get voice
    $scope.getVoice = function(){
        //voice.record() do 2 things: record --- file manipulation 
        voice.record()
        .then(function(fileUrl){
            window.JMessage.sendSingleVoiceMessage($state.params.chatId,fileUrl,'',
            function(res){
                console.log(res);
                viewUpdate(5,true);
            },function(err){
                console.log(err);
            });
            viewUpdate(5,true);
        },function(err){
            console.log(err);
        });

    }
    $scope.stopAndSend = function() {
        voice.stopRec();
    }

    $scope.goChats = function() {
        // $ionicHistory.nextViewOptions({
        //     disableBack: true
        // });
        // if($state.params.type=="1") $state.go('tab.doing');
        $ionicHistory.goBack();
    }


    $scope.$on('keyboardshow', function(event, height) {
        $scope.params.helpDivHeight = height + 30;
        setTimeout(function() {
            $scope.scrollHandle.scrollBottom();
        }, 100);

    })
    $scope.$on('keyboardhide', function(event) {
        $scope.params.helpDivHeight = 30;
        // $ionicScrollDelegate.scrollBottom();
    })
    $scope.$on('$ionicView.leave', function() {
        $scope.modal.remove();
        $rootScope.conversation.type = null;
        $rootScope.conversation.id = '';
        if(window.JMessage) window.JMessage.exitConversation();
    })
}])



//健康信息--PXY
.controller('HealthInfoCtrl', ['$scope','$timeout','$state','$ionicHistory','$ionicPopup','HealthInfo',function($scope, $timeout,$state,$ionicHistory,$ionicPopup,HealthInfo) {
  $scope.barwidth="width:0%";

  $scope.Goback = function(){
    $state.go('tab.mine')
  }

  //console.log(HealthInfo.getall());

  $scope.items = HealthInfo.getall();
  


  $scope.DeleteHealth = function(number){
    //console.log(number);
     //  confirm 对话框
    
    var confirmPopup = $ionicPopup.confirm({
      title: '删除提示',
      template: '记录删除后将无法恢复，确认删除？',
      cancelText:'取消',
      okText:'删除'
    });
    confirmPopup.then(function(res) {
      if(res) 
        {
          HealthInfo.remove(number);
          $scope.items = HealthInfo.getall();
        } 
      });
  }

  $scope.newHealth = function(){
    $state.go('tab.myHealthInfoDetail',{id:null});
  }

  $scope.EditHealth = function(editId){
    console.log("健康信息");
    console.log(editId);
    $state.go('tab.myHealthInfoDetail',{id:editId});
  }

  
}])


//健康详情--PXY
.controller('HealthDetailCtrl', ['$scope','$state','$ionicHistory','$ionicPopup','$stateParams','HealthInfo','$ionicLoading','$timeout',function($scope, $state,$ionicHistory,$ionicPopup,$stateParams,HealthInfo,$ionicLoading,$timeout) {
  $scope.barwidth="width:0%";

  $scope.Goback = function(){
    $ionicHistory.goBack();
  }

  // 获取标签类别
  $scope.labels = {}; // 初始化
  $scope.labels =
  [
    {Name:"检查",Type:1},
    {Name:"化验",Type:2},
    {Name:"用药",Type:3},
    {Name:"病历",Type:4},
  ];
  //判断是修改还是新增
  if($stateParams.id!=null && $stateParams!=""){
    //修改
    var info = HealthInfo.search($stateParams.id);
    $scope.health={
      label:info.type,
      date:info.time,
      text:info.description,
      imgurl:info.img
    }
  }
  else{
    //新增
    $scope.health={
      label:{Name:"检查",Type:1},
      date:"",
      text:"",
      imgurl:"img/healthInfo.jpg"
    }
  }

  

  $scope.HealthInfoSetup = function(information){
    if(information.date!=""&&information.text!=""){
        if($stateParams.id==null||$stateParams==""){
            HealthInfo.new(information);
            $ionicLoading.show({
                template:'健康信息保存成功！',
                duration:1000
            });
            $timeout(function(){$state.go('tab.myHealthInfo');},1000);

        }
        else{
            HealthInfo.edit($stateParams.id,information);
            $ionicLoading.show({
                template:'健康信息保存成功！',
                duration:1000
            });
            $timeout(function(){$state.go('tab.myHealthInfo');},1000);
        }
    }
    else{
        $ionicLoading.show({
            template:'信息填写不完整',
            duration:1000
        });
    }

}


  // --------datepicker设置----------------
  var  monthList=["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];
  var weekDaysList=["日","一","二","三","四","五","六"];
  var datePickerCallback = function (val) {
    if (typeof(val) === 'undefined') {
      console.log('No date selected');
    } else {
      $scope.datepickerObject4.inputDate=val;
      var dd=val.getDate();
      var mm=val.getMonth()+1;
      var yyyy=val.getFullYear();
      var d=dd<10?('0'+String(dd)):String(dd);
      var m=mm<10?('0'+String(mm)):String(mm);
      //日期的存储格式和显示格式不一致
      $scope.health.date=yyyy+'/'+m+'/'+d;
    }
  };
  $scope.datepickerObject4 = {
    titleLabel: '时间日期',  //Optional
    todayLabel: '今天',  //Optional
    closeLabel: '取消',  //Optional
    setLabel: '设置',  //Optional
    setButtonType : 'button-assertive',  //Optional
    todayButtonType : 'button-assertive',  //Optional
    closeButtonType : 'button-assertive',  //Optional
    mondayFirst: false,    //Optional
    //disabledDates: disabledDates, //Optional
    weekDaysList: weekDaysList,   //Optional
    monthList: monthList, //Optional
    templateType: 'popup', //Optional
    showTodayButton: 'false', //Optional
    modalHeaderColor: 'bar-positive', //Optional
    modalFooterColor: 'bar-positive', //Optional
    from: new Date(1900, 1, 1),   //Optional
    to: new Date(),    //Optional
    callback: function (val) {    //Mandatory
      datePickerCallback(val);
    }
  };  
//--------------




  
}])



//增值服务--PXY
.controller('MoneyCtrl', ['$scope','$state','$ionicHistory',function($scope, $state,$ionicHistory) {
  $scope.barwidth="width:0%";

  $scope.Goback = function(){
    $state.go('tab.mine')
  }
  //查询余额等等。。。。。

 $scope.freeTimesRemain ="0";
 $scope.TimesRemain ="3";
 $scope.Balance = "87";

  
}])



//消息中心--PXY
.controller('messageCtrl', ['$scope','$state','$ionicHistory', function($scope, $state,$ionicHistory) {
  $scope.barwidth="width:0%";

  $scope.Goback = function(){
    $ionicHistory.goBack();
  }

  $scope.getMessageDetail = function(type){
    $state.go('messagesDetail',{messageType:type});
  }

  $scope.getConsultRecordDetail = function () {
    $state.go("tab.consult-chat")
  }
  //查询余额等等。。。。。
 $scope.messages =[
  {
    img:"img/pay.PNG",
    name:"支付消息",
    type:1,
    time:"2017/04/01",
    response:"恭喜你！成功充值50元，交易账号为0093842345."
  },
  {
    img:"img/task.PNG",
    name:"任务消息",
    type:2,
    time:"2017/03/21",
    response:"今天还没有测量血压，请及时完成！"

  },
  {
    img:"img/alert.PNG",
    name:"警报消息",
    type:3,
    time:"2017/03/11",
    response:"你的血压值已超出控制范围！"

  }]


  $scope.consults =[
  {
    img:"img/doctor1.PNG",
    name:"李芳",
    time:"2017/03/04",
    response:"您好,糖尿病患者出现肾病的,一般会出现低蛋白血症.低蛋白血症患者一般会出现浮肿.治疗浮肿时就需要适当的补充蛋白,但我们一般提倡使用优质蛋白,我不知道您的蛋白粉是不是植物蛋白,所以您还是慎重一点好."

  },
  {
    img:"img/doctor2.PNG",
    name:"张三",
    time:"2017/03/01",
    response:"糖尿病肾损害的发生发展分5期.Ⅰ期,为糖尿病初期,肾体积增大,肾小球滤过滤增高,肾小球入球小动脉扩张,肾小球内压升高.Ⅱ期,肾小球毛细血管基底膜增厚,尿白蛋白排泄率多正常,或间歇性升高。"

  },
  {
    img:"img/doctor3.PNG",
    name:"李四",
    time:"2017/02/01",
    response:"糖尿病肾损害的发生发展分5期.Ⅰ期,为糖尿病初期,肾体积增大,肾小球滤过滤增高,肾小球入球小动脉扩张,肾小球内压升高.Ⅱ期,肾小球毛细血管基底膜增厚,尿白蛋白排泄率多正常,或间歇性升高。"

  },
  {
    img:"img/doctor4.PNG",
    name:"董星",
    time:"2017/01/01",
    response:"糖尿病肾损害的发生发展分5期.Ⅰ期,为糖尿病初期,肾体积增大,肾小球滤过滤增高,肾小球入球小动脉扩张,肾小球内压升高.Ⅱ期,肾小球毛细血管基底膜增厚,尿白蛋白排泄率多正常,或间歇性升高。"

  },
  {
    img:"img/doctor5.PNG",
    name:"赵冰低",
    time:"2016/01/01",
    response:"糖尿病肾损害的发生发展分5期.Ⅰ期,为糖尿病初期,肾体积增大,肾小球滤过滤增高,肾小球入球小动脉扩张,肾小球内压升高.Ⅱ期,肾小球毛细血管基底膜增厚,尿白蛋白排泄率多正常,或间歇性升高。"

  }
  

  ]
    

    

  
}])


//消息类型--PXY
.controller('VaryMessageCtrl', ['$scope','$state','$ionicHistory','$stateParams',function($scope, $state,$ionicHistory,$stateParams) {
  $scope.barwidth="width:0%";
  switch($stateParams.messageType){
    case 1:
    $scope.title = '支付消息';
    $scope.messages = [
    {
        img:"img/pay.PNG",
        time:"2017/04/01",
        response:"恭喜你！成功充值50元，交易账号为0093842345."
    },
    {
        img:"img/moneyout.PNG",
        time:"2017/03/02",
        response:"咨询支出20元，账户余额为10元，交易账号为0045252623."
    },
    {
        img:"img/moneyout.PNG",
        time:"2017/02/12",
        response:"咨询支出20元，账户余额为30元，交易账号为004525212."
    },
    {
        img:"img/pay.PNG",
        time:"2017/02/02",
        response:"恭喜你！成功充值50元，交易账号为0093840202."
    },
    {
        img:"img/moneyout.PNG",
        time:"2017/02/02",
        response:"咨询支出10元，账户余额为0元，交易账号为0045250202."
    },
    {
        img:"img/moneyout.PNG",
        time:"2017/01/02",
        response:"咨询支出10元，账户余额为10元，交易账号为0045250102."
    },
    {
        img:"img/pay.PNG",
        time:"2016/03/02",
        response:"恭喜你！成功充值20元，交易账号为0093842356."
    },
    {
        img:"img/pay.PNG",
        time:"2016/01/02",
        response:"恭喜你！成功充值20元，交易账号为009320163425."
    },
    {
        img:"img/pay.PNG",
        time:"2016/01/01",
        response:"恭喜你！成功充值20元，交易账号为00325262423"
    }];
    break;
    case 2:
    $scope.title = '任务消息';
    $scope.messages =[
  
    {
        img:"img/bloodpressure.PNG",
        time:"2017/03/21",
        response:"今天还没有测量血压，请及时完成！"

    },
    {
        img:"img/exercise.PNG",
        time:"2017/03/11",
        response:"今天建议运动半小时，建议以散步或慢跑的形式！"

    },
    {
        img:"img/heartRoute.PNG",
        time:"2017/02/10",
        response:"今天还没有测量血管通路，请及时完成！"

    },
    {
        img:"img/heartbeat.PNG",
        time:"2017/01/11",
        response:"今天还没有记录心率，请及时完成！"

    },
    {
        img:"img/heartbeat.PNG",
        time:"2017/01/01",
        response:"今天还没有记录心率，请及时完成！"

    },
    {
        img:"img/heartbeat.PNG",
        time:"2016/10/01",
        response:"今天还没有记录心率，请及时完成！"

    },
    {
        img:"img/urine.PNG",
        time:"2016/10/01",
        response:"今天还没有记录尿量，请及时完成！"
    },
    {
        img:"img/temperature.PNG",
        time:"2016/10/01",
        response:"今天还没有记录体温，请及时完成！"
    },
    {
        img:"img/pounds.PNG",
        time:"2016/10/01",
        response:"今天还没有记录体重，请及时完成！"
    }

    ];
    break;
    case 3:
    $scope.title = '警报消息';
    $scope.messages =[
  
    {
        img:"img/bloodpressure.PNG",
        time:"2017/03/11",
        response:"你的血压值已超出控制范围！"

    },
    {
        img:"img/bloodpressure.PNG",
        time:"2017/03/07",
        response:"你的血压值已超出控制范围！"

    },
    {
        img:"img/pounds.PNG",
        time:"2017/02/07",
        response:"你的体重值已超出控制范围！"

    },
    {
        img:"img/temperature.PNG",
        time:"2017/01/07",
        response:"你的体温值已超出控制范围！"

    },
    {
        img:"img/temperature.PNG",
        time:"2016/11/07",
        response:"你的体温值已超出控制范围！"

    },
    {
        img:"img/exercise.PNG",
        time:"2016/10/07",
        response:"你已经超过一周没进行运动！"

    },
    {
        img:"img/heartbeat.PNG",
        time:"2016/05/07",
        response:"你的心率不太正常，建议及时就医！"

    },
    {
        img:"img/pounds.PNG",
        time:"2016/02/07",
        response:"你的体重值已超出控制范围！"

    }

    ];
    break;

  }

  $scope.Goback = function(){
    $ionicHistory.goBack();
  }

  
}])
  
  



//医生列表--PXY
.controller('DoctorCtrl', ['$scope','$state','$ionicHistory','DoctorsInfo','Dict','Patient','$location',function($scope, $state,$ionicHistory,DoctorsInfo,Dict,Patient,$location) {
  $scope.barwidth="width:0%";
  $scope.Goback = function(){
    $ionicHistory.goBack();
  }
  //清空搜索框
  $scope.clearSearch = function(){  
    $scope.searchCont = {};  
    //清空之后获取所有医生  
  }  

  $scope.search = function(){
  //如果筛选条件还未清空的话，是在已筛选里搜索？
  }
  //省、市、医院三级查询，联动

  // $scope.Provinces=[
  // {
  //   name:"省份",
  //   province:0
  // },
  // {
  //   name:"浙江",
  //   province:1
  // },
  // {
  //   name:"江苏",
  //   province:2
  // }];
  // $scope.Cities=[
  // {
  //   name:"地市",
  //   city:0
  // },
  // {
  //   name:"杭州",
  //   city:1
  // },
  // {
  //   name:"苏州",
  //   city:2
  // }];
  // $scope.Districts=[
  // {
  //   name:"区县",
  //   district:0
  // },
  // {
  //   name:"上城区",
  //   district:1
  // },
  // {
  //   name:"下城区",
  //   district:2
  // }];
  // $scope.Hospitals=[
  // {
  //   Name:"医院",
  //   Type:0
  // },
  // {
  //   Name:"浙一",
  //   Type:1
  // },
  // {
  //   Name:"浙二",
  //   Type:2
  // }];
  $scope.Provinces="";
  $scope.Cities="";
  $scope.Districts="";
  $scope.Hospitals="";
  Dict.getDistrict({level:"1",province:"",city:"",district:""}).then(
      function(data)
      {
        $scope.Provinces = data.results
        console.log($scope.Provinces)
      },
      function(err)
      {
        console.log(err);
      }
    )

  $scope.getCity = function (province) {
    console.log($scope.Province)
    Dict.getDistrict({level:"2",province:province.province,city:"",district:""}).then(
      function(data)
      {
        $scope.Cities = data.results
        console.log($scope.Cities)
      },
      function(err)
      {
        console.log(err);
      }
    )
  }
  
  $scope.getDistrict = function (city) {
    Dict.getDistrict({level:"3",province:city.province,city:city.city,district:""}).then(
      function(data)
      {
        $scope.Districts = data.results
        console.log($scope.Districts)
      },
      function(err)
      {
        console.log(err);
      }
    )
  }

  $scope.getHospital = function (district) {
    var locationCode = district.province + district.city + district.district
    console.log(locationCode)
    Dict.getHospital({locationCode: locationCode,hostipalCode:""}).then(
      function(data)
      {
        $scope.Hospitals = data.results
        console.log($scope.Hospitals)
      },
      function(err)
      {
        console.log(err);
      }
    )
  }
  
  $scope.getDoctorByHospital = function (hospital) {

    Patient.getDoctorLists({workUnit: hospital.hospitalName}).then(
      function(data)
      {
        $scope.doctors = data.results
        console.log($scope.doctors)
      },
      function(err)
      {
        console.log(err);
      }
    )
  }
  $scope.allDoctors = function(){
    $state.go('tab.AllDoctors');
  }


  $scope.getDoctorDetail = function(ele, id) {
    // var path = '#/tab/DoctorDetail/' + id;
    // console.log(path)
    if (ele.target.innerText == '咨询') $state.go("tab.consultquestion1");
    else if (ele.target.innerText == '问诊') $state.go("tab.consultquestion1");
    else $state.go('tab.DoctorDetail',{DoctorId:id})
    // else $location.path(path)
  }


  $scope.doctors = "";
  $scope.mydoctors = "";
  Patient.getDoctorLists().then(
      function(data)
      {
        $scope.doctors = data.results
        console.log($scope.doctors)
      },
      function(err)
      {
        console.log(err);
      }
    )
  Patient.getMyDoctors({userId:"p01"}).then(
      function(data)
      {
        $scope.mydoctors = data.results.doctors
        console.log($scope.mydoctors)
      },
      function(err)
      {
        console.log(err);
      }
    )

  $scope.question = function(){
    $state.go("tab.consultquestion1")
  }

  $scope.consult = function(){
    $state.go("tab.consultquestion1")
  }


}])


.controller('DoctorDetailCtrl', ['$scope','$state','$ionicHistory','$stateParams','DoctorsInfo','$stateParams','Doctor',function($scope, $state,$ionicHistory,$stateParams,DoctorsInfo,$stateParams,Doctor) {
  $scope.Goback = function(){
    $ionicHistory.goBack();
  }
  var DoctorId = $stateParams.DoctorId

  $scope.doctor = "";
  Doctor.getDoctorInfo({userId:DoctorId}).then(
      function(data)
      {
        $scope.doctor = data.results[0].doctorId
        console.log($scope.doctor)
      },
      function(err)
      {
        console.log(err);
      }
    )

  $scope.question = function(){
    $state.go("tab.consultquestion1")
  }

  $scope.consult = function(){
    $state.go("tab.consultquestion1")
  }
}])


//关于--PXY
.controller('aboutCtrl', ['$scope','$timeout','$state','Storage','$ionicHistory', function($scope, $timeout,$state,Storage,$ionicHistory) {
   
  $scope.Goback = function(){
    $ionicHistory.goBack();
  }
  
}])



//修改密码--PXY
.controller('changePasswordCtrl', ['$scope','$timeout','$state','Storage','$ionicHistory', function($scope, $timeout,$state,Storage,$ionicHistory) {
   
  $scope.Goback = function(){
    $ionicHistory.goBack();
  }
  console.log("hi");

  $scope.ishide=true;
  $scope.change={oldPassword:"",newPassword:"",confirmPassword:""};


  $scope.passwordCheck = function(change){
    $scope.logStatus1='';
    if(change.oldPassword!=""){
        var username = Storage.get('USERNAME');
        var usernames = Storage.get('usernames').split(",");
        var index = usernames.indexOf(username);
        var passwords = Storage.get('passwords').split(",");
        if(passwords[index]!=change.oldPassword){
          $scope.logStatus1 = "密码错误！";
        }
        else{
          $scope.logStatus1='验证成功';
          $timeout(function(){$scope.ishide=false;} , 500);

        }
        
        
    }
    else{
      $scope.logStatus1='请输入旧密码！'
    }
    
  }

  $scope.gotoChange = function(change){
    $scope.logStatus2='';
    if((change.newPassword!="") && (change.confirmPassword!="")){
      if(change.newPassword == change.confirmPassword){

          //把新用户和密码写入
          var username = Storage.get('USERNAME');
          var usernames = Storage.get('usernames').split(",");
          var index = usernames.indexOf(username);
          var passwords = Storage.get('passwords').split(",");
          passwords[index] = change.newPassword;
         
          Storage.set('passwords',passwords);
          $scope.logStatus2 ="修改密码成功！";
          $timeout(function(){$scope.change={originalPassword:"",newPassword:"",confirmPassword:""};
          $state.go('tab.tasklist');
          $scope.ishide=true;
          } , 500);
      }else{
        $scope.logStatus2="两次输入的密码不一致";
      }
    }else{
      $scope.logStatus2="请输入两遍新密码"
    }
  }
  
}])

//肾病保险主页面--TDY
.controller('insuranceCtrl', ['$scope', '$state', '$ionicHistory',function ($scope, $state,$ionicHistory) {
  var show = false;

  $scope.isShown = function() {
        return show;
  };

  $scope.toggle = function() {
        show = !show;
  };

  $scope.intension = function(){
    $state.go("intension")
  }

  $scope.expense = function(){
    $state.go("insuranceexpense")
  }

  $scope.kidneyfunction = function(){
    $state.go("kidneyfunction")
  }

  $scope.staff = function(){
    $state.go("insurancestafflogin")
  }

  $scope.submitintension = function(){
    alert("您的信息已发送到后台，在24小时内会有相关人员与您联系")
  }

  $scope.cancel = function(){
    $state.go("insurance")
  }

  $scope.Goback = function(){
    $state.go("insurance")
  }

  $scope.Back = function(){
    $ionicHistory.goBack()
  }
}])

//肾病保险相关工具--TDY
.controller('insurancefunctionCtrl', ['$scope', '$state', '$http', function ($scope, $state, $http) {
  $scope.InsuranceInfo = {
    "InsuranceAge": null,
    "Gender": "NotSelected",
    "InsuranceTime": "5年",
    "CalculationType": "CalculateMoney",
    "InsuranceMoney": null,
    "InsuranceExpense": 0,
    "InsuranceParameter": 0
  }

  $scope.Kidneyfunction = {
    "Gender": "NotSelected",
    "Age": null,
    "CreatinineUnit": "mg/dl",
    "Creatinine": null,
    "KidneyfunctionValue": 0
  }

  $scope.Genders = [
    {
      "Type": "NotSelected",
      "Name":"请选择",
      "No": 0
    },
    {
      "Type": "Male",
      "Name":"男",
      "No": 1
    },
    {
      "Type": "Female",
      "Name":"女",
      "No": 2
    }
  ]

  $scope.InsuranceTimes =[
    {
      "Time":"5年"
    },
    {
      "Time":"10年"
    }
  ]

  $scope.CalculationTypes = [
    {
      "Type": "CalculateMoney",
      "Name":"保费算保额",
      "No": 1
    },
    {
      "Type": "CalculateExpense",
      "Name":"保额算保费",
      "No": 2
    }
  ]

  $http.get("data/InsuranceParameter.json").success(function(data){
    dict = data
  })
  $scope.getexpense = function(){
    if ($scope.InsuranceInfo.InsuranceAge == null)
    {
      alert("请输入年龄")
    }
    if ($scope.InsuranceInfo.Gender == "NotSelected")
    {
      alert("请选择性别")
    }
    if ($scope.InsuranceInfo.InsuranceMoney == null)
    {
      alert("请输入金额")
    }
    for (var i=0;i<dict.length;i++){
      if (dict[i].Age == $scope.InsuranceInfo.InsuranceAge && dict[i].Gender == $scope.InsuranceInfo.Gender && dict[i].Time == $scope.InsuranceInfo.InsuranceTime)
      {
        $scope.InsuranceInfo.InsuranceParameter = dict[i].Parameter
        break
      }
    }
    if ($scope.InsuranceInfo.CalculationType == "CalculateMoney")
    {
      $scope.InsuranceInfo.InsuranceExpense = $scope.InsuranceInfo.InsuranceMoney*$scope.InsuranceInfo.InsuranceParameter/1000
      alert("您的保费为：" + $scope.InsuranceInfo.InsuranceExpense)
    }
    else if ($scope.InsuranceInfo.CalculationType == "CalculateExpense")
    {
      $scope.InsuranceInfo.InsuranceExpense = 1000*$scope.InsuranceInfo.InsuranceMoney/$scope.InsuranceInfo.InsuranceParameter
      alert("您的保额为：" + $scope.InsuranceInfo.InsuranceExpense)
    }
  }

  $scope.resetexpense = function(){
    $scope.InsuranceInfo = {
      "InsuranceAge": null,
      "Gender": "NotSelected",
      "InsuranceTime": "5年",
      "CalculationType": "CalculateMoney",
      "InsuranceMoney": null,
      "InsuranceExpense": 0
    }
  }

  $scope.getkidneyfunction = function(){
    if ($scope.Kidneyfunction.Age == null)
    {
      alert("请输入年龄")
    }
    if ($scope.Kidneyfunction.Creatinine == null)
    {
      alert("请输入肌酐")
    }
    if ($scope.Kidneyfunction.CreatinineUnit == "mg/dl" && $scope.Kidneyfunction.Gender == "Female")
    {
      if ($scope.Kidneyfunction.Creatinine <= 0.7)
      {
        $scope.Kidneyfunction.KidneyfunctionValue = 144*Math.pow(($scope.Kidneyfunction.Creatinine/0.7),-0.329)*Math.pow(0.993,$scope.Kidneyfunction.Age)
      }
      else
      {
        $scope.Kidneyfunction.KidneyfunctionValue = 144*Math.pow(($scope.Kidneyfunction.Creatinine/0.7),-1.209)*Math.pow(0.993,$scope.Kidneyfunction.Age)
      }
    }
    else if ($scope.Kidneyfunction.CreatinineUnit == "mg/dl" && $scope.Kidneyfunction.Gender == "Male")
    {
      if ($scope.Kidneyfunction.Creatinine <= 0.9)
      {
        $scope.Kidneyfunction.KidneyfunctionValue = 141*Math.pow(($scope.Kidneyfunction.Creatinine/0.9),-0.411)*Math.pow(0.993,$scope.Kidneyfunction.Age)
      }
      else
      {
        $scope.Kidneyfunction.KidneyfunctionValue = 141*Math.pow(($scope.Kidneyfunction.Creatinine/0.9),-1.209)*Math.pow(0.993,$scope.Kidneyfunction.Age)
      }
    }
    alert($scope.Kidneyfunction.KidneyfunctionValue)
  }

  $scope.resetkidneyfunction = function(){
    $scope.Kidneyfunction = {
      "Gender": "NotSelected",
      "Age": null,
      "CreatinineUnit": "mg/dl",
      "Creatinine": null,
      "KidneyfunctionValue": 0
    }
  }

  $scope.Goback = function(){
    $state.go("insurance")
  }
}])

//肾病保险工作人员--TDY
.controller('insurancestaffCtrl', ['$scope', '$state', function ($scope, $state) {
  $scope.intensions = 
  [
    {
      "name": "李爱国",
      "phoneNo": "15688745215"
    },
    {
      "name": "张爱民",
      "phoneNo": "17866656326"
    },
    {
      "name": "步爱家",
      "phoneNo": "13854616548"
    }
  ]

  $scope.stafflogin = function(){
    $state.go("insurancestaff")
  }

  $scope.Goback = function(){
    $state.go("insurance")
  }

  $scope.Back = function(){
    $state.go("insurancestafflogin")
  }
}])
//咨询问卷--TDY
.controller('consultquestionCtrl', ['$scope', '$state', 'Dict','Storage', 'Patient', 'VitalSign','$filter',function ($scope, $state,Dict,Storage,Patient,VitalSign,$filter) {
  $scope.showProgress = false
  $scope.showSurgicalTime = false
  var patientId = Storage.get('UID')
  // var patientId = "U201702080016"
  $scope.Genders =
  [
    {Name:"男",Type:1},
    {Name:"女",Type:2}
  ]

  $scope.BloodTypes =
  [
    {Name:"A型",Type:1},
    {Name:"B型",Type:2},
    {Name:"AB型",Type:3},
    {Name:"O型",Type:4}
  ]

  $scope.Hypers =
  [
    {Name:"是",Type:1},
    {Name:"否",Type:2}
  ]

  //从字典中搜索选中的对象。
  var searchObj = function(code,array){
      for (var i = 0; i < array.length; i++) {
        if(array[i].Type == code || array[i].type == code || array[i].code == code) return array[i];
      };
      return "未填写";
  }

  $scope.Diseases = ""
  $scope.DiseaseDetails = ""
  
  $scope.getDiseaseDetail = function(Disease) {
    if (Disease.typeName == "肾移植")
    {
      $scope.showProgress = false
      $scope.showSurgicalTime = true
    }
    else if (Disease.typeName == "血透")
    {
      $scope.showProgress = false
      $scope.showSurgicalTime = false
    }
    else
    {
      $scope.showProgress = true
      $scope.showSurgicalTime = false
      $scope.DiseaseDetails = Disease.details
    }
  }
  $scope.BasicInfo = 
  {
    "userId": patientId,
    "name": null,
    "gender": null,
    "bloodType": null,
    "hypertension": null,
    "class": null,
    "class_info": null,
    "height": null,
    "weight": null,
    "birthday": null,
    "IDNo": null
  }
  Patient.getPatientDetail({userId: patientId}).then(
      function(data)
      {
        if (data.results != null)
        {
          $scope.BasicInfo.userId = data.results.userId
          $scope.BasicInfo.name = data.results.name
          $scope.BasicInfo.gender = data.results.gender
          $scope.BasicInfo.bloodType = data.results.bloodType
          $scope.BasicInfo.hypertension = data.results.hypertension
          $scope.BasicInfo.class = data.results.class
          $scope.BasicInfo.class_info = data.results.class_info
          $scope.BasicInfo.height = data.results.height
          $scope.BasicInfo.birthday = data.results.birthday
          $scope.BasicInfo.IDNo = data.results.IDNo
        }
        if ($scope.BasicInfo.gender != null)
        {
          $scope.BasicInfo.gender = searchObj($scope.BasicInfo.gender,$scope.Genders)
        }
        if ($scope.BasicInfo.bloodType != null)
        {
          $scope.BasicInfo.bloodType = searchObj($scope.BasicInfo.bloodType,$scope.BloodTypes)
        }
        if ($scope.BasicInfo.hypertension != null)
        {
          $scope.BasicInfo.hypertension = searchObj($scope.BasicInfo.hypertension,$scope.Hypers)
        }
        if ($scope.BasicInfo.birthday != null)
        {
          $scope.BasicInfo.birthday = $scope.BasicInfo.birthday.substr(0,10)
        }
        VitalSign.getVitalSigns({userId:patientId, type: "Weight"}).then(
          function(data)
          {
            var n = data.results.length - 1
            var m = data.results[n].data.length - 1
            $scope.BasicInfo.weight = data.results[n].data[m].value
            // console.log($scope.BasicInfo)
          },
          function(err)
          {
            console.log(err);
          }
        )
        console.log($scope.BasicInfo)
      },
      function(err)
      {
        console.log(err);
      }
    )
  Dict.getDiseaseType({category:'patient_class'}).then(
    function(data)
    {
      $scope.Diseases = data.results[0].content
      if ($scope.BasicInfo.class != null)
      {
        $scope.BasicInfo.class = searchObj($scope.BasicInfo.class,$scope.Diseases)
        if ($scope.BasicInfo.class.typeName == "血透")
        {
          $scope.showProgress = false
          $scope.showSurgicalTime = false
          $scope.BasicInfo.class_info == null
        }
        else if ($scope.BasicInfo.class.typeName == "肾移植")
        {
          $scope.showProgress = false
          $scope.showSurgicalTime = true
          $scope.BasicInfo.class_info = $scope.BasicInfo.class_info
        }
        else
        {
          $scope.showProgress = true
          $scope.showSurgicalTime = false
          $scope.DiseaseDetails = $scope.BasicInfo.class.details
          $scope.BasicInfo.class_info = searchObj($scope.BasicInfo.class_info[0],$scope.DiseaseDetails)              
        }
      }
      console.log($scope.Diseases)
    },
    function(err)
    {
      console.log(err);
    }
  )
  $scope.Questionare = 
  {
    "PatientID": patientId,
    "FirstDiseaseTime": null,
    "LastHospital": null,
    "LastDiagnosisTime": null,
    "LastDiagnosis": null,
    "WantedHelp": null,
    "Title": null
  }

  $scope.images = 
  [
    {
      "image":"img/1.jpg"
    },
    {
      "image":"img/2.jpg"
    },
    {
      "image":"img/3.jpg"
    },
    {
      "image":"img/4.jpg"
    },
    {
      "image":"img/5.jpg"
    },
  ]
  // --------datepicker设置----------------
  var  monthList=["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];
  var weekDaysList=["日","一","二","三","四","五","六"];
  
  // --------诊断日期----------------
  var DiagnosisdatePickerCallback = function (val) {
    if (typeof(val) === 'undefined') {
      console.log('No date selected');
    } else {
      $scope.datepickerObject1.inputDate=val;
      var dd=val.getDate();
      var mm=val.getMonth()+1;
      var yyyy=val.getFullYear();
      var d=dd<10?('0'+String(dd)):String(dd);
      var m=mm<10?('0'+String(mm)):String(mm);
      //日期的存储格式和显示格式不一致
      $scope.Questionare.LastDiagnosisTime=yyyy+'-'+m+'-'+d;
    }
  };
  
  $scope.datepickerObject1 = {
    titleLabel: '诊断日期',  //Optional
    todayLabel: '今天',  //Optional
    closeLabel: '取消',  //Optional
    setLabel: '设置',  //Optional
    setButtonType : 'button-assertive',  //Optional
    todayButtonType : 'button-assertive',  //Optional
    closeButtonType : 'button-assertive',  //Optional
    inputDate: new Date(),    //Optional
    mondayFirst: false,    //Optional
    //disabledDates: disabledDates, //Optional
    weekDaysList: weekDaysList,   //Optional
    monthList: monthList, //Optional
    templateType: 'popup', //Optional
    showTodayButton: 'false', //Optional
    modalHeaderColor: 'bar-positive', //Optional
    modalFooterColor: 'bar-positive', //Optional
    from: new Date(1900, 1, 1),   //Optional
    to: new Date(),    //Optional
    callback: function (val) {    //Mandatory
      DiagnosisdatePickerCallback(val);
    }
  };  
  // --------手术日期----------------
  var OperationdatePickerCallback = function (val) {
    if (typeof(val) === 'undefined') {
      console.log('No date selected');
    } else {
      $scope.datepickerObject2.inputDate=val;
      var dd=val.getDate();
      var mm=val.getMonth()+1;
      var yyyy=val.getFullYear();
      var d=dd<10?('0'+String(dd)):String(dd);
      var m=mm<10?('0'+String(mm)):String(mm);
      //日期的存储格式和显示格式不一致
      $scope.BasicInfo.class_info=yyyy+'-'+m+'-'+d;
    }
  };
  $scope.datepickerObject2 = {
    titleLabel: '手术日期',  //Optional
    todayLabel: '今天',  //Optional
    closeLabel: '取消',  //Optional
    setLabel: '设置',  //Optional
    setButtonType : 'button-assertive',  //Optional
    todayButtonType : 'button-assertive',  //Optional
    closeButtonType : 'button-assertive',  //Optional
    mondayFirst: false,    //Optional
    //disabledDates: disabledDates, //Optional
    weekDaysList: weekDaysList,   //Optional
    monthList: monthList, //Optional
    templateType: 'popup', //Optional
    showTodayButton: 'false', //Optional
    modalHeaderColor: 'bar-positive', //Optional
    modalFooterColor: 'bar-positive', //Optional
    from: new Date(1900, 1, 1),   //Optional
    to: new Date(),    //Optional
    callback: function (val) {    //Mandatory
      OperationdatePickerCallback(val);
    }
  };  
  // --------出生日期----------------
  var BirthdatePickerCallback = function (val) {
    if (typeof(val) === 'undefined') {
      console.log('No date selected');
    } else {
      $scope.datepickerObject3.inputDate=val;
      var dd=val.getDate();
      var mm=val.getMonth()+1;
      var yyyy=val.getFullYear();
      var d=dd<10?('0'+String(dd)):String(dd);
      var m=mm<10?('0'+String(mm)):String(mm);
      //日期的存储格式和显示格式不一致
      $scope.BasicInfo.birthday=yyyy+'-'+m+'-'+d;
    }
  };
  $scope.datepickerObject3 = {
    titleLabel: '出生日期',  //Optional
    todayLabel: '今天',  //Optional
    closeLabel: '取消',  //Optional
    setLabel: '设置',  //Optional
    setButtonType : 'button-assertive',  //Optional
    todayButtonType : 'button-assertive',  //Optional
    closeButtonType : 'button-assertive',  //Optional
    mondayFirst: false,    //Optional
    //disabledDates: disabledDates, //Optional
    weekDaysList: weekDaysList,   //Optional
    monthList: monthList, //Optional
    templateType: 'popup', //Optional
    showTodayButton: 'false', //Optional
    modalHeaderColor: 'bar-positive', //Optional
    modalFooterColor: 'bar-positive', //Optional
    from: new Date(1900, 1, 1),   //Optional
    to: new Date(),    //Optional
    callback: function (val) {    //Mandatory
      BirthdatePickerCallback(val);
    }
  };  
  // --------首次发病日期----------------
  var FirstDiseaseTimedatePickerCallback = function (val) {
    if (typeof(val) === 'undefined') {
      console.log('No date selected');
    } else {
      $scope.datepickerObject4.inputDate=val;
      var dd=val.getDate();
      var mm=val.getMonth()+1;
      var yyyy=val.getFullYear();
      var d=dd<10?('0'+String(dd)):String(dd);
      var m=mm<10?('0'+String(mm)):String(mm);
      //日期的存储格式和显示格式不一致
      $scope.Questionare.FirstDiseaseTime=yyyy+'-'+m+'-'+d;
    }
  };
  
  $scope.datepickerObject4 = {
    titleLabel: '首次发病日期',  //Optional
    todayLabel: '今天',  //Optional
    closeLabel: '取消',  //Optional
    setLabel: '设置',  //Optional
    setButtonType : 'button-assertive',  //Optional
    todayButtonType : 'button-assertive',  //Optional
    closeButtonType : 'button-assertive',  //Optional
    inputDate: new Date(),    //Optional
    mondayFirst: false,    //Optional
    //disabledDates: disabledDates, //Optional
    weekDaysList: weekDaysList,   //Optional
    monthList: monthList, //Optional
    templateType: 'popup', //Optional
    showTodayButton: 'false', //Optional
    modalHeaderColor: 'bar-positive', //Optional
    modalFooterColor: 'bar-positive', //Optional
    from: new Date(1900, 1, 1),   //Optional
    to: new Date(),    //Optional
    callback: function (val) {    //Mandatory
      FirstDiseaseTimedatePickerCallback(val);
    }
  };  
  // --------datepicker设置结束----------------
  $scope.submit = function(){
    $scope.BasicInfo.gender = $scope.BasicInfo.gender.Type
    $scope.BasicInfo.bloodType = $scope.BasicInfo.bloodType.Type
    $scope.BasicInfo.hypertension = $scope.BasicInfo.hypertension.Type
    if ($scope.BasicInfo.class.typeName == "血透")
    {
      $scope.BasicInfo.class_info == null
    }
    else if ($scope.BasicInfo.class.typeName == "肾移植")
    {
      $scope.BasicInfo.class_info = $scope.BasicInfo.class_info
    }
    else
    {
      $scope.BasicInfo.class_info = $scope.BasicInfo.class_info.code
    }
    $scope.BasicInfo.class = $scope.BasicInfo.class.type
    Patient.editPatientDetail($scope.BasicInfo).then(
      function(data)
      {
        console.log(data.results)
        $state.go("tab.consultquestion2")
      },
      function(err)
      {
        console.log(err);
      }
    )
    var now = new Date()
    now =  $filter("date")(now, "yyyy-MM-dd HH:mm:ss")
    VitalSign.insertVitalSign({patientId:patientId, type: "Weight",code: "Weight_1", date:now.substr(0,10),datatime:now,datavalue:$scope.BasicInfo.weight,unit:"kg"}).then(
      function(data)
      {
        $scope.BasicInfo.weight = data.results
        console.log($scope.BasicInfo)
      },
      function(err)
      {
        console.log(err);
      }
    )
  }
  
  $scope.SKip = function(){
    $state.go("tab.consultquestion2")
  }

  $scope.backtoBasic = function(){
    $state.go("tab.consultquestion1")
  }

  $scope.nexttoquestion = function(){
    $state.go("tab.consultquestion3")
  }

  $scope.backtoDisease = function(){
    $state.go("tab.consultquestion2")
  } 

  $scope.Submitquestion = function(){
    $state.go("tab.consult-chat", { docId: "doc01" })
  }
}])


//论坛
.controller('forumCtrl', ['$scope', '$state', '$sce','$http',function ($scope, $state,$sce,$http) {
  $scope.navigation=$sce.trustAsResourceUrl("http://121.43.107.106/");

  ionic.DomUtil.ready(function(){
        $http({
            method  : 'POST',
            url     : 'http://121.43.107.106/member.php?mod=logging&action=login&loginsubmit=yes&loginhash=$loginhash&mobile=2',
            params    : {'username':'admin','password':'bme319'},  // pass in data as strings
            headers : { 'Content-Type': 'application/x-www-form-urlencoded' }  // set the headers so angular passing info as form data (not request payload)
            }).success(function(data) {
                //console.log(data);
        });
    })
}])

//写评论
.controller('SetCommentCtrl',['$scope', '$ionicHistory', '$ionicLoading','Storage','$state',
   function($scope, $ionicHistory,$ionicLoading,Storage,$state) {

      // //初始化
      $scope.comment={score:5, commentContent:""};
      

      $scope.nvGoback = function() {
        $ionicHistory.goBack();
       }
       
       //评论星星初始化
      $scope.ratingsObject = {
        iconOn: 'ion-ios-star',
        iconOff: 'ion-ios-star-outline',
        iconOnColor: '#FFD700',//rgb(200, 200, 100)
        iconOffColor: 'rgb(200, 100, 100)',
        rating: 5, 
        minRating: 1,
        readOnly:false,
        callback: function(rating) {
          $scope.ratingsCallback(rating);
        }
      };

      //评论星星点击改变分数
      $scope.ratingsCallback = function(rating) {
        $scope.comment.score = rating;
      };

      //上传评论-有效性验证
      $scope.deliverComment = function() {
        if($scope.comment.selectedModoule=='')
        {
          $ionicLoading.show({
              template: '请选择评价的模块',
              noBackdrop: false,
              duration: 1000,
              hideOnStateChange: true
            });
        }
        else if($scope.comment.commentContent.length <10)
        {
            $ionicLoading.show({
              template: '输入字数不足10字',
              noBackdrop: false,
              duration: 1000,
              hideOnStateChange: true
            });
        }
        
        else
        {
          SetComment();
        }
      };

      //上传评论-restful调用
     var SetComment= function()
     {

        var sendData={
          "DoctorId": Storage.get("HealthCoachID"),
          "CategoryCode": $scope.comment.selectedModoule,
          "Value": Storage.get("UID"),
          "Description": $scope.comment.commentContent,
          "SortNo": $scope.comment.score ,
          "piUserId": "sample string 6",
          "piTerminalName": "sample string 7",
          "piTerminalIP": "sample string 8",
          "piDeviceType": 9
        }
       var promise =  Users.SetComment(sendData); 
       promise.then(function(data){ 
          if(data.result=="数据插入成功"){
            $ionicLoading.show({
              template: "评论成功！",
              noBackdrop: false,
              duration: 500,
              hideOnStateChange: true
            });
            setTimeout(function(){
              $ionicHistory.goBack();
            },600);
          }
         },function(err) {   
       }); 
     } 
      
}])