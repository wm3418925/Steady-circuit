
var DATA_NOTE_RESIST		= 0;
var DATA_NOTE_PRESS			= 1;
var DATA_NOTE_CURRENT		= 2;
var DATA_NOTE_RATING		= 3;
var DATA_NOTE_CAPA			= 4;
var DATA_NOTE_SWITCHONOFF	= 5;
var DATA_NOTE_HAVERESIST	= 6;



//标记控件是否提供电压(1提供,0不提供)
var PRESSURE_TYPE[CTRL_TYPE_COUNT] = new Array(true, false, false, false, false);

//标记控件是否有电阻(1可以有电阻,-1断路,0无电阻)
var RESISTANCE_TYPE[CTRL_TYPE_COUNT] = new Array(1, 1, 1, -1, 1);

//每个电学属性对应的说明
var DATA_NOTE = new Array(
	"电阻            (欧姆-Ω)"	,
	"电压             (伏特-U)"	,
	"电流      (安培/秒-A/S)"	,
	"额定功率     (瓦特-W)"		,
	"电容          (微发-μF)"	,
	"开关闭合"					,
	"此电源有电阻"
);


//控件类
var CTRL = {//!函数后面加了@的函数共有8个,在有新控件类型定义时需要添加新类型的处理代码

	//节点全局初始化次序
	globalInitOrder: 1,
	//重置全局初始化次序
	ResetGlobalInitOrder: function() {
		return (CTRL.globalInitOrder = 1);
	},
	
	
	CreateNew: function(long memberIdx, x , y, ctrlStyle) {
		ASSERT(ctrlStyle >= 0 && ctrlStyle < CTRL_TYPE_COUNT);
		
		var initOrder = CTRL.globalInitOrder++;
		var newObj = {
			initOrder : initOrder,		//初始化序号
			index : memberIdx,			//在控件数组中序号
			
			isPaintName : true,			//默认显示结点标签
			name : "Ctrl" + initOrder,	//默认名称
			x : x, y : y,				//坐标
			lead : [null,null],			//结点连接导线的位置,0↑,1↓,2←,3→*/
			
			dir : 0,					//控件默认方向
			style : ctrlStyle,
			
			elec : 0,					//流过控件的电流的 大小(在方向定义下的大小)
			elecDir : UNKNOWNELEC		//电流方向
		};
		
		this.InitDefaultData(ctrlStyle);
        return newObj;
	},
	// 拷贝控件信息到新的控件
	Clone: function(clonePurpose) {
		var newCtrl = CTRL.CreateNew(this.index, this.x, this.y, this.style);
		newCtrl.name = this.name;
		newCtrl.isPaintName = this.isPaintName;
		newCtrl.dir = this.dir;
		CloneCtrlData(newCtrl, this);

		if (CLONE_FOR_USE != clonePurpose) {
			newCtrl.initOrder = this.initOrder;
			--CTRL.globalInitOrder;
		}
		return newCtrl;
	},
	//保存信息到json
	GenerateStoreJsonObj: function() {
		var leadIndexArray = new Array();
		for (var i=0; i<2; ++i) {
			if (lead[i] != null)
				leadIndexArray.push(lead[i].index);
			else 
				leadIndexArray.push(-1);
		}

		var storeJsonObj = {
			isPaintName : this.isPaintName,
			name : this.name,
			x : this.x, y:this.y,
			lead : leadIndexArray,
			
			dir : this.dir,
			style : this.style,
		};
		return CloneCtrlData(storeJsonObj, this);
	},
	//从json读取信息
	ReadFromStoreJsonObj: function(jsonObj, leadList) {
		ASSERT(jsonObj != null);
		ASSERT(leadList != null);

		var leadArray = new Array();
		for (var i=0; i<2; ++i) {
			if (jsonObj.lead[i] >= 0)
				leadArray.push(leadList[jsonObj.lead[i]]);
			else 
				leadArray.push(null);
		}
		
		this.isPaintName = jsonObj.isPaintName;
		this.name = jsonObj.name;
		this.x = jsonObj.x; this.y = jsonObj.y;
		this.lead = leadArray;
		
		this.dir = jsonObj.dir;
		this.style = jsonObj.style;

		CloneCtrlData(this, jsonObj);
	},
	
	// @根据类型, 初始化默认数据
	InitDefaultData: function(ctrlStyle) {
		switch (ctrlStyle) {
		case SOURCE:
			newObj.pressure = 10;
			newObj.resist = 0;
			break;
		case RESIST:
			newObj.resist = 10;
			break;
		case BULB:
			newObj.rating = 10;
			newObj.resist = 5;
			break;
		case CAPA:
			newObj.capa = 10;
			newObj.resist = -1;
			break;
		case SWITCH:
			newObj.closed = false;
			newObj.resist = -1;
			break;
		}
	},
	// @复制控件数据
	CloneCtrlData: function(toCtrl, fromCtrl) {
		toCtrl.resist = fromCtrl.resist;
		
		switch (fromCtrl.ctrlStyle) {
		case SOURCE:
			toCtrl.pressure = fromCtrl.pressure;
			break;
		case RESIST:
			break;
		case BULB:
			toCtrl.rating = fromCtrl.rating;
			break;
		case CAPA:
			toCtrl.capa = fromCtrl.capa;
			break;
		case SWITCH:
			toCtrl.closed = fromCtrl.closed;
			break;
		}
        return toCtrl;
	},
	// @获得控件的特征数据
	GetSpecialData: function() {
		switch (style) {
		case SOURCE:
			return this.pressure;
		case RESIST:
			return this.resist;
		case BULB:
			return this.rating;
		case CAPA:
			return this.capa;
		case SWITCH:
			return this.closed;
		}

		return 0;
	},
	// 获得控件的电压
	GetPressure: function(direction) {
		if (this.hasOwnProperty("pressure")) {
			if (direction != 0)
				return - this.pressure;
			else
				return   this.pressure;
		}

		return 0;
	},

	//改变控件类型
	ChangeStyle: function(newStyle) {
		ASSERT(this.style != newStyle);
		this.style = newStyle;
		InitDefaultData(newStyle);
	},

	//获得控件连接的导线数
	GetConnectNum: function() {
		return (lead[0] != NULL) + (lead[1] != NULL); 
	},

	//寻找导线在哪个方向 : 0↑,1↓,2←,3→
	GetDirect: function(l) {
		var i;
		for (i=0; i<2; ++i) {
			if (lead[i] == l) break;
		}
		if (i >= 2) return -1;	//没有找到

		ASSERT(this.dir>=0 && this.dir<4);

		switch (this.dir)	//根据控件方向判断
		{
		case 0: return 2 + i;	//0:2;1:3
		case 1: return i;		//0:0;1:1
		case 2: return 3 - i;	//0:3;1:2
		case 3: return 1 - i;	//0:1;1:0
		default: return 0;
		}
	},

	//获得鼠标在控件的位置
	At: function(xPos, yPos) {
		var ret = 0;

		var xInter = xPos - this.x - (BODYSIZE.cx>>1);
		var yInter = yPos - this.y - (BODYSIZE.cy>>1);

		if (0 == (dir&1)) {	//横向
			if (xInter < 0) {
				xInter += (BODYSIZE.cx>>1);
				if (xInter*xInter + yInter*yInter <= DD*DD) {	//选中左连接点
					if (0 == (dir&2)) ret = 1;
					else ret = 2;
				}
			} else {
				xInter -= (BODYSIZE.cx>>1);
				if (xInter*xInter + yInter*yInter <= DD*DD) {	//选中右连接点
					if (0 == (dir&2)) ret = 2;
					else ret = 1;
				}
			}
		} else { //纵向
			if (yInter < 0) {
				yInter += (BODYSIZE.cy>>1);
				if (xInter*xInter + yInter*yInter <= DD*DD) {	//选中上连接点
					if (0 == (dir&2)) ret = 1;
					else ret = 2;
				}
			} else {
				yInter -= (BODYSIZE.cy>>1);
				if (xInter*xInter + yInter*yInter <= DD*DD) {	//选中下连接点
					if (0 == (dir&2)) ret = 2;
					else ret = 1;
				}
			}
		}

		if (ret != 0) {
			if (lead[ret-1] == null)
				return ret;
			else
				return -1;
		}

		if (xPos>=this.x && xPos<this.x+BODYSIZE.cx 
			&& yPos>=this.y && yPos<this.y+BODYSIZE.cy)
			return -1;	//在控件上

		return 0;
	},

	//旋转控件
	Rotate: function(rotateAngle90) {
		this.dir = (this.dir + rotateAngle90) % 4;
		if (lead[0]!=null) lead[0]->RefreshPos();
		if (lead[1]!=null) lead[1]->RefreshPos();
	},

	//@小灯泡是否达到额定功率而发光
	IsBulbOn: function() {
		var sData = GetSpecialData();

		if (BULB != style)
			return false;	//不是小灯泡
		if (elecDir != LEFTELEC && elecDir != RIGHTELEC)
			return false;	//电流没有计算或者不符合条件

		double tempData = GetResist() * elec * elec;

		return (!IsFloatZero(sData) && tempData >= sData);
	},

	//@开关闭合或者断开
	SwitchClosed: function(isSwitch) {
		if (SWITCH != style) return false;	//不是开关
		if (isSwitch) this.closed = !this.closed;
		return this.closed;
	},

	//@与CProperty交换信息
	GetDataList: function(list) {
		list.SetDataParent(this);

		list.SetAMember(DATA_TYPE_string, TITLE_NOTE, "name");
		list.SetAMember(DATA_TYPE_bool, TITLESHOW_NOTE, "isPaintName");

		switch (style) {
		case SOURCE:
			list.SetAMember(DATA_TYPE_float, DATA_NOTE[DATA_NOTE_PRESS], "pressure");
			list.SetAMember(DATA_TYPE_float, DATA_NOTE[DATA_NOTE_RESIST], "resist");
			break;

		case RESIST:
			list.SetAMember(DATA_TYPE_float, DATA_NOTE[DATA_NOTE_RESIST], "resist");
			break;

		case BULB:
			list.SetAMember(DATA_TYPE_float, DATA_NOTE[DATA_NOTE_RATING], "rating");
			list.SetAMember(DATA_TYPE_float, DATA_NOTE[DATA_NOTE_RESIST], "resist");
			break;

		case CAPA:
			list.SetAMember(DATA_TYPE_float, DATA_NOTE[DATA_NOTE_CAPA], "capa");
			break;

		case SWITCH:
			list.SetAMember(DATA_TYPE_bool, DATA_NOTE[DATA_NOTE_SWITCHONOFF], "closed");
			// 当修改完毕需要立即更新resist
			break;
		}
	},
	//@CProperty设置数据之后
	AfterSetProperty: function() {
		switch (style) {
		case SWITCH:
			if (this.closed);
				this.resist = 0;
			else
				this.resist = -1;
			break;
		}
	}

};