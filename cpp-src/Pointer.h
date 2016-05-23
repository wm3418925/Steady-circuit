#if !defined(AFX_ALLBODY_FDEF)
#define AFX_ALLBODY_FDEF


class Pointer	//指向3个基本物体的结构
{
public:

	union
	{
		LEAD	* p1;	//指向导线
		CRUN	* p2;	//指向结点
		CTRL	* p3;	//指向控件
	};

private:

	//物体的位置:
	// -3,-5,-7,... 横线 , -2,-4,-6,... 竖线
	// -1 物体(结点,控件)
	// 1,2,3,4 上下左右连接点
	// 0不指向物体
	// 5,6,7...不合法
	int atState;
	BODY_TYPE style;

public:

	void Clear()	//清空指针
	{
		p1 = NULL;
		atState = 0;
		style = BODY_NO;
	}
	Pointer()
	{
		Clear();
	}
	void SetAtState(int newState)	//设置addState
	{
		atState = newState;
	}
	int GetAtState()const	//获得addState
	{
		return atState;
	}
	BODY_TYPE GetStyle()const	//获得style
	{
		return style;
	}
	bool IsOnAny()const	//判断结构体是否指向物体
	{
		return atState != 0 && atState <= 4;
	}
	bool IsOnLead()const	//判断是否在导线上
	{
		return BODY_LEAD == style || atState <= -2;
	}
	bool IsOnHoriLead()const	//判断是否在水平线上
	{
		return atState <= -2 && (-atState)&1;
	}
	bool IsOnVertLead()const	//判断是否在竖直线上
	{
		return atState <= -2 && !( (-atState)&1 );
	}
	bool IsOnBody(bool type = true)const//判断是否在物体(结点或控件)上
	{
		if(type)	//判断是否在物体上,不包括连接点
			return -1 == atState && (BODY_CRUN == style || IsCtrl(style));
		else		//判断是否在物体上,包括连接点
			return BODY_CRUN == style || IsCtrl(style);
	}
	bool IsOnCrun()const	//判断是否在结点上
	{
		return BODY_CRUN == style;
	}
	bool IsOnCtrl()const	//判断是否在控件上
	{
		return IsCtrl(style);
	}
	bool IsOnConnectPos()const	//判断是否在连接点上
	{
		return atState >= 1 && atState <= 4;
	}
	void SetOnLead(LEAD * lead, bool isSetAt = true)	//指向导线
	{
		p1 = lead;
		style = BODY_LEAD;
		if(isSetAt) atState = -2;
	}
	void SetOnCrun(CRUN * crun, bool isSetAt = false)	//指向结点
	{
		p2 = crun;
		style = BODY_CRUN;
		if(isSetAt) atState = -1;
	}
	void SetOnCtrl(CTRL * ctrl, bool isSetAt = false);	//指向控件
	bool IsLeadSame(const LEAD * other)const
	//判断当前物体是否指向这个导线
	{
		return IsOnLead() && p1 == other;
	}
	bool IsCrunSame(const CRUN * other)const
	//判断当前物体是否指向这个结点
	{
		return IsOnCrun() && p2 == other;
	}
	bool IsCtrlSame(const CTRL * other)const
	//判断当前物体是否指向这个控件
	{
		return IsOnCtrl() && p3 == other;
	}
	bool IsBodySame(const Pointer * other)const
	//判断两个Pointer是否指向同一个物体,不判断atState
	{
		if(this->style != other->style) return false;
		if(IsOnLead())
			return this->p1 == other->p1;
		else if(IsOnCrun())
			return this->p2 == other->p2;
		else if(IsOnCtrl())
			return this->p3 == other->p3;
		return false;
	}
	bool IsAllSame(const Pointer * other)const
	//判断两个Pointer结构是否一样,判断atState
	{
		if(this->atState != other->atState) return false;
		return IsBodySame(other);
	}
	int GetLeadNum()const//获得连接点对应的导线编号(0,1,2,3)
	{
		return atState - 1;
	}
	static bool IsCtrl(const BODY_TYPE &type)
	{
		return type >= SOURCE && type <= SWITCH;
	}
	void GetPosFromBody(POINT & pos)const;					//从物体和连接点位置获得导线端点坐标
	void SaveToFile(FILE *)const;							//保存Pointer结构体到文件
	bool ReadFromFile(FILE *, LEAD **, CRUN **, CTRL **);	//从文件读取Pointer结构
	int  GetConnectPosDir()const;							//获得连接点位置
	void SaveToTextFile(FILE *);							//测试函数

};


#endif	//!defined(AFX_ALLBODY_FDEF)