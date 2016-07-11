
//7文件函数--------------------------------------------------------------------↓

//保存电路
Manager.SaveFile = function() {
	var data = {};

	// 结点
	data.cruns = new Array();
	for (var i=0; i<Manager.crun.length; ++i)
		data.cruns.push(Manager.crun[i].GenerateStoreJsonObj());
	// 控件
	data.ctrls = new Array();
	for (var i=0; i<Manager.ctrl.length; ++i)
		data.ctrls.push(Manager.ctrl[i].GenerateStoreJsonObj());
	// 导线
	data.leads = new Array();
	for (var i=0; i<Manager.lead.length; ++i)
		data.leads.push(Manager.lead[i].GenerateStoreJsonObj());

	// 其他变量
	data.moveBodySense = Manager.moveBodySense;		//按方向键一次物体移动的距离
	data.maxLeaveOutDis = Manager.maxLeaveOutDis;	//导线合并最大距离
	data.textColor = Manager.textColor;				//字体颜色
	data.focusLeadStyle = Manager.focusLeadStyle;	//焦点导线样式
	data.focusCrunColor = Manager.focusCrunColor;	//焦点结点颜色
	data.focusCtrlColor = Manager.focusCtrlColor;	//焦点控件颜色
	data.focusBody = Manager.focusBody.GenerateStoreJsonObj();	//焦点物体
	console.log(JSON.stringify(data));
	// 发送请求
	//var callbackFunc = function(response) {};
	//$.post("/saveCircuit", {"data":data}, callbackFunc);
	return true;
};

//读取电路回调函数
function readFileCallbackFunc(data) {
	if (!data) {
		swal({text:"文件不能不存在或不能读取 !", title:"读取文件错误", type:"error"});
		return false;
	}

	// 可能因为文件问题而发生错误
	try {
		// 读取物体数量
		var crunCount = data.cruns.length;
		var ctrlCount = data.ctrls.length;
		var leadCount = data.leads.length;

		//检查读取的物体数量是否在允许的范围之内
		if (crunCount>MAX_CRUN_COUNT || ctrlCount>MAX_LEAD_COUNT || leadCount>MAX_CTRL_COUNT)
			throw new Error(10, "电路元件太多");
		
		// 新建物体数据
		CRUN.ResetGlobalInitOrder();
		Manager.crun = new Array(crunCount);
		for (var i = crunCount-1; i >= 0; --i)
			Manager.crun[i] = CRUN.CreateNew(i, 0,0);
		
		CTRL.ResetGlobalInitOrder();
		Manager.ctrl = new Array(ctrlCount);
		for (var i = ctrlCount-1; i >= 0; --i)
			Manager.ctrl[i] = CTRL.CreateNew(i, 0,0, data.ctrls[i].style);
		
		LEAD.ResetGlobalInitOrder();
		Manager.lead = new Array(leadCount);
		for (var i = leadCount-1; i >= 0; --i)
			Manager.lead[i] = LEAD.CreateNew(i, 0, null,null, false);
		
		// 读取结点
		for (var i = crunCount-1; i >= 0; --i)
			Manager.crun[i].ReadFromStoreJsonObj(data.cruns[i], Manager.lead);

		// 读取控件
		for (var i = ctrlCount-1; i >= 0; --i)
			Manager.ctrl[i].ReadFromStoreJsonObj(data.ctrls[i], Manager.lead);

		// 读取导线
		for (var i = leadCount-1; i >= 0; --i)
			Manager.lead[i].ReadFromStoreJsonObj(data.leads[i], Manager.lead, Manager.crun, Manager.ctrl);

		// 读取其他变量
		if (data.hasOwnProperty("moveBodySense"))
			Manager.moveBodySense = data.moveBodySense;		//按方向键一次物体移动的距离
		if (data.hasOwnProperty("maxLeaveOutDis"))
			Manager.maxLeaveOutDis = data.maxLeaveOutDis;	//导线合并最大距离
		if (data.hasOwnProperty("textColor"))
			Manager.textColor = data.textColor;				//字体颜色
		if (data.hasOwnProperty("focusLeadStyle"))
			Manager.focusLeadStyle = data.focusLeadStyle;	//焦点导线样式
		if (data.hasOwnProperty("focusCrunColor"))
			Manager.focusCrunColor = data.focusCrunColor;	//焦点结点颜色
		if (data.hasOwnProperty("focusCtrlColor"))
			Manager.focusCtrlColor = data.focusCtrlColor;	//焦点控件颜色
		//读取焦点物体
		var tmpFocusBody = Pointer.CreateNew();
		if (data.hasOwnProperty("focusBody")) 
			tmpFocusBody.ReadFromStoreJsonObj(data.focusBody, Manager.lead, Manager.crun, Manager.ctrl);
		Manager.SetFocusBody(tmpFocusBody);				//设置焦点物体

		Manager.ctx.strokeStyle = PaintCommonFunc.HexToRGBStr(Manager.textColor);	//初始化字体颜色
	} catch(e) {
		Manager.ClearCircuit();
		swal({text:"文件可能损坏了", title:"读取文件错误", type:"error"});
		return false;
	}

	return true;			//正常退出
}
function readFileComplete(xhr, textStatus) {
}
//读取电路
Manager.ReadFile = function(newFileName) {
	ASSERT(newFileName && newFileName.length > 0);

	$.ajax({url:"/file-templete/"+newFileName+".json", async:false, success:readFileCallbackFunc, complete:readFileComplete});
	return true;
};

//清空电路
Manager.ClearCircuit = function() {
	Manager.ClearCircuitState();											//清除电路状态信息
	Manager.crun.length = Manager.ctrl.length = Manager.lead.length = 0;	//物体数量设为0
};
