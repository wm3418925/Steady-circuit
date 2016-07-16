
//设置按方向键一次移动物体的距离
Manager.SetMoveBodySense = function() {
	var list = new LISTDATA();
	list.SetDataParent(Manager);
	list.SetAMember(DATA_TYPE_uint, "方向键移动物体的距离", "moveBodySense", 1, MAX_MOVE_BODY_DIS);

	var title = "灵敏度范围 : 1 ~ " + MAX_MOVE_BODY_DIS;
	var dlg = MyPropertyDlg.Init(list, false, null, title, Manager.canvas);
	dlg.DoModal();
};

//设置最大导线合并距离
Manager.SetLeaveOutDis = function() {
	var list = new LISTDATA();
	list.SetDataParent(Manager);
	list.SetAMember(DATA_TYPE_uint, "导线相邻两节合并临界距离", "maxLeaveOutDis", 1, MAX_LEAVE_OUT_DIS);

	var title = "临界距离范围 : 1 ~ " + MAX_LEAVE_OUT_DIS;
	var dlg = MyPropertyDlg.Init(list, false, null, title, Manager.canvas);
	dlg.DoModal();
};

//设置字体颜色
Manager.SetTextColor = function() {
	Manager.tmpTextPreColor = Manager.textColor;
	
	var list = new LISTDATA();
	list.SetDataParent(Manager);
	list.SetAMember(DATA_TYPE_color, "标签颜色", "textColor");
	
	//改变回调
	var changedCallback = function() {
		if (Manager.tmpTextPreColor != Manager.textColor) {
			//Manager.ctx.strokeStyle = PaintCommonFunc.HexToRGBStr(Manager.textColor);
			Manager.PaintAll();
		}
	};
	
	var dlg = MyPropertyDlg.Init(list, false, null, "设置标签颜色", Manager.canvas, changedCallback, null);
	dlg.DoModal();
};

//设置焦点导线样式
Manager.SetFocusLeadStyle = function() {
	Manager.tmpFocusLeadPreStyle = Manager.focusLeadStyle;
	
	var list = new LISTDATA();
	list.SetDataParent(Manager);
	list.SetAEnumMember(LEAD_STYLE_ENUM, "焦点导线样式", "focusLeadStyle");
	
	//改变回调
	var changedCallback = function() {
		if (Manager.tmpFocusLeadPreStyle != Manager.focusLeadStyle && Manager.focusBody.IsOnLead())
			Manager.FocusBodyPaint(null);
	};
	
	var dlg = MyPropertyDlg.Init(list, false, null, "设置焦点导线样式", Manager.canvas, changedCallback, null);
	dlg.DoModal();
};

//设置焦点结点颜色
Manager.SetFocusCrunColor = function() {
	Manager.tmpFocusCrunPreColor = Manager.focusCrunColor;
	
	var list = new LISTDATA();
	list.SetDataParent(Manager);
	list.SetAMember(DATA_TYPE_color, "焦点结点颜色", "focusCrunColor");

	//改变回调
	var changedCallback = function() {
		if (Manager.tmpFocusCrunPreColor != Manager.focusCrunColor && Manager.focusBody.IsOnCrun())
			Manager.FocusBodyPaint(null);
	};
	
	var dlg = MyPropertyDlg.Init(list, false, null, "设置焦点结点颜色", Manager.canvas, changedCallback, null);
	dlg.DoModal();
};

//设置焦点控件颜色
Manager.SetFocusCtrlColor = function() {
	Manager.tmpFocusCtrlPreColor = Manager.focusCtrlColor;
	
	var list = new LISTDATA();
	list.SetDataParent(Manager);
	list.SetAMember(DATA_TYPE_color, "焦点电学元件颜色", "focusCtrlColor");

	//改变回调
	var changedCallback = function() {
		if (Manager.tmpFocusCtrlPreColor != Manager.focusCtrlColor && Manager.focusBody.IsOnCtrl())
			Manager.FocusBodyPaint(null);
	};
	
	var dlg = MyPropertyDlg.Init(list, false, null, "设置焦点电学元件颜色", Manager.canvas, changedCallback, null);
	dlg.DoModal();
};
