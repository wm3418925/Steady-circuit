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
#include "resource.h"
#include "StaticClass.h"	//包含static方法的类
#include "MyPropertyDlg.h"	//使用Property对话框
#include "Equation.h"		//使用计算N元一次方程的类
#include "CountStruct.h"	//用于结算的结构体
#include "Lead.h"			//导线类
#include "Ctrl.h"			//电学元件类
#include "Crun.h"			//结点类
#include "DataList.h"		//LISTDATA,ENUM_STYLE
#include "KMP.h"			//KMP算法类
#include "Manager.h"		//当前类


//1初始化和清理函数------------------------------------------------------------↓
Manager::Manager(CWnd * outWnd)
{
	int i;
	HINSTANCE hinst = AfxGetInstanceHandle();


	//窗口显示-------------------------------------------------------
	wndPointer = outWnd;		//当前窗口指针
	dc = wndPointer->GetDC();	//当前窗口设备描述表

	bitmapForRefresh.CreateBitmap(1, 1, 1, 32, NULL);	//使刷新不闪而使用的bitmap
	dcForRefresh.CreateCompatibleDC(dc);				//使刷新不闪而使用的DC
	dcForRefresh.SelectObject(&bitmapForRefresh);


	//相对变量-------------------------------------------------------
	viewOrig.x = viewOrig.y = 0;					//视角初始坐标
	mouseWheelSense.cx = mouseWheelSense.cy = 32;	//mouseWheel的灵活度
	moveBodySense = 3;								//按上下左右键物体一次移动的距离
	maxLeaveOutDis = 7;								//导线合并最大距离


	//电路元件变量---------------------------------------------------
	ZeroMemory(crun, sizeof(void *) * MAXCRUNNUM);
	ZeroMemory(ctrl, sizeof(void *) * MAXCTRLNUM);
	ZeroMemory(lead, sizeof(void *) * MAXLEADNUM);
	crunNum = leadNum = ctrlNum = 0;	//物体的个数清零


	//计算变量-------------------------------------------------------
	circu = NULL;		//线路
	circuNum = 0;		//线路个数,小于等于 crun*2
	crun2 = NULL;		//将crun信息提取出来用于计算,个数同crun
	maps = NULL;		//保存所有的线路
	groupNum = 0;		//组数,同一组的在一个连通图中,分组建立方程
	equation = NULL;	//方程处理的类


	//鼠标点击信息记录-----------------------------------------------
	motiNum = 0;
	addState = BODY_NO;
	lButtonDownPos.x = -100;
	lButtonDownState = false;
	isUpRecvAfterDown = true;
	FocusBodyClear(NULL);


	//画图变量-------------------------------------------------------
	textColor = BLACK;						//默认字体颜色
	focusLeadStyle = SOLID_RESERVE_COLOR;	//默认焦点导线样式
	focusCrunColor = GREEN;					//默认焦点结点颜色
	focusCtrlColor = RED;					//默认焦点控件颜色
	InitBitmap();							//初始化位图

	//画笔
	for(i=COLOR_TYPE_NUM-1; i>=0; --i) 
		hp[i].CreatePen(PS_SOLID, 1, LEADCOLOR[i]);

	//鼠标图标
	hcSizeNS		= LoadCursor(NULL,	IDC_SIZENS);
	hcSizeWE		= LoadCursor(NULL,	IDC_SIZEWE);
	hcShowConnect	= LoadCursor(hinst,	MAKEINTRESOURCE(IDC_CURSOR_SHOWCONNECT));
	hcHand			= LoadCursor(hinst,	MAKEINTRESOURCE(IDC_CURSOR_HAND));
	hcMoveHorz		= LoadCursor(hinst,	MAKEINTRESOURCE(IDC_CURSOR_HORZ_LEAD));
	hcMoveVert		= LoadCursor(hinst,	MAKEINTRESOURCE(IDC_CURSOR_VERT_LEAD));
	hcAddCrun		= LoadCursor(hinst,	MAKEINTRESOURCE(IDC_CURSOR_ADDCRUN));


	//读取文件-------------------------------------------------------
	vectorPos = NULL;
	fileName[0] = '\0';
	PutCircuitToVector();	//将当前空电路信息保存到容器
}

Manager::~Manager()
{
	DeleteVector(circuitVector.begin(), circuitVector.end());	//清除容器保存的电路信息

	ClearClipboard();	//清空剪切板

	//清除画图变量
	DeleteObject(hcSizeNS);
	DeleteObject(hcSizeWE);
	DeleteObject(hcShowConnect);
	DeleteObject(hcHand);
	DeleteObject(hcMoveHorz);
	DeleteObject(hcMoveVert);			//清除鼠标图标
	for(int i=COLOR_TYPE_NUM-1; i>=0; --i) hp[i].DeleteObject();	//清除画笔
	UninitBitmap();						//释放位图
	wndPointer->ReleaseDC(dc);			//释放画图DC
	bitmapForRefresh.DeleteObject();	//使刷新不闪而使用的bitmap
	dcForRefresh.DeleteDC();			//使刷新不闪而使用的DC
}

void Manager::InitBitmap()
//初始化位图句柄
{
	int i, j, k, l;
	UINT * buf1, * buf2, * p;

	//激活点位图------------------------------------
	showConnectDcMem.CreateCompatibleDC(dc);
	showConnectBitmap.LoadBitmap(IDB_SMALLCRUN);
	showConnectDcMem.SelectObject(&showConnectBitmap);

	//节点位图--------------------------------------
	crunDcMem.CreateCompatibleDC(dc);
	crunBitmap.LoadBitmap(IDB_CRUN);
	crunDcMem.SelectObject(&crunBitmap);

	//控件位图,处理得到旋转控件---------------------
	buf1 = (UINT *)malloc(BODYSIZE.cx * BODYSIZE.cy * 4);
	buf2 = (UINT *)malloc(BODYSIZE.cx * BODYSIZE.cy * 4);

	for(k=CTRL_BITMAP_TYPE_NUM-1; k>=0; --k)
	{
		//原位图
		ctrlDcMem[k].CreateCompatibleDC(dc);
		ctrlBitmap[k].LoadBitmap(IDB_SOURCE + k);
		ctrlDcMem[k].SelectObject(ctrlBitmap + k);
		ctrlBitmap[k].GetBitmapBits(BODYSIZE.cx*BODYSIZE.cy*4, buf1);	//获得原位图像素

		//获得旋转位图
		for(l=1; l<4; ++l)
		{
			p = buf1 + (BODYSIZE.cy - 1) * BODYSIZE.cx + BODYSIZE.cx - 1;
			for(i = BODYSIZE.cy - 1; i >= 0; --i) for(j = BODYSIZE.cx - 1; j >= 0; --j)
				* ( buf2 + j * BODYSIZE.cx + BODYSIZE.cx - 1 - i) = * p --;

			i = k + CTRL_BITMAP_TYPE_NUM*l;
			ctrlDcMem[i].CreateCompatibleDC(dc);
			ctrlBitmap[i].CreateBitmap(BODYSIZE.cx, BODYSIZE.cy, 1, 32, buf2);
			ctrlDcMem[i].SelectObject(ctrlBitmap + i);

			p = buf1;
			buf1 = buf2;
			buf2 = p;
		}
	}

	free(buf1);
	free(buf2);
}

void Manager::UninitBitmap()
//释放位图占用空间
{
	showConnectBitmap.DeleteObject();
	showConnectDcMem.DeleteDC();

	crunBitmap.DeleteObject();
	crunDcMem.DeleteDC();

	for(int i=CTRL_BITMAP_NUM-1; i>=0; --i)
	{
		DeleteObject(ctrlBitmap[i]);
		ctrlDcMem[i].DeleteDC();
	}
}


//3画图函数------------------------------------------------------------------------↓
void Manager::PaintCtrl(CTRL * c, bool isPaintName)
//画控件
{
	ASSERT(c != NULL);
	if(isPaintName) PaintCtrlText(c);	//画控件名称
	dc->BitBlt(c->coord.x, c->coord.y, BODYSIZE.cx, BODYSIZE.cy, GetCtrlPaintHandle(c), 0, 0, SRCAND);
}

void Manager::PaintCtrlText(const CTRL * c)const 
//画控件的名称
{
	ASSERT(c != NULL);
	if(!c->isPaintName) return;
	dc->TextOut(c->coord.x, c->coord.y-15, c->name, strlen(c->name));
}

void Manager::PaintCrun(const CRUN * c, bool isPaintName)
//画结点
{
	ASSERT(c != NULL);
	if(isPaintName) PaintCrunText(c);	//画结点名称
	dc->BitBlt(c->coord.x-DD, c->coord.y-DD, DD*2, DD*2, &crunDcMem, 0, 0, SRCAND);
}

void Manager::PaintCrunText(const CRUN * c)const 
//画结点名称
{
	ASSERT(c != NULL);
	if(!c->isPaintName) return;
	dc->TextOut(c->coord.x, c->coord.y-20, c->name, strlen(c->name));
}

void Manager::PaintLead(LEAD * l)
//画导线
{
	ASSERT(l != NULL);
	dc->SelectObject(hp + l->color);
	l->PaintLead(dc);
}

void Manager::PaintAllLead()
//画所有导线; 为了提高画导线的效率,相同颜色一起画
{
	int num, color;
	for(color=COLOR_TYPE_NUM-1; color>=0; --color)	//按颜色循环
	{
		dc->SelectObject(hp + color);
		for(num=leadNum-1; num>=0; --num)
			if(color == lead[num]->color) lead[num]->PaintLead(dc);
	}
	dc->SelectObject(hp);	//恢复到黑色的画笔
}

void Manager::PaintAll()
//画所有的物体
{
	int i;
	CDC * save = dc;
	RECT rect;
	BITMAP bitmap;

	//1,清除部分状态信息----------------------------------------------------
	motiNum = 0;
	addState = BODY_NO;
	lastMoveOnPos.x = -100;
	lastMoveOnBody.Clear();

	//2,画图初始化----------------------------------------------------------
	//获得窗口尺寸
	wndPointer->GetClientRect(&rect);

	//初始化刷新位图大小
	bitmapForRefresh.GetBitmap(&bitmap);
	if(rect.bottom > bitmap.bmHeight || rect.right > bitmap.bmWidth)
	{
		bitmapForRefresh.DeleteObject();
		bitmapForRefresh.CreateBitmap(rect.right, rect.bottom, 1, 32, NULL);
		dcForRefresh.SelectObject(&bitmapForRefresh);
	}

	//由dcForRefresh画图
	dc->DPtoLP(&rect);			//当前rect由设备坐标变换为逻辑坐标
	dc = &dcForRefresh;			//dc暂时替换为dcForRefresh,在内存画图

	//设置字体颜色和视角起点
	dc->SetTextColor(LEADCOLOR[textColor]);
	dc->SetViewportOrg(-viewOrig.x, -viewOrig.y);	//初始化视角起始坐标

	//3,内存画图------------------------------------------------------------
	//用白色矩形覆盖整个客户区
	dc->SelectStockObject(WHITE_PEN);
	dc->SelectStockObject(WHITE_BRUSH);
	dc->Rectangle(&rect);

	//画控件结点以及他们的名称
	for(i=ctrlNum-1; i>=0; --i)
		PaintCtrl(ctrl[i], true);
	for(i=crunNum-1; i>=0; --i)
		PaintCrun(crun[i], true);

	//画导线
	PaintAllLead();

	//画焦点
	FocusBodyPaint(NULL);

	//重绘显示电势差的物体
	PaintWithSpecialColor(pressStart, false);
	PaintWithSpecialColor(pressEnd, true);

	//4,还原dc, 一次性画图--------------------------------------------------
	dc = save;
	dc->BitBlt(0, 0, rect.right, rect.bottom, &dcForRefresh, 0, 0, SRCCOPY);
}

void Manager::PaintMouseMotivate(const Pointer &mouseMoti)
//画激活的连接点部位,改变鼠标形状
{
	const Pointer * mouse = &mouseMoti;
	POINT tempPos;
	const int CR = 3; //连接点画图半径

	if(mouse->IsOnLead())
	{
		if(motiNum && motiBody[motiNum-1].IsOnConnectPos())
		{//选定了连接点,鼠标变成添加结点图形,提示使用ConnectBodyLead函数
			SetCursor(hcShowConnect);
		}
		else
		{//没有选定连接点,鼠标变成"指针",提示改变导线坐标
			if(mouse->IsOnHoriLead())SetCursor(hcSizeNS);	//在横线,鼠标变成"上下指针"
			else SetCursor(hcSizeWE);						//在竖线,鼠标变成"左右指针"
		}
	}
	else if(mouse->IsOnBody())	//在物体上,鼠标变成手的形状,提示移动物体
	{
		SetCursor(hcHand);
	}

	if(!lastMoveOnBody.IsAllSame(mouse))	//lastMoveOnBody与mouse指向的Pointer结构体不一样
	{
		if(lastMoveOnBody.IsOnConnectPos())	//还原上一个连接点
		{
			lastMoveOnBody.GetPosFromBody(tempPos);	//获得坐标
			dc->BitBlt(tempPos.x-CR, tempPos.y-CR, CR*2, CR*2,
				&showConnectDcMem, 0, 0, SRCINVERT);
		}

		lastMoveOnBody = *mouse;	//记录当前鼠标激活物体

		if(mouse->IsOnConnectPos())	//画当前的连接点
		{
			mouse->GetPosFromBody(tempPos);	//获得坐标
			dc->BitBlt(tempPos.x-CR, tempPos.y-CR, CR*2, CR*2,
				&showConnectDcMem, 0, 0, SRCINVERT);
		}
	}
}

void Manager::PaintLeadWithStyle(LEAD * lead, int leadStyle, enum COLOR colorNum)
//用指定颜色画虚线导线
{
	ASSERT(lead != NULL);
	CPen tempPen;

	tempPen.CreatePen(leadStyle, 1, LEADCOLOR[colorNum]);	//新建特殊画笔
	dc->SelectObject(tempPen.m_hObject);					//选择画笔
	lead->PaintLead(dc);									//画导线
	tempPen.DeleteObject();									//释放画笔
	dc->SelectObject(hp);									//恢复画笔
}

void Manager::PaintCrunWithColor(CRUN * c, enum COLOR colorNum)
//用指定颜色画指定结点
{
	ASSERT(c != NULL);
	CBrush hb;

	//1,画指定颜色背景 -------------------------------------------------------------
	//设置指定颜色画刷
	hb.CreateSolidBrush(LEADCOLOR[colorNum]);
	dc->SelectObject(&hb);
	//设置空画笔
	dc->SelectStockObject(NULL_PEN);
	//画指定颜色圆形
	dc->Rectangle(c->coord.x-DD, c->coord.y-DD, c->coord.x+DD+1, c->coord.y+DD+1);

	//2,释放画刷,还原画刷 ----------------------------------------------------------
	hb.DeleteObject();
	dc->SelectStockObject(NULL_BRUSH);

	//3,画黑色结点,使用 "或" 的逻辑画图,得到指定颜色结点 ---------------------------
	dc->BitBlt(c->coord.x-DD, c->coord.y-DD, DD*2, DD*2, &crunDcMem, 0, 0, SRCPAINT);
}

void Manager::PaintCtrlWithColor(CTRL * c, enum COLOR colorNum)
//用指定颜色画指定控件
{
	ASSERT(c != NULL);
	CBrush hb;

	//1,画指定颜色背景 -------------------------------------------------------------
	//设置指定颜色画刷
	hb.CreateSolidBrush(LEADCOLOR[colorNum]);
	dc->SelectObject(&hb);
	//设置空画笔
	dc->SelectStockObject(NULL_PEN);
	//画指定颜色矩形
	dc->Rectangle(c->coord.x, c->coord.y, c->coord.x+BODYSIZE.cx+1, c->coord.y+BODYSIZE.cy+1);

	//2,释放画刷,还原画刷 ----------------------------------------------------------
	hb.DeleteObject();
	dc->SelectStockObject(NULL_BRUSH);

	//3,画黑色控件,使用 "或" 的逻辑画图,得到指定颜色控件
	dc->BitBlt(c->coord.x, c->coord.y, BODYSIZE.cx, BODYSIZE.cy, GetCtrlPaintHandle(c), 0, 0, SRCPAINT);

	//4,重新画被覆盖的周围导线 -----------------------------------------------------
	for(int num=0; num<2; ++num) if(c->lead[num] != NULL)
		PaintLead(c->lead[num]);
}

void Manager::PaintWithSpecialColor(const Pointer &body, bool isPaintNum)
//用保留颜色(紫色)显示
{
	const COLOR colorNum = (enum COLOR)COLOR_TYPE_NUM;	//选用保留颜色(紫色)

	if(body.IsOnLead())
	{
		if(isPaintNum)
		{
			//画导线
			PaintLeadWithStyle(body.p1, PS_SOLID, colorNum);

			//在导线起始和结尾处分别显示数字'1'和'2'
			char text[8] = "0";
			POINT pos[2];
			body.p1->GetStartEndPos(pos[0], pos[1]);
			for(int i=0; i<2; ++i)
			{
				++(text[0]);
				dc->TextOut(pos[i].x, pos[i].y, text, 1);
			}
		}
		else
		{
			PaintLeadWithStyle(body.p1, PS_DOT, colorNum);	//画导线
		}
	}
	else if(body.IsOnCrun())
	{
		PaintCrunWithColor(body.p2, colorNum);	//画结点
		if(isPaintNum)							//在结点上下左右分别显示1,2,3,4
		{
			POINT pos = body.p2->coord;
			pos.x -= 5; pos.y -= 8;
			dc->TextOut(pos.x, pos.y-15, "1", 1);
			dc->TextOut(pos.x, pos.y+15, "2", 1);
			dc->TextOut(pos.x-15, pos.y, "3", 1);
			dc->TextOut(pos.x+15, pos.y, "4", 1);
		}
	}
	else if(body.IsOnCtrl())
	{
		PaintCtrlWithColor(body.p3, colorNum);	//画控件
	}
}

void Manager::PaintInvertBodyAtPos(const Pointer &body, POINT pos)
//在指定位置显示物体的反相
{
	ASSERT(body.IsOnBody(false));
	if(body.IsOnCrun())
	{
		dc->BitBlt(pos.x-DD, pos.y-DD, DD*2, DD*2, &crunDcMem, 0, 0, SRCINVERT);
	}
	else //if(body.IsOnCtrl())
	{
		dc->BitBlt(pos.x, pos.y, BODYSIZE.cx, BODYSIZE.cy, GetCtrlPaintHandle(body.p3), 0, 0, SRCINVERT);
	}
}


//4其他函数------------------------------------------------------------------------↓
void Manager::SetAddState(BODY_TYPE type)
//设置添加何种物体
{
	ASSERT(type>=BODY_NO && type<CTRL_TYPE_NUM);
	addState = type;
}

CDC * Manager::GetCtrlPaintHandle(const CTRL * c)
//获得控件画图句柄
{
	CDC * paintMenDc = ctrlDcMem + c->GetStyle();	//默认的画图句柄

	//具有特殊画图效果控件的画图DC
	if(c->IsBulbOn())				//小灯泡达到额定功率
			paintMenDc = ctrlDcMem + IDB_BULB_SHINE - IDB_SOURCE;
	else if(c->SwitchOnOff(false))	//开关闭合
			paintMenDc = ctrlDcMem + IDB_SWITCH_CLOSE - IDB_SOURCE;

	return paintMenDc + c->dir * CTRL_BITMAP_TYPE_NUM;	//位图和旋转角度有关系
}

void Manager::GetName(const Pointer &pointer, char * str)const
//获得名称,str长度应该大于等于NAME_LEN*2
{
	ASSERT(pointer.IsOnAny());
	if(pointer.IsOnLead())
	{
		sprintf(str, "导线[%d]", pointer.p1->GetInitOrder());
	}
	else if(pointer.IsOnCrun())
	{
		sprintf(str, "结点[编号(%d), 当前名称(%s)]", pointer.p2->GetInitOrder(), pointer.p2->name);
	}
	else //if(pointer.IsOnCtrl())
	{
		sprintf(str, "控件[编号(%d), 当前名称(%s)]", pointer.p3->GetInitOrder(), pointer.p3->name);
	}
}

bool Manager::DeleteNote(const Pointer &body)
//删除提示,返回值为false用户取消删除
{
	int conNum;				//连接导线数
	char name[NAME_LEN*2];	//物体名称
	char note[NAME_LEN*4];	//提示字符串

	//获得连接导线数
	if(body.IsOnLead())
		conNum = 0;
	else if(body.IsOnCrun())
		conNum = body.p2->GetConnectNum();
	else if(body.IsOnCtrl())
		conNum = body.p3->GetConnectNum();
	else
		return false;

	//根据连接导线数提示删除信息
	GetName(body, name);
	if(conNum > 0)
		sprintf(note, "要删除 %s 吗 ?\n它连接的 %d 段导线也将删除!", name, conNum);
	else
		sprintf(note, "要删除 %s 吗 ?", name);

	PaintWithSpecialColor(body, false);	//用保留颜色(紫色)显示物体
	return IDYES == wndPointer->MessageBox(note, "删除物体提示", MB_YESNO|MB_ICONWARNING);
}

void Manager::ClearCircuitState()
//清除电路状态
{
	FocusBodyClear(NULL);	//焦点
	ClearPressBody();		//显示电势差
	motiNum = 0;			//激活物体数量
	addState = BODY_NO;		//添加物体类型
	lastMoveOnBody.Clear();	//鼠标上次移动到的物体
	lButtonDownState = 0;	//鼠标左击状态
}

Pointer Manager::GetBodyPointer(FOCUS_OR_POS &body)
//获得物体指针
{
	Pointer pointer;

	if(body.isFocusBody)
	{
		pointer = focusBody;
	}
	else
	{
		motiNum = 0;
		MotivateAll(body.pos);
		motiNum = 0;
		pointer = motiBody[0];
	}

	return pointer;
}

void Manager::SaveAsPicture(const char * path)
//保存电路到图片
{
	PaintAll();	//画电路, bitmapForRefresh保存有位图
	StaticClass::SaveBitmapToFile(HBITMAP(bitmapForRefresh), path);
}


//5编辑函数------------------------------------------------------------------------↓
void Manager::AddCtrl(POINT pos, BODY_TYPE style)
//添加控件
{
	ASSERT(ctrlNum < MAXCTRLNUM);

	ctrl[ctrlNum] = new CTRL(ctrlNum, pos, style);
	++ ctrlNum;

	PaintCtrlText(ctrl[ctrlNum-1]);
	Pointer newFocus;
	newFocus.SetOnCtrl(ctrl[ctrlNum-1], 1);
	FocusBodyPaint(&newFocus);
}

void Manager::AddCrun(POINT pos)
//添加结点
{
	ASSERT(crunNum < MAXCRUNNUM);

	crun[crunNum] = new CRUN(crunNum, pos);
	++ crunNum;

	PaintCrunText(crun[crunNum-1]);
	Pointer newFocus;
	newFocus.SetOnCrun(crun[crunNum-1], 1);
	FocusBodyPaint(&newFocus);
}

void Manager::AddLead(Pointer a, Pointer b)
//用导线连接2个物体
{
	ASSERT(leadNum < MAXLEADNUM);						//导线够用
	ASSERT(a.IsOnConnectPos() && b.IsOnConnectPos());	//连接点
	ASSERT(!a.IsBodySame(&b));							//不是同一个物体

	//添加导线
	lead[leadNum] = new LEAD(leadNum, a, b);
	++leadNum;

	//连接物体指向导线
	if(a.IsOnCrun())
		a.p2->lead[a.GetLeadNum()] = lead[leadNum-1];
	else 
		a.p3->lead[a.GetLeadNum()] = lead[leadNum-1];
	if(b.IsOnCrun())
		b.p2->lead[b.GetLeadNum()] = lead[leadNum-1];
	else 
		b.p3->lead[b.GetLeadNum()] = lead[leadNum-1];

	//显示添加的导线
	PaintLead(lead[leadNum-1]);
}

void Manager::DeleteLead(LEAD * l)
//删除连接2个物体的连线
//使用函数: Delete(Pointer), ConnectBodyLead
{
	ASSERT(l != NULL);
	Pointer * a = l->conBody, * b = l->conBody + 1;
	int dira = a->GetLeadNum(), dirb = b->GetLeadNum();
	int num = l->num;

	//如果删除物体是焦点,清除焦点
	Pointer pointer;
	pointer.SetOnLead(l);
	FocusBodyClear(&pointer);

	//清空连接的指针
	if(a->IsOnCrun()) a->p2->lead[dira] = NULL;
	else if(a->IsOnCtrl()) a->p3->lead[dira] = NULL;
	if(b->IsOnCrun()) b->p2->lead[dirb] = NULL;
	else if(b->IsOnCtrl()) b->p3->lead[dirb] = NULL;

	//删除导线
	delete l;
	if(num != leadNum-1)
	{
		lead[num] = lead[leadNum-1];
		lead[num]->num = num;
	}
	lead[leadNum-1] = NULL;
	--leadNum;
}

void Manager::DeleteSingleBody(Pointer pointer)
//仅仅是删除一个结点或者控件,不影响周围物体
{
	ASSERT(pointer.IsOnBody());
	int num;

	FocusBodyClear(&pointer);	//如果删除物体是焦点,清除焦点

	if(pointer.IsOnCrun())
	{
		num = pointer.p2->num;
		delete pointer.p2;
		if(num != crunNum-1)
		{
			crun[num] = crun[crunNum-1];
			crun[num]->num = num;
		}
		crun[crunNum-1] = NULL;
		--crunNum;
	}
	else //if(pointer.IsOnCtrl())
	{
		num = pointer.p3->num;
		delete pointer.p3;
		if(num != ctrlNum-1)
		{
			ctrl[num] = ctrl[ctrlNum-1];
			ctrl[num]->num = num;
		}
		ctrl[ctrlNum-1] = NULL;
		--ctrlNum;
	}
}

void Manager::Delete(Pointer pointer)
//删除
{
	ASSERT(pointer.IsOnAny() && !pointer.IsOnConnectPos());
	CloneCircuitBeforeChange();	//编辑前复制电路

	if(pointer.IsOnLead())
	{
		DeleteLead(pointer.p1);
	}
	else if(pointer.IsOnCrun())
	{
		for(int i=0; i<4; ++i) if(pointer.p2->lead[i] != NULL)
			DeleteLead(pointer.p2->lead[i]);
		DeleteSingleBody(pointer);
	}
	else //if(pointer.IsOnCtrl())
	{
		for(int i=0; i<2; ++i) if(pointer.p3->lead[i] != NULL)
			DeleteLead(pointer.p3->lead[i]);
		DeleteSingleBody(pointer);
	}

	PutCircuitToVector();	//将新的电路信息保存到容器
}

bool Manager::ConnectBodyLead(POINT posb)
//连接一个连接点和导线
{
	Pointer a;				//先点击物体和连接点
	Pointer x, y;			//后点击物体(导线)的2个连接物体
	Pointer newCrun;		//新添加的结点
	POINT posa;				//先点击物体的坐标
	char dir1, dir2, dir3;	//结点连接x,y,a的连接点位置
	LEADSTEP newLeadPosx, newLeadPosy;

	//1,检查函数运行条件
	ASSERT(motiNum == 2 && motiBody[0].IsOnConnectPos() && motiBody[1].IsOnLead());
	motiNum = 0;
	if(crunNum >= MAXCRUNNUM)	//只要结点数量够,导线一定够
	{
		wndPointer->MessageBox("结点超过最大数量!", "结点不能添加", MB_ICONWARNING);
		return false;
	}

	//2,编辑前复制电路
	CloneCircuitBeforeChange();

	//3,获得物体和坐标
	a = motiBody[0];
	x = motiBody[1].p1->conBody[0];
	y = motiBody[1].p1->conBody[1];
	if(a.IsOnCrun())posa = a.p2->coord;
	else posa = a.p3->coord;	//获得先点击物体的坐标

	//4,初始化连接新添加结点的方向
	if(motiBody[1].IsOnHoriLead())	//-3,-5,-7....横线
	{
		if(motiBody[1].p1->GetBodyPos() & 2)
		{
			dir1 = 4;
			dir2 = 3;
		}
		else
		{
			dir1 = 3;
			dir2 = 4;
		}

		if(posa.y > posb.y)dir3 = 2;	//先点击物体在后点击位置的下面
		else dir3 = 1;	//先点击物体在后点击位置的上面
	}
	else	//-2,-4,-6....竖线
	{
		if(motiBody[1].p1->GetBodyPos() & 1)
		{
			dir1 = 2;
			dir2 = 1;
		}
		else
		{
			dir1 = 1;
			dir2 = 2;
		}

		if(posa.x > posb.x)dir3 = 4;	//先点击物体在后点击位置的右面
		else dir3 = 3;	//先点击物体在后点击位置的左面
	}

	//5,添加删除物体
	motiBody[1].p1->Divide(motiBody[1].GetAtState(), posb, newLeadPosx, newLeadPosy);	//记忆原来导线坐标
	DeleteLead(motiBody[1].p1);	//删除原来导线
	AddCrun(posb);	//添加结点

	newCrun.SetOnCrun(crun[crunNum-1]);	//newCrun指向新添加结点

	newCrun.SetAtState(dir1);
	AddLead(x, newCrun);	//x和节点连线,x是起点,新节点是终点
	lead[leadNum-1]->ReplacePos(newLeadPosx);	//坐标还原

	newCrun.SetAtState(dir2);
	AddLead(newCrun, y);	//y和节点连线,y是终点,新节点是起点
	lead[leadNum-1]->ReplacePos(newLeadPosy);	//坐标还原

	newCrun.SetAtState(dir3);
	AddLead(a, newCrun);	//a和节点连线

	//6,将新的电路信息保存到容器
	PutCircuitToVector();

	return true;
}

bool Manager::Delete(FOCUS_OR_POS &body)
//删除物体
{
	Pointer pointer = GetBodyPointer(body);
	if(!pointer.IsOnAny()) return false;

	if(DeleteNote(pointer))
	{
		Delete(pointer);
		return true;
	}
	else 
	{
		return false;
	}
}


//6鼠标消息处理函数----------------------------------------------------------------↓
bool Manager::AddBody(POINT pos)
//添加物体
{
	BODY_TYPE temp = addState;

	addState = BODY_NO;	//不再添加物体
	dc->DPtoLP(&pos);

	if(BODY_CRUN == temp)
	{
		if(crunNum >= MAXCRUNNUM)
		{
			wndPointer->MessageBox("结点超过最大数量!", "结点不能添加", MB_ICONWARNING);
			return false;
		}

		CloneCircuitBeforeChange();	//编辑前复制电路
		AddCrun(pos);				//编辑函数
		PutCircuitToVector();		//将新的电路信息保存到容器
		return true;
	}
	else if(Pointer::IsCtrl(temp))
	{
		if(ctrlNum >= MAXCTRLNUM)
		{
			wndPointer->MessageBox("电学元件超过最大数量!", "电学元件不能添加", MB_ICONWARNING);
			return false;
		}

		CloneCircuitBeforeChange();	//编辑前复制电路
		AddCtrl(pos, temp);			//编辑函数
		PutCircuitToVector();		//将新的电路信息保存到容器
		return true;
	}
	else
	{
		return false;
	}
}

void Manager::Property(FOCUS_OR_POS &body, bool isReadOnly)
//显示和改变物体属性
{
	char tempStr[NAME_LEN*3];
	LISTDATA list;
	CDC * model = NULL;
	Pointer pointer = GetBodyPointer(body);

	if(pointer.IsOnLead())
	{
		GetName(pointer, tempStr);
		strcat(tempStr, " 的颜色");					//窗口标题
		pointer.p1->GetDataList(tempStr, &list);	//数据
	}
	else if(pointer.IsOnCrun())
	{
		GetName(pointer, tempStr);
		strcat(tempStr, " 的标签");					//窗口标题
		pointer.p2->GetDataList(&list);				//数据
		model = &crunDcMem;							//示例
	}
	else if(pointer.IsOnCtrl())
	{
		GetName(pointer, tempStr);
		strcat(tempStr, " 的标签和电学属性");		//窗口标题
		pointer.p3->GetDataList(&list);				//数据
		model = GetCtrlPaintHandle(pointer.p3);		//示例
	}
	else
	{
		return;
	}

	PaintWithSpecialColor(pointer, false);	//用保留颜色(紫色)显示物体
	MyPropertyDlg dlg(&list, isReadOnly, model, tempStr, wndPointer);
	dlg.DoModal();
}

bool Manager::ShowBodyElec(FOCUS_OR_POS &body)
//计算电流后,显示流过物体的电流
{
	Pointer pointer = GetBodyPointer(body);
	if(!pointer.IsOnLead() && !pointer.IsOnCtrl()) return false;	//只显示导线和控件

	char tempStr1[NAME_LEN*2];	//字符串
	char tempStr2[NAME_LEN*2];	//字符串
	char title[NAME_LEN*3];		//窗口标题
	double elec;				//电流大小
	ELEC_STATE elecDir;			//电流方向
	CDC * model = NULL;			//property显示物体的示例
	LISTDATA list;				//property显示的数据

	//1,获得电流信息
	if(pointer.IsOnLead())
	{
		elec = pointer.p1->elec;
		elecDir  = pointer.p1->elecDir;
	}
	else //if(pointer.IsOnCtrl())
	{
		elec = pointer.p3->elec;
		elecDir  = pointer.p3->elecDir;

		model = GetCtrlPaintHandle(pointer.p3);	//示例
	}

	//2,生成LISTDATA
	switch(elecDir)
	{
	case UNKNOWNELEC:
		list.Init(1);
		list.SetAMember(DATA_STYLE_LPCTSTR, "电流情况 :", "电流没有计算过!");
		break;

	case OPENELEC:
		list.Init(1);
		list.SetAMember(DATA_STYLE_LPCTSTR, "电流情况 :", "没有电流流过, 断路!");
		break;

	case SHORTELEC:
		list.Init(1);
		list.SetAMember(DATA_STYLE_LPCTSTR, "电流情况 :", "线路短路!!!");
		break;

	case UNCOUNTABLEELEC:
		list.Init(1);
		list.SetAMember(DATA_STYLE_LPCTSTR, "电流情况 :", "两条无电阻线路分一段电流,电流无法确定!");
		break;

	case LEFTELEC:
	case RIGHTELEC:
		ASSERT(elec >= 0);	//不会出现负电流

		if(StaticClass::IsZero(elec))
		{
			list.Init(1);
			list.SetAMember(DATA_STYLE_LPCTSTR, "电流情况 :", "电流为0");
			break;
		}

		if(pointer.IsOnLead())
		{
			GetName(pointer.p1->conBody[LEFTELEC != elecDir], tempStr1);
			GetName(pointer.p1->conBody[LEFTELEC == elecDir], tempStr2);

			list.Init(3);
			list.SetAMember(DATA_STYLE_double, DATA_NOTE[DATA_NOTE_CURRENT], &elec);
			list.SetAMember(DATA_STYLE_LPCTSTR, "电流起点 :", tempStr1);
			list.SetAMember(DATA_STYLE_LPCTSTR, "电流终点 :", tempStr2);
		}
		else //if(pointer.IsOnCtrl())
		{
			switch(pointer.p3->dir ^ ((RIGHTELEC == elecDir)<<1))
			{
			case 0:
				strcpy(tempStr1, "从左到右");
				break;
			case 1:
				strcpy(tempStr1, "从上到下");
				break;
			case 2:
				strcpy(tempStr1, "从右到左");
				break;
			case 3:
				strcpy(tempStr1, "从下到上");
				break;
			}

			list.Init(2);
			list.SetAMember(DATA_STYLE_double, DATA_NOTE[DATA_NOTE_CURRENT], &elec);
			list.SetAMember(DATA_STYLE_LPCTSTR, "方向 :", tempStr1);
		}
		break;
	}	//switch(elecDir)

	//3,生成窗口标题
	strcpy(title, "流过");
	GetName(pointer, title+strlen(title));
	strcat(title, "的电流");

	//4,显示对话框
	PaintWithSpecialColor(pointer, false);	//用保留颜色(紫色)显示物体
	MyPropertyDlg dlg(&list, true, model, title, wndPointer);
	dlg.DoModal();

	return true;
}

void Manager::ChangeCtrlStyle(FOCUS_OR_POS &body)
//改变电学元件类型
{
	BODY_TYPE preStyle, newStyle;
	char tempStr[NAME_LEN*3];

	Pointer pointer = GetBodyPointer(body);
	if(!pointer.IsOnCtrl()) return;

	//获得原来类型
	preStyle = newStyle = pointer.p3->GetStyle();

	//初始化list数据
	LISTDATA list;
	list.Init(1);
	list.SetAEnumMember("电学元件的类型", &newStyle, ENUM_CTRL);

	//获得窗口标题
	GetName(pointer, tempStr);
	strcat(tempStr, " 的类型");

	//显示对话框
	PaintWithSpecialColor(pointer, false);	//用保留颜色(紫色)显示物体
	MyPropertyDlg dlg(&list, false, GetCtrlPaintHandle(pointer.p3), tempStr, wndPointer);
	dlg.DoModal();

	//改变类型
	if(preStyle != newStyle)
	{
		if(IDYES != AfxMessageBox("改变类型会丢失原有电学元件的数据!\n继续吗?", MB_YESNO)) return;
		pointer.p3->ChangeStyle(newStyle);
	}
}

bool Manager::MotivateAll(POINT &pos)
//传入鼠标坐标,传出是否在物体上,或物体的连接点上
{
	Pointer * mouse = motiBody + motiNum;
	int i;

	//1,初始化-------------------------------------------
	ASSERT(motiNum >= 0 && motiNum < 2);
	dc->DPtoLP(&pos);
	mouse->Clear();

	//2,搜索在什么物体上---------------------------------
	for(i = crunNum-1; i >= 0; --i)	//搜索所有结点
	{
		mouse->SetAtState(crun[i]->At(pos));
		if(mouse->IsOnAny())
		{
			mouse->SetOnCrun(crun[i]);
			++motiNum;
			goto testPlace;
		}
	}
	for(i = leadNum-1; i >= 0; --i)	//搜索所有导线
	{
		mouse->SetAtState(lead[i]->At(pos));
		if(mouse->IsOnAny())
		{
			mouse->SetOnLead(lead[i], false);
			++motiNum;
			goto testPlace;
		}
	}
	for(i = ctrlNum-1; i >= 0; --i)	//搜索所有控件
	{
		mouse->SetAtState(ctrl[i]->At(pos));
		if(mouse->IsOnAny())
		{
			mouse->SetOnCtrl(ctrl[i]);
			++motiNum;
			goto testPlace;
		}
	}

	return false;	//运行到这里一定没有激活物体

testPlace:

	//3,去除不需要显示连接的部分-------------------------
	if( 2 == motiNum		//同一物体的两个连接点不能显示连接
		&& motiBody[0].IsOnConnectPos() 
		&& motiBody[1].IsOnConnectPos()
		&& motiBody[0].IsBodySame(motiBody+1))	
	{
		--motiNum;
		return false;
	}
	else if(2 == motiNum	//无意义操作
		&& motiBody[0].IsOnConnectPos()
		&& !motiBody[1].IsOnConnectPos() 
		&& !motiBody[1].IsOnLead())
	{
		--motiNum;
		return false;
	}

	return true;
}

bool Manager::LButtonDown(POINT pos)
//处理WM_LBUTTONDOWN消息
{
	if(!isUpRecvAfterDown) motiNum = 0;		//在上次鼠标左键按下后没有接受到鼠标按起消息
	lButtonDownState = MotivateAll(pos);	//记录这次鼠标是否点击了物体
	lButtonDownPos = pos;					//记录鼠标左键按下的坐标
	isUpRecvAfterDown = false;				//收到鼠标按起消息会设置为true
	lastMoveOnPos.x = -100;					//还原左击物体后,鼠标移动到的坐标

	if(!lButtonDownState) //未点击有效部位,点击物体清除,帮助连接导线
	{
		if(motiNum > 0 && motiBody[motiNum-1].IsOnConnectPos())
			PaintAll();	//覆盖ShowAddLead画的导线

		motiNum = 0; return false;
	}
	else if(!motiBody[motiNum-1].IsOnConnectPos())	//点击不在连接点
	{
		FocusBodyPaint(motiBody+motiNum-1);	//重绘焦点物体
	}

	if(2 == motiNum && motiBody[0].IsOnConnectPos())	//判断第一个选定点是否是连接点
	{
		if(motiBody[1].IsOnConnectPos())
		{
			CloneCircuitBeforeChange();			//编辑前复制电路
			AddLead(motiBody[0], motiBody[1]);	//编辑函数
			PutCircuitToVector();				//将新的电路信息保存到容器
		}
		else if(motiBody[1].IsOnLead())
		{
			ConnectBodyLead(pos);
		}

		motiNum = 0; return true;
	}

	//AddLead处理了dira=1~4,dirb=1~4的消息;ConnectBodyLead(pos)处理了dira=1~4,dirb=-2~-3,...的消息.
	//dira=1~4,dirb=-1的消息不做处理,仅仅刷新
	//dira=-1,-2,-3,...的消息屏蔽掉(因为后面又点击了物体)
	//也就是LButtonUp只能处理1==motiNum,dira=-1,-2,-3,...的消息;

	if(2 == motiNum) motiNum = 0;
	return false;
}

bool Manager::LButtonUp(POINT pos)
//处理鼠标左键按起的消息
{
	isUpRecvAfterDown = true;						//鼠标按下后收到鼠标按起消息
	if(!lButtonDownState || !motiNum) return false;	//没有点击返回
	dc->DPtoLP(&pos);
	Pointer * body = motiBody + motiNum - 1;

	//左键按下和按起的坐标相同,而且点击的不是连接点
	if( lButtonDownPos.x == pos.x && lButtonDownPos.y == pos.y 
		&& !body->IsOnConnectPos())
	{
		if(body->IsOnCtrl())
			body->p3->SwitchOnOff();	//开关开合情况改变
		FocusBodyPaint(NULL);			//重绘焦点

		motiNum = 0;
		return false;
	}

	if(body->IsOnLead())	//移动导线
	{
		body->p1->Move(body->GetAtState(), pos, maxLeaveOutDis);
		motiNum = 0;
		return true;
	}
	else if(body->IsOnBody())	//移动物体或复制物体
	{
		if(StaticClass::IsCtrlDown())	//左或右Ctrl键按下复制物体
			PosBodyClone(body, lButtonDownPos, pos);
		else
			PosBodyMove(body, lButtonDownPos, pos);
		motiNum = 0;
		return true;
	}
	else if(!body->IsOnConnectPos())
	{
		motiNum = 0;
		return false;
	}

	return false;
}

void Manager::PosBodyMove(Pointer * body, POINT firstPos, POINT lastPos)
//移动物体
{
	int i;
	POINT inter;

	//获得相对坐标
	inter.x = lastPos.x - firstPos.x;
	inter.y = lastPos.y - firstPos.y;
	if(inter.x==0 && inter.y==0) return;

	ASSERT(body->IsOnBody());
	if(body->IsOnCrun())
	{
		body->p2->coord.x += inter.x;
		body->p2->coord.y += inter.y;
		for(i=0; i<4; ++i) if(body->p2->lead[i])
			body->p2->lead[i]->RefreshPos();
	}
	else //if(body->IsOnCtrl())
	{
		body->p3->coord.x += inter.x;
		body->p3->coord.y += inter.y;
		for(i=0; i<2; ++i) if(body->p3->lead[i])
			body->p3->lead[i]->RefreshPos();
	}
}

bool Manager::PosBodyClone(const Pointer * body, POINT firstPos, POINT lastPos)
//在制定位置复制物体
{
	//获得相对坐标
	POINT inter;
	inter.x = lastPos.x - firstPos.x;
	inter.y = lastPos.y - firstPos.y;

	//复制
	if(body->IsOnCrun())
	{
		//验证
		if(crunNum >= MAXCRUNNUM)
		{
			wndPointer->MessageBox("结点超过最大数量!", "结点不能添加", MB_ICONWARNING);
			return false;
		}

		//编辑前复制电路
		CloneCircuitBeforeChange();

		//编辑电路
		crun[crunNum] = body->p2->Clone(CLONE_FOR_USE);
		crun[crunNum]->coord.x += inter.x;
		crun[crunNum]->coord.y += inter.y;
		crun[crunNum]->num = crunNum;
		++crunNum;

		//将新的电路信息保存到容器
		PutCircuitToVector();

		//重绘电路
		PaintCrun(crun[crunNum-1], true);
	}
	else //if(body->IsOnCtrl())
	{
		//验证
		if(ctrlNum >= MAXCTRLNUM)
		{
			wndPointer->MessageBox("电学元件超过最大数量!", "电学元件不能添加", MB_ICONWARNING);
			return false;
		}

		//编辑前复制电路
		CloneCircuitBeforeChange();

		//编辑部分
		ctrl[ctrlNum] = body->p3->Clone(CLONE_FOR_USE);
		ctrl[ctrlNum]->coord.x += inter.x;
		ctrl[ctrlNum]->coord.y += inter.y;
		ctrl[ctrlNum]->num = ctrlNum;
		++ctrlNum;

		//将新的电路信息保存到容器
		PutCircuitToVector();

		//重绘电路
		PaintCtrl(ctrl[ctrlNum-1], true);
	}

	return true;
}

void Manager::RotateCtrl(FOCUS_OR_POS &body, int rotateAngle)
//旋转控件
{
	Pointer pointer = GetBodyPointer(body);
	if(!pointer.IsOnCtrl()) return;
	pointer.p3->Rotate(rotateAngle);
}

BODY_TYPE Manager::PosBodyPaintRect(POINT pos)
//突出右击物体
{
	Pointer * body = motiBody; //&motiBody[0]

	motiNum = 0;
	MotivateAll(pos);
	motiNum = 0;

	if(!body->IsOnAny()) return BODY_NO;

	if(body->IsOnConnectPos()) body->SetAtState(-1);

	if(body->IsOnBody()) dc->SelectObject(hp + BLUE);

	if(body->IsOnCrun())
	{
		dc->Rectangle(body->p2->coord.x-DD-2, body->p2->coord.y-DD-2, 
			body->p2->coord.x+DD+2, body->p2->coord.y+DD+2);
	}
	else if(body->IsOnCtrl())
	{
		dc->Rectangle(body->p3->coord.x-2, body->p3->coord.y-2, 
			body->p3->coord.x+BODYSIZE.cx+2, body->p3->coord.y+BODYSIZE.cy+2);
	}

	PaintWithSpecialColor(*body, false);
	return body->GetStyle();
}

void Manager::MouseMove(POINT pos, bool isLButtonDown)
//鼠标移动消息处理
{
	if(ShowAddBody(pos)) return;					//添加物体过程显示
	if(ShowMoveBody(pos, isLButtonDown)) return;	//移动物体过程显示
	if(ShowMoveLead(isLButtonDown)) return;			//移动导线过程显示
	ShowAddLead(pos);								//连接导线过程显示

	//鼠标激活物体显示
	if(MotivateAll(pos))	//鼠标激活了物体
	{
		--motiNum;
		PaintMouseMotivate(motiBody[motiNum]);
	}
	else					//鼠标没有激活物体
	{
		motiBody[1].Clear();
		PaintMouseMotivate(motiBody[1]);
	}
}

bool Manager::ShowAddLead(POINT pos)
//连接导线过程显示
{
	if(1 != motiNum) return false;

	Pointer * body = motiBody;
	POINT firstPos;

	if(!body->IsOnConnectPos()) return false;

	PaintAll();		//先刷新
	motiNum = 1;	//还原变量

	//dc移动到起点
	dc->DPtoLP(&pos);
	dc->MoveTo(pos);

	//设置黑色画笔
	dc->SelectStockObject(BLACK_PEN);

	//画直线
	body->GetPosFromBody(firstPos);
	dc->LineTo(firstPos);

	return true;
}

bool Manager::ShowAddBody(POINT point)
//添加物体过程显示
{
	if(addState == BODY_CRUN)
	{
		if(lastMoveOnPos.x > -100)
			dc->BitBlt(lastMoveOnPos.x-DD, lastMoveOnPos.y-DD, DD*2, DD*2, &crunDcMem, 0, 0, SRCINVERT);
		dc->DPtoLP(&point);
		lastMoveOnPos = point;
		dc->BitBlt(lastMoveOnPos.x-DD, lastMoveOnPos.y-DD, DD*2, DD*2, &crunDcMem, 0, 0, SRCINVERT);

		::SetCursor(hcAddCrun);
		return true;
	}
	else if(Pointer::IsCtrl(addState))
	{
		CDC * tempDc = ctrlDcMem + addState;
		if(lastMoveOnPos.x > -100)
			dc->BitBlt(lastMoveOnPos.x, lastMoveOnPos.y, BODYSIZE.cx, BODYSIZE.cy, tempDc, 0, 0, SRCINVERT);
		dc->DPtoLP(&point);
		lastMoveOnPos = point;
		dc->BitBlt(lastMoveOnPos.x, lastMoveOnPos.y, BODYSIZE.cx, BODYSIZE.cy, tempDc, 0, 0, SRCINVERT);

		::SetCursor(NULL);
		return true;
	}
	else
	{
		return false;
	}
}

bool Manager::ShowMoveBody(POINT pos, bool isLButtonDown)
//移动物体过程显示,lastMoveOnPos.x初始值设为-100,在LButtonDown和PaintAll中设置
{
	ASSERT(motiNum >= 0 && motiNum <= 2);
	if(motiNum == 0) return false;

	Pointer * body = motiBody + motiNum - 1;
	POINT bodyPos = {0, 0};

	if(!body->IsOnBody()) return false;
	if(!isLButtonDown)	//鼠标没有按下
	{
		PaintAll(); 
		return false;
	}

	//获得物体坐标
	dc->DPtoLP(&pos);
	if(body->IsOnCrun()) bodyPos = body->p2->coord;
	else if(body->IsOnCtrl()) bodyPos = body->p3->coord;

	//根据坐标差计算画图坐标
	pos.x += bodyPos.x - lButtonDownPos.x;
	pos.y += bodyPos.y - lButtonDownPos.y;

	//清除上次坐标画的物体
	if(lastMoveOnPos.x > -100)
		PaintInvertBodyAtPos(*body, lastMoveOnPos);

	//在新的坐标物体
	lastMoveOnPos = pos;	//获得新的坐标
	PaintInvertBodyAtPos(*body, lastMoveOnPos);

	//左或右ctrl键被按下相当于复制
	if(StaticClass::IsCtrlDown()) SetCursor(hcAddCrun);

	return true;
}

bool Manager::ShowMoveLead(bool isLButtonDown)
//移动导线过程显示
{
	ASSERT(motiNum>=0 && motiNum<=2);

	if(motiNum == 0 || !motiBody[motiNum-1].IsOnLead())
	{
		return false;
	}
	if(!isLButtonDown)	//鼠标没有按下
	{
		PaintAll();
		return true;
	}

	if(motiBody[motiNum-1].IsOnHoriLead())
		SetCursor(hcMoveHorz);	//在横线,鼠标变成"上下指针"
	else 
		SetCursor(hcMoveVert);	//在竖线,鼠标变成"左右指针"

	return true;
}

void Manager::Help(POINT pos)
//在用户区pos位置按F1,寻求帮助
{
	char note[128];

	motiNum = 0;
	MotivateAll(pos);
	motiNum = 0;

	if(!motiBody[0].IsOnAny())
	{
		wndPointer->MessageBox("鼠标没有移动到物体上 !", "提示信息", MB_ICONINFORMATION);
		return;
	}

	if(motiBody[0].IsOnConnectPos())
	{
		strcpy(note, "这是物体连接点部分,可以连接其他物体");
	}
	else if(motiBody[0].IsBodySame(&focusBody))
	{
		strcpy(note, "这是选定物体,显示不同于其他物体");
		strcat(note, "\n对它操作可以使用快捷键");
	}
	else if(motiBody[0].IsOnLead())
	{
		strcpy(note, "导线,可以连接2个物体");
	}
	else if(motiBody[0].IsOnCrun())
	{
		strcpy(note, "结点,可以连接4段导线");
	}
	else //if(motiBody[0].IsOnCtrl())
	{
		strcpy(note, "电学元件—");
		strcat(note, CTRL_STYLE_NAME[motiBody[0].p3->GetStyle()]);
		strcat(note, "\n可以旋转它 或者 改为其他类型的电学元件");
	}

	PaintWithSpecialColor(motiBody[0], false);
	wndPointer->MessageBox(note, "提示信息", MB_ICONINFORMATION);
	PaintAll();
}

bool Manager::SearchNext(SEARCH_BY searchBy, BODY_TYPE range, bool isWholeWord, bool isMatchCase, char * keyWord)
//搜索下一个物体
{
	bool isAfterFocus = false;
	char str[32];
	bool isMatch;
	int round, j;
	bool isSearchLead = (range == BODY_ALL || range == BODY_LEAD) && searchBy == SEARCH_BY_ID;
	bool isSearchCrun = (range == BODY_ALL || range == BODY_CRUN);
	bool isSearchCtrl = (range == BODY_ALL || range == BODY_ALLCTRL || Pointer::IsCtrl(range));
	KMP kmp(keyWord, isWholeWord, isMatchCase || searchBy == SEARCH_BY_ID);	//搜索序号时可以区分大小写, 加快速度
	Pointer newFocus;

	for(round=0; round<2; ++round)
	{
		//search lead ----------------------------------------------------------
		if(!isAfterFocus && focusBody.IsOnLead())
		{
			isAfterFocus = true;
			if(isSearchLead)
				j = focusBody.p1->num + 1;
			else
				j = leadNum;
		}
		else if(isAfterFocus && isSearchLead)
		{
			j = 0;
		}
		else if(isAfterFocus && !isSearchLead && focusBody.IsOnLead())
		{
			return false;
		}
		else
		{
			j = leadNum;
		}

		for(; j<leadNum; ++j)
		{
			itoa(lead[j]->GetInitOrder(), str, 10);
			isMatch = kmp.IsMatch(str);
			if(focusBody.IsLeadSame(lead[j]))
			{
				return isMatch;
			}
			else if(isMatch)
			{
				newFocus.SetOnLead(lead[j], true);
				FocusBodyPaint(&newFocus);
				return true;
			}
		}

		//search crun ----------------------------------------------------------
		if(!isAfterFocus && focusBody.IsOnCrun())
		{
			isAfterFocus = true;
			if(isSearchCrun)
				j = focusBody.p2->num + 1;
			else
				j = crunNum;
		}
		else if(isAfterFocus && isSearchCrun)
		{
			j = 0;
		}
		else if(isAfterFocus && !isSearchCrun && focusBody.IsOnCrun())
		{
			return false;
		}
		else
		{
			j = crunNum;
		}

		for(; j<crunNum; ++j)
		{
			if(searchBy == SEARCH_BY_NAME)
			{
				isMatch = kmp.IsMatch(crun[j]->name);
			}
			else
			{
				itoa(crun[j]->GetInitOrder(), str, 10);
				isMatch = kmp.IsMatch(str);
			}
			if(focusBody.IsCrunSame(crun[j]))
			{
				return isMatch;
			}
			else if(isMatch)
			{
				newFocus.SetOnCrun(crun[j], true);
				FocusBodyPaint(&newFocus);
				return true;
			}
		}

		//search ctrl ----------------------------------------------------------
		if(!isAfterFocus && focusBody.IsOnCtrl())
		{
			isAfterFocus = true;
			if(isSearchCtrl)
				j = focusBody.p3->num + 1;
			else
				j = ctrlNum;
		}
		else if(isAfterFocus && isSearchCtrl)
		{
			j = 0;
		}
		else if(isAfterFocus && !isSearchCtrl && focusBody.IsOnCtrl())
		{
			return false;
		}
		else
		{
			j = ctrlNum;
		}

		for(; j<ctrlNum; ++j)
		{
			if(range == BODY_ALL || range == BODY_ALLCTRL || ctrl[j]->GetStyle() == range)
			{
				if(searchBy == SEARCH_BY_NAME)
				{
					isMatch = kmp.IsMatch(ctrl[j]->name);
				}
				else
				{
					itoa(ctrl[j]->GetInitOrder(), str, 10);
					isMatch = kmp.IsMatch(str);
				}
				if(focusBody.IsCtrlSame(ctrl[j]))
				{
					return isMatch;
				}
				else if(isMatch)
				{
					newFocus.SetOnCtrl(ctrl[j], true);
					FocusBodyPaint(&newFocus);
					return true;
				}
			}
		}
	}

	return false;
}

bool Manager::SearchPre(SEARCH_BY searchBy, BODY_TYPE range, bool isWholeWord, bool isMatchCase, char * keyWord)
//搜索上一个物体
{
	bool isAfterFocus = false;
	char str[32];
	bool isMatch;
	int round, j;
	bool isSearchLead = (range == BODY_ALL || range == BODY_LEAD) && searchBy == SEARCH_BY_ID;
	bool isSearchCrun = (range == BODY_ALL || range == BODY_CRUN);
	bool isSearchCtrl = (range == BODY_ALL || range == BODY_ALLCTRL || Pointer::IsCtrl(range));
	KMP kmp(keyWord, isWholeWord, isMatchCase || searchBy == SEARCH_BY_ID);	//搜索序号时可以区分大小写, 加快速度
	Pointer newFocus;

	for(round=0; round<2; ++round)
	{
		//search ctrl ----------------------------------------------------------
		if(!isAfterFocus && focusBody.IsOnCtrl())
		{
			isAfterFocus = true;
			if(isSearchCtrl)
				j = focusBody.p3->num - 1;
			else
				j = -1;
		}
		else if(isAfterFocus && isSearchCtrl)
		{
			j = ctrlNum-1;
		}
		else if(isAfterFocus && !isSearchCtrl && focusBody.IsOnCtrl())
		{
			return false;
		}
		else
		{
			j = -1;
		}

		for(; j>=0; --j)
		{
			if(range == BODY_ALL || range == BODY_ALLCTRL || ctrl[j]->GetStyle() == range)
			{
				if(searchBy == SEARCH_BY_NAME)
				{
					isMatch = kmp.IsMatch(ctrl[j]->name);
				}
				else
				{
					itoa(ctrl[j]->GetInitOrder(), str, 10);
					isMatch = kmp.IsMatch(str);
				}
				if(focusBody.IsCtrlSame(ctrl[j]))
				{
					return isMatch;
				}
				else if(isMatch)
				{
					newFocus.SetOnCtrl(ctrl[j], true);
					FocusBodyPaint(&newFocus);
					return true;
				}
			}
		}

		//search crun ----------------------------------------------------------
		if(!isAfterFocus && focusBody.IsOnCrun())
		{
			isAfterFocus = true;
			if(isSearchCrun)
				j = focusBody.p2->num - 1;
			else
				j = -1;
		}
		else if(isAfterFocus && isSearchCrun)
		{
			j = crunNum - 1;
		}
		else if(isAfterFocus && !isSearchCrun && focusBody.IsOnCrun())
		{
			return false;
		}
		else
		{
			j = -1;
		}

		for(; j>=0; --j)
		{
			if(searchBy == SEARCH_BY_NAME)
			{
				isMatch = kmp.IsMatch(crun[j]->name);
			}
			else
			{
				itoa(crun[j]->GetInitOrder(), str, 10);
				isMatch = kmp.IsMatch(str);
			}
			if(focusBody.IsCrunSame(crun[j]))
			{
				return isMatch;
			}
			else if(isMatch)
			{
				newFocus.SetOnCrun(crun[j], true);
				FocusBodyPaint(&newFocus);
				return true;
			}
		}

		//search lead ----------------------------------------------------------
		if(!isAfterFocus && focusBody.IsOnLead())
		{
			isAfterFocus = true;
			if(isSearchLead)
				j = focusBody.p1->num - 1;
			else
				j = -1;
		}
		else if(isAfterFocus && isSearchLead)
		{
			j = leadNum - 1;
		}
		else if(isAfterFocus && !isSearchLead && focusBody.IsOnLead())
		{
			return false;
		}
		else
		{
			j = -1;
		}

		for(; j>=0; --j)
		{
			itoa(lead[j]->GetInitOrder(), str, 10);
			isMatch = kmp.IsMatch(str);
			if(focusBody.IsLeadSame(lead[j]))
			{
				return isMatch;
			}
			else if(isMatch)
			{
				newFocus.SetOnLead(lead[j], true);
				FocusBodyPaint(&newFocus);
				return true;
			}
		}
	}

	return false;
}


//7文件函数--------------------------------------------------------------------↓
const char * Manager::GetFilePath()
//获取文件路径
{
	return fileName;
}

bool Manager::SaveFile(const char * newFile)
//保存电路
{
	ASSERT(newFile != NULL && newFile[0] != '\0');
	long i;
	FILE * fp;

	strcpy(fileName, newFile);	//替换原有文件路径
	fp = fopen(fileName, "wb");
	if(fp == NULL)	//文件不能打开
	{
		wndPointer->MessageBox("文件不能写 !", "保存文件错误", MB_ICONERROR);
		return false;
	}

	//1保存文件版本
	i = FILE_VERSION;
	fwrite(&i, sizeof(long), 1, fp);

	//2保存物体数量
	fwrite(&crunNum, sizeof(short), 1, fp);
	fwrite(&ctrlNum, sizeof(short), 1, fp);
	fwrite(&leadNum, sizeof(short), 1, fp);

	//3保存结点
	for(i = crunNum-1; i >= 0; --i)
		crun[i]->SaveToFile(fp);

	//4保存控件
	for(i = ctrlNum-1; i >= 0; --i)
		ctrl[i]->SaveToFile(fp);

	//5保存导线
	for(i = leadNum-1; i >= 0; --i)
		lead[i]->SaveToFile(fp);

	//6保存其他变量
	fwrite(&moveBodySense, sizeof(int), 1, fp);		//按方向键一次物体移动的距离
	fwrite(&maxLeaveOutDis, sizeof(int), 1, fp);	//导线合并最大距离
	fwrite(&textColor, sizeof(enum), 1, fp);		//字体颜色
	fwrite(&focusLeadStyle, sizeof(enum), 1, fp);	//焦点导线样式
	fwrite(&focusCrunColor, sizeof(enum), 1, fp);	//焦点结点颜色
	fwrite(&focusCtrlColor, sizeof(enum), 1, fp);	//焦点控件颜色
	focusBody.SaveToFile(fp);						//焦点物体
	fwrite(&viewOrig, sizeof(POINT), 1, fp);		//视角初始坐标

	//7文件保留域,便于文件升级
	char tmpForReserve[FILE_RESERVE_SIZE] = {0};
	fwrite(tmpForReserve, FILE_RESERVE_SIZE, 1, fp);

	fclose(fp);
	return true;
}

bool Manager::ReadFile(const char * newFile)
//读取电路
{
	ASSERT(newFile != NULL && newFile[0] != '\0');
	FILE * fp;
	int i;
	POINT pos1 = {NULL};
	Pointer body;

	fp = fopen(newFile, "rb");
	if(fp == NULL)
	{
		wndPointer->MessageBox("文件不能不存在或不能读取 !", "读取文件错误", MB_ICONERROR);
		return false;
	}

	//1读取文件版本
	fread(&i, sizeof(int), 1, fp);
	if(i != FILE_VERSION)	//文件版本不同,不予读取
	{
		fclose(fp);
		wndPointer->MessageBox("文件版本不符 !", "读取文件错误", MB_ICONERROR);
		return false;
	}

	DeleteVector(circuitVector.begin(), circuitVector.end());	//清除容器保存的电路信息
	strcpy(fileName, newFile);	//替换原有路径

	try	//可能因为文件问题而发生错误
	{
		//2读取物体数量
		fread(&crunNum, sizeof(short), 1, fp);
		fread(&ctrlNum, sizeof(short), 1, fp);
		fread(&leadNum, sizeof(short), 1, fp);

		//检查读取的物体数量是否在允许的范围之内
		if(crunNum < 0 || leadNum < 0 || ctrlNum < 0)
			goto READFILEERROR;
		if(crunNum>MAXCRUNNUM || leadNum>MAXLEADNUM || ctrlNum>MAXCTRLNUM)
			goto READFILEERROR;

		//为每个物体申请内存空间
		for(i = crunNum-1; i >= 0; --i)
			crun[i] = new CRUN(i, pos1);
		for(i = ctrlNum-1; i >= 0; --i)
			ctrl[i] = new CTRL(i, pos1, SOURCE, false);
		for(i = leadNum-1; i >= 0; --i)
			lead[i] = new LEAD(i, motiBody[0],motiBody[1], false);

		//3读取结点
		CRUN::ResetInitNum();
		for(i = crunNum-1; i >= 0; --i)
			crun[i]->ReadFromFile(fp, lead);

		//4读取控件
		CTRL::ResetInitNum();
		for(i = ctrlNum-1; i >= 0; --i)
			ctrl[i]->ReadFromFile(fp, lead);

		//5读取导线
		LEAD::ResetInitNum();
		for(i = leadNum-1; i >= 0; --i)
			lead[i]->ReadFromFile(fp, lead, crun, ctrl);

		//6读取其他变量
		fread(&moveBodySense, sizeof(UINT), 1, fp);		//按方向键一次物体移动的距离
		fread(&maxLeaveOutDis, sizeof(UINT), 1, fp);	//导线合并最大距离
		fread(&textColor, sizeof(enum), 1, fp);			//字体颜色
		fread(&focusLeadStyle, sizeof(enum), 1, fp);	//焦点导线样式
		fread(&focusCrunColor, sizeof(enum), 1, fp);	//焦点结点颜色
		fread(&focusCtrlColor, sizeof(enum), 1, fp);	//焦点控件颜色
		body.ReadFromFile(fp, lead, crun, ctrl);		//读取焦点物体
		FocusBodySet(body);								//设置焦点物体
		fread(&viewOrig, sizeof(POINT), 1, fp);			//视角初始坐标

		dc->SetTextColor(LEADCOLOR[textColor]);								//初始化字体颜色
		dc->SetViewportOrg(-viewOrig.x, -viewOrig.y);						//初始化视角初始坐标
		wndPointer->SetScrollPos(SB_HORZ, viewOrig.x/mouseWheelSense.cx);	//初始化水平滚动条
		wndPointer->SetScrollPos(SB_VERT, viewOrig.y/mouseWheelSense.cy);	//初始化竖直滚动条

	}	//try

	catch(...)
	{
	READFILEERROR:
		fclose(fp);
		wndPointer->MessageBox("文件可能损坏了 !", "读取文件错误", MB_ICONERROR);
		exit(0);
	}

	fclose(fp);				//关闭文件句柄
	PutCircuitToVector();	//将当前电路信息保存到容器
	return true;			//正常退出
}

void Manager::CreateFile()
//建立新文件(空的)
{
	fileName[0] = '\0';											//路径清空
	ClearCircuitState();										//清除电路状态信息
	DeleteVector(circuitVector.begin(), circuitVector.end());	//清除容器保存的电路信息
	leadNum = crunNum = ctrlNum = 0;							//物体数量设为0
	PutCircuitToVector();										//将当前空电路信息保存到容器
}


//8运算函数------------------------------------------------------------------------↓
void Manager::CombineGroup(
							int from,
							int to,
							int * group,
							int groupSize)
//将2个连接组 的组号 合并
{
	ASSERT(group!=NULL && groupSize>0 && from>=0 && to>=0);
	for(int i=groupSize-1; i>=0; --i) if(group[i]==from)
		group[i] = to;
}

char Manager::GetCrun2ConnectNum(int a, int b)
//获得2个crun2结点直接连接的线路个数
{
	int i;
	char connect = 0;
	CIRCU * temp;
	for(i=0; i<4; ++i)
	{
		temp = crun2[a].c[i];
		if(!temp)continue;
		if(temp->to == crun2+b || temp->from == crun2+b) ++connect;
	}
	return connect;
}

CIRCU * Manager::GetCrun2FirstCircu(int a, int b, int &num)
//由结点编号获得第一个连接他们的线路
//函数返回的是线路指针,同时把线路在crun2[a].c[i]的i返回给num
{
	CIRCU * temp;

	for(int i=0; i<4; ++i)
	{
		temp = crun2[a].c[i];
		if(!temp) continue;
		if(temp->to == crun2+b || temp->from == crun2+b)
		{
			num = i;
			return temp;
		}
	}

	return NULL;
}

void Manager::PutIntoBuf(	int fromGroup,
							int toGroup,
							CRUNMAP * map,
							double * buf)
//将from,to结点第一个连接线路的电流电阻放入缓冲
{
	int i;
	CIRCU * c;
	ASSERT(map != NULL && buf != NULL);

	if(fromGroup < toGroup)
		i = CONVERT(fromGroup, toGroup, map->size);
	else
		i = CONVERT(toGroup, fromGroup, map->size);

	c = map->firstcircu[i];

	if(c->from - crun2 == map->crunTOorder[fromGroup])
	{
		buf[ c->numInGroup ]  =  c->resistance;
		buf[ map->circuNum ] += c->pressure;
	}
	else 
	{
		buf[ c->numInGroup ]  = -c->resistance;
		buf[ map->circuNum ] -= c->pressure;
	}
}

int Manager::CreateCrunEquation(CRUN2 * inputCrun2, double * buf)
//建立结点方程,输出到缓存上
{
	CIRCU ** tempCircu = inputCrun2->c;
	int connectNum = 0;
	int i;

	for(i=0; i<4; ++i) if(tempCircu[i])
	{
		++ connectNum;

		if(inputCrun2 == tempCircu[i]->from && i == tempCircu[i]->dirFrom)
			buf[tempCircu[i]->numInGroup] += 1;
		else
			buf[tempCircu[i]->numInGroup] -= 1;
	}

	return connectNum;
}

void Manager::CollectCircuitInfo()
//遍历一次电路,获得每个群组的线路电学信息
{
	Pointer now, pre;	//当前的物体
	int dir;			//下一个物体在当前物体的方向
	int i, j, tempVar;	//循环变量
	int endCrunNum;		//线路结束结点编号
	int * group;		//物体分组
	int groupSize = 0;	//当前使用的group数组的大小

	//1,初始化----------------------------------------------------
	groupNum = 0;	//组数,同一组的在一个连通图中,分组建立方程
	circuNum = 0;	//线路数
	group = new int[crunNum];		//组数不会超过crunNum
	crun2 = new CRUN2[crunNum];		//用于计算的结点
	circu = new CIRCU[crunNum*2];	//线路数不会超过crunNum*2
	for(i=crunNum-1; i>=0; --i)group[i] = i;

	//2，检索电路,以结点为头和尾-----------------------------------
	for(i=crunNum-1; i>=0; --i) if(crun[i]->GetConnectNum() >= 3)
	//满足结点连接导线个数至少是3,否则结点不需要检索
	//0--结点是孤立的;1--结点断路;2--结点相当于导线
		for(j=0; j<4; ++j) if(crun[i]->lead[j] && crun2[i].c[j] == NULL)
	//满足当前方向有导线连接 而且 没有检索过(crun2[i].c[j] == NULL)
	{
		now.SetOnLead(crun[i]->lead[j]);
		dir = now.p1->conBody[0].IsCrunSame(crun[i]);

		circu[circuNum].resistance = 0;	//电阻清0
		circu[circuNum].pressure   = 0;	//电压清0

		while(true)	//遇到下一个连接物体不是2个的结点结束
		{
			pre = now;

			if(now.IsOnCtrl())	//控件
			{
				//处理控件
				if(now.p3->GetResist() < 0 || now.p3->lead[dir] == NULL)	//断路了
				{
					circu[circuNum].resistance = -1;
					break;
				}
				circu[circuNum].resistance += now.p3->GetResist();
				circu[circuNum].pressure   += now.p3->GetPress(!dir);	//方向相反

				//到下一个物体
				now.SetOnLead(pre.p3->lead[dir]);
				dir = now.p1->conBody[0].IsCtrlSame(pre.p3);
			}
			else	//导线,到下一个物体
			{
				now = pre.p1->conBody[dir];
				if(now.IsOnCrun())	//遇到连接物体不是2个的结点结束
				{
					tempVar = now.p2->GetConnectNum();
					if(tempVar >= 3)	//通路
					{
						dir = now.p2->GetDirect(pre.p1);	//记录下结束的结点和方向
						break;
					}
					else if(tempVar == 2)	//跳过,相当于导线
					{
						//找到结点连接的另一个导线
						for(dir=0; dir<4; ++dir)
							if(now.p2->lead[dir]!=NULL && pre.p1 != now.p2->lead[dir]) break;
						//转到结点连接的另一个导线
						pre = now;
						now.SetOnLead(pre.p2->lead[dir]);
						dir = now.p1->conBody[0].IsCrunSame(pre.p2);
					}
					else if(tempVar == 1)	//断路
					{
						circu[circuNum].resistance = -1;
						break;	//断路返回
					}
					else
					{
						throw "电路文件有错 !导线连接结点,但是结点不连接导线 !";
						break;
					}
				}
				else if(now.IsOnCtrl())
				{
					dir = now.p3->lead[0] == pre.p1;
				}
				else if(now.IsOnLead())
				{
					throw "2个导线直接连接出现会引起错误 !";
					break;
				}
				else
				{
					throw "电路文件有错 !导线只连接一个物体 !";
					break;
				}
				
			}
		}//while(true)

		if(circu[circuNum].resistance >= 0)
		{
			endCrunNum = now.p2->num;

			circu[circuNum].eleNum = circuNum;
			circu[circuNum].from = crun2 + i;
			circu[circuNum].dirFrom = (char)j;
			circu[circuNum].to = crun2 + endCrunNum;
			circu[circuNum].dirTo = (char)dir;
			crun2[endCrunNum].c[dir] = crun2[i].c[j] = circu+circuNum;
			++ circuNum;	//不是断路,计入有效线路

			if(crun2[i].group >= 0)
			{
				if(crun2[endCrunNum].group >= 0 && group[crun2[i].group] == group[crun2[endCrunNum].group])
				{
					continue;
				}
				if(crun2[endCrunNum].group >= 0)	//group合并
				{
					CombineGroup(
									group[crun2[endCrunNum].group],
									group[crun2[i].group],
									group,
									groupSize);
					--groupNum;	//合并
				}
				else	//继承连接物体的group
				{
					crun2[endCrunNum].group = crun2[i].group;
				}
			}
			else
			{
				if(crun2[endCrunNum].group>=0)	//继承连接物体的group
				{
					crun2[i].group=crun2[endCrunNum].group;
				}
				else	//建立新的group
				{
					crun2[i].group = crun2[endCrunNum].group = groupSize;
					++groupSize;
					++groupNum;	//建立新的
				}
			}

		}//if( circu[i].resistance >= 0 )

	}//for

	//3,将group排列成从0开始的连续数字-----------------------------------
	dir = 0;
	for(i=groupNum-1; i>=0; --i)
	{
		for(; dir<groupSize; ++dir) if(group[dir] >= 0) break;
		for(j=dir+1; j<groupSize; ++j) if(group[j]==group[dir]) group[j] = -i - 1;
		group[dir] = -i - 1;
		++dir;
	}
	for(j=groupSize-1; j>=0; --j) group[j] = -group[j] - 1;

	//4,以上crun2的group不是真正的组队标志,而是指向group数组的指针-------
	//现在转化为真正的组队标志
	for(i=crunNum-1; i>=0; --i) if(crun2[i].group >= 0) crun2[i].group = group[crun2[i].group];

	delete [] group;
}

bool Manager::FindRoad(const CRUNMAP * map, ROAD * roads, int j, int k)
//形成一个结点j 到 其他结点的路径,屏蔽j k之间的直接连线
{
	const int size = map->size;
	bool state;			//记录是否改变了
	int i, next;		//循环变量
	bool * interFlag;	//j 是否找到与某点连线的标记

	interFlag = new bool[size];
	for(i=size-1; i>j; --i) interFlag[i] = map->direct[CONVERT(j,i,size)] > 0;
	for(i=j-1; i>=0; --i) interFlag[i] = map->direct[CONVERT(i,j,size)] > 0;
	interFlag[j] = interFlag[k] = false;

	do
	{
		state = false;	//清除上次状态

		for(i=size-1; i>=0; --i) if(i!=j && i!=k && interFlag[i])
		{
			for(next=size-1; next>i; --next)
				if(next-j && !interFlag[next] && map->direct[CONVERT(i,next,size)]>0)
			{
				state = true;	//改变了
				interFlag[next] = true;
				roads[i].Clone(roads[next]);
				roads[next].InsertPointAtTail(i);
			}

			if(interFlag[k]) goto end;	//退出循环

			for(next=i-1; next>=0; --next)
			{
				if(next != j && !interFlag[next] && map->direct[CONVERT(next,i,size)] > 0)
				{
					state = true;	//改变了
					interFlag[next] = true;
					roads[i].Clone(roads[next]);
					roads[next].InsertPointAtTail(i);
				}
			}

			if(interFlag[k]) goto end;	//退出循环
		}

	}
	while(state);

end:

	state = interFlag[k];
	delete [] interFlag;
	return state;	//返回是否找到 j->k 的线路
}

void Manager::CreateEquation()
//根据线路信息,分群组建立方程
{
	int group, i, j, k, size;
	CRUNMAP * nowMap;
	CRUNMAP * maps;

	//1 初始化maps---------------------------------------------------------
	//1.1 初始化每个group的crun成员个数
	this->maps = maps = new CRUNMAP[groupNum];
	for(i=groupNum-1; i>=0; --i)maps[i].size=0;
	for(i=crunNum-1; i>=0; --i) if(crun2[i].group >= 0)
		++ maps[crun2[i].group].size;
	for(i=groupNum-1; i>=0; --i)
	{
		maps[i].Init(maps[i].size);	//初始化map内存
		maps[i].size = 0;
	}
	for(i=crunNum-1; i>=0; --i) if(crun2[i].group >= 0)
	{
		nowMap = maps + crun2[i].group;
		nowMap->crunTOorder[nowMap->size] = i;
		++nowMap->size;
	}

	//1.2 初始化每个group的circu成员个数
	for(i=groupNum-1; i>=0; --i) maps[i].circuNum = 0;
	for(i=circuNum-1; i>=0; --i)
	{
		nowMap = maps + circu[i].from->group;
		circu[i].numInGroup = nowMap->circuNum;
		++nowMap->circuNum;
	}

	//1.3 初始化每个group的direct成员个数
	for(group=groupNum-1; group>=0; --group)
	{
		nowMap = maps+group;
		size = nowMap->size;

		for(j=size-2; j>=0; --j) for(k=size-1; k>j; --k)
		{
			i = CONVERT(j, k, size);
			nowMap->direct[i] =
				GetCrun2ConnectNum(nowMap->crunTOorder[j], nowMap->crunTOorder[k]);
		}
	}//for(group

	//1.4  初始化连接2个结点的第一个线路
	for(group=groupNum-1; group>=0; --group)
	{
		nowMap = maps+group;
		size = nowMap->size;

		for(j=size-2; j>=0; --j) for(k=size-1; k>j; --k)
		{
			i = CONVERT(j, k, size);
			nowMap->firstcircu[i] = 
				GetCrun2FirstCircu(nowMap->crunTOorder[j], nowMap->crunTOorder[k], nowMap->dir[i]);
		}
	}


	//2	2个结点之间有>=2条直接连接的线路,	-----------------------------
	//	他们之间形成环路,得到部分方程		-----------------------------
	double * outPutBuf;	//输出到方程的缓存数组
	double saveForBuf;	//保存部分数据
	CRUN2 * crunNum1, * crunNum2;
	int connect, firstConnect, nextConnect;

	equation = new Equation * [groupNum];	//申请指针
	for(group=groupNum-1; group>=0; --group)
	{
		nowMap = maps + group;
		size = nowMap->size;

		outPutBuf = new double[nowMap->circuNum+1];	//初始化输出到方程的数组
		equation[group] = new Equation(size, nowMap->circuNum);	//初始化方程类

		for(j=size-2; j>=0; --j) for(k=size-1; k>j; --k)
		{
			ZeroMemory(outPutBuf, (nowMap->circuNum+1) * sizeof(double));	//缓存清零
			i = CONVERT(j, k, size);
			if(nowMap->direct[i] < 2) continue;

			crunNum1 = crun2 + nowMap->crunTOorder[j];
			crunNum2 = crun2 + nowMap->crunTOorder[k];
			firstConnect = nowMap->dir[i];	//第一个连线

			//获取并保存部分线路数据
			if(crunNum1->c[firstConnect]->from == crunNum2)
			{
				outPutBuf[crunNum1->c[firstConnect]->numInGroup] =
					-crunNum1->c[firstConnect]->resistance;
				saveForBuf = -crunNum1->c[firstConnect]->pressure;
			}
			else
			{
				outPutBuf[crunNum1->c[firstConnect]->numInGroup] =
					crunNum1->c[firstConnect]->resistance;
				saveForBuf = crunNum1->c[firstConnect]->pressure;
			}
			nextConnect = firstConnect + 1;

			//2个结点之间有>=2条直接连接的线路,他们之间形成环路,得到部分方程
			for(connect=nowMap->direct[i]-2; connect>=0; --connect)
			{
				//1,寻找下一个连接的线路
				while(	crunNum1->c[nextConnect] == NULL
						|| 
						(	crunNum1->c[nextConnect]->to != crunNum2 
							&& 
							crunNum1->c[nextConnect]->from != crunNum2
						)
					 )
					++ nextConnect;

				//2,将电阻,电压计入
				outPutBuf[nowMap->circuNum] = saveForBuf;	//写入保存的数据
				if(crunNum1->c[nextConnect]->from == crunNum2)
				{
					outPutBuf[crunNum1->c[nextConnect]->numInGroup] =
						crunNum1->c[nextConnect]->resistance;
					outPutBuf[nowMap->circuNum] += 
						crunNum1->c[nextConnect]->pressure;
				}
				else
				{
					outPutBuf[crunNum1->c[nextConnect]->numInGroup] =
						- crunNum1->c[nextConnect]->resistance;
					outPutBuf[nowMap->circuNum] -= 
						crunNum1->c[nextConnect]->pressure;
				}

				//3,输入方程
				equation[group]->InputARow(outPutBuf);

				//4,恢复
				outPutBuf[crunNum1->c[nextConnect]->numInGroup] = 0;

				//5,下一个
				++ nextConnect;
			}
		}

		delete [] outPutBuf;	//释放缓存
	}//for(group


	//3 仅包含一个结点的环路,直接计算结果放入方程  ----------------------
	for(i=circuNum-1; i>=0; --i) if(circu[i].from == circu[i].to)
	{
		//初始化缓存
		group  = circu[i].from->group;
		nowMap = maps + group;
		outPutBuf = new double[nowMap->circuNum+1];	//输出到方程的缓存
		ZeroMemory(outPutBuf, (nowMap->circuNum+1) * sizeof(double));	//缓存清零

		if(StaticClass::IsZero(circu[i].resistance) && StaticClass::IsZero(circu[i].pressure))
		{//电阻电压都是0;设电阻为1,电压为0
			outPutBuf[circu[i].numInGroup]	= 1;
			outPutBuf[nowMap->circuNum]		= 0;
		}
		else
		{//正常情况或短路情况
			outPutBuf[circu[i].numInGroup]	= circu[i].resistance;
			outPutBuf[nowMap->circuNum]		= circu[i].pressure;
		}

		equation[group]->InputARow(outPutBuf);	//输入方程的一行

		delete [] outPutBuf;	//释放缓存
	}


	//4	有直接线路连接的2个结点, 形成一个环路，		---------------------
	//	该环路包含一次这个连接它们的线路,			---------------------
	//	由环路信息得出方程 .						---------------------
	for(group=groupNum-1; group>=0; --group)
	{
		nowMap = maps + group;
		size = nowMap->size;
		outPutBuf = new double[nowMap->circuNum+1];	//输出到方程的缓存
		ROAD * roads ;

		for(j=size-2; j>=0; --j) for(k=size-1; k>j; --k)
		{
			//初始化
			i = CONVERT(j, k, size);
			if(nowMap->direct[i] <= 0) continue;
			
			roads = new ROAD[size] ;
			ZeroMemory(outPutBuf, (nowMap->circuNum+1) * sizeof(double));	//缓存清零

			//获得路径,建立方程
			if(FindRoad(nowMap, roads, j, k))	//有路径得到方程的一行
			{
				ROADSTEP * prep = roads[k].first;
				ROADSTEP * nowp;

				if(prep == NULL) continue;	//出错

				nowp = prep->next;
				PutIntoBuf(j, prep->crunNum, nowMap, outPutBuf);

				while(nowp != NULL)
				{
					PutIntoBuf(prep->crunNum, nowp->crunNum, nowMap, outPutBuf);

					//下一个
					prep = nowp;
					nowp = nowp->next;
				}

				PutIntoBuf(prep->crunNum, k, nowMap, outPutBuf);

				PutIntoBuf(k, j, nowMap, outPutBuf);	//最后加入j到k的第一个线路

				equation[group]->InputARow(outPutBuf);	//输入方程
			}
			else if(1 == nowMap->direct[i])	//没有路径,该导线电流是0
			{
				//导线电流设为0
				outPutBuf[nowMap->firstcircu[i]->numInGroup] = 1;
				outPutBuf[nowMap->circuNum] = 0;

				equation[group]->InputARow(outPutBuf);	//输入方程
			}

			delete [] roads;
		}

		delete [] outPutBuf;	//释放缓存
	}//for(group


	//5形成结点方程------------------------------------------------------
	for(group=groupNum-1; group>=0; --group)
	{
		nowMap = maps+group;
		size = nowMap->size;
		outPutBuf = new double[nowMap->circuNum+1];	//输出到方程的缓存

		for(k=size-2; k>=0; --k)	//只需输入k-1个结点方程
		{
			ZeroMemory(outPutBuf, (nowMap->circuNum+1) * sizeof(double));	//缓存清零
			if(CreateCrunEquation(crun2 + nowMap->crunTOorder[k], outPutBuf))	//建立方程
				equation[group]->InputARow(outPutBuf);	//输入方程
		}

		delete [] outPutBuf;	//释放缓存
	}
}

void Manager::TravelCircuitPutElec(	Pointer now,
									const CRUN * last,
									int dir,
									double elec,
									ELEC_STATE flag)
//从指定物体遍历,将线路电流赋值到物体上
{
	Pointer pre;

	do
	{
		pre = now;

		if(now.IsOnCtrl())	//控件
		{
			if(NORMALELEC == flag) //正常线路
			{
				now.p3->elec	= elec;
				now.p3->elecDir	= (enum ELEC_STATE)(!dir);	//方向相反
			}
			else	//不正常线路
			{
				now.p3->elecDir = flag;
			}

			//到下一个物体
			now.SetOnLead(pre.p3->lead[dir]);
			dir = now.p1->conBody[0].IsCtrlSame(pre.p3);
		}
		else	//导线,到下一个物体
		{
			if(NORMALELEC == flag) //正常线路
			{
				now.p1->elec	= elec;
				now.p1->elecDir	= (enum ELEC_STATE)(!dir);	//方向相反
			}
			else	//不正常线路
			{
				now.p1->elecDir = flag;
			}

			now = now.p1->conBody[dir];
			if(now.IsOnCrun())	//遇到终点(last结点)结束
			{
				if(now.p2 == last) break;	//到达终点
				else //跳过,相当于导线
				{
					//找到结点连接的另一个导线
					for(dir=0; dir<4; ++dir)
						if(now.p2->lead[dir]!=NULL && pre.p1 != now.p2->lead[dir]) break;
					//指针指向结点连接的另一个导线
					pre = now;
					now.SetOnLead(pre.p2->lead[dir]);
					dir = now.p1->conBody[0].IsCrunSame(pre.p2);
				}
			}
			else if(now.IsOnLead())
			{
				throw "2个导线直接连接出现会引起错误 !";
			}
			else //now.IsOnBody
			{
				dir = now.p3->lead[0] == pre.p1;
			}
		}
	}//do
	while(!now.IsOnCrun() || now.p2 != last);	//遇到终点(last结点)结束
}

void Manager::TravelCircuitFindOpenBody(Pointer now, int dir)
//从指定物体遍历,将断路物体设置电流断路
//终点条件:断路控件,连接数不等于2的结点
{
	const Pointer first = now;
	Pointer pre;

	do
	{
		pre = now;

		if(now.IsOnCtrl())	//控件
		{
			//输入电流
			now.p3->elecDir = OPENELEC;
			now.p3->elec = 0;

			//到下一个物体
			now.SetOnLead(pre.p3->lead[dir]);
			if(now.p1 == NULL) break;	//结束遍历
			dir = now.p1->conBody[0].IsCtrlSame(pre.p3);
		}
		else	//导线,到下一个物体
		{
			//输入电流
			now.p1->elecDir = OPENELEC;
			now.p1->elec = 0;

			now = now.p1->conBody[dir];
			if(now.IsOnCrun())	//遇到终点(last结点)结束
			{
				if(2 != now.p2->GetConnectNum())	//到达终点
				{
					break;
				}
				else //跳过,相当于导线
				{
					//找到结点连接的另一个导线
					for(dir=0; dir<4; ++dir)
						if(now.p2->lead[dir]!=NULL && pre.p1 != now.p2->lead[dir]) break;
					//指针指向结点连接的另一个导线
					pre = now;
					now.SetOnLead(pre.p2->lead[dir]);
					dir = now.p1->conBody[0].IsCrunSame(pre.p2);
				}
			}
			else if(now.IsOnLead())
			{
				throw "2个导线直接连接出现会引起错误";
			}
			else //now.IsOnBody()
			{
				dir = now.p3->lead[0] == pre.p1;
			}
		}
	}//do
	while(!now.IsBodySame(&first));	//遍历到终点
}

ELEC_STATE Manager::TravelCircuitGetOrSetInfo(Pointer now, int dir, double &elec, ELEC_STATE flag)
//从指定物体遍历,获得电压和电阻信息,起点就是终点
//指定物体不能是线路中包含的结点,否则函数进入死循环
{
	double press = 0;
	double resist = 0;
	const Pointer self = now;	//记录下起点
	Pointer pre;
	if(now.IsOnCrun()) return ERRORELEC;	//指定物体不能是线路中包含的结点

	do
	{
		pre = now;

		if(now.IsOnCtrl())	//控件
		{
			if(UNKNOWNELEC == flag)	//获得电压电阻
			{
				resist	+= now.p3->GetResist();
				press	+= now.p3->GetPress(!dir);	//方向相反
			}
			else if(NORMALELEC == flag)	//放入正常电流信息
			{
				now.p3->elecDir	= (enum ELEC_STATE)(!dir);	//方向相反
				now.p3->elec	= elec;
			}
			else	//放入不正常电流信息
			{
				now.p3->elecDir = flag;
			}

			//到下一个物体
			now.SetOnLead(pre.p3->lead[dir]);
			if(now.p1 == NULL) return ERRORELEC;	//结束遍历,这种情况是错误
			dir = now.p1->conBody[0].IsCtrlSame(pre.p3);
		}
		else	//导线,到下一个物体
		{
			if(NORMALELEC == flag)	//放入正常电流信息
			{
				now.p1->elecDir	= (enum ELEC_STATE)(!dir);	//方向相反
				now.p1->elec	= elec;
			}
			else if(UNKNOWNELEC != flag)	//放入不正常电流信息
			{
				now.p1->elecDir = flag;
			}

			now = now.p1->conBody[dir];
			if(now.IsOnCrun())	//此时结点一定连接2个导线,跳过,相当于导线
			{
				//找到结点连接的另一个导线
				for(dir=0; dir<4; ++dir)
					if(now.p2->lead[dir]!=NULL && pre.p1 != now.p2->lead[dir]) break;
				//指针指向结点连接的另一个导线
				pre = now;
				now.SetOnLead(pre.p2->lead[dir]);
				dir = now.p1->conBody[0].IsCrunSame(pre.p2);
			}
			else if(now.IsOnLead())
			{
				throw "2个导线直接连接出现会引起错误";
			}
			else	//now.IsOnBody
			{
				dir = now.p3->lead[0] == pre.p1;
			}
		}
	}//do
	while(!now.IsBodySame(&self));	//遍历到终点

	if(UNKNOWNELEC == flag)	//获得电压电阻
	{
		if(!StaticClass::IsZero(resist))	//正常--电阻不是0
		{
			elec = press/resist;
			return NORMALELEC;
		}
		else if(StaticClass::IsZero(press))	//正常--电阻电压都是0
		{
			elec = 0;
			return NORMALELEC;
		}
		else	//短路
		{
			elec = 0;
			return SHORTELEC;
		}
	}

	return NORMALELEC;
}

void Manager::DistributeAnswer()
//将计算的电流结果分布到每个导线,控件
{
	int i;			//循环变量
	int dir;		//下一个物体在当前物体的方向
	Pointer now;	//当前访问的线路控件
	CRUN * end;		//线路的终点
	double elec;

	//1,初始化每个导线和电学元件的elecDir,当做标记使用
	for(i=leadNum-1; i>=0; --i) lead[i]->elecDir = UNKNOWNELEC;
	for(i=ctrlNum-1; i>=0; --i) ctrl[i]->elecDir = UNKNOWNELEC;

	//2,将circu的结果分布到每个线路中的物体
	for(i=circuNum-1; i>=0; --i)
	{
		//1,找到线路的起点,end做临时变量
		end = crun[circu[i].from - crun2];
		now.SetOnLead(end->lead[circu[i].dirFrom]);

		//2,确定查找方向,end做临时变量
		dir = now.p1->conBody[0].IsCrunSame(end);

		//3,找到线路的终点,end存放终点结点指针
		end = crun[circu[i].to - crun2];

		//4,遍历线路
		TravelCircuitPutElec(now, end, dir, circu[i].elec, circu[i].elecDir);
	}

	//清除circu,crun2的内存
	delete [] circu;
	delete [] crun2;
	circu = NULL;
	circuNum = 0;

	//3,找到孤立控件,将电流信息设置为断路
	for(i=ctrlNum-1; i>=0; --i) if(!ctrl[i]->lead[0] && !ctrl[i]->lead[1])
	{
		ctrl[i]->elecDir = OPENELEC;
		ctrl[i]->elec = 0;
	}

	//4,找到一端有连接的控件,将连接的所有断路物体电流信息设置好
	//思路:(每一步遍历都将断路信息写入)
	//		1,找到断路物体
	//		2,遍历到终点(终点条件:断路控件,连接数不等于2的结点)
	for(i=ctrlNum-1; i>=0; --i) if(1 == ctrl[i]->GetConnectNum())
	{
		//1,找到线路的起点
		now.SetOnCtrl(ctrl[i]);

		//2,确定查找方向
		dir = now.p3->lead[1] != NULL;

		//3,遍历线路
		TravelCircuitFindOpenBody(now, dir);
	}
	for(i=crunNum-1; i>=0; --i) if(1 == crun[i]->GetConnectNum())
	{
		//1,找到线路的起点
		for(dir=0;dir<4;dir++) if(crun[i]->lead[dir]) break;
		now.SetOnLead(crun[i]->lead[dir]);

		//2,确定查找方向
		dir = now.p1->conBody[0].IsCrunSame(crun[i]);

		//3,遍历线路
		TravelCircuitFindOpenBody(now, dir);
	}

	//5,对于UNKNOWNELEC == elecDir,而且控件是两边都有连接,但是resist<0
	//	出现这种情况的原因:线路中有断路元件(比如电容器),但是线路连接完好
	//	遍历断路电路,把断路信息写入物体
	for(i=ctrlNum-1; i>=0; --i)
	{
		if(UNKNOWNELEC != ctrl[i]->elecDir || ctrl[i]->GetResist() >= 0) continue;

		//1,设置线路的起点
		now.SetOnCtrl(ctrl[i]);

		//2,从2个方向遍历
		TravelCircuitFindOpenBody(now, 0);
		TravelCircuitFindOpenBody(now, 1);
	}

	//6,对于 UNKNOWNELEC == elecDir的物体,计算电流和方向
	//出现这种情况的原因:线路中没有节点,是由导线和电学元件连接的环路
	//思路 :(每一步都要记录下走过的电阻和电压,因为需要计算)
	// 1 从物体左边开始找,一直找到自己停止
	// 2 计算电流大小,重新遍历一遍,把信息放入到物体中
	for(i=ctrlNum-1; i>=0; --i)
	{
		if(UNKNOWNELEC != ctrl[i]->elecDir) continue;

		//1,设置线路的起点
		now.SetOnCtrl(ctrl[i]);

		//2,从左边遍历,获得电阻和电压
		dir = TravelCircuitGetOrSetInfo(now, 0, elec, UNKNOWNELEC);

		//3,把结果放入物体
		if(ERRORELEC == dir)
		{
			throw "计算电流出现错误!!!";
		}
		else
		{
			if(NORMALELEC == dir && elec < 0)
			{
				//电流改为正数,调转遍历方向
				elec = -elec;
				TravelCircuitGetOrSetInfo(now, 1, elec, (ELEC_STATE)dir);
			}
			else 
			{
				TravelCircuitGetOrSetInfo(now, 0, elec, (ELEC_STATE)dir);
			}
		}
	}

	//7,对于线路中只存在: 若干(导线) 和 若干(2端连接导线的结点), 将电流设置为0
	//	出现这种情况的原因:线路没有超过3端连线的节点,不会加入到线路列表中
	//	线路有没有短路,前面也不会检查到;第六步只检查控件也不会检查到
	for(i=leadNum-1; i>=0; --i) if(UNKNOWNELEC == lead[i]->elecDir)
	{
		lead[i]->elecDir = LEFTELEC;
		lead[i]->elec = 0;
	}
}

void Manager::CountElec()
//由形成的n元1次方程计算各个线路电流值
{
	int group;
	int i;
	ELEC_STATE flag;
	const double * ans;

	ClearCircuitState();	//清除电路状态信息
	CollectCircuitInfo();	//遍历一次电路,获得每个群组的线路电学信息
	CreateEquation();		//根据线路信息,分群组建立方程

	for(group=0; group<groupNum; ++group)	//分群组计算
	{
		flag = equation[group]->Count();	//计算方程

		if(NORMALELEC == flag)	//线路正常
		{
			ans = equation[group]->GetAnswer();	//获得结果数组指针
			for(i=circuNum-1; i>=0; --i) if(group == circu[i].from->group)
			{
				circu[i].elecDir = NORMALELEC;
				circu[i].elec = ans[circu[i].numInGroup];
				circu[i].ConvertWhenElecLessZero();	//当电流负数时改为正数,并调转电流方向
			}
		}
		else	//短路或无法确定电流
		{
			for(i=circuNum-1; i>=0; --i) if(group == circu[i].from->group)
			{
				circu[i].elecDir = flag;
			}
		}

		maps[group].Uninit();	//删除一个线路图
		delete equation[group];	//删除一个方程
	}

	delete [] maps;		//删除线路图数组
	delete [] equation;	//删除方程数组指针
	DistributeAnswer();	//将结果分布到每个物体,函数中释放了circu和crun2
}


//10处理剪切板函数-----------------------------------------------------------------↓
void Manager::ClearClipboard()
//清空剪切板
{
	if(clipBody.IsOnCrun())
		delete clipBody.p2;
	else if(clipBody.IsOnCtrl())
		delete clipBody.p3;
	clipBody.Clear();
}

bool Manager::GetClipboardState()
//获取剪切板是否可用
{
	return clipBody.IsOnBody();
}

void Manager::CopyToClipboard(const Pointer &body)
//拷贝body指向的物体到剪切板
{
	ASSERT(body.IsOnBody());
	motiNum = 0;
	ClearClipboard();	//清空剪切板

	if(body.IsOnCrun())
		clipBody.SetOnCrun(body.p2->Clone(CLONE_FOR_CLIPBOARD), true);
	else //if(body.IsOnCtrl())
		clipBody.SetOnCtrl(body.p3->Clone(CLONE_FOR_CLIPBOARD), true);
}

Pointer Manager::CopyBody(FOCUS_OR_POS &body)
//复制物体到剪切板
{
	Pointer pointer = GetBodyPointer(body);
	if(!pointer.IsOnBody()) return pointer;
	CopyToClipboard(pointer);
	return pointer;
}

void Manager::CutBody(FOCUS_OR_POS &body)
//剪切物体到剪切板
{
	Pointer pointer = CopyBody(body);	//复制物体
	if(!pointer.IsOnBody()) return;
	Delete(pointer);					//删除物体
	PaintAll();							//重绘电路
}

bool Manager::PasteBody(POINT pos)
//粘贴物体
{
	if(!clipBody.IsOnBody())
	{
		MessageBeep(0);
		return false;
	}
	dc->DPtoLP(&pos);

	if(clipBody.IsOnCrun())
	{
		if(crunNum >= MAXCRUNNUM)
		{
			wndPointer->MessageBox("结点超过最大数量!", "结点不能添加", MB_ICONWARNING);
			return false;
		}

		CloneCircuitBeforeChange();	//编辑前复制电路
		//编辑部分
		crun[crunNum] = clipBody.p2->Clone(CLONE_FOR_USE);
		crun[crunNum]->coord = pos;
		crun[crunNum]->num = crunNum;
		++ crunNum;

		PutCircuitToVector();	//将新的电路信息保存到容器
		PaintCrun(crun[crunNum-1]);
	}
	else if(clipBody.IsOnCtrl())
	{
		if(ctrlNum >= MAXCTRLNUM)
		{
			wndPointer->MessageBox("电学元件超过最大数量!", "电学元件不能添加", MB_ICONWARNING);
			return false;
		}

		CloneCircuitBeforeChange();	//编辑前复制电路
		//编辑部分
		ctrl[ctrlNum] = clipBody.p3->Clone(CLONE_FOR_USE);
		ctrl[ctrlNum]->coord = pos;
		ctrl[ctrlNum]->num = ctrlNum;
		++ ctrlNum;

		PutCircuitToVector();	//将新的电路信息保存到容器
		PaintCtrl(ctrl[ctrlNum-1]);
	}

	return true;
}


//11鼠标焦点物体函数---------------------------------------------------------------↓
void Manager::UpdateEditMenuState()
//更新编辑菜单状态(MF_ENABLED or MF_GRAYED)
{
	CMenu * cm = wndPointer->GetMenu();
	UINT menuState;

	if(!focusBody.IsOnAny())
	{
		cm->EnableMenuItem(IDM_FOCUSBODY_COPY, MF_GRAYED);
		cm->EnableMenuItem(IDM_FOCUSBODY_CUT, MF_GRAYED);
		cm->EnableMenuItem(IDM_FOCUSBODY_DELETE, MF_GRAYED);
		cm->EnableMenuItem(IDM_FOCUSBODY_PROPERTY, MF_GRAYED);

		cm->EnableMenuItem(IDM_FOCUSBODY_CHANGECTRLSTYLE, MF_GRAYED);
		cm->EnableMenuItem(IDM_FOCUSBODY_ROTATE1, MF_GRAYED);
		cm->EnableMenuItem(IDM_FOCUSBODY_ROTATE2, MF_GRAYED);
		cm->EnableMenuItem(IDM_FOCUSBODY_ROTATE3, MF_GRAYED);

		cm->EnableMenuItem(IDM_FOCUSBODY_SHOWELEC, MF_GRAYED);
	}
	else if(focusBody.IsOnLead())
	{
		cm->EnableMenuItem(IDM_FOCUSBODY_COPY, MF_GRAYED);
		cm->EnableMenuItem(IDM_FOCUSBODY_CUT, MF_GRAYED);
		cm->EnableMenuItem(IDM_FOCUSBODY_DELETE, MF_ENABLED);
		cm->EnableMenuItem(IDM_FOCUSBODY_PROPERTY, MF_ENABLED);

		cm->EnableMenuItem(IDM_FOCUSBODY_CHANGECTRLSTYLE, MF_GRAYED);
		cm->EnableMenuItem(IDM_FOCUSBODY_ROTATE1, MF_GRAYED);
		cm->EnableMenuItem(IDM_FOCUSBODY_ROTATE2, MF_GRAYED);
		cm->EnableMenuItem(IDM_FOCUSBODY_ROTATE3, MF_GRAYED);

		cm->EnableMenuItem(IDM_FOCUSBODY_SHOWELEC, MF_ENABLED);
	}
	else
	{
		cm->EnableMenuItem(IDM_FOCUSBODY_COPY, MF_ENABLED);
		cm->EnableMenuItem(IDM_FOCUSBODY_CUT, MF_ENABLED);
		cm->EnableMenuItem(IDM_FOCUSBODY_DELETE, MF_ENABLED);
		cm->EnableMenuItem(IDM_FOCUSBODY_PROPERTY, MF_ENABLED);

		if(focusBody.IsOnCtrl())
			menuState = MF_ENABLED;
		else
			menuState = MF_GRAYED;

		cm->EnableMenuItem(IDM_FOCUSBODY_CHANGECTRLSTYLE, menuState);
		cm->EnableMenuItem(IDM_FOCUSBODY_ROTATE1, menuState);
		cm->EnableMenuItem(IDM_FOCUSBODY_ROTATE2, menuState);
		cm->EnableMenuItem(IDM_FOCUSBODY_ROTATE3, menuState);
		cm->EnableMenuItem(IDM_FOCUSBODY_SHOWELEC, menuState);
	}
}

void Manager::FocusBodyClear(const Pointer * deleteBody)
//判断删除物体是否是当前焦点,如果是则清除鼠标焦点物体
//如果deleteBody==NULL,直接删除焦点
//函数执行在:Manager,DeleteSingleBody,ClearCircuitState
{
	if(deleteBody == NULL || focusBody.IsBodySame(deleteBody))
	{
		focusBody.Clear();
		UpdateEditMenuState();
	}
}

void Manager::FocusBodySet(const Pointer &newFocus)
//设置焦点物体
//函数执行在:FocusBodyPaint,ReadCircuitFromVector,ReadFile
{
	ASSERT(!newFocus.IsOnConnectPos());
	focusBody = newFocus;
	UpdateEditMenuState();
}

bool Manager::FocusBodyPaint(const Pointer * newFocus)
//画获得鼠标焦点的物体,并覆盖原来的焦点
//如果newFocus==NULL重绘原来焦点;否则覆盖原来的焦点,新的焦点用焦点色画
{
	if(newFocus != NULL)	//焦点改变
	{
		if(focusBody.IsBodySame(newFocus))
			return false;

		//原来的焦点用黑色画
		if(focusBody.IsOnLead())
			PaintLead(focusBody.p1);
		if(focusBody.IsOnCrun())
			PaintCrun(focusBody.p2, false);
		else if(focusBody.IsOnCtrl())
			PaintCtrl(focusBody.p3, false);

		//焦点物体更新
		FocusBodySet(*newFocus);
	}

	if(focusBody.IsOnLead())
	{
		switch(focusLeadStyle)
		{
		case SOLID_RESERVE_COLOR:
			PaintLeadWithStyle(focusBody.p1, PS_SOLID,  RESERVE_COLOR);
			break;
		case SOLID_ORIGINAL_COLOR:
			PaintLead(focusBody.p1);
			break;
		case DOT_ORIGINAL_COLOR:
			PaintLeadWithStyle(focusBody.p1, PS_DOT, focusBody.p1->color);
			break;
		case DOT_RESERVE_COLOR:
			PaintLeadWithStyle(focusBody.p1, PS_DOT, RESERVE_COLOR);
			break;
		}
	}
	else if(focusBody.IsOnCrun())
	{
		PaintCrunWithColor(focusBody.p2, focusCrunColor);
	}
	else if(focusBody.IsOnCtrl())
	{
		PaintCtrlWithColor(focusBody.p3, focusCtrlColor);
	}

	return true;
}

void Manager::FocusBodyChangeUseTab()
//用户按Tab键切换焦点处理
{
	const int bodyNum = crunNum + ctrlNum;
	Pointer newFocus;
	int num;

	if(bodyNum == 0) return;	//没有物体

	if(focusBody.IsOnLead())	//当前焦点是导线
	{
		num = (focusBody.p1->num + 1) % leadNum;
		newFocus.SetOnLead(lead[num]);
	}
	else if(focusBody.IsOnCrun())	//当前焦点是结点
	{
		num = (focusBody.p2->num + 1) % crunNum;
		newFocus.SetOnCrun(crun[num], true);
	}
	else if(focusBody.IsOnCtrl())	//当前焦点是控件
	{
		num = (focusBody.p3->num + 1) % ctrlNum;
		newFocus.SetOnCtrl(ctrl[num], true);
	}
	else	//没有设定焦点
	{
		if(crunNum > 0)
			newFocus.SetOnCrun(crun[0], true);
		else
			newFocus.SetOnCtrl(ctrl[0], true);
	}

	FocusBodyPaint(&newFocus);
}

bool Manager::FocusBodyMove(int dir)
//用户按上下左右键移动焦点物体
{
	motiNum = 0;
	if(!focusBody.IsOnBody()) return false;

	POINT fromPos, toPos;

	//获得物体坐标
	if(focusBody.IsOnCrun()) fromPos = focusBody.p2->coord;
	else fromPos = focusBody.p3->coord;
	toPos = fromPos;

	//设置移动后的坐标
	switch(dir)
	{
	case VK_UP:		//向上移动焦点
		toPos.y -= moveBodySense;
		break;
	case VK_DOWN:	//向下移动焦点
		toPos.y += moveBodySense;
		break;
	case VK_LEFT:	//向左移动焦点
		toPos.x -= moveBodySense;
		break;
	case VK_RIGHT:	//向右移动焦点
		toPos.x += moveBodySense;
		break;
	default:
		return false;
	}

	//检查坐标是否越界
	if(toPos.x < -BODYSIZE.cx/2 || toPos.y < -BODYSIZE.cy/2) return false;

	//移动对象
	PosBodyMove(&focusBody, fromPos, toPos);
	return true;
}


//12设置函数-----------------------------------------------------------------------↓
void Manager::SetViewOrig(int xPos, int yPos)
//设置画图的初始坐标
{
	viewOrig.x = xPos * mouseWheelSense.cx;
	viewOrig.y = yPos * mouseWheelSense.cy;
	dc->SetViewportOrg(-viewOrig.x, -viewOrig.y);
}

void Manager::SetMoveBodySense()
//设置按方向键一次移动物体的距离
{
	LISTDATA list;
	char title[NAME_LEN*2];

	list.Init(1);
	list.SetAMember(DATA_STYLE_UINT, "方向键移动物体的距离", &moveBodySense, 1, MAXMOVEBODYDIS);

	sprintf(title, "灵敏度范围 : 1 ~ %d", MAXMOVEBODYDIS);
	MyPropertyDlg dlg(&list, false, NULL, title, wndPointer);
	dlg.DoModal();
}

void Manager::SetLeaveOutDis()
//设置最大导线合并距离
{
	LISTDATA list;
	char title[NAME_LEN*2];

	list.Init(1);
	list.SetAMember(DATA_STYLE_UINT, "导线相邻两节合并临界距离", &maxLeaveOutDis, 1, MAXLEAVEOUTDIS);

	sprintf(title, "临界距离范围 : 1 ~ %d", MAXLEAVEOUTDIS);
	MyPropertyDlg dlg(&list, false, NULL, title, wndPointer);
	dlg.DoModal();
}

void Manager::SetTextColor()
//设置字体颜色
{
	const enum COLOR preColor = textColor;
	LISTDATA list;
	list.Init(1);
	list.SetAEnumMember("标签颜色", &textColor, ENUM_COLOR);

	MyPropertyDlg dlg(&list, false, NULL, "设置标签颜色", wndPointer);
	dlg.DoModal();

	if(preColor != textColor)
	{
		dc->SetTextColor(LEADCOLOR[textColor]);
		PaintAll();
	}
}

void Manager::SetFocusLeadStyle()
//设置焦点导线样式
{
	const enum LEADSTYLE save = focusLeadStyle;
	LISTDATA list;
	list.Init(1);
	list.SetAEnumMember("选定导线样式", &focusLeadStyle, ENUM_LEADSTYLE);

	MyPropertyDlg dlg(&list, false, NULL, "设置选定导线样式", wndPointer);
	dlg.DoModal();

	if(save != focusLeadStyle && focusBody.IsOnLead())
		FocusBodyPaint(NULL);
}

void Manager::SetFocusCrunColor()
//设置焦点结点颜色
{
	const enum COLOR save = focusCrunColor;
	LISTDATA list;
	list.Init(1);
	list.SetAEnumMember("选定结点颜色", &focusCrunColor, ENUM_COLOR, RED, BLUE);

	MyPropertyDlg dlg(&list, false, NULL, "设置选定结点颜色", wndPointer);
	dlg.DoModal();

	if(save != focusCrunColor && focusBody.IsOnCrun())
		FocusBodyPaint(NULL);
}

void Manager::SetFocusCtrlColor()
//设置焦点控件颜色
{
	const enum COLOR save = focusCtrlColor;
	LISTDATA list;
	list.Init(1);
	list.SetAEnumMember("选定电学元件颜色", &focusCtrlColor, ENUM_COLOR, RED, BLUE);

	MyPropertyDlg dlg(&list, false, NULL, "设置选定电学元件颜色", wndPointer);
	dlg.DoModal();

	if(save != focusCtrlColor && focusBody.IsOnCtrl())
		FocusBodyPaint(NULL);
}


//13显示电势差函数-----------------------------------------------------------------↓
void Manager::ClearPressBody()
//清空显示电势差的成员变量
{
	pressStart.Clear();
	pressEnd.Clear();
	startEndPressure = 0;
}

bool Manager::SetStartBody(POINT pos)
//设置计算电势差的起始位置
{
	motiNum = 0;
	if(!MotivateAll(pos)) return false;	//没有点击物体
	motiNum = 0;

	if(motiBody[0].IsOnLead())
	{
		if(StaticClass::IsElecError(motiBody[0].p1->elecDir))
		{
			wndPointer->MessageBox("当前选择的电路不正常", "无法计算电势差", MB_ICONWARNING);
			return false;
		}
	}
	else if(motiBody[0].IsOnCrun() && !motiBody[0].IsOnConnectPos())
	{
		CRUN * c = motiBody[0].p2;
		for(int i=0; i<4; ++i) if(c->lead[i] && StaticClass::IsElecError(c->lead[i]->elecDir))
		{
			wndPointer->MessageBox("当前选择的电路不正常", "无法计算电势差", MB_ICONWARNING);
			return false;
		}
	}
	else 
	{
		return false;	//没有点击导线或者节点
	}

	pressStart = pressEnd = motiBody[0];
	startEndPressure = 0;

	PaintAll();
	return true;
}

bool Manager::NextBodyByInputNum(UINT nChar)
//用户输入数字1,2,3,4来移动电势差结尾位置
{
	if(!pressStart.IsOnAny() || !pressEnd.IsOnAny())
	{
		AfxMessageBox("请先鼠标点击导线或者连线选择电势差起始位置,\n然后输入数字移动电势差结尾位置.");
		return false;
	}

	int dir;
	switch(nChar)
	{
	case '#':
	case 'a':
		dir = 0; //小键盘'1'键
		break;

	case '(':
	case 'b':
		dir = 1; //小键盘'2'键
		break;

	case 34:
	case 'c':
		dir = 2; //小键盘'3'键
		break;

	case '%':
	case 'd':
		dir = 3; //小键盘'4'键
		break;

	default:
		if(nChar >= '1' && nChar <= '4')
			dir = nChar - '1';
		else
			return false;
	}

	if(pressEnd.IsOnLead())	//结尾位置在导线上
	{
		if(dir < 0 || dir > 1) return false;
		
		Pointer temp = pressEnd.p1->conBody[dir];
		temp.SetAtState(-1);

		if(temp.IsOnCrun())
		{
			pressEnd = temp;
		}
		else //if(temp.IsOnCtrl())
		{
			if(temp.p3->GetResist() < 0)	//断路控件
			{
				wndPointer->MessageBox("这是一个断路电学元件 !", "电流无法流过 !", MB_ICONINFORMATION);
				return false;
			}
			if(temp.p3->GetConnectNum() < 2)	//控件没有连接2段导线
			{
				wndPointer->MessageBox("电学元件另一端没有连接导线 !", "电流无法流过 !", MB_ICONINFORMATION);
				return false;
			}
			dir = temp.p3->lead[0] == pressEnd.p1;	//下一个导线索引(0或1)
			if(temp.p3->lead[dir] == pressEnd.p1) return false;	//电路是一个控件2端都连接同一段导线
			if(temp.p3->elecDir == dir)
				startEndPressure -= temp.p3->GetResist() * temp.p3->elec;
			else
				startEndPressure += temp.p3->GetResist() * temp.p3->elec;
			startEndPressure += temp.p3->GetPress(dir);
			pressEnd.SetOnLead(temp.p3->lead[dir]);
		}
	}
	else	//结尾位置在结点上
	{
		if(dir < 0 || dir > 3) return false;
		if(pressEnd.p2->lead[dir] != NULL)
		{
			pressEnd.SetOnLead(pressEnd.p2->lead[dir]);
		}
		else 
		{
			wndPointer->MessageBox("结点这一端没有连接导线 !", "电流无法流过 !", MB_ICONINFORMATION);
			return false;
		}
	}

	PaintAll();
	return true;
}

bool Manager::ShowPressure()
//显示从起始位置到结尾位置的电势差(U0-U1)
{
	if(!pressStart.IsOnAny() || !pressEnd.IsOnAny())
	{
		AfxMessageBox("请选择起始位置再查看电势差!\n起始位置可以用鼠标点击选择!");
		return false;
	}

	char note[] = "电势差";
	char name1[NAME_LEN*2], name2[NAME_LEN*2];
	GetName(pressStart, name1);
	GetName(pressEnd, name2);

	LISTDATA list;
	list.Init(3);

	if(StaticClass::IsZero(startEndPressure)) startEndPressure = 0;
	list.SetAMember(DATA_STYLE_double, note, (void *)(&startEndPressure));
	list.SetAMember(DATA_STYLE_LPCTSTR, "起始位置", name1);
	list.SetAMember(DATA_STYLE_LPCTSTR, "结束位置", name2);

	MyPropertyDlg dlg(&list, true, NULL, note, wndPointer);
	dlg.DoModal();

	return true;
}


//2撤销函数------------------------------------------------------------------------↓
void Manager::PutCircuitToVector()
//将当前电路信息保存到容器
{
	CircuitInfo ci;
	DeleteVector(vectorPos+1, circuitVector.end());

	ci.leadNum = this->leadNum;
	if(leadNum != 0)
	{
		ci.lead = new LEAD * [leadNum];
		memcpy(ci.lead, this->lead, leadNum*sizeof(void *));
	}

	ci.crunNum = this->crunNum;
	if(crunNum != 0)
	{
		ci.crun = new CRUN * [crunNum];
		memcpy(ci.crun, this->crun, crunNum*sizeof(void *));
	}

	ci.ctrlNum = this->ctrlNum;
	if(ctrlNum != 0)
	{
		ci.ctrl = new CTRL * [ctrlNum];
		memcpy(ci.ctrl, this->ctrl, ctrlNum*sizeof(void *));
	}

	ci.focusBody = this->focusBody;

	circuitVector.push_back(ci);
	if(circuitVector.size() > 200)
		DeleteVector(circuitVector.begin(), circuitVector.begin()+50);
	vectorPos = circuitVector.end() - 1;
	UpdateUnReMenuState();
}

void Manager::ReadCircuitFromVector(MyIterator it)
//从容器读取电路信息
{
	ClearCircuitState();	//清除电路状态信息

	this->leadNum = it->leadNum;
	memcpy(this->lead, it->lead, leadNum*sizeof(void *));

	this->crunNum = it->crunNum;
	memcpy(this->crun, it->crun, crunNum*sizeof(void *));

	this->ctrlNum = it->ctrlNum;
	memcpy(this->ctrl, it->ctrl, ctrlNum*sizeof(void *));

	this->FocusBodySet(it->focusBody);

	vectorPos = it;
	UpdateUnReMenuState();
	PaintAll();
}

void Manager::DeleteVector(MyIterator first, MyIterator last)
//删除连续的一段容器内容
{
	MyIterator it;
	int i;
	if(first >= circuitVector.end() || first >= last) return;

	for(it=last-1; it>=first; --it)
	{
		for(i = it->leadNum-1; i>=0; --i)
			delete it->lead[i];
		if(it->leadNum != 0)
			delete [] it->lead;

		for(i = it->crunNum-1; i>=0; --i)
			delete it->crun[i];
		if(it->crunNum != 0)
			delete [] it->crun;

		for(i = it->ctrlNum-1; i>=0; --i)
			delete it->ctrl[i];
		if(it->ctrlNum != 0)
			delete [] it->ctrl;

		circuitVector.erase(it);
	}

	vectorPos = circuitVector.end() - 1;
}

void Manager::CloneCircuitBeforeChange()
//复制当前电路到容器
{
	int i, j;
	MyIterator it = vectorPos;
	DeleteVector(it+1, circuitVector.end());

	//复制物体
	for(i=leadNum-1; i>=0; --i)
		it->lead[i] = this->lead[i]->Clone(CLONE_FOR_SAVE);

	for(i=crunNum-1; i>=0; --i)
		it->crun[i] = this->crun[i]->Clone(CLONE_FOR_SAVE);

	for(i=ctrlNum-1; i>=0; --i)
		it->ctrl[i] = this->ctrl[i]->Clone(CLONE_FOR_SAVE);

	//复制指针
	for(i=leadNum-1; i>=0; --i)
	{
		for(j=0; j<2; ++j)
		{
			if(this->lead[i]->conBody[j].IsOnCrun())
			{
				it->lead[i]->conBody[j].SetOnCrun(it->crun[ this->lead[i]->conBody[j].p2->num ]);
			}
			else if(this->lead[i]->conBody[j].IsOnCtrl())
			{
				it->lead[i]->conBody[j].SetOnCtrl(it->ctrl[ this->lead[i]->conBody[j].p3->num ]);
			}
			else
			{
				it->lead[i]->conBody[j].Clear();
			}
			it->lead[i]->conBody[j].SetAtState(this->lead[i]->conBody[j].GetAtState());
		}
	}

	for(i=crunNum-1; i>=0; --i)
	{
		for(j=0; j<4; ++j)
		{
			if(this->crun[i]->lead[j] != NULL)
				it->crun[i]->lead[j] = it->lead[this->crun[i]->lead[j]->num];
			else
				it->crun[i]->lead[j] = NULL;
		}
	}

	for(i=ctrlNum-1; i>=0; --i)
	{
		for(j=0; j<2; ++j)
		{
			if(this->ctrl[i]->lead[j] != NULL)
				it->ctrl[i]->lead[j] = it->lead[this->ctrl[i]->lead[j]->num];
			else
				it->ctrl[i]->lead[j] = NULL;
		}
	}

	//复制焦点
	if(this->focusBody.IsOnLead())
	{
		it->focusBody.SetOnLead(it->lead[this->focusBody.p1->num]);
		it->focusBody.SetAtState(this->focusBody.GetAtState());
	}
	else if(this->focusBody.IsOnCrun())
	{
		it->focusBody.SetOnCrun(it->crun[this->focusBody.p2->num]);
	}
	else if(this->focusBody.IsOnCtrl())
	{
		it->focusBody.SetOnCtrl(it->ctrl[this->focusBody.p3->num]);
	}
	else
	{
		it->focusBody.Clear();
	}

	vectorPos = circuitVector.end() - 1;
}

void Manager::UpdateUnReMenuState()
//更新撤销和重复菜单状态
{
	CMenu * cm = wndPointer->GetMenu();
	if(vectorPos > circuitVector.begin())
		cm->EnableMenuItem(IDM_UNDO, MF_ENABLED);
	else
		cm->EnableMenuItem(IDM_UNDO, MF_GRAYED);
	if(vectorPos < circuitVector.end()-1)
		cm->EnableMenuItem(IDM_REDO, MF_ENABLED);
	else
		cm->EnableMenuItem(IDM_REDO, MF_GRAYED);
}

void Manager::UnDo()
//撤销
{
	if(vectorPos <= circuitVector.begin())
	{
		MessageBeep(0);
		return;
	}
	ReadCircuitFromVector(--vectorPos);
}

void Manager::ReDo()
//重复
{
	if(vectorPos >= circuitVector.end()-1)
	{
		MessageBeep(0);
		return;
	}
	ReadCircuitFromVector(++vectorPos);
}


//9测试函数------------------------------------------------------------------------↓
void Manager::SaveCircuitInfoToTextFile()
//保存电路信息到文本文件,测试函数
{
	int i;
	FILE * fp = fopen("D:\\data.txt", "w");
	if(fp == NULL) return;

	fprintf(fp, "cruns:[\n");
	for(i=0; i<crunNum; i++)
	{
		fprintf(fp, "{id:%d,x:%d,y:%d,", crun[i]->GetInitOrder(), crun[i]->coord.x, crun[i]->coord.y);
		fprintf(fp, "name:\"%s\",lead:[", crun[i]->name);
		for(int j=0; j<4; j++)
		{
			if(crun[i]->lead[j]) fprintf(fp, "%d", crun[i]->lead[j]->GetInitOrder());
			else fprintf(fp, "null");
			if (j!=4-1) fprintf(fp, ",");
		}
		fprintf(fp, "]}\n");

		if (i != crunNum-1) fprintf(fp, ",");
	}
	fprintf(fp, "],\n");

	fprintf(fp, "leads:[\n");
	for(i=0; i<leadNum; ++i)
	{
		fprintf(fp, "{id:%d,", (int)lead[i]->GetInitOrder());
		lead[i]->SaveToTextFile(fp);
		fprintf(fp, "color:%d,", (int)lead[i]->color);
		fprintf(fp, "conBody[");	lead[i]->conBody[0].SaveToTextFile(fp);
		fprintf(fp, ",");	lead[i]->conBody[1].SaveToTextFile(fp);
		fprintf(fp, "]}\n");

		if (i != leadNum-1) fprintf(fp, ",");
	}
	fprintf(fp, "],\n");

	fprintf(fp, "ctrls:[\n", ctrlNum);
	const char * ctrlStyleStr[] = {"source","resistance","bulb","capa","switch"}; 
	for(i=0; i<ctrlNum; ++i)
	{
		fprintf(fp, "{id:%d,x:%d,y:%d,", ctrl[i]->GetInitOrder(), ctrl[i]->coord.x, ctrl[i]->coord.y);
		fprintf(fp, "name:\"%s\",lead:[", ctrl[i]->name);
		if(ctrl[i]->lead[0])fprintf(fp, "%d,", ctrl[i]->lead[0]->GetInitOrder());
		else fputs("-1,", fp);
		if(ctrl[i]->lead[1])fprintf(fp, "%d],", ctrl[i]->lead[1]->GetInitOrder());
		else fputs("-1],", fp);

		ctrl[i]->SaveToTextFile(fp);

		fprintf(fp, "style:\"%s\"}", ctrlStyleStr[ctrl[i]->GetStyle()]);
		
		if (i != leadNum-1) fprintf(fp, ",");
	}
	fprintf(fp, "]\n}\n");

	fclose(fp);
}

void Manager::SaveCountInfoToTextFile()
//保存计算过程到文本文件,测试函数
{
	FILE * fp = fopen("D:\\Circuit.txt", "w");
	int i, j, group, ijPos, tempDir;

	if(fp == NULL) return;

	CollectCircuitInfo();

	for(i=0; i<crunNum; ++i)
	{
		fprintf(fp, "crun[%d]:\n", i);
		fprintf(fp, "\tgroup = %d\n", crun2[i].group);
		//fprintf(fp, "\tgroup = %f\n", crun2[i].potential);
		for(j=0;j<4;j++)
		{
			if(crun2[i].c[j])fprintf(fp, "\tcircuit[%d] = %d\n", j, crun2[i].c[j]->eleNum);
			else fprintf(fp, "\tcircuit[%d] = NULL\n", j);
		}
	}

	fputc('\n', fp);

	for(i=0; i<circuNum; ++i)
	{
		fprintf(fp, "circu[%d]:\n", i);
		fprintf(fp, "\tnum in group = %d\n", circu[i].numInGroup);
		fprintf(fp, "\tfromcrun = %d\n", circu[i].from-crun2);
		fprintf(fp, "\tfromdir = %d\n", circu[i].dirFrom);
		fprintf(fp, "\ttocrun = %d\n", circu[i].to-crun2);
		fprintf(fp, "\ttodir = %d\n", circu[i].dirTo);
		//fprintf(fp, "\telectic = %f\n", circu[i].elec);
		fprintf(fp, "\tpressure = %f\n", circu[i].pressure);
		fprintf(fp, "\tresistance = %f\n", circu[i].resistance);
	}

	fclose(fp);

	//////////////////////
	CreateEquation();
	CRUNMAP * maps = this->maps;
	fp = fopen("D:\\Map.txt", "w");
	if(fp == NULL) return;

	for(group=0; group<groupNum; ++group) for(i=maps[group].size-2; i>=0; --i) for(j=maps[group].size-1; j>i; --j)
	{
		ijPos = CONVERT(i, j, maps[group].size);
		tempDir = maps[group].direct[ijPos];
	
		fprintf(fp, "%d Direct Connections ", tempDir);

		fprintf(fp, " between %3d and %3d \n", maps[group].crunTOorder[i], maps[group].crunTOorder[j]);
	}

	delete [] crun2;
	delete [] circu;
	circu = NULL;
	circuNum = 0;
	fclose(fp);

	fp = fopen("D:\\Equation.txt", "w");
	if(fp == NULL) return;
	for(group=0; group<groupNum; ++group)
	{
		fprintf(fp, "\ngroup[%d]------------\n", group);
		//equation[group]->Simple_Equation();
		equation[group]->OutputToFile(fp);
	}
	fclose(fp);

	for(group=0; group<groupNum; ++group)
	{
		maps[group].Uninit();
		delete equation[group];
	}
	delete [] maps;
	delete [] equation;
}
