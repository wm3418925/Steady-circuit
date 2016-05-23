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
   
// MySearchDlg.cpp : implementation file
//

#include "stdafx.h"
#include "稳恒电路.h"
#include "MyEditCtrl.h"
#include "MySearchDlg.h"

#define IDC_EDIT_KEYWORD 3000
/////////////////////////////////////////////////////////////////////////////
// MySearchDlg dialog


MySearchDlg::MySearchDlg(	SEARCH_BY &searchBy,
							BODY_TYPE &seachRange,
							bool &isWholeWord,
							bool &isMatchCase,
							char * keyWord,
							bool &isSearchPre,
							CWnd * pParent /*=NULL*/)
	: CDialog(MySearchDlg::IDD, pParent),
	m_searchBy(searchBy),
	m_searchRange(seachRange),
	m_isWholeWord(isWholeWord),
	m_isMatchCase(isMatchCase),
	m_keyWord(keyWord),
	m_isSearchPre(isSearchPre)
{
	//{{AFX_DATA_INIT(MySearchDlg)
		// NOTE: the ClassWizard will add member initialization here
	//}}AFX_DATA_INIT
}


BEGIN_MESSAGE_MAP(MySearchDlg, CDialog)
	//{{AFX_MSG_MAP(MySearchDlg)
	ON_CBN_SELCHANGE(IDC_COMBO_SEARCH_RANGE, OnSearchRangeChange)
	ON_CBN_SELCHANGE(IDC_COMBO_SEARCH_BY, OnSearchByChange)
	//}}AFX_MSG_MAP
END_MESSAGE_MAP()

/////////////////////////////////////////////////////////////////////////////
// MySearchDlg message handlers

BOOL MySearchDlg::OnInitDialog() 
{
	CDialog::OnInitDialog();

	//电学元件类型列表控件
	CComboBox * pWnd = (CComboBox *)GetDlgItem(IDC_COMBO_CTRL_TYPE);
	for(int i=0; i<CTRL_TYPE_NUM; ++i)
		pWnd->AddString(CTRL_STYLE_NAME[i]);
	pWnd->SetCurSel(0);

	//关键字输入框
	RECT rect;
	rect.left = 108;
	rect.top = 80;
	rect.right = 114;
	rect.bottom = 24;
	new MyEditCtrl(	m_hWnd, 
					rect, 
					m_keyWord, 
					IDC_EDIT_KEYWORD, 
					DATA_STYLE_LPCTSTR, 
					false);

	//搜索依据选项
	pWnd = (CComboBox *)GetDlgItem(IDC_COMBO_SEARCH_BY);
	pWnd->SetCurSel(m_searchBy);

	//搜索范围
	pWnd = (CComboBox *)GetDlgItem(IDC_COMBO_SEARCH_RANGE);
	switch(m_searchRange)
	{
	case BODY_ALL:	//所有物体
		pWnd->SetCurSel(0);
		break;

	case BODY_LEAD:	//导线
		pWnd->SetCurSel(1);
		break;

	case BODY_CRUN:	//结点
		pWnd->SetCurSel(2);
		break;

	case BODY_ALLCTRL:	//所有电学元件
		pWnd->SetCurSel(3);
		break;

	default:	//某种电学元件
		pWnd->SetCurSel(4);
		pWnd = (CComboBox *)GetDlgItem(IDC_COMBO_CTRL_TYPE);
		pWnd->SetCurSel(m_searchRange);
		break;
	}
	OnSearchRangeChange();

	//全词匹配
	((CButton *)GetDlgItem(IDC_ISWHOLEWORD))->SetCheck(m_isWholeWord);

	//区分大小写
	((CButton *)GetDlgItem(IDC_ISMATCHCASE))->SetCheck(m_isMatchCase);

	//搜索方向
	((CButton *)GetDlgItem(IDC_DIRNEXT - m_isSearchPre))->SetCheck(TRUE);

	return TRUE;
}

void MySearchDlg::OnSearchRangeChange() 
{
	CComboBox * pWnd = (CComboBox *)GetDlgItem(IDC_COMBO_SEARCH_RANGE);
	int searchRange = pWnd->GetCurSel();

	RECT rect;
	GetWindowRect(&rect);
	pWnd = (CComboBox *)GetDlgItem(IDC_COMBO_CTRL_TYPE);
	if(searchRange == 4)	//搜索某种电学元件
	{
		rect.right = rect.left + 440;
		pWnd->EnableWindow(true);
	}
	else
	{
		rect.right = rect.left + 240;
		pWnd->EnableWindow(false);
	}
	MoveWindow(&rect);

	pWnd = (CComboBox *)GetDlgItem(IDC_COMBO_SEARCH_BY);
	if(searchRange == 1)	//搜索导线
	{
		pWnd->EnableWindow(false);
		pWnd->SetCurSel(1);
		OnSearchByChange();
	}
	else
	{
		pWnd->EnableWindow(true);
	}
}

void MySearchDlg::OnSearchByChange() 
{
	CComboBox * pWnd = (CComboBox *)GetDlgItem(IDC_COMBO_SEARCH_BY);
	MyEditCtrl * edit = (MyEditCtrl *)GetDlgItem(IDC_EDIT_KEYWORD);

	m_searchBy = (enum SEARCH_BY)pWnd->GetCurSel();

	if(SEARCH_BY_NAME == m_searchBy)
	{
		edit->ChangeDataStyle(DATA_STYLE_LPCTSTR);
	}
	else
	{
		edit->ChangeDataStyle(DATA_STYLE_UINT);
	}
}

BOOL MySearchDlg::DestroyWindow() 
{
	//获取搜索依据
	CComboBox * pWnd = (CComboBox *)GetDlgItem(IDC_COMBO_SEARCH_BY);
	m_searchBy = (enum SEARCH_BY)pWnd->GetCurSel();

	//获取搜索范围
	pWnd = (CComboBox *)GetDlgItem(IDC_COMBO_SEARCH_RANGE);
	switch(pWnd->GetCurSel())
	{
	case 0:	//所有物体
		m_searchRange = BODY_ALL;
		break;

	case 1:	//导线
		m_searchRange = BODY_LEAD;
		break;

	case 2:	//结点
		m_searchRange = BODY_CRUN;
		break;

	case 3:	//所有电学元件
		m_searchRange = BODY_ALLCTRL;
		break;

	case 4:	//某种电学元件
		pWnd = (CComboBox *)GetDlgItem(IDC_COMBO_CTRL_TYPE);
		m_searchRange = (enum BODY_TYPE)pWnd->GetCurSel();
		break;
	}

	//获取是否全词匹配
	m_isWholeWord = ((CButton *)GetDlgItem(IDC_ISWHOLEWORD))->GetCheck() != 0;

	//获取是否区分大小写
	m_isMatchCase = ((CButton *)GetDlgItem(IDC_ISMATCHCASE))->GetCheck() != 0;

	//获取搜索关键字
	GetDlgItemText(IDC_EDIT_KEYWORD, m_keyWord, NAME_LEN);

	//获取搜索前一个还是后一个
	m_isSearchPre = ((CButton *)GetDlgItem(IDC_DIRPRE))->GetCheck() != 0;

	//删除关键字对话框
	CWnd * t = GetDlgItem(IDC_EDIT_KEYWORD);
	t->DestroyWindow();
	t->Detach();
	delete t;

	return CDialog::DestroyWindow();
}
