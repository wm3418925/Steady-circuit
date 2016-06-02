
//3画图函数------------------------------------------------------------------------

//画控件
Manager.PaintCtrl = function(c, isPaintName) {
	ASSERT(c != NULL);
	if (isPaintName) PaintCtrlText(c);	//画控件名称
	dc.BitBlt(c.x, c.y, BODYSIZE.cx, BODYSIZE.cy, GetCtrlPaintHandle(c), 0, 0, SRCAND);
};

//画控件的名称
Manager.PaintCtrlText = function(c) {
	ASSERT(c != NULL);
	if (!c.isPaintName) return;
	dc.TextOut(c.x, c.y-15, c.name, strlen(c.name));
};

//画结点
Manager.PaintCrun = function(const CRUN * c, bool isPaintName) {
	ASSERT(c != NULL);
	if (isPaintName) PaintCrunText(c);	//画结点名称
	dc.BitBlt(c.x-DD, c.y-DD, DD*2, DD*2, &crunDcMem, 0, 0, SRCAND);
};

Manager.PaintCrunText = function(const CRUN * c)const 
//画结点名称
{
	ASSERT(c != NULL);
	if (!c.isPaintName) return;
	dc.TextOut(c.x, c.y-20, c.name, strlen(c.name));
};

//画导线
Manager.PaintLead = function(LEAD * l) {
	ASSERT(l != NULL);
	dc.SelectObject(hp + l.color);
	l.PaintLead(dc);
};

//画所有导线; 为了提高画导线的效率,相同颜色一起画
Manager.PaintAllLead = function() {
	int num, color;
	for(color=COLOR_TYPE_NUM-1; color>=0; --color)	//按颜色循环
	{
		dc.SelectObject(hp + color);
		for(num=leadNum-1; num>=0; --num)
			if (color == lead[num].color) lead[num].PaintLead(dc);
	}
	dc.SelectObject(hp);	//恢复到黑色的画笔
};

//画所有的物体
Manager.PaintAll = function() {
	int i;
	CDC * save = dc;
	RECT rect;
	BITMAP bitmap;

	//1,清除部分状态信息----------------------------------------------------
	motiNum = 0;
	addState = BODY_NO;
	lastMoveOnPos.x = -100;
	lastMoveOnBody.Clear();

	//2,画图初始化----------------------------------------------------------
	//获得窗口尺寸
	wndPointer.GetClientRect(&rect);

	//初始化刷新位图大小
	bitmapForRefresh.GetBitmap(&bitmap);
	if (rect.bottom > bitmap.bmHeight || rect.right > bitmap.bmWidth)
	{
		bitmapForRefresh.DeleteObject();
		bitmapForRefresh.CreateBitmap(rect.right, rect.bottom, 1, 32, NULL);
		dcForRefresh.SelectObject(&bitmapForRefresh);
	}

	//由dcForRefresh画图
	dc.DPtoLP(&rect);			//当前rect由设备坐标变换为逻辑坐标
	dc = &dcForRefresh;			//dc暂时替换为dcForRefresh,在内存画图

	//设置字体颜色和视角起点
	dc.SetTextColor(LEADCOLOR[textColor]);
	dc.SetViewportOrg(-viewOrig.x, -viewOrig.y);	//初始化视角起始坐标

	//3,内存画图------------------------------------------------------------
	//用白色矩形覆盖整个客户区
	dc.SelectStockObject(WHITE_PEN);
	dc.SelectStockObject(WHITE_BRUSH);
	dc.Rectangle(&rect);

	//画控件结点以及他们的名称
	for(i=ctrlNum-1; i>=0; --i)
		PaintCtrl(ctrl[i], true);
	for(i=crunNum-1; i>=0; --i)
		PaintCrun(crun[i], true);

	//画导线
	PaintAllLead();

	//画焦点
	FocusBodyPaint(NULL);

	//重绘显示电势差的物体
	PaintWithSpecialColor(pressStart, false);
	PaintWithSpecialColor(pressEnd, true);

	//4,还原dc, 一次性画图--------------------------------------------------
	dc = save;
	dc.BitBlt(0, 0, rect.right, rect.bottom, &dcForRefresh, 0, 0, SRCCOPY);
};

//画激活的连接点部位,改变鼠标形状
Manager.PaintMouseMotivate = function(const Pointer &mouseMoti) {
	const Pointer * mouse = &mouseMoti;
	POINT tempPos;
	const int CR = 3; //连接点画图半径

	if (mouse.IsOnLead())
	{
		if (motiNum && motiBody[motiNum-1].IsOnConnectPos())
		{//选定了连接点,鼠标变成添加结点图形,提示使用ConnectBodyLead函数
			SetCursor(hcShowConnect);
		}
		else
		{//没有选定连接点,鼠标变成"指针",提示改变导线坐标
			if (mouse.IsOnHoriLead())SetCursor(hcSizeNS);	//在横线,鼠标变成"上下指针"
			else SetCursor(hcSizeWE);						//在竖线,鼠标变成"左右指针"
		}
	}
	else if (mouse.IsOnBody())	//在物体上,鼠标变成手的形状,提示移动物体
	{
		SetCursor(hcHand);
	}

	if (!lastMoveOnBody.IsAllSame(mouse))	//lastMoveOnBody与mouse指向的Pointer结构体不一样
	{
		if (lastMoveOnBody.IsOnConnectPos())	//还原上一个连接点
		{
			lastMoveOnBody.GetPosFromBody(tempPos);	//获得坐标
			dc.BitBlt(tempPos.x-CR, tempPos.y-CR, CR*2, CR*2,
				&showConnectDcMem, 0, 0, SRCINVERT);
		}

		lastMoveOnBody = *mouse;	//记录当前鼠标激活物体

		if (mouse.IsOnConnectPos())	//画当前的连接点
		{
			mouse.GetPosFromBody(tempPos);	//获得坐标
			dc.BitBlt(tempPos.x-CR, tempPos.y-CR, CR*2, CR*2,
				&showConnectDcMem, 0, 0, SRCINVERT);
		}
	}
};

//用指定颜色画虚线导线
Manager.PaintLeadWithStyle = function(LEAD * lead, int leadStyle, enum COLOR colorNum) {
	ASSERT(lead != NULL);
	CPen tempPen;

	tempPen.CreatePen(leadStyle, 1, LEADCOLOR[colorNum]);	//新建特殊画笔
	dc.SelectObject(tempPen.m_hObject);					//选择画笔
	lead.PaintLead(dc);									//画导线
	tempPen.DeleteObject();									//释放画笔
	dc.SelectObject(hp);									//恢复画笔
};

//用指定颜色画指定结点
Manager.PaintCrunWithColor = function(CRUN * c, enum COLOR colorNum) {
	ASSERT(c != NULL);
	CBrush hb;

	//1,画指定颜色背景 -------------------------------------------------------------
	//设置指定颜色画刷
	hb.CreateSolidBrush(LEADCOLOR[colorNum]);
	dc.SelectObject(&hb);
	//设置空画笔
	dc.SelectStockObject(NULL_PEN);
	//画指定颜色圆形
	dc.Rectangle(c.x-DD, c.y-DD, c.x+DD+1, c.y+DD+1);

	//2,释放画刷,还原画刷 ----------------------------------------------------------
	hb.DeleteObject();
	dc.SelectStockObject(NULL_BRUSH);

	//3,画黑色结点,使用 "或" 的逻辑画图,得到指定颜色结点 ---------------------------
	dc.BitBlt(c.x-DD, c.y-DD, DD*2, DD*2, &crunDcMem, 0, 0, SRCPAINT);
};

//用指定颜色画指定控件
Manager.PaintCtrlWithColor = function(CTRL * c, enum COLOR colorNum) {
	ASSERT(c != NULL);
	CBrush hb;

	//1,画指定颜色背景 -------------------------------------------------------------
	//设置指定颜色画刷
	hb.CreateSolidBrush(LEADCOLOR[colorNum]);
	dc.SelectObject(&hb);
	//设置空画笔
	dc.SelectStockObject(NULL_PEN);
	//画指定颜色矩形
	dc.Rectangle(c.x, c.y, c.x+BODYSIZE.cx+1, c.y+BODYSIZE.cy+1);

	//2,释放画刷,还原画刷 ----------------------------------------------------------
	hb.DeleteObject();
	dc.SelectStockObject(NULL_BRUSH);

	//3,画黑色控件,使用 "或" 的逻辑画图,得到指定颜色控件
	dc.BitBlt(c.x, c.y, BODYSIZE.cx, BODYSIZE.cy, GetCtrlPaintHandle(c), 0, 0, SRCPAINT);

	//4,重新画被覆盖的周围导线 -----------------------------------------------------
	for(int num=0; num<2; ++num) if (c.lead[num] != NULL)
		PaintLead(c.lead[num]);
};

//用保留颜色(紫色)显示
Manager.PaintWithSpecialColor = function(const Pointer &body, bool isPaintNum) {
	const COLOR colorNum = (enum COLOR)COLOR_TYPE_NUM;	//选用保留颜色(紫色)

	if (body.IsOnLead())
	{
		if (isPaintNum)
		{
			//画导线
			PaintLeadWithStyle(body.p1, PS_SOLID, colorNum);

			//在导线起始和结尾处分别显示数字'1'和'2'
			char text[8] = "0";
			POINT pos[2];
			body.p1.GetStartEndPos(pos[0], pos[1]);
			for(int i=0; i<2; ++i)
			{
				++(text[0]);
				dc.TextOut(pos[i].x, pos[i].y, text, 1);
			}
		}
		else
		{
			PaintLeadWithStyle(body.p1, PS_DOT, colorNum);	//画导线
		}
	}
	else if (body.IsOnCrun())
	{
		PaintCrunWithColor(body.p2, colorNum);	//画结点
		if (isPaintNum)							//在结点上下左右分别显示1,2,3,4
		{
			POINT pos = body.p2.coord;
			pos.x -= 5; pos.y -= 8;
			dc.TextOut(pos.x, pos.y-15, "1", 1);
			dc.TextOut(pos.x, pos.y+15, "2", 1);
			dc.TextOut(pos.x-15, pos.y, "3", 1);
			dc.TextOut(pos.x+15, pos.y, "4", 1);
		}
	}
	else if (body.IsOnCtrl())
	{
		PaintCtrlWithColor(body.p3, colorNum);	//画控件
	}
};

//在指定位置显示物体的反相
Manager.PaintInvertBodyAtPos = function(const Pointer &body, POINT pos) {
	ASSERT(body.IsOnBody(false));
	if (body.IsOnCrun())
	{
		dc.BitBlt(pos.x-DD, pos.y-DD, DD*2, DD*2, &crunDcMem, 0, 0, SRCINVERT);
	}
	else //if (body.IsOnCtrl())
	{
		dc.BitBlt(pos.x, pos.y, BODYSIZE.cx, BODYSIZE.cy, GetCtrlPaintHandle(body.p3), 0, 0, SRCINVERT);
	}
};
