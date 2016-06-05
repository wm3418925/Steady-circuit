
//3画图函数------------------------------------------------------------------------

//画控件
Manager.PaintCtrl = function(c, isPaintName) {
	ASSERT(c != null);
	if (isPaintName) PaintCtrlText(c);	//画控件名称
	Manager.ctx.drawImage(Manager.GetCtrlPaintImage(c), c.x, c.y);
};

//画控件的名称
Manager.PaintCtrlText = function(c) {
	ASSERT(c != null);
	if (!c.isPaintName) return;
	Manager.ctx.strokeText(c.name, c.x, c.y-15);
};

//画结点
Manager.PaintCrun = function(c, isPaintName) {
	ASSERT(c != null);
	if (isPaintName) PaintCrunText(c);	//画结点名称
	Manager.PaintCrunWithStyle(c, PAINT_CRUN_STYLE_NORMAL);
};

//画结点名称
Manager.PaintCrunText = function(c) {
	ASSERT(c != null);
	if (!c.isPaintName) return;
	Manager.ctx.strokeText(c.name, c.x, c.y-20);
};

//画导线
Manager.PaintLead = function(l) {
	ASSERT(l != null);
	Manager.ctx.strokeStyle = l.color;
	Manager.ctx.lineWidth = 1;
	l.PaintLead(Manager.ctx);
};

//画所有导线
Manager.PaintAllLead = function() {
	for (var index=leadCount-1; index>=0; --index) {
		Manager.PaintLead(lead[index]);
	}
	Manager.ctx.strokeStyle = "#000000";
};

//画所有的物体
Manager.PaintAll = function() {
	CDC * save = Manager.ctx;
	RECT rect;
	BITMAP bitmap;

	//1,清除部分状态信息----------------------------------------------------
	motiCount = 0;
	addState = BODY_NO;
	lastMoveOnPos.x = -100;
	lastMoveOnBody.Clear();

	//2,画图初始化----------------------------------------------------------
	//获得窗口尺寸
	rect.left = 0;
	rect.top = 0;
	rect.right = Manager.canvas.width;
	rect.bottom = Manager.canvas.height;

	//初始化刷新位图大小
	bitmapForRefresh.GetBitmap(&bitmap);
	if (rect.bottom > bitmap.bmHeight || rect.right > bitmap.bmWidth) {
		bitmapForRefresh.DeleteObject();
		bitmapForRefresh.CreateBitmap(rect.right, rect.bottom, 1, 32, null);
		dcForRefresh.SelectObject(&bitmapForRefresh);
	}

	//由dcForRefresh画图
	Manager.ctx.DPtoLP(&rect);			//当前rect由设备坐标变换为逻辑坐标
	Manager.ctx = &dcForRefresh;		//dc暂时替换为dcForRefresh,在内存画图

	//设置字体颜色和视角起点
	Manager.ctx.SetTextColor(LEADCOLOR[textColor]);
	Manager.ctx.SetViewportOrg(-viewOrig.x, -viewOrig.y);	//初始化视角起始坐标

	//3,内存画图------------------------------------------------------------
	//用白色矩形覆盖整个客户区
	Manager.ctx.fillStyle = "#FFFFFF";
	Manager.ctx.strokeStyle = "#FFFFFF";
	Manager.ctx.fillRect(&rect);

	//画控件结点以及他们的名称
	for(var i=ctrlCount-1; i>=0; --i)
		PaintCtrl(ctrl[i], true);
	for(var i=crunCount-1; i>=0; --i)
		PaintCrun(crun[i], true);
	//画导线
	PaintAllLead();

	//画焦点
	FocusBodyPaint(null);

	//重绘显示电势差的物体
	PaintWithSpecialColorAndRect(pressStart, false);
	PaintWithSpecialColorAndRect(pressEnd, true);

	//4,还原dc, 一次性画图--------------------------------------------------
	Manager.ctx = save;
	Manager.ctx.BitBlt(0, 0, rect.right, rect.bottom, &dcForRefresh, 0, 0, SRCCOPY);
};

//画激活的连接点部位,改变鼠标形状
Manager.PaintMouseMotivate = function(mouseMoti) {
	var mm = mouseMoti;
	POINT tempPos;
	var CR = 3; //连接点画图半径

	if (mm.IsOnLead()) {
		//选定了连接点,鼠标变成添加结点图形,提示使用ConnectBodyLead函数
		if (motiCount && motiBody[motiCount-1].IsOnConnectPos()) {
			SetCursor(hcShowConnect);
		//没有选定连接点,鼠标变成"指针",提示改变导线坐标
		} else {
			if (mm.IsOnHoriLead())
				SetCursor(hcSizeNS);	//在横线,鼠标变成"上下指针"
			else 
				SetCursor(hcSizeWE);	//在竖线,鼠标变成"左右指针"
		}
	} else if (mm.IsOnBody()) {	//在物体上,鼠标变成手的形状,提示移动物体
		SetCursor(hcHand);
	}

	if (!lastMoveOnBody.IsAllSame(mm)) {	//lastMoveOnBody与mouse指向的Pointer结构体不一样
		//还原上一个连接点
		if (lastMoveOnBody.IsOnConnectPos()) {
			lastMoveOnBody.GetPosFromBody(tempPos);	//获得坐标
			Manager.ctx.BitBlt(tempPos.x-CR, tempPos.y-CR, CR*2, CR*2, showConnectImageData, 0, 0, SRCINVERT);
		}

		lastMoveOnBody = mm;	//记录当前鼠标激活物体

		//画当前的连接点
		if (mm.IsOnConnectPos()) {
			mm.GetPosFromBody(tempPos);	//获得坐标
			Manager.ctx.BitBlt(tempPos.x-CR, tempPos.y-CR, CR*2, CR*2, showConnectImageData, 0, 0, SRCINVERT);
		}
	}
};

//用指定颜色画虚线导线
Manager.PaintLeadWithStyle = function(lead, leadStyle, colorType) {
	ASSERT(lead != null);
	CPen tempPen;
	
	tempPen.CreatePen(leadStyle, 1, LEADCOLOR[colorType]);	//新建特殊画笔
	Manager.ctx.SelectObject(tempPen.m_hObject);			//选择画笔
	lead.PaintLead(Manager.ctx);							//画导线
};

//用指定的PAINT_CRUN_STYLE, 画指定结点
Manager.PaintCrunWithStyle = function(c, style) {
	ASSERT(c != null);
	ASSERT(style >= 0 && style < PAINT_CRUN_STYLE_COUNT);

	Manager.ctx.fillRect(c.x-DD, c.y-DD, 2*DD, 2*DD);
	Manager.ctx.putImageData(Manager.crunImageData[style], c.x-DD, c.y-DD);
};

//用指定颜色画指定控件
Manager.PaintCtrlWithColor = function(c, colorType) {
	ASSERT(c != null);
	CBrush hb;

	//1,画指定颜色背景 -------------------------------------------------------------
	//设置指定颜色画刷
	hb.CreateSolidBrush(LEADCOLOR[colorType]);
	Manager.ctx.SelectObject(&hb);
	//设置空画笔
	Manager.ctx.SelectStockObject(NULL_PEN);
	//画指定颜色矩形
	Manager.ctx.Rectangle(c.x, c.y, c.x+CTRL_SIZE.cx+1, c.y+CTRL_SIZE.cy+1);

	//2,释放画刷,还原画刷 ----------------------------------------------------------
	hb.DeleteObject();
	Manager.ctx.SelectStockObject(NULL_BRUSH);

	//3,画黑色控件,使用 "或" 的逻辑画图,得到指定颜色控件
	Manager.ctx.BitBlt(c.x, c.y, CTRL_SIZE.cx, CTRL_SIZE.cy, GetCtrlPaintImage(c), 0, 0, SRCPAINT);

	//4,重新画被覆盖的周围导线 -----------------------------------------------------
	for (var i=0; i<2; ++i) 
		if (c.lead[i] != null)
			PaintLead(c.lead[i]);
};

//用保留颜色(紫色)显示物体, 并且在外部用矩形包围
Manager.PaintWithSpecialColorAndRect = function(body, isPaintNum) {
	const COLOR colorType = (enum COLOR)COLOR_TYPE_COUNT;	//选用保留颜色(紫色)

	if (body.IsOnLead()) {
		if (isPaintNum) {
			//画导线
			PaintLeadWithStyle(body.p1, PS_SOLID, colorType);

			//在导线起始和结尾处分别显示数字'1'和'2'
			char text[8] = "0";
			POINT pos[2];
			body.p1.GetStartEndPos(pos[0], pos[1]);
			for(int i=0; i<2; ++i) {
				++(text[0]);
				Manager.ctx.TextOut(pos[i].x, pos[i].y, text, 1);
			}
		} else {
			PaintLeadWithStyle(body.p1, PS_DOT, colorType);	//画导线
		}
	} else if (body.IsOnCrun()) {
		PaintCrunWithStyle(body.p2, PAINT_CRUN_STYLE_SPECIAL);	//画结点
		PaintCommonFunc.PaintSurrendedRect(Manager.ctx, body.p.x-DD, body.p.y-DD, DD*2, DD*2, #F01010);
		
		if (isPaintNum) {	//在结点上下左右分别显示1,2,3,4
			POINT pos = body.p2.coord;
			pos.x -= 5; pos.y -= 8;
			Manager.ctx.TextOut(pos.x, pos.y-15, "1", 1);
			Manager.ctx.TextOut(pos.x, pos.y+15, "2", 1);
			Manager.ctx.TextOut(pos.x-15, pos.y, "3", 1);
			Manager.ctx.TextOut(pos.x+15, pos.y, "4", 1);
		}
	} else if (body.IsOnCtrl()) {
		PaintCtrlWithColor(body.p3, colorType);	//画控件
		PaintCommonFunc.PaintSurrendedRect(Manager.ctx, body.p.x, body.p.y, CTRL_SIZE.cx, CTRL_SIZE.cy, #F01010);
	}
};

//在指定位置显示物体的反相
Manager.PaintInvertBodyAtPos = function(const Pointer &body, POINT pos) {
	ASSERT(body.IsOnBody(false));
	if (body.IsOnCrun()) {
		Manager.ctx.BitBlt(pos.x-DD, pos.y-DD, DD*2, DD*2, &crunImageData, 0, 0, SRCINVERT);
	} else {//if (body.IsOnCtrl())
		Manager.ctx.BitBlt(pos.x, pos.y, CTRL_SIZE.cx, CTRL_SIZE.cy, GetCtrlPaintImage(body.p3), 0, 0, SRCINVERT);
	}
};
