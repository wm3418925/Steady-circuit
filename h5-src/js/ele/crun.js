//全局初始化次序
var globalCrunInitOrder = 1;
//重置全局初始化次序
function CRUN_GlobalResetInitOrder() {
	return (globalCrunInitOrder = 1);
}


//结点类
function CRUN(memberIdx, x, y) {
	this.initOrder = globalCrunInitOrder++;
	this.index = memberIdx;			//在数组中序号
	
	this.isPaintName = false;		//默认不显示结点标签
	this.name = "Crun" + this.initOrder;	//默认名称
	this.x = x; this.y = y;			//坐标
	this.lead = new Array(null,null,null,null);	//连接导线的位置,0↑,1↓,2←,3→
}

//保存信息到json
CRUN.prototype.GenerateStoreJsonObj = function() {
	var leadIndexArray = new Array();
	for (var i=0; i<4; ++i) {
		if (this.lead[i] != null)
			leadIndexArray.push(this.lead[i].index);
		else 
			leadIndexArray.push(-1);
	}
	
	return {
		isPaintName : this.isPaintName,
		name : this.name,
		x : this.x, y:this.y,
		lead : leadIndexArray
	};
};
//从json读取信息
CRUN.prototype.ReadFromStoreJsonObj = function(jsonObj, leadList) {
	ASSERT(jsonObj != null);
	ASSERT(leadList != null);

	var leadArray = new Array();
	for (var i=0; i<4; ++i) {
		if (jsonObj.lead[i] >= 0)
			leadArray.push(leadList[jsonObj.lead[i]]);
		else 
			leadArray.push(null);
	}
	
	this.isPaintName = jsonObj.isPaintName;
	this.name = jsonObj.name;
	this.x = jsonObj.x; this.y = jsonObj.y;
	this.lead = leadArray;
};

//获得鼠标在结点的位置
CRUN.prototype.At = function (xPos, yPos) {
	var dis, disBetweenCenter;

	disBetweenCenter = (xPos-this.x)*(xPos-this.x)+(yPos-this.y)*(yPos-this.y);
	if (disBetweenCenter > 4 * DD * DD) return 0;	//距离点远

	dis = (xPos-this.x)*(xPos-this.x)+(yPos-this.y+DD)*(yPos-this.y+DD);
	if (dis <= DD) {	//在上连接点
		if (this.lead[0]) return -1;
		else return 1;
	}

	dis = (xPos-this.x)*(xPos-this.x)+(yPos-this.y-DD)*(yPos-this.y-DD);
	if (dis <= DD) {	//在下连接点
		if (this.lead[1]) return -1;
		else return 2;
	}

	dis = (xPos-this.x+DD)*(xPos-this.x+DD)+(yPos-this.y)*(yPos-this.y);
	if (dis <= DD) {	//在左连接点
		if (this.lead[2]) return -1;
		else return 3;
	}

	dis = (xPos-this.x-DD)*(xPos-this.x-DD)+(yPos-this.y)*(yPos-this.y);
	if (dis <= DD) {	//在右连接点
		if (this.lead[3]) return -1;
		else return 4;
	}

	if (disBetweenCenter <= DD * DD) return -1;	//在点上

	return 0;
};

//拷贝控件结点信息到新的结点
CRUN.prototype.Clone = function(clonePurpose) {
	var newCrun = new CRUN(this.index, this.x, this.y);
	newCrun.isPaintName = this.isPaintName;
	newCrun.name = this.name;

	if (CLONE_FOR_USE != clonePurpose) {
		newCrun.initOrder = this.initOrder;
		--globalCrunInitOrder;
	}
	return newCrun;
};

//和CProperty交互
CRUN.prototype.GetDataList = function (list) {
	list.SetDataParent(this);
	list.SetAMember(DATA_TYPE_string, TITLE_NOTE, "name");
	list.SetAMember(DATA_TYPE_bool, TITLESHOW_NOTE, "isPaintName");
};

//寻找导线在哪个方向
CRUN.prototype.GetDirect = function(l) {
	for (var i=0; i<4; ++i) if (this.lead[i] == l) return i;
	return -1;	//没有找到
};

//获得连接了几个导线
CRUN.prototype.GetConnectCount = function() {
	return  (this.lead[0] != null) + 
			(this.lead[1] != null) + 
			(this.lead[2] != null) + 
			(this.lead[3] != null);
};
