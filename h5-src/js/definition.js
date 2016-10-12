
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
var BODY_SOURCE		= 0;
var BODY_RESIST		= 1;
var BODY_BULB		= 2;
var BODY_CAPA		= 3;
var BODY_SWITCH		= 4;


// 正常, 选中, 右击 颜色
var COLOR_NORMAL = PaintCommonFunc.RGBToHex(0,0,0);
var COLOR_FOCUS = PaintCommonFunc.RGBToHex(30,250,30);
var COLOR_SPECIAL = PaintCommonFunc.RGBToHex(190,30,100);


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


// 绘制的节点样式
var PAINT_CRUN_STYLE_NORMAL = 0;	// 正常
var PAINT_CRUN_STYLE_FOCUS = 1;		// 焦点, 绿色
var PAINT_CRUN_STYLE_SPECIAL = 2;	// 紫色
var PAINT_CRUN_STYLE_COUNT = 3;


//LISTDATA的数据类型定义
var DATA_TYPE_float		= 0;
var DATA_TYPE_uint		= 1;
var DATA_TYPE_bool		= 2;
var DATA_TYPE_string	= 3;
var DATA_TYPE_enum		= 4;
var DATA_TYPE_color		= 5;



//导线样式
var SOLID_SPECIAL_COLOR		= 0;	//实线保留色
var SOLID_ORIGINAL_COLOR	= 1;	//实线原来颜色
var DOT_SPECIAL_COLOR		= 2;	//虚线保留色
var DOT_ORIGINAL_COLOR		= 3;	//虚线原来颜色
var LEAD_STYLE_COUNT = 4;	//导线样式个数
//导线样式对应的名称
var LEAD_STYLE_NAMES = new Array(
	"实线紫色",
	"实线原来颜色",
	"虚线紫色",
	"虚线原来颜色"
);

var TITLE_NOTE     = "标签         (可以为空)";	//标签对应的提示
var TITLESHOW_NOTE = "显示标签";				//显示标签对应的提示


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

var CTRL_SIZE = {cx:29, cy:29};	//控件的大小
var DD = 4;	//当与某个物体距离<=DD时,认为移动到了物体上

//复制物体目的枚举
var CLONE_FOR_USE		= 0;	//复制为了当前使用
var CLONE_FOR_SAVE		= 1;	//复制为了保存
var CLONE_FOR_CLIPBOARD	= 2;	//复制为了剪切板使用


var MAX_MOVE_BODY_DIS	= 50;					//使用方向键一次移动物体距离范围1~MAX_MOVE_BODY_DIS
var MAX_LEAVE_OUT_DIS	= 15;					//相邻导线合并距离范围1~MAX_LEAVE_OUT_DIS


// 搜索关键字
var SEARCH_BY_NAME	= 0;	//根据名称搜索
var SEARCH_BY_ID	= 1;	//根据序号搜索
