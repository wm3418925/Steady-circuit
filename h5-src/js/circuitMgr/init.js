
var CTRL_BITMAP_TYPE_NUM = 7;					//控件位图种类的个数
var CTRL_BITMAP_NUM = CTRL_BITMAP_TYPE_NUM*4;	//控件位图的个数(包括旋转之后的)

var FILE_VERSION		= 13;					//文件版本,不同版本文件不予读取
var FILE_RESERVE_SIZE	= 256;					//文件保留域的大小
var MAXMOVEBODYDIS		= 50;					//使用方向键一次移动物体距离范围1~MAX_MOVEBODYDIS
var MAXLEAVEOUTDIS		= 15;					//相邻导线合并距离范围1~MAX_LEAVEOUTDIS



//1初始化和清理函数------------------------------------------------------------
var Manager = {
	//画图变量---------------------------------------------------------------------
	CDC ctrlDcMem[CTRL_BITMAP_NUM];
	CBitmap ctrlBitmap[CTRL_BITMAP_NUM];	//CTRL_BITMAP_NUM个控件位图
	CDC showConnectDcMem;
	CBitmap showConnectBitmap;		//激活点位图
	CDC crunDcMem;
	CBitmap crunBitmap;				//结点位图

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
	CWnd * wndPointer;			//当前窗口指针
	CDC  * dc;					//当前窗口设备描述表
	CDC dcForRefresh;			//使刷新不闪而使用的DC
	CBitmap bitmapForRefresh;	//使刷新不闪而使用的bitmap

	//电路元件变量-----------------------------------------------------------------
	CRUN	* crun[MAXCRUNNUM];	//存储结点
	CTRL	* ctrl[MAXCTRLNUM];	//存储控件
	LEAD	* lead[MAXLEADNUM];	//存储导线
	unsigned short crunNum;		//结点的个数
	unsigned short leadNum;		//控件的个数
	unsigned short ctrlNum;		//导线的个数

	//相对变量---------------------------------------------------------------------
	POINT viewOrig;			//视角初始坐标
	SIZE mouseWheelSense;	//mouseWheel的灵活度
	UINT moveBodySense;		//按上下左右键一次物体移动的距离
	UINT maxLeaveOutDis;	//一段导线,相邻两节合并临界距离

	//鼠标点击信息记录-------------------------------------------------------------
	BODY_TYPE addState;		//记录要添加的物体种类
	unsigned short motiNum;	//记录鼠标激活的部件的个数,LBUTTONDOWN消息激活的
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

	//计算变量---------------------------------------------------------------------
	CRUN2 * crun2;				//CRUN2结构体,个数同 crun 是 crunNum
	CIRCU * circu;				//线路,个数<= crun*2 ,由 circuNum 记录
	CRUNMAP * maps;				//保存所有的线路
	unsigned short circuNum;	//线路个数
	unsigned short groupNum;	//组数,同一组的在一个连通图中,分组建立方程
	Equation ** equation;		//方程处理的类

	//显示电势差变量---------------------------------------------------------------
	Pointer pressStart;			//计算电势差的起始位置,只能指向导线或者节点
	Pointer pressEnd;			//计算电势差的结束位置,只能指向导线或者节点
	double startEndPressure;	//记录pressStart到pressEnd之间的电势差

	//撤销变量
	MyVector circuitVector;		//电路信息容器
	MyIterator vectorPos;		//当前在容器的位置


	CreateNew: function(outWnd) {
		var i;
		
		//窗口显示-------------------------------------------------------
		this.wndPointer = outWnd;		//当前窗口指针
		dc = wndPointer->GetDC();	//当前窗口设备描述表

		bitmapForRefresh.CreateBitmap(1, 1, 1, 32, NULL);	//使刷新不闪而使用的bitmap
		dcForRefresh.CreateCompatibleDC(dc);				//使刷新不闪而使用的DC
		dcForRefresh.SelectObject(&bitmapForRefresh);


		//相对变量-------------------------------------------------------
		viewOrig.x = viewOrig.y = 0;					//视角初始坐标
		mouseWheelSense.cx = mouseWheelSense.cy = 32;	//mouseWheel的灵活度
		moveBodySense = 3;								//按上下左右键物体一次移动的距离
		maxLeaveOutDis = 7;								//导线合并最大距离


		//电路元件变量---------------------------------------------------
		ZeroMemory(crun, sizeof(void *) * MAXCRUNNUM);
		ZeroMemory(ctrl, sizeof(void *) * MAXCTRLNUM);
		ZeroMemory(lead, sizeof(void *) * MAXLEADNUM);
		crunNum = leadNum = ctrlNum = 0;	//物体的个数清零


		//计算变量-------------------------------------------------------
		circu = NULL;		//线路
		circuNum = 0;		//线路个数,小于等于 crun*2
		crun2 = NULL;		//将crun信息提取出来用于计算,个数同crun
		maps = NULL;		//保存所有的线路
		groupNum = 0;		//组数,同一组的在一个连通图中,分组建立方程
		equation = NULL;	//方程处理的类


		//鼠标点击信息记录-----------------------------------------------
		motiNum = 0;
		addState = BODY_NO;
		lButtonDownPos.x = -100;
		lButtonDownState = false;
		isUpRecvAfterDown = true;
		FocusBodyClear(NULL);


		//画图变量-------------------------------------------------------
		textColor = BLACK;						//默认字体颜色
		focusLeadStyle = SOLID_RESERVE_COLOR;	//默认焦点导线样式
		focusCrunColor = GREEN;					//默认焦点结点颜色
		focusCtrlColor = RED;					//默认焦点控件颜色
		InitBitmap();							//初始化位图

		//画笔
		for(i=COLOR_TYPE_NUM-1; i>=0; --i) 
			hp[i].CreatePen(PS_SOLID, 1, LEADCOLOR[i]);

		//鼠标图标
		/*HINSTANCE hinst = AfxGetInstanceHandle();
		hcSizeNS		= LoadCursor(NULL,	IDC_SIZENS);
		hcSizeWE		= LoadCursor(NULL,	IDC_SIZEWE);
		hcShowConnect	= LoadCursor(hinst,	MAKEINTRESOURCE(IDC_CURSOR_SHOWCONNECT));
		hcHand			= LoadCursor(hinst,	MAKEINTRESOURCE(IDC_CURSOR_HAND));
		hcMoveHorz		= LoadCursor(hinst,	MAKEINTRESOURCE(IDC_CURSOR_HORZ_LEAD));
		hcMoveVert		= LoadCursor(hinst,	MAKEINTRESOURCE(IDC_CURSOR_VERT_LEAD));
		hcAddCrun		= LoadCursor(hinst,	MAKEINTRESOURCE(IDC_CURSOR_ADDCRUN));*/


		//读取文件-------------------------------------------------------
		vectorPos = NULL;
		fileName[0] = '\0';
		PutCircuitToVector();	//将当前空电路信息保存到容器
	}

	Manager::~Manager()
	{
		DeleteVector(circuitVector.begin(), circuitVector.end());	//清除容器保存的电路信息

		ClearClipboard();	//清空剪切板

		//清除画图变量
		DeleteObject(hcSizeNS);
		DeleteObject(hcSizeWE);
		DeleteObject(hcShowConnect);
		DeleteObject(hcHand);
		DeleteObject(hcMoveHorz);
		DeleteObject(hcMoveVert);			//清除鼠标图标
		for(int i=COLOR_TYPE_NUM-1; i>=0; --i) hp[i].DeleteObject();	//清除画笔
		UninitBitmap();						//释放位图
		wndPointer->ReleaseDC(dc);			//释放画图DC
		bitmapForRefresh.DeleteObject();	//使刷新不闪而使用的bitmap
		dcForRefresh.DeleteDC();			//使刷新不闪而使用的DC
	}

	void Manager::InitBitmap()
	//初始化位图句柄
	{
		int i, j, k, l;
		UINT * buf1, * buf2, * p;

		//激活点位图------------------------------------
		showConnectDcMem.CreateCompatibleDC(dc);
		showConnectBitmap.LoadBitmap(IDB_SMALLCRUN);
		showConnectDcMem.SelectObject(&showConnectBitmap);

		//节点位图--------------------------------------
		crunDcMem.CreateCompatibleDC(dc);
		crunBitmap.LoadBitmap(IDB_CRUN);
		crunDcMem.SelectObject(&crunBitmap);

		//控件位图,处理得到旋转控件---------------------
		buf1 = (UINT *)malloc(BODYSIZE.cx * BODYSIZE.cy * 4);
		buf2 = (UINT *)malloc(BODYSIZE.cx * BODYSIZE.cy * 4);

		for(k=CTRL_BITMAP_TYPE_NUM-1; k>=0; --k)
		{
			//原位图
			ctrlDcMem[k].CreateCompatibleDC(dc);
			ctrlBitmap[k].LoadBitmap(IDB_SOURCE + k);
			ctrlDcMem[k].SelectObject(ctrlBitmap + k);
			ctrlBitmap[k].GetBitmapBits(BODYSIZE.cx*BODYSIZE.cy*4, buf1);	//获得原位图像素

			//获得旋转位图
			for(l=1; l<4; ++l)
			{
				p = buf1 + (BODYSIZE.cy - 1) * BODYSIZE.cx + BODYSIZE.cx - 1;
				for(i = BODYSIZE.cy - 1; i >= 0; --i) for(j = BODYSIZE.cx - 1; j >= 0; --j)
					* ( buf2 + j * BODYSIZE.cx + BODYSIZE.cx - 1 - i) = * p --;

				i = k + CTRL_BITMAP_TYPE_NUM*l;
				ctrlDcMem[i].CreateCompatibleDC(dc);
				ctrlBitmap[i].CreateBitmap(BODYSIZE.cx, BODYSIZE.cy, 1, 32, buf2);
				ctrlDcMem[i].SelectObject(ctrlBitmap + i);

				p = buf1;
				buf1 = buf2;
				buf2 = p;
			}
		}

		free(buf1);
		free(buf2);
	}

	void Manager::UninitBitmap()
	//释放位图占用空间
	{
		showConnectBitmap.DeleteObject();
		showConnectDcMem.DeleteDC();

		crunBitmap.DeleteObject();
		crunDcMem.DeleteDC();

		for(int i=CTRL_BITMAP_NUM-1; i>=0; --i)
		{
			DeleteObject(ctrlBitmap[i]);
			ctrlDcMem[i].DeleteDC();
		}
	}

};
