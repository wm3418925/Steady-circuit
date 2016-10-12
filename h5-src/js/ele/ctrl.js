
var DATA_NOTE_RESIST		= 0;
var DATA_NOTE_PRESS			= 1;
var DATA_NOTE_CURRENT		= 2;
var DATA_NOTE_RATING		= 3;
var DATA_NOTE_CAPA			= 4;
var DATA_NOTE_SWITCHONOFF	= 5;
var DATA_NOTE_HAVERESIST	= 6;



//标记控件是否提供电压(1提供,0不提供)
var PRESSURE_TYPE = new Array(true, false, false, false, false);

//标记控件是否有电阻(1可以有电阻,-1断路,0无电阻)
var RESISTANCE_TYPE = new Array(1, 1, 1, -1, 1);

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



//全局初始化次序
var globalCtrlInitOrder = 1;
//重置全局初始化次序
function CTRL_GlobalResetInitOrder() {
	return (globalCtrlInitOrder = 1);
}

// @复制控件数据
CTRL_CloneCtrlData = function(toCtrl, fromCtrl) {
	switch (fromCtrl.style) {
	case BODY_SOURCE:
		toCtrl.pressure = fromCtrl.pressure;
		toCtrl.resist = fromCtrl.resist;
		break;
	case BODY_RESIST:
		toCtrl.resist = fromCtrl.resist;
		break;
	case BODY_BULB:
		toCtrl.rating = fromCtrl.rating;
		toCtrl.resist = fromCtrl.resist;
		break;
	case BODY_CAPA:
		toCtrl.capa = fromCtrl.capa;
		break;
	case BODY_SWITCH:
		toCtrl.closed = fromCtrl.closed;
		break;
	}
	return toCtrl;
};

//控件类
//!函数后面加了@的函数共有8个,在有新控件类型定义时需要添加新类型的处理代码
function CTRL(memberIdx, x, y, ctrlStyle) {
	ASSERT(ctrlStyle >= 0 && ctrlStyle < CTRL_TYPE_COUNT);
	
	this.initOrder = globalCtrlInitOrder++;
	this.index = memberIdx;			//在控件数组中序号
		
	this.isPaintName = true;			//默认显示结点标签
	this.name = "Ctrl" + this.initOrder;		//默认名称
	this.x = x; this.y = y;				//坐标
	this.lead = new Array(null,null);	//结点连接导线的位置,0↑,1↓,2←,3→*/
		
	this.dir = 0;						//控件默认方向
	this.style = ctrlStyle;
		
	this.elec = 0;					//流过控件的电流的 大小(在方向定义下的大小)
	this.elecDir = UNKNOWNELEC;		//电流方向

	this.InitDefaultData(ctrlStyle);
}

// 拷贝控件信息到新的控件
CTRL.prototype.Clone = function(clonePurpose) {
	var newCtrl = new CTRL(this.index, this.x, this.y, this.style);
	newCtrl.name = this.name;
	newCtrl.isPaintName = this.isPaintName;
	newCtrl.dir = this.dir;
	CTRL_CloneCtrlData(newCtrl, this);

	if (CLONE_FOR_USE != clonePurpose) {
		newCtrl.initOrder = this.initOrder;
		--globalCtrlInitOrder;
	}
	return newCtrl;
};
//保存信息到json
CTRL.prototype.GenerateStoreJsonObj = function() {
	var leadIndexArray = new Array();
	for (var i=0; i<2; ++i) {
		if (this.lead[i] != null)
			leadIndexArray.push(this.lead[i].index);
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
	return CTRL_CloneCtrlData(storeJsonObj, this);
};
//从json读取信息
CTRL.prototype.ReadFromStoreJsonObj = function(jsonObj, leadList) {
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

	CTRL_CloneCtrlData(this, jsonObj);
};

// 刷新开关电阻信息
CTRL.prototype.RefreshSwitchResist = function() {
	if (this.hasOwnProperty("closed")) {
		if (this.closed)
			this.resist = 0;
		else
			this.resist = -1;
	}
};
// @根据类型, 初始化默认数据
CTRL.prototype.InitDefaultData = function(ctrlStyle) {
	switch (ctrlStyle) {
	case BODY_SOURCE:
		this.pressure = 10;
		this.resist = 0;
		break;
	case BODY_RESIST:
		this.resist = 10;
		break;
	case BODY_BULB:
		this.rating = 10;
		this.resist = 5;
		break;
	case BODY_CAPA:
		this.capa = 10;
		this.resist = -1;
		break;
	case BODY_SWITCH:
		this.closed = false;
		break;
	}
};

// @获得控件的特征数据
CTRL.prototype.GetSpecialData = function() {
	switch (this.style) {
	case BODY_SOURCE:
		return this.pressure;
	case BODY_RESIST:
		return this.resist;
	case BODY_BULB:
		return this.rating;
	case BODY_CAPA:
		return this.capa;
	case BODY_SWITCH:
		return this.closed;
	}

	return 0;
};
// 获得控件的电压
CTRL.prototype.GetPressure = function(direction) {
	if (BODY_SOURCE == this.style) {
		if (direction != 0)
			return - this.pressure;
		else
			return   this.pressure;
	}

	return 0;
};

//改变控件类型
CTRL.prototype.ChangeStyle = function(newStyle) {
	ASSERT(this.style != newStyle);
	this.style = newStyle;
	this.InitDefaultData(newStyle);
};

//获得控件连接的导线数
CTRL.prototype.GetConnectCount = function() {
	return (this.lead[0] != null) + (this.lead[1] != null);
};

//寻找导线在哪个方向 : 0↑,1↓,2←,3→
CTRL.prototype.GetDirect = function(l) {
	var i;
	for (i=0; i<2; ++i) {
		if (this.lead[i] == l) break;
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
};

//获得鼠标在控件的位置
CTRL.prototype.At = function(xPos, yPos) {
	var ret = 0;

	var xInter = xPos - this.x - (CTRL_SIZE.cx>>1);
	var yInter = yPos - this.y - (CTRL_SIZE.cy>>1);

	if (0 == (this.dir&1)) {	//横向
		if (xInter < 0) {
			xInter += (CTRL_SIZE.cx>>1);
			if (xInter*xInter + yInter*yInter <= DD*DD) {	//选中左连接点
				if (0 == (this.dir&2)) ret = 1;
				else ret = 2;
			}
		} else {
			xInter -= (CTRL_SIZE.cx>>1);
			if (xInter*xInter + yInter*yInter <= DD*DD) {	//选中右连接点
				if (0 == (this.dir&2)) ret = 2;
				else ret = 1;
			}
		}
	} else { //纵向
		if (yInter < 0) {
			yInter += (CTRL_SIZE.cy>>1);
			if (xInter*xInter + yInter*yInter <= DD*DD) {	//选中上连接点
				if (0 == (this.dir&2)) ret = 1;
				else ret = 2;
			}
		} else {
			yInter -= (CTRL_SIZE.cy>>1);
			if (xInter*xInter + yInter*yInter <= DD*DD) {	//选中下连接点
				if (0 == (this.dir&2)) ret = 2;
				else ret = 1;
			}
		}
	}

	if (ret != 0) {
		if (this.lead[ret-1] == null)
			return ret;
		else
			return -1;
	}

	if (xPos>=this.x && xPos<this.x+CTRL_SIZE.cx 
		&& yPos>=this.y && yPos<this.y+CTRL_SIZE.cy)
		return -1;	//在控件上

	return 0;
};

//旋转控件
CTRL.prototype.Rotate = function(rotateAngle90) {
	this.dir = (this.dir + rotateAngle90) % 4;
	if (this.lead[0]!=null) this.lead[0].RefreshPos();
	if (this.lead[1]!=null) this.lead[1].RefreshPos();
};

//@小灯泡是否达到额定功率而发光
CTRL.prototype.IsBulbOn = function() {
	var sData = this.GetSpecialData();

	if (BODY_BULB != this.style)
		return false;	//不是小灯泡
	if (this.elecDir != LEFTELEC && this.elecDir != RIGHTELEC)
		return false;	//电流没有计算或者不符合条件

	var tempData = this.resist * this.elec * this.elec;

	return (!IsFloatZero(sData) && tempData >= sData);
};

//@开关闭合或者断开
CTRL.prototype.SwitchClosed = function(isSwitch) {
	if (BODY_SWITCH != this.style) return false;	//不是开关
	if (isSwitch) {
		this.closed = !this.closed;
	}
	return this.closed;
};

//@与CProperty交换信息
CTRL.prototype.GetDataList = function(list) {
	list.SetDataParent(this);

	list.SetAMember(DATA_TYPE_string, TITLE_NOTE, "name");
	list.SetAMember(DATA_TYPE_bool, TITLESHOW_NOTE, "isPaintName");

	switch (this.style) {
	case BODY_SOURCE:
		list.SetAMember(DATA_TYPE_float, DATA_NOTE[DATA_NOTE_PRESS], "pressure");
		list.SetAMember(DATA_TYPE_float, DATA_NOTE[DATA_NOTE_RESIST], "resist");
		break;

	case BODY_RESIST:
		list.SetAMember(DATA_TYPE_float, DATA_NOTE[DATA_NOTE_RESIST], "resist");
		break;

	case BODY_BULB:
		list.SetAMember(DATA_TYPE_float, DATA_NOTE[DATA_NOTE_RATING], "rating");
		list.SetAMember(DATA_TYPE_float, DATA_NOTE[DATA_NOTE_RESIST], "resist");
		break;

	case BODY_CAPA:
		list.SetAMember(DATA_TYPE_float, DATA_NOTE[DATA_NOTE_CAPA], "capa");
		break;

	case BODY_SWITCH:
		list.SetAMember(DATA_TYPE_bool, DATA_NOTE[DATA_NOTE_SWITCHONOFF], "closed");
		// 当修改完毕需要立即更新resist
		break;
	}
};
//@在计算之前, 根据控件信息准备电压电阻等信息
CTRL.prototype.PrepareForComputing = function() {
	switch (this.style) {
	case BODY_SWITCH:
		this.RefreshSwitchResist();
		break;
	}
};