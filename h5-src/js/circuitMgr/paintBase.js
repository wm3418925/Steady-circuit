
//3画图函数------------------------------------------------------------------------

//画控件
Manager.PaintCtrl = function(c, isPaintName) {
	ASSERT(c != null);
	if (isPaintName) Manager.PaintCtrlText(c);	//画控件名称
	Manager.ctx.putImageData(Manager.GetCtrlPaintImage(c), c.x, c.y);
};

//画控件的名称
Manager.PaintCtrlText = function(c) {
	ASSERT(c != null);
	if (!c.isPaintName) return;
	Manager.ctx.fillStyle = PaintCommonFunc.HexToRGBStr(Manager.textColor);
	Manager.ctx.fillText(c.name, c.x, c.y-5);
};

//画结点
Manager.PaintCrun = function(c, isPaintName) {
	ASSERT(c != null);
	if (isPaintName) Manager.PaintCrunText(c);	//画结点名称
	Manager.PaintCrunWithStyle(c, PAINT_CRUN_STYLE_NORMAL);
};

//画结点名称
Manager.PaintCrunText = function(c) {
	ASSERT(c != null);
	if (!c.isPaintName) return;
	Manager.ctx.fillStyle = PaintCommonFunc.HexToRGBStr(Manager.textColor);
	Manager.ctx.fillText(c.name, c.x, c.y-10);
};

//画导线
Manager.PaintLead = function(l) {
	ASSERT(l != null);
	Manager.ctx.strokeStyle = PaintCommonFunc.HexToRGBStr(l.color);
	Manager.ctx.lineWidth = 2;
	Manager.ctx.beginPath();
	l.PaintLead(Manager.ctx);
	Manager.ctx.stroke();
};

//画所有导线
Manager.PaintAllLead = function() {
	for (var index=Manager.lead.length-1; index>=0; --index) {
		Manager.PaintLead(Manager.lead[index]);
	}
	Manager.ctx.strokeStyle = "#000000";
};

//画所有的物体
Manager.PaintAll = function() {
	var rect = {};
	//var save = Manager.ctx;
	//var bitmap;

	//1,清除部分状态信息----------------------------------------------------
	Manager.motiCount = 0;
	Manager.addState = BODY_NO;
	Manager.lastMoveOnPos = {x:-100, y:-100};
	Manager.lastMoveOnBody.Clear();

	//2,画图初始化----------------------------------------------------------
	//获得窗口尺寸
	rect.left = 0;
	rect.top = 0;
	rect.width = Manager.canvas.width;
	rect.height = Manager.canvas.height;

	//初始化刷新位图大小
	/*bitmapForRefresh.GetBitmap(&bitmap);
	if (rect.height > bitmap.bmHeight || rect.width > bitmap.bmWidth) {
		bitmapForRefresh.DeleteObject();
		bitmapForRefresh.CreateBitmap(rect.width, rect.height, 1, 32, null);
		dcForRefresh.SelectObject(&bitmapForRefresh);
	}*/

	//由dcForRefresh画图
	//DPtoLP(rect, Manager.canvas)			//当前rect由设备坐标变换为逻辑坐标
	//Manager.ctx = &dcForRefresh;		//dc暂时替换为dcForRefresh,在内存画图

	//设置字体和视角起点
	Manager.ctx.font = "15px Georgia";

	//3,内存画图------------------------------------------------------------
	//用白色矩形覆盖整个客户区
	Manager.ctx.fillStyle = "#FFFFFF";
	Manager.ctx.strokeStyle = "#FFFFFF";
	Manager.ctx.fillRect(rect.left,rect.top, rect.width,rect.height);

	//画控件结点以及他们的名称
	for (var i=Manager.ctrl.length-1; i>=0; --i)
		Manager.PaintCtrl(Manager.ctrl[i], true);
	for (var i=Manager.crun.length-1; i>=0; --i)
		Manager.PaintCrun(Manager.crun[i], true);
	//画导线
	Manager.PaintAllLead();

	//画焦点
	Manager.FocusBodyPaint(null);

	//重绘显示电势差的物体
	Manager.PaintWithSpecialColorAndRect(Manager.pressStartBody, false);
	Manager.PaintWithSpecialColorAndRect(Manager.pressEndBody, true);

	//4,还原dc, 一次性画图--------------------------------------------------
	//Manager.ctx = save;
	//Manager.ctx.BitBlt(0, 0, rect.width, rect.height, &dcForRefresh, 0, 0, SRCCOPY);
};

//画激活的连接点部位,改变鼠标形状
Manager.PaintMouseMotivate = function(mouseMoti) {
	var mm = mouseMoti;
	var CR = 3; //连接点画图半径

	if (mm.IsOnLead()) {
		//选定了连接点,鼠标变成添加结点图形,提示使用ConnectBodyLead函数
		if (Manager.motiCount > 0 && Manager.motiBody[Manager.motiCount-1].IsOnConnectPos()) {
			Manager.SetCursor("crosshair");
		//没有选定连接点,鼠标变成"指针",提示改变导线坐标
		} else {
			if (mm.IsOnHoriLead())
				Manager.SetCursor("s-resize");	//在横线,鼠标变成"上下指针"
			else 
				Manager.SetCursor("w-resize");	//在竖线,鼠标变成"左右指针"
		}
	} else if (mm.IsOnBody()) {	//在物体上,鼠标变成手的形状,提示移动物体
		Manager.SetCursor("pointer");
	} else if (!mm.IsOnAny()) {
		Manager.SetCursor("default");
	}

	if (!Manager.lastMoveOnBody.IsAllSame(mm)) {	//lastMoveOnBody与mouse指向的Pointer结构体不一样
		//还原上一个连接点
		if (Manager.lastMoveOnBody.IsOnConnectPos()) {
			var tempPos = Manager.lastMoveOnBody.GetPosFromBody();	//获得坐标
			PaintCommonFunc.PaintImageDataXor(Manager.ctx, Manager.showConnectImageData, tempPos.x-CR, tempPos.y-CR);
		}

		Manager.lastMoveOnBody = mm.Clone();	//记录当前鼠标激活物体

		//画当前的连接点
		if (mm.IsOnConnectPos()) {
			var tempPos = mm.GetPosFromBody();	//获得坐标
			PaintCommonFunc.PaintImageDataXor(Manager.ctx, Manager.showConnectImageData, tempPos.x-CR, tempPos.y-CR);
		}
	}
};

//用指定颜色画虚线导线
Manager.PaintLeadWithStyle = function(lead, leadWidth, color) {
	ASSERT(lead != null);
	
	Manager.ctx.strokeStyle = PaintCommonFunc.HexToRGBStr(color);
	Manager.ctx.lineWidth = leadWidth;
	Manager.ctx.beginPath();
	lead.PaintLead(Manager.ctx);
	Manager.ctx.stroke();
};

//用指定的PAINT_CRUN_STYLE, 画指定结点
Manager.PaintCrunWithStyle = function(c, style) {
	ASSERT(c != null);
	ASSERT(style >= 0 && style < PAINT_CRUN_STYLE_COUNT);

	Manager.ctx.fillRect(c.x-DD, c.y-DD, 2*DD, 2*DD);
	Manager.ctx.putImageData(Manager.crunImageData[style], c.x-DD, c.y-DD);
};

//用指定颜色画指定控件
Manager.PaintCtrlWithColor = function(c, color) {
	ASSERT(c != null);

	//画指定颜色背景
	//设置指定颜色画刷
	Manager.ctx.fillStyle = PaintCommonFunc.HexToRGBStr(color);
	//设置空画笔
	Manager.ctx.lineWidth = 0;
	//画指定颜色矩形
	Manager.ctx.fillRect(c.x, c.y, CTRL_SIZE.cx, CTRL_SIZE.cy);

	//画黑色控件,使用 "或" 的逻辑画图,得到指定颜色控件
	PaintCommonFunc.PaintImageDataOr(Manager.ctx, Manager.GetCtrlPaintImage(c), c.x,c.y);

	//重新画被覆盖的周围导线
	for (var i=0; i<2; ++i) 
		if (c.lead[i] != null)
			Manager.PaintLead(c.lead[i]);
};

//用保留颜色(紫色)显示物体, 并且在外部用矩形包围
Manager.PaintWithSpecialColorAndRect = function(body, isPaintNum) {
	var color = COLOR_SPECIAL;	//选用保留颜色(紫色)

	if (body.IsOnLead()) {
		if (isPaintNum) {
			//画导线
			Manager.PaintLeadWithStyle(body.p, 1, color);

			//在导线起始和结尾处分别显示数字'1'和'2'
			var startPos = {}, endPos = {};
			body.p.GetStartEndPos(startPos, endPos);
			Manager.ctx.strokeText("1", startPos.x, startPos.y);
			Manager.ctx.strokeText("2", endPos.x, endPos.y);
		} else {
			Manager.PaintLeadWithStyle(body.p, 2, color);	//画导线
		}
	} else if (body.IsOnCrun()) {
		Manager.PaintCrunWithStyle(body.p, PAINT_CRUN_STYLE_SPECIAL);	//画结点
		PaintCommonFunc.PaintSurrendedRect(Manager.ctx, body.p.x-DD, body.p.y-DD, DD*2, DD*2, 0xF01010);
		
		if (isPaintNum) {	//在结点上下左右分别显示1,2,3,4
			var pos = {x:body.p.x-5, y:body.p.y-8};
			Manager.ctx.strokeText("1", pos.x, pos.y-15);
			Manager.ctx.strokeText("2", pos.x, pos.y+15);
			Manager.ctx.strokeText("3", pos.x-15, pos.y);
			Manager.ctx.strokeText("4", pos.x+15, pos.y);
		}
	} else if (body.IsOnCtrl()) {
		Manager.PaintCtrlWithColor(body.p, color);	//画控件
		PaintCommonFunc.PaintSurrendedRect(Manager.ctx, body.p.x, body.p.y, CTRL_SIZE.cx, CTRL_SIZE.cy, 0xF01010);
	}
};

//在指定位置显示物体的反相
Manager.PaintInvertBodyAtPos = function(body, pos) {
	ASSERT(body.IsOnBody(false));
	if (body.IsOnCrun()) {
		PaintCommonFunc.PaintImageDataXor(Manager.ctx, Manager.crunImageData[PAINT_CRUN_STYLE_NORMAL], pos.x-DD, pos.y-DD);
	} else {//if (body.IsOnCtrl())
		PaintCommonFunc.PaintImageDataXor(Manager.ctx, Manager.GetCtrlPaintImage(body.p), pos.x, pos.y);
	}
};
