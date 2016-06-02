
//12设置函数-----------------------------------------------------------------------↓
void Manager::SetViewOrig(int xPos, int yPos)
//设置画图的初始坐标
{
	viewOrig.x = xPos * mouseWheelSense.cx;
	viewOrig.y = yPos * mouseWheelSense.cy;
	ctx->SetViewportOrg(-viewOrig.x, -viewOrig.y);
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
		ctx->SetTextColor(LEADCOLOR[textColor]);
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
