/* 稳恒电路教学模拟器
   版权所有（C） 2013 <王敏>

   This program is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation; version 2 of the License.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program; if not, write to the Free Software
   Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA */
   
#include "StdAfx.h"
#include "StaticClass.h"	//包含static方法的类
#include "Lead.h"			//导线类
#include "DataList.h"		//LISTDATA, ENUM_STYLE类
#include "Equation.h"		//方程类
#include "Ctrl.h"			//当前类

unsigned long CTRL::s_initNum = 1;


double CTRL::GetSpecialData()const
//@获得控件的特征数据
{
	switch(style)
	{
	case SOURCE:
		return ((SOURCEDATA *)data)->pressure;
	case RESIST:
		return ((RESISTDATA *)data)->resist;
	case BULB:
		return ((BULBDATA *)data)->rating;
	case CAPA:
		return ((CAPACITYDATA *)data)->capa;
	case SWITCH:
		return ((SWITCHDATA *)data)->onOff;
	}

	return 0;
}

void CTRL::InitData(BODY_TYPE ctrlStyle)
//初始化控件数据部分
{
	ASSERT(ctrlStyle >= 0 && ctrlStyle < CTRL_TYPE_NUM);

	this->style = ctrlStyle;
	data = malloc(CTRL_DATA_SIZE[style]);
	ZeroMemory(data, CTRL_DATA_SIZE[style]);
}

CTRL::CTRL(long memNum, POINT pos, BODY_TYPE ctrlStyle, bool isInit)
{
	lead[0] = lead[1] = NULL;			//连接物体
	num = memNum;						//序号
	initNum = s_initNum++;				//初始化序号
	isPaintName = true;					//默认显示控件标签
	sprintf(name, "Ctrl%d", initNum);	//设置默认名称
	dir = 0;							//控件默认方向
	coord = pos;						//初始化坐标
	elecDir = UNKNOWNELEC;				//电流方向

	if(isInit) InitData(ctrlStyle);		//初始化控件数据部分
	else data = NULL;
}

CTRL::~CTRL()
{
	free(data); 
	data = NULL; 
}

CTRL * CTRL::Clone(CLONE_PURPOSE cp)const
//拷贝控件信息到新的控件
{
	CTRL * newCtrl = new CTRL(num, coord, style);				//新建同一种控件
	strcpy(newCtrl->name, this->name);							//使名称相同
	newCtrl->isPaintName = this->isPaintName;					//使显示名称属性一致
	newCtrl->dir = this->dir;									//使控件方向相同
	memcpy(newCtrl->data, this->data, CTRL_DATA_SIZE[style]);	//使数据相同

	if(CLONE_FOR_USE != cp)
	{
		newCtrl->initNum = this->initNum;
		--s_initNum;
	}
	return newCtrl;
}

void CTRL::SaveToFile(FILE * fp)const
//保存到文件
{
	int i, t;
	ASSERT(fp != NULL);

	fwrite(&coord, sizeof(POINT), 1, fp);
	fwrite(&dir, sizeof(dir), 1, fp);
	fwrite(&style, sizeof(int), 1, fp);
	for(i = 0; i < 2; ++i)
	{
		if(lead[i])
			t = lead[i]->num;
		else
			t = -1;
		fwrite(&t, sizeof(int), 1, fp);
	}
	fwrite(&isPaintName, sizeof(bool), 1, fp);
	fwrite(name, 1, NAME_LEN, fp);
	fwrite(data, CTRL_DATA_SIZE[style], 1, fp);
}

void CTRL::ReadFromFile(FILE * fp, LEAD ** allLead)
//从文件读取
{
	int i, t;
	ASSERT(fp!=NULL && allLead!=NULL);

	fread(&coord, sizeof(POINT), 1, fp);
	fread(&dir, sizeof(dir), 1, fp);
	fread(&style, sizeof(int), 1, fp);
	for(i = 0; i < 2; ++i)
	{
		fread(&t, sizeof(int), 1, fp);
		if(t >= 0 && t < MAXLEADNUM)
			lead[i] = allLead[t];
		else
			lead[i] = NULL;
	}
	fread(&isPaintName, sizeof(bool), 1, fp);
	fread(name, 1, NAME_LEN, fp);
	data = malloc(CTRL_DATA_SIZE[style]);	//分配空间
	fread(data, CTRL_DATA_SIZE[style], 1, fp);
}

void CTRL::ChangeStyle(BODY_TYPE newStyle)
//改变控件类型
{
	ASSERT(newStyle != style);
	free(data);			//释放原来类型对应的数据空间
	InitData(newStyle);	//初始化控件数据部分
}

unsigned long CTRL::GetInitOrder()const
//获得初始化序号
{
	return initNum;
}

void CTRL::ResetInitNum()
//重置初始化次序
{
	CTRL::s_initNum = 1;
}

BODY_TYPE CTRL::GetStyle()const
//获得控件类型
{
	return style;
}

int CTRL::GetConnectNum()const
//获得控件连接的导线数
{
	return (lead[0] != NULL) + (lead[1] != NULL) ; 
}

int CTRL::GetDirect(const LEAD * l)const
//寻找导线在哪个方向 : 0↑,1↓,2←,3→
{
	int i;
	for(i=0; i<2; ++i) if(lead[i] == l) break;
	if(i >= 2) return -1;	//没有找到

	ASSERT(dir>=0 && dir < 4);

	switch(dir)	//根据控件方向判断
	{
	case 0: return 2 + i;	//0:2;1:3
	case 1: return i;		//0:0;1:1
	case 2: return 3 - i;	//0:3;1:2
	case 3: return 1 - i;	//0:1;1:0
	default: return 0;
	}
}

int CTRL::At(POINT p)const
//获得鼠标在控件的位置
{
	int ret = 0;
	POINT c;
	c.x = p.x - coord.x - (BODYSIZE.cx>>1);
	c.y = p.y - coord.y - (BODYSIZE.cy>>1);

	if(! (dir&1))	//横向
	{
		if(c.x < 0)
		{
			c.x += (BODYSIZE.cx>>1);
			if(c.x*c.x + c.y*c.y <= DD*DD)
			{	//选中左连接点
				if(! (dir&2)) ret = 1;
				else ret = 2;
			}
		}
		else
		{
			c.x -= (BODYSIZE.cx>>1);
			if(c.x*c.x + c.y*c.y <= DD*DD)
			{	//选中右连接点
				if(! (dir&2)) ret = 2;
				else ret = 1;
			}
		}
	}

	else //纵向
	{
		if(c.y < 0)
		{
			c.y += (BODYSIZE.cy>>1);
			if(c.x*c.x + c.y*c.y <= DD*DD)
			{	//选中上连接点
				if(! (dir&2)) ret = 1;
				else ret = 2;
			}
		}
		else
		{
			c.y -= (BODYSIZE.cy>>1);
			if(c.x*c.x + c.y*c.y <= DD*DD)
			{	//选中下连接点
				if(! (dir&2)) ret = 2;
				else ret = 1;
			}
		}
	}

	if(ret != 0)
	{
		if(lead[ret-1] == NULL)
			return ret;
		else
			return -1;
	}

	if( p.x>=coord.x && p.x<coord.x+BODYSIZE.cx 
		&& p.y>=coord.y && p.y<coord.y+BODYSIZE.cy)
		return -1;	//在控件上

	return 0;
}

void CTRL::Rotate(int rotateAngle)
//旋转控件
{
	dir = (dir + rotateAngle) % 4;
	if(lead[0]) lead[0]->RefreshPos();
	if(lead[1]) lead[1]->RefreshPos();
}

double CTRL::GetResist()const
//@获得控件的电阻
{
	if(RESISTANCE_TYPE[style] != 1)
		return RESISTANCE_TYPE[style];

	switch(style)
	{
	case SOURCE:
		if(((SOURCEDATA *)data)->haveResist)
			return ((SOURCEDATA*)data)->resist;
		else
			return 0;

	case RESIST:
		return ((RESISTDATA*)data)->resist;

	case BULB:
		return ((BULBDATA*)data)->resist;

	case SWITCH:
		if(((SWITCHDATA*)data)->onOff)
			return 0;	//开关闭合
		else
			return -1;	//开关断开
	}

	return 0;
}

double CTRL::GetPress(int direction)const
//@获得控件的电压
{
	double pressure;	//返回电压
	if(!PRESSURE_TYPE[style]) return 0;	//不提供电压

	switch(style)
	{
	case SOURCE:
		pressure = ((SOURCEDATA*)data)->pressure;
		if(direction)
			return - pressure;
		else
			return   pressure;
	}

	return 0;
}

bool CTRL::IsBulbOn()const
//@小灯泡是否达到额定功率而发光
{
	double sData = GetSpecialData();

	if(BULB != style)
		return false;	//不是小灯泡
	if(elecDir != LEFTELEC && elecDir != RIGHTELEC)
		return false;	//电流没有计算或者不符合条件

	double tempData = GetResist() * elec * elec;

	if(!StaticClass::IsZero(sData) && tempData >= sData)
		return true;	//达到额定功率而发光
	else
		return false;	//没有达到额定功率
}

bool CTRL::SwitchOnOff(bool isSwitch)const
//@开关闭合或者断开
{
	if(SWITCH != style) return false;	//不是开关
	bool & tempData = ((SWITCHDATA *)data)->onOff ;
	if(isSwitch) tempData = !tempData;
	return tempData;
}

void CTRL::GetDataList(LISTDATA * list)const
//@与CProperty交换信息
{
	list->Init(2 + DATA_ITEM_NUM[style]);

	list->SetAMember(DATA_STYLE_LPCTSTR, TITLE_NOTE, (void *)name);
	list->SetAMember(DATA_STYLE_bool, TITLESHOW_NOTE, (void *)(&isPaintName));

	switch(style)
	{
	case SOURCE:
		list->SetAMember(
			DATA_STYLE_double,
			DATA_NOTE[DATA_NOTE_PRESS],
			(void *)(&((SOURCEDATA*)data)->pressure));
		list->SetAMember(
			DATA_STYLE_double,
			DATA_NOTE[DATA_NOTE_RESIST],
			(void *)(&((SOURCEDATA*)data)->resist));
		list->SetAMember(
			DATA_STYLE_bool,
			DATA_NOTE[DATA_NOTE_HAVERESIST],
			(void *)(&((SOURCEDATA*)data)->haveResist));
		break;

	case RESIST:
		list->SetAMember(
			DATA_STYLE_double,
			DATA_NOTE[DATA_NOTE_RESIST],
			(void *)(&((RESISTDATA*)data)->resist));
		break;

	case BULB:
		list->SetAMember(
			DATA_STYLE_double,
			DATA_NOTE[DATA_NOTE_RATING],
			(void *)(&((BULBDATA*)data)->rating));
		list->SetAMember(
			DATA_STYLE_double,
			DATA_NOTE[DATA_NOTE_RESIST],
			(void *)(&((BULBDATA*)data)->resist));
		break;

	case CAPA:
		list->SetAMember(
			DATA_STYLE_double,
			DATA_NOTE[DATA_NOTE_CAPA],
			(void *)(&((CAPACITYDATA*)data)->capa));
		break;

	case SWITCH:
		list->SetAMember(
			DATA_STYLE_bool,
			DATA_NOTE[DATA_NOTE_SWITCHONOFF],
			(void *)(&((SWITCHDATA*)data)->onOff));
		break;
	}
}

void CTRL::SaveToTextFile(FILE * fp)const
//@以文字形式保存,测试函数
{
	ASSERT(fp != NULL);

	//fprintf(fp, "name == %s\n", name);
	//fprintf(fp, "Init Order  == %d\n", GetInitOrder());

	switch(style)
	{
	case SOURCE:
		fprintf(fp, "pressure:%f,", ((SOURCEDATA*)data)->pressure);
		fprintf(fp, "resist:%f,", ((SOURCEDATA*)data)->resist);
		break;
	case RESIST:
		fprintf(fp, "resist:%f,", ((RESISTDATA*)data)->resist);
		break;
	case BULB:
		fprintf(fp, "rating:%f,", ((BULBDATA*)data)->rating);
		fprintf(fp, "resist:%f,", ((BULBDATA*)data)->resist);
		break;
	case CAPA:
		fprintf(fp, "capa:%f,", ((CAPACITYDATA*)data)->capa);
		break;
	case SWITCH:
		if(((SWITCHDATA*)data)->onOff)
			fputs("closed:true,", fp);
		else
			fputs("closed:false,", fp);
		break;
	}
}
