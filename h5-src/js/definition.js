
var NAME_LEN = 32;	//名称的字符串占内存大小

var FILE_EXTENT = "wan";						//文件后缀, 不带.
var FILE_EXTENT_DOT = ".wan";					//文件后缀, 带.
var DEFAULT_FILE_NAME = "data.wan";				//默认文件名
var FILE_LIST = "电路文件(*.wan)|*.wan||";		//支持文件列表


//指向物体的类型
var BODY_ALL		= -5;
var BODY_ALLCTRL	= -4;
var BODY_LEAD		= -3;
var BODY_NO			= -2;
var BODY_CRUN		= -1;
var SOURCE			= 0;
var RESIST			= 1;
var BULB			= 2;
var CAPA			= 3;
var SWITCH			= 4;


//供ENUM_STYLE使用
var CTRL_TYPE_ENUM	= 0;	//控件类型
var LEAD_STYLE_ENUM	= 1;	//导线样式



var CTRL_TYPE_COUNT = 5;	//控件类型个数
var CTRL_TYPE_NAMES = new Array(	//控件类型对应的名称
	"电源",
	"电阻",
	"小灯泡",
	"电容器",
	"开关"
);


//LISTDATA的数据类型定义
var DATA_TYPE_float		= 0;
var DATA_TYPE_uint		= 1;
var DATA_TYPE_bool		= 2;
var DATA_TYPE_string	= 3;
var DATA_TYPE_enum		= 4;



//导线样式
var SOLID_RESERVE_COLOR		= 0;	//实线保留色
var SOLID_ORIGINAL_COLOR	= 1;	//实线原来颜色
var DOT_ORIGINAL_COLOR		= 2;	//虚线原来颜色
var DOT_RESERVE_COLOR		= 3;	//虚线保留色
var LEAD_STYLE_COUNT = 4;	//导线样式个数
//导线样式对应的名称
var LEAD_STYLE_NAMES = new Array(
	"实线紫色",
	"实线原来颜色",
	"虚线原来颜色",
	"虚线紫色",
);

var TITLE_NOTE[]     = "标签         (可以为空)";	//标签对应的提示
var TITLESHOW_NOTE[] = "显示标签";					//显示标签对应的提示


//电流状态枚举
var UNKNOWNELEC		= -2;	//电流未计算
var ERRORELEC		= -1;	//计算错误
var NORMALELEC		= 0;	//电流正常
var LEFTELEC		= 0;	//电流从左到右
var RIGHTELEC		= 1;	//电流从右到左
var OPENELEC		= 6;	//断路
var SHORTELEC		= 7;	//短路
var UNCOUNTABLEELEC	= 8;	//含有无法计算的分支


var MAX_CTRL_COUNT	= 128;	//控件最大数量
var MAX_CRUN_COUNT	= 64;	//结点最大数量
var MAX_LEAD_COUNT	= MAX_CRUN_COUNT*2 + MAX_CTRL_COUNT;	//导线最大数量

var BODYSIZE = {29, 29};	//控件的大小
var DD = 4;	//当与某个物体距离<=DD时,认为移动到了物体上

//复制物体目的枚举
var CLONE_FOR_USE		= 0;	//复制为了当前使用
var CLONE_FOR_SAVE		= 1;	//复制为了保存
var CLONE_FOR_CLIPBOARD	= 2;	//复制为了剪切板使用


//焦点物体或者坐标上的物体
var FOCUS_OR_POS = {
	CreateNew: {
		return {isFocusBody:false, x:0, y:0};
	}
};

// 搜索关键字
var SEARCH_BY_NAME	= 0;	//根据名称搜索
var SEARCH_BY_ID	= 1;	//根据序号搜索


////////////////////////////////////////////////////////////////////////////
//下面的在 "resource.h" 中要连号:
/*
	IDB_SOURCE
	IDB_RESIST
	IDB_BULB
	IDB_CAPA
	IDB_SWITCH
	IDB_BULB_SHINE
	IDB_SWITCH_CLOSE

	IDM_ADD_NO
	IDM_ADD_CRUNODE
	IDM_ADD_SOURCE
	IDM_ADD_RESIST
	IDM_ADD_BULB
	IDM_ADD_CAPA
	IDM_ADD_SWITCH
*/
