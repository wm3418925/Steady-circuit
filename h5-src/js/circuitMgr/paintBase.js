
//3��ͼ����------------------------------------------------------------------------��
void Manager::PaintCtrl(CTRL * c, bool isPaintName)
//���ؼ�
{
	ASSERT(c != NULL);
	if(isPaintName) PaintCtrlText(c);	//���ؼ�����
	dc->BitBlt(c->coord.x, c->coord.y, BODYSIZE.cx, BODYSIZE.cy, GetCtrlPaintHandle(c), 0, 0, SRCAND);
}

void Manager::PaintCtrlText(const CTRL * c)const 
//���ؼ�������
{
	ASSERT(c != NULL);
	if(!c->isPaintName) return;
	dc->TextOut(c->coord.x, c->coord.y-15, c->name, strlen(c->name));
}

void Manager::PaintCrun(const CRUN * c, bool isPaintName)
//�����
{
	ASSERT(c != NULL);
	if(isPaintName) PaintCrunText(c);	//���������
	dc->BitBlt(c->coord.x-DD, c->coord.y-DD, DD*2, DD*2, &crunDcMem, 0, 0, SRCAND);
}

void Manager::PaintCrunText(const CRUN * c)const 
//���������
{
	ASSERT(c != NULL);
	if(!c->isPaintName) return;
	dc->TextOut(c->coord.x, c->coord.y-20, c->name, strlen(c->name));
}

void Manager::PaintLead(LEAD * l)
//������
{
	ASSERT(l != NULL);
	dc->SelectObject(hp + l->color);
	l->PaintLead(dc);
}

void Manager::PaintAllLead()
//�����е���; Ϊ����߻����ߵ�Ч��,��ͬ��ɫһ��
{
	int num, color;
	for(color=COLOR_TYPE_NUM-1; color>=0; --color)	//����ɫѭ��
	{
		dc->SelectObject(hp + color);
		for(num=leadNum-1; num>=0; --num)
			if(color == lead[num]->color) lead[num]->PaintLead(dc);
	}
	dc->SelectObject(hp);	//�ָ�����ɫ�Ļ���
}

void Manager::PaintAll()
//�����е�����
{
	int i;
	CDC * save = dc;
	RECT rect;
	BITMAP bitmap;

	//1,�������״̬��Ϣ----------------------------------------------------
	motiNum = 0;
	addState = BODY_NO;
	lastMoveOnPos.x = -100;
	lastMoveOnBody.Clear();

	//2,��ͼ��ʼ��----------------------------------------------------------
	//��ô��ڳߴ�
	wndPointer->GetClientRect(&rect);

	//��ʼ��ˢ��λͼ��С
	bitmapForRefresh.GetBitmap(&bitmap);
	if(rect.bottom > bitmap.bmHeight || rect.right > bitmap.bmWidth)
	{
		bitmapForRefresh.DeleteObject();
		bitmapForRefresh.CreateBitmap(rect.right, rect.bottom, 1, 32, NULL);
		dcForRefresh.SelectObject(&bitmapForRefresh);
	}

	//��dcForRefresh��ͼ
	dc->DPtoLP(&rect);			//��ǰrect���豸����任Ϊ�߼�����
	dc = &dcForRefresh;			//dc��ʱ�滻ΪdcForRefresh,���ڴ滭ͼ

	//����������ɫ���ӽ����
	dc->SetTextColor(LEADCOLOR[textColor]);
	dc->SetViewportOrg(-viewOrig.x, -viewOrig.y);	//��ʼ���ӽ���ʼ����

	//3,�ڴ滭ͼ------------------------------------------------------------
	//�ð�ɫ���θ��������ͻ���
	dc->SelectStockObject(WHITE_PEN);
	dc->SelectStockObject(WHITE_BRUSH);
	dc->Rectangle(&rect);

	//���ؼ�����Լ����ǵ�����
	for(i=ctrlNum-1; i>=0; --i)
		PaintCtrl(ctrl[i], true);
	for(i=crunNum-1; i>=0; --i)
		PaintCrun(crun[i], true);

	//������
	PaintAllLead();

	//������
	FocusBodyPaint(NULL);

	//�ػ���ʾ���Ʋ������
	PaintWithSpecialColor(pressStart, false);
	PaintWithSpecialColor(pressEnd, true);

	//4,��ԭdc, һ���Ի�ͼ--------------------------------------------------
	dc = save;
	dc->BitBlt(0, 0, rect.right, rect.bottom, &dcForRefresh, 0, 0, SRCCOPY);
}

void Manager::PaintMouseMotivate(const Pointer &mouseMoti)
//����������ӵ㲿λ,�ı������״
{
	const Pointer * mouse = &mouseMoti;
	POINT tempPos;
	const int CR = 3; //���ӵ㻭ͼ�뾶

	if(mouse->IsOnLead())
	{
		if(motiNum && motiBody[motiNum-1].IsOnConnectPos())
		{//ѡ�������ӵ�,��������ӽ��ͼ��,��ʾʹ��ConnectBodyLead����
			SetCursor(hcShowConnect);
		}
		else
		{//û��ѡ�����ӵ�,�����"ָ��",��ʾ�ı䵼������
			if(mouse->IsOnHoriLead())SetCursor(hcSizeNS);	//�ں���,�����"����ָ��"
			else SetCursor(hcSizeWE);						//������,�����"����ָ��"
		}
	}
	else if(mouse->IsOnBody())	//��������,������ֵ���״,��ʾ�ƶ�����
	{
		SetCursor(hcHand);
	}

	if(!lastMoveOnBody.IsAllSame(mouse))	//lastMoveOnBody��mouseָ���Pointer�ṹ�岻һ��
	{
		if(lastMoveOnBody.IsOnConnectPos())	//��ԭ��һ�����ӵ�
		{
			lastMoveOnBody.GetPosFromBody(tempPos);	//�������
			dc->BitBlt(tempPos.x-CR, tempPos.y-CR, CR*2, CR*2,
				&showConnectDcMem, 0, 0, SRCINVERT);
		}

		lastMoveOnBody = *mouse;	//��¼��ǰ��꼤������

		if(mouse->IsOnConnectPos())	//����ǰ�����ӵ�
		{
			mouse->GetPosFromBody(tempPos);	//�������
			dc->BitBlt(tempPos.x-CR, tempPos.y-CR, CR*2, CR*2,
				&showConnectDcMem, 0, 0, SRCINVERT);
		}
	}
}

void Manager::PaintLeadWithStyle(LEAD * lead, int leadStyle, enum COLOR colorNum)
//��ָ����ɫ�����ߵ���
{
	ASSERT(lead != NULL);
	CPen tempPen;

	tempPen.CreatePen(leadStyle, 1, LEADCOLOR[colorNum]);	//�½����⻭��
	dc->SelectObject(tempPen.m_hObject);					//ѡ�񻭱�
	lead->PaintLead(dc);									//������
	tempPen.DeleteObject();									//�ͷŻ���
	dc->SelectObject(hp);									//�ָ�����
}

void Manager::PaintCrunWithColor(CRUN * c, enum COLOR colorNum)
//��ָ����ɫ��ָ�����
{
	ASSERT(c != NULL);
	CBrush hb;

	//1,��ָ����ɫ���� -------------------------------------------------------------
	//����ָ����ɫ��ˢ
	hb.CreateSolidBrush(LEADCOLOR[colorNum]);
	dc->SelectObject(&hb);
	//���ÿջ���
	dc->SelectStockObject(NULL_PEN);
	//��ָ����ɫԲ��
	dc->Rectangle(c->coord.x-DD, c->coord.y-DD, c->coord.x+DD+1, c->coord.y+DD+1);

	//2,�ͷŻ�ˢ,��ԭ��ˢ ----------------------------------------------------------
	hb.DeleteObject();
	dc->SelectStockObject(NULL_BRUSH);

	//3,����ɫ���,ʹ�� "��" ���߼���ͼ,�õ�ָ����ɫ��� ---------------------------
	dc->BitBlt(c->coord.x-DD, c->coord.y-DD, DD*2, DD*2, &crunDcMem, 0, 0, SRCPAINT);
}

void Manager::PaintCtrlWithColor(CTRL * c, enum COLOR colorNum)
//��ָ����ɫ��ָ���ؼ�
{
	ASSERT(c != NULL);
	CBrush hb;

	//1,��ָ����ɫ���� -------------------------------------------------------------
	//����ָ����ɫ��ˢ
	hb.CreateSolidBrush(LEADCOLOR[colorNum]);
	dc->SelectObject(&hb);
	//���ÿջ���
	dc->SelectStockObject(NULL_PEN);
	//��ָ����ɫ����
	dc->Rectangle(c->coord.x, c->coord.y, c->coord.x+BODYSIZE.cx+1, c->coord.y+BODYSIZE.cy+1);

	//2,�ͷŻ�ˢ,��ԭ��ˢ ----------------------------------------------------------
	hb.DeleteObject();
	dc->SelectStockObject(NULL_BRUSH);

	//3,����ɫ�ؼ�,ʹ�� "��" ���߼���ͼ,�õ�ָ����ɫ�ؼ�
	dc->BitBlt(c->coord.x, c->coord.y, BODYSIZE.cx, BODYSIZE.cy, GetCtrlPaintHandle(c), 0, 0, SRCPAINT);

	//4,���»������ǵ���Χ���� -----------------------------------------------------
	for(int num=0; num<2; ++num) if(c->lead[num] != NULL)
		PaintLead(c->lead[num]);
}

void Manager::PaintWithSpecialColor(const Pointer &body, bool isPaintNum)
//�ñ�����ɫ(��ɫ)��ʾ
{
	const COLOR colorNum = (enum COLOR)COLOR_TYPE_NUM;	//ѡ�ñ�����ɫ(��ɫ)

	if(body.IsOnLead())
	{
		if(isPaintNum)
		{
			//������
			PaintLeadWithStyle(body.p1, PS_SOLID, colorNum);

			//�ڵ�����ʼ�ͽ�β���ֱ���ʾ����'1'��'2'
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
			PaintLeadWithStyle(body.p1, PS_DOT, colorNum);	//������
		}
	}
	else if(body.IsOnCrun())
	{
		PaintCrunWithColor(body.p2, colorNum);	//�����
		if(isPaintNum)							//�ڽ���������ҷֱ���ʾ1,2,3,4
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
		PaintCtrlWithColor(body.p3, colorNum);	//���ؼ�
	}
}

void Manager::PaintInvertBodyAtPos(const Pointer &body, POINT pos)
//��ָ��λ����ʾ����ķ���
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