#if !defined(AFX_MYPROPERTYDLG_FDEF)
#define AFX_MYPROPERTYDLG_FDEF

#define NOTEID(i) 3000+i*2		//提示字符串的text控件ID
#define CTRLID(i) 3000+i*2+1	//相应序号的数据控件ID
/////////////////////////////////////////////////////////////////////////////
// MyPropertyDlg dialog

class MyPropertyDlg : public CDialog
{
// Construction
public:
	MyPropertyDlg(
		LISTDATA * list, 
		bool readOnly, 
		CDC * model = NULL, 
		const char * windowTitle = NULL,  
		CWnd * pParent = NULL);   // standard constructor

// Dialog Data
	//{{AFX_DATA(MyPropertyDlg)
	enum { IDD = IDD_PROPERTY };
	//}}AFX_DATA


// Overrides
	// ClassWizard generated virtual function overrides
	//{{AFX_VIRTUAL(MyPropertyDlg)
	public:
	virtual BOOL DestroyWindow();
	//}}AFX_VIRTUAL

// Implementation
protected:

	void CreateLabel(RECT, LPCTSTR, UINT);										//创建label控件
	void CreateCheck(RECT, bool, UINT nID);										//创建check控件
	void CreateCombo(RECT, int, int, const char **, UINT);						//创建Combo Box控件

	// Generated message map functions
	//{{AFX_MSG(MyPropertyDlg)
	virtual BOOL OnInitDialog();
	afx_msg void OnPaint();
	afx_msg BOOL OnHelpInfo(HELPINFO * pHelpInfo);
	virtual void OnOK();
	//}}AFX_MSG
	DECLARE_MESSAGE_MAP()

private:

	const char * m_windowTitle;	//窗口名称
	CDC * m_model;	//示例

	bool m_readOnly;		//是否只读
	POINT m_firstCtrlPos;	//第一个控件起始坐标
	SIZE m_ctrlSize;		//控件大小

	POINT m_firstNotePos;	//第一个数据提示text起始坐标
	SIZE m_noteTextSize;	//数据提示text大小

	//x表示 控件 与 数据提示text 的间距;
	//y表示 控件之间 或者 数据提示text 之间 的间距
	POINT m_inter;

	SIZE m_wndSize;	//窗口大小

	POINT m_okButtonPos;		//确定按钮的坐标
	POINT m_cancelButtonPos;	//取消按钮的坐标

	LISTDATA * m_list;	//数据列表
};

#endif // !defined(AFX_MYPROPERTYDLG_FDEF)

