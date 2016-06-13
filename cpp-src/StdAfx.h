// stdafx.h : include file for standard system include files,
//  or project specific include files that are used frequently, but
//      are changed infrequently
//

#if !defined(AFX_STDAFX_FDEF)
#define AFX_STDAFX_FDEF

#if _MSC_VER > 1000
#pragma once
#endif // _MSC_VER > 1000

#define VC_EXTRALEAN		// Exclude rarely-used stuff from Windows headers

#include <afxwin.h>         // MFC core and standard components
#include <afxext.h>         // MFC extensions

///////////////////////////////////////////////////////////////////////////
#define _ITERATOR_DEBUG_LEVEL 0


const long NAME_LEN = 32;									//名称的字符串占内存大小

const char FILE_EXTENT[8] = "wan";							//文件后缀, 不带.
const char FILE_EXTENT_DOT[8] = ".wan";						//文件后缀, 带.
const char DEFAULT_FILE_NAME[16] = "data.wan";				//默认文件名
const char FILE_LIST[32] = "电路文件(*.wan)|*.wan||";		//支持文件列表

enum BODY_TYPE												//指向物体的类型
{
	BODY_ALL		= -5,
	BODY_ALLCTRL	= -4,
	BODY_LEAD		= -3,
	BODY_NO			= -2,
	BODY_CRUN		= -1,
	SOURCE			= 0,
	RESIST			= 1,
	BULB			= 2,
	CAPA			= 3,
	SWITCH			= 4
};

//供ENUM_STYLE使用
enum STYLE_LIST
{
	ENUM_CTRL		= 0,									//控件类型
	ENUM_COLOR		= 1,									//颜色类型
	ENUM_LEADSTYLE	= 2										//导线样式
};

const long CTRL_TYPE_NUM = 5;								//控件类型个数
const char CTRL_STYLE_NAME[CTRL_TYPE_NUM][NAME_LEN] =		//控件类型对应的名称
{
	"电源",
	"电阻",
	"小灯泡",
	"电容器",
	"开关"
};

enum DATA_STYLE												//LISTDATA的数据类型定义
{
	DATA_STYLE_float	= 0,
	DATA_STYLE_double	= 1,
	DATA_STYLE_UINT		= 2,
	DATA_STYLE_bool		= 3,
	DATA_STYLE_LPCTSTR	= 4,
	DATA_STYLE_enum		= 5
};

enum COLOR													//颜色枚举
{
	BLACK			= 0, 
	RED				= 1, 
	YELLOW			= 2, 
	GREEN			= 3, 
	BLUE			= 4,
	RESERVE_COLOR	= 5
};
const long COLOR_TYPE_NUM = 5;								//用户可以选择颜色个数
const char COLORNAMES[COLOR_TYPE_NUM][8] =					//颜色对应的名称
{
	"黑色",
	"红色",
	"黄色",
	"绿色",
	"蓝色"
};

enum LEADSTYLE													//导线样式
{
	SOLID_RESERVE_COLOR		= 0,	//实线保留色
	SOLID_ORIGINAL_COLOR	= 1,	//实线原来颜色
	DOT_ORIGINAL_COLOR		= 2,	//虚线原来颜色
	DOT_RESERVE_COLOR		= 3		//虚线保留色
};
const long LEAD_STYLE_NUM = 4;									//导线样式个数
const char LEADSTYLENAMES[4][16] =								//导线样式对应的名称
{
	"实线紫色",
	"实线原来颜色",
	"虚线原来颜色",
	"虚线紫色",
};

const char TITLE_NOTE[]     = "标签         (可以为空)";	//标签对应的提示
const char TITLESHOW_NOTE[] = "显示标签";					//显示标签对应的提示


enum ELEC_STATE												//电流状态枚举
{
	UNKNOWNELEC		= -2,	//电流未计算
	ERRORELEC		= -1,	//计算错误
	NORMALELEC		= 0,	//电流正常
	LEFTELEC		= 0,	//电流从左到右
	RIGHTELEC		= 1,	//电流从右到左
	OPENELEC		= 6,	//断路
	SHORTELEC		= 7,	//短路
	UNCOUNTABLEELEC	= 8		//含有无法计算的分支
};

const long MAXCTRLNUM	= 128;								//控件最大数量
const long MAXCRUNNUM	= 64;								//结点最大数量
const long MAXLEADNUM	= MAXCRUNNUM*2 + MAXCTRLNUM;		//导线最大数量

const SIZE BODYSIZE = {29, 29};								//控件的大小
const long DD = 4;											//当与某个物体距离<=DD时,认为移动到了物体上

enum CLONE_PURPOSE
{
	CLONE_FOR_USE		= 0,	//复制为了当前使用
	CLONE_FOR_SAVE		= 1,	//复制为了保存
	CLONE_FOR_CLIPBOARD	= 2		//复制为了剪切板使用
};

//焦点物体或者坐标上的物体
struct FOCUS_OR_POS
{
	bool isFocusBody;
	POINT pos;
};

enum SEARCH_BY
{
	SEARCH_BY_NAME	= 0,	//根据名称搜索
	SEARCH_BY_ID	= 1		//根据序号搜索
};

//类声明
class CTRL;
class CRUN;
class LEAD;
class Pointer;
class LISTDATA;
class ENUM_STYLE;


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


//{{AFX_INSERT_LOCATION}}
// Microsoft Visual C++ will insert additional declarations immediately before the previous line.

#endif // !defined(AFX_STDAFX_FDEF)
