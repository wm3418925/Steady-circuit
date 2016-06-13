#if !defined(AFX_DATALIST_FDEF)
#define AFX_DATALIST_FDEF


//错误类型:
enum ERROR_TYPE
{
	ERROR_NO				= 0,	//无错
	ERROR_STRNULL			= 1,	//字符串为空
	ERROR_FLOATMIX			= 2,	//浮点数含有非法字符
	ERROR_UINTMIX			= 3,	//正整数含有非法字符
	ERROR_UINTOVER			= 4,	//正整数不在范围
	ERROR_ENUMOVER			= 5,	//枚举不是选项的某一个
	ERROR_STRMIX			= 6,	//名称标签含有非法字符 [](){}
	ERROR_ENUMNOTALLOWED	= 7,	//枚举在一些情况下不允许一些值(如:焦点物体颜色不能为黑色)
};

class ENUM_STYLE	//定义enum属性的结构体
{
	int * data;			//指向类型数据的指针,类型数据都是int型的
	int num;			//种类数
	const char ** note;	//种类对应的字符串表示

	ENUM_STYLE(const ENUM_STYLE &);			//不允许直接复制对象
	void operator =(const ENUM_STYLE &);	//不允许直接赋值对象

public:

	ENUM_STYLE(STYLE_LIST bufStyle, int * dataPoint)
	{
		int i;

		//1,获得列表大小
		data = dataPoint;
		switch(bufStyle)
		{
		case ENUM_CTRL:			//控件类型
			num = CTRL_TYPE_NUM;
			break;

		case ENUM_COLOR:		//颜色类型
			num = COLOR_TYPE_NUM;
			break;

		case ENUM_LEADSTYLE:	//导线样式
			num = LEAD_STYLE_NUM;
			break;
		default: ASSERT(false);
		}

		//2,初始化指针
		note = new const char * [num];

		//3,初始化提示字符串
		switch(bufStyle)
		{
		case ENUM_CTRL:		//控件类型
			for(i=num-1; i>=0; --i)
				note[i] = CTRL_STYLE_NAME[i];
			break;

		case ENUM_COLOR:	//颜色类型
			for(i=num-1; i>=0; --i)
				note[i] = COLORNAMES[i];
			break;

		case ENUM_LEADSTYLE:	//导线样式
			for(i=num-1; i>=0; --i)
				note[i] = LEADSTYLENAMES[i];
			break;
		}
	}

	~ENUM_STYLE()
	{
		delete [] note;
	}

	int * GetDataPoint()
	{
		return data;
	}

	int GetStyleNum()
	{
		return num;
	}

	const char ** GetNote()
	{
		return note;
	}
};

class LISTDATA	//数据列表信息类
{
	int gotoRow;	//输入到的行
	int listSize;	//列表大小

	LISTDATA(const LISTDATA &);			//不允许直接复制对象
	void operator =(const LISTDATA &);	//不允许直接赋值对象

public:

	DATA_STYLE * listStyle;	//每个数据项类型
	long * minData;			//如果是short,int,long等整型数据,有最小值
	long * maxData;			//如果是short,int,long等整型数据,有最大值
	char ** noteText;		//每个数据项类型提示信息
	void ** dataPoint;		//数据

	LISTDATA()
	{
		gotoRow   = 0;
		listSize  = 0;
		minData  = NULL;
		maxData  = NULL;
		listStyle = NULL;
		dataPoint = NULL;
		noteText  = NULL;
	}

	~LISTDATA()
	{
		for(int i=listSize-1; i>=0; --i)
			delete [] noteText[i];
		delete [] noteText;

		for(int i=listSize-1; i>=0; --i)if(DATA_STYLE_enum == listStyle[i])
			delete ((ENUM_STYLE *)(dataPoint[i]));
		delete [] dataPoint;

		delete [] maxData;
		delete [] minData;
		delete [] listStyle;
	}

	void Init(int size)	//初始化
	{
		ASSERT(size>0 && size<100);

		listSize = size;

		listStyle	= new enum DATA_STYLE	[listSize];
		minData		= new long				[listSize];
		maxData		= new long				[listSize];
		dataPoint	= new void *			[listSize];
		noteText	= new char *			[listSize];
		for(int i=listSize-1; i>=0; --i) noteText[i] = new char[NAME_LEN];
	}

	int GetListSize()const
	{
		return listSize;
	}

	void SetAMember(DATA_STYLE style, const char * note, void * data, int min = 1, int max = 0)
	//设置列表的一项,style != DATA_STYLE_enum,当min>max表示没有大小限制
	{
		ASSERT(gotoRow < listSize && style != DATA_STYLE_enum);

		listStyle[gotoRow] = style;
		minData[gotoRow] = min;
		maxData[gotoRow] = max;
		strcpy(noteText[gotoRow], note);
		dataPoint[gotoRow] = data;

		++gotoRow;
	}

	void SetAEnumMember(const char * note, void * data, STYLE_LIST style, int min = 1, int max = 0)
	//设置style == DATA_STYLE_enum的一项,data指针指向一个ENUM_STYLE实例
	{
		ASSERT(gotoRow < listSize);

		listStyle[gotoRow] = DATA_STYLE_enum;
		minData[gotoRow] = min;
		maxData[gotoRow] = max;
		strcpy(noteText[gotoRow], note);
		dataPoint[gotoRow] = new ENUM_STYLE(style, (int *)data);

		++gotoRow;
	}

	ERROR_TYPE CheckAMember(int row, CWnd * wnd)
	//检查一行: row--行, chData--字符串数据, enumData--枚举数据
	{
		char chData[NAME_LEN];
		int enumData;

		switch(listStyle[row])
		{
		case DATA_STYLE_float:
		case DATA_STYLE_double:
			wnd->GetWindowText(chData, NAME_LEN);
			if('\0' == chData[0])
				return ERROR_STRNULL;
			else if(!StaticClass::IsFloat(chData))
				return ERROR_FLOATMIX;
			break;

		case DATA_STYLE_UINT:
			wnd->GetWindowText(chData, NAME_LEN);
			if('\0' == chData[0])
			{
				return ERROR_STRNULL;
			}
			else if(!StaticClass::IsUnsignedInteger(chData))
			{
				return ERROR_UINTMIX;
			}
			else if(minData[row] <= maxData[row])	//有大小限制
			{
				enumData = atoi(chData);
				if(enumData < minData[row] || enumData > maxData[row])
					return ERROR_UINTOVER;
			}
			break;

		case DATA_STYLE_enum:
			enumData = ((CComboBox *)(wnd))->GetCurSel();
			if(enumData < 0 || enumData >= ((ENUM_STYLE*)dataPoint[row])->GetStyleNum())
				return ERROR_ENUMOVER;
			else if(minData[row] <= maxData[row])	//有大小限制
			{
				if(enumData < minData[row] || enumData > maxData[row])
					return ERROR_ENUMNOTALLOWED;
			}
			break;

		case DATA_STYLE_LPCTSTR:	//char[NAME_LEN]
			wnd->GetWindowText(chData, NAME_LEN);
			if(!StaticClass::IsNormalStr(chData))
				return ERROR_STRMIX;
			break;
		}
		return ERROR_NO;
	}

	void SaveAMember(int row, CWnd * wnd)	//将控件用户修改的信息保存到指针指向的物体
	{
		char tempStr[NAME_LEN];

		switch(listStyle[row])
		{
		case DATA_STYLE_float:	//float
			wnd->GetWindowText(tempStr, NAME_LEN);
			*((float *)dataPoint[row]) = (float)atof(tempStr);
			break;
		case DATA_STYLE_double:	//double
			wnd->GetWindowText(tempStr, NAME_LEN);
			*((double *)dataPoint[row]) = atof(tempStr);
			break;
		case DATA_STYLE_UINT:	//UINT
			wnd->GetWindowText(tempStr, NAME_LEN);
			*((int *)dataPoint[row]) = atoi(tempStr);
			break;
		case DATA_STYLE_bool:	//bool
			*((bool*)dataPoint[row]) = 
				((CButton *)wnd)->GetCheck() != 0;
			break;
		case DATA_STYLE_LPCTSTR:	//char[NAME_LEN]
			wnd->GetWindowText((char *)dataPoint[row],NAME_LEN);
			break;
		case DATA_STYLE_enum:	//enum
			*((ENUM_STYLE*)dataPoint[row])->GetDataPoint() = 
				((CComboBox *)wnd)->GetCurSel();
			break;
		}
	}

};


#endif	//!defined(AFX_DATALIST_FDEF)
