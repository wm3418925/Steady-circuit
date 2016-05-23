#if !defined(AFX_CRUN_FDEF)
#define AFX_CRUN_FDEF


class CRUN	//结点类
{
	static unsigned long s_initNum;	//初始化次序
	unsigned long initNum;			//初始化次序
	CRUN(const CRUN &);				//不允许直接复制对象
	void operator =(const CRUN &);	//不允许直接赋值对象

public:

	int num;				//地址编号
	bool isPaintName;		//是否显示标签
	char name[NAME_LEN];	//结点名
	POINT coord;			//坐标
	class LEAD * lead[4];	//结点连接导线的位置,0↑,1↓,2←,3→

	CRUN(int memNum, POINT p);
	unsigned long GetInitOrder()const;		//获取初始化序号
	void SaveToFile(FILE * fp)const;		//保存结点信息到文件
	void ReadFromFile(FILE *, LEAD **);		//从文件读取结点信息
	int At(POINT)const;						//获得鼠标在结点的位置
	CRUN * Clone(CLONE_PURPOSE)const;		//拷贝控件结点信息到新的结点
	void GetDataList(LISTDATA * )const;		//和CProperty交互
	int GetDirect(const LEAD *)const;		//寻找导线在哪个方向
	int GetConnectNum()const;				//获得连接了几个导线
	static void ResetInitNum();				//重置初始化次序

};


#endif	//!defined(AFX_CRUN_FDEF)