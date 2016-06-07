
//连接导线过程显示
Manager.ShowAddLead = function(pos) {
	if(1 != motiCount) return false;

	Pointer * body = motiBody;
	POINT firstPos;

	if(!body.IsOnConnectPos()) return false;

	PaintAll();		//先刷新
	motiCount = 1;	//还原变量

	//dc移动到起点
	Manager.ctx.DPtoLP(&pos);
	Manager.ctx.MoveTo(pos);

	//设置黑色画笔
	Manager.ctx.SelectStockObject(BLACK_PEN);

	//画直线
	body.GetPosFromBody(firstPos);
	Manager.ctx.LineTo(firstPos);

	return true;
};

bool Manager::ShowAddBody(POINT point)
//添加物体过程显示
{
	if(addState == BODY_CRUN)
	{
		if(lastMoveOnPos.x > -100)
			Manager.ctx.BitBlt(lastMoveOnPos.x-DD, lastMoveOnPos.y-DD, DD*2, DD*2, &crunImageData, 0, 0, SRCINVERT);
		Manager.ctx.DPtoLP(&point);
		lastMoveOnPos = point;
		Manager.ctx.BitBlt(lastMoveOnPos.x-DD, lastMoveOnPos.y-DD, DD*2, DD*2, &crunImageData, 0, 0, SRCINVERT);

		::SetCursor(hcAddCrun);
		return true;
	}
	else if(Pointer::IsCtrl(addState))
	{
		var tempImage = Manager.ctrlImageList[addState*4];
		if(lastMoveOnPos.x > -100)
			Manager.ctx.BitBlt(lastMoveOnPos.x, lastMoveOnPos.y, CTRL_SIZE.cx, CTRL_SIZE.cy, tempImage, 0, 0, SRCINVERT);
		Manager.ctx.DPtoLP(&point);
		lastMoveOnPos = point;
		Manager.ctx.BitBlt(lastMoveOnPos.x, lastMoveOnPos.y, CTRL_SIZE.cx, CTRL_SIZE.cy, tempImage, 0, 0, SRCINVERT);

		::SetCursor(null);
		return true;
	}
	else
	{
		return false;
	}
}

bool Manager::ShowMoveBody(POINT pos, bool isLButtonDown)
//移动物体过程显示,lastMoveOnPos.x初始值设为-100,在LButtonDown和PaintAll中设置
{
	ASSERT(motiCount >= 0 && motiCount <= 2);
	if(motiCount == 0) return false;

	Pointer * body = motiBody + motiCount - 1;
	POINT bodyPos = {0, 0};

	if(!body.IsOnBody()) return false;
	if(!isLButtonDown)	//鼠标没有按下
	{
		PaintAll(); 
		return false;
	}

	//获得物体坐标
	Manager.ctx.DPtoLP(&pos);
	if(body.IsOnCrun()) bodyPos = body.p2.coord;
	else if(body.IsOnCtrl()) bodyPos = body.p3.coord;

	//根据坐标差计算画图坐标
	pos.x += bodyPos.x - lButtonDownPos.x;
	pos.y += bodyPos.y - lButtonDownPos.y;

	//清除上次坐标画的物体
	if(lastMoveOnPos.x > -100)
		PaintInvertBodyAtPos(*body, lastMoveOnPos);

	//在新的坐标物体
	lastMoveOnPos = pos;	//获得新的坐标
	PaintInvertBodyAtPos(*body, lastMoveOnPos);

	//左或右ctrl键被按下相当于复制
	if(StaticClass::IsCtrlDown()) SetCursor(hcAddCrun);

	return true;
}

bool Manager::ShowMoveLead(bool isLButtonDown)
//移动导线过程显示
{
	ASSERT(motiCount>=0 && motiCount<=2);

	if(motiCount == 0 || !motiBody[motiCount-1].IsOnLead())
	{
		return false;
	}
	if(!isLButtonDown)	//鼠标没有按下
	{
		PaintAll();
		return true;
	}

	if(motiBody[motiCount-1].IsOnHoriLead())
		SetCursor(hcMoveHorz);	//在横线,鼠标变成"上下指针"
	else 
		SetCursor(hcMoveVert);	//在竖线,鼠标变成"左右指针"

	return true;
}


BODY_TYPE Manager::PosBodyPaintRect(POINT pos)
//突出右击物体
{
	Pointer * body = motiBody; //&motiBody[0]

	motiCount = 0;
	MotivateAll(pos);
	motiCount = 0;

	if(!body.IsOnAny()) return BODY_NO;

	if(body.IsOnConnectPos()) body.SetAtState(-1);

	if(body.IsOnBody()) Manager.ctx.SelectObject(hp + BLUE);

	if(body.IsOnCrun())
	{
		Manager.ctx.Rectangle(body.p2.coord.x-DD-2, body.p2.coord.y-DD-2, 
			body.p2.coord.x+DD+2, body.p2.coord.y+DD+2);
	}
	else if(body.IsOnCtrl())
	{
		Manager.ctx.Rectangle(body.p3.coord.x-2, body.p3.coord.y-2, 
			body.p3.coord.x+CTRL_SIZE.cx+2, body.p3.coord.y+CTRL_SIZE.cy+2);
	}

	PaintWithSpecialColorAndRect(*body, false);
	return body.GetStyle();
}


bool Manager::ShowBodyElec(FOCUS_OR_POS &body)
//计算电流后,显示流过物体的电流
{
	Pointer pointer = GetBodyPointer(body);
	if(!pointer.IsOnLead() && !pointer.IsOnCtrl()) return false;	//只显示导线和控件

	char tempStr1[NAME_LEN*2];	//字符串
	char tempStr2[NAME_LEN*2];	//字符串
	char title[NAME_LEN*3];		//窗口标题
	double elec;				//电流大小
	ELEC_STATE elecDir;			//电流方向
	CDC * model = null;			//property显示物体的示例
	LISTDATA list;				//property显示的数据

	//1,获得电流信息
	if(pointer.IsOnLead())
	{
		elec = pointer.p1.elec;
		elecDir  = pointer.p1.elecDir;
	}
	else //if(pointer.IsOnCtrl())
	{
		elec = pointer.p3.elec;
		elecDir  = pointer.p3.elecDir;

		model = GetCtrlPaintImage(pointer.p3);	//示例
	}

	//2,生成LISTDATA
	switch(elecDir)
	{
	case UNKNOWNELEC:
		list.Init(1);
		list.SetAMember(DATA_STYLE_LPCTSTR, "电流情况 :", "电流没有计算过!");
		break;

	case OPENELEC:
		list.Init(1);
		list.SetAMember(DATA_STYLE_LPCTSTR, "电流情况 :", "没有电流流过, 断路!");
		break;

	case SHORTELEC:
		list.Init(1);
		list.SetAMember(DATA_STYLE_LPCTSTR, "电流情况 :", "线路短路!!!");
		break;

	case UNCOUNTABLEELEC:
		list.Init(1);
		list.SetAMember(DATA_STYLE_LPCTSTR, "电流情况 :", "两条无电阻线路分一段电流,电流无法确定!");
		break;

	case LEFTELEC:
	case RIGHTELEC:
		ASSERT(elec >= 0);	//不会出现负电流

		if(StaticClass::IsZero(elec))
		{
			list.Init(1);
			list.SetAMember(DATA_STYLE_LPCTSTR, "电流情况 :", "电流为0");
			break;
		}

		if(pointer.IsOnLead())
		{
			GetName(pointer.p1.conBody[LEFTELEC != elecDir], tempStr1);
			GetName(pointer.p1.conBody[LEFTELEC == elecDir], tempStr2);

			list.Init(3);
			list.SetAMember(DATA_STYLE_double, DATA_NOTE[DATA_NOTE_CURRENT], &elec);
			list.SetAMember(DATA_STYLE_LPCTSTR, "电流起点 :", tempStr1);
			list.SetAMember(DATA_STYLE_LPCTSTR, "电流终点 :", tempStr2);
		}
		else //if(pointer.IsOnCtrl())
		{
			switch(pointer.p3.dir ^ ((RIGHTELEC == elecDir)<<1))
			{
			case 0:
				strcpy(tempStr1, "从左到右");
				break;
			case 1:
				strcpy(tempStr1, "从上到下");
				break;
			case 2:
				strcpy(tempStr1, "从右到左");
				break;
			case 3:
				strcpy(tempStr1, "从下到上");
				break;
			}

			list.Init(2);
			list.SetAMember(DATA_STYLE_double, DATA_NOTE[DATA_NOTE_CURRENT], &elec);
			list.SetAMember(DATA_STYLE_LPCTSTR, "方向 :", tempStr1);
		}
		break;
	}	//switch(elecDir)

	//3,生成窗口标题
	strcpy(title, "流过");
	GetName(pointer, title+strlen(title));
	strcat(title, "的电流");

	//4,显示对话框
	PaintWithSpecialColorAndRect(pointer, false);
	MyPropertyDlg dlg(&list, true, model, title, this.canvas);
	dlg.DoModal();

	return true;
}
