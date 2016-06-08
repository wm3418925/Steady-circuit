//结点类
var CRUN = {

	//全局初始化次序
	globalInitOrder: 1,
	//重置全局初始化次序
	ResetGlobalInitOrder: function() {
		return (CRUN.globalInitOrder = 1);
	},

	
	CreateNew: function(memberIdx, x, y) {
		var initOrder = CRUN.globalInitOrder++;
		var newObj = {
			initOrder : initOrder,		//初始化序号
			index : memberIdx,			//在数组中序号
			
			isPaintName : false,		//默认不显示结点标签
			name : "Crun" + initOrder,	//默认名称
			x:x, y:y,					//坐标
			lead : new Array(null,null,null,null)	//连接导线的位置,0↑,1↓,2←,3→
		};
        
		newObj.__proto__ = CRUN;
		return newObj;
	},

	//保存信息到json
	GenerateStoreJsonObj: function() {
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
	},
	//从json读取信息
	ReadFromStoreJsonObj: function(jsonObj, leadList) {
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
	},

	//获得鼠标在结点的位置
	At: function (xPox, yPos) {
		var dis, disBetweenCenter;

		disBetweenCenter = (xPox-this.x)*(xPox-this.x)+(yPox-this.y)*(yPox-this.y);
		if (disBetweenCenter > 4 * DD * DD) return 0;	//距离点远

		dis = (xPox-this.x)*(xPox-this.x)+(yPox-this.y+DD)*(yPox-this.y+DD);
		if (dis <= DD) {	//在上连接点
			if (this.lead[0] != null) return -1;
			else return 1;
		}

		dis = (xPox-this.x)*(xPox-this.x)+(yPox-this.y-DD)*(yPox-this.y-DD);
		if (dis <= DD) {	//在下连接点
			if (this.lead[1] != null) return -1;
			else return 2;
		}

		dis = (xPox-this.x+DD)*(xPox-this.x+DD)+(yPox-this.y)*(yPox-this.y);
		if (dis <= DD) {	//在左连接点
			if (this.lead[2] != null) return -1;
			else return 3;
		}

		dis = (xPox-this.x-DD)*(xPox-this.x-DD)+(yPox-this.y)*(yPox-this.y);
		if (dis <= DD)	//在右连接点
		{
			if (this.lead[3] != null) return -1;
			else return 4;
		}

		if (disBetweenCenter <= DD * DD) return -1;	//在点上

		return 0;
	},

	//拷贝控件结点信息到新的结点
	Clone: function(clonePurpose) {
		var newCrun = CRUN.CreateNew(this.index, this.x, this.y);
		newCrun.isPaintName = this.isPaintName;
		newCrun.name = this.name;

		if (CLONE_FOR_USE != clonePurpose) {
			newCrun.initOrder = this.initOrder;
			--CRUN.globalInitOrder;
		}
		return newCrun;
	},

	//和CProperty交互
	GetDataList: function (list) {
		list.SetDataParent(this);
		list.SetAMember(DATA_TYPE_string, TITLE_NOTE, "name");
		list.SetAMember(DATA_TYPE_bool, TITLESHOW_NOTE, "isPaintName");
	},

	//寻找导线在哪个方向
	GetDirect: function(l) {
		for (var i=0; i<4; ++i) if (this.lead[i] == l) return i;
		return -1;	//没有找到
	},

	//获得连接了几个导线
	GetConnectCount: function() {
		return  (this.lead[0] != null) + 
				(this.lead[1] != null) + 
				(this.lead[2] != null) + 
				(this.lead[3] != null);
	}
};