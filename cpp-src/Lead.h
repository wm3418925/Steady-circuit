#if !defined(AFX_LEAD_FDEF)
#define AFX_LEAD_FDEF


#include "Pointer.h"	//物体指针类


struct LEADSTEP	//导线使用的存储导线的结构体
{
	POINT pos;
	LEADSTEP *next;
};


class LEAD	//导线类
{
	static unsigned long s_initNum;	//初始化次序
	LEADSTEP coord;					//起点到终点的所有坐标
	unsigned long initNum;			//初始化次序

public:

	int num;			//地址编号
	enum COLOR color;	//5种颜色:黑红黄绿蓝
	Pointer conBody[2];	//导线的2个连接对象

	double elec;		//流过控件的电流的 大小(在方向定义下的大小)
	ELEC_STATE elecDir;	//流过控件的电流的 方向

private:

	LEAD(const LEAD &);				//不允许直接复制对象
	void operator =(const LEAD &);	//不允许直接赋值对象
	void Uninit();					//释放导线占用的空间

	void CleanLead();						//删除有相同坐标的导线结点
	void FitStart(int);						//使导线不遮挡连接的第1个物体
	void FitEnd(int);						//使导线不遮挡连接的第2个物体
	void MakeFit();							//当新的导线位置覆盖连接的物体时,美化导线
	int  GetPosFit(int, int, int, bool);	//在2段平行导线之间或两边找到合适的另一个平行导线的位置

public:
	LEAD(int, const Pointer &, const Pointer &, bool isInit=true, COLOR color=BLACK);
	~LEAD();
	LEAD * Clone(CLONE_PURPOSE);							//复制
	unsigned long GetInitOrder()const;						//获得初始化序号
	static void ResetInitNum();								//重置初始化次序
	void SaveToFile(FILE *)const;							//保存导线信息到文件
	void ReadFromFile(FILE *, LEAD **, CRUN **, CTRL **);	//从文件读取导线信息
	void SaveToTextFile(FILE * fp)const;					//保存到文本文件,测试函数
	void PaintLead(CDC *)const;								//画导线
	void GetStartEndPos(POINT &, POINT &)const;				//获得导线开始位置和结尾坐标
	int  GetBodyPos()const;									//获得导线两个连接物体的相对位置
	void GetDataList(const char * name, LISTDATA * list);	//与CProperty交换信息
	void RefreshPos();										//连接物体坐标改变,更新导线位置
	void EasyInitPos(POINT from, POINT to);					//粗糙的初始化导线坐标
	bool Divide(int, POINT, LEADSTEP &, LEADSTEP &);		//导线坐标一分为二
	void ReplacePos(LEADSTEP);								//替换原来的坐标
	int  At(POINT p)const;									//获得鼠标在导线的位置
	bool Move(int dir, POINT pos, const int);				//移动导线

};


#endif	//!defined(AFX_LEAD_FDEF)