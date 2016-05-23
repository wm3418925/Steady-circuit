#if !defined(AFX_MYSEARCHDLG_FDEF)
#define AFX_MYSEARCHDLG_FDEF

/////////////////////////////////////////////////////////////////////////////
// MySearchDlg dialog

class MySearchDlg : public CDialog
{
// Construction
public:
	MySearchDlg(SEARCH_BY &searchBy,
				BODY_TYPE &seachRange,
				bool &isWholeWord,
				bool &isMatchCase,
				char * keyWord,
				bool &isSearchPre,
				CWnd * pParent = NULL);   // standard constructor

// Dialog Data
	//{{AFX_DATA(MySearchDlg)
	enum { IDD = IDD_SEARCH };
		// NOTE: the ClassWizard will add data members here
	//}}AFX_DATA


// Overrides
	// ClassWizard generated virtual function overrides
	//{{AFX_VIRTUAL(MySearchDlg)
	public:
	virtual BOOL DestroyWindow();
	//}}AFX_VIRTUAL

// Implementation
protected:
	SEARCH_BY &m_searchBy;
	BODY_TYPE &m_searchRange;
	bool &m_isWholeWord;
	bool &m_isMatchCase;
	char * m_keyWord;
	bool &m_isSearchPre;
	// Generated message map functions
	//{{AFX_MSG(MySearchDlg)
	virtual BOOL OnInitDialog();
	afx_msg void OnSearchRangeChange();
	afx_msg void OnSearchByChange();
	//}}AFX_MSG
	DECLARE_MESSAGE_MAP()
};

//{{AFX_INSERT_LOCATION}}
// Microsoft Visual C++ will insert additional declarations immediately before the previous line.

#endif // !defined(AFX_MYSEARCHDLG_FDEF)
