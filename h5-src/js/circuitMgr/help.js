
//在用户区pos位置按F1,寻求帮助
Manager.Help = function(pos) {
	var note;

	Manager.motiCount = 0;
	Manager.MotivateAll(pos);
	Manager.motiCount = 0;

	if (!Manager.motiBody[0].IsOnAny()) {
		swal("鼠标没有移动到物体上", "提示信息", "warning");
		return;
	}

	if (Manager.motiBody[0].IsOnConnectPos()) {
		note = "这是物体连接点部分,可以连接其他物体";
	} else if (Manager.motiBody[0].IsBodySame(Manager.focusBody)) {
		note = "这是选定物体,显示不同于其他物体\n对它操作可以使用快捷键";
	} else if (Manager.motiBody[0].IsOnLead()) {
		note = "导线,可以连接2个物体";
	} else if (Manager.motiBody[0].IsOnCrun()) {
		note = "结点,可以连接4段导线";
	} else { //if (Manager.motiBody[0].IsOnCtrl())
		note = "电学元件—" + CTRL_STYLE_NAME[Manager.motiBody[0].p.style] + "\n可以旋转它 或者 改为其他类型的电学元件";
	}

	Manager.PaintWithSpecialColorAndRect(Manager.motiBody[0], false);
	swal(note);
	Manager.PaintAll();
};
