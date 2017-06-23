angular.module('kidney.filters', [])
//毫秒数 to '10:32 AM' or '4/1/17 4:55 PM'（不是当天的话） XJZ
.filter('msgdate',['$filter',function($filter){
    return function(milliseconds){
        if(milliseconds==null) return '';
        var curTime = new Date();
        var msgTime = new Date(milliseconds);
        if(curTime.toDateString()==msgTime.toDateString()) return $filter('date')(msgTime, 'H:mm');
        return $filter('date')(msgTime, 'M/d/yy H:mm');
    }
}])
.filter('dateFormat',['$filter',function($filter){
    return function(date,format){
        var d=new Date(date)
        var ret=""
        if(date==null)
        	return "-"
        switch(format)
        {
        	case "YYYY-MM-DD":
        		ret=$filter('date')(d,'yyyy-MM-dd');
        		break;
        	case "MM-DD-YYYY":
        		ret=$filter('date')(d,'MM-dd-yyyy');
        		break;
        	case "YYYY-MM-DD h:m":
                ret=$filter('date')(d,'yyyy-MM-dd HH:mm');
        		
        		break;
        }
        return ret;
    }
}])


.filter('filterClass',[function(){
    return function(type){
        var name;
        switch(type)
        {
          case "class_2":
            name="CKD1-2期";
            break;
          case "class_3":
            name="CKD3-4期";
            break;
          case "class_4":
            name="CDK5期未透析";
            break;
          case "class_6":
            name="腹透";
            break;
          case "class_5":
            name="血透";
            break;
          case "class_1":
            name="肾移植";
            break;
        }
        return name;
    }
}])
.filter('filterStage',[function(){
    return function(type){
        var name;
        switch(type)
        {
          case "stage_5":
            name="疾病活跃期";
            break;
          case "stage_6":
            name="稳定期";
            break;
          case "stage_7":
            name=">3年";
            break;
        }
        return name;
    }
}])

.filter('filterHypertension',[function(){
    return function(type){
        var name="--";
        switch(type)
        {
          case 1:
            name="是";
            break;
          case 2:
            name="否";
            break;
        }
        return name;
    }
}])