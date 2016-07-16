
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
			swal({text:"当前选择的电路不正常 !", title:"无法计算电势差 !", type:"warning"});
			return false;
		}
	} else if (mb.IsOnCrun() && !mb.IsOnConnectPos()) {
		var c = mb.p;
		for (var i=0; i<4; ++i) if (c.lead[i] && IsElecError(c.lead[i].elecDir)) {
			swal({text:"当前选择的电路不正常 !", title:"无法计算电势差 !", type:"warning"});
			return false;
		}
	} else {
		return false;	//没有点击导线或者节点
	}

	Manager.pressStartBody = mb.Clone();
	Manager.pressEndBody = mb.Clone();
	Manager.startEndPressure = 0;

	Manager.PaintAll();
	return true;
};

//用户输入数字或者其他键, 获取电势差流动方向
Manager.NextBodyDirByChar = function(code, nChar) {
	if (Manager.pressEndBody.IsOnCrun()) {
		if ('W' == nChar || 38 == code)
			return 0;
		if ('S' == nChar || 40 == code)
			return 1;
		if ('A' == nChar || 37 == code)
			return 2;
		if ('D' == nChar || 39 == code)
			return 3;
		
		if (nChar >= '1' && nChar <= '4')
			return nChar - '1';
		
		return -1;
	} else {
		if (nChar >= '1' && nChar <= '2')
			return nChar - '1';
		
		var startPos = {}, endPos = {};
		Manager.pressEndBody.p.GetStartEndPos(startPos, endPos);
		
		if (('W' == nChar || 38 == code) && startPos.y != endPos.y) {
			if (startPos.y < endPos.y)
				return 0;
			else
				return 1;
		}
		if (('S' == nChar || 40 == code) && startPos.y != endPos.y) {
			if (startPos.y > endPos.y)
				return 0;
			else
				return 1;
		}
		if (('A' == nChar || 37 == code) && startPos.x != endPos.x) {
			if (startPos.x < endPos.x)
				return 0;
			else
				return 1;
		}
		if (('D' == nChar || 39 == code) && startPos.x != endPos.x) {
			if (startPos.x > endPos.x)
				return 0;
			else
				return 1;
		}
		
		return -1;
	}
};
//用户输入数字1,2,3,4来移动电势差结尾位置
Manager.NextBodyByPressKey = function(code, nChar) {
	if (!Manager.pressStartBody.IsOnAny() || !Manager.pressEndBody.IsOnAny()) {
		swal({title: "请先鼠标点击导线或者连线选择电势差起始位置,<br>然后输入数字移动电势差结尾位置.", type: "warning", html: true});
		return false;
	}

	var dir = Manager.NextBodyDirByChar(code, nChar);
	if (dir < 0 || dir > 3)
		return false;	

	if (Manager.pressEndBody.IsOnLead()) {	//结尾位置在导线上
		if (dir < 0 || dir > 1) return false;
		
		var temp = Manager.pressEndBody.p.conBody[dir].Clone();
		temp.SetAtState(-1);

		if (temp.IsOnCrun()) {
			Manager.pressEndBody = temp.Clone();
		} else { //if (temp.IsOnCtrl())
			if (temp.p.resist < 0) {	//断路控件
				swal({text:"这是一个断路电学元件 !", title:"电流无法流过 !", type:"warning"});
				return false;
			}
			if (temp.p.GetConnectCount() < 2) {	//控件没有连接2段导线
				swal({text:"电学元件另一端没有连接导线 !", title:"电流无法流过 !", type:"warning"}, Manager.CanvasSetFocus);
				return false;
			}
			dir = True1_False0(temp.p.lead[0] == Manager.pressEndBody.p);	//下一个导线索引(0或1)
			if (temp.p.lead[dir] == Manager.pressEndBody.p) return false;	//电路是一个控件2端都连接同一段导线
			if (temp.p.elecDir == dir)
				Manager.startEndPressure -= temp.p.resist * temp.p.elec;
			else
				Manager.startEndPressure += temp.p.resist * temp.p.elec;
			Manager.startEndPressure += temp.p.GetPressure(dir);
			Manager.pressEndBody.SetOnLead(temp.p.lead[dir]);
		}
	} else {	//结尾位置在结点上
		if (Manager.pressEndBody.p.lead[dir] != null) {
			Manager.pressEndBody.SetOnLead(Manager.pressEndBody.p.lead[dir]);
		} else {
			swal({title:"结点这一端没有连接导线 !", type:"warning"});
			return false;
		}
	}

	Manager.PaintAll();
	return true;
};

//显示从起始位置到结尾位置的电势差(U0-U1)
Manager.ShowPressure = function() {
	if (!Manager.pressStartBody.IsOnAny() || !Manager.pressEndBody.IsOnAny()) {
		swal({title:"请鼠标点击选择起始位置", type:"info"});
		return false;
	}

	var note = "电势差";
	var name1 = Manager.GetBodyDefaultName(Manager.pressStartBody);
	var name2 = Manager.GetBodyDefaultName(Manager.pressEndBody);

	var list = new LISTDATA();

	if (IsFloatZero(Manager.startEndPressure)) Manager.startEndPressure = 0;
	list.SetAMember(DATA_TYPE_float, note, Manager.startEndPressure);
	list.SetAMember(DATA_TYPE_string, "起始位置", name1);
	list.SetAMember(DATA_TYPE_string, "结束位置", name2);

	var dlg = MyPropertyDlg.Init(list, true, null, note, Manager.canvas);
	dlg.DoModal();

	return true;
};
