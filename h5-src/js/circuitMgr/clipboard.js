
//清空剪切板
Manager.ClearClipboard = function() {
	if (Manager.clipBody.IsOnCrun())
		Manager.clipBody.p = null;
	else if(Manager.clipBody.IsOnCtrl())
		Manager.clipBody.p = null;
	
	Manager.clipBody.Clear();
};

//获取剪切板是否可用
Manager.GetClipboardState = function() {
	return Manager.clipBody.IsOnBody();
};

//拷贝body指向的物体到剪切板
Manager.CopyToClipboard = function(body) {
	ASSERT(body.IsOnBody());
	Manager.motiCount = 0;
	Manager.ClearClipboard();	//清空剪切板

	if (body.IsOnCrun())
		Manager.clipBody.SetOnCrun(body.p.Clone(CLONE_FOR_CLIPBOARD), true);
	else //if (body.IsOnCtrl())
		Manager.clipBody.SetOnCtrl(body.p.Clone(CLONE_FOR_CLIPBOARD), true);
};

//复制物体到剪切板
Manager.CopyBody = function(body) {
	var pointer = Manager.GetBodyPointer(body);
	if (!pointer.IsOnBody()) return pointer;
	Manager.CopyToClipboard(pointer);
	return pointer;
};

//剪切物体到剪切板
Manager.CutBody = function(body) {
	var pointer = Manager.CopyBody(body);	//复制物体
	if (!pointer.IsOnBody()) return;
	Manager.DeletePointerBody(pointer);		//删除物体
	Manager.PaintAll();				//重绘电路
};

//粘贴物体
Manager.PasteBody = function(pos) {
	if (!Manager.clipBody.IsOnBody()) {
		return false;
	}

	if (Manager.clipBody.IsOnCrun()) {
		if (Manager.crun.length >= MAX_CRUN_COUNT) {
			swal({content:"结点超过最大数量!", title:"结点添加失败!", type:"warning"});
			return false;
		}

		//编辑部分
		var newElement = Manager.clipBody.p.Clone(CLONE_FOR_USE);
		newElement.x = pos.x; newElement.y = pos.y;
		newElement.index = Manager.crun.length;
		Manager.crun.push(newElement);

		Manager.PaintCrun(newElement);
	} else if (Manager.clipBody.IsOnCtrl()) {
		if (Manager.ctrl.length >= MAX_CTRL_COUNT) {
			swal({content:"电学元件超过最大数量!", title:"电学元件添加失败!", type:"warning"});
			return false;
		}

		//编辑部分
		var newElement = Manager.clipBody.p.Clone(CLONE_FOR_USE);
		newElement.x = pos.x; newElement.y = pos.y;
		newElement.index = Manager.ctrl.length;
		Manager.ctrl.push(newElement);

		Manager.PaintCtrl(newElement);
	}

	return true;
};
