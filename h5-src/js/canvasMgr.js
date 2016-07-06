var CanvasMgr = {};

/*
	ON_COMMAND(IDM_FILE_NEW, OnFileNew)
	ON_COMMAND(IDM_FILE_OPEN, OnFileOpen)
	ON_COMMAND(IDM_FILE_SAVE, OnFileSave)
	ON_COMMAND(IDM_FILE_SAVE_AS, OnFileSaveAs)
	ON_COMMAND(IDM_SAVEASPIC, OnSaveAsPicture)
	
	ON_COMMAND(IDM_EXIT, OnExit)
*/
// ///////////////////////////////////////////////////////////////////////////
//  private function

// 输入上锁
CanvasMgr.LockInput = function() {
	CanvasMgr.m_inputLock = true;

	//需要屏蔽的菜单
	//CanvasMgr.m_hm.EnableMenuItem(0, MF_GRAYED|MF_BYPOSITION);	//文件函数
	disableMenuItem("menu_group_add");	//编辑函数
	disableMenuItem("menu_compute_elec");
	disableMenuItem("menu_search");

	//需要激活的菜单
	enableMenuItem("menu_show_pressure");
	enableMenuItem("menu_unlock");
};

// 使用快捷键粘贴
CanvasMgr.PasteByHotKey = function(e) {
	if (CanvasMgr.m_inputLock) return;

	var mousePos = GetClientPosOfEvent(e, CanvasMgr.canvas);
	
	var maxX = CanvasMgr.canvas.clientWidth - CTRL_SIZE.cx;
	var maxY = CanvasMgr.canvas.clientHeight - CTRL_SIZE.cy;
	
	if (mousePos.x < 0) mousePos.x = 0;
	if (mousePos.y < 0) mousePos.y = 0;
	if (mousePos.x > maxX) mousePos.x = maxX;
	if (mousePos.y > maxY) mousePos.y = maxY;

	Manager.PasteBody(mousePos);
};

// 设置窗口标题
CanvasMgr.SetWindowText = function() {
	var title;
	
	var filePath = Manager.GetFilePath();
	if (null == filePath || 0 == filePath.length) {
		title = "新电路文件" + FILE_EXTENT_DOT;
	} else {
		title = filePath;
	}
	title += " - 稳恒电路";

	document.title = title;
};

// 关闭文件前用户选择保存当前文件
CanvasMgr.SaveFileBeforeClose = function(caption, hasCancelButton, yesnoCallback) {
	var filePath = Manager.GetFilePath();
	var note;

	if (null == filePath || 0 == filePath.length) {
		note = "保存文件吗 ?";
	} else {
		note = "电路保存到文件 :\n\t" + filePath + "\n吗 ?";
	}

	var layerParam = {
		type: 1,
		scrollbar: false,
		area: 'auto',
		maxWidth: 500,
		
		title: caption,
		content: note
	};
	if (hasCancelButton) {
		layerParam.btn = ['保存', '继续编辑', '不保存'];
		layerParam.yes = function (){CanvasMgr.OnFileSave();yesnoCallback();};
		layerParam.cancel = function (){};
		layerParam.no = function (){yesnoCallback();};
	} else {
		layerParam.btn = ['保存', '直接退出'];
		layerParam.yes = function (){CanvasMgr.OnFileSave();yesnoCallback();};
		layerParam.no = function (){yesnoCallback();};
	}
	layer.open(layerParam);
};


// ///////////////////////////////////////////////////////////////////////////
// 初始化
CanvasMgr.OnInitDialog = function(canvas) {
	//成员变量赋值
	CanvasMgr.m_inputLock = false;	//初始输入不上锁
	CanvasMgr.m_mousePos = {x:0, y:0};

	//设置滚动条范围
	//SetScrollRange(SB_HORZ, 0, 50);	//水平
	//SetScrollRange(SB_VERT, 0, 30);	//竖直

	//初始化电路 Manager
	CanvasMgr.canvas = canvas;
	Manager.Init(canvas);
	Manager.ReadFile("testData.json");
	Manager.PaintAll();
	
	CanvasMgr.SetWindowText();

	return true;
};

// 关闭
CanvasMgr.OnClose = function() {
	//var yesnoCallback = function() {
	//	Manager = null;
	//}
	//CanvasMgr.SaveFileBeforeClose("关闭前", true, yesnoCallback);
};

CanvasMgr.OnPaint = function() {
	Manager.PaintAll();
};

// 关于
CanvasMgr.OnAbout = function() {
};


//  其他常见消息的处理函数-------------------------------------------------↓
// 鼠标按钮按下
CanvasMgr.OnMouseDown = function(e) {
	if (0 == e.button)
		return CanvasMgr.OnLButtonDown(e);
	else
		return true;
};
// 鼠标按钮释放
CanvasMgr.OnMouseUp = function(e) {
	if (0 == e.button)
		return CanvasMgr.OnLButtonUp(e);
	else
		return true;
};

// 鼠标左键按下消息处理
CanvasMgr.OnLButtonDown = function(e) {
	if (CanvasMgr.m_inputLock) return;
	
	var point = GetClientPosOfEvent(e, CanvasMgr.canvas);
	Manager.AddBody(point);
	if (Manager.LButtonDown(point)) Manager.PaintAll();
	
	return true;
};
// 鼠标左键按起消息处理
CanvasMgr.OnLButtonUp = function(e) {
	var point = GetClientPosOfEvent(e, CanvasMgr.canvas);
	if (CanvasMgr.m_inputLock)
		Manager.SetStartBody(point);
	else if (Manager.LButtonUp(point, e)) 
		Manager.PaintAll();
	
	return true;
};
// 双击鼠标左键
CanvasMgr.OnLButtonDblClk = function(e) {
	if (!e) e = window.event;
	
	var point = GetClientPosOfEvent(e, CanvasMgr.canvas);
	var body = FOCUS_OR_POS.CreateNew(false, point);

	if (CanvasMgr.m_inputLock) {	//显示电流或电势差
		if (Manager.ShowBodyElec(body))
			Manager.PaintAll();
		else
			Manager.ShowPressure();
	} else {			//显示物体属性
		Manager.Property(body, false);
	}
	
	return true;
};
		
// 鼠标移动,失去焦点不判断
CanvasMgr.OnMouseMove = function(e) {
	if (CanvasMgr.m_inputLock) return;
	
	var point = GetClientPosOfEvent(e, CanvasMgr.canvas);
	Manager.MouseMove(point, e);
	
	return true;
};

// 窗口失去焦点
CanvasMgr.OnKillFocus = function(e) {
	return true;
};
// 窗口获得焦点
CanvasMgr.OnSetFocus = function(e) {
	return true;
};

// key down
CanvasMgr.OnKeyDown = function(e) {
	var code = GetPressKeyCode(e);
	var nChar = String.fromCharCode(code).toUpperCase();

	//ctrl键被按下
	if (e.ctrlKey==1) {
		switch (nChar) {
		//文件功能快捷键
		case 'N':	//新建文件
			CanvasMgr.OnFileNew();
			return false;

		case 'O':	//打开文件
			CanvasMgr.OnFileOpen();
			return false;

		case 'S':	//保存文件
			CanvasMgr.OnFileSave();
			return false;

		//编辑功能快捷键
		case 'X':	//剪切焦点
			CanvasMgr.OnFocusBodyCut();
			return false;

		case 'C':	//复制焦点
			CanvasMgr.OnFocusBodyCopy();
			return false;

		case 'V':	//使用快捷键粘贴
			//CanvasMgr.PasteByHotKey(e);//由于不能获取鼠标坐标, 只能废弃
			return false;

		case 'Z':	//撤销
			CanvasMgr.OnUnDo();
			return false;

		case 'Y':	//前进
			CanvasMgr.OnReDo();
			return false;

		case 'P':	//属性
			CanvasMgr.OnFocusBodyProperty();
			return false;

		case 'T':	//电学元件类型
			CanvasMgr.OnFocusBodyChangeCtrlStyle();
			return false;

		case '1':
		case '2':
		case '3':	//旋转电学元件
			CanvasMgr.OnFocusBodyRotateCtrl(nChar - '0');
			return false;

		case 'F':
			CanvasMgr.OnSearch();
			return false;

		//计算功能快捷键
		case 'I':	//计算电流
			CanvasMgr.OnComputeElec();
			return false;

		case 'L':	//显示焦点电流
			CanvasMgr.OnFocusBodyShowElec();
			return false;

		case 'U':	//显示电势差
			CanvasMgr.OnShowPressure();
			return false;

		case 'R':	//解除输入限制
			CanvasMgr.OnUnlock();
			return false;

		default:
			return true;
		}
	}

	/*switch (code) {
	case 36:	//Home
		CanvasMgr.OnHScroll(SB_LEFT, 0, null);
		return false;

	case 35:	//End
		CanvasMgr.OnHScroll(SB_RIGHT, 0, null);
		return false;

	case 33:	//PgUp
		CanvasMgr.OnVScroll(SB_PAGEUP, 0, null);
		return false;

	case 34:	//PgDn
		CanvasMgr.OnVScroll(SB_PAGEDOWN, 0, null);
		return false;
	}*/

	if (CanvasMgr.m_inputLock)	//计算过了电流,根据数字键选择下一个位置
		Manager.NextBodyByPressKey(code, nChar);

	return true;
};

// key up
CanvasMgr.OnKeyUp = function(e) {
	var code = GetPressKeyCode(e);
	
	switch (code) {
	case 38:		//向上移动焦点或画面向上滚动
		if (!CanvasMgr.m_inputLock && Manager.FocusBodyMove(code)) {
			Manager.PaintAll();
			return false;
		}
		break;

	case 40:	//向下移动焦点或画面向下滚动
		if (!CanvasMgr.m_inputLock && Manager.FocusBodyMove(code)) {
			Manager.PaintAll();
			return false;
		}
		break;

	case 37:	//向左移动焦点或画面向左滚动
		if (!CanvasMgr.m_inputLock && Manager.FocusBodyMove(code)) {
			Manager.PaintAll();
			return false;
		}
		break;

	case 39:	//向右移动焦点或画面向右滚动
		if (!CanvasMgr.m_inputLock && Manager.FocusBodyMove(code)) {
			Manager.PaintAll();
			return false;
		}
		break;

	case 32://VK_SPACE:
	case 9://VK_TAB:	//切换焦点
		if (!CanvasMgr.m_inputLock) Manager.FocusBodyChangeUseTab();
		return false;

	case 8:	//Backspace
	case 46://VK_DELETE:	//删除焦点
		CanvasMgr.OnFocusBodyDelete();
		return false;
	}

	return true;
};


// 菜单函数----------------------------------------------------------------↓
// 弹出右击菜单消息处理
CanvasMgr.BeforePopupMenu = function(e, ui) {
	var point = GetClientPosOfEvent(e, CanvasMgr.canvas);
	
	CanvasMgr.m_mousePos = point;	//保存当前鼠标坐标
	Manager.PaintAll();	//刷新
	var type = Manager.GetPosBodyType(point);	//获取右击类型
	
	var menuArray = new Array();

	if (CanvasMgr.m_inputLock) {		//输入上锁
		if (BODY_LEAD == type) {				//右击导线
			menuArray.push({title: "查看电流 <kbd>Ctrl+L</kbd>", uiIcon: "ui-icon-arrowthick-1-e", action:CanvasMgr.OnPosBodyShowElec});
		} else if (BODY_CRUN == type) {			//右击结点
			menuArray.push({title: "查看属性 <kbd>Ctrl+P</kbd>", uiIcon: "ui-icon-info", action:CanvasMgr.OnPosBodyProperty});
		} else if (Pointer.IsCtrl(type)) {		//右击控件
			menuArray.push({title: "查看电流 <kbd>Ctrl+L</kbd>", uiIcon: "ui-icon-arrowthick-1-e", action:CanvasMgr.OnPosBodyShowElec});
			menuArray.push({title: "查看属性 <kbd>Ctrl+P</kbd>", uiIcon: "ui-icon-info", action:CanvasMgr.OnPosBodyProperty});
		}
		menuArray.push({title: "解除输入限制 <kbd>Ctrl+R</kbd>", uiIcon: "ui-icon-unlocked", action:CanvasMgr.OnUnlock});
		menuArray.push({title: "显示电势差 <kbd>Ctrl+U</kbd>", uiIcon: "ui-icon-link", action:CanvasMgr.OnShowPressure});
	} else if (BODY_NO == type) {	//右击空白处
		menuArray.push({title: "添加结点", uiIcon: "ui-icon-add-crun", action:CanvasMgr.OnSetAddState, cmd:"add-crun"});
		menuArray.push({title: "添加电源", uiIcon: "ui-icon-add-source", action:CanvasMgr.OnSetAddState, cmd:"add-source"});
		menuArray.push({title: "添加电阻", uiIcon: "ui-icon-add-resist", action:CanvasMgr.OnSetAddState, cmd:"add-resist"});
		menuArray.push({title: "添加灯泡", uiIcon: "ui-icon-add-bulb", action:CanvasMgr.OnSetAddState, cmd:"add-bulb"});
		menuArray.push({title: "添加电容器", uiIcon: "ui-icon-add-capa", action:CanvasMgr.OnSetAddState, cmd:"add-capa"});
		menuArray.push({title: "添加开关", uiIcon: "ui-icon-add-switch", action:CanvasMgr.OnSetAddState, cmd:"add-switch"});
		menuArray.push({title: "------------", disabled: true});
		
		var pasteMenuItem = {title: "粘贴", uiIcon: "ui-icon-clipboard", action:CanvasMgr.OnPaste};//"粘贴 <kbd>Ctrl+V</kbd>"
		if (!Manager.GetClipboardState())
			pasteMenuItem.disabled = true;
		menuArray.push(pasteMenuItem);
	} else {
		if (BODY_LEAD == type) {	//导线
			menuArray.push({title: "删除导线 <kbd>Delete</kbd>", uiIcon: "ui-icon-trash", action:CanvasMgr.OnDeleteLead});
		} else {
			menuArray.push({title: "剪切 <kbd>Ctrl+X</kbd>", uiIcon: "ui-icon-scissors", action:CanvasMgr.OnPosBodyCut});
			menuArray.push({title: "复制 <kbd>Ctrl+C</kbd>", uiIcon: "ui-icon-copy", action:CanvasMgr.OnPosBodyCopy});
			menuArray.push({title: "删除 <kbd>Delete</kbd>", uiIcon: "ui-icon-trash", action:CanvasMgr.OnPosBodyDelete});
		}

		if (Pointer.IsCtrl(type)) {
			menuArray.push({title: "------------", disabled: true});
			menuArray.push({title: "顺时针旋转90° <kbd>Ctrl+1</kbd>", uiIcon: "ui-icon-arrowrefresh-1-s", action:CanvasMgr.OnPosBodyRotateCtrl, cmd:"rotate90"});
			menuArray.push({title: "旋转180° <kbd>Ctrl+2</kbd>", uiIcon: "ui-icon-refresh", action:CanvasMgr.OnPosBodyRotateCtrl, cmd:"rotate180"});
			menuArray.push({title: "逆时针旋转90° <kbd>Ctrl+3</kbd>", uiIcon: "ui-icon-arrowreturnthick-1-w", action:CanvasMgr.OnPosBodyRotateCtrl, cmd:"rotate270"});
			menuArray.push({title: "------------", disabled: true});
			menuArray.push({title: "电学元件类型", uiIcon: "ui-icon-flag", action:CanvasMgr.OnPosBodyChangeCtrlStyle});
		}

		if (BODY_LEAD == type || Pointer.IsCtrl(type))	//导线或控件上
			menuArray.push({title: "查看电流 <kbd>Ctrl+L</kbd>", uiIcon: "ui-icon-arrowthick-1-e", action:CanvasMgr.OnPosBodyShowElec});
		
		menuArray.push({title: "------------", disabled: true});
		menuArray.push({title: "属性 <kbd>Ctrl+P</kbd>", uiIcon: "ui-icon-info", action:CanvasMgr.OnPosBodyProperty});
	}

	$(document).contextmenu("replaceMenu", menuArray);
	return true;
};

		

// 文件函数----------------------------------------------------------------↓
// 新建文件
CanvasMgr.OnFileNew = function() {
	if (CanvasMgr.m_inputLock) return;

	var yesnoCallback = function() {
		//建立新文件
		Manager.CreateFile();
		Manager.PaintAll();
		CanvasMgr.SetWindowText();
	};
	
	//关闭文件前用户选择保存当前文件
	CanvasMgr.SaveFileBeforeClose("新建文件前", true, yesnoCallback);
};

// 从磁盘读取指定文件
CanvasMgr.OnFileOpen = function() {
	if (CanvasMgr.m_inputLock) return;

	var yesnoCallback = function() {
		//获得读取文件路径
		var lpszOpenFile = new CFileDialog(	//生成对话框
										true, 
										FILE_EXTENT, 
										DEFAULT_FILE_NAME, 
										OFN_FILEMUSTEXIST,
										FILE_LIST);

		var szGetName;
		if (lpszOpenFile.DoModal() == IDOK) {	//点击对话框确定按钮
			szGetName = lpszOpenFile.GetPathName();	//得到文件的路径
			lpszOpenFile = null;	//释放对话框资源
		} else {
			lpszOpenFile = null;	//释放对话框资源
			return;
		}

		//读取文件
		if (Manager.ReadFile(szGetName)) {
			CanvasMgr.SetWindowText();	//更新窗口标题
			Manager.PaintAll();		//读取文件后刷新
		}
	};
	
	//关闭文件前用户选择保存当前文件
	CanvasMgr.SaveFileBeforeClose("打开文件前", true, yesnoCallback);
};

// 保存到文件
CanvasMgr.OnFileSave = function() {
	if (CanvasMgr.m_inputLock) return;

	var path = Manager.GetFilePath();

	if (path.length == 0) {	//路径为空
		CanvasMgr.OnFileSaveAs();
	} else {
		Manager.SaveFile(path);
	}
};

// 另存为文件
CanvasMgr.OnFileSaveAs = function() {
	if (CanvasMgr.m_inputLock) return;

	//获得另存路径
	var lpszOpenFile = new CFileDialog(	//生成对话框
									false, 
									FILE_EXTENT, 
									DEFAULT_FILE_NAME, 
									OFN_OVERWRITEPROMPT, 
									FILE_LIST);

	var szGetName;
	if (lpszOpenFile.DoModal() == IDOK) {	//点击对话框确定按钮
		szGetName = lpszOpenFile.GetPathName();	//得到文件的路径
		lpszOpenFile = null;	//释放对话框资源
	} else {
		lpszOpenFile = null;	//释放对话框资源
		return;
	}

	//另存文件
	Manager.SaveFile(szGetName);	//保存文件
	CanvasMgr.SetWindowText();		//更新窗口标题
};

// 保存电路到图片
CanvasMgr.OnSaveAsPicture = function() {
	//获得图片保存路径
	var lpszOpenFile = new CFileDialog(	//生成对话框
									false, 
									"bmp", 
									"shot.bmp", 
									OFN_OVERWRITEPROMPT, 
									"位图文件(*.bmp)|*.bmp||");
	lpszOpenFile.m_ofn.lpstrTitle = "选择图片路径";

	var szGetName;
	if (lpszOpenFile.DoModal() == IDOK) {	//点击对话框确定按钮
		szGetName = lpszOpenFile.GetPathName();	//得到文件的路径
		lpszOpenFile = null;	//释放对话框资源
	} else {
		lpszOpenFile = null;	//释放对话框资源
		return;
	}

	//保存图片
	Manager.SaveAsPicture(szGetName);
};



// 编辑函数----------------------------------------------------------------↓
// 剪切焦点
CanvasMgr.OnFocusBodyCut = function() {
	if (CanvasMgr.m_inputLock) return;

	var body = FOCUS_OR_POS.CreateNew(true);

	Manager.CutBody(body);
};

// 复制焦点
CanvasMgr.OnFocusBodyCopy = function() {
	if (CanvasMgr.m_inputLock) return;

	var body = FOCUS_OR_POS.CreateNew(true);

	Manager.CopyBody(body);
};

// 删除焦点
CanvasMgr.OnFocusBodyDelete = function() {
	if (CanvasMgr.m_inputLock) return;

	var body = FOCUS_OR_POS.CreateNew(true);

	Manager.DeleteFocusOrPosBody(body);
};

// 设置添加何种物体,具体添加位置由鼠标点击位置确定
CanvasMgr.OnSetAddState = function(e, ui) {
	if (CanvasMgr.m_inputLock) return;

	var addState = BODY_NO;
	switch (ui.cmd) {
	case "add-crun":
		addState = BODY_CRUN;
		break;
	case "add-source":
		addState = BODY_SOURCE;
		break;
	case "add-resist":
		addState = BODY_RESIST;
		break;
	case "add-bulb":
		addState = BODY_BULB;
		break;
	case "add-capa":
		addState = BODY_CAPA;
		break;
	case "add-switch":
		addState = BODY_SWITCH;
		break;

	default:
		return false;
	}

	Manager.PaintAll();
	Manager.SetAddState(addState);
};

// 焦点属性
CanvasMgr.OnFocusBodyProperty = function() {
	var body = FOCUS_OR_POS.CreateNew(true);

	Manager.Property(body, CanvasMgr.m_inputLock);
};

// 改变焦点电学元件类型
CanvasMgr.OnFocusBodyChangeCtrlStyle = function() {
	if (CanvasMgr.m_inputLock) return;

	var body = FOCUS_OR_POS.CreateNew(true);

	Manager.ChangeCtrlStyle(body);
};

// 旋转焦点电学元件
CanvasMgr.OnFocusBodyRotateCtrl = function(nID) {
	if (CanvasMgr.m_inputLock) return;

	var body = FOCUS_OR_POS.CreateNew(true);

	Manager.RotateCtrl(body, nID);
	Manager.PaintAll();
};

// 显示流过焦点的电流
CanvasMgr.OnFocusBodyShowElec = function() {
	var body = FOCUS_OR_POS.CreateNew(true);

	Manager.ShowBodyElec(body);
};

// 搜索物体
CanvasMgr.OnSearch = function() {
	if (CanvasMgr.m_inputLock) return;

	var dlg = MySearchDlg.CreateNew(CanvasMgr.canvas);
	dlg.DoModal();
};


// 设置函数----------------------------------------------------------------↓
// 设置方向键移动物体的距离
CanvasMgr.OnSetMoveBodySense = function() {
	Manager.SetMoveBodySense();
};

// 设置导线合并最大距离
CanvasMgr.OnSetLeaveOutDis = function() {
	Manager.SetLeaveOutDis();
};

// 设置字体颜色
CanvasMgr.OnSetTextColor = function() {
	Manager.SetTextColor();
};

// 设置焦点导线样式
CanvasMgr.OnSetFocusLeadStyle = function() {
	Manager.SetFocusLeadStyle();
};

// 设置焦点结点颜色
CanvasMgr.OnSetFocusCrunColor = function() {
	Manager.SetFocusCrunColor();
};

// 设置焦点电学元件颜色
CanvasMgr.OnSetFocusCtrlColor = function() {
	Manager.SetFocusCtrlColor();
};


// 计算函数----------------------------------------------------------------↓
// 计算电流
CanvasMgr.OnComputeElec = function() {
	if (CanvasMgr.m_inputLock) return;

	CanvasMgr.LockInput();		//上锁
	Manager.FocusBodyClear(null);
	ComputeMgr.ComputeElec(Manager.lead, Manager.crun, Manager.ctrl);	//计算电流
	Manager.PaintAll();	//计算后可能有特殊效果需要刷新
};

// 显示电势差
CanvasMgr.OnShowPressure = function() {
	if (!CanvasMgr.m_inputLock) return;
	Manager.ShowPressure();
};

// 显示流过右击物体的电流
CanvasMgr.OnPosBodyShowElec = function() {
	var body = FOCUS_OR_POS.CreateNew(false, CanvasMgr.m_mousePos);

	Manager.ShowBodyElec(body);
};

// 解除输入锁
CanvasMgr.OnUnlock = function() {
	if (!CanvasMgr.m_inputLock) return;
	CanvasMgr.m_inputLock = false;	//解除输入锁
	
	
	//需要激活的菜单
	//CanvasMgr.m_hm.EnableMenuItem(0, MF_ENABLED|MF_BYPOSITION);	//文件函数
	enableMenuItem("menu_group_add");	//编辑函数
	enableMenuItem("menu_compute_elec");
	enableMenuItem("menu_search");

	//需要屏蔽的菜单
	disableMenuItem("menu_show_pressure");
	disableMenuItem("menu_unlock");

	Manager.ClearPressBody();	//清空显示电势差的成员变量
	Manager.PaintAll();		//刷新
};


// 右击菜单函数------------------------------------------------------------↓
// 复制右击物体
CanvasMgr.OnPosBodyCopy = function() {
	if (CanvasMgr.m_inputLock) return;

	var body = FOCUS_OR_POS.CreateNew(false, CanvasMgr.m_mousePos);

	Manager.CopyBody(body);
};

// 剪切右击物体
CanvasMgr.OnPosBodyCut = function() {
	if (CanvasMgr.m_inputLock) return;

	var body = FOCUS_OR_POS.CreateNew(false, CanvasMgr.m_mousePos);

	Manager.CutBody(body);
};

// 删除右击物体
CanvasMgr.OnPosBodyDelete = function() {
	if (CanvasMgr.m_inputLock) return;

	var body = FOCUS_OR_POS.CreateNew(false, CanvasMgr.m_mousePos);

	Manager.DeleteFocusOrPosBody(body);
};

// 粘贴剪切板物体到右击位置
CanvasMgr.OnPaste = function() {
	if (CanvasMgr.m_inputLock) return;
	Manager.PasteBody(CanvasMgr.m_mousePos);
};

// 删除右击导线
CanvasMgr.OnDeleteLead = function() {
	if (CanvasMgr.m_inputLock) return;

	var body = FOCUS_OR_POS.CreateNew(false, CanvasMgr.m_mousePos);

	Manager.DeleteFocusOrPosBody(body);
};

// 旋转右击电学元件
CanvasMgr.OnPosBodyRotateCtrl = function(e, ui) {
	if (CanvasMgr.m_inputLock) return;
	
	var angle90 = 0;
	switch (ui.cmd) {
	case "rotate90":
		angle90 = 1;
		break;
	case "rotate180":
		angle90 = 2;
		break;
	case "rotate270":
		angle90 = 3;
		break;
	default:
		return false;
	}

	var body = FOCUS_OR_POS.CreateNew(false, CanvasMgr.m_mousePos);

	Manager.RotateCtrl(body, angle90);
	Manager.PaintAll();
};

// 右击物体属性
CanvasMgr.OnPosBodyProperty = function() {
	var body = FOCUS_OR_POS.CreateNew(false, CanvasMgr.m_mousePos);

	Manager.Property(body, CanvasMgr.m_inputLock);
};

// 改变右击电学元件类型
CanvasMgr.OnPosBodyChangeCtrlStyle = function() {
	if (CanvasMgr.m_inputLock) return;

	var body = FOCUS_OR_POS.CreateNew(false, CanvasMgr.m_mousePos);

	Manager.ChangeCtrlStyle(body);
};
