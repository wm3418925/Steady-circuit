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
#include "Crun.h"			//结点类
#include "Ctrl.h"			//电学元件类
#include "Pointer.h"		//物体指针类
#include "DataList.h"		//LISTDATA, ENUM_STYLE类
#include "Lead.h"			//当前类


unsigned long LEAD::s_initNum = 1;


void LEAD::Uninit()
//释放导线占用的空间
{
	LEADSTEP * now = coord.next;
	LEADSTEP * next;
	while(now != NULL)
	{
		next = now->next;
		delete now;
		now = next;
	}
	coord.next = NULL;
}

LEAD::LEAD(int memNum, const Pointer &p1, const Pointer &p2, bool isInit, COLOR color)
{
	num = memNum;			//地址编号
	initNum = s_initNum++;	//初始化次序
	this->color = color;	//颜色
	elecDir  = UNKNOWNELEC;	//电流方向
	coord.next = NULL;		//坐标链表
	if(isInit)
	{
		conBody[0] = p1;	//连接物体
		conBody[1] = p2;	//连接物体
		RefreshPos();		//更新坐标链表
	}
}

LEAD::~LEAD()
{
	Uninit();
}

LEAD * LEAD::Clone(CLONE_PURPOSE cp)
//复制
{
	LEAD * newLead = new LEAD(num, conBody[0], conBody[1], false, color);

	//复制坐标
	LEADSTEP * p1 = &(this->coord);
	LEADSTEP * p2 = &(newLead->coord);
	while(p1->next != NULL)
	{
		p2->pos = p1->pos;
		p2->next = new LEADSTEP;

		p1 = p1->next;
		p2 = p2->next;
	}
	p2->pos = p1->pos;
	p2->next = NULL;

	if(CLONE_FOR_USE != cp)
	{
		newLead->initNum = this->initNum;
		--s_initNum;
	}
	return newLead;
}

unsigned long LEAD::GetInitOrder()const
//获得初始化序号
{
	return initNum;
}

void LEAD::ResetInitNum()
//重置初始化次序
{
	LEAD::s_initNum = 1;
}

int LEAD::GetBodyPos()const 
//获得导线两个连接物体的相对位置
//字节最后一位:
//			0 起点物体 在 终点物体 上面
//			1 起点物体 在 终点物体 下面
//字节倒数第二位:
//			0 起点物体 在 终点物体 左面
//			1 起点物体 在 终点物体 右面
{
	const Pointer * a = conBody;
	const Pointer * b = conBody + 1;
	POINT posa, posb;

	//获得坐标
	ASSERT(a->IsOnBody(false));
	if(a->IsOnCrun())
		posa = a->p2->coord;
	else //if(a->IsOnCtrl())
		posa = a->p3->coord;

	ASSERT(b->IsOnBody(false));
	if(b->IsOnCrun())
		posb = b->p2->coord;
	else //if(b->IsOnCtrl())
		posb = b->p3->coord;

	return ((posa.x > posb.x) << 1) + (posa.y > posb.y);
}

void LEAD::GetDataList(const char * name, LISTDATA * list)
//与CProperty交换信息
{
	list->Init(1);
	list->SetAEnumMember(name, &color, ENUM_COLOR);
}

void LEAD::EasyInitPos(POINT from, POINT to)
//粗糙的初始化导线坐标
{
	LEADSTEP * now;

	//释放坐标占用空间
	Uninit();

	//起始坐标
	now = &coord;
	now->pos = from;
	now->next = new LEADSTEP;
	now = now->next;

	//中间点坐标
	if(from.x != to.x && from.y != to.y)
	{
		now->pos.x = from.x;
		now->pos.y = to.y;
		now->next = new LEADSTEP;
		now = now->next;
	}

	//终点坐标
	now->pos = to;
	now->next = NULL;
}

bool LEAD::Divide(int atstate, POINT pos, LEADSTEP &a, LEADSTEP &b)
//导线坐标一分为二
{
	LEADSTEP * now;
	LEADSTEP * newPoint;

	ASSERT(atstate <= -2);
	atstate = (-atstate - 2) >> 1;

	//找到指针
	a = coord;
	now = &a;	//不能改为now = &coord;
	while(now!=NULL && atstate!=0)
	{
		now = now->next;
		-- atstate;
	}
	if(now == NULL || now->next == NULL) return false;

	b.next = now->next;
	b.pos = pos;
	if(now->pos.x == now->next->pos.x)b.pos.x = now->pos.x;	//在竖线上
	else b.pos.y = now->pos.y;	//在横线上

	//分开导线
	newPoint = new LEADSTEP;
	newPoint->pos = b.pos;
	newPoint->next = NULL;
	now->next = newPoint;

	//销毁导线坐标链表	
	coord.next = NULL;

	return true;
}

void LEAD::ReplacePos(LEADSTEP newPos)
//替换原来的坐标
{
	Uninit();
	coord = newPos;
}

int LEAD::At(POINT p)const 
//获得鼠标在导线的位置 : -3,-5,-7,...横线部分; -2,-4,-6,...竖线部分; 0不在.
{
	const LEADSTEP * pre = &coord, * now = pre->next;
	long min, max;
	int i = -2;

	while(now != NULL)
	{
		if(pre->pos.x == now->pos.x)	//在竖线上
		{
			if(now->pos.y > pre->pos.y)
			{
				min = pre->pos.y; 
				max = now->pos.y;
			}
			else 
			{
				min = now->pos.y; 
				max = pre->pos.y;
			}
			if( p.y > min 
				&& p.y < max 
				&& p.x > now->pos.x - DD 
				&& p.x < now->pos.x + DD)
				return i;
		}
		else	//在横线上
		{
			if(now->pos.x > pre->pos.x)
			{
				min = pre->pos.x; 
				max = now->pos.x;
			}
			else 
			{
				min = now->pos.x; 
				max = pre->pos.x;
			}
			if( p.x > min 
				&& p.x < max 
				&& p.y > now->pos.y - DD
				&& p.y < now->pos.y + DD)
				return i-1;
		}

		pre = now;
		now = now->next;
		i -= 2;
	}

	return 0;
}

void LEAD::CleanLead()
//删除有相同坐标的导线结点
{
	LEADSTEP * p1 = &coord;
	LEADSTEP * p2 = p1->next;
	LEADSTEP * p3 = p2->next;

	if(p3 == NULL) return;	//只有2个节点的导线不考虑
	if(p1->pos.x == p2->pos.x && p1->pos.y == p2->pos.y)
	{
		delete p2;
		p1->next = p3;
		return;
	}
	while(p3 != NULL)
	{
		if(p2->pos.x == p3->pos.x && p2->pos.y == p3->pos.y)
		{
			if(p3->next != NULL)
			{
				p1->next = p3->next;
				delete p2;
				delete p3;
			}
			else
			{
				p2->next = NULL;
				delete p3;
			}
			break;
		}

		p1 = p2;
		p2 = p3;
		p3 = p3->next;
	}
}

int LEAD::GetPosFit(int pos1, int pos2, int dis, bool isEnd)
//在2段平行导线之间或两边找到合适的另一个平行导线的位置
{
	int dis2 = -2;
	if(isEnd) dis2 = 2;

	if(pos2 - pos1 > dis || pos1 - pos2 > dis)
	{
		return (pos2 + pos1)/2 + dis2;
	}
	else if(pos1 < 300)
	{
		if(pos2 >= pos1)
			return pos2 + dis + dis2;
		else
			return pos1 + dis + dis2;
	}
	else
	{
		if(pos2 <= pos1)
			return pos2 - dis - dis2;
		else
			return pos1 - dis - dis2;
	}
}

void LEAD::FitStart(int dis)
//使导线不遮挡连接的第1个物体
{
	ASSERT(coord.next != NULL);
	//初始化变量 -------------------------------------------------------
	LEADSTEP * next = coord.next;
	LEADSTEP * next2 = next->next;
	LEADSTEP * temp, * now;
	const int dir = conBody[0].GetConnectPosDir();
	const int dirSum = dir + conBody[1].GetConnectPosDir();
	const bool oppositeFlag = (dirSum == 3 || dirSum == 7);
	int dis2 = 15;
	if(dir & 1) dis2 = -15;

	//判断执行条件 -----------------------------------------------------
	switch(dir)
	{
	case 1:	//上连接点
		if(coord.pos.x != next->pos.x || coord.pos.y >= next->pos.y)
			return;
		break;

	case 2:	//下连接点
		if(coord.pos.x != next->pos.x || coord.pos.y <= next->pos.y)
			return;
		break;

	case 3:	//左连接点
		if(coord.pos.y != next->pos.y || coord.pos.x >= next->pos.x)
			return;
		break;

	case 4:	//右连接点
		if(coord.pos.y != next->pos.y || coord.pos.x <= next->pos.x)
			return;
		break;
	}

	//导线只有2个节点 ---------------------------------------------------
	if(next2 == NULL)
	{
		switch(dir)
		{
		case 1:	//上连接点
		case 2:	//下连接点
			coord.next = now = new LEADSTEP;
			now->pos.x = coord.pos.x;
			now->pos.y = coord.pos.y + dis2;

			now->next = temp = new LEADSTEP;
			temp->pos.y = now->pos.y;
			temp->pos.x = now->pos.x - dis;
			now = temp;

			now->next = temp = new LEADSTEP;
			temp->pos.x = now->pos.x;
			temp->pos.y = now->pos.y - dis2*2 + next->pos.y - coord.pos.y;
			now = temp;

			now->next = temp = new LEADSTEP;
			temp->pos.y = now->pos.y;
			temp->pos.x = now->pos.x + dis;

			temp->next = next;
			return;

		case 3:	//左连接点
		case 4:	//右连接点
			coord.next = now = new LEADSTEP;
			now->pos.y = coord.pos.y;
			now->pos.x = coord.pos.x + dis2;
			
			now->next = temp = new LEADSTEP;
			temp->pos.x = now->pos.x;
			temp->pos.y = now->pos.y - dis;
			now = temp;

			now->next = temp = new LEADSTEP;
			temp->pos.y = now->pos.y;
			temp->pos.x = now->pos.x - dis2*2 + next->pos.x - coord.pos.x;
			now = temp;

			now->next = temp = new LEADSTEP;
			temp->pos.x = now->pos.x;
			temp->pos.y = now->pos.y + dis;

			temp->next = next;
			return;
		}
	}
	
	//导线只有3个节点 ---------------------------------------------------
	else if(next2->next == NULL)
	{
		if(oppositeFlag)
		{
			switch(dir)
			{
			case 1:	//上连接点
			case 2:	//下连接点
				//add point1
				coord.next = now = new LEADSTEP;
				now->pos.x = coord.pos.x;
				now->pos.y = coord.pos.y + dis2;

				//add point2
				now->next = temp = new LEADSTEP;
				temp->pos.y = now->pos.y;
				temp->pos.x = GetPosFit(coord.pos.x, next2->pos.x, dis, false);
				now = temp;

				//add point3
				now->next = temp = new LEADSTEP;
				temp->pos.x = now->pos.x;
				temp->pos.y = next2->pos.y - dis2;
				now = temp;

				//update point next
				now->next = next;

				next->pos.x = next2->pos.x;
				next->pos.y = now->pos.y;
				return;

			case 3:	//左连接点
			case 4:	//右连接点
				//add point1
				coord.next = now = new LEADSTEP;
				now->pos.y = coord.pos.y;
				now->pos.x = coord.pos.x + dis2;

				//add point2
				now->next = temp = new LEADSTEP;
				temp->pos.x = now->pos.x;
				temp->pos.y = GetPosFit(coord.pos.y, next2->pos.y, dis, false);
				now = temp;

				//add point3
				now->next = temp = new LEADSTEP;
				temp->pos.y = now->pos.y;
				temp->pos.x = next2->pos.x - dis2;
				now = temp;

				//update point next
				now->next = next;

				next->pos.y = next2->pos.y;
				next->pos.x = now->pos.x;
				return;
			}
		}
		else
		{
			switch(dir)
			{
			case 1:	//上连接点
			case 2:	//下连接点
				coord.next = now = new LEADSTEP;
				now->pos.x = coord.pos.x;
				now->pos.y = coord.pos.y + dis2;

				now->next = next;

				next->pos.x = next2->pos.x;
				next->pos.y = now->pos.y;
				return;

			case 3:	//左连接点
			case 4:	//右连接点
				coord.next = now = new LEADSTEP;
				now->pos.y = coord.pos.y;
				now->pos.x = coord.pos.x + dis2;

				now->next = next;

				next->pos.y = next2->pos.y;
				next->pos.x = now->pos.x;
				return;
			}
		}
	}
	
	//导线只有4个节点且连接点相对 ---------------------------------------
	else if(oppositeFlag && next2->next->next == NULL)
	{
		switch(dir)
		{
		case 1:	//上连接点
		case 2:	//下连接点
			//new point
			coord.next = temp = new LEADSTEP;
			temp->pos.y = coord.pos.y;
			temp->pos.x = GetPosFit(coord.pos.x, next2->pos.x, dis, false);
			temp->next = next;
			
			//next point
			next->pos.x = temp->pos.x;
			return;

		case 3:	//左连接点
		case 4:	//右连接点
			//new point
			coord.next = temp = new LEADSTEP;
			temp->pos.x = coord.pos.x;
			temp->pos.y = GetPosFit(coord.pos.y, next2->pos.y, dis, false);
			temp->next = next;
			
			//next point
			next->pos.y = temp->pos.y;
			return;
		}
	}
	
	//导线至少有5个节点或连接点不相对 -----------------------------------
	else
	{
		switch(dir)
		{
		case 1:	//上连接点
		case 2:	//下连接点
			next2->pos.y = next->pos.y = coord.pos.y + dis2;
			return;

		case 3:	//左连接点
		case 4:	//右连接点
			next2->pos.x = next->pos.x = coord.pos.x + dis2;
			return;
		}
	}
}

void LEAD::FitEnd(int dis)
//使导线不遮挡连接的第2个物体
{
	ASSERT(coord.next != NULL);
	//初始化变量 -------------------------------------------------------
	LEADSTEP * temp, * now, * pre1, * pre2, * next, * next2;
	const int dir = conBody[1].GetConnectPosDir();
	const int dirOther = conBody[0].GetConnectPosDir();
	int dis2 = 15;
	if(dir & 1) dis2 = -15;

	pre2 = NULL;
	pre1 = &coord;
	now  = coord.next;
	while(now->next != NULL)
	{
		pre2 = pre1;
		pre1 = now;
		now = now->next;
	}
	next = coord.next;
	next2 = next->next;

	//判断执行条件 -----------------------------------------------------
	switch(dir)
	{
	case 1:	//上连接点
		if(now->pos.x != pre1->pos.x || now->pos.y >= pre1->pos.y)
			return;
		break;

	case 2:	//下连接点
		if(now->pos.x != pre1->pos.x || now->pos.y <= pre1->pos.y)
			return;
		break;

	case 3:	//左连接点
		if(now->pos.y != pre1->pos.y || now->pos.x >= pre1->pos.x)
			return;
		break;

	case 4:	//右连接点
		if(now->pos.y != pre1->pos.y || now->pos.x <= pre1->pos.x)
			return;
		break;
	}

	//导线只有2个节点 ---------------------------------------------------
	if(next2 == NULL)
	{
		switch(dir)
		{
		case 1:	//上连接点
		case 2:	//下连接点
			coord.next = temp = new LEADSTEP;
			temp->pos.y = coord.pos.y;
			if(dirOther == 4)
				temp->pos.x = coord.pos.x - dis;
			else
				temp->pos.x = coord.pos.x + dis;
			now = temp;

			now->next = temp = new LEADSTEP;
			temp->pos.x = now->pos.x;
			temp->pos.y = next->pos.y + dis2;
			now = temp;

			now->next = temp = new LEADSTEP;
			temp->pos.y = now->pos.y;
			temp->pos.x = next->pos.x;

			temp->next = next;
			return;

		case 3:	//左连接点
		case 4:	//右连接点
			coord.next = temp = new LEADSTEP;
			temp->pos.x = coord.pos.x;
			if(dirOther == 2)
				temp->pos.y = coord.pos.y - dis;
			else
				temp->pos.y = coord.pos.y + dis;
			now = temp;

			now->next = temp = new LEADSTEP;
			temp->pos.y = now->pos.y;
			temp->pos.x = next->pos.x + dis2;
			now = temp;

			now->next = temp = new LEADSTEP;
			temp->pos.x = now->pos.x;
			temp->pos.y = next->pos.y;

			temp->next = next;
			return;
		}
	}

	//导线只有3个节点 ---------------------------------------------------
	else if(next2->next == NULL)
	{
		switch(dir)
		{
		case 1:	//上连接点
		case 2:	//下连接点
			//next->pos.x
			if(dirOther == 4)
				next->pos.x = next2->pos.x + dis;
			else if(dirOther == 3)
				next->pos.x = next2->pos.x - dis;
			else
				next->pos.x = GetPosFit(coord.pos.x, next2->pos.x, dis, true);

			//add point
			next->next = temp = new LEADSTEP;
			temp->pos.x = next->pos.x;
			temp->pos.y = next2->pos.y;
			temp->next = next2;
			return;

		case 3:	//左连接点
		case 4:	//右连接点
			//next->pos.y
			if(dirOther == 2)
				next->pos.y = next2->pos.y + dis;
			else if(dirOther == 1)
				next->pos.y = next2->pos.y - dis;
			else
				next->pos.y = GetPosFit(coord.pos.y, next2->pos.y, dis, true);

			//add point
			next->next = temp = new LEADSTEP;
			temp->pos.y = next->pos.y;
			temp->pos.x = next2->pos.x;
			temp->next = next2;
			return;
		}
	}
	
	//导线只有4个节点 ----------------------------------------------
	else if(next2->next->next == NULL)
	{
		switch(dir)
		{
		case 1:	//上连接点
		case 2:	//下连接点
			if(dirOther == 3 || dirOther == 4)
			{
				pre1->pos.y = pre2->pos.y = now->pos.y + dis2;
			}
			else //dir != dirOther
			{
				next2->next = temp = new LEADSTEP;
				temp->next = now;

				temp->pos.y = now->pos.y;
				next2->pos.x = temp->pos.x = GetPosFit(coord.pos.x, next2->pos.x, dis, true);
			}
			return;

		case 3:	//左连接点
		case 4:	//右连接点
			if(dirOther == 1 || dirOther == 2)
			{
				pre1->pos.x = pre2->pos.x = now->pos.x + dis2;
			}
			else //dir != dirOther
			{
				next2->next = temp = new LEADSTEP;
				temp->next = now;

				temp->pos.x = now->pos.x;
				next2->pos.y = temp->pos.y = GetPosFit(coord.pos.y, next2->pos.y, dis, true);
			}
			return;
		}
	}

	//导线至少有5个节点 --------------------------------------------
	else
	{
		switch(dir)
		{
		case 1:	//上连接点
		case 2:	//下连接点
			pre1->pos.y = pre2->pos.y = now->pos.y + dis2;
			return;

		case 3:	//左连接点
		case 4:	//右连接点
			pre1->pos.x = pre2->pos.x = now->pos.x + dis2;
			return;
		}
	}
}

void LEAD::MakeFit()
//当新的导线位置覆盖连接的物体时,美化导线
{
	ASSERT(coord.next != NULL);

	if(conBody[0].IsOnCrun())
	{
		FitStart(DD*3);
	}
	else //if(conBody[0].IsOnCtrl())
	{
		FitStart(BODYSIZE.cx);
	}

	if(conBody[1].IsOnCrun())
	{
		FitEnd(DD*3);
	}
	else //if(conBody[1].IsOnCtrl())
	{
		FitEnd(BODYSIZE.cx);
	}
}

bool LEAD::Move(int dir, POINT pos, const int dis)
//移动导线
{
	LEADSTEP * pre2 = NULL;
	LEADSTEP * pre  = &coord;
	LEADSTEP * now  = pre->next;
	LEADSTEP * next = NULL;
	int i = -2;
	int inter = 0;

	//1,找到指针----------------------------------
	while(now != NULL)
	{
		if(pre->pos.x == now->pos.x)	//在竖线上
		{
			if(i == dir) break;
		}
		else	//在横线上
		{
			if(i-1 == dir) break;
		}
		pre2 = pre;
		pre = now;
		now = now->next;
		i -= 2;
	}
	if(now == NULL) return false;	//没有找到
	else next = now->next;

	//2重新设置竖线坐标--------------------------
	if(pre->pos.x == now->pos.x)	//在竖线上
	{
		if(pos.x == pre->pos.x) return false;	//无需改变

		//2.1处理pre是头.........................
		if(pre2 == NULL)	//pre是头
		{
			if(next != NULL)	//now不是结尾
			{
				inter = pos.x - next->pos.x;
				if(inter < 0)inter = -inter;
			}

			if(next != NULL && inter <= dis)	//now不是结尾
			{
				if(next->next != NULL)	//next不是结尾
				{
					delete now;
					pre->next = next;
					next->pos.y = pre->pos.y;
				}
				else	//next是结尾
				{
					now->pos.x = next->pos.x;
					now->pos.y = pre->pos.y;
				}
			}
			else if(next != NULL)	//now不是结尾
			{
				pre2  = new LEADSTEP;
				pre2->pos.x = pos.x;
				pre2->pos.y = pre->pos.y;
				pre2->next = now;

				pre->next = pre2;

				now->pos.x = pos.x;
			}
			else	//now是结尾
			{
				pre2 = new LEADSTEP;
				pre2->pos.x = pos.x;
				pre2->pos.y = pre->pos.y;

				next = new LEADSTEP;
				next->pos.x = pos.x;
				next->pos.y = now->pos.y;

				pre->next = pre2;
				pre2->next = next;
				next->next = now;
			}

			goto end;
		}//以下pre不是头

		//2.2处理now是结尾.........................
		if(next == NULL)	//now是结尾
		{
			inter = pos.x - pre2->pos.x;
			if(inter < 0)inter = -inter;

			if(inter <= dis)
			{
				if(pre2 != &coord)	//pre2不是头
				{
					delete pre;
					pre2->next = now;
					pre2->pos.y = now->pos.y;
				}
				else	//pre2是头
				{
					pre->pos.x = pre2->pos.x;
					pre->pos.y = now->pos.y;
				}
			}
			else
			{
				next  = new LEADSTEP;
				next->pos.x = pos.x;
				next->pos.y = now->pos.y;

				pre->pos.x = pos.x;

				pre->next = next;
				next->next = now;
			}

			goto end;
		}//以下now不是结尾

		//2.3处理与前面合并..........................
		inter = pos.x - pre2->pos.x;
		if(inter < 0)inter = -inter;

		if(inter <= dis)	//导线合并
		{
			if(pre2 != &coord)	//pre2不是头
			{
				delete pre;
				delete now;
				pre2->next = next;
				pre2->pos.y = next->pos.y;
			}
			else	//pre2是头
			{
				delete pre;
				pre2->next = now;
				now->pos.x = pre2->pos.x;

				if(now->pos.x == next->pos.x && now->pos.y == next->pos.y)
				{
					delete now;
					pre2->next = next;
				}
			}
			
			goto end;
		}

		//2.4处理与后面合并..........................
		inter = pos.x - next->pos.x;
		if(inter < 0)inter = -inter;

		if(inter <= dis)	//导线合并
		{
			if(next->next != NULL)	//next不是结尾
			{
				delete pre;
				delete now;
				pre2->next = next;
				next->pos.y = pre2->pos.y;
			}
			else	//next是结尾
			{
				delete now;
				pre->next = next;
				pre->pos.x = next->pos.x;
			}
			goto end;
		}

		//2.5处理其他情况..........................
		now->pos.x = pos.x;
		pre->pos.x = pos.x;
		goto end;

	}//重新设置竖线坐标

	//3重新设置横线坐标--------------------------
	if(pre->pos.y == now->pos.y)	//在横线上
	{
		if(pos.y == pre->pos.y) return false;	//无需改变

		//3.1处理pre是头.........................
		if(pre2 == NULL)	//pre是头
		{
			if(next != NULL)	//now不是结尾
			{
				inter = pos.y - next->pos.y;
				if(inter < 0)inter = -inter;
			}

			if(next != NULL && inter <= dis)	//now不是结尾
			{
				if(next->next != NULL)	//next不是结尾
				{
					delete now;
					pre->next = next;
					next->pos.x = pre->pos.x;
				}
				else	//next是结尾
				{
					now->pos.y = next->pos.y;
					now->pos.x = pre->pos.x;
				}
			}
			else if(next != NULL)	//now不是结尾
			{
				pre2  = new LEADSTEP;
				pre2->pos.y = pos.y;
				pre2->pos.x = pre->pos.x;
				pre2->next = now;

				pre->next = pre2;

				now->pos.y = pos.y;
			}
			else	//now是结尾
			{
				pre2 = new LEADSTEP;
				pre2->pos.y = pos.y;
				pre2->pos.x = pre->pos.x;

				next = new LEADSTEP;
				next->pos.y = pos.y;
				next->pos.x = now->pos.x;

				pre->next = pre2;
				pre2->next = next;
				next->next = now;
			}

			goto end;
		}//以下pre不是头

		//3.2处理now是结尾.........................
		if(next == NULL)	//now是结尾
		{
			inter = pos.y - pre2->pos.y;
			if(inter < 0)inter = -inter;

			if(inter <= dis)
			{
				if(pre2 != &coord)	//pre2不是头
				{
					delete pre;
					pre2->next = now;
					pre2->pos.x = now->pos.x;
				}
				else	//pre2是头
				{
					pre->pos.y = pre2->pos.y;
					pre->pos.x = now->pos.x;
				}
			}
			else
			{
				next  = new LEADSTEP;
				next->pos.y = pos.y;
				next->pos.x = now->pos.x;

				pre->pos.y = pos.y;

				pre->next = next;
				next->next = now;
			}

			goto end;
		}//以下now不是结尾

		//3.3处理与前面合并..........................
		inter = pos.y - pre2->pos.y;
		if(inter < 0)inter = -inter;

		if(inter <= dis)	//导线合并
		{
			if(pre2 != &coord)	//pre2不是头
			{
				delete pre;
				delete now;
				pre2->next = next;
				pre2->pos.x = next->pos.x;
			}
			else	//pre2是头
			{
				delete pre;
				pre2->next = now;
				now->pos.y = pre2->pos.y;

				if(now->pos.x == next->pos.x && now->pos.y == next->pos.y)
				{
					delete now;
					pre2->next = next;
				}
			}

			goto end;
		}

		//3.4处理与后面合并..........................
		inter = pos.y - next->pos.y;
		if(inter < 0)inter = -inter;

		if(inter <= dis)	//导线合并
		{
			if(next->next != NULL)	//next不是结尾
			{
				delete pre;
				delete now;
				pre2->next = next;
				next->pos.x = pre2->pos.x;
			}
			else	//next是结尾
			{
				delete now;
				pre->next = next;
				pre->pos.y = next->pos.y;
			}
			goto end;
		}

		//3.5处理其他情况..........................
		now->pos.y = pos.y;
		pre->pos.y = pos.y;
		goto end;

	}	//重新设置横线坐标

end:

	CleanLead();	//删除有相同坐标的导线结点
	//MakeFit();		//美化导线

	return true;
}

void LEAD::RefreshPos()
//连接物体坐标改变,更新导线位置
{
	POINT from, to;
	LEADSTEP * now;
	LEADSTEP * p1, * p2;

	//重新获得两个端点坐标
	conBody[0].GetPosFromBody(from);
	conBody[1].GetPosFromBody(to);

	//初始化
	if(!coord.next || !coord.next->next)
	{
		EasyInitPos(from, to);
		MakeFit();	//美化导线
		return;
	}

	now = &coord;
	
	//起点坐标改变
	if(from.x != now->pos.x || from.y != now->pos.y)
	{
		p1 = now->next;
		p2 = p1->next;
		
		if(p1->pos.x != now->pos.x || p1->pos.y != now->pos.y)
		{//前2个坐标不同
			if(p1->pos.x == now->pos.x)
				p1->pos.x = from.x;
			else
				p1->pos.y = from.y;
			now->pos = from;
		}
		else if(p1->pos.x != p2->pos.x || p1->pos.y != p2->pos.y)
		{//第2,3个坐标不同
			if(p1->pos.x == p2->pos.x)
				p1->pos.y = from.y;
			else
				p1->pos.x = from.x;
			now->pos = from;
		}
		else
		{
			EasyInitPos(from, to);	//初始化
			MakeFit();	//美化导线
			return;
		}
	}
	
	//得到终点坐标
	p1 = p2 = NULL;
	while (now->next != NULL)
	{
		p2 = p1;
		p1 = now;
		now = now->next;
	}
	
	//终点坐标改变
	if(to.x != now->pos.x || to.y != now->pos.y)
	{
		if(p1->pos.x != now->pos.x || p1->pos.y != now->pos.y)
		{//后2个坐标不同
			if(p1->pos.x == now->pos.x)
				p1->pos.x = to.x;
			else
				p1->pos.y = to.y;
			now->pos = to;
		}
		else if(p1->pos.x != p2->pos.x || p1->pos.y != p2->pos.y)
		{//倒数2,3个坐标不同
			if(p1->pos.x == p2->pos.x)
				p1->pos.y = to.y;
			else
				p1->pos.x = to.x;
			now->pos = to;
		}
		else
		{
			EasyInitPos(from, to);	//初始化
			MakeFit();	//美化导线
			return;
		}
	}

	CleanLead();	//去除相同坐标的导线节点
	MakeFit();		//美化导线
}

void LEAD::SaveToFile(FILE * fp)const 
//保存到文件
{
	const LEADSTEP * temp = &coord;
	ASSERT(fp != NULL);

	while(temp != NULL)
	{
		fwrite(temp, sizeof(LEADSTEP), 1, fp);
		temp = temp->next;
	}

	fwrite(&color, sizeof(enum), 1, fp);

	conBody[0].SaveToFile(fp);
	conBody[1].SaveToFile(fp);
}

void LEAD::ReadFromFile(FILE * fp, LEAD ** allLead, CRUN ** allCrun, CTRL ** allCtrl)
//从文件读取
{
	LEADSTEP * temp = &coord;
	ASSERT(fp!=NULL && allLead!=NULL && allCrun!=NULL && allCtrl!=NULL);

	while(temp != NULL)
	{
		fread(temp, sizeof(LEADSTEP), 1, fp);
		if(temp->next)temp->next = new LEADSTEP;
		temp = temp->next;
	}

	fread(&color, sizeof(enum), 1, fp);

	conBody[0].ReadFromFile(fp, allLead, allCrun, allCtrl);
	conBody[1].ReadFromFile(fp, allLead, allCrun, allCtrl);
}

void LEAD::PaintLead(CDC * dc)const 
//画导线
{
	ASSERT(dc != NULL);

	const LEADSTEP * temp = &coord;
	dc->MoveTo(temp->pos);
	temp = temp->next;
	while(temp != NULL)
	{
		dc->LineTo(temp->pos);
		temp = temp->next;
	}
}

void LEAD::GetStartEndPos(POINT &pos1, POINT &pos2)const
//获得导线开始位置和结尾坐标
{
	const LEADSTEP * temp = &coord;
	while(temp->next != NULL) temp = temp->next;
	pos1 = coord.pos;
	pos2 = temp->pos;
}

void LEAD::SaveToTextFile(FILE * fp)const 
//以文字形式保存,测试函数
{
	ASSERT(fp != NULL);

	const LEADSTEP * temp;

	//fprintf(fp, "导线 Init Order = %d :\n", GetInitOrder());

	fprintf(fp, "x:[");
	temp = &coord;
	while(temp)
	{
		fprintf(fp, "%d", temp->pos.x);
		temp = temp->next;
		if (temp) fputc(',', fp);
	}
	fprintf(fp, "],\n");

	fprintf(fp, "y:[");
	temp = &coord;
	while(temp)
	{
		fprintf(fp, "%d", temp->pos.y);
		temp = temp->next;
		if (temp) fputc(',', fp);
	}
	fprintf(fp, "],\n");
}
