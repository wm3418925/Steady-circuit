
//电流状态枚举
var UNKNOWNELEC	= -2,	//电流未计算
ERRORELEC		= -1,	//计算错误
NORMALELEC		= 0,	//电流正常
LEFTELEC		= 0,	//电流从左到右
RIGHTELEC		= 1,	//电流从右到左
OPENELEC		= 6,	//断路
SHORTELEC		= 7,	//短路
UNCOUNTABLEELEC	= 8;	//含有无法计算的分支


// 结构作用
//CIRCU;		//线路,不包括结点,由结点连接
//CRUN2;		//用于计算的结点类
//CRUNMAP;	    //包含每2个结点之间的路径
//ROAD;		    //2个结点之间连接的路径
//ROADSTEP;


var CRUN2 = {
	//CIRCU * c[4];     //指向的线路
	//int group;        //属于的群,由连接的导线,节点,控件组成
	createNew: function() {
        var c = new Array(4);
		c[0] = c[1] = c[2] = c[3] = null;   

        var newObj = {"c":c, "group":-1};   //group -1代表不属于群组
        return newObj;
	}
};

var CIRCU = {	//线路,不包括结点,由结点连接,电流方向为from->to
	createNew: function() {
        var newObj = {
            eleNum:0,				//线路电流编号,默认编号是地址编号
	        pressure:0,		        //起点与终点的电势差(U0 - U1)
	        resistance:0,		    //电阻(一般>=0, <0代表无穷大,断路)
	        elecDir:NORMALELEC,		//电流状态标记
	        elec:0,     			//线路电流大小
	        from:null, to:null,		//起点和终点结点
	        dirFrom:0, dirTo:0,	    //起点和终点结点的方向
	        numInGroup:0			//在群组内的序号
         };

         return newObj;
	},

	ConvertWhenElecLessZero: function(circu) {	//当电流负数时改为正数,并调转电流方向
		if(circu.elec >= 0) return;
		if(circu.elecDir != NORMALELEC) return;

		circu.pressure = -circu.pressure;
		circu.elec = -circu.elec;

		var tempCrun2 = circu.from;
		circu.from = circu.to;
		circu.to = tempCrun2;

		var tempDir = circu.dirFrom;
		circu.dirFrom = circu. dirTo;
		circu.dirTo = tempDir;
	}
};

var ROADSTEP = { //2个结点之间路径上的一个结点
    createNew: function() {
        var newObj = {
	        crunNum:0,
	        next:null,
	        pre:null
        };
        return newObj;
    }
};

var ROAD = {
    createNew: function() {
        var newObj = {
	        first:null,
	        last:null
        };
        return newObj;
    },

	/*~ROAD() {
		if(first == null || last == null) return;
		ROADSTEP * now = first, * next;
		while(now)
		{
			next = now->next;
			delete now;
			now = next;
		}
	}*/

    Clone: function(road, newRoad) {
	    var temp, now, pre;

	    newRoad.first = newRoad.last = null;
	    if (road.first == null) return;

	    temp = road.first;
	    now = newRoad.first = ROADSTEP.createNew();
	    now.crunNum = temp.crunNum;
	    now.pre = null;
	    if (temp.next) {
		    now.next = ROADSTEP.createNew();
		    pre = now;
		    now = now.next;
		    now.pre = pre;

		    temp = temp.next;
	    } else {
		    now.next = null;
		    newRoad.last = now;
		    return;
	    }

	    while (temp) {
		    now.crunNum = temp.crunNum;
		    if (temp.next) {
			    now.next = ROADSTEP.createNew();
			    pre = now;
			    now = now.next;
			    now.pre = pre;

			    temp = temp.next;
		    } else {
			    now.next = null;
			    newRoad.last = now;
			    return;
		    }
	    }
    },

    //判断是否有结点point
    HaveRoadPoint: function(road, point) {
	    var now = road.first;
	    while (now) {
		    if(now.crunNum == point)
			    return true;
		    now = now.next;
	    }
	    return false;
    },

    //判断是否有from->to路径
    HaveRoadStep: function(road, from, to) {
	    if (!road.first)
            return false;
	    var pre = road.first;
	    var now = pre.next;
	    while (now != null) {
		    if (pre.crunNum == from && now.crunNum == to 
			    || pre.crunNum == to && now.crunNum == from)
			    return true;
		    pre = now;
		    now = now.next;
	    }
	    return false;
    },

    //在最后加入结点
    InsertPointAtTail: function(road, crunNum) {
	    var now;

	    if (road.first) {
		    road.last.next = now = ROADSTEP.createNew();
		    now.pre = road.last;
		    road.last = now;
		    now.crunNum = crunNum;
		    now.next = null;
	    } else {
		    road.first = road.last = now = ROADSTEP.createNew();
		    now.crunNum = crunNum;
		    now.next = now.pre = null;
	    }
    }
};

//包含每两个结点之间是否直接连接
var CRUNMAP = {
	/*int size;			//包含的结点数
	int circuNum;		//包含的线路数
	int * crunTOorder;	//离散的结点编号对应到 0 ~ size-1

	//-1 有间接连接 ;
	//0  无连接(目前没有找到路径) ;
	//1  只有有一条直接连接,目前没有找到路径 ;
	//2  有多条路径,或者只有一条有直接连接,但是找到了路径 ;
	char *	direct;

	CIRCU ** firstcircu;	//连接2个结点的第一个线路
	int * dir;				//连接2个结点的第一个线路相对于序号小的结点的导线编号(0,1,2,3)
    */

    createNew: function(size) {
        var bufSize = size*(size-1)/2;
        var newObj = {
            "size":         size,
            "circuNum":     0,
	        "crunTOorder":  new Array(size),
            "direct":       new Array(bufSize),
		    "firstcircu":   new Array(bufSize),
		    "dir":          new Array(bufSize)
        };
        return newObj;
    }
};




var Equation = {
/*private:
	double ** a, * x;	//a存储数据主数组m*n,x是方程的解
	int m, n;			//n-1==电流的个数
	int gotoRow;		//记录已经输入到哪行
	int * c;			//c[i]存储第i行第一个不是0的数
*/

	createNew: function(/*int */crunNum, /*int */eleNum)
    {
	    gotoRow = 0;
	    m = -1;
	    n = 0;
	    c = NULL;
	    x = NULL;
	    a = NULL;

	    if(eleNum <= 0 || crunNum <= 0) return;	//无需初始化

	    m = eleNum + crunNum - 1;
	    n = eleNum + 1;

	    x = new Array(eleNum);
	    zeroArray(x);
	
	    c = new Array(m);
        zeroArray(c);
	
	    a = new Array(m);
	    for(/*int*/var i=m-1; i>=0; --i)
	    {
		    a[i] = new Array(n);
		    zeroArray(a[i]);
	    }
    },

    /*Equation::~Equation()
    {
	    if(m > 0 && n > 1)
	    {
		    free(c);
		    free(x);
		    for(int i=m-1; i>=0; --i) free(a[i]);
		    free(a);
	    }
    }*/

    /*const double **/GetAnswer: function()
    //获得方程解的数组
    {
	    return x;
    },

    InputARow: function(/*const double * */buf)
    //输入从gotoRows开始的1行数据到主数组中
    {
	    ASSERT(gotoRow < m);

        arrayCopyWithSize(a[gotoRow], buf, n);
	    ++gotoRow;
    },

    OutputToFile: function(/*FILE * */fp)
    //将方程保存到文件,测试函数
    {
	    /*int*/var i, j;

	    fprintf(fp, "已输入到 第 %d 行 .\n\n", gotoRow);

	    fputs("x数组(解):\n", fp);
	    for(i=0; i<n-1; ++i) fprintf(fp, "%6.2f ", x[i]);

	    fputs("\n\nc数组(某一行第一个不是0的数的位置):\n", fp);
	    for(i=0; i<m; ++i) fprintf(fp, "%3d ", c[i]);

	    fputs("\n\na数组(主数组,存储n元一次方程):\n", fp);
	    for(i=0; i<m; ++i)
	    {
		    for(j=0; j<n; ++j) fprintf(fp, "%6.2f ", a[i][j]);
		    fputc('\n', fp);
	    }
	    fputc('\n', fp);
    },

    /*ELEC_STATE*/Count: function()
    {
	    /*const int*/var m = gotoRow;	//记录已经输入到的行,而不是this->m
        /*int*/var i, j, l, k, w;
        /*double*/var temp;
	    if(m <= 0 || n <= 1) return NORMALELEC;	//无须计算
	    w = n<m-1 ? n : m-1;					//w的值为m-1,n的较小值

	    for(i=n-2; i>=0; --i) x[i] = 0;

	    //化阶梯-----------------------------------------------------------------------------
	    for(l=0,k=0; l<w; ++l,++k)
	    {
		    while(k < n)
		    {
			    for(i=l; i<m; ++i)
				    if(!IsFloatZero(a[i][k])) break;
			    if(i == m)
			    {
				    --w; 
				    ++k;
			    }
			    else 
			    {
				    break;
			    }
		    }

		    if(k == n)
		    {
			    if(l == 0) return NORMALELEC;	//l==0,电流都为0
			    break;
		    }

		    if(k == n-1) return SHORTELEC;	//电路短路

		    if(i != l)
		    {
			    for(j=k; j<n; ++j)
			    {
				    temp = a[i][j];
				    a[i][j] = a[l][j];
				    a[l][j] = temp;
			    }
		    }

		    for(i=l+1; i<m; ++i)
		    {
			    if(!IsFloatZero(a[i][k]))
			    {
				    temp = a[i][k] / a[l][k];
				    for(j=k; j<n; ++j) a[i][j] -= a[l][j] * temp;
			    }
			    else a[i][k] = 0;
		    }
	    }

	    //判断并返回电流---------------------------------------------------------------------
	    w = n - 1;	//m代表含有非0值行的个数
	    for(i=0; i<w; ++i)
	    {
		    for(j=i; j<n; ++j) if(!IsFloatZero(a[i][j])) break;
		    c[i] = j;

		    if(j > i)
		    {
			    if(j == n-1)
				    return SHORTELEC;		//电路短路
			    else
				    return UNCOUNTABLEELEC;	//无法计算
		    }
	    }

	    for(i=0; i<w; ++i)
	    {
		    for(j=n-1; j>c[i]; --j) a[i][j] /= a[i][c[i]];
		    a[i][c[i]] = 1;
	    }

	    for(l=w-1; l>0; --l) 
	    {
		    ASSERT(!IsFloatZero(a[l][c[l]]));

		    for(i=0; i<l; ++i)
		    {
			    for(j=c[l]+1; j<n; ++j) a[i][j] -= a[l][j] * a[i][c[l]];
			    a[i][c[l]] = 0;
		    }
	    }

	    for(i=n-2; i>=0; --i) x[i] = a[i][n-1];							//放入结果到数组
	    for(i=n-2; i>=0; --i) if(IsFloatZero(x[i])) x[i] = 0;	//近似0的数设为0

	    return NORMALELEC;	//正常返回
    }

};
