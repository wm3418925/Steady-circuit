
var CTRL_BITMAP_COUNT = CTRL_TYPE_COUNT*8;	//控件位图的个数(包括旋转之后的)

//1初始化和清理函数------------------------------------------------------------
var Manager = {

	// 初始化连接点位图
	CreateShowConnectImageData: function() {
		var len = 16*9;
		var imgData = Manager.ctx.createImageData(6,6);
		
		for (var i=8; i<len; i+=4) {
			imgData.data[i+0]=0;
			imgData.data[i+1]=0;
			imgData.data[i+2]=0;
			imgData.data[i+3]=255;
		}
		imgData.data[3]=imgData.data[7]=imgData.data[19]=imgData.data[23]=imgData.data[27]=imgData.data[47]=0;
		imgData.data[len-1]=imgData.data[len-5]=imgData.data[len-17]=imgData.data[len-21]=imgData.data[len-25]=imgData.data[len-45]=0;
	},
	
	// 以指定颜色初始化一个节点
	CreateCrunImageWithColor: function(colorHex) {
		var r = PaintCommonFunc.RedOfHexRGB(colorHex);
		var g = PaintCommonFunc.GreenOfHexRGB(colorHex);
		var b = PaintCommonFunc.BlueOfHexRGB(colorHex);
		
		var len = 16*DD*DD;
		var imgData = Manager.ctx.createImageData(2*DD,2*DD);
		
		for (var i=8; i<len; i+=4) {
			imgData.data[i+0]=r;
			imgData.data[i+1]=g;
			imgData.data[i+2]=b;
			imgData.data[i+3]=255;
		}
		imgData.data[3]=imgData.data[7]=imgData.data[DD*8-5]=imgData.data[DD*8-1]=imgData.data[DD*8+3]=imgData.data[DD*16-1]=0;
		imgData.data[len-1]=imgData.data[len-5]=imgData.data[len-DD*8+7]=imgData.data[len-DD*8+3]=imgData.data[len-DD*8-1]=imgData.data[len-DD*16+3]=0;
	},
	// 初始化所有节点位图
	CreateAllCrunImageData: function() {
		var crunImageData = new Array(PAINT_CRUN_STYLE_COUNT);
		crunImageData[PAINT_CRUN_STYLE_NORMAL] = Manager.CreateCrunImageWithColor(COLOR_NORMAL);
		crunImageData[PAINT_CRUN_STYLE_FOCUS] = Manager.CreateCrunImageWithColor(COLOR_FOCUS);
		crunImageData[PAINT_CRUN_STYLE_SPECIAL] = Manager.CreateCrunImageWithColor(COLOR_SPECIAL);
		
		Manager.crunImageData = crunImageData;
	},
	
	//初始化位图句柄
	InitBitmap: function() {
		//激活点位图
		Manager.showConnectImageData = Manager.CreateShowConnectImageData();

		//节点位图
		Manager.CreateAllCrunImageData();

		//控件位图,处理得到旋转控件
		Manager.ctrlImageList = new Array(CTRL_BITMAP_COUNT);
		for (var i=0; i<CTRL_TYPE_COUNT; ++i) {
			Manager.ctrlImageList[i*4] = document.getElementById("N-"+(i+1)+"-0");
			Manager.ctrlImageList[i*4+1] = document.getElementById("N-"+(i+2)+"-1");
			Manager.ctrlImageList[i*4+2] = document.getElementById("N-"+(i+3)+"-2");
			Manager.ctrlImageList[i*4+3] = document.getElementById("N-"+(i+4)+"-3");
		}
		for (var i=0; i<CTRL_TYPE_COUNT; ++i) {
			Manager.ctrlImageList[CTRL_TYPE_COUNT*4 + i*4] = document.getElementById("S-"+(i+1)+"-0");
			Manager.ctrlImageList[CTRL_TYPE_COUNT*4 + i*4+1] = document.getElementById("S-"+(i+2)+"-1");
			Manager.ctrlImageList[CTRL_TYPE_COUNT*4 + i*4+2] = document.getElementById("S-"+(i+3)+"-2");
			Manager.ctrlImageList[CTRL_TYPE_COUNT*4 + i*4+3] = document.getElementById("S-"+(i+4)+"-3");
		}
		for (var i=0; i<CTRL_BITMAP_COUNT; ++i) {
			if (Manager.ctrlImageList[i]) {
				Manager.ctx.drawImage(Manager.ctrlImageList[i], 0,0);
				Manager.ctrlImageList[i] = Manager.ctx.getImageData(0,0, CTRL_SIZE.cx,CTRL_SIZE.cy);
			}
		}
		Manager.ctx.fillStyle = "#FFFFFF";
		Manager.ctx.fillRect(0,0, CTRL_SIZE.cx,CTRL_SIZE.cy);
	},
	
	Init: function(canvas) {
		//窗口显示-------------------------------------------------------
		Manager.canvas = canvas;
		Manager.ctx = Manager.canvas.getContext("2d");

		//Manager.bitmapForRefresh.CreateBitmap(1, 1, 1, 32, null);	//使刷新不闪而使用的bitmap
		//Manager.dcForRefresh.CreateCompatibleDC(ctx);				//使刷新不闪而使用的DC
		//Manager.dcForRefresh.SelectObject(bitmapForRefresh);


		//相对变量-------------------------------------------------------
		Manager.viewOrig = {x:0, y:0};				//视角初始坐标
		Manager.mouseWheelSense = {cx:32, cy:32};	//mouseWheel的灵活度
		Manager.moveBodySense = 3;					//按上下左右键物体一次移动的距离
		Manager.maxLeaveOutDis = 7;					//导线合并最大距离


		//电路元件变量---------------------------------------------------
		Manager.crun = new Array();
		Manager.ctrl = new Array();
		Manager.lead = new Array();


		//鼠标点击信息记录-----------------------------------------------
		Manager.motiCount = 0;
		Manager.addState = BODY_NO;
		Manager.lButtonDownPos = {x:-100, y:-100};
		Manager.lButtonDownState = false;
		Manager.isUpRecvAfterDown = true;
		//Manager.FocusBodyClear(null);


		//画图变量-------------------------------------------------------
		Manager.textColor = COLOR_NORMAL;				//默认字体颜色
		Manager.focusLeadStyle = SOLID_SPECIAL_COLOR;	//默认焦点导线样式
		Manager.focusCrunColor = COLOR_FOCUS;			//默认焦点结点颜色
		Manager.focusCtrlColor = COLOR_FOCUS;			//默认焦点控件颜色
		Manager.InitBitmap();							//初始化位图

		//鼠标图标
		/*HINSTANCE hinst = AfxGetInstanceHandle();
		Manager.hcSizeNS		= LoadCursor(null,	IDC_SIZENS);
		Manager.hcSizeWE		= LoadCursor(null,	IDC_SIZEWE);
		Manager.hcShowConnect	= LoadCursor(hinst,	MAKEINTRESOURCE(IDC_CURSOR_SHOWCONNECT));
		Manager.hcHand			= LoadCursor(hinst,	MAKEINTRESOURCE(IDC_CURSOR_HAND));
		Manager.hcMoveHorz		= LoadCursor(hinst,	MAKEINTRESOURCE(IDC_CURSOR_HORZ_LEAD));
		Manager.hcMoveVert		= LoadCursor(hinst,	MAKEINTRESOURCE(IDC_CURSOR_VERT_LEAD));
		Manager.hcAddCrun		= LoadCursor(hinst,	MAKEINTRESOURCE(IDC_CURSOR_ADDCRUN));*/


		//读取文件-------------------------------------------------------
		Manager.fileName = "";
	}

};
