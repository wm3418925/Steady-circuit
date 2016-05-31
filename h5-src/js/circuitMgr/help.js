
void Manager::Help(POINT pos)
//在用户区pos位置按F1,寻求帮助
{
	char note[128];

	motiNum = 0;
	MotivateAll(pos);
	motiNum = 0;

	if(!motiBody[0].IsOnAny())
	{
		wndPointer->MessageBox("鼠标没有移动到物体上 !", "提示信息", MB_ICONINFORMATION);
		return;
	}

	if(motiBody[0].IsOnConnectPos())
	{
		strcpy(note, "这是物体连接点部分,可以连接其他物体");
	}
	else if(motiBody[0].IsBodySame(&focusBody))
	{
		strcpy(note, "这是选定物体,显示不同于其他物体");
		strcat(note, "\n对它操作可以使用快捷键");
	}
	else if(motiBody[0].IsOnLead())
	{
		strcpy(note, "导线,可以连接2个物体");
	}
	else if(motiBody[0].IsOnCrun())
	{
		strcpy(note, "结点,可以连接4段导线");
	}
	else //if(motiBody[0].IsOnCtrl())
	{
		strcpy(note, "电学元件—");
		strcat(note, CTRL_STYLE_NAME[motiBody[0].p3->GetStyle()]);
		strcat(note, "\n可以旋转它 或者 改为其他类型的电学元件");
	}

	PaintWithSpecialColor(motiBody[0], false);
	wndPointer->MessageBox(note, "提示信息", MB_ICONINFORMATION);
	PaintAll();
}
