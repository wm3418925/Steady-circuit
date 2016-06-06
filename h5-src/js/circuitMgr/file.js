
//7文件函数--------------------------------------------------------------------↓

//获取文件路径
Manager.GetFilePath = function() {
	return Manager.fileName;
};

//保存电路
Manager.SaveFile = function(newFileName) {
	ASSERT(newFileName && newFileName.length > 0);
	Manager.fileName = newFileName;	//替换原有文件路径
	
	
	var data = {};

	//1文件版本
	data.fileVersion = FILE_VERSION;

	//2结点
	data.cruns = new Array();
	for (var i = Manager.crun.length-1; i >= 0; --i)
		data.cruns.push(Manager.crun[i].GenerateStoreJsonObj());
	//3控件
	data.ctrls = new Array();
	for (var i = Manager.ctrl.length-1; i >= 0; --i)
		data.ctrls.push(Manager.ctrl[i].GenerateStoreJsonObj());
	//4导线
	data.leads = new Array();
	for (var i = Manager.lead.length-1; i >= 0; --i)
		data.leads.push(Manager.lead[i].GenerateStoreJsonObj());

	//5其他变量
	data.moveBodySense = Manager.moveBodySense;		//按方向键一次物体移动的距离
	data.maxLeaveOutDis = Manager.maxLeaveOutDis;	//导线合并最大距离
	data.textColor = Manager.textColor;				//字体颜色
	data.focusLeadStyle = Manager.focusLeadStyle;	//焦点导线样式
	data.focusCrunColor = Manager.focusCrunColor;	//焦点结点颜色
	data.focusCtrlColor = Manager.focusCtrlColor;	//焦点控件颜色
	data.focusBody = Manager.focusBody.GenerateStoreJsonObj();	//焦点物体
	data.viewOrig = Manager.viewOrig;				//视角初始坐标
	
	// 发送请求
	var callbackFunc = function(response) {};
	$.post("/saveCircuit", {"data":data}, callbackFunc)
	return true;
};

//读取电路回调函数
function readFileCallbackFunc(data) {
	var pos1 = {x:0, y:0};

	if (!data || data.length <= 0) {
		alert("文件不能不存在或不能读取 !");
		return false;
	}

	//1文件版本
	if (data.fileVersion != FILE_VERSION) {	//文件版本不同,不予读取
		alert("文件版本不符 ! 读取文件错误");
		return false;
	}

	//Manager.fileName = newFileName;	//替换原有路径

	// 可能因为文件问题而发生错误
	try {
		//2读取物体数量
		var crunCount = data.cruns.length;
		var ctrlCount = data.ctrls.length;
		var leadCount = data.leads.length;

		//检查读取的物体数量是否在允许的范围之内
		if (crunCount>MAX_CRUN_COUNT || leadCount>MAX_LEAD_COUNT || ctrlCount>MAX_CTRL_COUNT)
			throw new Error(10, "电路元件太多");
		
		//3新建原件
		CRUN.ResetGlobalInitOrder();
		Manager.crun = new Array(crunCount);
		for (var i = crunCount-1; i >= 0; --i)
			Manager.crun[i] = CRUN.CreateNew(i, 0,0);
		
		CTRL.ResetGlobalInitOrder();
		Manager.ctrl = new Array(ctrlCount);
		for (var i = ctrlCount-1; i >= 0; --i)
			Manager.ctrl[i] = CTRL.CreateNew(i, 0,0, 0);
		
		LEAD.ResetGlobalInitOrder(leadCount);
		Manager.lead = new Array(leadCount);
		for (var i = leadCount-1; i >= 0; --i)
			Manager.lead[i] = LEAD.CreateNew(i, 0, null,null, false);
		
		//4读取结点
		for (var i = crunCount-1; i >= 0; --i)
			Manager.crun[i].ReadFromStoreJsonObj(data.cruns[i], Manager.lead);

		//5读取控件
		for (var i = ctrlCount-1; i >= 0; --i)
			Manager.ctrl[i].ReadFromStoreJsonObj(data.ctrls[i], Manager.lead);

		//6读取导线
		for (var i = leadCount-1; i >= 0; --i)
			Manager.lead[i].ReadFromStoreJsonObj(data.leads[i], Manager.lead, Manager.crun, Manager.ctrl);

		//7读取其他变量
		Manager.moveBodySense = data.moveBodySense;		//按方向键一次物体移动的距离
		Manager.maxLeaveOutDis = data.maxLeaveOutDis;	//导线合并最大距离
		Manager.textColor = data.textColor;				//字体颜色
		Manager.focusLeadStyle = data.focusLeadStyle;	//焦点导线样式
		Manager.focusCrunColor = data.focusCrunColor;	//焦点结点颜色
		Manager.focusCtrlColor = data.focusCtrlColor;	//焦点控件颜色
		var focusBody = Pointer.CreateNew();
		focusBody.ReadFromStoreJsonObj(data.focusBody, lead, crun, ctrl);	//读取焦点物体
		Manager.FocusBodySet(focusBody);				//设置焦点物体
		Manager.viewOrig = data.viewOrig;				//视角初始坐标

		//ctx.strokeStyle = PaintCommonFunc.HexToRGBStr(Manager.textColor);	//初始化字体颜色
		//ctx.SetViewportOrg(-Manager.viewOrig.x, -Manager.viewOrig.y);		//初始化视角初始坐标
		//Manager.canvas.SetScrollPos(SB_HORZ, viewOrig.x/mouseWheelSense.cx);	//初始化水平滚动条
		//Manager.canvas.SetScrollPos(SB_VERT, viewOrig.y/mouseWheelSense.cy);	//初始化竖直滚动条
	} catch(e) {
		alert("文件可能损坏了 ! 读取文件错误");
		exit(0);
	}

	return true;			//正常退出
}
//读取电路
Manager.ReadFile = function(newFileName) {
	ASSERT(newFileName && newFileName.length > 0);
	$.post("/testData.json", {}, readFileCallbackFunc)
	return true;
};

//建立新文件(空的)
Manager.CreateFile = function() {
	Manager.fileName = '';													//路径清空
	Manager.ClearCircuitState();											//清除电路状态信息
	Manager.crun.length = Manager.ctrl.length = Manager.lead.length = 0;	//物体数量设为0
};
