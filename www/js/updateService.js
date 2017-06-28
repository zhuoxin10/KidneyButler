angular.module('kidneyAppUpdate.services', ['ionic','ngResource','kidney.services'])
/**
   * App检查更新 Service
   */
.factory('AppUpdateService', ['$q','version', '$cordovaNetwork', '$cordovaAppVersion', '$ionicPopup', '$ionicLoading', '$cordovaFileTransfer', '$cordovaFileOpener2', '$timeout', function ($q,version, $cordovaNetwork, $cordovaAppVersion, $ionicPopup, $ionicLoading, $cordovaFileTransfer, $cordovaFileOpener2, $timeout) {
  return {
    checkVersion: checkVersion,
  };

  /**
   * 调用后端接口获取版本更新信息，这里应该换成你自己的逻辑
   */
  


  function checkVersion(scope) {
    var deferred = $q.defer();
    // params 是我需要传递给后端接口的参数,versionName是本地当前版本号选填，versionType为客户端
    var params = {
      versionName: 'v0.0.0.1',
      versionType: 'app'
    };
    // version.getVersion(params).then(function (data) {
    //     // 判断是否需要更新
    //     console.log(data.results);
    //     if (angular.isArray(data.results.msg)){
    //       console.log("版本号更新")
    //     }
        
    //     else{
    //       console.log("版本号无更新")
    //     }
    // });
    // 获取手机的网络状态，返回的值包括：WIFI 4g等网络状态，这里用来检测手机是否处于WiFi状态
    var networkType = $cordovaNetwork.getNetwork();
    // 获取App 内的版本信息
    $cordovaAppVersion.getAppVersion().then(function (version) {
      $('.version').text(version);
      params.version = version;
      // 获取服务器版本信息，此处需更改为你自己的逻辑
      version.getVersion(params).then(function (data) {
        
        var json = {
          title: "",
          subTitle: ""
        };
        // 判断是否需要更新
        if (angular.isArray(data.results.msg)){
          for(x in data.results.msg){
            json.subTitle += data.results.msg[x].versionName + "更新: " + data.results.msg[x].content;
          }
          if (networkType == 'wifi') {
                json.title = 'APP版本更新'
              }
              else {
                json.title = 'APP版本更新（建议WIFI下升级）';
              }
              updateAppPopup(json, scope).then(function (res) {
                if (res == 'update') {
                  //updateAppUrl未知
                  var updateAppUrl = "http://proxy.haihonghospitalmanagement.com/download?download=patient";
                  UpdateForAndroid(updateAppUrl);
                }
              });
        }

       
        deferred.resolve(true);
        }, function (err) {
          deferred.reject(null);
        })
    });

    return deferred.promise;
  }

  

  function updateAppPopup(json, scope) {
    return $ionicPopup.show({
      title: json.title,
      subTitle: json.subTitle,
      scope: scope,
      buttons: [
        {
          text: '取消',
          type: 'button-clear button-assertive',
          onTap: function () {
            return 'cancel';
          }
        },
        {
          text: '更新',
          type: 'button-clear button-assertive border-left',
          onTap: function (e) {
            return 'update';
          }
        }
      ]
    });
  }

  function UpdateForAndroid(downloadUrl) {
    $ionicLoading.show({
      template: "已经下载：0%"
    });
    var targetPath = "/sdcard/Download/kidneyBulter.apk";
    var trustHosts = true;
    var options = {};
    $cordovaFileTransfer.download(downloadUrl, targetPath, options, trustHosts).then(function (result) {
      $cordovaFileOpener2.open(targetPath, 'application/vnd.android.package-archive'
      ).then(function () {
        // 成功
      }, function (err) {
        console.log(err);
      });
      $ionicLoading.hide();
    }, function (err) {
      $ionicLoading.show({
        template: "下载失败"
      });
      $ionicLoading.hide();
    }, function (progress) {
      $timeout(function () {
        var downloadProgress = (progress.loaded / progress.total) * 100;
        $ionicLoading.show({
          template: "已经下载：" + Math.floor(downloadProgress) + "%"
        });
        if (downloadProgress > 99) {
          $ionicLoading.hide();
        }
      });
    });
  }

}])