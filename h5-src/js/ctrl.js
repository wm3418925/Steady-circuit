struct SOURCEDATA	//电源数据
{
	double pressure;	//电压V
	double resist;		//电阻Ω
	bool   haveResist;	//是否有电阻
};

struct RESISTDATA	//电阻数据
{
	double resist;	//电阻Ω
};

struct BULBDATA		//小灯泡数据
{
	double rating;	//额定功率W
	double resist;	//电阻Ω
};

struct CAPACITYDATA	//电容器数据
{
	double capa;	//电容μF
};

struct SWITCHDATA	//开关数据
{
	bool onOff;		//开关
};

const long DATA_NOTE_RESIST			= 0;
const long DATA_NOTE_PRESS			= 1;
const long DATA_NOTE_CURRENT		= 2;
const long DATA_NOTE_RATING			= 3;
const long DATA_NOTE_CAPA			= 4;
const long DATA_NOTE_SWITCHONOFF	= 5;
const long DATA_NOTE_HAVERESIST		= 6;



//标记控件是否提供电压(1提供,0不提供)
const bool PRESSURE_TYPE[CTRL_TYPE_NUM] = {1, 0, 0, 0, 0};

//标记控件是否有电阻(1可以有电阻,-1断路,0无电阻)
const char RESISTANCE_TYPE[CTRL_TYPE_NUM] = {1, 1, 1, -1, 1};

//控件数据项个数
const long DATA_ITEM_NUM[CTRL_TYPE_NUM] = {3, 1, 2, 1, 1};

//每个电学属性对应的说明
const char DATA_NOTE[][NAME_LEN]=
{
	"电阻            (欧姆-Ω)"	,
	"电压             (伏特-U)"	,
	"电流      (安培/秒-A/S)"	,
	"额定功率     (瓦特-W)"		,
	"电容          (微发-μF)"	,
	"开关闭合"					,
	"此电源有电阻"
};


class CTRL	//控件类
{//!函数后面加了@的函数共有7个,在有新控件类型定义时需要添加新类型的处理代码

	static unsigned long s_initNum;		//初始化次序
	BODY_TYPE style;					//控件类型
	void * data;						//存储控件特有的信息,根据不同的控件类型
	unsigned long initNum;				//初始化顺序

	CTRL(const CTRL &);					//不允许直接复制对象
	void operator =(const CTRL &);		//不允许直接赋值对象

public:
	//获得控件的电压
	GetPressure: function(/*int*/direction) {
		/*double*/var pressure;	//返回电压

		if (this.hasOwnProperty("pressure")) 
		{
			if (direction != 0)
				return - this.pressure;
			else
				return   this.pressure;
		}

		return 0;
	};

public:

	long num;			//地址编号
	bool isPaintName;	//是否显示标签
	char name[NAME_LEN];//控件名
	POINT coord;		//坐标
	long dir;			//控件方向

	LEAD * lead[2];		//a,b结点的连接导线

	double elec;		//流过控件的电流的 大小(在方向定义下的大小)
	ELEC_STATE elecDir;	//流过控件的电流的 方向

private:

	double GetSpecialData()const;	//@获得控件的特征数据
	void InitData(BODY_TYPE);		//初始化控件数据部分

public:

	CTRL(long memNum, POINT pos, BODY_TYPE ctrlStyle, bool isInit = true);
	~CTRL();
	CTRL * Clone(CLONE_PURPOSE)const;			//拷贝控件信息到新的控件
	int  GetConnectNum()const;					//获得控件连接的导线数
	int  GetDirect(const LEAD *)const;			//寻找导线在哪个方向
	unsigned long GetInitOrder()const;			//获得初始化序号
	static void ResetInitNum();					//重置初始化次序
	BODY_TYPE GetStyle()const;					//获得控件类型
	void ChangeStyle(BODY_TYPE);				//改变控件类型
	void Rotate(int rotateAngle);				//旋转控件
	int  At(POINT)const;						//获得鼠标在控件的位置
	double GetPress(int direction)const;		//@获得控件的电压
	double GetResist()const;					//@获得控件的电阻
	bool IsBulbOn()const;						//@小灯泡是否达到额定功率
	bool SwitchOnOff(bool isSwitch = 1)const;	//@开关闭合或者断开
	void SaveToFile(FILE *)const;				//保存控件数据到文件
	void ReadFromFile(FILE *, LEAD **);			//从文件读取控件数据
	void GetDataList(LISTDATA *)const;			//@与CProperty交换信息
	void SaveToTextFile(FILE *)const;			//@以文字形式保存,测试函数

};