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
   
// MyEditCtrl.cpp : implementation file
//

#include "stdafx.h"
#include "StaticClass.h"	//包含static方法的类
#include "DataList.h"		//LISTDATA, ENUM_STYLE类
#include "MyEditCtrl.h"		//当前类

/////////////////////////////////////////////////////////////////////////////
// MyEditCtrl
MyEditCtrl::MyEditCtrl(HWND hWnd, RECT rect, char * text, UINT nID, DATA_STYLE style, bool readOnly)
//创建edit控件
{
	this->CreateEx(
		WS_EX_CLIENTEDGE,
		_T("EDIT"),
		text,
		WS_CHILD | WS_TABSTOP | WS_VISIBLE | ES_AUTOHSCROLL,
		rect.left, rect.top, rect.right, rect.bottom,
		hWnd,
		(HMENU)nID);

	m_readOnly = readOnly;
	ChangeDataStyle(style);
}

MyEditCtrl::~MyEditCtrl()
{
}

void MyEditCtrl::ChangeDataStyle(DATA_STYLE style)
{
	m_style = style;

	if(m_readOnly)	//只读
	{
		SetReadOnly();
		return;
	}

	switch(m_style)
	{
	case DATA_STYLE_float:		//10位小数
		ModifyStyle(ES_NUMBER, 0);
		SetLimitText(10);
		break;

	case DATA_STYLE_double:		//17位小数
		ModifyStyle(ES_NUMBER, 0);
		SetLimitText(17);
		break;

	case DATA_STYLE_UINT:		//9位数字
		ModifyStyle(0, ES_NUMBER);
		SetLimitText(9);
		break;

	case DATA_STYLE_LPCTSTR:	//NAME_LEN-2个字符
		ModifyStyle(ES_NUMBER, 0);
		SetLimitText(NAME_LEN - 2);
		break;
	}

	//去除多余字符
	char text[128];
	GetWindowText(text, 128);
	if(strlen(text) > GetLimitText())
	{
		char * p = text;
		while(*p != '\0' && *p != '.') ++p;
		*p = '\0';
		SetWindowText(text);
	}

	OnUpdate();
}

bool MyEditCtrl::ValidateString()
//验证字符串是否合法
{
	bool flag = true;
	char text[NAME_LEN*2];
	GetWindowText(text, NAME_LEN*2);

	switch(m_style)
	{
	case DATA_STYLE_float:
	case DATA_STYLE_double:
		flag = StaticClass::IsFloat(text);
		break;

	case DATA_STYLE_UINT:
		flag = StaticClass::IsUnsignedInteger(text);
		break;

	case DATA_STYLE_LPCTSTR:
		flag = StaticClass::IsNormalStr(text);
		break;
	}

	return flag;
}


BEGIN_MESSAGE_MAP(MyEditCtrl, CEdit)
	//{{AFX_MSG_MAP(MyEditCtrl)
	ON_WM_HELPINFO()
	ON_CONTROL_REFLECT(EN_UPDATE, OnUpdate)
	//}}AFX_MSG_MAP
END_MESSAGE_MAP()

/////////////////////////////////////////////////////////////////////////////
// MyEditCtrl message handlers

BOOL MyEditCtrl::OnHelpInfo(HELPINFO *) 
//用户点击F1,请求帮助
{
	char note[64];
	int limitTextNum = GetLimitText();

	if(m_readOnly)
	{
		switch(m_style)
		{
		case DATA_STYLE_float:
		case DATA_STYLE_double:
			sprintf(note, "这是一个显示浮点数的编辑框\n");
			break;

		case DATA_STYLE_UINT:
			sprintf(note, "这是一个显示正整数的编辑框\n");
			break;

		case DATA_STYLE_LPCTSTR:
			sprintf(note, "这是一个显示字符的编辑框\n");
			break;
		}
	}
	else
	{
		switch(m_style)
		{
		case DATA_STYLE_float:
			sprintf(note, "这是一个编辑浮点数的编辑框\n允许输入%d位以内的浮点数", limitTextNum);
			break;

		case DATA_STYLE_double:
			sprintf(note, "这是一个编辑浮点数的编辑框\n允许输入%d位以内的浮点数", limitTextNum);
			break;

		case DATA_STYLE_UINT:
			sprintf(note, "这是一个编辑正整数的编辑框\n允许输入%d位以内的正整数", limitTextNum);
			break;

		case DATA_STYLE_LPCTSTR:
			sprintf(note, "这是一个编辑字符的编辑框\n允许输入%d位以内的字符", limitTextNum);
			break;
		}
	}

	AfxMessageBox(note);
	return true;
}

void MyEditCtrl::OnUpdate() 
//用户改变字符,在这里检测非法输入.在OnChar()函数不能对粘贴进行检测
{
	if(m_readOnly) return;

	if(!ValidateString())	//字符串非法
	{
		if(CanUndo())
		{
			Undo();
		}
		else
		{
			SetWindowText("");
		}
	}

	EmptyUndoBuffer();
}
