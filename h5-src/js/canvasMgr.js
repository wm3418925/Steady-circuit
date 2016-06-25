
BEGIN_MESSAGE_MAP(CMyDlg, CDialog)
	ON_COMMAND_RANGE(IDM_ADD_CRUNODE, IDM_ADD_SWITCH, OnSetAddState)
	ON_COMMAND_RANGE(IDM_POSBODY_ROTATE1, IDM_POSBODY_ROTATE3, OnPosBodyRotateCtrl)
	ON_COMMAND_RANGE(IDM_FOCUSBODY_ROTATE1, IDM_FOCUSBODY_ROTATE3, OnFocusBodyRotateCtrl)
	//{{AFX_MSG_MAP(CMyDlg)
	ON_WM_CLOSE()
	ON_WM_DESTROY()
	ON_WM_SYSCOMMAND()
	ON_WM_PAINT()
	ON_WM_HELPINFO()
	ON_WM_QUERYDRAGICON()
	ON_COMMAND(IDM_ABOUT, OnAbout)


	ON_WM_LBUTTONDOWN()
	ON_WM_MOUSEMOVE()
	ON_WM_LBUTTONUP()
	ON_WM_LBUTTONDBLCLK()
	ON_WM_RBUTTONUP()
	ON_WM_KILLFOCUS()
	ON_WM_SETFOCUS()
	ON_WM_VSCROLL()
	ON_WM_HSCROLL()
	ON_WM_MOUSEWHEEL()
	ON_WM_KEYDOWN()
	ON_WM_KEYUP()


	ON_COMMAND(IDM_FILE_NEW, OnFileNew)
	ON_COMMAND(IDM_FILE_OPEN, OnFileOpen)
	ON_COMMAND(IDM_FILE_SAVE, OnFileSave)
	ON_COMMAND(IDM_FILE_SAVE_AS, OnFileSaveAs)
	ON_COMMAND(IDM_SAVEASPIC, OnSaveAsPicture)
	ON_COMMAND(IDM_EXIT, OnExit)
	ON_WM_DROPFILES()


	ON_COMMAND(IDM_FOCUSBODY_CUT, OnFocusBodyCut)
	ON_COMMAND(IDM_FOCUSBODY_COPY, OnFocusBodyCopy)
	ON_COMMAND(IDM_FOCUSBODY_DELETE, OnFocusBodyDelete)
	ON_COMMAND(IDM_UNDO, OnUnDo)
	ON_COMMAND(IDM_REDO, OnReDo)
	ON_COMMAND(IDM_FOCUSBODY_PROPERTY, OnFocusBodyProperty)
	ON_COMMAND(IDM_FOCUSBODY_CHANGECTRLSTYLE, OnFocusBodyChangeCtrlStyle)
	ON_COMMAND(IDM_FOCUSBODY_SHOWELEC, OnFocusBodyShowElec)
	ON_COMMAND(IDM_SEARCH, OnSearch)


	ON_COMMAND(IDM_SETMOVEBODYSENSE, OnSetMoveBodySense)
	ON_COMMAND(IDM_SETLEAVEOUTDIS, OnSetLeaveOutDis)
	ON_COMMAND(IDM_SETTEXTCOLOR, OnSetTextColor)
	ON_COMMAND(IDM_SETFOCUSLEADSTYLE, OnSetFocusLeadStyle)
	ON_COMMAND(IDM_SETFOCUSCRUNCOLOR, OnSetFocusCrunColor)
	ON_COMMAND(IDM_SETFOCUSCTRLCOLOR, OnSetFocusCtrlColor)


	ON_COMMAND(IDM_SAVETOTEXTFILE, OnSaveTextFile)
	ON_COMMAND(IDM_MAKEMAP, OnMakeMap)


	ON_COMMAND(IDM_COUNTI, OnCountElec)
	ON_COMMAND(IDM_SHOWPRESSURE, OnShowPressure)
	ON_COMMAND(IDM_POSBODY_SHOWELEC, OnPosBodyShowElec)
	ON_COMMAND(IDM_RELEASE, OnUnLock)


	ON_COMMAND(IDM_POSBODY_COPY, OnPosBodyCopy)
	ON_COMMAND(IDM_POSBODY_CUT, OnPosBodyCut)
	ON_COMMAND(IDM_POSBODY_DELETE, OnPosBodyDelete)
	ON_COMMAND(IDM_PASTE, OnPaste)
	ON_COMMAND(IDM_DELETELEAD, OnDeleteLead)
	ON_COMMAND(IDM_POSBODY_PROPERTY, OnPosBodyProperty)
	ON_COMMAND(IDM_POSBODY_CHANGECTRLSTYLE, OnPosBodyChangeCtrlStyle)

	//}}AFX_MSG_MAP
END_MESSAGE_MAP()

// ///////////////////////////////////////////////////////////////////////////
//  private function

// 输入上锁
CanvasMgr.LockInput = function() {
	CanvasMgr.m_inputLock = true;

	//需要屏蔽的菜单
	CanvasMgr.m_hm.EnableMenuItem(0					, MF_GRAYED|MF_BYPOSITION);	//文件函数
	CanvasMgr.m_hm.EnableMenuItem(1					, MF_GRAYED|MF_BYPOSITION);	//编辑函数
	CanvasMgr.m_hm.EnableMenuItem(3					, MF_GRAYED|MF_BYPOSITION);	//测试函数
	CanvasMgr.m_hm.EnableMenuItem(IDM_COUNTI			, MF_GRAYED);

	//需要激活的菜单
	CanvasMgr.m_hm.EnableMenuItem(IDM_RELEASE		, MF_ENABLED);
	CanvasMgr.m_hm.EnableMenuItem(IDM_SHOWPRESSURE	, MF_ENABLED);

	CanvasMgr.DrawMenuBar();	//重绘菜单栏
};

// 获得当前屏幕大小的一页
CanvasMgr.GetPageSize = function(int nBar) {
	RECT rect;
	int range;
	GetWindowRect(&rect);

	if (SB_HORZ == nBar) {
		range = rect.right - rect.left;
		range -= 5 + 20;
	} else {	//if (SB_VERT == nBar)
		range = rect.bottom - rect.top;
		range -= 48 + 20;
	}
	range >>= 5;

	return range;
};

// 使用快捷键粘贴
CanvasMgr.PasteByHotKey = function() {
	if (CanvasMgr.m_inputLock) return;

	RECT rect;
	POINT mousePos;

	//获得合理坐标
	GetWindowRect(&rect);
	rect.right -= rect.left + 50;	//去除右边边框
	rect.bottom -= rect.top + 100;	//去除下边边框
	GetCursorPos(&mousePos);
	ScreenToClient(&mousePos);
	if (mousePos.x < 0) mousePos.x = 0;
	if (mousePos.y < 0) mousePos.y = 0;
	if (mousePos.x > rect.right) mousePos.x = rect.right;
	if (mousePos.y > rect.bottom) mousePos.y = rect.bottom;

	CanvasMgr.m_c.PasteBody(mousePos);
};

// 设置窗口标题
CanvasMgr.SetWindowText = function() {
	char title[256];
	const char * filePath = CanvasMgr.m_c.GetFilePath();

	if (NULL == filePath || '\0' == filePath[0]) {
		strcpy(title, "新电路文件");
		strcat(title, FILE_EXTENT_DOT);
	} else {
		strcpy(title, filePath);
	}
	strcat(title, " - 稳恒电路");

	CDialog::SetWindowText(title);
};

// 关闭文件前用户选择保存当前文件
CanvasMgr.SaveFileBeforeClose = function(const char * caption, bool hasCancelButton) {
	const char * filePath = CanvasMgr.m_c.GetFilePath();
	char note[256];
	int ret;

	if (NULL == filePath || filePath[0] == '\0') {
		strcpy(note, "保存文件吗 ?");
	} else {
		strcpy(note, "电路保存到文件 :\n\t");
		strcat(note, filePath);
		strcat(note, "\n吗 ?");
	}

	if (hasCancelButton)
		ret = MessageBox(note, caption, MB_YESNOCANCEL|MB_ICONASTERISK);
	else
		ret = MessageBox(note, caption, MB_YESNO|MB_ICONASTERISK);

	if (IDCANCEL == ret) return false;
	if (IDYES == ret) OnFileSave();
	return true;
};


// ///////////////////////////////////////////////////////////////////////////
//  CMyDlg message handlers
CanvasMgr.OnInitDialog = function() {
	CDialog::OnInitDialog();
	SetIcon(CanvasMgr.m_hIcon, TRUE);			// Set big icon
	SetIcon(CanvasMgr.m_hIcon, FALSE);		// Set small icon

	// 初始化 /////////////////////////////////////////
	//成员变量赋值
	CanvasMgr.m_focusFlag = true;				//窗口获得焦点标志
	CanvasMgr.m_inputLock = false;			//初始输入不上锁
	CanvasMgr.m_hm = GetMenu();				//获取主菜单句柄
	CanvasMgr.m_c = new class Manager(this);	//初始化电路控制类

	//设置滚动条范围
	SetScrollRange(SB_HORZ, 0, 50);	//水平
	SetScrollRange(SB_VERT, 0, 30);	//竖直

	//获得打开文件路径
	CCommandLineInfo cmdInfo;
	theApp.ParseCommandLine(cmdInfo);
	const char * filePath = cmdInfo.CanvasMgr.m_strFileName.GetBuffer(0);

	//打开文件
	UINT length = strlen(filePath);
	if (length >= 5 && 0 == strcmp(FILE_EXTENT_DOT, filePath + length - 4)) {
		CanvasMgr.m_c.ReadFile(filePath);
	}

	//设置窗口标题
	CanvasMgr.SetWindowText();

	return TRUE;
};

// 关闭
CanvasMgr.OnClose = function() {
	ASSERT(CanvasMgr.m_c != NULL);

	if (!CanvasMgr.SaveFileBeforeClose("关闭前", true)) return;

	delete CanvasMgr.m_c;
	CanvasMgr.m_c = NULL;

	CDialog::OnClose();
};

// 强制退出
CanvasMgr.OnDestroy = function() {
	CDialog::OnDestroy();

	if (CanvasMgr.m_c != NULL) {
		CanvasMgr.SaveFileBeforeClose("稳恒电路", false);

		delete CanvasMgr.m_c;
		CanvasMgr.m_c = NULL;
	}
};

CanvasMgr.PreTranslateMessage = function(MSG * pMsg) {
	if (pMsg.message == WM_KEYDOWN) {         
        switch(pMsg.wParam) {
		case VK_RETURN:
        case VK_ESCAPE:
			PostMessage(WM_CLOSE);
			return TRUE;
		}
	}

	return CDialog::PreTranslateMessage(pMsg);
};

CanvasMgr.OnSysCommand = function(UINT nID, LPARAM lParam) {
	if ((nID & 0xFFF0) == IDM_ABOUTBOX) {
		CAboutDlg dlgAbout;
		dlgAbout.DoModal();
	} else {
		CDialog::OnSysCommand(nID, lParam);
	}
};

CanvasMgr.OnPaint = function() {
	if (IsIconic()) {
		CPaintDC dc(this); // device context for painting

		SendMessage(WM_ICONERASEBKGND, (WPARAM) dc.GetSafeHdc(), 0);

		// Center icon in client rectangle
		int cxIcon = GetSystemMetrics(SM_CXICON);
		int cyIcon = GetSystemMetrics(SM_CYICON);
		CRect rect;
		GetClientRect(&rect);
		int x = (rect.Width() - cxIcon + 1) / 2;
		int y = (rect.Height() - cyIcon + 1) / 2;

		// Draw the icon
		dc.DrawIcon(x, y, CanvasMgr.m_hIcon);
	} else {
		CDialog::OnPaint();
		CanvasMgr.m_c.PaintAll();	//画电路物体
	}
};

CanvasMgr.OnHelpInfo = function(HELPINFO * pHelpInfo) {
	if (pHelpInfo.iContextType == HELPINFO_MENUITEM) {
		char str[256];
		if (0 != LoadString(AfxGetInstanceHandle(), pHelpInfo.iCtrlId, str, 256))
			MessageBox(str, "菜单帮助信息");
	} else {
		RECT rect;
		POINT pos = pHelpInfo.MousePos;
		ScreenToClient(&pos);
		GetClientRect(&rect);

		if (pos.x>=0 && pos.x<rect.right && pos.y>=0 && pos.y<rect.bottom)
			CanvasMgr.m_c.Help(pos);
	}

	return true;
};

// 关于
CanvasMgr.OnAbout = function() {
	PostMessage(WM_SYSCOMMAND, IDM_ABOUTBOX);
};


//  其他常见消息的处理函数-------------------------------------------------↓

// 鼠标左键按下消息处理
CanvasMgr.OnLButtonDown = function(UINT, CPoint point) {
	if (CanvasMgr.m_inputLock) return;
	CanvasMgr.m_c.AddBody(point);
	if (CanvasMgr.m_c.LButtonDown(point)) CanvasMgr.m_c.PaintAll();
};

// 鼠标移动,失去焦点不判断
CanvasMgr.OnMouseMove = function(UINT nFlags, CPoint point) {
	if (CanvasMgr.m_inputLock || !CanvasMgr.m_focusFlag) return;
	CanvasMgr.m_c.MouseMove(point, nFlags&MK_LBUTTON);
	CDialog::OnMouseMove(nFlags, point);
};

// 鼠标左键按起消息处理
CanvasMgr.OnLButtonUp = function(UINT, CPoint point) {
	if (CanvasMgr.m_inputLock)
		CanvasMgr.m_c.SetStartBody(point);
	else if (CanvasMgr.m_c.LButtonUp(point)) 
		CanvasMgr.m_c.PaintAll();
};

// 双击鼠标左键
CanvasMgr.OnLButtonDblClk = function(UINT, CPoint point) {
	FOCUS_OR_POS body;
	body.isFocusBody = false;
	body.pos = point;

	if (CanvasMgr.m_inputLock) {	//显示电流或电势差
		if (CanvasMgr.m_c.ShowBodyElec(body))
			CanvasMgr.m_c.PaintAll();
		else
			CanvasMgr.m_c.ShowPressure();
	} else {			//显示物体属性
		CanvasMgr.m_c.Property(body, false);
		CanvasMgr.m_c.PaintAll();
	}
};

// 鼠标右键按起消息处理
CanvasMgr.OnRButtonUp = function(UINT, CPoint point) {
	HMENU hm;
	BODY_TYPE type;
	CanvasMgr.m_mousePos = point;	//保存当前鼠标坐标

	CanvasMgr.m_c.PaintAll();	//刷新
	type = CanvasMgr.m_c.PosBodyPaintRect(point);	//突出右击物体

	if (CanvasMgr.m_inputLock) {		//输入上锁
		hm = CreatePopupMenu();

		if (BODY_LEAD == type) {				//右击导线
			AppendMenu(hm, 0, IDM_POSBODY_SHOWELEC, "查看电流(&L)\tCtrl+L");
		} else if (BODY_CRUN == type) {			//右击结点
			AppendMenu(hm, 0, IDM_POSBODY_PROPERTY, "查看属性(&P)\tCtrl+P");
		} else if (Pointer::IsCtrl(type)) {		//右击控件
			AppendMenu(hm, 0, IDM_POSBODY_SHOWELEC, "查看电流(&L)\tCtrl+L");
			AppendMenu(hm, 0, IDM_POSBODY_PROPERTY, "查看属性(&P)\tCtrl+P");
		}

		AppendMenu(hm, 0, IDM_RELEASE, "解除输入限制(&R)\tCtrl+R");
		AppendMenu(hm, 0, IDM_SHOWPRESSURE, "显示电势差(&U)\tCtrl+U");
		ClientToScreen(&point);
		TrackPopupMenu(hm, TPM_LEFTALIGN, point.x, point.y, 0, CanvasMgr.m_hWnd, NULL);
		DestroyMenu(hm);
	} else if (BODY_NO == type) {	//右击空白处
		hm = LoadMenu(AfxGetInstanceHandle(), MAKEINTRESOURCE(IDR_MAINFRAME));
		HMENU temp_hm = GetSubMenu(hm, 1);
		HMENU subhm = GetSubMenu(temp_hm, 3);
		AppendMenu(subhm, 0, IDM_PASTE, "粘贴(&P)\tCtrl+V");
		if (!CanvasMgr.m_c.GetClipboardState())	//剪切板没有物体
			EnableMenuItem(subhm, IDM_PASTE, MF_GRAYED);

		ClientToScreen(&point);
		TrackPopupMenu(subhm, TPM_LEFTALIGN, point.x, point.y, 0, CanvasMgr.m_hWnd, NULL);
		DestroyMenu(hm);
		DestroyMenu(temp_hm);
		DestroyMenu(subhm);
	} else {
		HMENU subhm;
		if (BODY_LEAD == type)	//导线
			hm = LoadMenu(AfxGetInstanceHandle(), MAKEINTRESOURCE(IDR_LEADPRO));
		else
			hm = LoadMenu(AfxGetInstanceHandle(), MAKEINTRESOURCE(IDR_BODYPRO));
		subhm = GetSubMenu(hm, 0);

		if (Pointer::IsCtrl(type)) {
			InsertMenu(subhm, IDM_POSBODY_PROPERTY, 0, IDM_POSBODY_ROTATE1, "顺时针旋转90°(&1)\tCtrl+1");
			InsertMenu(subhm, IDM_POSBODY_PROPERTY, 0, IDM_POSBODY_ROTATE2, "旋转180°(&2)\tCtrl+2");
			InsertMenu(subhm, IDM_POSBODY_PROPERTY, 0, IDM_POSBODY_ROTATE3, "逆时针旋转90°(&3)\tCtrl+3");

			InsertMenu(subhm, IDM_POSBODY_PROPERTY, 0, IDM_POSBODY_CHANGECTRLSTYLE, "电学元件类型(&T)\tCtrl+T");
		}

		if (BODY_LEAD == type || Pointer::IsCtrl(type))	//导线或控件上
			AppendMenu(subhm, 0, IDM_POSBODY_SHOWELEC, "查看电流(&L)\tCtrl+L");

		ClientToScreen(&point);
		TrackPopupMenu(subhm, TPM_LEFTALIGN, point.x, point.y, 0, CanvasMgr.m_hWnd, NULL);
		DestroyMenu(hm);
		DestroyMenu(subhm);
	}

	CanvasMgr.m_c.PaintAll();	//刷新
};

// 窗口失去焦点
CanvasMgr.OnKillFocus = function(CWnd *) {
	CanvasMgr.m_focusFlag = false;
};

// 窗口获得焦点
CanvasMgr.OnSetFocus = function(CWnd *) {
	CanvasMgr.m_focusFlag = true;
};

// 竖直滚动条消息处理
CanvasMgr.OnVScroll = function(UINT nSBCode, UINT nPos, CScrollBar * pScrollBar) {
	const int oldPos = GetScrollPos(SB_VERT);	//记录开始的滚动条位置
	int minPos, maxPos;	//滚动条范围
	int newPos;			//滚动条新的位置
	GetScrollRange(SB_VERT, &minPos, &maxPos);

	switch(nSBCode) {
	case SB_TOP:
		newPos = minPos;
		break;
	case SB_BOTTOM:
		newPos = maxPos;
		break;
	case SB_LINEUP:
		newPos = oldPos - 1;
		break;
	case SB_LINEDOWN:
		newPos = oldPos + 1;
		break;
	case SB_PAGEUP:
		newPos = oldPos - CanvasMgr.GetPageSize(SB_VERT);
		break;
	case SB_PAGEDOWN:
		newPos = oldPos + CanvasMgr.GetPageSize(SB_VERT);
		break;
	case SB_THUMBTRACK:
	case SB_THUMBPOSITION:
		newPos = nPos;
		break;
	default:
		return;
	}

	if (newPos < minPos)newPos = minPos;
	if (newPos > maxPos)newPos = maxPos;

	if (newPos != oldPos) {	//改变了
		SetScrollPos(SB_VERT, newPos);
		CanvasMgr.m_c.SetViewOrig(GetScrollPos(SB_HORZ), GetScrollPos(SB_VERT));
		CanvasMgr.m_c.PaintAll();
	}

	CDialog::OnVScroll(nSBCode, nPos, pScrollBar);
};

// 水平滚动条消息处理
CanvasMgr.OnHScroll = function(UINT nSBCode, UINT nPos, CScrollBar * pScrollBar) {
	const int oldPos = GetScrollPos(SB_HORZ);	//记录开始的滚动条位置
	int minPos, maxPos;	//滚动条范围
	int newPos;			//滚动条新的位置
	GetScrollRange(SB_HORZ, &minPos, &maxPos);

	switch(nSBCode) {
	case SB_LEFT:
		newPos = minPos;
		break;
	case SB_RIGHT:
		newPos = maxPos;
		break;
	case SB_LINELEFT:
		newPos = oldPos - 1;
		break;
	case SB_LINERIGHT:
		newPos = oldPos + 1;
		break;
	case SB_PAGELEFT:
		newPos = oldPos - CanvasMgr.GetPageSize(SB_HORZ);
		break;
	case SB_PAGERIGHT:
		newPos = oldPos + CanvasMgr.GetPageSize(SB_HORZ);
		break;
	case SB_THUMBTRACK:
	case SB_THUMBPOSITION:
		newPos = nPos;
		break;
	default:
		return;
	}

	if (newPos < minPos) newPos = minPos;
	if (newPos > maxPos) newPos = maxPos;

	if (newPos != oldPos) {	//改变了
		SetScrollPos(SB_HORZ, newPos);
		CanvasMgr.m_c.SetViewOrig(GetScrollPos(SB_HORZ), GetScrollPos(SB_VERT));
		CanvasMgr.m_c.PaintAll();
	}

	CDialog::OnHScroll(nSBCode, nPos, pScrollBar);
};

// 鼠标滚动条消息处理
CanvasMgr.OnMouseWheel = function(UINT nFlags, short zDelta, CPoint pt) {
	int vPos = GetScrollPos(SB_VERT);
	int hPos = GetScrollPos(SB_HORZ);	//记录开始的滚动条位置
	int temp;

	if (nFlags) {	//有键按下,对水平滚动条操作
		SetScrollPos(SB_HORZ, hPos-zDelta/WHEEL_DELTA);
		temp = GetScrollPos(SB_HORZ);
		if (hPos != temp)	//改变了
		{
			CanvasMgr.m_c.SetViewOrig(temp, vPos);
			CanvasMgr.m_c.PaintAll();
		}
	} else {	//无键按下,对竖直滚动条操作
		SetScrollPos(SB_VERT, vPos-zDelta/WHEEL_DELTA);
		temp = GetScrollPos(SB_VERT);
		if (vPos != temp) {	//改变了
			CanvasMgr.m_c.SetViewOrig(hPos, temp);
			CanvasMgr.m_c.PaintAll();
		}
	}

	return CDialog::OnMouseWheel(nFlags, zDelta, pt);
};

// key down
CanvasMgr.OnKeyDown = function(UINT nChar, UINT nRepCnt, UINT nFlags) {
	//左或右ctrl键被按下
	if (StaticClass::IsCtrlDown()) {
		switch(nChar) {
		//文件功能快捷键
		case 'N':	//新建文件
			CanvasMgr.OnFileNew();
			return;

		case 'O':	//打开文件
			CanvasMgr.OnFileOpen();
			return;

		case 'S':	//保存文件
			CanvasMgr.OnFileSave();
			return;

		//编辑功能快捷键
		case 'X':	//剪切焦点
			CanvasMgr.OnFocusBodyCut();
			return;

		case 'C':	//复制焦点
			CanvasMgr.OnFocusBodyCopy();
			return;

		case 'V':	//使用快捷键粘贴
			CanvasMgr.PasteByHotKey();
			return;

		case 'Z':	//撤销
			CanvasMgr.OnUnDo();
			return;

		case 'Y':	//前进
			CanvasMgr.OnReDo();
			return;

		case 'P':	//属性
			CanvasMgr.OnFocusBodyProperty();
			return;

		case 'T':	//电学元件类型
			CanvasMgr.OnFocusBodyChangeCtrlStyle();
			return;

		case '1':
		case '2':
		case '3':	//旋转电学元件
			CanvasMgr.OnFocusBodyRotateCtrl(nChar - '1' + IDM_FOCUSBODY_ROTATE1);
			return;

		case 'F':
			CanvasMgr.OnSearch();
			return;

		//计算功能快捷键
		case 'I':	//计算电流
			CanvasMgr.OnCountElec();
			return;

		case 'L':	//显示焦点电流
			CanvasMgr.OnFocusBodyShowElec();
			return;

		case 'U':	//显示电势差
			CanvasMgr.OnShowPressure();
			return;

		case 'R':	//解除输入限制
			CanvasMgr.OnUnLock();
			return;

		default:
			return;
		}
	}

	switch(nChar) {
	case VK_HOME:	//Home of a line
		CanvasMgr.OnHScroll(SB_LEFT, 0, NULL);
		return;

	case VK_END:	//End of a line
		CanvasMgr.OnHScroll(SB_RIGHT, 0, NULL);
		return;

	case 33:		//VK_PAGE_UP
		CanvasMgr.OnVScroll(SB_PAGEUP, 0, NULL);
		return;

	case 34:		//VK_PAGE_DOWN
		CanvasMgr.OnVScroll(SB_PAGEDOWN, 0, NULL);
		return;
	}

	if (CanvasMgr.m_inputLock)	//计算过了电流,根据数字键选择下一个位置
			CanvasMgr.m_c.NextBodyByInputNum(nChar);

	CDialog::OnKeyDown(nChar, nRepCnt, nFlags);
};

// key up
CanvasMgr.OnKeyUp = function(UINT nChar, UINT nRepCnt, UINT nFlags) {
	switch (nChar) {
	case VK_UP:		//向上移动焦点或画面向上滚动
		if (!CanvasMgr.m_inputLock && CanvasMgr.m_c.FocusBodyMove(nChar))
			CanvasMgr.m_c.PaintAll();
		else
			CanvasMgr.OnVScroll(SB_LINEUP, 0, NULL);
		return;

	case VK_DOWN:	//向下移动焦点或画面向下滚动
		if (!CanvasMgr.m_inputLock && CanvasMgr.m_c.FocusBodyMove(nChar))
			CanvasMgr.m_c.PaintAll();
		else
			CanvasMgr.OnVScroll(SB_LINEDOWN, 0, NULL);
		return;

	case VK_LEFT:	//向左移动焦点或画面向左滚动
		if (!CanvasMgr.m_inputLock && CanvasMgr.m_c.FocusBodyMove(nChar))
			CanvasMgr.m_c.PaintAll();
		else
			CanvasMgr.OnHScroll(SB_LINELEFT, 0, NULL);
		return;

	case VK_RIGHT:	//向右移动焦点或画面向右滚动
		if (!CanvasMgr.m_inputLock && CanvasMgr.m_c.FocusBodyMove(nChar))
			CanvasMgr.m_c.PaintAll();
		else
			CanvasMgr.OnHScroll(SB_LINERIGHT, 0, NULL);
		return;

	case VK_SPACE:
	case VK_TAB:	//切换焦点
		if (!CanvasMgr.m_inputLock) CanvasMgr.m_c.FocusBodyChangeUseTab();
		return;

	case 8:			//Backspace
	case VK_DELETE:	//删除焦点
		CanvasMgr.OnFocusBodyDelete();
		return;
	}

	CDialog::OnKeyUp(nChar, nRepCnt, nFlags);
};


// 文件函数----------------------------------------------------------------↓
// 新建文件
CanvasMgr.OnFileNew = function() {
	if (CanvasMgr.m_inputLock) return;

	//关闭文件前用户选择保存当前文件
	if (!CanvasMgr.SaveFileBeforeClose("新建文件前", true)) return;

	//建立新文件
	CanvasMgr.m_c.CreateFile();
	CanvasMgr.m_c.PaintAll();
	CanvasMgr.SetWindowText();
};

// 从磁盘读取指定文件
CanvasMgr.OnFileOpen = function() {
	if (CanvasMgr.m_inputLock) return;

	//关闭文件前用户选择保存当前文件
	if (!CanvasMgr.SaveFileBeforeClose("打开文件前", true)) return;

	//获得读取文件路径
	CFileDialog * lpszOpenFile = new CFileDialog(	//生成对话框
									TRUE, 
									FILE_EXTENT, 
									DEFAULT_FILE_NAME, 
									OFN_FILEMUSTEXIST,
									FILE_LIST);

	CString szGetName;
	if (lpszOpenFile.DoModal() == IDOK) {	//点击对话框确定按钮
		szGetName = lpszOpenFile.GetPathName();	//得到文件的路径
		delete lpszOpenFile;						//释放对话框资源
	} else {
		delete lpszOpenFile;	//释放对话框资源
		return;
	}

	//读取文件
	if (CanvasMgr.m_c.ReadFile(szGetName.GetBuffer(0))) {
		CanvasMgr.SetWindowText();	//更新窗口标题
		CanvasMgr.m_c.PaintAll();		//读取文件后刷新
	}
};

// 保存到文件
CanvasMgr.OnFileSave = function() {
	if (CanvasMgr.m_inputLock) return;

	const char * path = CanvasMgr.m_c.GetFilePath();

	if ('\0' == path[0]) {	//路径为空
		CanvasMgr.OnFileSaveAs();
	} else {
		CanvasMgr.m_c.SaveFile(path);
	}
};

// 另存为文件
CanvasMgr.OnFileSaveAs = function() {
	if (CanvasMgr.m_inputLock) return;

	//获得另存路径
	CFileDialog * lpszOpenFile = new CFileDialog(	//生成对话框
									FALSE, 
									FILE_EXTENT, 
									DEFAULT_FILE_NAME, 
									OFN_OVERWRITEPROMPT, 
									FILE_LIST);

	CString szGetName;
	if (lpszOpenFile.DoModal() == IDOK) {	//点击对话框确定按钮
		szGetName = lpszOpenFile.GetPathName();	//得到文件的路径
		delete lpszOpenFile;						//释放对话框资源
	} else {
		delete lpszOpenFile;	//释放对话框资源
		return;
	}

	//另存文件
	CanvasMgr.m_c.SaveFile(szGetName.GetBuffer(0));	//保存文件
	CanvasMgr.SetWindowText();					//更新窗口标题
};

// 保存电路到图片
CanvasMgr.OnSaveAsPicture = function() {
	//获得图片保存路径
	CFileDialog * lpszOpenFile = new CFileDialog(	//生成对话框
									FALSE, 
									"bmp", 
									"shot.bmp", 
									OFN_OVERWRITEPROMPT, 
									"位图文件(*.bmp)|*.bmp||");
	lpszOpenFile.CanvasMgr.m_ofn.lpstrTitle = "选择图片路径";

	CString szGetName;
	if (lpszOpenFile.DoModal() == IDOK) {	//点击对话框确定按钮
		szGetName = lpszOpenFile.GetPathName();	//得到文件的路径
		delete lpszOpenFile;						//释放对话框资源
	} else {
		delete lpszOpenFile;	//释放对话框资源
		return;
	}

	//保存图片
	CanvasMgr.m_c.SaveAsPicture(szGetName.GetBuffer(0));
};

// 菜单退出,效果同OnClose()
CanvasMgr.OnExit = function() {
	CanvasMgr.PostMessage(WM_CLOSE);
};

// 用户以拖拽方式打开文件
CanvasMgr.OnDropFiles = function(HDROP hDropInfo) {
	if (CanvasMgr.m_inputLock) return;

	int count, filePathLen;
	char filePath[256];
	count = DragQueryFile(hDropInfo, 0xFFFFFFFF, NULL, 0);

	if (count > 0) {
		//检查文件后缀
		for (--count; count>=0; --count) {
			DragQueryFile(hDropInfo, count, filePath, sizeof(filePath));
			filePathLen = strlen(filePath);
			if (filePathLen >= 5 && 0 == strcmp(FILE_EXTENT_DOT, filePath + filePathLen - 4))
				break;
		}
		DragFinish(hDropInfo);
		if (count < 0) {
			CString note = "必须是电路文件: ";
			note += FILE_EXTENT_DOT;
			MessageBox(note, "拖拽文件中没有电路文件", MB_ICONASTERISK);
			return;
		}

		//关闭文件前用户选择保存当前文件
		if (!CanvasMgr.SaveFileBeforeClose("打开文件前", true)) return;

		//读取文件
		if (CanvasMgr.m_c.ReadFile(filePath)) {
			CanvasMgr.SetWindowText();	//更新窗口标题
			CanvasMgr.m_c.PaintAll();		//读取文件后刷新
		}
	} else {
		DragFinish(hDropInfo);
	}
};


// 编辑函数----------------------------------------------------------------↓
// 剪切焦点
CanvasMgr.OnFocusBodyCut = function() {
	if (CanvasMgr.m_inputLock) return;

	FOCUS_OR_POS body;
	body.isFocusBody = true;

	CanvasMgr.m_c.CutBody(body);
};

// 复制焦点
CanvasMgr.OnFocusBodyCopy = function() {
	if (CanvasMgr.m_inputLock) return;

	FOCUS_OR_POS body;
	body.isFocusBody = true;

	CanvasMgr.m_c.CopyBody(body);
};

// 删除焦点
CanvasMgr.OnFocusBodyDelete = function() {
	if (CanvasMgr.m_inputLock) return;

	FOCUS_OR_POS body;
	body.isFocusBody = true;

	CanvasMgr.m_c.Delete(body);
	CanvasMgr.m_c.PaintAll();
};

// 设置添加何种物体,具体添加位置由有鼠标点击位置确定
CanvasMgr.OnSetAddState = function(UINT nID) {
	if (CanvasMgr.m_inputLock) return;
	CanvasMgr.m_c.PaintAll();
	CanvasMgr.m_c.SetAddState(BODY_TYPE(nID-IDM_ADD_SOURCE));
};

// 撤销
CanvasMgr.OnUnDo = function() {
	if (CanvasMgr.m_inputLock) return;
	CanvasMgr.m_c.UnDo();
};

// 重复
CanvasMgr.OnReDo = function() {
	if (CanvasMgr.m_inputLock) return;
	CanvasMgr.m_c.ReDo();
};

// 焦点属性
CanvasMgr.OnFocusBodyProperty = function() {
	FOCUS_OR_POS body;
	body.isFocusBody = true;

	CanvasMgr.m_c.Property(body, CanvasMgr.m_inputLock);
	CanvasMgr.m_c.PaintAll();
};

// 改变焦点电学元件类型
CanvasMgr.OnFocusBodyChangeCtrlStyle = function() {
	if (CanvasMgr.m_inputLock) return;

	FOCUS_OR_POS body;
	body.isFocusBody = true;

	CanvasMgr.m_c.ChangeCtrlStyle(body);
	CanvasMgr.m_c.PaintAll();
};

// 旋转焦点电学元件
CanvasMgr.OnFocusBodyRotateCtrl = function(UINT nID) {
	if (CanvasMgr.m_inputLock) return;

	FOCUS_OR_POS body;
	body.isFocusBody = true;

	CanvasMgr.m_c.RotateCtrl(body, nID-IDM_FOCUSBODY_ROTATE1+1);
	CanvasMgr.m_c.PaintAll();
};

// 显示流过焦点的电流
CanvasMgr.OnFocusBodyShowElec = function() {
	FOCUS_OR_POS body;
	body.isFocusBody = true;

	CanvasMgr.m_c.ShowBodyElec(body);
	CanvasMgr.m_c.PaintAll();
};

// 搜索物体
CanvasMgr.OnSearch = function() {
	if (CanvasMgr.m_inputLock) return;

	static SEARCH_BY searchBy = SEARCH_BY_NAME;
	static BODY_TYPE searchRange = BODY_ALL;
	static bool isWholeWord = false;
	static bool isMatchCase = false;
	static char keyWord[NAME_LEN] = {0};
	static bool isSearchPre = false;
	bool isMatch;

	MySearchDlg dlg(searchBy, searchRange, isWholeWord, isMatchCase, keyWord, isSearchPre, this);
	if (1 == dlg.DoModal()) {	//获得用户信息
		if (isSearchPre)
			isMatch = CanvasMgr.m_c.SearchPre(searchBy, searchRange, isWholeWord, isMatchCase, keyWord);		//搜索上一个
		else
			isMatch = CanvasMgr.m_c.SearchNext(searchBy, searchRange, isWholeWord, isMatchCase, keyWord);	//搜索下一个

		if (!isMatch) MessageBox("未找到匹配 !", "搜索结果");
	}
};


// 设置函数----------------------------------------------------------------↓
// 设置方向键移动物体的距离
CanvasMgr.OnSetMoveBodySense = function() {
	CanvasMgr.m_c.SetMoveBodySense();
};

// 设置导线合并最大距离
CanvasMgr.OnSetLeaveOutDis = function() {
	CanvasMgr.m_c.SetLeaveOutDis();
};

// 设置字体颜色
CanvasMgr.OnSetTextColor = function() {
	CanvasMgr.m_c.SetTextColor();
};

// 设置焦点导线样式
CanvasMgr.OnSetFocusLeadStyle = function() {
	CanvasMgr.m_c.SetFocusLeadStyle();
};

// 设置焦点结点颜色
CanvasMgr.OnSetFocusCrunColor = function() {
	CanvasMgr.m_c.SetFocusCrunColor();
};

// 设置焦点电学元件颜色
CanvasMgr.OnSetFocusCtrlColor = function() {
	CanvasMgr.m_c.SetFocusCtrlColor();
};


// 测试函数----------------------------------------------------------------↓
CanvasMgr.OnSaveTextFile = function() {
	if (CanvasMgr.m_inputLock) return;
	CanvasMgr.m_c.SaveCircuitInfoToTextFile();
};

CanvasMgr.OnMakeMap = function() {
	if (CanvasMgr.m_inputLock) return;
	CanvasMgr.m_c.SaveCountInfoToTextFile();
};


// 计算函数----------------------------------------------------------------↓
// 计算电流
CanvasMgr.OnCountElec = function() {
	if (CanvasMgr.m_inputLock) return;

	CanvasMgr.LockInput();		//上锁
	CanvasMgr.m_c.CountElec();	//计算电流
	CanvasMgr.m_c.PaintAll();	//计算后可能有特殊效果需要刷新
};

// 显示电势差
CanvasMgr.OnShowPressure = function() {
	if (!CanvasMgr.m_inputLock) return;
	CanvasMgr.m_c.ShowPressure();
};

// 显示流过右击物体的电流
CanvasMgr.OnPosBodyShowElec = function() {
	FOCUS_OR_POS body;
	body.isFocusBody = false;
	body.pos = CanvasMgr.m_mousePos;

	CanvasMgr.m_c.ShowBodyElec(body);
	CanvasMgr.m_c.PaintAll();
};

// 解除输入锁
CanvasMgr.OnUnLock = function() {
	if (!CanvasMgr.m_inputLock) return;
	CanvasMgr.m_inputLock = false;	//解除输入锁

	//需要激活的菜单
	CanvasMgr.m_hm.EnableMenuItem(0					, MF_ENABLED|MF_BYPOSITION);	//文件函数
	CanvasMgr.m_hm.EnableMenuItem(1					, MF_ENABLED|MF_BYPOSITION);	//编辑函数
	CanvasMgr.m_hm.EnableMenuItem(3					, MF_ENABLED|MF_BYPOSITION);	//测试函数
	CanvasMgr.m_hm.EnableMenuItem(IDM_COUNTI			, MF_ENABLED);

	//需要屏蔽的菜单
	CanvasMgr.m_hm.EnableMenuItem(IDM_RELEASE		, MF_GRAYED);
	CanvasMgr.m_hm.EnableMenuItem(IDM_SHOWPRESSURE	, MF_GRAYED);

	CanvasMgr.DrawMenuBar();			//重绘菜单栏
	CanvasMgr.m_c.ClearPressBody();	//清空显示电势差的成员变量
	CanvasMgr.m_c.PaintAll();		//刷新
};


// 右击菜单函数------------------------------------------------------------↓
// 复制右击物体
CanvasMgr.OnPosBodyCopy = function() {
	if (CanvasMgr.m_inputLock) return;

	FOCUS_OR_POS body;
	body.isFocusBody = false;
	body.pos = CanvasMgr.m_mousePos;

	CanvasMgr.m_c.CopyBody(body);
};

// 剪切右击物体
CanvasMgr.OnPosBodyCut = function() {
	if (CanvasMgr.m_inputLock) return;

	FOCUS_OR_POS body;
	body.isFocusBody = false;
	body.pos = CanvasMgr.m_mousePos;

	CanvasMgr.m_c.CutBody(body);
};

// 删除右击物体
CanvasMgr.OnPosBodyDelete = function() {
	if (CanvasMgr.m_inputLock) return;

	FOCUS_OR_POS body;
	body.isFocusBody = false;
	body.pos = CanvasMgr.m_mousePos;

	CanvasMgr.m_c.Delete(body);
	CanvasMgr.m_c.PaintAll();
};

// 粘贴剪切板物体到右击位置
CanvasMgr.OnPaste = function() {
	if (CanvasMgr.m_inputLock) return;
	CanvasMgr.m_c.PasteBody(CanvasMgr.m_mousePos);
};

// 删除右击导线
CanvasMgr.OnDeleteLead = function() {
	if (CanvasMgr.m_inputLock) return;

	FOCUS_OR_POS body;
	body.isFocusBody = false;
	body.pos = CanvasMgr.m_mousePos;

	CanvasMgr.m_c.Delete(body);
	CanvasMgr.m_c.PaintAll();
};

// 旋转右击电学元件
CanvasMgr.OnPosBodyRotateCtrl = function(UINT nID) {
	if (CanvasMgr.m_inputLock) return;

	FOCUS_OR_POS body;
	body.isFocusBody = false;
	body.pos = CanvasMgr.m_mousePos;

	CanvasMgr.m_c.RotateCtrl(body, nID-IDM_POSBODY_ROTATE1+1);
	CanvasMgr.m_c.PaintAll();
};

// 右击物体属性
CanvasMgr.OnPosBodyProperty = function() {
	FOCUS_OR_POS body;
	body.isFocusBody = false;
	body.pos = CanvasMgr.m_mousePos;

	CanvasMgr.m_c.Property(body, CanvasMgr.m_inputLock);
	CanvasMgr.m_c.PaintAll();
};

// 改变右击电学元件类型
CanvasMgr.OnPosBodyChangeCtrlStyle = function(
	if (CanvasMgr.m_inputLock) return;

	FOCUS_OR_POS body;
	body.isFocusBody = false;
	body.pos = CanvasMgr.m_mousePos;

	CanvasMgr.m_c.ChangeCtrlStyle(body);
	CanvasMgr.m_c.PaintAll();
};
