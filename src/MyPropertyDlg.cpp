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
   
// Property.cpp : implementation file
//

#include "StdAfx.h"
#include "稳恒电路.h"
#include "StaticClass.h"	//包含static方法的类
#include "DataList.h"		//LISTDATA, ENUM_STYLE类
#include "MyEditCtrl.h"		//自定义的Edit类
#include "MyPropertyDlg.h"	//当前类

/////////////////////////////////////////////////////////////////////////////
// MyPropertyDlg dialog


MyPropertyDlg::MyPropertyDlg(
						 LISTDATA * list, 
						 bool readOnly, 
						 CDC * model, 
						 const char * windowTitle, 
						 CWnd * pParent /*=NULL*/)
	: CDialog(MyPropertyDlg::IDD, pParent)
{
	//{{AFX_DATA_INIT(MyPropertyDlg)
	//}}AFX_DATA_INIT

	m_windowTitle = windowTitle;	//窗口名称
	m_model = model;				//示例
	m_readOnly = readOnly;			//是否只读
	m_list = list;					//数据列表

	m_inter.x = 20;	//控件 与 数据提示text 的间距;
	m_inter.y = 15;	//控件之间 或者 数据提示text 之间 的间距

	m_firstNotePos.x = 20; m_firstNotePos.y = 20;		//第一个数据提示text起始坐标
	m_noteTextSize.cx = 180; m_noteTextSize.cy = 20;	//数据提示text大小

	m_firstCtrlPos.x = m_firstNotePos.x + m_noteTextSize.cx +m_inter.x;
	m_firstCtrlPos.y = m_firstNotePos.y;	//第一个控件起始坐标
	m_ctrlSize.cx = 300; m_ctrlSize.cy = m_noteTextSize.cy ;	//控件大小

	//确定按钮的坐标
	m_okButtonPos.x = m_firstCtrlPos.x;
	m_okButtonPos.y = m_firstCtrlPos.y + ( m_ctrlSize.cy + m_inter.y ) * m_list->GetListSize();

	//取消按钮的坐标
	m_cancelButtonPos.x = m_okButtonPos.x + 150 +m_inter.x;
	m_cancelButtonPos.y = m_okButtonPos.y;

	//窗口大小
	m_wndSize.cx = m_firstCtrlPos.x + m_ctrlSize.cx + m_inter.x + 10;
	m_wndSize.cy = m_cancelButtonPos.y + 70;
}

BOOL MyPropertyDlg::OnInitDialog()
{
	CDialog::OnInitDialog();

	// Add "About..." menu item to system menu.

	// IDM_ABOUTBOX must be in the system command range.
	ASSERT((IDM_ABOUTBOX & 0xFFF0) == IDM_ABOUTBOX);
	ASSERT(IDM_ABOUTBOX < 0xF000);

	CMenu* pSysMenu = GetSystemMenu(FALSE);
	if (pSysMenu != NULL)
	{
		CString strAboutMenu;
		strAboutMenu.LoadString(IDS_ABOUTBOX);
		if (!strAboutMenu.IsEmpty())
		{
			pSysMenu->AppendMenu(MF_SEPARATOR);
			pSysMenu->AppendMenu(MF_STRING, IDM_ABOUTBOX, strAboutMenu);
		}
	}

	// Set the icon for this dialog.  The framework does this automatically
	//  when the application's main window is not a dialog
	
	// TODO: Add extra initialization here
	//1,初始化窗口位置和大小
	RECT rect;
	GetParent()->GetWindowRect(&rect);
	if(rect.bottom > m_wndSize.cy)
	{
		rect.left += (rect.right  - rect.left)/2 - m_wndSize.cx/2;
		rect.top  += (rect.bottom - rect.top) /2 - m_wndSize.cy/2;
	}
	MoveWindow(rect.left, rect.top, m_wndSize.cx, m_wndSize.cy);
	if(m_windowTitle) SetWindowText(m_windowTitle);

	//2,初始化确定,取消按钮,示例Label
	GetDlgItem(IDOK)->MoveWindow(m_okButtonPos.x, m_okButtonPos.y, 130, 25);
	GetDlgItem(IDCANCEL)->MoveWindow(m_cancelButtonPos.x, m_cancelButtonPos.y, 130, 25);
	GetDlgItem(IDC_STATIC_MODELTEXT)->MoveWindow(m_firstNotePos.x, m_okButtonPos.y, 40, 25);
	if(m_model != NULL) SetDlgItemText(IDC_STATIC_MODELTEXT, "示例");

	//3,初始化每个数据对应的控件
	char tempStr[NAME_LEN];
	class ENUM_STYLE * tempEnumStyle;

	for(int i = m_list->GetListSize()-1; i>=0; --i)
	{
		rect.left = m_firstNotePos.x;
		rect.right = m_noteTextSize.cx;
		rect.top = m_firstNotePos.y + i * (m_noteTextSize.cy + m_inter.y);
		rect.bottom = m_noteTextSize.cy;
		CreateLabel(rect, m_list->noteText[i], NOTEID(i));

		rect.left = m_firstCtrlPos.x;
		rect.right = m_ctrlSize.cx;
		rect.top = m_firstCtrlPos.y + i * (m_ctrlSize.cy + m_inter.y);
		rect.bottom = m_ctrlSize.cy;

		switch(m_list->listStyle[i])
		{
		case DATA_STYLE_float:
			sprintf(tempStr, "%f", *((float *)m_list->dataPoint[i]));
			new MyEditCtrl(
				m_hWnd, 
				rect, 
				tempStr, 
				CTRLID(i), 
				m_list->listStyle[i], 
				m_readOnly);
			break;

		case DATA_STYLE_double:
			sprintf(tempStr, "%f", *((double *)m_list->dataPoint[i]));
			new MyEditCtrl(
				m_hWnd, 
				rect, 
				tempStr, 
				CTRLID(i), 
				m_list->listStyle[i], 
				m_readOnly);
			break;

		case DATA_STYLE_UINT:
			itoa(*((int *)m_list->dataPoint[i]), tempStr, 10);
			new MyEditCtrl(
				m_hWnd, 
				rect, 
				tempStr, 
				CTRLID(i), 
				m_list->listStyle[i], 
				m_readOnly);
			break;

		case DATA_STYLE_bool:
			CreateCheck(rect, *(bool *)m_list->dataPoint[i], CTRLID(i));
			break;

		case DATA_STYLE_LPCTSTR://char[NAME_LEN]
			new MyEditCtrl(
				m_hWnd, 
				rect, 
				(char *)m_list->dataPoint[i], 
				CTRLID(i), 
				m_list->listStyle[i], 
				m_readOnly);
			break;

		case DATA_STYLE_enum:
			tempEnumStyle = (ENUM_STYLE *)m_list->dataPoint[i];
			CreateCombo(
				rect,
				tempEnumStyle->GetStyleNum(),
				*(tempEnumStyle->GetDataPoint()),
				tempEnumStyle->GetNote(),
				CTRLID(i));
			break;
		}
	}

	return TRUE;  // return TRUE  unless you set the focus to a control
}

void MyPropertyDlg::OnPaint() 
{
	if (IsIconic())
	{
		CPaintDC dc(this);
	}
	else
	{
		CDialog::OnPaint();

		if(m_model != NULL)
		{
			CClientDC dc(this);
			BITMAP buf;
			m_model->GetCurrentBitmap()->GetBitmap(&buf);
			dc.BitBlt(100, m_okButtonPos.y, buf.bmWidth, buf.bmHeight, m_model, 0, 0, SRCAND);
		}
	}
}

BOOL MyPropertyDlg::OnHelpInfo(HELPINFO *) 
{
	return true;
}


BEGIN_MESSAGE_MAP(MyPropertyDlg, CDialog)
	//{{AFX_MSG_MAP(MyPropertyDlg)
	ON_WM_PAINT()
	ON_WM_HELPINFO()
	//}}AFX_MSG_MAP
END_MESSAGE_MAP()

/////////////////////////////////////////////////////////////////////////////
// MyPropertyDlg message handlers

//控件函数---------------------------------------------------------------------
void MyPropertyDlg::CreateLabel(RECT rect, LPCTSTR lpszWindowName, UINT nID)
//创建label控件
{
	CWnd * pWnd = new CStatic;
	DWORD ctrlStyle = WS_CHILD | WS_TABSTOP | WS_VISIBLE;
	if(nID & 2)ctrlStyle ^= SS_SUNKEN;

	pWnd->CreateEx(
		0,
		_T("STATIC"), lpszWindowName,
		ctrlStyle ,
		rect.left, rect.top, rect.right, rect.bottom,
		m_hWnd, (HMENU)nID);
}

void MyPropertyDlg::CreateCheck(RECT rect, bool check, UINT nID)
//创建check控件
{
	CWnd * pWnd = new CButton;
	DWORD ctrlStyle = WS_CHILD | WS_TABSTOP | WS_VISIBLE | BS_AUTOCHECKBOX;

	pWnd->CreateEx(
		WS_EX_CLIENTEDGE,
		_T("BUTTON"), NULL,
		ctrlStyle,
		rect.left, rect.top, rect.right, rect.bottom,
		m_hWnd, (HMENU)nID);
	((CButton *)pWnd)->SetCheck(check);

	if(m_readOnly)	//只读
		pWnd->EnableWindow(false);
}

void MyPropertyDlg::CreateCombo(RECT rect, int num, int select, const char ** comboNotes, UINT nID)
//创建ComboBox控件
{
	CComboBox * pWnd = new CComboBox;
	DWORD ctrlStyle = CBS_DROPDOWNLIST | CBS_DROPDOWN | WS_CHILD | WS_VISIBLE | WS_VSCROLL | WS_TABSTOP;
	rect.right += rect.left;
	rect.bottom = rect.top + num * 30;

	pWnd->Create(ctrlStyle, rect, this, nID);

	for(int i=0; i<num; ++i)
		pWnd->AddString(comboNotes[i]);

	ASSERT(select>=0 && select<num);
	pWnd->SetCurSel(select);

	if(m_readOnly)	//只读
		pWnd->EnableWindow(false);
}


//消息处理函数---------------------------------------------------------------------
BOOL MyPropertyDlg::DestroyWindow() 
{
	CWnd * t;

	for(int i = m_list->GetListSize()-1; i>=0; --i)
	{
		t = GetDlgItem(NOTEID(i));
		t->DestroyWindow();
		t->Detach();
		delete t;

		t = GetDlgItem(CTRLID(i));
		t->DestroyWindow();
		t->Detach();
		delete t;
	}

	return CDialog::DestroyWindow();
}

void MyPropertyDlg::OnOK() 
//按确定按钮
{
	if(m_readOnly)	//只读状态不返回有效信息
	{
		CDialog::OnOK();
		return;
	}

	ERROR_TYPE errorType = ERROR_NO;
	int i;

	//测试数据
	for(i = m_list->GetListSize()-1; i>=0; --i)
	{
		errorType = m_list->CheckAMember(i, GetDlgItem(CTRLID(i)));
		if(errorType != ERROR_NO) break;
	}

	//出错提示
	if(errorType != ERROR_NO)
	{
		CString showText;
		char errorText[NAME_LEN*2];
		char nameText[NAME_LEN];

		switch(errorType) //错误类型
		{
		case ERROR_STRNULL:
			strcpy(errorText, "数据项不能为空!");
			break;
		case ERROR_FLOATMIX:
			strcpy(errorText, "浮点类型数据只能有数字和最多一个小数点!");
			break;
		case ERROR_UINTMIX:
			strcpy(errorText, "正整数含有数字以外的其他字符!");
			break;
		case ERROR_UINTOVER:
			strcpy(errorText, "整数不在允许的范围内!");
			break;
		case ERROR_ENUMOVER:
			strcpy(errorText, "没有选择选项中的某一个!");
			break;
		case ERROR_STRMIX:
			strcpy(errorText, "标签中不能包含 [ ] ( ) { }");
			break;
		case ERROR_ENUMNOTALLOWED:
			strcpy(errorText, "选定结点或者选定电学元件颜色不能为黑色 !");
			break;
		}

		if(1 == m_list->GetListSize())
		{
			showText.Format("%s\n请重新输入!", errorText);
		}
		else
		{
			GetDlgItemText(NOTEID(i), nameText, NAME_LEN);	//数据项标签
			showText.Format("第%d个数据项:\n\t%s\n%s\n请重新输入!", i+1, nameText, errorText);
		}
		MessageBox(showText);
		GetDlgItem(CTRLID(i))->SetFocus();	//数据不合法控件获得焦点
		return;
	}

	//测试成功写入数据
	for(i = m_list->GetListSize()-1; i>=0; --i)
		m_list->SaveAMember(i, GetDlgItem(CTRLID(i)));

	CDialog::OnOK();
}
