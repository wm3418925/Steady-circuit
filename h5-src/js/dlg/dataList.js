
//错误类型:
var ERROR_NO				= 0;	//无错
var ERROR_STRNULL			= 1;	//字符串为空
var ERROR_FLOATMIX			= 2;	//浮点数含有非法字符
var ERROR_UINTMIX			= 3;	//正整数含有非法字符
var ERROR_UINTOVER			= 4;	//正整数不在范围
var ERROR_ENUMOVER			= 5;	//枚举不是选项的某一个
var ERROR_STRMIX			= 6;	//名称标签含有非法字符 [](){}
var ERROR_ENUMNOTALLOWED	= 7;	//枚举在一些情况下不允许一些值(如:焦点物体颜色不能为黑色)
var ERROR_COLORINVALID		= 8;	//颜色字符串格式非法


// 处理类型属性
var ENUM_DATA_HANLDER = {
	
	CreateNew: function(enumType, memeberName) {
		var noteList;
		switch (enumType) {
		case CTRL_TYPE_ENUM:	//控件类型
			noteList = CTRL_TYPE_NAMES;
			break;
		case LEAD_STYLE_ENUM:	//导线样式
			noteList = LEAD_STYLE_NAMES;
			break;
		}
		
		var newObj = {"memeberName": memeberName, "noteList":noteList};
		newObj.__proto__ = ENUM_DATA_HANLDER;
		return newObj;
	},

	GetMemeberName: function() {
		return this.memeberName;
	},

	GetOptionCount: function() {
		return this.noteList.length;
	},

	GetOptionNoteList: function() {
		return this.noteList;
	}
};

var LISTDATA = {	//数据列表信息类

	CreateNew: function() {
		var newObj = {
			dataParent : null,
			dataTypeList: new Array(),		//每个数据项类型
			dataMinList: new Array(),		//如果是short,int,long等整型数据,有最小值
			dataMaxList: new Array(),		//如果是short,int,long等整型数据,有最大值
			memberNameList: new Array(),	//数据
			noteTextList: new Array()};		//每个数据项类型提示信息
			
		newObj.__proto__ = LISTDATA;
		return newObj;
	},
	SetDataParent: function(dataParent) {
		this.dataParent = dataParent;
	},

	Unint: function() {
		this.dataTypeList = null;
		this.dataMinList = null;
		this.dataMaxList = null;
		this.memberNameList = null;
		this.noteTextList = null;
	},

	GetListSize: function() {
		return this.memberNameList.length;
	},
	GetRowData: function(row) {
		var value;
		if (this.dataTypeList[row] == DATA_TYPE_enum)
			value = this.memberNameList[row].memeberName;
		else
			value = this.memberNameList[row];
			
		if (this.dataParent) {
			return this.dataParent[value];
		} else {
			return value;
		}
	},

	//设置列表的一项, dataType != DATA_TYPE_enum, 当min>max表示没有大小限制
	SetAMember: function(dataType, note, data, min/*1*/, max/*0*/) {
		ASSERT(dataType != DATA_TYPE_enum);
		if (min == undefined || max == undefined) {
			min = 1;
			max = 0;
		}

		this.dataTypeList.push(dataType);
		this.dataMinList.push(min);
		this.dataMaxList.push(max);
		this.noteTextList.push(note);
		this.memberNameList.push(data);
	},

	//设置style == DATA_TYPE_enum 的一项, this.memberNameList 指向一个 ENUM_DATA_HANLDER
	SetAEnumMember: function(enumType, note, data, min/*1*/, max/*0*/) {
		if (min == undefined || max == undefined) {
			min = 1;
			max = 0;
		}
		
		this.dataTypeList.push(DATA_TYPE_enum);
		this.dataMinList.push(min);
		this.dataMaxList.push(max);
		this.noteTextList.push(note);
		this.memberNameList.push(ENUM_DATA_HANLDER.CreateNew(enumType, data));
	},

	//检查一行: row--行, chData--字符串数据, enumData--枚举数据
	CheckAMember: function(row, pageElement) {
		var chData;
		var enumData;

		switch (this.dataTypeList[row]) {
		case DATA_TYPE_float:
			chData = pageElement.value;
			if (chData == null || chData.length == 0)
				return ERROR_STRNULL;
			else if (!IsStrPositiveFloat(chData))
				return ERROR_FLOATMIX;
			break;

		case DATA_TYPE_uint:
			chData = pageElement.value;
			if (chData == null || chData.length == 0) {
				return ERROR_STRNULL;
			} else if (!IsUnsignedInteger(chData)) {
				return ERROR_UINTMIX;
			} else if (this.dataMinList[row] <= this.dataMaxList[row]) {	//有大小限制
				enumData = parseInt(chData);
				if (enumData < this.dataMinList[row] || enumData > this.dataMaxList[row])
					return ERROR_UINTOVER;
			}
			break;

		case DATA_TYPE_enum:
			enumData = pageElement.selectedIndex;
			if (enumData < 0 || enumData >= this.memberNameList[row].GetOptionCount()) {
				return ERROR_ENUMOVER;
			} else if (this.dataMinList[row] <= this.dataMaxList[row]) {	//有大小限制
				if (enumData < this.dataMinList[row] || enumData > this.dataMaxList[row])
					return ERROR_ENUMNOTALLOWED;
			}
			break;

		case DATA_TYPE_string:
			//chData = pageElement.value;
			//if (!IsNormalStr(chData)) return ERROR_STRMIX;
			break;
			
		case DATA_TYPE_color:
			chData = pageElement.value;
			if (!PaintCommonFunc.CheckRGBStr(chData)) {
				return ERROR_COLORINVALID;
			}
			break;
		}
		return ERROR_NO;
	},

	//将控件用户修改的信息保存到指针指向的物体
	SaveAMember: function(row, pageElement) {
		if (!this.dataParent) return;
			
		var tmpData;

		switch (this.dataTypeList[row]) {
		case DATA_TYPE_float:
			tmpData = parseFloat(pageElement.value);
			break;
		case DATA_TYPE_uint:
			tmpData = parseInt(pageElement.value);
			break;
		case DATA_TYPE_bool:
			tmpData = pageElement.checked;
			break;
		case DATA_TYPE_string:
			tmpData = pageElement.value;
			break;
		case DATA_TYPE_enum:
			tmpData = pageElement.selectedIndex;
			break;
		case DATA_TYPE_color:
			tmpData = PaintCommonFunc.RGBStrToHex(pageElement.value);
			break;
		}
		
		if (this.dataTypeList[row] == DATA_TYPE_enum)
			this.dataParent[this.memberNameList[row].GetMemeberName()] = tmpData;
		else
			this.dataParent[this.memberNameList[row]] = tmpData;
	}

};
