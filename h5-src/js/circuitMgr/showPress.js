
//清空显示电势差的成员变量
Manager.ClearPressBody = function() {
	Manager.pressStartBody.Clear();
	Manager.pressEndBody.Clear();
	startEndPressure = 0;
};

//设置计算电势差的起始位置
Manager.SetStartBody = function(pos) {
	var clonePos = {x:pos.x, y:pos.y};
	
	Manager.motiCount = 0;
	if (!Manager.MotivateAll(clonePos)) return false;	//没有点击物体
	Manager.motiCount = 0;
	var mb = Manager.motiBody[0];

	if (mb.IsOnLead()) {
		if (IsElecError(mb.p.elecDir)) {
			Manager.canvas.MessageBox("当前选择的电路不正常", "无法计算电势差", MB_ICONWARNING);
			return false;
		}
	} else if (mb.IsOnCrun() && !mb.IsOnConnectPos()) {
		var c = mb.p;
		for (var i=0; i<4; ++i) if (c.lead[i] && IsElecError(c.lead[i].elecDir)) {
			Manager.canvas.MessageBox("当前选择的电路不正常", "无法计算电势差", MB_ICONWARNING);
			return false;
		}
	} else {
		return false;	//没有点击导线或者节点
	}

	Manager.pressStartBody = MyDeepCopy(mb);
	Manager.pressEndBody = MyDeepCopy(mb);
	Manager.startEndPressure = 0;

	Manager.PaintAll();
	return true;
};

//用户输入数字1,2,3,4来移动电势差结尾位置
Manager.NextBodyByInputNum = function(nChar) {
	if (!Manager.pressStartBody.IsOnAny() || !Manager.pressEndBody.IsOnAny()) {
		alert("请先鼠标点击导线或者连线选择电势差起始位置,\n然后输入数字移动电势差结尾位置.");
		return false;
	}

	var dir;
	switch (nChar) {
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
		if (nChar >= '1' && nChar <= '4')
			dir = nChar - '1';
		else
			return false;
	}

	if (Manager.pressEndBody.IsOnLead()) {	//结尾位置在导线上
		if (dir < 0 || dir > 1) return false;
		
		var temp = MyDeepCopy(Manager.pressEndBody.p.conBody[dir]);
		temp.SetAtState(-1);

		if (temp.IsOnCrun()) {
			Manager.pressEndBody = MyDeepCopy(temp);
		} else { //if (temp.IsOnCtrl())
			if (temp.p.resist < 0) {	//断路控件
				Manager.canvas.MessageBox("这是一个断路电学元件 !", "电流无法流过 !", MB_ICONINFORMATION);
				return false;
			}
			if (temp.p.GetConnectNum() < 2) {	//控件没有连接2段导线
				Manager.canvas.MessageBox("电学元件另一端没有连接导线 !", "电流无法流过 !", MB_ICONINFORMATION);
				return false;
			}
			dir = temp.p.lead[0] == Manager.pressEndBody.p;	//下一个导线索引(0或1)
			if (temp.p.lead[dir] == Manager.pressEndBody.p) return false;	//电路是一个控件2端都连接同一段导线
			if (temp.p.elecDir == dir)
				Manager.startEndPressure -= temp.p.resist * temp.p.elec;
			else
				Manager.startEndPressure += temp.p.resist * temp.p.elec;
			Manager.startEndPressure += temp.p.GetPress(dir);
			Manager.pressEndBody.SetOnLead(temp.p.lead[dir]);
		}
	} else {	//结尾位置在结点上
		if (dir < 0 || dir > 3) return false;
		if (Manager.pressEndBody.p.lead[dir] != null) {
			Manager.pressEndBody.SetOnLead(Manager.pressEndBody.p.lead[dir]);
		} else {
			Manager.canvas.MessageBox("结点这一端没有连接导线 !", "电流无法流过 !", MB_ICONINFORMATION);
			return false;
		}
	}

	Manager.PaintAll();
	return true;
};

//显示从起始位置到结尾位置的电势差(U0-U1)
Manager.ShowPressure = function() {
	if (!Manager.pressStartBody.IsOnAny() || !Manager.pressEndBody.IsOnAny()) {
		alert("请选择起始位置再查看电势差!\n起始位置可以用鼠标点击选择!");
		return false;
	}

	var note = "电势差";
	var name1 = Manager.GetBodyDefaultName(Manager.pressStartBody);
	var name2 = Manager.GetBodyDefaultName(Manager.pressEndBody);

	var list = LISTDATA.CreateNew();

	if (IsFloatZero(Manager.startEndPressure)) Manager.startEndPressure = 0;
	list.SetAMember(DATA_STYLE_float, note, Manager.startEndPressure);
	list.SetAMember(DATA_STYLE_string, "起始位置", name1);
	list.SetAMember(DATA_STYLE_string, "结束位置", name2);

	var dlg = MyPropertyDlg.CreateNew(list, true, null, note, Manager.canvas);
	dlg.DoModal();

	return true;
};
