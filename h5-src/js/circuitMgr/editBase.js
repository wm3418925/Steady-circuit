
//5编辑函数------------------------------------------------------------------------↓
void Manager.AddCtrl(POINT pos, BODY_TYPE style)
//添加控件
{
	ASSERT(Manager.ctrl.length < MAX_CTRL_COUNT);

	ctrl[Manager.ctrl.length] = new CTRL(Manager.ctrl.length, pos, style);
	++ Manager.ctrl.length;

	PaintCtrlText(ctrl[Manager.ctrl.length-1]);
	Pointer newFocus;
	newFocus.SetOnCtrl(ctrl[Manager.ctrl.length-1], 1);
	FocusBodyPaint(&newFocus);
}

void Manager.AddCrun(POINT pos)
//添加结点
{
	ASSERT(Manager.crun.length < MAX_CRUN_COUNT);

	crun[Manager.crun.length] = new CRUN(Manager.crun.length, pos);
	++ Manager.crun.length;

	PaintCrunText(crun[Manager.crun.length-1]);
	Pointer newFocus;
	newFocus.SetOnCrun(crun[Manager.crun.length-1], 1);
	FocusBodyPaint(&newFocus);
}

void Manager.AddLead(Pointer a, Pointer b)
//用导线连接2个物体
{
	ASSERT(Manager.lead.length < MAX_LEAD_COUNT);						//导线够用
	ASSERT(a.IsOnConnectPos() && b.IsOnConnectPos());	//连接点
	ASSERT(!a.IsBodySame(&b));							//不是同一个物体

	//添加导线
	lead[Manager.lead.length] = new LEAD(Manager.lead.length, a, b);
	++Manager.lead.length;

	//连接物体指向导线
	if (a.IsOnCrun())
		a.p2.lead[a.GetLeadNum()] = lead[Manager.lead.length-1];
	else 
		a.p3.lead[a.GetLeadNum()] = lead[Manager.lead.length-1];
	if (b.IsOnCrun())
		b.p2.lead[b.GetLeadNum()] = lead[Manager.lead.length-1];
	else 
		b.p3.lead[b.GetLeadNum()] = lead[Manager.lead.length-1];

	//显示添加的导线
	PaintLead(lead[Manager.lead.length-1]);
}

void Manager.DeleteLead(LEAD * l)
//删除连接2个物体的连线
//使用函数: Delete(Pointer), ConnectBodyLead
{
	ASSERT(l != null);
	Pointer * a = l.conBody, * b = l.conBody + 1;
	int dira = a.GetLeadNum(), dirb = b.GetLeadNum();
	int num = l.num;

	//如果删除物体是焦点,清除焦点
	Pointer pointer;
	pointer.SetOnLead(l);
	FocusBodyClear(&pointer);

	//清空连接的指针
	if (a.IsOnCrun()) a.p2.lead[dira] = null;
	else if (a.IsOnCtrl()) a.p3.lead[dira] = null;
	if (b.IsOnCrun()) b.p2.lead[dirb] = null;
	else if (b.IsOnCtrl()) b.p3.lead[dirb] = null;

	//删除导线
	delete l;
	if (num != Manager.lead.length-1)
	{
		lead[num] = lead[Manager.lead.length-1];
		lead[num].num = num;
	}
	lead[Manager.lead.length-1] = null;
	--Manager.lead.length;
}

void Manager.DeleteSingleBody(Pointer pointer)
//仅仅是删除一个结点或者控件,不影响周围物体
{
	ASSERT(pointer.IsOnBody());
	int num;

	FocusBodyClear(&pointer);	//如果删除物体是焦点,清除焦点

	if (pointer.IsOnCrun())
	{
		num = pointer.p2.num;
		delete pointer.p2;
		if (num != Manager.crun.length-1)
		{
			crun[num] = crun[Manager.crun.length-1];
			crun[num].num = num;
		}
		crun[Manager.crun.length-1] = null;
		--Manager.crun.length;
	}
	else //if (pointer.IsOnCtrl())
	{
		num = pointer.p3.num;
		delete pointer.p3;
		if (num != Manager.ctrl.length-1)
		{
			ctrl[num] = ctrl[Manager.ctrl.length-1];
			ctrl[num].num = num;
		}
		ctrl[Manager.ctrl.length-1] = null;
		--Manager.ctrl.length;
	}
}

void Manager.Delete(Pointer pointer)
//删除
{
	ASSERT(pointer.IsOnAny() && !pointer.IsOnConnectPos());
	CloneCircuitBeforeChange();	//编辑前复制电路

	if (pointer.IsOnLead())
	{
		DeleteLead(pointer.p1);
	}
	else if (pointer.IsOnCrun())
	{
		for (int i=0; i<4; ++i) if (pointer.p2.lead[i] != null)
			DeleteLead(pointer.p2.lead[i]);
		DeleteSingleBody(pointer);
	}
	else //if (pointer.IsOnCtrl())
	{
		for (int i=0; i<2; ++i) if (pointer.p3.lead[i] != null)
			DeleteLead(pointer.p3.lead[i]);
		DeleteSingleBody(pointer);
	}

	PutCircuitToVector();	//将新的电路信息保存到容器
}

bool Manager.ConnectBodyLead(POINT posb)
//连接一个连接点和导线
{
	Pointer a;				//先点击物体和连接点
	Pointer x, y;			//后点击物体(导线)的2个连接物体
	Pointer newCrun;		//新添加的结点
	POINT posa;				//先点击物体的坐标
	char dir1, dir2, dir3;	//结点连接x,y,a的连接点位置
	LEADSTEP newLeadPosx, newLeadPosy;

	//1,检查函数运行条件
	ASSERT(Manager.motiCount == 2 && Manager.motiBody[0].IsOnConnectPos() && Manager.motiBody[1].IsOnLead());
	Manager.motiCount = 0;
	if (Manager.crun.length >= MAX_CRUN_COUNT)	//只要结点数量够,导线一定够
	{
		Manager.canvas.MessageBox("结点超过最大数量!", "结点不能添加", MB_ICONWARNING);
		return false;
	}

	//2,编辑前复制电路
	CloneCircuitBeforeChange();

	//3,获得物体和坐标
	a = Manager.motiBody[0];
	x = Manager.motiBody[1].p1.conBody[0];
	y = Manager.motiBody[1].p1.conBody[1];
	if (a.IsOnCrun())posa = a.p2.coord;
	else posa = a.p3.coord;	//获得先点击物体的坐标

	//4,初始化连接新添加结点的方向
	if (Manager.motiBody[1].IsOnHoriLead())	//-3,-5,-7....横线
	{
		if (Manager.motiBody[1].p1.GetBodyPos() & 2)
		{
			dir1 = 4;
			dir2 = 3;
		}
		else
		{
			dir1 = 3;
			dir2 = 4;
		}

		if (posa.y > posb.y)dir3 = 2;	//先点击物体在后点击位置的下面
		else dir3 = 1;	//先点击物体在后点击位置的上面
	}
	else	//-2,-4,-6....竖线
	{
		if (Manager.motiBody[1].p1.GetBodyPos() & 1)
		{
			dir1 = 2;
			dir2 = 1;
		}
		else
		{
			dir1 = 1;
			dir2 = 2;
		}

		if (posa.x > posb.x)dir3 = 4;	//先点击物体在后点击位置的右面
		else dir3 = 3;	//先点击物体在后点击位置的左面
	}

	//5,添加删除物体
	Manager.motiBody[1].p1.Divide(Manager.motiBody[1].GetAtState(), posb, newLeadPosx, newLeadPosy);	//记忆原来导线坐标
	DeleteLead(Manager.motiBody[1].p1);	//删除原来导线
	AddCrun(posb);	//添加结点

	newCrun.SetOnCrun(crun[Manager.crun.length-1]);	//newCrun指向新添加结点

	newCrun.SetAtState(dir1);
	AddLead(x, newCrun);	//x和节点连线,x是起点,新节点是终点
	lead[Manager.lead.length-1].ReplacePos(newLeadPosx);	//坐标还原

	newCrun.SetAtState(dir2);
	AddLead(newCrun, y);	//y和节点连线,y是终点,新节点是起点
	lead[Manager.lead.length-1].ReplacePos(newLeadPosy);	//坐标还原

	newCrun.SetAtState(dir3);
	AddLead(a, newCrun);	//a和节点连线

	//6,将新的电路信息保存到容器
	PutCircuitToVector();

	return true;
}

bool Manager.Delete(FOCUS_OR_POS &body)
//删除物体
{
	Pointer pointer = Manager.GetBodyPointer(body);
	if (!pointer.IsOnAny()) return false;

	if (DeleteNote(pointer))
	{
		Delete(pointer);
		return true;
	}
	else 
	{
		return false;
	}
}
