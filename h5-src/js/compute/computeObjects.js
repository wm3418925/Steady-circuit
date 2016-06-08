
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
	CreateNew: function() {
        var c = new Array(4);
		c[0] = c[1] = c[2] = c[3] = null;   

        var newObj = {"c":c, "group":-1};   //group -1代表不属于群组
		newObj.__proto__ = CRUN2;
        return newObj;
	}
};

var CIRCU = {	//线路,不包括结点,由结点连接,电流方向为from->to
	CreateNew: function() {
        var newObj = {
            eleIndex:0,				//线路电流编号,默认编号是地址编号
	        pressure:0,		        //起点与终点的电势差(U0 - U1)
	        resistance:0,		    //电阻(一般>=0, <0代表无穷大,断路)
	        elecDir:NORMALELEC,		//电流状态标记
	        elec:0,     			//线路电流大小
	        from:null, to:null,		//起点和终点结点
	        dirFrom:0, dirTo:0,	    //起点和终点结点的方向
	        indexInGroup:0			//在群组内的序号
         };

		 newObj.__proto__ = CIRCU;
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
    CreateNew: function() {
        var newObj = {
	        crunIndex:0,
			pre:null,
	        next:null
        };
		newObj.__proto__ = ROADSTEP;
        return newObj;
    }
};

var ROAD = {
    CreateNew: function() {
        var newObj = {
	        first:null,
	        last:null
        };
		newObj.__proto__ = ROAD;
        return newObj;
    },

	/*~ROAD() {
		if (this.first == null || this.last == null) return;
		ROADSTEP * now = this.first, * next;
		while(now)
		{
			next = now->next;
			delete now;
			now = next;
		}
	}*/

    Clone: function(newRoad, srcRoad) {
	    var temp, now, pre;

	    newRoad.first = newRoad.last = null;
	    if (srcRoad.first == null) return;

	    temp = srcRoad.first;
	    now = newRoad.first = ROADSTEP.CreateNew();
	    now.crunIndex = temp.crunIndex;
	    now.pre = null;
	    if (temp.next) {
		    now.next = ROADSTEP.CreateNew();
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
		    now.crunIndex = temp.crunIndex;
		    if (temp.next) {
			    now.next = ROADSTEP.CreateNew();
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
		    if(now.crunIndex == point)
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
		    if (pre.crunIndex == from && now.crunIndex == to 
			    || pre.crunIndex == to && now.crunIndex == from)
			    return true;
		    pre = now;
		    now = now.next;
	    }
	    return false;
    },

    //在最后加入结点
    InsertPointAtTail: function(road, crunIndex) {
	    var now;

	    if (road.first) {
		    road.last.next = now = ROADSTEP.CreateNew();
		    now.pre = road.last;
		    road.last = now;
		    now.crunIndex = crunIndex;
		    now.next = null;
	    } else {
		    road.first = road.last = now = ROADSTEP.CreateNew();
		    now.crunIndex = crunIndex;
		    now.next = now.pre = null;
	    }
    }
};

//包含每两个结点之间是否直接连接
var CRUNMAP = {
	/*int size;			//包含的结点数
	int circuitCount;	//包含的线路数
	int * crunOrderMap;	//离散的结点编号对应到 0 ~ size-1

	//-1 有间接连接 ;
	//0  无连接(目前没有找到路径) ;
	//1  只有有一条直接连接,目前没有找到路径 ;
	//2  有多条路径,或者只有一条有直接连接,但是找到了路径 ;
	char *	direct;

	CIRCU ** firstCircuit;	//连接2个结点的第一个线路
	int * dir;				//连接2个结点的第一个线路相对于序号小的结点的导线编号(0,1,2,3)
    */

    CreateNew: function(size) {
        var bufSize = size*(size-1)/2;
        var newObj = {
            "size":			size,
            "circuitCount":	0,
	        "crunOrderMap":	new Array(size),
            "direct":		new Array(bufSize),
		    "firstCircuit":	new Array(bufSize),
		    "dir":			new Array(bufSize)
        };
		newObj.__proto__ = CRUNMAP;
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

	CreateNew: function(/*int */crunCount, /*int */eleCount) {
	    var m = -1;
	    var n = 0;
	    var c = null;
	    var x = null;
	    var a = null;

	    if (eleCount <= 0 || crunCount <= 0) return;	//无需初始化

	    m = eleCount + crunCount - 1;
	    n = eleCount + 1;

	    x = new Array(eleCount);
	    ZeroArray(x);
	
	    c = new Array(m);
        ZeroArray(c);
	
	    a = new Array(m);
	    for(/*int*/var i=m-1; i>=0; --i)
	    {
		    a[i] = new Array(n);
		    ZeroArray(a[i]);
	    }
		
		var newObj = {
			"gotoRow" : 0,
			"m" : m,
			"n" : n,
			"c" : c,
			"x" : x,
			"a" : a
		};
		newObj.__proto__ = Equation;
		return newObj;
    },

    /*Equation::~Equation()
    {
	    if (this.m > 0 && this.n > 1)
	    {
		    free(this.c);
		    free(this.x);
		    for(int i=this.m-1; i>=0; --i) free(this.a[i]);
		    free(this.a);
	    }
    }*/

    /*const double **/GetAnswer: function()
    //获得方程解的数组
    {
	    return this.x;
    },

    InputARow: function(/*const double * */buf)
    //输入从gotoRows开始的1行数据到主数组中
    {
	    ASSERT(this.gotoRow < this.m);

        ArrayCopyWithSize(this.a[this.gotoRow], buf, this.n);
	    ++this.gotoRow;
    },

    OutputToFile: function()
    //将方程保存到文件,测试函数
    {
	    /*int*/var i, j;

	    console.log("已输入到 第 %d 行 .\n\n", this.gotoRow);

	    console.log("x数组(解):\n");
	    for(i=0; i<this.n-1; ++i) console.log("%6.2f ", this.x[i]);

	    console.log("\n\nc数组(某一行第一个不是0的数的位置):\n");
	    for(i=0; i<this.m; ++i) console.log("%3d ", this.c[i]);

	    console.log("\n\na数组(主数组,存储n元一次方程):\n");
	    for(i=0; i<this.m; ++i)
	    {
		    for(j=0; j<this.n; ++j) console.log("%6.2f ", this.a[i][j]);
		    console.log('\n');
	    }
	    console.log('\n');
    },

    /*ELEC_STATE*/Count: function()
    {
	    /*const int*/var m = this.gotoRow;	//记录已经输入到的行,而不是this.m
        /*int*/var i, j, l, k, w;
        /*double*/var temp;
	    if(m <= 0 || this.n <= 1) return NORMALELEC;	//无须计算
	    w = this.n<m-1 ? this.n : m-1;					//w的值为m-1,n的较小值

	    for(i=this.n-2; i>=0; --i) this.x[i] = 0;

	    //化阶梯-----------------------------------------------------------------------------
	    for(l=0,k=0; l<w; ++l,++k)
	    {
		    while(k < this.n)
		    {
			    for(i=l; i<m; ++i)
				    if(!IsFloatZero(this.a[i][k])) break;
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

		    if(k == this.n)
		    {
			    if(l == 0) return NORMALELEC;	//l==0,电流都为0
			    break;
		    }

		    if(k == this.n-1) return SHORTELEC;	//电路短路

		    if(i != l)
		    {
			    for(j=k; j<this.n; ++j)
			    {
				    temp = this.a[i][j];
				    this.a[i][j] = this.a[l][j];
				    this.a[l][j] = temp;
			    }
		    }

		    for(i=l+1; i<m; ++i)
		    {
			    if(!IsFloatZero(this.a[i][k]))
			    {
				    temp = this.a[i][k] / this.a[l][k];
				    for(j=k; j<this.n; ++j) this.a[i][j] -= this.a[l][j] * temp;
			    }
			    else this.a[i][k] = 0;
		    }
	    }

	    //判断并返回电流---------------------------------------------------------------------
	    w = this.n - 1;	//m代表含有非0值行的个数
	    for(i=0; i<w; ++i)
	    {
		    for(j=i; j<this.n; ++j) if(!IsFloatZero(this.a[i][j])) break;
		    this.c[i] = j;

		    if(j > i)
		    {
			    if(j == this.n-1)
				    return SHORTELEC;		//电路短路
			    else
				    return UNCOUNTABLEELEC;	//无法计算
		    }
	    }

	    for(i=0; i<w; ++i)
	    {
		    for(j=this.n-1; j>this.c[i]; --j) this.a[i][j] /= this.a[i][this.c[i]];
		    this.a[i][this.c[i]] = 1;
	    }

	    for(l=w-1; l>0; --l) 
	    {
		    ASSERT(!IsFloatZero(this.a[l][this.c[l]]));

		    for(i=0; i<l; ++i)
		    {
			    for(j=this.c[l]+1; j<this.n; ++j) this.a[i][j] -= this.a[l][j] * this.a[i][this.c[l]];
			    this.a[i][this.c[l]] = 0;
		    }
	    }

	    for(i=this.n-2; i>=0; --i) this.x[i] = this.a[i][this.n-1];					//放入结果到数组
	    for(i=this.n-2; i>=0; --i) if(IsFloatZero(this.x[i])) this.x[i] = 0;	//近似0的数设为0

	    return NORMALELEC;	//正常返回
    }

};
