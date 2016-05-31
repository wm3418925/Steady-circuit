
//11鼠标焦点物体函数---------------------------------------------------------------↓
void Manager::UpdateEditMenuState()
//更新编辑菜单状态(MF_ENABLED or MF_GRAYED)
{
	CMenu * cm = wndPointer->GetMenu();
	UINT menuState;

	if(!focusBody.IsOnAny())
	{
		cm->EnableMenuItem(IDM_FOCUSBODY_COPY, MF_GRAYED);
		cm->EnableMenuItem(IDM_FOCUSBODY_CUT, MF_GRAYED);
		cm->EnableMenuItem(IDM_FOCUSBODY_DELETE, MF_GRAYED);
		cm->EnableMenuItem(IDM_FOCUSBODY_PROPERTY, MF_GRAYED);

		cm->EnableMenuItem(IDM_FOCUSBODY_CHANGECTRLSTYLE, MF_GRAYED);
		cm->EnableMenuItem(IDM_FOCUSBODY_ROTATE1, MF_GRAYED);
		cm->EnableMenuItem(IDM_FOCUSBODY_ROTATE2, MF_GRAYED);
		cm->EnableMenuItem(IDM_FOCUSBODY_ROTATE3, MF_GRAYED);

		cm->EnableMenuItem(IDM_FOCUSBODY_SHOWELEC, MF_GRAYED);
	}
	else if(focusBody.IsOnLead())
	{
		cm->EnableMenuItem(IDM_FOCUSBODY_COPY, MF_GRAYED);
		cm->EnableMenuItem(IDM_FOCUSBODY_CUT, MF_GRAYED);
		cm->EnableMenuItem(IDM_FOCUSBODY_DELETE, MF_ENABLED);
		cm->EnableMenuItem(IDM_FOCUSBODY_PROPERTY, MF_ENABLED);

		cm->EnableMenuItem(IDM_FOCUSBODY_CHANGECTRLSTYLE, MF_GRAYED);
		cm->EnableMenuItem(IDM_FOCUSBODY_ROTATE1, MF_GRAYED);
		cm->EnableMenuItem(IDM_FOCUSBODY_ROTATE2, MF_GRAYED);
		cm->EnableMenuItem(IDM_FOCUSBODY_ROTATE3, MF_GRAYED);

		cm->EnableMenuItem(IDM_FOCUSBODY_SHOWELEC, MF_ENABLED);
	}
	else
	{
		cm->EnableMenuItem(IDM_FOCUSBODY_COPY, MF_ENABLED);
		cm->EnableMenuItem(IDM_FOCUSBODY_CUT, MF_ENABLED);
		cm->EnableMenuItem(IDM_FOCUSBODY_DELETE, MF_ENABLED);
		cm->EnableMenuItem(IDM_FOCUSBODY_PROPERTY, MF_ENABLED);

		if(focusBody.IsOnCtrl())
			menuState = MF_ENABLED;
		else
			menuState = MF_GRAYED;

		cm->EnableMenuItem(IDM_FOCUSBODY_CHANGECTRLSTYLE, menuState);
		cm->EnableMenuItem(IDM_FOCUSBODY_ROTATE1, menuState);
		cm->EnableMenuItem(IDM_FOCUSBODY_ROTATE2, menuState);
		cm->EnableMenuItem(IDM_FOCUSBODY_ROTATE3, menuState);
		cm->EnableMenuItem(IDM_FOCUSBODY_SHOWELEC, menuState);
	}
}

void Manager::FocusBodyClear(const Pointer * deleteBody)
//判断删除物体是否是当前焦点,如果是则清除鼠标焦点物体
//如果deleteBody==NULL,直接删除焦点
//函数执行在:Manager,DeleteSingleBody,ClearCircuitState
{
	if(deleteBody == NULL || focusBody.IsBodySame(deleteBody))
	{
		focusBody.Clear();
		UpdateEditMenuState();
	}
}

void Manager::FocusBodySet(const Pointer &newFocus)
//设置焦点物体
//函数执行在:FocusBodyPaint,ReadCircuitFromVector,ReadFile
{
	ASSERT(!newFocus.IsOnConnectPos());
	focusBody = newFocus;
	UpdateEditMenuState();
}

bool Manager::FocusBodyPaint(const Pointer * newFocus)
//画获得鼠标焦点的物体,并覆盖原来的焦点
//如果newFocus==NULL重绘原来焦点;否则覆盖原来的焦点,新的焦点用焦点色画
{
	if(newFocus != NULL)	//焦点改变
	{
		if(focusBody.IsBodySame(newFocus))
			return false;

		//原来的焦点用黑色画
		if(focusBody.IsOnLead())
			PaintLead(focusBody.p1);
		if(focusBody.IsOnCrun())
			PaintCrun(focusBody.p2, false);
		else if(focusBody.IsOnCtrl())
			PaintCtrl(focusBody.p3, false);

		//焦点物体更新
		FocusBodySet(*newFocus);
	}

	if(focusBody.IsOnLead())
	{
		switch(focusLeadStyle)
		{
		case SOLID_RESERVE_COLOR:
			PaintLeadWithStyle(focusBody.p1, PS_SOLID,  RESERVE_COLOR);
			break;
		case SOLID_ORIGINAL_COLOR:
			PaintLead(focusBody.p1);
			break;
		case DOT_ORIGINAL_COLOR:
			PaintLeadWithStyle(focusBody.p1, PS_DOT, focusBody.p1->color);
			break;
		case DOT_RESERVE_COLOR:
			PaintLeadWithStyle(focusBody.p1, PS_DOT, RESERVE_COLOR);
			break;
		}
	}
	else if(focusBody.IsOnCrun())
	{
		PaintCrunWithColor(focusBody.p2, focusCrunColor);
	}
	else if(focusBody.IsOnCtrl())
	{
		PaintCtrlWithColor(focusBody.p3, focusCtrlColor);
	}

	return true;
}

void Manager::FocusBodyChangeUseTab()
//用户按Tab键切换焦点处理
{
	const int bodyNum = crunNum + ctrlNum;
	Pointer newFocus;
	int num;

	if(bodyNum == 0) return;	//没有物体

	if(focusBody.IsOnLead())	//当前焦点是导线
	{
		num = (focusBody.p1->num + 1) % leadNum;
		newFocus.SetOnLead(lead[num]);
	}
	else if(focusBody.IsOnCrun())	//当前焦点是结点
	{
		num = (focusBody.p2->num + 1) % crunNum;
		newFocus.SetOnCrun(crun[num], true);
	}
	else if(focusBody.IsOnCtrl())	//当前焦点是控件
	{
		num = (focusBody.p3->num + 1) % ctrlNum;
		newFocus.SetOnCtrl(ctrl[num], true);
	}
	else	//没有设定焦点
	{
		if(crunNum > 0)
			newFocus.SetOnCrun(crun[0], true);
		else
			newFocus.SetOnCtrl(ctrl[0], true);
	}

	FocusBodyPaint(&newFocus);
}

bool Manager::FocusBodyMove(int dir)
//用户按上下左右键移动焦点物体
{
	motiNum = 0;
	if(!focusBody.IsOnBody()) return false;

	POINT fromPos, toPos;

	//获得物体坐标
	if(focusBody.IsOnCrun()) fromPos = focusBody.p2->coord;
	else fromPos = focusBody.p3->coord;
	toPos = fromPos;

	//设置移动后的坐标
	switch(dir)
	{
	case VK_UP:		//向上移动焦点
		toPos.y -= moveBodySense;
		break;
	case VK_DOWN:	//向下移动焦点
		toPos.y += moveBodySense;
		break;
	case VK_LEFT:	//向左移动焦点
		toPos.x -= moveBodySense;
		break;
	case VK_RIGHT:	//向右移动焦点
		toPos.x += moveBodySense;
		break;
	default:
		return false;
	}

	//检查坐标是否越界
	if(toPos.x < -BODYSIZE.cx/2 || toPos.y < -BODYSIZE.cy/2) return false;

	//移动对象
	PosBodyMove(&focusBody, fromPos, toPos);
	return true;
}
