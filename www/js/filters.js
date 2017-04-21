angular.module('kidney.filters', [])
//毫秒数 to '10:32 AM' or '4/1/17 4:55 PM'（不是当天的话） XJZ
.filter('msgdate',['$filter',function($filter){
    return function(milliseconds){
        var curTime = new Date();
        var msgTime = new Date(milliseconds);
        if(curTime.toDateString()==msgTime.toDateString()) return $filter('date')(msgTime, 'h:mm a');
        return $filter('date')(msgTime, 'M/d/yy h:mm a');
    }
}])
.filter('dateFormat',[function(){
    return function(date,format){
        var d=new Date(date)
        var ret=""
        if(date==null)
        	return "-"
        switch(format)
        {
        	case "YYYY-MM-DD":
        		ret=d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
        		break;
        	case "MM-DD-YYYY":
        		ret=(d.getMonth()+1)+'-'+d.getDate()+'-'+d.getFullYear();
        		break;
        	case "YYYY-MM-DD h:m":
        		ret=d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()+' '+d.getHours()+':'+d.getMinutes();
        		break;
        }
        return ret;
    }
}])