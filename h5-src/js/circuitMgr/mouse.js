
//6鼠标消息处理函数----------------------------------------------------------------↓

bool Manager::MotivateAll(POINT &pos)
//传入鼠标坐标,传出是否在物体上,或物体的连接点上
{
	Pointer * mouse = motiBody + motiNum;
	int i;

	//1,初始化-------------------------------------------
	ASSERT(motiNum >= 0 && motiNum < 2);
	dc->DPtoLP(&pos);
	mouse->Clear();

	//2,搜索在什么物体上---------------------------------
	for(i = crunNum-1; i >= 0; --i)	//搜索所有结点
	{
		mouse->SetAtState(crun[i]->At(pos));
		if(mouse->IsOnAny())
		{
			mouse->SetOnCrun(crun[i]);
			++motiNum;
			goto testPlace;
		}
	}
	for(i = leadNum-1; i >= 0; --i)	//搜索所有导线
	{
		mouse->SetAtState(lead[i]->At(pos));
		if(mouse->IsOnAny())
		{
			mouse->SetOnLead(lead[i], false);
			++motiNum;
			goto testPlace;
		}
	}
	for(i = ctrlNum-1; i >= 0; --i)	//搜索所有控件
	{
		mouse->SetAtState(ctrl[i]->At(pos));
		if(mouse->IsOnAny())
		{
			mouse->SetOnCtrl(ctrl[i]);
			++motiNum;
			goto testPlace;
		}
	}

	return false;	//运行到这里一定没有激活物体

testPlace:

	//3,去除不需要显示连接的部分-------------------------
	if( 2 == motiNum		//同一物体的两个连接点不能显示连接
		&& motiBody[0].IsOnConnectPos() 
		&& motiBody[1].IsOnConnectPos()
		&& motiBody[0].IsBodySame(motiBody+1))	
	{
		--motiNum;
		return false;
	}
	else if(2 == motiNum	//无意义操作
		&& motiBody[0].IsOnConnectPos()
		&& !motiBody[1].IsOnConnectPos() 
		&& !motiBody[1].IsOnLead())
	{
		--motiNum;
		return false;
	}

	return true;
}

bool Manager::LButtonDown(POINT pos)
//处理WM_LBUTTONDOWN消息
{
	if(!isUpRecvAfterDown) motiNum = 0;		//在上次鼠标左键按下后没有接受到鼠标按起消息
	lButtonDownState = MotivateAll(pos);	//记录这次鼠标是否点击了物体
	lButtonDownPos = pos;					//记录鼠标左键按下的坐标
	isUpRecvAfterDown = false;				//收到鼠标按起消息会设置为true
	lastMoveOnPos.x = -100;					//还原左击物体后,鼠标移动到的坐标

	if(!lButtonDownState) //未点击有效部位,点击物体清除,帮助连接导线
	{
		if(motiNum > 0 && motiBody[motiNum-1].IsOnConnectPos())
			PaintAll();	//覆盖ShowAddLead画的导线

		motiNum = 0; return false;
	}
	else if(!motiBody[motiNum-1].IsOnConnectPos())	//点击不在连接点
	{
		FocusBodyPaint(motiBody+motiNum-1);	//重绘焦点物体
	}

	if(2 == motiNum && motiBody[0].IsOnConnectPos())	//判断第一个选定点是否是连接点
	{
		if(motiBody[1].IsOnConnectPos())
		{
			CloneCircuitBeforeChange();			//编辑前复制电路
			AddLead(motiBody[0], motiBody[1]);	//编辑函数
			PutCircuitToVector();				//将新的电路信息保存到容器
		}
		else if(motiBody[1].IsOnLead())
		{
			ConnectBodyLead(pos);
		}

		motiNum = 0; return true;
	}

	//AddLead处理了dira=1~4,dirb=1~4的消息;ConnectBodyLead(pos)处理了dira=1~4,dirb=-2~-3,...的消息.
	//dira=1~4,dirb=-1的消息不做处理,仅仅刷新
	//dira=-1,-2,-3,...的消息屏蔽掉(因为后面又点击了物体)
	//也就是LButtonUp只能处理1==motiNum,dira=-1,-2,-3,...的消息;

	if(2 == motiNum) motiNum = 0;
	return false;
}

bool Manager::LButtonUp(POINT pos)
//处理鼠标左键按起的消息
{
	isUpRecvAfterDown = true;						//鼠标按下后收到鼠标按起消息
	if(!lButtonDownState || !motiNum) return false;	//没有点击返回
	dc->DPtoLP(&pos);
	Pointer * body = motiBody + motiNum - 1;

	//左键按下和按起的坐标相同,而且点击的不是连接点
	if( lButtonDownPos.x == pos.x && lButtonDownPos.y == pos.y 
		&& !body->IsOnConnectPos())
	{
		if(body->IsOnCtrl())
			body->p3->SwitchOnOff();	//开关开合情况改变
		FocusBodyPaint(NULL);			//重绘焦点

		motiNum = 0;
		return false;
	}

	if(body->IsOnLead())	//移动导线
	{
		body->p1->Move(body->GetAtState(), pos, maxLeaveOutDis);
		motiNum = 0;
		return true;
	}
	else if(body->IsOnBody())	//移动物体或复制物体
	{
		if(StaticClass::IsCtrlDown())	//左或右Ctrl键按下复制物体
			PosBodyClone(body, lButtonDownPos, pos);
		else
			PosBodyMove(body, lButtonDownPos, pos);
		motiNum = 0;
		return true;
	}
	else if(!body->IsOnConnectPos())
	{
		motiNum = 0;
		return false;
	}

	return false;
}

void Manager::MouseMove(POINT pos, bool isLButtonDown)
//鼠标移动消息处理
{
	if(ShowAddBody(pos)) return;					//添加物体过程显示
	if(ShowMoveBody(pos, isLButtonDown)) return;	//移动物体过程显示
	if(ShowMoveLead(isLButtonDown)) return;			//移动导线过程显示
	ShowAddLead(pos);								//连接导线过程显示

	//鼠标激活物体显示
	if(MotivateAll(pos))	//鼠标激活了物体
	{
		--motiNum;
		PaintMouseMotivate(motiBody[motiNum]);
	}
	else					//鼠标没有激活物体
	{
		motiBody[1].Clear();
		PaintMouseMotivate(motiBody[1]);
	}
}
