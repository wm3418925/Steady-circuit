
//4其他函数------------------------------------------------------------------------↓
void Manager::SetAddState(BODY_TYPE type)
//设置添加何种物体
{
	ASSERT(type>=BODY_NO && type<CTRL_TYPE_NUM);
	addState = type;
}

//获得控件画图句柄
Manager.GetCtrlPaintImage = function(c) {
	if (c.IsBulbOn() || c.SwitchOnOff(false))	//小灯泡达到额定功率, 开关闭合
		return Manager.ctrlImageList[(CTRL_TYPE_COUNT + c.GetStyle())*4 + c.dir];
	else
		return Manager.ctrlImageList[c.GetStyle()*4 + c.dir];	//默认的画图句柄
};

void Manager::GetName(const Pointer &pointer, char * str)const
//获得名称,str长度应该大于等于NAME_LEN*2
{
	ASSERT(pointer.IsOnAny());
	if(pointer.IsOnLead())
	{
		sprintf(str, "导线[%d]", pointer.p1.GetInitOrder());
	}
	else if(pointer.IsOnCrun())
	{
		sprintf(str, "结点[编号(%d), 当前名称(%s)]", pointer.p2.GetInitOrder(), pointer.p2.name);
	}
	else //if(pointer.IsOnCtrl())
	{
		sprintf(str, "控件[编号(%d), 当前名称(%s)]", pointer.p3.GetInitOrder(), pointer.p3.name);
	}
}

bool Manager::DeleteNote(const Pointer &body)
//删除提示,返回值为false用户取消删除
{
	int conNum;				//连接导线数
	char name[NAME_LEN*2];	//物体名称
	char note[NAME_LEN*4];	//提示字符串

	//获得连接导线数
	if(body.IsOnLead())
		conNum = 0;
	else if(body.IsOnCrun())
		conNum = body.p2.GetConnectNum();
	else if(body.IsOnCtrl())
		conNum = body.p3.GetConnectNum();
	else
		return false;

	//根据连接导线数提示删除信息
	GetName(body, name);
	if(conNum > 0)
		sprintf(note, "要删除 %s 吗 ?\n它连接的 %d 段导线也将删除!", name, conNum);
	else
		sprintf(note, "要删除 %s 吗 ?", name);

	PaintWithSpecialColorAndRect(body, false);	//用保留颜色(紫色)显示物体
	return IDYES == this.canvas.MessageBox(note, "删除物体提示", MB_YESNO|MB_ICONWARNING);
}

void Manager::ClearCircuitState()
//清除电路状态
{
	FocusBodyClear(null);	//焦点
	ClearPressBody();		//显示电势差
	motiCount = 0;			//激活物体数量
	addState = BODY_NO;		//添加物体类型
	lastMoveOnBody.Clear();	//鼠标上次移动到的物体
	lButtonDownState = 0;	//鼠标左击状态
}

Pointer Manager::GetBodyPointer(FOCUS_OR_POS &body)
//获得物体指针
{
	Pointer pointer;

	if(body.isFocusBody)
	{
		pointer = focusBody;
	}
	else
	{
		motiCount = 0;
		MotivateAll(body.pos);
		motiCount = 0;
		pointer = motiBody[0];
	}

	return pointer;
}

void Manager::SaveAsPicture(const char * path)
//保存电路到图片
{
	PaintAll();	//画电路, bitmapForRefresh保存有位图
	StaticClass::SaveBitmapToFile(HBITMAP(bitmapForRefresh), path);
}
