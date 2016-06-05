
var CTRL_BITMAP_TYPE_COUNT = CTRL_TYPE_COUNT*2;					//控件位图种类的个数
var CTRL_BITMAP_COUNT = CTRL_BITMAP_TYPE_COUNT*4;	//控件位图的个数(包括旋转之后的)

var FILE_VERSION		= 13;					//文件版本,不同版本文件不予读取
var MAX_MOVE_BODY_DIS	= 50;					//使用方向键一次移动物体距离范围1~MAX_MOVEBODYDIS
var MAX_LEAVE_OUT_DIS	= 15;					//相邻导线合并距离范围1~MAX_LEAVEOUTDIS



//1初始化和清理函数------------------------------------------------------------
var Manager = {
	/*
	//画图变量---------------------------------------------------------------------
	CBitmap Manager.ctrlImageList[CTRL_BITMAP_COUNT];	//CTRL_BITMAP_NUM个控件位图
	CDC showConnectImageData;
	CBitmap showConnectImageData;		//激活点位图
	CDC crunImageData;
	CBitmap crunImageData;				//结点位图

	CPen hp[COLOR_TYPE_NUM];		//COLOR_TYPE_NUM种颜色画笔

	HCURSOR hcSizeNS;				//南北双箭头
	HCURSOR hcSizeWE;				//东西双箭头
	HCURSOR hcShowConnect;			//连接导线时鼠标
	HCURSOR hcHand;					//手
	HCURSOR hcMoveHorz;				//移动竖直导线时显示
	HCURSOR hcMoveVert;				//移动水平导线时显示
	HCURSOR hcAddCrun;				//添加物体时显示

	enum COLOR textColor;			//字体颜色
	enum LEADSTYLE focusLeadStyle;	//焦点导线样式
	enum COLOR focusCrunColor;		//焦点结点颜色
	enum COLOR focusCtrlColor;		//焦点控件颜色

	//窗口显示---------------------------------------------------------------------
	CWnd * canvas;			//当前窗口指针
	CDC  * ctx;					//当前窗口设备描述表
	CDC dcForRefresh;			//使刷新不闪而使用的DC
	CBitmap bitmapForRefresh;	//使刷新不闪而使用的bitmap

	//电路元件变量-----------------------------------------------------------------
	CRUN	* crun[MAX_CRUN_COUNT];	//存储结点
	CTRL	* ctrl[MAX_CTRL_COUNT];	//存储控件
	LEAD	* lead[MAX_LEAD_COUNT];	//存储导线
	unsigned short crunCount;		//结点的个数
	unsigned short leadCount;		//控件的个数
	unsigned short ctrlCount;		//导线的个数

	//相对变量---------------------------------------------------------------------
	POINT viewOrig;			//视角初始坐标
	SIZE mouseWheelSense;	//mouseWheel的灵活度
	UINT moveBodySense;		//按上下左右键一次物体移动的距离
	UINT maxLeaveOutDis;	//一段导线,相邻两节合并临界距离

	//鼠标点击信息记录-------------------------------------------------------------
	BODY_TYPE addState;		//记录要添加的物体种类
	unsigned short motiCount;	//记录鼠标激活的部件的个数,LBUTTONDOWN消息激活的
	Pointer motiBody[2];	//记录鼠标激活的部件
	POINT lButtonDownPos;	//记录上一次鼠标左键按下的坐标
	//上次鼠标是否点击了物体,在LBUTTONDOWN时记录,在LBUTTONUP用于判断
	bool lButtonDownState;
	//记录WM_LBUTTONDOWN后在下一个鼠标WM_LBUTTONDOWN到来前,有没有接受到WM_LBUTTONUP
	bool isUpRecvAfterDown;

	//鼠标移动消息记录-------------------------------------------------------------
	Pointer lastMoveOnBody;	//上一个鼠标激活的部件,MOUSEMOVE消息激活的
	POINT lastMoveOnPos;	//记录上次鼠标移动到的坐标,用于移动物体

	//获得鼠标点击焦点物体---------------------------------------------------------
	Pointer focusBody;		//焦点物体

	//剪切板变量-------------------------------------------------------------------
	Pointer clipBody;		//指向剪切板里物体,它不在当前电路,在另一个内存,需要释放

	//文件保存路径变量-------------------------------------------------------------
	char fileName[256];		//保存当前进行操作的文件路径

	//显示电势差变量---------------------------------------------------------------
	Pointer pressStart;			//计算电势差的起始位置,只能指向导线或者节点
	Pointer pressEnd;			//计算电势差的结束位置,只能指向导线或者节点
	double startEndPressure;	//记录pressStart到pressEnd之间的电势差
*/
	
	// 初始化连接点位图
	CreateShowConnectImageData: function() {
		var len = 16*9;
		var imgData = Manager.ctx.createImageData(6,6);
		
		for (var i=8; i<len; i+=4) {
			imgData.data[i+0]=r;
			imgData.data[i+1]=g;
			imgData.data[i+2]=b;
			imgData.data[i+3]=255;
		}
		imgData.data[3]=imgData.data[7]=imgData.data[19]=imgData.data[23]=imgData.data[27]=imgData.data[47]=0;
		imgData.data[len-1]=imgData.data[len-5]=imgData.data[len-17]=imgData.data[len-21]=imgData.data[len-25]=imgData.data[len-45]=0;
	},
	
	// 以指定颜色初始化一个节点
	CreateCrunImageWithColor: function(r,g,b) {
		var len = 16*DD*DD;
		var imgData = Manager.ctx.createImageData(2*DD,2*DD);
		
		for (var i=8; i<len; i+=4) {
			imgData.data[i+0]=r;
			imgData.data[i+1]=g;
			imgData.data[i+2]=b;
			imgData.data[i+3]=255;
		}
		imgData.data[3]=imgData.data[7]=imgData.data[D*8-5]=imgData.data[D*8-1]=imgData.data[D*8+3]=imgData.data[D*16-1]=0;
		imgData.data[len-1]=imgData.data[len-5]=imgData.data[len-D*8+7]=imgData.data[len-D*8+3]=imgData.data[len-D*8-1]=imgData.data[len-D*16+3]=0;
	},
	// 初始化一个反转颜色节点
	/*CreateInverseCrunImage: function() {
		var len = 16*DD*DD;
		var imgData = Manager.ctx.createImageData(2*DD,2*DD);
		
		imgData.data[0]=imgData.data[1]=imgData.data[2]=imgData.data[3]=255;
		imgData.data[4]=imgData.data[5]=imgData.data[6]=imgData.data[7]=255;
		imgData.data[D*8-8]=imgData.data[D*8-7]=imgData.data[D*8-6]=imgData.data[D*8-5]=255;
		imgData.data[D*8-4]=imgData.data[D*8-3]=imgData.data[D*8-2]=imgData.data[D*8-1]=255;
		imgData.data[D*8]=imgData.data[D*8+1]=imgData.data[D*8+2]=imgData.data[D*8+3]=255;
		imgData.data[D*16-4]=imgData.data[D*16-3]=imgData.data[D*16-2]=imgData.data[D*16-1]=255;
		
		imgData.data[len-4]=imgData.data[len-3]=imgData.data[len-2]=imgData.data[len-1]=255;
		imgData.data[len-8]=imgData.data[len-7]=imgData.data[len-6]=imgData.data[len-5]=255;
		imgData.data[len-D*8+4]=imgData.data[len-D*8+5]=imgData.data[len-D*8+6]=imgData.data[len-D*8+7]=255;
		imgData.data[len-D*8]=imgData.data[len-D*8+1]=imgData.data[len-D*8+2]=imgData.data[len-D*8+3]=255;
		imgData.data[len-D*8-4]=imgData.data[len-D*8-3]=imgData.data[len-D*8-2]=imgData.data[len-D*8-1]=255;
		imgData.data[len-D*16]=imgData.data[len-D*16+1]=imgData.data[len-D*16+2]=imgData.data[len-D*16+3]=255;
	},*/
	// 初始化所有节点位图
	CreateAllCrunImageData: function() {
		var crunImageData = new Array(PAINT_CRUN_STYLE_COUNT);
		crunImageData[PAINT_CRUN_STYLE_NORMAL] = Manager.CreateCrunImageWithColor(0,0,0);
		crunImageData[PAINT_CRUN_STYLE_FOCUS] = Manager.CreateCrunImageWithColor(30,250,30);
		crunImageData[PAINT_CRUN_STYLE_SPECIAL] = Manager.CreateCrunImageWithColor(190,30,100);
		
		Manager.crunImageData = crunImageData;
	},
	
	//初始化位图句柄
	InitBitmap: function() {
		int i, j, k, l;
		UINT * buf1, * buf2, * p;

		//激活点位图------------------------------------
		Manager.showConnectImageData = Manager.CreateShowConnectImageData();

		//节点位图--------------------------------------
		Manager.CreateAllCrunImageData();

		//控件位图,处理得到旋转控件---------------------
		Manager.ctrlImageList = new Array(CTRL_BITMAP_COUNT);
	},
	
	Init: function(canvas) {
		//窗口显示-------------------------------------------------------
		Manager.canvas = canvas;
		Manager.ctx = Manager.canvas.getContext("2d");

		Manager.bitmapForRefresh.CreateBitmap(1, 1, 1, 32, null);	//使刷新不闪而使用的bitmap
		Manager.dcForRefresh.CreateCompatibleDC(ctx);				//使刷新不闪而使用的DC
		Manager.dcForRefresh.SelectObject(&bitmapForRefresh);


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
		Manager.FocusBodyClear(null);


		//画图变量-------------------------------------------------------
		Manager.textColor = BLACK;						//默认字体颜色
		Manager.focusLeadStyle = SOLID_RESERVE_COLOR;	//默认焦点导线样式
		Manager.focusCrunColor = GREEN;					//默认焦点结点颜色
		Manager.focusCtrlColor = RED;					//默认焦点控件颜色
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
