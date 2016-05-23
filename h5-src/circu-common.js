//获得控件的电压
GetPress = function(ctrl, /*int*/direction)
{
	/*double*/var pressure;	//返回电压

    if (ctrl.hasOwnProperty("pressure")) 
    {
	    if (direction != 0)
		    return - ctrl.pressure;
	    else
		    return   ctrl.pressure;
    }

	return 0;
};

IsOnCrun = function(element) {
    return element.hasOwnProperty("lead") && element.lead.length == 4;
};
IsOnCtrl = function(element) {
    return element.hasOwnProperty("resist");
};
IsOnLead = function(element) {
    return element.hasOwnProperty("conBody");
};
