
//10处理剪切板函数-----------------------------------------------------------------↓
void Manager::ClearClipboard()
//清空剪切板
{
	if(clipBody.IsOnCrun())
		delete clipBody.p2;
	else if(clipBody.IsOnCtrl())
		delete clipBody.p3;
	clipBody.Clear();
}

bool Manager::GetClipboardState()
//获取剪切板是否可用
{
	return clipBody.IsOnBody();
}

void Manager::CopyToClipboard(const Pointer &body)
//拷贝body指向的物体到剪切板
{
	ASSERT(body.IsOnBody());
	motiCount = 0;
	ClearClipboard();	//清空剪切板

	if(body.IsOnCrun())
		clipBody.SetOnCrun(body.p2->Clone(CLONE_FOR_CLIPBOARD), true);
	else //if(body.IsOnCtrl())
		clipBody.SetOnCtrl(body.p3->Clone(CLONE_FOR_CLIPBOARD), true);
}

Pointer Manager::CopyBody(FOCUS_OR_POS &body)
//复制物体到剪切板
{
	Pointer pointer = GetBodyPointer(body);
	if(!pointer.IsOnBody()) return pointer;
	CopyToClipboard(pointer);
	return pointer;
}

void Manager::CutBody(FOCUS_OR_POS &body)
//剪切物体到剪切板
{
	Pointer pointer = CopyBody(body);	//复制物体
	if(!pointer.IsOnBody()) return;
	Delete(pointer);					//删除物体
	PaintAll();							//重绘电路
}

bool Manager::PasteBody(POINT pos)
//粘贴物体
{
	if(!clipBody.IsOnBody())
	{
		MessageBeep(0);
		return false;
	}
	ctx->DPtoLP(&pos);

	if(clipBody.IsOnCrun())
	{
		if(crunCount >= MAX_CRUN_COUNT)
		{
			wndPointer->MessageBox("结点超过最大数量!", "结点不能添加", MB_ICONWARNING);
			return false;
		}

		CloneCircuitBeforeChange();	//编辑前复制电路
		//编辑部分
		crun[crunCount] = clipBody.p2->Clone(CLONE_FOR_USE);
		crun[crunCount]->coord = pos;
		crun[crunCount]->num = crunCount;
		++ crunCount;

		PutCircuitToVector();	//将新的电路信息保存到容器
		PaintCrun(crun[crunCount-1]);
	}
	else if(clipBody.IsOnCtrl())
	{
		if(ctrlCount >= MAX_CTRL_COUNT)
		{
			wndPointer->MessageBox("电学元件超过最大数量!", "电学元件不能添加", MB_ICONWARNING);
			return false;
		}

		CloneCircuitBeforeChange();	//编辑前复制电路
		//编辑部分
		ctrl[ctrlCount] = clipBody.p3->Clone(CLONE_FOR_USE);
		ctrl[ctrlCount]->coord = pos;
		ctrl[ctrlCount]->num = ctrlCount;
		++ ctrlCount;

		PutCircuitToVector();	//将新的电路信息保存到容器
		PaintCtrl(ctrl[ctrlCount-1]);
	}

	return true;
}
