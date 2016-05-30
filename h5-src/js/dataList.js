
//错误类型:
var ERROR_NO				= 0;	//无错
var ERROR_STRNULL			= 1;	//字符串为空
var ERROR_FLOATMIX			= 2;	//浮点数含有非法字符
var ERROR_UINTMIX			= 3;	//正整数含有非法字符
var ERROR_UINTOVER			= 4;	//正整数不在范围
var ERROR_ENUMOVER			= 5;	//枚举不是选项的某一个
var ERROR_STRMIX			= 6;	//名称标签含有非法字符 [](){}
var ERROR_ENUMNOTALLOWED	= 7;	//枚举在一些情况下不允许一些值(如:焦点物体颜色不能为黑色)


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
		
		return {"memeberName": memeberName, "noteList":noteList};
	},

	GetMemeberName: function() {
		return memeberName;
	},

	GetOptionCount: function() {
		return noteList.length;
	},

	GetOptionNoteList: function() {
		return noteList;
	}
};

var LISTDATA = {	//数据列表信息类

	CreateNew: function() {
		return {
			dataParent : null,
			dataTypeList: new Array(),		//每个数据项类型
			dataMinList: new Array(),		//如果是short,int,long等整型数据,有最小值
			dataMaxList: new Array(),		//如果是short,int,long等整型数据,有最大值
			memeberNameList: new Array(),	//数据
			noteTextList: new Array()};		//每个数据项类型提示信息
	},
	SetDataParent: function(dataParent) {
		this.dataParent = dataParent;
	},

	Unint: function() {
		dataTypeList = null;
		dataMinList = null;
		dataMaxList = null;
		memeberNameList = null;
		noteTextList = null;
	},

	GetListSize() {
		return memeberNameList.length;
	},

	//设置列表的一项, dataType != DATA_TYPE_enum, 当min>max表示没有大小限制
	void SetAMember(dataType, note, data, min/*1*/, max/*0*/) {
		ASSERT(dataType != DATA_TYPE_enum);
		if (min == undefined || max == undefined) {
			min = 1;
			max = 0;
		}

		dataTypeList.push(dataType);
		dataMinList.push(min);
		dataMaxList.push(max);
		noteTextList.push(note);
		memeberNameList.push(data);
	},

	//设置style == DATA_TYPE_enum 的一项, memeberNameList 指向一个 ENUM_DATA_HANLDER
	void SetAEnumMember(note, data, enumType, min/*1*/, max/*0*/) {
		if (min == undefined || max == undefined) {
			min = 1;
			max = 0;
		}
		
		dataTypeList.push(DATA_TYPE_enum);
		dataMinList.push(min);
		dataMaxList.push(max);
		noteTextList.push(note);
		memeberNameList.push(ENUM_DATA_HANLDER.CreateNew(enumType, data));
	},

	//检查一行: row--行, chData--字符串数据, enumData--枚举数据
	ERROR_TYPE CheckAMember(row, pageElement) {
		var chData;
		var enumData;

		switch (dataTypeList[row]) {
		case DATA_TYPE_float:
			chData = pageElement.value;
			if (chData == null || chData.length == 0)
				return ERROR_STRNULL;
			else if (!IsStrPositiveFloat(chData))
				return ERROR_FLOATMIX;
			break;

		case DATA_TYPE_uint:
			chData = pageElement.value;
			if (chData == null || chData.length == 0)
				return ERROR_STRNULL;
			} else if (!IsUnsignedInteger(chData)) {
				return ERROR_UINTMIX;
			} else if (dataMinList[row] <= dataMaxList[row]) {	//有大小限制
				enumData = parseInt(chData);
				if (enumData < dataMinList[row] || enumData > dataMaxList[row])
					return ERROR_UINTOVER;
			}
			break;

		case DATA_TYPE_enum:
			enumData = pageElement.selectedIndex;
			if (enumData < 0 || enumData >= memeberNameList[row].GetOptionCount()) {
				return ERROR_ENUMOVER;
			} else if (dataMinList[row] <= dataMaxList[row]) {	//有大小限制
				if (enumData < dataMinList[row] || enumData > dataMaxList[row])
					return ERROR_ENUMNOTALLOWED;
			}
			break;

		case DATA_TYPE_string:
			//chData = pageElement.value;
			//if (!IsNormalStr(chData)) return ERROR_STRMIX;
			break;
		}
		return ERROR_NO;
	},

	//将控件用户修改的信息保存到指针指向的物体
	void SaveAMember(row, pageElement) {
		var tmpData;

		switch (dataTypeList[row]) {
		case DATA_TYPE_float:
			tmpData = parseFloat(pageElement.value);
			break;
		case DATA_TYPE_uint:
			tmpData = parseInt(pageElement.value);
			break;
		case DATA_STYLE_bool:
			tmpData = pageElement.checked;
			break;
		case DATA_TYPE_string:
			tmpData = pageElement.value;
			break;
		case DATA_TYPE_enum:
			tmpData = pageElement.selectedIndex;
			break;
		}
		
		if (dataTypeList[row] == DATA_TYPE_enum)
			dataParent[eval(memeberNameList[row].GetMemeberName())] = tmpData;
		else
			dataParent[eval(memeberNameList[row])] = tmpData;
	}

};
