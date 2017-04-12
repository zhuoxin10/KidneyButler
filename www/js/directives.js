angular.module('kidney.directives', ['kidney.services'])
//消息模版，用于所有消息类型
//XJZ
.directive('myMessage',['Storage',function(Storage){
    var picArr=[
                {"src":"img/1.jpg","hiRes":"img/2.jpg"},
                {"src":"img/3.jpg","hiRes":"img/4.jpg"},
                {"src":"img/5.jpg","hiRes":"img/doctor3.png"}
            ];
    return {
        template: '<div ng-include="getTemplateUrl()"></div>',
        scope: {
            msg:'=',
            msgindex:'@'
        },
        restrict:'AE',
        controller:function($scope){
            var type='';
            $scope.getTemplateUrl = function(){
                if($scope.msg.contentType=='custom'){
                    // type=$scope.msg.content.contentStringMap.type;
                    // $scope.customMsgUrl=JSON.parse($scope.msg.content.contentStringMap.picurl);
                    // $scope.customMsg=JSON.parse($scope.customMsg);
                    // console.log($scope.customMsgUrl);
                    type=$scope.msg.content.contentStringMap.type;
                    return 'partials/tabs/consult/msg/'+ type+'.html';
                }
                // type=$scope.msg.contentType=='custom'?$scope.msg.content.contentStringMap.type:$scope.msg.contentType;
                type=$scope.msg.contentType;
                return 'partials/tabs/consult/msg/'+type+'.html';
            }
            
            $scope.emitEvent = function(code){
              $scope.$emit(code,arguments);
            }
            // $scope.direct = $scope.msg.fromID==window.JMessage.username?'right':'left';
            
            // $scope.showProfile = function(){
            //     console.log($scope.msg.fromID);
            // }
            // $scope.viewImage= function(thumb,url){
            //     if(type=='image'){
            //         //image massage
            //         $scope.$emit('viewImage',type,thumb,$scope.msg.serverMessageId);
            //     }else{
            //         //image in card
            //         $scope.$emit('viewImage',type,thumb,url);
            //     }
            // };
            $scope.picurl=picArr;
            // $scope.playVoice = function(){

            // }
        }
    }
}])
//聊天输入框的动态样式，如高度自适应，focus|blur状态
//XJZ
.directive('dynamicHeight', [function() {
    return {
        restrict: 'A',
        link: function(scope, elem) {
            elem.bind('keyup', function() {
                this.style.height = "1px";
                var h = 4 + this.scrollHeight;
                this.style.height = (h < 70 ? h : 70) + 'px';

            });
            elem.bind('focus', function() {
                console.log(this.style)
                this.style.borderBottomColor = '#64DD17';
            });
            elem.bind('blur', function() {
                this.style.borderBottomColor = '#AAA';
                // this.setAttribute("style", "border-color: #AAA");
            });
        }
    }
}])
//加载数据的loading spin
    //xjz
    .directive('mySpin',[function(){
          var opts = {
        lines: 9 // The number of lines to draw
      , length: 0 // The length of each line
      , width: 8 // The line thickness
      , radius: 10 // The radius of the inner circle
      , scale: 1 // Scales overall size of the spinner
      , corners: 1 // Corner roundness (0..1)
      , color: '#FFF' // #rgb or #rrggbb or array of colors
      , opacity: 0.35 // Opacity of the lines
      , rotate: 0 // The rotation offset
      , direction: 1 // 1: clockwise, -1: counterclockwise
      , speed: 1 // Rounds per second
      , trail: 44 // Afterglow percentage
      , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
      , zIndex: 2e9 // The z-index (defaults to 2000000000)
      , className: 'spinner' // The CSS class to assign to the spinner
      , top: '50%' // Top position relative to parent
      , left: '50%' // Left position relative to parent
      , shadow: true // Whether to render a shadow
      , hwaccel: false // Whether to use hardware acceleration
      , position: 'absolute' // Element positioning
      };
        return{
            restrict:'A',
            link:function(scope,elem,attr){
                scope.$watch(attr.mySpin, function(value) {
                    if(value=='send_going'){
                        scope.spin=new Spinner(opts).spin(elem[0]);
                    }else if(scope.spin){
                        scope.spin.stop();
                        scope.spin=null;
                    }
                  });
            }
        }
    }])
    .directive('mySmallSpin',[function(){
          var opts = {
        lines: 9 // The number of lines to draw
      , length: 0 // The length of each line
      , width: 6 // The line thickness
      , radius: 7 // The radius of the inner circle
      , scale: 1 // Scales overall size of the spinner
      , corners: 1 // Corner roundness (0..1)
      , color: '#000' // #rgb or #rrggbb or array of colors
      , opacity: 0.35 // Opacity of the lines
      , rotate: 0 // The rotation offset
      , direction: 1 // 1: clockwise, -1: counterclockwise
      , speed: 1 // Rounds per second
      , trail: 44 // Afterglow percentage
      , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
      , zIndex: 2e9 // The z-index (defaults to 2000000000)
      , className: 'spinner' // The CSS class to assign to the spinner
      , top: '50%' // Top position relative to parent
      , left: '50%' // Left position relative to parent
      , shadow: false // Whether to render a shadow
      , hwaccel: false // Whether to use hardware acceleration
      , position: 'absolute' // Element positioning
      };

        return{
            restrict:'A',
            link:function(scope,elem,attr){
                scope.$watch(attr.mySmallSpin, function(value) {
                    if(value=='send_going'){
                        scope.spin=new Spinner(opts).spin(elem[0]);
                    }else if(scope.spin){
                        scope.spin.stop();
                        scope.spin=null;
                    }
                  });
            }
        }
    }])
//隐藏tab栏，建议在所有二级页面上都使用
//XJZ
.directive('hideTabs',function($rootScope){ 
    return {
        restrict:'AE',
        link:function($scope){
            $scope.$on('$ionicView.beforeEnter',function(){
                $rootScope.hideTabs = 'tabs-item-hide';
            });
            $scope.$on('$destroy',function(){
                $rootScope.hideTabs = '';
            });
        }
    }
})
.directive('showTabs',function($rootScope){ 
    return {
        restrict:'AE',
        link:function($scope){
            $scope.$on('$ionicView.beforeEnter',function(){
                $rootScope.hideTabs = '';
            });
        }
    }
})


//未读消息的小红点
.directive('headRedPoint', function($compile, $timeout){
   // Runs during compile
   return {
      restrict: 'A', 
      replace: false,
      link: function(scope, element, attrs, controller) {
          var key = attrs.headRedPoint || false;
          var template ="<span ng-class={true:'head-red-point',false:''}["+key+"]></span>";
          var html = $compile(template)(scope);  
          $timeout(function() {
            var test = angular.element(element).parent().append(html)
          },100)
                     
       }
   };
})

.directive('imageRedPoint', function($compile, $timeout){
   // Runs during compile
   return {
      restrict: 'A', 
      replace: false,
      link: function(scope, element, attrs, controller) {
          var key = attrs.imageRedPoint || false;
          var template ="<span ng-class={true:'image-red-point',false:''}["+key+"]></span>";
          var html = $compile(template)(scope);  
          $timeout(function() {
            var test = angular.element(element).parent().append(html)
          },100)
                     
       }
   };
})