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
#include "Ctrl.h"		//电学元件类
#include "Crun.h"		//结点类
#include "Lead.h"		//导线类
#include "Pointer.h"	//当前类


void Pointer::SetOnCtrl(CTRL * ctrl, bool isSetAt)
//指向控件
{
	p3 = ctrl;
	style = ctrl->GetStyle();	//这里控件必须初始化完毕
	if(isSetAt) atState = -1;
}

void Pointer::GetPosFromBody(POINT & pos)const
//从物体和连接点位置获得导线端点坐标
{
	int leadNum = GetLeadNum();

	if(IsOnCrun())	//连接结点
	{
		pos = p2->coord;
		switch(leadNum)
		{
		case 0:	//在上端
			pos.y -= DD;
			break;
		case 1:	//在下端
			pos.y += DD - 1;	//显示存在坐标差(-1)
			break;
		case 2:	//在左端
			pos.x -= DD;
			break;
		case 3:	//在右端
			pos.x += DD - 1;	//显示存在坐标差(-1)
			break;
		}
	}
	else if(IsOnCtrl())	//连接控件
	{
		pos = p3->coord;
		if(! (p3->dir & 1))	//横向
		{
			pos.y += (BODYSIZE.cy>>1);
			if((p3->dir!=0) ^ (leadNum!=0))	//在右端
			{
				pos.x += BODYSIZE.cx - 1;	//显示存在坐标差(-1)
			}
		}
		else//纵向
		{
			pos.x += (BODYSIZE.cx>>1);
			if(((p3->dir-1)!=0) ^ (leadNum!=0))	//在下端
			{
				pos.y += BODYSIZE.cy - 1;	//显示存在坐标差(-1)
			}
		}
	}
}

void Pointer::SaveToFile(FILE * fp)const 
//保存到文件
{
	int num;
	ASSERT(fp != NULL);

	if(IsOnLead())
		num = p1->num;
	else if(IsOnCrun())
		num = p2->num;
	else if(IsOnCtrl())
		num = p3->num;

	fwrite(&style, sizeof(int), 1, fp);
	fwrite(&num, sizeof(int), 1, fp);
	fwrite(&atState, sizeof(atState), 1, fp);
}

bool Pointer::ReadFromFile(
						   FILE * fp,
						   LEAD ** allLead,
						   CRUN ** allCrun,
						   CTRL ** allCtrl)
//从文件读取
{
	int num;
	ASSERT(fp != NULL);

	Clear();
	fread(&style, sizeof(int), 1, fp);
	fread(&num, sizeof(int), 1, fp);

	if(IsOnLead())
	{
		if(num >= 0 && num < MAXLEADNUM)
			SetOnLead(allLead[num]);
		else
			return false;
	}
	else if(IsOnCrun())
	{
		if(num >= 0 && num < MAXCRUNNUM)
			SetOnCrun(allCrun[num]);
		else
			return false;
	}
	else if(IsOnCtrl())
	{
		if(num >= 0 && num < MAXCTRLNUM)
			SetOnCtrl(allCtrl[num]);
		else
			return false;
	}
	else
		return false;

	fread(&atState, sizeof(atState), 1, fp);

	return true;
}

int Pointer::GetConnectPosDir()const
//获得连接点位置
{
	ASSERT(IsOnConnectPos());
	
	if(IsOnCrun())
	{
		return atState;
	}
	else //if(IsOnCtrl())
	{
		ASSERT(p3->dir >=0 && p3->dir <= 3);

		if(atState == 1)
		{
			switch(p3->dir)
			{
			case 0:
				return 3;
				break;
			case 1: 
				return 1;
				break;
			case 2:
				return 4;
				break;
			case 3: 
				return 2;
				break;
			}
		}
		else //if(atState == 2)
		{
			switch(p3->dir)
			{
			case 0:
				return 4;
				break;
			case 1: 
				return 2;
				break;
			case 2:
				return 3;
				break;
			case 3: 
				return 1;
				break;
			}
		}

		return -1;
	}
}

void Pointer::SaveToTextFile(FILE * fp)
//测试函数
{
	ASSERT(fp != NULL);

	fprintf(fp, "{atState:%d,style:%d,", atState, style);

	if (IsOnLead())
	{
		fprintf(fp, "index:%d}", p1->num);
	}
	if (IsOnCrun())
	{
		fprintf(fp, "index:%d}", p2->num);
	}
	else if(IsOnCtrl()) 
	{
		fprintf(fp, "index:%d}", p3->num);
	}
	else
		fprintf(fp, "index:0}");
}
