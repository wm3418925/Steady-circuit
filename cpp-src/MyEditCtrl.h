#if !defined(AFX_MYEDITCTRL_FDEF)
#define AFX_MYEDITCTRL_FDEF

#if _MSC_VER > 1000
#pragma once
#endif // _MSC_VER > 1000
// MyEditCtrl.h : header file
//

/////////////////////////////////////////////////////////////////////////////
// MyEditCtrl window

class MyEditCtrl : public CEdit
{
	DATA_STYLE m_style;
	bool m_readOnly;

private:
	bool ValidateString();

// Construction
public:
	MyEditCtrl(HWND, RECT, char *, UINT, DATA_STYLE, bool);
	void ChangeDataStyle(DATA_STYLE style);
// Attributes
public:

// Operations
public:

// Overrides
	// ClassWizard generated virtual function overrides
	//{{AFX_VIRTUAL(MyEditCtrl)
	//}}AFX_VIRTUAL

// Implementation
public:
	virtual ~MyEditCtrl();

	// Generated message map functions
protected:
	//{{AFX_MSG(MyEditCtrl)
	afx_msg BOOL OnHelpInfo(HELPINFO * pHelpInfo);
	afx_msg void OnUpdate();
	//}}AFX_MSG
	DECLARE_MESSAGE_MAP()
};

/////////////////////////////////////////////////////////////////////////////

//{{AFX_INSERT_LOCATION}}
// Microsoft Visual C++ will insert additional declarations immediately before the previous line.

#endif // !defined(AFX_MYEDITCTRL_FDEF)
