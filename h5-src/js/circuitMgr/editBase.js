
//添加控件
Manager.AddCtrl = function(pos, style) {
	ASSERT(Manager.ctrl.length < MAX_CTRL_COUNT);

	var newElement = CTRL.CreateNew(Manager.ctrl.length, pos.x, pos.y, style);
	Manager.ctrl.push(newElement);

	Manager.PaintCtrlText(newElement);
	var newFocus = Pointer.CreateNew();
	newFocus.SetOnCtrl(newElement, true);
	Manager.FocusBodyPaint(newFocus);
};

//添加结点
Manager.AddCrun = function(pos) {
	ASSERT(Manager.crun.length < MAX_CRUN_COUNT);

	var newElement = CRUN.CreateNew(Manager.crun.length, pos.x, pos.y);
	Manager.crun.push(newElement);

	Manager.PaintCrunText(newElement);
	var newFocus = Pointer.CreateNew();
	newFocus.SetOnCrun(newElement, true);
	Manager.FocusBodyPaint(newFocus);
};

//用导线连接2个物体
Manager.AddLead = function(a, b) {
	ASSERT(Manager.lead.length < MAX_LEAD_COUNT);		//导线够用
	ASSERT(a.IsOnConnectPos() && b.IsOnConnectPos());	//连接点
	ASSERT(!a.IsBodySame(b));							//不是同一个物体

	//添加导线
	var newElement = LEAD.CreateNew(Manager.lead.length, null, a, b, true);
	Manager.lead.push(newElement);

	//连接物体指向导线
	a.p.lead[a.GetLeadIndex()] = newElement;
	b.p.lead[b.GetLeadIndex()] = newElement;

	//显示添加的导线
	Manager.PaintLead(newElement);
};

//删除连接2个物体的连线
//使用函数: Delete(Pointer), ConnectBodyLead
Manager.DeleteLead = function(l) {
	ASSERT(l != null);
	var a = l.conBody[0], b = l.conBody[1];
	var dira = a.GetLeadIndex(), dirb = b.GetLeadIndex();

	//如果删除物体是焦点,清除焦点
	var pointer = Pointer.CreateNew();
	pointer.SetOnLead(l);
	Manager.FocusBodyClear(pointer);

	//清空连接的指针
	a.p.lead[dira] = null;
	b.p.lead[dirb] = null;

	//删除导线
	var index = l.index;
	l = null;
	if (index != Manager.lead.length-1) {
		Manager.lead[index] = Manager.lead[Manager.lead.length-1];
		Manager.lead[index].index = index;
	}
	Manager.lead.pop();
};

//仅仅是删除一个结点或者控件,不影响周围物体
Manager.DeleteSingleBody = function(pointer) {
	ASSERT(pointer.IsOnBody());
	var index;

	Manager.FocusBodyClear(pointer);	//如果删除物体是焦点,清除焦点

	if (pointer.IsOnCrun()) {
		index = pointer.p.index;
		pointer.p = null;
		if (index != Manager.crun.length-1) {
			Manager.crun[index] = Manager.crun[Manager.crun.length-1];
			Manager.crun[index].index = index;
		}
		Manager.crun.pop();
	} else { //if (pointer.IsOnCtrl())
		index = pointer.p.index;
		pointer.p = null;
		if (index != Manager.ctrl.length-1) {
			Manager.ctrl[index] = Manager.ctrl[Manager.ctrl.length-1];
			Manager.ctrl[index].index = index;
		}
		Manager.ctrl.pop();
	}
};

//删除
Manager.DeletePointerBody = function(pointer) {
	ASSERT(pointer.IsOnAny() && !pointer.IsOnConnectPos());

	if (pointer.IsOnLead()) {
		Manager.DeleteLead(pointer.p);
	} else if (pointer.IsOnCrun()) {
		for (var i=0; i<4; ++i) if (pointer.p.lead[i] != null)
			Manager.DeleteLead(pointer.p.lead[i]);
		Manager.DeleteSingleBody(pointer);
	} else { //if (pointer.IsOnCtrl())
		for (var i=0; i<2; ++i) if (pointer.p.lead[i] != null)
			Manager.DeleteLead(pointer.p.lead[i]);
		Manager.DeleteSingleBody(pointer);
	}
};

//连接一个连接点和导线
Manager.ConnectBodyLead = function(posb) {
	var dir1, dir2, dir3;	//结点连接x,y,a的连接点位置

	//1,检查函数运行条件
	ASSERT(Manager.motiCount == 2 && Manager.motiBody[0].IsOnConnectPos() && Manager.motiBody[1].IsOnLead());
	Manager.motiCount = 0;
	if (Manager.crun.length >= MAX_CRUN_COUNT) {	//只要结点数量够,导线一定够
		swal({content:"电学元件超过最大数量!", title:"电学元件添加失败!", type:"warning"});
		return false;
	}

	//3,获得物体和坐标
	var a = Manager.motiBody[0];
	var x = Manager.motiBody[1].p.conBody[0];
	var y = Manager.motiBody[1].p.conBody[1];
	var posa = {"x":a.p.x, "y":a.p.y};

	//4,初始化连接新添加结点的方向
	if (Manager.motiBody[1].IsOnHoriLead()) {	//-3,-5,-7....横线
		if (Manager.motiBody[1].p.GetBodyPos() & 2) {
			dir1 = 4;
			dir2 = 3;
		} else {
			dir1 = 3;
			dir2 = 4;
		}

		if (posa.y > posb.y)dir3 = 2;	//先点击物体在后点击位置的下面
		else dir3 = 1;	//先点击物体在后点击位置的上面
	} else {	//-2,-4,-6....竖线
		if (Manager.motiBody[1].p.GetBodyPos() & 1) {
			dir1 = 2;
			dir2 = 1;
		} else {
			dir1 = 1;
			dir2 = 2;
		}

		if (posa.x > posb.x) dir3 = 4;	//先点击物体在后点击位置的右面
		else dir3 = 3;	//先点击物体在后点击位置的左面
	}

	//5,添加删除物体
	var leadCoord = {};
	Manager.motiBody[1].p.Divide(Manager.motiBody[1].GetAtState(), posb, leadCoord);	//记忆原来导线坐标
	Manager.DeleteLead(Manager.motiBody[1].p);	//删除原来导线
	Manager.AddCrun(posb);	//添加结点

	var newCrun = Pointer.CreateNew();
	newCrun.SetOnCrun(Manager.crun[Manager.crun.length-1], true);	//newCrun指向新添加结点

	newCrun.SetAtState(dir1);
	Manager.AddLead(x, newCrun);	//x和节点连线,x是起点,新节点是终点
	Manager.lead[Manager.lead.length-1].ReplacePos(leadCoord.first);	//坐标还原

	newCrun.SetAtState(dir2);
	Manager.AddLead(newCrun, y);	//y和节点连线,y是终点,新节点是起点
	Manager.lead[Manager.lead.length-1].ReplacePos(leadCoord.second);	//坐标还原

	newCrun.SetAtState(dir3);
	Manager.AddLead(a, newCrun);	//a和节点连线

	return true;
};

//删除物体
Manager.DeleteFocusOrPosBody = function(body) {
	var pointer = Manager.GetBodyPointer(body);
	if (!pointer.IsOnAny()) return false;

	var okCallback = function(pointer) {
		Manager.DeletePointerBody(pointer);
	}
	var returnCallback = function(pointer) {
		Manager.PaintAll();
	}
	Manager.DeleteNote(pointer, okCallback, returnCallback);
};
