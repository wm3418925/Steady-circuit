
//4其他函数------------------------------------------------------------------------

//设置添加何种物体
Manager.SetAddState = function(type) {
	ASSERT(type>=BODY_NO && type<CTRL_TYPE_NUM);
	Manager.addState = type;
};

//获得控件画图句柄
Manager.GetCtrlPaintImage = function(c) {
	if (c.IsBulbOn() || c.SwitchOnOff(false))	//小灯泡达到额定功率, 开关闭合
		return Manager.ctrlImageList[(CTRL_TYPE_COUNT + c.GetStyle())*4 + c.dir];
	else
		return Manager.ctrlImageList[c.GetStyle()*4 + c.dir];	//默认的画图句柄
};

//获得名称,str长度应该大于等于NAME_LEN*2
Manager.GetBodyDefaultName = function(pointer) {
	ASSERT(pointer.IsOnAny());
	if (pointer.IsOnLead()) {
		return "导线[" + pointer.p.GetInitOrder() + "]";
	} else if(pointer.IsOnCrun()) {
		return "结点[编号("+pointer.p.GetInitOrder()+"), 当前名称("+pointer.p.name+")]";
	} else { //if(pointer.IsOnCtrl())
		return "控件[编号("+pointer.p.GetInitOrder()+"), 当前名称("+pointer.p.name+")]";
	}
};

//删除提示,返回值为false用户取消删除
Manager.DeleteNote = function(body) {
	var conCount;	//连接导线数
	var name;	//物体名称
	var note;	//提示字符串

	//获得连接导线数
	if(body.IsOnLead())
		conCount = 0;
	else if(body.IsOnCrun())
		conCount = body.p.GetConnectNum();
	else if(body.IsOnCtrl())
		conCount = body.p.GetConnectNum();
	else
		return false;

	//根据连接导线数提示删除信息
	name = GetBodyDefaultName(body);
	if (conCount > 0)
		note = "要删除 "+name+" 吗 ?\n它连接的 "+conCount+" 段导线也将删除!";
	else
		note = "要删除 "+name+" 吗 ?";

	PaintWithSpecialColorAndRect(body, false);
	return IDYES == this.canvas.MessageBox(note, "删除物体提示", MB_YESNO|MB_ICONWARNING);
};

//清除电路状态
Manager.ClearCircuitState = function() {
	FocusBodyClear(null);	//焦点
	ClearPressBody();		//显示电势差
	motiCount = 0;			//激活物体数量
	addState = BODY_NO;		//添加物体类型
	lastMoveOnBody.Clear();	//鼠标上次移动到的物体
	lButtonDownState = 0;	//鼠标左击状态
};

//获得物体指针
Manager.GetBodyPointer = function(body) {
	var pointer;

	if (body.isFocusBody) {
		pointer = focusBody;
	} else {
		motiCount = 0;
		MotivateAll(body.pos);
		motiCount = 0;
		pointer = motiBody[0];
	}

	return pointer;
};

//保存电路到图片
Manager.SaveAsPicture = function(path) {
	PaintAll();	//画电路, bitmapForRefresh保存有位图
	SaveBitmapToFile(HBITMAP(bitmapForRefresh), path);
};
