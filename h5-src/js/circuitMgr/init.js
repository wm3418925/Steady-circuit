
var CTRL_BITMAP_COUNT = CTRL_TYPE_COUNT*8;	//控件位图的个数(包括旋转之后的)

function setImageDataWhiteColor(data, startIndex) {
	data[startIndex] = 255;
	data[startIndex+1] = 255;
	data[startIndex+2] = 255;
}

//1初始化和清理函数------------------------------------------------------------
var Manager = {

	// 初始化连接点位图
	CreateShowConnectImageData: function() {
		var len = 16*9;
		var imgData = Manager.ctx.createImageData(6,6);
		var data = imgData.data;
		
		for (var i=0; i<len; ++i) {
			data[i]=255;
		}

		return imgData;
	},
	
	// 以指定颜色初始化一个节点
	CreateCrunImageDataWithColor: function(colorHex) {
		var r = PaintCommonFunc.RedOfHexRGB(colorHex);
		var g = PaintCommonFunc.GreenOfHexRGB(colorHex);
		var b = PaintCommonFunc.BlueOfHexRGB(colorHex);
		
		var len = 16*DD*DD;
		var imgData = Manager.ctx.createImageData(2*DD,2*DD);
		var data = imgData.data;
		
		for (var i=0; i<len; i+=4) {
			data[i]=r;
			data[i+1]=g;
			data[i+2]=b;
			data[i+3]=255;
		}
		//data[3]=data[7]=data[DD*8-5]=data[DD*8-1]=data[DD*8+3]=data[DD*16-1]=0;
		//data[len-1]=data[len-5]=data[len-DD*8+7]=data[len-DD*8+3]=data[len-DD*8-1]=data[len-DD*16+3]=0;
		
		setImageDataWhiteColor(data, 0);
		setImageDataWhiteColor(data, 4);
		setImageDataWhiteColor(data, DD*8-8);
		setImageDataWhiteColor(data, DD*8-4);
		setImageDataWhiteColor(data, DD*8);
		setImageDataWhiteColor(data, DD*16-4);
		
		setImageDataWhiteColor(data, len-4);
		setImageDataWhiteColor(data, len-8);
		setImageDataWhiteColor(data, len-DD*8+4);
		setImageDataWhiteColor(data, len-DD*8);
		setImageDataWhiteColor(data, len-DD*8-4);
		setImageDataWhiteColor(data, len-DD*16);
		return imgData;
	},
	// 初始化用于异或画图的节点
	CreateCrunXorImageData: function() {
		var len = 16*DD*DD;
		var imgData = Manager.ctx.createImageData(2*DD,2*DD);
		var data = imgData.data;
		
		for (var i=0; i<len; ++i) {
			data[i]=255;
		}
		data[3]=data[7]=data[DD*8-5]=data[DD*8-1]=data[DD*8+3]=data[DD*16-1]=0;
		data[len-1]=data[len-5]=data[len-DD*8+7]=data[len-DD*8+3]=data[len-DD*8-1]=data[len-DD*16+3]=0;
		return imgData;
	},
	// 初始化所有节点位图
	CreateAllCrunImageData: function() {
		var crunImageData = new Array(PAINT_CRUN_STYLE_COUNT);
		crunImageData[PAINT_CRUN_STYLE_NORMAL] = Manager.CreateCrunImageDataWithColor(COLOR_NORMAL);
		crunImageData[PAINT_CRUN_STYLE_FOCUS] = Manager.CreateCrunImageDataWithColor(COLOR_FOCUS);
		crunImageData[PAINT_CRUN_STYLE_SPECIAL] = Manager.CreateCrunImageDataWithColor(COLOR_SPECIAL);
		
		Manager.crunImageData = crunImageData;
		
		Manager.crunXorImageData = Manager.CreateCrunXorImageData();
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
			var iMuti4 = i*4, iPlus1 = i+1;
			Manager.ctrlImageList[iMuti4] = document.getElementById("N-"+iPlus1+"-0");
			Manager.ctrlImageList[iMuti4+1] = document.getElementById("N-"+iPlus1+"-1");
			Manager.ctrlImageList[iMuti4+2] = document.getElementById("N-"+iPlus1+"-2");
			Manager.ctrlImageList[iMuti4+3] = document.getElementById("N-"+iPlus1+"-3");
		}
		for (var i=0; i<CTRL_TYPE_COUNT; ++i) {
			var iMuti4 = i*4, iPlus1 = i+1;
			Manager.ctrlImageList[CTRL_TYPE_COUNT*4 + iMuti4] = document.getElementById("S-"+iPlus1+"-0");
			Manager.ctrlImageList[CTRL_TYPE_COUNT*4 + iMuti4+1] = document.getElementById("S-"+iPlus1+"-1");
			Manager.ctrlImageList[CTRL_TYPE_COUNT*4 + iMuti4+2] = document.getElementById("S-"+iPlus1+"-2");
			Manager.ctrlImageList[CTRL_TYPE_COUNT*4 + iMuti4+3] = document.getElementById("S-"+iPlus1+"-3");
		}
		for (var i=0; i<CTRL_BITMAP_COUNT; ++i) {
			if (Manager.ctrlImageList[i]) {
				Manager.ctx.drawImage(Manager.ctrlImageList[i], 0,0);
				Manager.ctrlImageList[i] = Manager.ctx.getImageData(0,0, CTRL_SIZE.cx,CTRL_SIZE.cy);
			}
		}
		
		// 显示电压 , 移动方向图
		Manager.moveDirImageList = new Array(4);
		for (var i=0; i<4; ++i) {
			var img = document.getElementById("img-move-dir-"+i);
			var width = parseInt(img.style.width);
			var height = parseInt(img.style.height);
			
			Manager.ctx.drawImage(img, 0,0);
			Manager.moveDirImageList[i] = Manager.ctx.getImageData(0,0, width,height);
		}
	},
	
	Init: function(canvas) {
		//窗口显示-------------------------------------------------------
		Manager.canvas = canvas;
		Manager.ctx = Manager.canvas.getContext("2d");

		//Manager.bitmapForRefresh.CreateBitmap(1, 1, 1, 32, null);	//使刷新不闪而使用的bitmap
		//Manager.dcForRefresh.CreateCompatibleDC(Manager.ctx);				//使刷新不闪而使用的DC
		//Manager.dcForRefresh.SelectObject(bitmapForRefresh);


		//相对变量-------------------------------------------------------
		Manager.mouseWheelSense = {cx:32, cy:32};	//mouseWheel的灵活度
		Manager.moveBodySense = 3;					//按上下左右键物体一次移动的距离
		Manager.maxLeaveOutDis = 7;					//导线合并最大距离


		//电路元件变量---------------------------------------------------
		Manager.crun = new Array();
		Manager.ctrl = new Array();
		Manager.lead = new Array();


		//鼠标点击信息记录-----------------------------------------------
		Manager.motiBody = GenrateArrayWithElementInitFunc(Pointer.CreateNew, 2);
		Manager.motiCount = 0;
		Manager.addState = BODY_NO;
		Manager.lButtonDownPos = {x:-100, y:-100};
		Manager.lastMoveOnBody = Pointer.CreateNew();
		Manager.lButtonDownState = false;
		Manager.isUpRecvAfterDown = true;
		Manager.focusBody = Pointer.CreateNew();
		Manager.FocusBodyClear(null);


		//画图变量-------------------------------------------------------
		Manager.ctx.font = "15px Georgia";
		Manager.textColor = COLOR_NORMAL;				//默认字体颜色
		Manager.focusLeadStyle = SOLID_SPECIAL_COLOR;	//默认焦点导线样式
		Manager.focusCrunColor = COLOR_FOCUS;			//默认焦点结点颜色
		Manager.focusCtrlColor = COLOR_FOCUS;			//默认焦点控件颜色
		Manager.InitBitmap();							//初始化位图

		
		// 剪切板
		Manager.clipBody = Pointer.CreateNew();
		
		
		//显示电压-------------------------------------------------------
		Manager.pressStartBody = Pointer.CreateNew();
		Manager.pressEndBody = Pointer.CreateNew();
		Manager.startEndPressure = 0;
	}

};
