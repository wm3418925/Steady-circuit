
//12设置函数-----------------------------------------------------------------------

void Manager.SetMoveBodySense()
//设置按方向键一次移动物体的距离
{
	LISTDATA list;
	char title[NAME_LEN*2];

	list.Init(1);
	list.SetAMember(DATA_STYLE_UINT, "方向键移动物体的距离", &moveBodySense, 1, MAX_MOVE_BODY_DIS);

	sprintf(title, "灵敏度范围 : 1 ~ %d", MAX_MOVE_BODY_DIS);
	MyPropertyDlg dlg(&list, false, null, title, Manager.canvas);
	dlg.DoModal();
}

void Manager.SetLeaveOutDis()
//设置最大导线合并距离
{
	LISTDATA list;
	char title[NAME_LEN*2];

	list.Init(1);
	list.SetAMember(DATA_STYLE_UINT, "导线相邻两节合并临界距离", &Manager.maxLeaveOutDis, 1, MAX_LEAVE_OUT_DIS);

	sprintf(title, "临界距离范围 : 1 ~ %d", MAX_LEAVE_OUT_DIS);
	MyPropertyDlg dlg(&list, false, null, title, Manager.canvas);
	dlg.DoModal();
}

void Manager.SetTextColor()
//设置字体颜色
{
	const enum COLOR preColor = textColor;
	LISTDATA list;
	list.Init(1);
	list.SetAEnumMember("标签颜色", &textColor, ENUM_COLOR);

	MyPropertyDlg dlg(&list, false, null, "设置标签颜色", Manager.canvas);
	dlg.DoModal();

	if (preColor != textColor)
	{
		Manager.ctx.SetTextColor(LEADCOLOR[textColor]);
		PaintAll();
	}
}

void Manager.SetFocusLeadStyle()
//设置焦点导线样式
{
	const enum LEADSTYLE save = focusLeadStyle;
	LISTDATA list;
	list.Init(1);
	list.SetAEnumMember("选定导线样式", &focusLeadStyle, ENUM_LEADSTYLE);

	MyPropertyDlg dlg(&list, false, null, "设置选定导线样式", Manager.canvas);
	dlg.DoModal();

	if (save != focusLeadStyle && Manager.focusBody.IsOnLead())
		FocusBodyPaint(null);
}

void Manager.SetFocusCrunColor()
//设置焦点结点颜色
{
	const enum COLOR save = focusCrunColor;
	LISTDATA list;
	list.Init(1);
	list.SetAEnumMember("选定结点颜色", &focusCrunColor, ENUM_COLOR, RED, BLUE);

	MyPropertyDlg dlg(&list, false, null, "设置选定结点颜色", Manager.canvas);
	dlg.DoModal();

	if (save != focusCrunColor && Manager.focusBody.IsOnCrun())
		FocusBodyPaint(null);
}

void Manager.SetFocusCtrlColor()
//设置焦点控件颜色
{
	const enum COLOR save = focusCtrlColor;
	LISTDATA list;
	list.Init(1);
	list.SetAEnumMember("选定电学元件颜色", &focusCtrlColor, ENUM_COLOR, RED, BLUE);

	MyPropertyDlg dlg(&list, false, null, "设置选定电学元件颜色", Manager.canvas);
	dlg.DoModal();

	if (save != focusCtrlColor && Manager.focusBody.IsOnCtrl())
		FocusBodyPaint(null);
}
