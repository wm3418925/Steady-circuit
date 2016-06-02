
bool Manager::AddBody(POINT pos)
//添加物体
{
	BODY_TYPE temp = addState;

	addState = BODY_NO;	//不再添加物体
	ctx.DPtoLP(&pos);

	if(BODY_CRUN == temp)
	{
		if(crunCount >= MAX_CRUN_COUNT)
		{
			wndPointer.MessageBox("结点超过最大数量!", "结点不能添加", MB_ICONWARNING);
			return false;
		}

		CloneCircuitBeforeChange();	//编辑前复制电路
		AddCrun(pos);				//编辑函数
		PutCircuitToVector();		//将新的电路信息保存到容器
		return true;
	}
	else if(Pointer::IsCtrl(temp))
	{
		if(ctrlCount >= MAX_CTRL_COUNT)
		{
			wndPointer.MessageBox("电学元件超过最大数量!", "电学元件不能添加", MB_ICONWARNING);
			return false;
		}

		CloneCircuitBeforeChange();	//编辑前复制电路
		AddCtrl(pos, temp);			//编辑函数
		PutCircuitToVector();		//将新的电路信息保存到容器
		return true;
	}
	else
	{
		return false;
	}
}

void Manager::Property(FOCUS_OR_POS &body, bool isReadOnly)
//显示和改变物体属性
{
	char tempStr[NAME_LEN*3];
	LISTDATA list;
	CDC * model = null;
	Pointer pointer = GetBodyPointer(body);

	if(pointer.IsOnLead())
	{
		GetName(pointer, tempStr);
		strcat(tempStr, " 的颜色");					//窗口标题
		pointer.p1.GetDataList(tempStr, &list);	//数据
	}
	else if(pointer.IsOnCrun())
	{
		GetName(pointer, tempStr);
		strcat(tempStr, " 的标签");					//窗口标题
		pointer.p2.GetDataList(&list);				//数据
		model = &crunDcMem;							//示例
	}
	else if(pointer.IsOnCtrl())
	{
		GetName(pointer, tempStr);
		strcat(tempStr, " 的标签和电学属性");		//窗口标题
		pointer.p3.GetDataList(&list);				//数据
		model = GetCtrlPaintImage(pointer.p3);		//示例
	}
	else
	{
		return;
	}

	PaintWithSpecialColor(pointer, false);	//用保留颜色(紫色)显示物体
	MyPropertyDlg dlg(&list, isReadOnly, model, tempStr, wndPointer);
	dlg.DoModal();
}

void Manager::ChangeCtrlStyle(FOCUS_OR_POS &body)
//改变电学元件类型
{
	BODY_TYPE preStyle, newStyle;
	char tempStr[NAME_LEN*3];

	Pointer pointer = GetBodyPointer(body);
	if(!pointer.IsOnCtrl()) return;

	//获得原来类型
	preStyle = newStyle = pointer.p3.GetStyle();

	//初始化list数据
	LISTDATA list;
	list.Init(1);
	list.SetAEnumMember("电学元件的类型", &newStyle, ENUM_CTRL);

	//获得窗口标题
	GetName(pointer, tempStr);
	strcat(tempStr, " 的类型");

	//显示对话框
	PaintWithSpecialColor(pointer, false);	//用保留颜色(紫色)显示物体
	MyPropertyDlg dlg(&list, false, GetCtrlPaintImage(pointer.p3), tempStr, wndPointer);
	dlg.DoModal();

	//改变类型
	if(preStyle != newStyle)
	{
		if(IDYES != AfxMessageBox("改变类型会丢失原有电学元件的数据!\n继续吗?", MB_YESNO)) return;
		pointer.p3.ChangeStyle(newStyle);
	}
}

void Manager::PosBodyMove(Pointer * body, POINT firstPos, POINT lastPos)
//移动物体
{
	int i;
	POINT inter;

	//获得相对坐标
	inter.x = lastPos.x - firstPos.x;
	inter.y = lastPos.y - firstPos.y;
	if(inter.x==0 && inter.y==0) return;

	ASSERT(body.IsOnBody());
	if(body.IsOnCrun())
	{
		body.p2.coord.x += inter.x;
		body.p2.coord.y += inter.y;
		for(i=0; i<4; ++i) if(body.p2.lead[i])
			body.p2.lead[i]->RefreshPos();
	}
	else //if(body.IsOnCtrl())
	{
		body.p3.coord.x += inter.x;
		body.p3.coord.y += inter.y;
		for(i=0; i<2; ++i) if(body.p3.lead[i])
			body.p3.lead[i]->RefreshPos();
	}
}

bool Manager::PosBodyClone(const Pointer * body, POINT firstPos, POINT lastPos)
//在指定位置复制物体
{
	//获得相对坐标
	POINT inter;
	inter.x = lastPos.x - firstPos.x;
	inter.y = lastPos.y - firstPos.y;

	//复制
	if(body.IsOnCrun())
	{
		//验证
		if(crunCount >= MAX_CRUN_COUNT)
		{
			wndPointer.MessageBox("结点超过最大数量!", "结点不能添加", MB_ICONWARNING);
			return false;
		}

		//编辑前复制电路
		CloneCircuitBeforeChange();

		//编辑电路
		crun[crunCount] = body.p2.Clone(CLONE_FOR_USE);
		crun[crunCount]->coord.x += inter.x;
		crun[crunCount]->coord.y += inter.y;
		crun[crunCount]->num = crunCount;
		++crunCount;

		//将新的电路信息保存到容器
		PutCircuitToVector();

		//重绘电路
		PaintCrun(crun[crunCount-1], true);
	}
	else //if(body.IsOnCtrl())
	{
		//验证
		if(ctrlCount >= MAX_CTRL_COUNT)
		{
			wndPointer.MessageBox("电学元件超过最大数量!", "电学元件不能添加", MB_ICONWARNING);
			return false;
		}

		//编辑前复制电路
		CloneCircuitBeforeChange();

		//编辑部分
		ctrl[ctrlCount] = body.p3.Clone(CLONE_FOR_USE);
		ctrl[ctrlCount]->coord.x += inter.x;
		ctrl[ctrlCount]->coord.y += inter.y;
		ctrl[ctrlCount]->num = ctrlCount;
		++ctrlCount;

		//将新的电路信息保存到容器
		PutCircuitToVector();

		//重绘电路
		PaintCtrl(ctrl[ctrlCount-1], true);
	}

	return true;
}

void Manager::RotateCtrl(FOCUS_OR_POS &body, int rotateAngle)
//旋转控件
{
	Pointer pointer = GetBodyPointer(body);
	if(!pointer.IsOnCtrl()) return;
	pointer.p3.Rotate(rotateAngle);
}
