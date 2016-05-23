#if !defined(AFX_COUNTSTRUCT_FDEF)
#define AFX_COUNTSTRUCT_FDEF


//计算结构体--------------------------------------------
class	CIRCU;		//线路,不包括结点,由结点连接
class	CRUN2;		//用于计算的结点类
struct	CRUNMAP;	//包含每2个结点之间的路径
struct	ROAD;		//2个结点之间连接的路径
struct	ROADSTEP;
//计算结构体--------------------------------------------


//计算结构体--------------------------------------------
class CRUN2
{
public:
	CIRCU * c[4];	//指向的线路
	int group;		//属于的群,由连接的导线,节点,控件组成
	CRUN2()
	{
		c[0] = c[1] = c[2] = c[3] = NULL;
		group = -1;	//-1代表不属于群组
	}
};

class CIRCU	//线路,不包括结点,由结点连接,电流方向为from->to
{
public:
	int eleNum;				//线路电流编号,默认编号是地址编号
	double pressure;		//起点与终点的电势差(U0 - U1)
	double resistance;		//电阻(一般>=0, <0代表无穷大,断路)
	ELEC_STATE elecDir;		//电流状态标记
	double elec;			//线路电流大小
	CRUN2 * from, * to;		//起点和终点结点
	char dirFrom, dirTo;	//起点和终点结点的方向
	int numInGroup;			//在群组内的序号

	CIRCU()
	{
		eleNum = 0;
		resistance = elec = 0;
		elecDir = NORMALELEC;
		from = to = NULL;
		dirFrom = dirTo = 0;
		numInGroup = 0;
	}

	void ConvertWhenElecLessZero()	//当电流负数时改为正数,并调转电流方向
	{
		if(elec >= 0) return;
		if(elecDir != NORMALELEC) return;

		pressure = -pressure;
		elec = -elec;

		CRUN2 * tempCrun2 = from;
		from = to;
		to = tempCrun2;

		char tempDir = dirFrom;
		dirFrom = dirTo;
		dirTo = tempDir;
	}
};

struct ROADSTEP //2个结点之间路径上的一个结点
{
	int crunNum;
	struct ROADSTEP * next;
	struct ROADSTEP * pre;
};

struct ROAD
{
	ROADSTEP * first;
	ROADSTEP * last;

	ROAD()
	{
		first = last = NULL ;
	}

	~ROAD()
	{
		if(first == NULL || last == NULL) return;
		ROADSTEP * now = first, * next;
		while(now)
		{
			next = now->next;
			delete now;
			now = next;
		}
	}

	void Clone(ROAD &);				//复制
	bool HaveRoadPoint(int);		//判断是否有结点point
	bool HaveRoadStep(int, int);	//判断是否有路径: from->to 或者 to->from
	void InsertPointAtTail(int);	//在最后加入结点
	void SaveRoadToFile(FILE *);	//保存路径到文件,测试函数

};

struct CRUNMAP
//包含每两个结点之间是否直接连接
{
	int size;			//包含的结点数
	int circuNum;		//包含的线路数
	int * crunTOorder;	//离散的结点编号对应到 0 ~ size-1

	//-1 有间接连接 ;
	//0  无连接(目前没有找到路径) ;
	//1  只有有一条直接连接,目前没有找到路径 ;
	//2  有多条路径,或者只有一条有直接连接,但是找到了路径 ;
	char *	direct;

	CIRCU ** firstcircu;	//连接2个结点的第一个线路
	int * dir;				//连接2个结点的第一个线路相对于序号小的结点的导线编号(0,1,2,3)

	void Init(int size)//初始化内存
	{
		int bufSize = size*(size-1)/2;

		this->size	= size;
		crunTOorder	= new int		[size];
		direct		= new char		[bufSize];
		firstcircu	= new CIRCU *	[bufSize];
		dir			= new int		[bufSize];
	}

	void Uninit()//释放内存
	{
		delete [] crunTOorder;
		delete [] direct;
		delete [] firstcircu;
		delete [] dir;
	}
};
//计算结构体------------------------------------------

//ROAD成员函数----------------------------------------
void ROAD::Clone(ROAD &newRoad)
//复制
{
	ROADSTEP * temp, * now, * pre;

	newRoad.first = newRoad.last = NULL;
	if(first == NULL) return;

	temp = first;
	now = newRoad.first = new ROADSTEP;
	now->crunNum = temp->crunNum;
	now->pre = NULL;
	if(temp->next != NULL)
	{
		now->next = new ROADSTEP;
		pre = now;
		now = now->next;
		now->pre = pre;

		temp = temp->next;
	}
	else
	{
		now->next = NULL;
		newRoad.last = now;
		return;
	}

	while(temp != NULL)
	{
		now->crunNum = temp->crunNum;
		if(temp->next != NULL)
		{
			now->next = new ROADSTEP;
			pre = now;
			now = now->next;
			now->pre = pre;

			temp = temp->next;
		}
		else
		{
			now->next = NULL;
			newRoad.last = now;
			return;
		}
	}

}

bool ROAD::HaveRoadPoint(int point)
//判断是否有结点point
{
	ROADSTEP * now = first;
	while(now != NULL)
	{
		if(now->crunNum == point)
			return true;
		now = now->next;
	}
	return false;
}

bool ROAD::HaveRoadStep(int from, int to)
//判断是否有from->to路径
{
	if(!first)return false;
	ROADSTEP * pre = first;
	ROADSTEP * now = pre->next;
	while(now != NULL)
	{
		if(pre->crunNum == from && now->crunNum == to 
			|| pre->crunNum == to && now->crunNum == from)
			return true;
		pre = now;
		now = now->next;
	}
	return false;
}

void ROAD::InsertPointAtTail(int crunNum)
//在最后加入结点
{
	ROADSTEP * now;

	if(first != NULL)
	{
		last->next = now = new ROADSTEP;
		now->pre = last;
		last = now;
		now->crunNum = crunNum;
		now->next = NULL;
	}
	else
	{
		first = last = now = new ROADSTEP;
		now->crunNum = crunNum;
		now->next = now->pre = NULL;
	}
}

void ROAD::SaveRoadToFile(FILE * fp)
//以文字形式保存,测试函数
{
	ROADSTEP * now = first;
	while(now != NULL)
	{
		fprintf(fp, "%4d->", now->crunNum);
		now = now->next;
	}
}
//ROAD成员函数---------------------------------------------


#endif	//!defined(AFX_COUNTSTRUCT_FDEF)