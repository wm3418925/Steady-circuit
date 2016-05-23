/* 稳恒电路教学模拟器
   版权所有（C） 2013 <王敏>

   This program is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation; version 2 of the License.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program; if not, write to the Free Software
   Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA */
   
// 稳恒电路Dlg.cpp : implementation file
//

#include "StdAfx.h"
#include "稳恒电路.h"
#include "StaticClass.h"	//包含static方法的类
#include "Manager.h"		//管理电路类
#include "MySearchDlg.h"	//搜索对话框
#include "稳恒电路Dlg.h"	//当前类

extern CMyApp theApp;
/////////////////////////////////////////////////////////////////////////////
// CAboutDlg dialog used for App About

class CAboutDlg : public CDialog
{
public:
	CAboutDlg();

// Dialog Data
	//{{AFX_DATA(CAboutDlg)
	enum { IDD = IDD_ABOUTBOX };
	//}}AFX_DATA

	// ClassWizard generated virtual function overrides
	//{{AFX_VIRTUAL(CAboutDlg)
	protected:
	//}}AFX_VIRTUAL

// Implementation
protected:
	//{{AFX_MSG(CAboutDlg)
	//}}AFX_MSG
	DECLARE_MESSAGE_MAP()
};

CAboutDlg::CAboutDlg() : CDialog(CAboutDlg::IDD)
{
	//{{AFX_DATA_INIT(CAboutDlg)
	//}}AFX_DATA_INIT
}

BEGIN_MESSAGE_MAP(CAboutDlg, CDialog)
	//{{AFX_MSG_MAP(CAboutDlg)
	//}}AFX_MSG_MAP
END_MESSAGE_MAP()

/////////////////////////////////////////////////////////////////////////////
// CMyDlg dialog

CMyDlg::CMyDlg(CWnd* pParent /*=NULL*/)
	: CDialog(CMyDlg::IDD, pParent)
{
	//{{AFX_DATA_INIT(CMyDlg)
		// NOTE: the ClassWizard will add member initialization here
	//}}AFX_DATA_INIT
	// Note that LoadIcon does not require a subsequent DestroyIcon in Win32
	m_hIcon = AfxGetApp()->LoadIcon(IDR_MAINFRAME);
}

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

/////////////////////////////////////////////////////////////////////////////
// private function
void CMyDlg::LockInput() 
//输入上锁
{
	m_inputLock = true;

	//需要屏蔽的菜单
	m_hm->EnableMenuItem(0					, MF_GRAYED|MF_BYPOSITION);	//文件函数
	m_hm->EnableMenuItem(1					, MF_GRAYED|MF_BYPOSITION);	//编辑函数
	m_hm->EnableMenuItem(3					, MF_GRAYED|MF_BYPOSITION);	//测试函数
	m_hm->EnableMenuItem(IDM_COUNTI			, MF_GRAYED);

	//需要激活的菜单
	m_hm->EnableMenuItem(IDM_RELEASE		, MF_ENABLED);
	m_hm->EnableMenuItem(IDM_SHOWPRESSURE	, MF_ENABLED);

	DrawMenuBar();	//重绘菜单栏
}

int CMyDlg::GetPageSize(int nBar)
//获得当前屏幕大小的一页
{
	RECT rect;
	int range;
	GetWindowRect(&rect);

	if(SB_HORZ == nBar)
	{
		range = rect.right - rect.left;
		range -= 5 + 20;
	}
	else //if(SB_VERT == nBar)
	{
		range = rect.bottom - rect.top;
		range -= 48 + 20;
	}
	range >>= 5;

	return range;
}

void CMyDlg::PasteByHotKey()
//使用快捷键粘贴
{
	if(m_inputLock) return;

	RECT rect;
	POINT mousePos;

	//获得合理坐标
	GetWindowRect(&rect);
	rect.right -= rect.left + 50;	//去除右边边框
	rect.bottom -= rect.top + 100;	//去除下边边框
	GetCursorPos(&mousePos);
	ScreenToClient(&mousePos);
	if(mousePos.x < 0) mousePos.x = 0;
	if(mousePos.y < 0) mousePos.y = 0;
	if(mousePos.x > rect.right) mousePos.x = rect.right;
	if(mousePos.y > rect.bottom) mousePos.y = rect.bottom;

	m_c->PasteBody(mousePos);
}

void CMyDlg::SetWindowText()
//设置窗口标题
{
	char title[256];
	const char * filePath = m_c->GetFilePath();

	if(NULL == filePath || '\0' == filePath[0])
	{
		strcpy(title, "新电路文件");
		strcat(title, FILE_EXTENT_DOT);
	}
	else
	{
		strcpy(title, filePath);
	}
	strcat(title, " - 稳恒电路");

	CDialog::SetWindowText(title);
}

bool CMyDlg::SaveFileBeforeClose(const char * caption, bool hasCancelButton)
//关闭文件前用户选择保存当前文件
{
	const char * filePath = m_c->GetFilePath();
	char note[256];
	int ret;

	if(NULL == filePath || filePath[0] == '\0')
	{
		strcpy(note, "保存文件吗 ?");
	}
	else
	{
		strcpy(note, "电路保存到文件 :\n\t");
		strcat(note, filePath);
		strcat(note, "\n吗 ?");
	}

	if(hasCancelButton)
		ret = MessageBox(note, caption, MB_YESNOCANCEL|MB_ICONASTERISK);
	else
		ret = MessageBox(note, caption, MB_YESNO|MB_ICONASTERISK);

	if(IDCANCEL == ret) return false;
	if(IDYES == ret) OnFileSave();
	return true;
}


/////////////////////////////////////////////////////////////////////////////
// CMyDlg message handlers
BOOL CMyDlg::OnInitDialog()
{
	CDialog::OnInitDialog();
	SetIcon(m_hIcon, TRUE);			// Set big icon
	SetIcon(m_hIcon, FALSE);		// Set small icon

	// 初始化 /////////////////////////////////////////
	//成员变量赋值
	m_focusFlag = true;				//窗口获得焦点标志
	m_inputLock = false;			//初始输入不上锁
	m_hm = GetMenu();				//获取主菜单句柄
	m_c = new class Manager(this);	//初始化电路控制类

	//设置滚动条范围
	SetScrollRange(SB_HORZ, 0, 50);	//水平
	SetScrollRange(SB_VERT, 0, 30);	//竖直

	//获得打开文件路径
	CCommandLineInfo cmdInfo;
	theApp.ParseCommandLine(cmdInfo);
	const char * filePath = cmdInfo.m_strFileName.GetBuffer(0);

	//打开文件
	UINT length = strlen(filePath);
	if(length >= 5 && 0 == strcmp(FILE_EXTENT_DOT, filePath + length - 4))
	{
		m_c->ReadFile(filePath);
	}

	//设置窗口标题
	this->SetWindowText();

	return TRUE;
}

void CMyDlg::OnClose()
//关闭
{
	ASSERT(m_c != NULL);

	if(!SaveFileBeforeClose("关闭前", true)) return;

	delete m_c;
	m_c = NULL;

	CDialog::OnClose();
}

void CMyDlg::OnDestroy() 
//强制退出
{
	CDialog::OnDestroy();

	if(m_c != NULL)
	{
		SaveFileBeforeClose("稳恒电路", false);

		delete m_c;
		m_c = NULL;
	}
}

BOOL CMyDlg::PreTranslateMessage(MSG * pMsg) 
{
	if(pMsg->message == WM_KEYDOWN)
	{         
        switch(pMsg->wParam)
		{
		case VK_RETURN:
        case VK_ESCAPE:
			PostMessage(WM_CLOSE);
			return TRUE;
		}
	}

	return CDialog::PreTranslateMessage(pMsg);
}

void CMyDlg::OnSysCommand(UINT nID, LPARAM lParam)
{
	if ((nID & 0xFFF0) == IDM_ABOUTBOX)
	{
		CAboutDlg dlgAbout;
		dlgAbout.DoModal();
	}
	else
	{
		CDialog::OnSysCommand(nID, lParam);
	}
}

void CMyDlg::OnPaint() 
{
	if (IsIconic())
	{
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
		dc.DrawIcon(x, y, m_hIcon);
	}
	else
	{
		CDialog::OnPaint();
		m_c->PaintAll();	//画电路物体
	}
}

BOOL CMyDlg::OnHelpInfo(HELPINFO * pHelpInfo) 
{
	if(pHelpInfo->iContextType == HELPINFO_MENUITEM)
	{
		char str[256];
		if(0 != LoadString(AfxGetInstanceHandle(), pHelpInfo->iCtrlId, str, 256))
			MessageBox(str, "菜单帮助信息");
	}
	else
	{
		RECT rect;
		POINT pos = pHelpInfo->MousePos;
		ScreenToClient(&pos);
		GetClientRect(&rect);

		if(pos.x>=0 && pos.x<rect.right && pos.y>=0 && pos.y<rect.bottom)
			m_c->Help(pos);
	}

	return true;
}

HCURSOR CMyDlg::OnQueryDragIcon()
{
	return (HCURSOR) m_hIcon;
}

void CMyDlg::OnAbout() 
//关于
{
	PostMessage(WM_SYSCOMMAND, IDM_ABOUTBOX);
}


// 其他常见消息的处理函数-------------------------------------------------↓
void CMyDlg::OnLButtonDown(UINT, CPoint point) 
//鼠标左键按下消息处理
{
	if(m_inputLock) return;
	m_c->AddBody(point);
	if(m_c->LButtonDown(point)) m_c->PaintAll();
}

void CMyDlg::OnMouseMove(UINT nFlags, CPoint point) 
//鼠标移动,失去焦点不判断
{
	if(m_inputLock || !m_focusFlag) return;
	m_c->MouseMove(point, nFlags&MK_LBUTTON);
	CDialog::OnMouseMove(nFlags, point);
}

void CMyDlg::OnLButtonUp(UINT, CPoint point) 
//鼠标左键按起消息处理
{
	if(m_inputLock)
		m_c->SetStartBody(point);
	else if(m_c->LButtonUp(point)) 
		m_c->PaintAll();
}

void CMyDlg::OnLButtonDblClk(UINT, CPoint point) 
//双击鼠标左键
{
	FOCUS_OR_POS body;
	body.isFocusBody = false;
	body.pos = point;

	if(m_inputLock)	//显示电流或电势差
	{
		if(m_c->ShowBodyElec(body))
			m_c->PaintAll();
		else
			m_c->ShowPressure();
	}
	else			//显示物体属性
	{
		m_c->Property(body, false);
		m_c->PaintAll();
	}
}

void CMyDlg::OnRButtonUp(UINT, CPoint point) 
//鼠标右键按起消息处理
{
	HMENU hm;
	BODY_TYPE type;
	m_mousePos = point;	//保存当前鼠标坐标

	m_c->PaintAll();	//刷新
	type = m_c->PosBodyPaintRect(point);	//突出右击物体

	if(m_inputLock)		//输入上锁
	{
		hm = CreatePopupMenu();

		if(BODY_LEAD == type)				//右击导线
		{
			AppendMenu(hm, 0, IDM_POSBODY_SHOWELEC, "查看电流(&L)\tCtrl+L");
		}
		else if(BODY_CRUN == type)			//右击结点
		{
			AppendMenu(hm, 0, IDM_POSBODY_PROPERTY, "查看属性(&P)\tCtrl+P");
		}
		else if(Pointer::IsCtrl(type))		//右击控件
		{
			AppendMenu(hm, 0, IDM_POSBODY_SHOWELEC, "查看电流(&L)\tCtrl+L");
			AppendMenu(hm, 0, IDM_POSBODY_PROPERTY, "查看属性(&P)\tCtrl+P");
		}

		AppendMenu(hm, 0, IDM_RELEASE, "解除输入限制(&R)\tCtrl+R");
		AppendMenu(hm, 0, IDM_SHOWPRESSURE, "显示电势差(&U)\tCtrl+U");
		ClientToScreen(&point);
		TrackPopupMenu(hm, TPM_LEFTALIGN, point.x, point.y, 0, m_hWnd, NULL);
		DestroyMenu(hm);
	}

	else if(BODY_NO == type)	//右击空白处
	{
		hm = LoadMenu(AfxGetInstanceHandle(), MAKEINTRESOURCE(IDR_MAINFRAME));
		HMENU temp_hm = GetSubMenu(hm, 1);
		HMENU subhm = GetSubMenu(temp_hm, 3);
		AppendMenu(subhm, 0, IDM_PASTE, "粘贴(&P)\tCtrl+V");
		if(!m_c->GetClipboardState())	//剪切板没有物体
			EnableMenuItem(subhm, IDM_PASTE, MF_GRAYED);

		ClientToScreen(&point);
		TrackPopupMenu(subhm, TPM_LEFTALIGN, point.x, point.y, 0, m_hWnd, NULL);
		DestroyMenu(hm);
		DestroyMenu(temp_hm);
		DestroyMenu(subhm);
	}

	else
	{
		HMENU subhm;
		if(BODY_LEAD == type)	//导线
			hm = LoadMenu(AfxGetInstanceHandle(), MAKEINTRESOURCE(IDR_LEADPRO));
		else
			hm = LoadMenu(AfxGetInstanceHandle(), MAKEINTRESOURCE(IDR_BODYPRO));
		subhm = GetSubMenu(hm, 0);

		if(Pointer::IsCtrl(type))
		{
			InsertMenu(subhm, IDM_POSBODY_PROPERTY, 0, IDM_POSBODY_ROTATE1, "顺时针旋转90°(&1)\tCtrl+1");
			InsertMenu(subhm, IDM_POSBODY_PROPERTY, 0, IDM_POSBODY_ROTATE2, "旋转180°(&2)\tCtrl+2");
			InsertMenu(subhm, IDM_POSBODY_PROPERTY, 0, IDM_POSBODY_ROTATE3, "逆时针旋转90°(&3)\tCtrl+3");

			InsertMenu(subhm, IDM_POSBODY_PROPERTY, 0, IDM_POSBODY_CHANGECTRLSTYLE, "电学元件类型(&T)\tCtrl+T");
		}

		if(BODY_LEAD == type || Pointer::IsCtrl(type))	//导线或控件上
			AppendMenu(subhm, 0, IDM_POSBODY_SHOWELEC, "查看电流(&L)\tCtrl+L");

		ClientToScreen(&point);
		TrackPopupMenu(subhm, TPM_LEFTALIGN, point.x, point.y, 0, m_hWnd, NULL);
		DestroyMenu(hm);
		DestroyMenu(subhm);
	}

	m_c->PaintAll();	//刷新
}

void CMyDlg::OnKillFocus()
//窗口失去焦点
{
	m_focusFlag = false;
}

void CMyDlg::OnSetFocus()
//窗口获得焦点
{
	m_focusFlag = true;
}

void CMyDlg::OnVScroll(UINT nSBCode, UINT nPos, CScrollBar * pScrollBar) 
//竖直滚动条消息处理
{
	const int oldPos = GetScrollPos(SB_VERT);	//记录开始的滚动条位置
	int minPos, maxPos;	//滚动条范围
	int newPos;			//滚动条新的位置
	GetScrollRange(SB_VERT, &minPos, &maxPos);

	switch(nSBCode)
	{
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
		newPos = oldPos - GetPageSize(SB_VERT);
		break;
	case SB_PAGEDOWN:
		newPos = oldPos + GetPageSize(SB_VERT);
		break;
	case SB_THUMBTRACK:
	case SB_THUMBPOSITION:
		newPos = nPos;
		break;
	default:
		return;
	}

	if(newPos < minPos)newPos = minPos;
	if(newPos > maxPos)newPos = maxPos;

	if(newPos != oldPos)	//改变了
	{
		SetScrollPos(SB_VERT, newPos);
		m_c->SetViewOrig(GetScrollPos(SB_HORZ), GetScrollPos(SB_VERT));
		m_c->PaintAll();
	}

	CDialog::OnVScroll(nSBCode, nPos, pScrollBar);
}

void CMyDlg::OnHScroll(UINT nSBCode, UINT nPos, CScrollBar * pScrollBar) 
//水平滚动条消息处理
{
	const int oldPos = GetScrollPos(SB_HORZ);	//记录开始的滚动条位置
	int minPos, maxPos;	//滚动条范围
	int newPos;			//滚动条新的位置
	GetScrollRange(SB_HORZ, &minPos, &maxPos);

	switch(nSBCode)
	{
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
		newPos = oldPos - GetPageSize(SB_HORZ);
		break;
	case SB_PAGERIGHT:
		newPos = oldPos + GetPageSize(SB_HORZ);
		break;
	case SB_THUMBTRACK:
	case SB_THUMBPOSITION:
		newPos = nPos;
		break;
	default:
		return;
	}

	if(newPos < minPos) newPos = minPos;
	if(newPos > maxPos) newPos = maxPos;

	if(newPos != oldPos)	//改变了
	{
		SetScrollPos(SB_HORZ, newPos);
		m_c->SetViewOrig(GetScrollPos(SB_HORZ), GetScrollPos(SB_VERT));
		m_c->PaintAll();
	}

	CDialog::OnHScroll(nSBCode, nPos, pScrollBar);
}

BOOL CMyDlg::OnMouseWheel(UINT nFlags, short zDelta, CPoint pt) 
//鼠标滚动条消息处理
{
	int vPos = GetScrollPos(SB_VERT);
	int hPos = GetScrollPos(SB_HORZ);	//记录开始的滚动条位置
	int temp;

	if(nFlags)	//有键按下,对水平滚动条操作
	{
		SetScrollPos(SB_HORZ, hPos-zDelta/WHEEL_DELTA);
		temp = GetScrollPos(SB_HORZ);
		if(hPos != temp)	//改变了
		{
			m_c->SetViewOrig(temp, vPos);
			m_c->PaintAll();
		}
	}
	else	//无键按下,对竖直滚动条操作
	{
		SetScrollPos(SB_VERT, vPos-zDelta/WHEEL_DELTA);
		temp = GetScrollPos(SB_VERT);
		if(vPos != temp)	//改变了
		{
			m_c->SetViewOrig(hPos, temp);
			m_c->PaintAll();
		}
	}

	return CDialog::OnMouseWheel(nFlags, zDelta, pt);
}

void CMyDlg::OnKeyDown(UINT nChar, UINT nRepCnt, UINT nFlags)
//key down
{
	//左或右ctrl键被按下
	if(StaticClass::IsCtrlDown())
	{
		switch(nChar)
		{
		//文件功能快捷键
		case 'N':	//新建文件
			OnFileNew();
			return;

		case 'O':	//打开文件
			OnFileOpen();
			return;

		case 'S':	//保存文件
			OnFileSave();
			return;

		//编辑功能快捷键
		case 'X':	//剪切焦点
			OnFocusBodyCut();
			return;

		case 'C':	//复制焦点
			OnFocusBodyCopy();
			return;

		case 'V':	//使用快捷键粘贴
			PasteByHotKey();
			return;

		case 'Z':	//撤销
			OnUnDo();
			return;

		case 'Y':	//前进
			OnReDo();
			return;

		case 'P':	//属性
			OnFocusBodyProperty();
			return;

		case 'T':	//电学元件类型
			OnFocusBodyChangeCtrlStyle();
			return;

		case '1':
		case '2':
		case '3':	//旋转电学元件
			OnFocusBodyRotateCtrl(nChar - '1' + IDM_FOCUSBODY_ROTATE1);
			return;

		case 'F':
			OnSearch();
			return;

		//计算功能快捷键
		case 'I':	//计算电流
			OnCountElec();
			return;

		case 'L':	//显示焦点电流
			OnFocusBodyShowElec();
			return;

		case 'U':	//显示电势差
			OnShowPressure();
			return;

		case 'R':	//解除输入限制
			OnUnLock();
			return;

		default:
			return;
		}
	}

	switch(nChar)
	{
	case VK_HOME:	//Home of a line
		OnHScroll(SB_LEFT, 0, NULL);
		return;

	case VK_END:	//End of a line
		OnHScroll(SB_RIGHT, 0, NULL);
		return;

	case 33:		//VK_PAGE_UP
		OnVScroll(SB_PAGEUP, 0, NULL);
		return;

	case 34:		//VK_PAGE_DOWN
		OnVScroll(SB_PAGEDOWN, 0, NULL);
		return;
	}

	if(m_inputLock)	//计算过了电流,根据数字键选择下一个位置
			m_c->NextBodyByInputNum(nChar);

	CDialog::OnKeyDown(nChar, nRepCnt, nFlags);
}

void CMyDlg::OnKeyUp(UINT nChar, UINT nRepCnt, UINT nFlags)
//key up
{
	switch(nChar)
	{
	case VK_UP:		//向上移动焦点或画面向上滚动
		if(!m_inputLock && m_c->FocusBodyMove(nChar))
			m_c->PaintAll();
		else
			OnVScroll(SB_LINEUP, 0, NULL);
		return;

	case VK_DOWN:	//向下移动焦点或画面向下滚动
		if(!m_inputLock && m_c->FocusBodyMove(nChar))
			m_c->PaintAll();
		else
			OnVScroll(SB_LINEDOWN, 0, NULL);
		return;

	case VK_LEFT:	//向左移动焦点或画面向左滚动
		if(!m_inputLock && m_c->FocusBodyMove(nChar))
			m_c->PaintAll();
		else
			OnHScroll(SB_LINELEFT, 0, NULL);
		return;

	case VK_RIGHT:	//向右移动焦点或画面向右滚动
		if(!m_inputLock && m_c->FocusBodyMove(nChar))
			m_c->PaintAll();
		else
			OnHScroll(SB_LINERIGHT, 0, NULL);
		return;

	case VK_SPACE:
	case VK_TAB:	//切换焦点
		if(!m_inputLock) m_c->FocusBodyChangeUseTab();
		return;

	case 8:			//Backspace
	case VK_DELETE:	//删除焦点
		OnFocusBodyDelete();
		return;
	}

	CDialog::OnKeyUp(nChar, nRepCnt, nFlags);
}


//文件函数----------------------------------------------------------------↓
void CMyDlg::OnFileNew() 
//新建文件
{
	if(m_inputLock) return;

	//关闭文件前用户选择保存当前文件
	if(!SaveFileBeforeClose("新建文件前", true)) return;

	//建立新文件
	m_c->CreateFile();
	m_c->PaintAll();
	this->SetWindowText();
}

void CMyDlg::OnFileOpen() 
//从磁盘读取指定文件
{
	if(m_inputLock) return;

	//关闭文件前用户选择保存当前文件
	if(!SaveFileBeforeClose("打开文件前", true)) return;

	//获得读取文件路径
	CFileDialog * lpszOpenFile = new CFileDialog(	//生成对话框
									TRUE, 
									FILE_EXTENT, 
									DEFAULT_FILE_NAME, 
									OFN_FILEMUSTEXIST,
									FILE_LIST);

	CString szGetName;
	if(lpszOpenFile->DoModal() == IDOK)	//点击对话框确定按钮
	{
		szGetName = lpszOpenFile->GetPathName();	//得到文件的路径
		delete lpszOpenFile;						//释放对话框资源
	}
	else
	{
		delete lpszOpenFile;	//释放对话框资源
		return;
	}

	//读取文件
	if(m_c->ReadFile(szGetName.GetBuffer(0)))
	{
		this->SetWindowText();	//更新窗口标题
		m_c->PaintAll();		//读取文件后刷新
	}
}

void CMyDlg::OnFileSave()
//保存到文件
{
	if(m_inputLock) return;

	const char * path = m_c->GetFilePath();

	if('\0' == path[0])	//路径为空
	{
		OnFileSaveAs();
	}
	else
	{
		m_c->SaveFile(path);
	}
}

void CMyDlg::OnFileSaveAs()
//另存为文件
{
	if(m_inputLock) return;

	//获得另存路径
	CFileDialog * lpszOpenFile = new CFileDialog(	//生成对话框
									FALSE, 
									FILE_EXTENT, 
									DEFAULT_FILE_NAME, 
									OFN_OVERWRITEPROMPT, 
									FILE_LIST);

	CString szGetName;
	if(lpszOpenFile->DoModal() == IDOK)	//点击对话框确定按钮
	{
		szGetName = lpszOpenFile->GetPathName();	//得到文件的路径
		delete lpszOpenFile;						//释放对话框资源
	}
	else
	{
		delete lpszOpenFile;	//释放对话框资源
		return;
	}

	//另存文件
	m_c->SaveFile(szGetName.GetBuffer(0));	//保存文件
	this->SetWindowText();					//更新窗口标题
}

void CMyDlg::OnSaveAsPicture()
//保存电路到图片
{
	//获得图片保存路径
	CFileDialog * lpszOpenFile = new CFileDialog(	//生成对话框
									FALSE, 
									"bmp", 
									"shot.bmp", 
									OFN_OVERWRITEPROMPT, 
									"位图文件(*.bmp)|*.bmp||");
	lpszOpenFile->m_ofn.lpstrTitle = "选择图片路径";

	CString szGetName;
	if(lpszOpenFile->DoModal() == IDOK)	//点击对话框确定按钮
	{
		szGetName = lpszOpenFile->GetPathName();	//得到文件的路径
		delete lpszOpenFile;						//释放对话框资源
	}
	else
	{
		delete lpszOpenFile;	//释放对话框资源
		return;
	}

	//保存图片
	m_c->SaveAsPicture(szGetName.GetBuffer(0));
}

void CMyDlg::OnExit() 
//菜单退出,效果同OnClose()
{
	PostMessage(WM_CLOSE);
}

void CMyDlg::OnDropFiles(HDROP hDropInfo)
//用户以拖拽方式打开文件
{
	if(m_inputLock) return;

	int count, filePathLen;
	char filePath[256];
	count = DragQueryFile(hDropInfo, 0xFFFFFFFF, NULL, 0);

	if(count > 0)
	{
		//检查文件后缀
		for(--count; count>=0; --count)
		{
			DragQueryFile(hDropInfo, count, filePath, sizeof(filePath));
			filePathLen = strlen(filePath);
			if(filePathLen >= 5 && 0 == strcmp(FILE_EXTENT_DOT, filePath + filePathLen - 4))
				break;
		}
		DragFinish(hDropInfo);
		if(count < 0)
		{
			CString note = "必须是电路文件: ";
			note += FILE_EXTENT_DOT;
			MessageBox(note, "拖拽文件中没有电路文件", MB_ICONASTERISK);
			return;
		}

		//关闭文件前用户选择保存当前文件
		if(!SaveFileBeforeClose("打开文件前", true)) return;

		//读取文件
		if(m_c->ReadFile(filePath))
		{
			this->SetWindowText();	//更新窗口标题
			m_c->PaintAll();		//读取文件后刷新
		}
	}
	else
	{
		DragFinish(hDropInfo);
	}
}


//编辑函数----------------------------------------------------------------↓
void CMyDlg::OnFocusBodyCut()
//剪切焦点
{
	if(m_inputLock) return;

	FOCUS_OR_POS body;
	body.isFocusBody = true;

	m_c->CutBody(body);
}

void CMyDlg::OnFocusBodyCopy()
//复制焦点
{
	if(m_inputLock) return;

	FOCUS_OR_POS body;
	body.isFocusBody = true;

	m_c->CopyBody(body);
}

void CMyDlg::OnFocusBodyDelete()
//删除焦点
{
	if(m_inputLock) return;

	FOCUS_OR_POS body;
	body.isFocusBody = true;

	m_c->Delete(body);
	m_c->PaintAll();
}

void CMyDlg::OnSetAddState(WORD nID)
//设置添加何种物体,具体添加位置由有鼠标点击位置确定
{
	if(m_inputLock) return;
	m_c->PaintAll();
	m_c->SetAddState(BODY_TYPE(nID-IDM_ADD_SOURCE));
}

void CMyDlg::OnUnDo()
//撤销
{
	if(m_inputLock) return;
	m_c->UnDo();
}

void CMyDlg::OnReDo()
//重复
{
	if(m_inputLock) return;
	m_c->ReDo();
}

void CMyDlg::OnFocusBodyProperty()
//焦点属性
{
	FOCUS_OR_POS body;
	body.isFocusBody = true;

	m_c->Property(body, m_inputLock);
	m_c->PaintAll();
}

void CMyDlg::OnFocusBodyChangeCtrlStyle()
//改变焦点电学元件类型
{
	if(m_inputLock) return;

	FOCUS_OR_POS body;
	body.isFocusBody = true;

	m_c->ChangeCtrlStyle(body);
	m_c->PaintAll();
}

void CMyDlg::OnFocusBodyRotateCtrl(WORD nID)
//旋转焦点电学元件
{
	if(m_inputLock) return;

	FOCUS_OR_POS body;
	body.isFocusBody = true;

	m_c->RotateCtrl(body, nID-IDM_FOCUSBODY_ROTATE1+1);
	m_c->PaintAll();
}

void CMyDlg::OnFocusBodyShowElec()
//显示流过焦点的电流
{
	FOCUS_OR_POS body;
	body.isFocusBody = true;

	m_c->ShowBodyElec(body);
	m_c->PaintAll();
}

void CMyDlg::OnSearch()
//搜索物体
{
	if(m_inputLock) return;

	static SEARCH_BY searchBy = SEARCH_BY_NAME;
	static BODY_TYPE searchRange = BODY_ALL;
	static bool isWholeWord = false;
	static bool isMatchCase = false;
	static char keyWord[NAME_LEN] = {0};
	static bool isSearchPre = false;
	bool isMatch;

	MySearchDlg dlg(searchBy, searchRange, isWholeWord, isMatchCase, keyWord, isSearchPre, this);
	if(1 == dlg.DoModal())	//获得用户信息
	{
		if(isSearchPre)
			isMatch = m_c->SearchPre(searchBy, searchRange, isWholeWord, isMatchCase, keyWord);		//搜索上一个
		else
			isMatch = m_c->SearchNext(searchBy, searchRange, isWholeWord, isMatchCase, keyWord);	//搜索下一个

		if(!isMatch) MessageBox("未找到匹配 !", "搜索结果");
	}
}


//设置函数----------------------------------------------------------------↓
void CMyDlg::OnSetMoveBodySense() 
//设置方向键移动物体的距离
{
	m_c->SetMoveBodySense();
}

void CMyDlg::OnSetLeaveOutDis() 
//设置导线合并最大距离
{
	m_c->SetLeaveOutDis();
}

void CMyDlg::OnSetTextColor() 
//设置字体颜色
{
	m_c->SetTextColor();
}

void CMyDlg::OnSetFocusLeadStyle()
//设置焦点导线样式
{
	m_c->SetFocusLeadStyle();
}

void CMyDlg::OnSetFocusCrunColor() 
//设置焦点结点颜色
{
	m_c->SetFocusCrunColor();
}

void CMyDlg::OnSetFocusCtrlColor() 
//设置焦点电学元件颜色
{
	m_c->SetFocusCtrlColor();
}


//测试函数----------------------------------------------------------------↓
void CMyDlg::OnSaveTextFile()
{
	if(m_inputLock) return;
	m_c->SaveCircuitInfoToTextFile();
}

void CMyDlg::OnMakeMap()
{
	if(m_inputLock) return;
	m_c->SaveCountInfoToTextFile();
}


//计算函数----------------------------------------------------------------↓
void CMyDlg::OnCountElec()
//计算电流
{
	if(m_inputLock) return;

	LockInput();		//上锁
	m_c->CountElec();	//计算电流
	m_c->PaintAll();	//计算后可能有特殊效果需要刷新
}

void CMyDlg::OnShowPressure()
//显示电势差
{
	if(!m_inputLock) return;
	m_c->ShowPressure();
}

void CMyDlg::OnPosBodyShowElec() 
//显示流过右击物体的电流
{
	FOCUS_OR_POS body;
	body.isFocusBody = false;
	body.pos = m_mousePos;

	m_c->ShowBodyElec(body);
	m_c->PaintAll();
}

void CMyDlg::OnUnLock() 
//解除输入锁
{
	if(!m_inputLock) return;
	m_inputLock = false;	//解除输入锁

	//需要激活的菜单
	m_hm->EnableMenuItem(0					, MF_ENABLED|MF_BYPOSITION);	//文件函数
	m_hm->EnableMenuItem(1					, MF_ENABLED|MF_BYPOSITION);	//编辑函数
	m_hm->EnableMenuItem(3					, MF_ENABLED|MF_BYPOSITION);	//测试函数
	m_hm->EnableMenuItem(IDM_COUNTI			, MF_ENABLED);

	//需要屏蔽的菜单
	m_hm->EnableMenuItem(IDM_RELEASE		, MF_GRAYED);
	m_hm->EnableMenuItem(IDM_SHOWPRESSURE	, MF_GRAYED);

	DrawMenuBar();			//重绘菜单栏
	m_c->ClearPressBody();	//清空显示电势差的成员变量
	m_c->PaintAll();		//刷新
}


//右击菜单函数------------------------------------------------------------↓
void CMyDlg::OnPosBodyCopy()
//复制右击物体
{
	if(m_inputLock) return;

	FOCUS_OR_POS body;
	body.isFocusBody = false;
	body.pos = m_mousePos;

	m_c->CopyBody(body);
}

void CMyDlg::OnPosBodyCut()
//剪切右击物体
{
	if(m_inputLock) return;

	FOCUS_OR_POS body;
	body.isFocusBody = false;
	body.pos = m_mousePos;

	m_c->CutBody(body);
}

void CMyDlg::OnPosBodyDelete() 
//删除右击物体
{
	if(m_inputLock) return;

	FOCUS_OR_POS body;
	body.isFocusBody = false;
	body.pos = m_mousePos;

	m_c->Delete(body);
	m_c->PaintAll();
}

void CMyDlg::OnPaste()
//粘贴剪切板物体到右击位置
{
	if(m_inputLock) return;
	m_c->PasteBody(m_mousePos);
}

void CMyDlg::OnDeleteLead() 
//删除右击导线
{
	if(m_inputLock) return;

	FOCUS_OR_POS body;
	body.isFocusBody = false;
	body.pos = m_mousePos;

	m_c->Delete(body);
	m_c->PaintAll();
}

void CMyDlg::OnPosBodyRotateCtrl(WORD nID)
//旋转右击电学元件
{
	if(m_inputLock) return;

	FOCUS_OR_POS body;
	body.isFocusBody = false;
	body.pos = m_mousePos;

	m_c->RotateCtrl(body, nID-IDM_POSBODY_ROTATE1+1);
	m_c->PaintAll();
}

void CMyDlg::OnPosBodyProperty()
//右击物体属性
{
	FOCUS_OR_POS body;
	body.isFocusBody = false;
	body.pos = m_mousePos;

	m_c->Property(body, m_inputLock);
	m_c->PaintAll();
}

void CMyDlg::OnPosBodyChangeCtrlStyle() 
//改变右击电学元件类型
{
	if(m_inputLock) return;

	FOCUS_OR_POS body;
	body.isFocusBody = false;
	body.pos = m_mousePos;

	m_c->ChangeCtrlStyle(body);
	m_c->PaintAll();
}
