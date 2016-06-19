
//设置按方向键一次移动物体的距离
Manager.SetMoveBodySense = function() {
	var list = LISTDATA.CreateNew();
	list.SetDataParent(Manager);
	list.SetAMember(DATA_TYPE_uint, "方向键移动物体的距离", "moveBodySense", 1, MAX_MOVE_BODY_DIS);

	var title = "灵敏度范围 : 1 ~ " + MAX_MOVE_BODY_DIS;
	var dlg = MyPropertyDlg.CreateNew(list, false, null, title, Manager.canvas);
	dlg.DoModal();
};

//设置最大导线合并距离
Manager.SetLeaveOutDis = function() {
	var list = LISTDATA.CreateNew();
	list.SetDataParent(Manager);
	list.SetAMember(DATA_TYPE_uint, "导线相邻两节合并临界距离", "maxLeaveOutDis", 1, MAX_LEAVE_OUT_DIS);

	var title = "临界距离范围 : 1 ~ " + MAX_LEAVE_OUT_DIS;
	var dlg = MyPropertyDlg.CreateNew(list, false, null, title, Manager.canvas);
	dlg.DoModal();
};

//设置字体颜色
Manager.SetTextColor = function() {
	var preColor = Manager.textColor;
	
	var list = LISTDATA.CreateNew();
	list.SetDataParent(Manager);
	list.SetAMember(DATA_TYPE_color, "标签颜色", "textColor");

	var dlg = MyPropertyDlg.CreateNew(list, false, null, "设置标签颜色", Manager.canvas);
	dlg.DoModal();

	if (preColor != Manager.textColor) {
		Manager.ctx.SetTextColor(LEADCOLOR[textColor]);
		Manager.PaintAll();
	}
};

//设置焦点导线样式
Manager.SetFocusLeadStyle = function() {
	var save = Manager.focusLeadStyle;
	
	var list = LISTDATA.CreateNew();
	list.SetDataParent(Manager);
	list.SetAEnumMember("选定导线样式", "focusLeadStyle", LEAD_STYLE_ENUM);

	var dlg = MyPropertyDlg.CreateNew(list, false, null, "设置选定导线样式", Manager.canvas);
	dlg.DoModal();

	if (save != Manager.focusLeadStyle && Manager.focusBody.IsOnLead())
		Manager.FocusBodyPaint(null);
};

//设置焦点结点颜色
Manager.SetFocusCrunColor = function() {
	var save = Manager.focusCrunColor;
	
	var list = LISTDATA.CreateNew();
	list.SetDataParent(Manager);
	list.SetAMember(DATA_TYPE_color, "选定结点颜色", "focusCrunColor");

	var dlg = MyPropertyDlg.CreateNew(list, false, null, "设置选定结点颜色", Manager.canvas);
	dlg.DoModal();

	if (save != Manager.focusCrunColor && Manager.focusBody.IsOnCrun())
		Manager.FocusBodyPaint(null);
};

//设置焦点控件颜色
Manager.SetFocusCtrlColor = function() {
	var save = Manager.focusCtrlColor;
	
	var list = LISTDATA.CreateNew();
	list.SetDataParent(Manager);
	list.SetAMember(DATA_TYPE_color, "选定电学元件颜色", "focusCtrlColor");

	var dlg = MyPropertyDlg.CreateNew(list, false, null, "设置选定电学元件颜色", Manager.canvas);
	dlg.DoModal();

	if (save != Manager.focusCtrlColor && Manager.focusBody.IsOnCtrl())
		Manager.FocusBodyPaint(null);
};
