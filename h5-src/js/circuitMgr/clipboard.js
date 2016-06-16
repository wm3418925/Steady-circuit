
//10处理剪切板函数-----------------------------------------------------------------↓
void Manager.ClearClipboard()
//清空剪切板
{
	if (Manager.clipBody.IsOnCrun())
		delete Manager.clipBody.p2;
	else if (Manager.clipBody.IsOnCtrl())
		delete Manager.clipBody.p3;
	Manager.clipBody.Clear();
}

bool Manager.GetClipboardState()
//获取剪切板是否可用
{
	return Manager.clipBody.IsOnBody();
}

void Manager.CopyToClipboard(const Pointer &body)
//拷贝body指向的物体到剪切板
{
	ASSERT(body.IsOnBody());
	Manager.motiCount = 0;
	ClearClipboard();	//清空剪切板

	if (body.IsOnCrun())
		Manager.clipBody.SetOnCrun(body.p2.Clone(CLONE_FOR_CLIPBOARD), true);
	else //if (body.IsOnCtrl())
		Manager.clipBody.SetOnCtrl(body.p3.Clone(CLONE_FOR_CLIPBOARD), true);
}

Pointer Manager.CopyBody(FOCUS_OR_POS &body)
//复制物体到剪切板
{
	Pointer pointer = Manager.GetBodyPointer(body);
	if (!pointer.IsOnBody()) return pointer;
	CopyToClipboard(pointer);
	return pointer;
}

void Manager.CutBody(FOCUS_OR_POS &body)
//剪切物体到剪切板
{
	Pointer pointer = CopyBody(body);	//复制物体
	if (!pointer.IsOnBody()) return;
	Delete(pointer);					//删除物体
	PaintAll();							//重绘电路
}

bool Manager.PasteBody(POINT pos)
//粘贴物体
{
	if (!Manager.clipBody.IsOnBody())
	{
		MessageBeep(0);
		return false;
	}
	DPtoLP(pos, Manager.canvas);

	if (Manager.clipBody.IsOnCrun())
	{
		if (Manager.crun.length >= MAX_CRUN_COUNT)
		{
			Manager.canvas.MessageBox("结点超过最大数量!", "结点不能添加", MB_ICONWARNING);
			return false;
		}

		CloneCircuitBeforeChange();	//编辑前复制电路
		//编辑部分
		crun[Manager.crun.length] = Manager.clipBody.p2.Clone(CLONE_FOR_USE);
		crun[Manager.crun.length].coord = pos;
		crun[Manager.crun.length].num = Manager.crun.length;
		++ Manager.crun.length;

		PutCircuitToVector();	//将新的电路信息保存到容器
		PaintCrun(crun[Manager.crun.length-1]);
	}
	else if (Manager.clipBody.IsOnCtrl())
	{
		if (Manager.ctrl.length >= MAX_CTRL_COUNT)
		{
			Manager.canvas.MessageBox("电学元件超过最大数量!", "电学元件不能添加", MB_ICONWARNING);
			return false;
		}

		CloneCircuitBeforeChange();	//编辑前复制电路
		//编辑部分
		ctrl[Manager.ctrl.length] = Manager.clipBody.p3.Clone(CLONE_FOR_USE);
		ctrl[Manager.ctrl.length].coord = pos;
		ctrl[Manager.ctrl.length].num = Manager.ctrl.length;
		++ Manager.ctrl.length;

		PutCircuitToVector();	//将新的电路信息保存到容器
		PaintCtrl(ctrl[Manager.ctrl.length-1]);
	}

	return true;
}
