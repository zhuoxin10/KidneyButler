angular.module('kidney.controllers', ['ionic','kidney.services','ngResource','ionic-datepicker'])//,'ngRoute'
//登录--PXY
.controller('SignInCtrl', ['$scope','$timeout','$state','Storage','$ionicHistory', function($scope, $timeout,$state,Storage,$ionicHistory) {
  $scope.barwidth="width:0%";
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
    	if(!phoneReg.test(logOn.username)){$scope.logStatus="手机号验证失败！";}
    	else{
    		var usernames = Storage.get('usernames').split(",");
    		var index = usernames.indexOf(logOn.username);

        //console.log(usernames);
    		//console.log(index);
    		if(index>=0){//查找手机号是否注册过，是否在数据库里
    			//判断密码是否正确
    			
    			var passwords = Storage.get('passwords').split(",");
    			if(logOn.password != passwords[index]){$scope.logStatus = "密码错误！";}
    			else{
    				Storage.set('USERNAME',logOn.username);
    				Storage.set('IsSignIn','YES');
    				$scope.logStatus = "登录成功";
            Storage.set('setPasswordState','sign');
    				$ionicHistory.clearCache();
    				$ionicHistory.clearHistory();
    				$timeout(function(){$state.go('tab.tasklist');},500);
    				}
    		}
    		else{
    			$scope.logStatus = "手机号未激活，请注册！"
    		}
    	}
    	

    }
    else{
    	$scope.logStatus="请输入完整信息！";
    }
  }
  $scope.toRegister = function(){
  	
    $state.go('phonevalid');
    Storage.set('setPasswordState','register');   
   
  }
  $scope.toReset = function(){
    $state.go('phonevalid');
    Storage.set('setPasswordState','reset');
   
  } 
  
}])


//手机号码验证--PXY
.controller('phonevalidCtrl', ['$scope','$state','$interval', 'Storage',  function($scope, $state,$interval,Storage) {
  $scope.barwidth="width:0%";
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
  var sendSMS = function(){
      //结果分为1、验证码发送失败;2、发送成功，获取稍后
    $scope.logStatus="您的验证码已发送，重新获取请稍后";
    unablebutton();
  }
  //点击获取验证码
  $scope.getcode=function(Verify){
     $scope.logStatus='';
    
     if (Verify.Phone=="") {
      
      $scope.logStatus="手机号码不能为空！";
      return;
    }
     var phoneReg=/^(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/;
      //手机正则表达式验证
     if(!phoneReg.test(Verify.Phone)){$scope.logStatus="手机号验证失败！";return;}
     //如果为注册，注册过的用户不能获取验证码；如果为重置密码，没注册过的用户不能获取验证码
      var usernames = Storage.get('usernames').split(",");
      if(Storage.get('setPasswordState')=='register'){
        if(usernames.indexOf(Verify.Phone)>=0){
          $scope.logStatus = "该手机号码已经注册！";
        }
        else{sendSMS();}
      }
      else if(Storage.get('setPasswordState')=='reset'){
        if(usernames.indexOf(Verify.Phone)<0){
          $scope.logStatus = "该手机号码尚未注册！";
        }
        else{sendSMS();}
      }
  }

  //判断验证码和手机号是否正确
  $scope.gotoReset = function(Verify){
    $scope.logStatus = '';
    if(Verify.Phone!="" && Verify.Code!=""){
      var tempVerify = 5566;
      //结果分为三种：(手机号验证失败)1验证成功；2验证码错误；3连接超时，验证失败
      var phoneReg=/^(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/;
      //手机正则表达式验证
      if(phoneReg.test(Verify.Phone)){ 
        if (Verify.Code == tempVerify) {
        logStatus = "验证成功！";
        Storage.set('USERNAME',Verify.Phone);
        $state.go('setpassword');
        }
        else{$scope.logStatus = "验证码错误！";}
      }
      else{$scope.logStatus="手机号验证失败！";}
      
     
    
        
    }
    else{$scope.logStatus = "请输入完整信息！";}
  }

 
  
}])




//设置密码  --PXY 
.controller('setPasswordCtrl', ['$scope','$state','$rootScope' ,'$timeout' ,'Storage',function($scope,$state,$rootScope,$timeout,Storage) {
  $scope.barwidth="width:0%";
  var setPassState=Storage.get('setPasswordState');
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
        var username = Storage.get('USERNAME');
        //如果是注册
        if(setPassState=='register'){
          //结果分为连接超时或者注册成功
          $rootScope.password=setPassword.newPass;
          
          //把新用户和密码写入
          var usernames = Storage.get('usernames');
          var passwords = Storage.get('passwords');
          if(usernames == "" || usernames == null){
            usernames = new Array();
            passwords = new Array();            
          }else{
            usernames = usernames.split(",");
            passwords = passwords.split(",");}
                    
          usernames.push(username);          
          passwords.push(setPassword.newPass);
          Storage.set('usernames',usernames);
          Storage.set('passwords',passwords);
          $scope.logStatus ="注册成功！";
          $timeout(function(){$state.go('userdetail');} , 100);
        }
        else if(setPasswordState == 'reset'){
          //如果是重置密码

          
          //结果分为连接超时或者修改成功
           $scope.logStatus ="重置密码成功！";
          //把新用户和密码写入
          var usernames = Storage.get('usernames').split(",");
          var index = usernames.indexOf(username);
          var passwords = Storage.get('passwords').split(",");
          passwords[index] = setPassword.newPass;
         
          Storage.set('passwords',passwords);
          $timeout(function(){$state.go('signin');} , 100);
          
        }
      }else{
        $scope.logStatus="两次输入的密码不一致";
      }
    }else{
      $scope.logStatus="请输入两遍新密码"
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
    $ionicHistory.goBack();
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
    DiseaseDetail:"",
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
    $state.go('messages');//message还没写，在app.js还没定义
  }
  
}])

//任务列表--GL
.controller('tasklistCtrl', ['$scope','$timeout','$state','Storage','$ionicHistory', '$ionicPopup', function($scope, $timeout,$state,Storage,$ionicHistory,$ionicPopup) {
  $scope.barwidth="width:0%";
  
  $scope.measureTask = [{"Name":"体温",
                         "Frequency":"1次/1天", 
                         "Discription":"每日在早饭前，大小便之后测量并记录一次。每次在同一时间、穿同样的衣服测量",
                         "Unit":"摄氏度",
                         "Flag":false},
                        {"Name":"体重",
                        "Frequency":"1次/1天", 
                        "Discription":"每日在早饭前，大小便之后测量并记录一次。每次在同一时间、穿同样的衣服测量",
                        "Unit":"kg",
                        "Flag":false},
                        {"Name":"血压",
                        "Frequency":"2次/1天", 
                        "Discription":"每天晨起或睡前安静状态下测量血压2次",
                        "Unit":"mmHg",
                        "Flag":false},
                        {"Name":"尿量",
                        "Frequency":"1次/1天", 
                        "Discription":"每日在早饭前，大小便之后测量并记录一次。每次在同一时间、穿同样的衣服测量",
                        "Unit":"ml",
                        "Flag":false},
                        {"Name":"心率",
                        "Frequency":"2次/1天", 
                        "Discription":"每天晨起或睡前安静状态下测量血压2次",
                        "Unit":"次/分",
                        "Flag":false}
                        ];
  //console.log($scope.category);
  //分为已完成和未完成任务（标志位）；今日任务，全部任务（由时间区分）
  $scope.fillTask = [{"Name":"血管通路情况",
                        "Frequency":"1周/1次", 
                        "Discription":"填写上周透析时内瘘／深静脉导管使用情况",
                        "Unit":"",
                        "Flag":false}];
  $scope.RevisitTask = [{"Name":"复诊",
                        "Frequency":"1周/1次", 
                        "Discription":"",
                        "Unit":"",
                        "Flag":false}];

  $scope.TestTask = [{"Name":"化验",
                        "Frequency":"1周/1次", 
                        "Discription":"血常规、血生化、尿常规、尿生化、移植肾彩超、血药浓度",
                        "Unit":"",
                        "Flag":false}];
                        
  //医生排班表
  $scope.Docweek = ["周一","周二","周三","周四","周五","周六","周日"];
  $scope.TblColor1 = ["gray", "green", "gray" ,"gray", "green", "green", "gray"];
  $scope.TblColor2 = ["gray", "green", "green" ,"green", "gray", "gray", "gray"];
  //自定义弹窗
  $scope.measureResult = [{"Name":"","Value":""}];
  $scope.showPopup = function(name) {
           $scope.data = {}
    var myPopup = $ionicPopup.show({
       template: '<input type="text" ng-model="data.value">',
       title: '请填写'+ name,
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
        //填写测量任务后标志位更新
        $scope.measureResult.Name = name;
        $scope.measureResult.Value = res;
        console.log(res.value);
        for (i = 0; i<$scope.measureTask.length; i++)
        {
          if ($scope.measureTask[i].Name == name)
          {
              $scope.measureTask[i].Flag = true;      
              $scope.measureTask[i].Value = res;  
          }          
        }
        console.log($scope.measureTask); 
      }  
    });
  };

  //任务完成后设定下次任务执行时间,CurrentTime为整数
  function SetNextTime(CurrentTime, Freq)
  {
      var NextTime = 0;
      //假定频率格式为2周/1次
      var FreqUnit = Freq.substr(1,1);
      var FreqNum = Freq.substr(0,1);
      if (FreqUnit == "周")
      {
          NextTime = DateCalc("week", CurrentTime, parseInt(FreqNum)*7);
      }
      else if(FreqUnit == "月")
      {
          NextTime = DateCalc("month", CurrentTime, parseInt(FreqNum));
      }
      console.log(NextTime);
      return NextTime;
  }

  //日期延后计算
  function DateCalc(Type, CurrentTime, Addition)
  {
    var CuTimeStr = CurrentTime.toString();
    var CurrentTime = CuTimeStr.substr(0,4) + "-" + CuTimeStr.substr(4,2) + "-" + CuTimeStr.substr(6,2);
    var Date1 = new Date(CurrentTime);
    var Date2;
    if(Type == "week") //周
    {
        Date2 = new Date(Date1.setDate(Date1.getDate() + Addition));
    }
    else //月
    {
        Date2 = new Date(Date1.setMonth(Date1.getMonth() + Addition));
    }
    var Ret = DateToInt(Date2);
    return Ret;
  }

 //测试函数
 $scope.Test=function()
 {
  $scope.TestTime = SetNextTime(20170331, "2月/次");
 }

 //日期转换为整数
 function DateToInt(Date1)
 {
    var Year = Date1.getFullYear().toString();
    var Month = (Date1.getMonth() + 1).toString();
    var Day = Date1.getDate().toString();
    if (Date1.getMonth() < 10)
    {
        Month = "0" + Month;
    }
    if(Date1.getDate() < 9)
    {
       Day = "0" + Day;
    }
    return parseInt(Year + Month + Day);
 }

  //填写记录时页面跳转
   $scope.ToDetailPage=function(name)
   {
     $state.go('task.r',{t:name + 'userId|taskId'});
   }

}])

//任务设置--GL
.controller('TaskSetCtrl', ['$scope', '$state',function($scope, $state) {
  
  $scope.weekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  $scope.monthDays = ["1日","2日","3日","4日","5日","6日","7日","8日","9日","10日","11日","12日","13日","14日","15日","16日","17日","18日","19日","20日","21日","22日","23日","24日","25日","26日","27日","28日"];
  $scope.specialMonth = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  
  $scope.tasks=[{category:"复诊", Freq:"2周一次", Content:"", Detail:""},
               {category:"化验", Freq:"2月一次", Content:"血常规、血生化、尿常规、尿生化", Detail:""}];

  for (i = 0;i<$scope.tasks.length;i++)
  {
    if ($scope.tasks[i].Freq.substr(1,1) == "周")
    {
      $scope.tasks[i].Days = $scope.weekDays;
      $scope.tasks[i].Type = "week"; 
      $scope.tasks[i].SelectedDay = "星期一"; //默认时间
    }
    else if($scope.tasks[i].Freq.substr(1,1) == "月")
    {
      $scope.tasks[i].Days = $scope.monthDays;
      $scope.tasks[i].Type = "month"; 
      $scope.tasks[i].SelectedDay = "1日";//默认时间
    }
  }
  console.log($scope.tasks);
  $scope.SetDate = function()
  {
    // $scope.Test = 20170401;
    // SetFirTaskTime($scope.Test);
    $state.go('tab.tasklist');
  }
  
  //选定星期或号数后，默认为离当前日期最近的日期
  function SetFirTaskTime (CurrentTime)
  {
      var CuTimeStr = CurrentTime.toString();
      var CurrentTime = CuTimeStr.substr(0,4) + "-" + CuTimeStr.substr(4,2) + "-" + CuTimeStr.substr(6,2);    

      var CurrentDate = new Date(CurrentTime);
      var WeekDay = CurrentDate.getDay(); //0-6 星期日为0
      var Day = CurrentDate.getDate(); //1-31
      for (i = 0;i < $scope.tasks.length; i++)
      {
          var Temp;
          var SelectedDay = $scope.tasks[i].Days.indexOf($scope.tasks[i].SelectedDay);
          var Date1 = new Date(CurrentTime); //日期为引用类型
          if($scope.tasks[i].Type == "week")
          {
             var Date2;
             if( SelectedDay >= WeekDay) //所选日期未过，选择本星期
             {
                Date2 = new Date(Date1.setDate(Day + SelectedDay - WeekDay));
             }
             else //下个星期
             {
                Date2 = new Date(Date1.setDate(Day + SelectedDay + 7 - WeekDay))
             }
             Temp = Date2;
          }
          else if($scope.tasks[i].Type == "month")
          {
            var Date3 = new Date(Date1.setDate(SelectedDay + 1));
             if (SelectedDay + 1 < Day) //所选日期已过，选择下月
             {
                Date3 = new Date(Date3.setMonth(Date3.getMonth() + 1));
             }
             Temp = Date3;
          }
      $scope.tasks[i].TaskTime =  DateToInt(Temp);
      }
  }

 //日期转换为整数
  function DateToInt(Date1)
   {
      var Year = Date1.getFullYear().toString();
      var Month = (Date1.getMonth() + 1).toString();
      var Day = Date1.getDate().toString();
      if (Date1.getMonth() < 10)
      {
          Month = "0" + Month;
      }
      if(Date1.getDate() < 9)
      {
         Day = "0" + Day;
      }
      return parseInt(Year + Month + Day);
   }
}])

//任务执行填写--GL
.controller('TaskFillCtrl', ['$scope', '$state', '$stateParams', function($scope, $state, $stateParams) {
    $scope.Title = $stateParams.t;
    $scope.FillOk = function()
    {
      //console.log("确定填写");
      $state.go('tab.tasklist');
    }
  }])

//我的 页面--PXY
.controller('MineCtrl', ['$scope','$ionicHistory','$state','$ionicPopup','$resource','Storage','CONFIG','$ionicLoading','$ionicPopover','Camera', function($scope, $ionicHistory, $state, $ionicPopup, $resource, Storage, CONFIG, $ionicLoading, $ionicPopover, Camera) {
  $scope.barwidth="width:0%";

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
    $state.go('tab.tasklist');
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
                     $timeout(function () {
                     $ionicHistory.clearCache();
                     $ionicHistory.clearHistory();
                    }, 30);
                    $ionicPopup.hide();
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
    $ionicHistory.goBack();
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

  }
  

  ]
    


  
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
        $ionicHistory.nextViewOptions({
            disableBack: true
        });
        // if($state.params.type=="1") $state.go('tab.doing');
        $state.go('tab.myDoctors');
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
    $ionicHistory.goBack();
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
.controller('HealthDetailCtrl', ['$scope','$state','$ionicHistory','$ionicPopup','$stateParams','HealthInfo',function($scope, $state,$ionicHistory,$ionicPopup,$stateParams,HealthInfo) {
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
  //判断是修改还是新增,参数传不进去
  console.log($stateParams.id);
  if($stateParams.id!=null && $stateParams!=""){
    //修改
    console.log("健康详情");
    console.log($stateParams.id);
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


  // --------datepicker设置----------------
  var  monthList=["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];
  var weekDaysList=["日","一","二","三","四","五","六"];
  // --------出生日期----------------
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

  
}])



//增值服务--PXY
.controller('MoneyCtrl', ['$scope','$state','$ionicHistory',function($scope, $state,$ionicHistory) {
  $scope.barwidth="width:0%";

  $scope.Goback = function(){
    $ionicHistory.goBack();
  }
  //查询余额等等。。。。。

 $scope.freeTimesRemain ="0";
 $scope.TimesRemain ="3";
 $scope.Balance = "87";

  
}])



//消息中心--PXY
.controller('messageCtrl', ['$scope','$state','$ionicHistory',function($scope, $state,$ionicHistory) {
  $scope.barwidth="width:0%";

  $scope.Goback = function(){
    $ionicHistory.goBack();
  }

  $scope.getMessageDetail = function(type){
    if(type == 2){
      $state.go('messagesDetail');
    }

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

  }
  

  ]
    

  
}])


//消息类型--PXY
.controller('VaryMessageCtrl', ['$scope','$state','$ionicHistory',function($scope, $state,$ionicHistory) {
  $scope.barwidth="width:0%";

  $scope.Goback = function(){
    $ionicHistory.goBack();
  }
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

  }]

  
}])
  
//我的医生--PXY
.controller('myDoctorsCtrl', ['$scope','$state','$ionicHistory',function($scope, $state,$ionicHistory) {
  $scope.barwidth="width:0%";


  $scope.doctors=[
  {
    id:"doc001",
    img:"img/doctor1.PNG",
    name:"李芳 ",
    department:"肾脏内科",
    title:"副主任医师",
    workUnit:"浙江大学医学院附属第一医院",
    major:"肾小球肾炎",
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
    charge1:30,
    charge2:200,
    score:"9.3",
    count1:35,
    count2:127
  }];

  $scope.allDoctors = function(){
    $state.go('tab.AllDoctors');
  }

  $scope.question = function(){
    $state.go("tab.consultquestion1")
  }

  $scope.consult = function(){
    $state.go("tab.consultquestion1")
  }
  
}])


//所有医生--PXY
.controller('allDoctorsCtrl', ['$scope','$state','$ionicHistory',function($scope, $state,$ionicHistory) {
  $scope.barwidth="width:0%";
  console.log("test")
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

  $scope.Provinces=[
  {
    Name:"省份",
    Type:0
  },
  {
    Name:"浙江",
    Type:1
  },
  {
    Name:"江苏",
    Type:2
  }];

  $scope.province={
    Name:"省份",
    Type:0
  };

  $scope.Cities=[
  {
    Name:"地市",
    Type:0
  },
  {
    Name:"杭州",
    Type:1
  },
  {
    Name:"苏州",
    Type:2
  }];


  $scope.city={
    Name:"地市",
    Type:0
  };

  $scope.Hospitals=[
  {
    Name:"医院",
    Type:0
  },
  {
    Name:"浙一",
    Type:1
  },
  {
    Name:"浙二",
    Type:2
  }];

  $scope.hospital={
    Name:"医院",
    Type:0
  };


  $scope.doctors=[
  {
    id:"doc001",
    img:"img/doctor1.PNG",
    name:"李芳 ",
    department:"肾脏内科",
    title:"副主任医师",
    workUnit:"浙江大学医学院附属第一医院",
    major:"肾小球肾炎",
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
    charge1:30,
    charge2:200,
    score:"9.3",
    count1:35,
    count2:127
  }];

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
.controller('insuranceCtrl', ['$scope', '$state', function ($scope, $state) {
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
    $state.go("tab.tasklist")
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
.controller('consultquestionCtrl', ['$scope', '$state', function ($scope, $state) {
  $scope.showProgress = true
  $scope.showSurgicalTime = true

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

  $scope.Diseases =
  [
    {Name:"肾移植",Type:1},
    {Name:"CKD1-2期",Type:2},
    {Name:"CKD3-4期",Type:3},
    {Name:"CDK5期未透析",Type:4},
    {Name:"腹透",Type:5},
    {Name:"血透",Type:6}
  ]

  $scope.BasicInfo = 
  {
    "PatientID": null,
    "Name": null,
    "Gender": null,
    "BloodType": null,
    "Hypertension": null,
    "KidneyDisease": null,
    "DiseaseDetail": null,
    "OperationDate": null,
    "Height": null,
    "Weight": null,
    "Birthday": null,
    "IDCard": null
  }

  $scope.Questionare = 
  {
    "PatientID": null,
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
      $scope.Questionare.LastDiagnosisTime=yyyy+'/'+m+'/'+d;
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
      $scope.BasicInfo.OperationDate=yyyy+'/'+m+'/'+d;
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
      $scope.BasicInfo.Birthday=yyyy+'/'+m+'/'+d;
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
      $scope.Questionare.FirstDiseaseTime=yyyy+'/'+m+'/'+d;
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
    $state.go("tab.consultquestion2")
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