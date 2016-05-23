#if !defined(AFX_CIRCUITCLASS_FDEF)
#define AFX_CIRCUITCLASS_FDEF


#include "Pointer.h"			//物体指针类
#include <vector>				//vector容器类
using namespace std;


const long CTRL_BITMAP_TYPE_NUM = 7;					//控件位图种类的个数
const long CTRL_BITMAP_NUM = CTRL_BITMAP_TYPE_NUM*4;	//控件位图的个数(包括旋转之后的)

const long FILE_VERSION			= 13;					//文件版本,不同版本文件不予读取
const long FILE_RESERVE_SIZE	= 256;					//文件保留域的大小
const long MAXMOVEBODYDIS		= 50;					//使用方向键一次移动物体距离范围1~MAX_MOVEBODYDIS
const long MAXLEAVEOUTDIS		= 15;					//相邻导线合并距离范围1~MAX_LEAVEOUTDIS


class	Equation;	//计算N元1次方程组的类
class	CIRCU;		//线路,不包括结点,由结点连接
class	CRUN2;		//用于计算的结点类
struct	CRUNMAP;	//包含每2个结点之间的路径
struct	ROAD;		//2个结点之间连接的路径
struct	ROADSTEP;	//2个结点之间连接的路径的一段


#define CONVERT(a,b,size)	size*a-(a+1)*a/2+b-a-1	//用于CRUNMAP成员的访问


const COLORREF LEADCOLOR[COLOR_TYPE_NUM + 1] =
{
	RGB(  0,   0,   0),
	RGB(240,  10,  10),
	RGB(200, 200,  10),
	RGB(  0, 200,   0),
	RGB(  0,   0, 230),
	RGB(200,  30, 200)
};	//6种颜色对应的RGB数值,最后一种只在特殊功能显示的时候使用


struct CircuitInfo	//存储电路撤销时需要存储的信息
{
	CRUN	** crun;			//存储结点
	CTRL	** ctrl;			//存储控件
	LEAD	** lead;			//存储导线
	unsigned short crunNum;		//结点的个数
	unsigned short leadNum;		//控件的个数
	unsigned short ctrlNum;		//导线的个数
	Pointer focusBody;			//焦点物体
};
typedef vector<CircuitInfo> MyVector;
typedef vector<CircuitInfo>::iterator MyIterator;


class Manager
{
private:
	Manager(const Manager &);			//不允许直接复制对象
	void operator =(const Manager &);	//不允许直接赋值对象

	//画图变量---------------------------------------------------------------------
	CDC ctrlDcMem[CTRL_BITMAP_NUM];
	CBitmap ctrlBitmap[CTRL_BITMAP_NUM];	//CTRL_BITMAP_NUM个控件位图
	CDC showConnectDcMem;
	CBitmap showConnectBitmap;		//激活点位图
	CDC crunDcMem;
	CBitmap crunBitmap;				//结点位图

	CPen hp[COLOR_TYPE_NUM];		//COLOR_TYPE_NUM种颜色画笔

	HCURSOR hcSizeNS;				//南北双箭头
	HCURSOR hcSizeWE;				//东西双箭头
	HCURSOR hcShowConnect;			//连接导线时鼠标
	HCURSOR hcHand;					//手
	HCURSOR hcMoveHorz;				//移动竖直导线时显示
	HCURSOR hcMoveVert;				//移动水平导线时显示
	HCURSOR hcAddCrun;				//添加物体时显示

	enum COLOR textColor;			//字体颜色
	enum LEADSTYLE focusLeadStyle;	//焦点导线样式
	enum COLOR focusCrunColor;		//焦点结点颜色
	enum COLOR focusCtrlColor;		//焦点控件颜色

	//窗口显示---------------------------------------------------------------------
	CWnd * wndPointer;			//当前窗口指针
	CDC  * dc;					//当前窗口设备描述表
	CDC dcForRefresh;			//使刷新不闪而使用的DC
	CBitmap bitmapForRefresh;	//使刷新不闪而使用的bitmap

	//电路元件变量-----------------------------------------------------------------
	CRUN	* crun[MAXCRUNNUM];	//存储结点
	CTRL	* ctrl[MAXCTRLNUM];	//存储控件
	LEAD	* lead[MAXLEADNUM];	//存储导线
	unsigned short crunNum;		//结点的个数
	unsigned short leadNum;		//控件的个数
	unsigned short ctrlNum;		//导线的个数

	//相对变量---------------------------------------------------------------------
	POINT viewOrig;			//视角初始坐标
	SIZE mouseWheelSense;	//mouseWheel的灵活度
	UINT moveBodySense;		//按上下左右键一次物体移动的距离
	UINT maxLeaveOutDis;	//一段导线,相邻两节合并临界距离

	//鼠标点击信息记录-------------------------------------------------------------
	BODY_TYPE addState;		//记录要添加的物体种类
	unsigned short motiNum;	//记录鼠标激活的部件的个数,LBUTTONDOWN消息激活的
	Pointer motiBody[2];	//记录鼠标激活的部件
	POINT lButtonDownPos;	//记录上一次鼠标左键按下的坐标
	//上次鼠标是否点击了物体,在LBUTTONDOWN时记录,在LBUTTONUP用于判断
	bool lButtonDownState;
	//记录WM_LBUTTONDOWN后在下一个鼠标WM_LBUTTONDOWN到来前,有没有接受到WM_LBUTTONUP
	bool isUpRecvAfterDown;

	//鼠标移动消息记录-------------------------------------------------------------
	Pointer lastMoveOnBody;	//上一个鼠标激活的部件,MOUSEMOVE消息激活的
	POINT lastMoveOnPos;	//记录上次鼠标移动到的坐标,用于移动物体

	//获得鼠标点击焦点物体---------------------------------------------------------
	Pointer focusBody;		//焦点物体

	//剪切板变量-------------------------------------------------------------------
	Pointer clipBody;		//指向剪切板里物体,它不在当前电路,在另一个内存,需要释放

	//文件保存路径变量-------------------------------------------------------------
	char fileName[256];		//保存当前进行操作的文件路径

	//计算变量---------------------------------------------------------------------
	CRUN2 * crun2;				//CRUN2结构体,个数同 crun 是 crunNum
	CIRCU * circu;				//线路,个数<= crun*2 ,由 circuNum 记录
	CRUNMAP * maps;				//保存所有的线路
	unsigned short circuNum;	//线路个数
	unsigned short groupNum;	//组数,同一组的在一个连通图中,分组建立方程
	Equation ** equation;		//方程处理的类

	//显示电势差变量---------------------------------------------------------------
	Pointer pressStart;			//计算电势差的起始位置,只能指向导线或者节点
	Pointer pressEnd;			//计算电势差的结束位置,只能指向导线或者节点
	double startEndPressure;	//记录pressStart到pressEnd之间的电势差

	//撤销变量
	MyVector circuitVector;		//电路信息容器
	MyIterator vectorPos;		//当前在容器的位置

private:

	//1初始化和清理空间------------------------------------------------------------
	void InitBitmap();			//初始化位图
	void UninitBitmap();		//释放位图

	//2撤销函数--------------------------------------------------------------------
	void PutCircuitToVector();					//将当前电路信息保存到容器
	void ReadCircuitFromVector(MyIterator);		//从容器读取电路信息
	void DeleteVector(MyIterator, MyIterator);	//删除连续的一段容器内容
	void CloneCircuitBeforeChange();			//复制当前电路到容器
	void UpdateUnReMenuState();					//更新撤销和重复菜单状态

	//3画图函数--------------------------------------------------------------------
	void PaintCrun(const CRUN *, bool isPaintName=true);	//画结点
	void PaintCrunText(const CRUN *)const;					//画结点名称
	void PaintCtrl(CTRL *, bool isPaintName=true);			//画控件
	void PaintCtrlText(const CTRL *)const;					//画控件名称
	void PaintLead(LEAD * l);								//画导线
	void PaintAllLead();									//画所有导线
	void PaintMouseMotivate(const Pointer &);				//画有效部位被激活的图
	void PaintLeadWithStyle(LEAD *, int, enum COLOR);		//用指定样式画虚线导线
	void PaintCrunWithColor(CRUN *, enum COLOR);			//用指定颜色画结点
	void PaintCtrlWithColor(CTRL *, enum COLOR);			//用指定颜色画控件
	void PaintWithSpecialColor(const Pointer &, bool);		//用保留颜色(紫色)显示
	void PaintInvertBodyAtPos(const Pointer &, POINT);		//在指定位置显示物体的反相

	//4其他函数--------------------------------------------------------------------
	CDC * GetCtrlPaintHandle(const CTRL *);			//获得控件画图句柄
	void GetName(const Pointer &, char *)const;		//获得名称
	bool DeleteNote(const Pointer &);				//删除提示
	void ClearCircuitState();						//清除电路状态
	Pointer GetBodyPointer(FOCUS_OR_POS &);			//获得物体指针

	//5编辑函数--------------------------------------------------------------------
	void AddLead(Pointer, Pointer);	//用导线连接2个物体
	void AddCrun(POINT);			//添加孤立的结点
	void AddCtrl(POINT, BODY_TYPE);	//添加孤立的控件
	void DeleteLead(LEAD *);		//完成删除连接2个物体的连线的具体操作
	void DeleteSingleBody(Pointer);	//删除一个物体
	void Delete(Pointer);			//删除Pointer结构指向的物体
	bool ConnectBodyLead(POINT);	//连接一个连接点和导线

	//6鼠标消息处理函数------------------------------------------------------------
	void PosBodyMove(Pointer *, POINT, POINT);			//鼠标托动物体
	bool PosBodyClone(const Pointer *, POINT, POINT);	//在制定位置复制物体
	bool MotivateAll(POINT &);							//搜索鼠标在物体的什么位置
	bool ShowAddLead(POINT);							//连接导线过程显示
	bool ShowAddBody(POINT);							//添加物体过程显示
	bool ShowMoveBody(POINT, bool);						//移动物体过程显示
	bool ShowMoveLead(bool);							//移动导线过程显示

	//8运算函数--------------------------------------------------------------------
	//将2个连接组 的组号 合并
	void CombineGroup(int, int, int *, int);
	//获得2个crun2结点直接连接的线路个数
	char GetCrun2ConnectNum(int, int);
	//由结点编号获得第一个连接他们的线路
	CIRCU * GetCrun2FirstCircu(int, int, int &);
	//将from,to结点第一个连接线路的电流电阻放入缓冲
	void PutIntoBuf(int, int, CRUNMAP *, double *);
	//建立结点方程,输出到缓存上
	int CreateCrunEquation(CRUN2 *, double *);
	//遍历一次电路,获得每个群组的线路电学信息
	void CollectCircuitInfo();
	//从指定物体遍历,将线路电流赋值到物体上
	void TravelCircuitPutElec(Pointer, const CRUN *, int, double, ELEC_STATE);
	//从指定物体遍历,将断路物体设置电流断路
	void TravelCircuitFindOpenBody(Pointer, int);
	//从指定物体遍历,获得电压和电阻信息,自己是终点
	ELEC_STATE TravelCircuitGetOrSetInfo(Pointer, int, double &, ELEC_STATE);
	//将计算的电流结果分布到每个导线和控件
	void DistributeAnswer();
	//形成一个结点j 到 其他结点的路径,屏蔽j k之间的直接连线
	bool FindRoad(const CRUNMAP *, ROAD *, int, int);
	//根据线路信息,分群组建立方程
	void CreateEquation();

	//10处理剪切板函数-------------------------------------------------------------
	void ClearClipboard();					//清空剪切板
	void CopyToClipboard(const Pointer &);	//拷贝body指向的物体到剪切板

	//11鼠标焦点函数(焦点由鼠标左击获得)-------------------------------------------
	void UpdateEditMenuState();				//更新编辑菜单状态
	void FocusBodyClear(const Pointer *);	//删除焦点
	void FocusBodySet(const Pointer &);		//设置焦点
	bool FocusBodyPaint(const Pointer *);	//画焦点

public:

	//1初始化和清理空间------------------------------------------------------------
	Manager(CWnd *);
	~Manager();

	//2撤销函数--------------------------------------------------------------------
	void UnDo();		//撤销
	void ReDo();		//重复

	//3画图函数--------------------------------------------------------------------
	void PaintAll();	//显示所有的物体

	//4其他函数--------------------------------------------------------------------
	void SetAddState(BODY_TYPE);		//设置添加何种物体
	void SaveAsPicture(const char *);	//保存电路到图片

	//6鼠标消息处理函数------------------------------------------------------------
	void Property(FOCUS_OR_POS &, bool);	//显示和改变物体属性
	void ChangeCtrlStyle(FOCUS_OR_POS &);	//改变控件类型
	bool ShowBodyElec(FOCUS_OR_POS &);		//显示流过某个物体的电流
	bool LButtonDown(POINT);				//处理WM_LBUTTONDOWN
	bool LButtonUp(POINT);					//处理WM_LBUTTONUP
	void MouseMove(POINT, bool);			//处理WM_MOUSEMOVE
	bool AddBody(POINT);					//添加物体(控件或结点)
	bool Delete(FOCUS_OR_POS &);			//删除
	void RotateCtrl(FOCUS_OR_POS &, int);	//旋转控件
	BODY_TYPE PosBodyPaintRect(POINT);		//突出右击物体
	void Help(POINT pos);					//按F1寻求帮助
	bool SearchNext(SEARCH_BY, BODY_TYPE, bool, bool, char *);	//搜索下一个物体
	bool SearchPre(SEARCH_BY, BODY_TYPE, bool, bool, char *);	//搜索上一个物体

	//7文件函数--------------------------------------------------------------------
	const char * GetFilePath();		//获取文件路径
	bool SaveFile(const char *);	//保存电路到文件
	bool ReadFile(const char *);	//从文件读取电路
	void CreateFile();				//建立新的空文件

	//8运算函数--------------------------------------------------------------------
	void CountElec();	//计算电流

	//9测试函数--------------------------------------------------------------------
	void SaveCircuitInfoToTextFile();	//保存电路信息到文本文件
	void SaveCountInfoToTextFile();		//保存计算过程到文本文件

	//10处理剪切板函数-------------------------------------------------------------
	bool GetClipboardState();			//获取剪切板是否可用
	Pointer CopyBody(FOCUS_OR_POS &);	//复制物体到剪切板
	void CutBody(FOCUS_OR_POS &);		//剪切物体到剪切板
	bool PasteBody(POINT pos);			//粘贴物体到坐标

	//11焦点物体函数---------------------------------------------------------------
	void FocusBodyChangeUseTab();	//用户按Tab键切换焦点处理
	bool FocusBodyMove(int);		//用户按上下左右键移动焦点物体

	//12设置函数-------------------------------------------------------------------
	void SetViewOrig(int, int);		//设置画图的初始坐标
	void SetMoveBodySense();		//设置按方向键一次移动物体的距离
	void SetTextColor();			//设置字体颜色
	void SetFocusLeadStyle();		//设置焦点导线样式
	void SetFocusCrunColor();		//设置焦点结点颜色
	void SetFocusCtrlColor();		//设置焦点控件颜色
	void SetLeaveOutDis();			//设置最大导线合并距离

	//13显示电势差函数-------------------------------------------------------------
	void ClearPressBody();			//清空显示电势差的成员变量
	bool SetStartBody(POINT);		//设置计算电势差的起始位置
	bool NextBodyByInputNum(UINT);	//用户输入数字1,2,3,4来移动电势差结尾位置
	bool ShowPressure();			//显示从起始位置到结尾位置的电势差(U0-U1)

};

////////////////////////////////////////////////////////////////////////////////
//需要使用DPtoLP的函数 : (这个函数将设备坐标转换为逻辑坐标
//PaintAll是为了画覆盖原客户区矩形需要的转换
//其他函数都是接收了窗口传来的坐标的转换)
//PaintAll,MotivateAll,LButtonUp,ShowAddLead,ShowMoveBody,PasteBody,AddThing
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
//!	运算函数总体思路:
//	1,		没有结点的环路,暂时不予计算,结果不便保存,在DistributeAnswer计算 ;
//	2,		2个结点之间有2条或以上直接连接的导线,他们之间形成的环路,得到部分方程
//	3		仅包含一个结点的环路,直接计算出电路电流,放入方程
//	4,		形成由结点组成的线路信息 : (2个结点之间如果有2条或者以上
//			直接连线视为一条,而且direct只设置为2,代表不再计算环路.)
//			对所有只有一条直接连线连接的2条结点,
//			形成 有且只有一条本身直接连线 的环路.
//			由环路信息得出方程
//	5,		然后在方程中添加结点方程
//	6,		2~5已经获得了完整的方程,分别按组计算
//	7,		在界面中显示计算的结果(在保持输入限制的情况下)
/////////////////////////////////////////////////////////////////////////////////

#endif	//!defined(AFX_CIRCUITCLASS_FDEF)
