
//7文件函数--------------------------------------------------------------------↓
const char * Manager::GetFilePath()
//获取文件路径
{
	return fileName;
}

bool Manager::SaveFile(const char * newFile)
//保存电路
{
	ASSERT(newFile != null && newFile[0] != '\0');
	long i;
	FILE * fp;

	strcpy(fileName, newFile);	//替换原有文件路径
	fp = fopen(fileName, "wb");
	if(fp == null)	//文件不能打开
	{
		wndPointer.MessageBox("文件不能写 !", "保存文件错误", MB_ICONERROR);
		return false;
	}

	//1保存文件版本
	i = FILE_VERSION;
	fwrite(&i, sizeof(long), 1, fp);

	//2保存物体数量
	fwrite(&crunCount, sizeof(short), 1, fp);
	fwrite(&ctrlCount, sizeof(short), 1, fp);
	fwrite(&leadCount, sizeof(short), 1, fp);

	//3保存结点
	for(i = crunCount-1; i >= 0; --i)
		crun[i]->SaveToFile(fp);

	//4保存控件
	for(i = ctrlCount-1; i >= 0; --i)
		ctrl[i]->SaveToFile(fp);

	//5保存导线
	for(i = leadCount-1; i >= 0; --i)
		lead[i]->SaveToFile(fp);

	//6保存其他变量
	fwrite(&moveBodySense, sizeof(int), 1, fp);		//按方向键一次物体移动的距离
	fwrite(&maxLeaveOutDis, sizeof(int), 1, fp);	//导线合并最大距离
	fwrite(&textColor, sizeof(enum), 1, fp);		//字体颜色
	fwrite(&focusLeadStyle, sizeof(enum), 1, fp);	//焦点导线样式
	fwrite(&focusCrunColor, sizeof(enum), 1, fp);	//焦点结点颜色
	fwrite(&focusCtrlColor, sizeof(enum), 1, fp);	//焦点控件颜色
	focusBody.SaveToFile(fp);						//焦点物体
	fwrite(&viewOrig, sizeof(POINT), 1, fp);		//视角初始坐标

	//7文件保留域,便于文件升级
	char tmpForReserve[FILE_RESERVE_SIZE] = {0};
	fwrite(tmpForReserve, FILE_RESERVE_SIZE, 1, fp);

	fclose(fp);
	return true;
}

bool Manager::ReadFile(const char * newFile)
//读取电路
{
	ASSERT(newFile != null && newFile[0] != '\0');
	FILE * fp;
	int i;
	POINT pos1 = {null};
	Pointer body;

	fp = fopen(newFile, "rb");
	if(fp == null)
	{
		wndPointer.MessageBox("文件不能不存在或不能读取 !", "读取文件错误", MB_ICONERROR);
		return false;
	}

	//1读取文件版本
	fread(&i, sizeof(int), 1, fp);
	if(i != FILE_VERSION)	//文件版本不同,不予读取
	{
		fclose(fp);
		wndPointer.MessageBox("文件版本不符 !", "读取文件错误", MB_ICONERROR);
		return false;
	}

	DeleteVector(circuitVector.begin(), circuitVector.end());	//清除容器保存的电路信息
	strcpy(fileName, newFile);	//替换原有路径

	try	//可能因为文件问题而发生错误
	{
		//2读取物体数量
		fread(&crunCount, sizeof(short), 1, fp);
		fread(&ctrlCount, sizeof(short), 1, fp);
		fread(&leadCount, sizeof(short), 1, fp);

		//检查读取的物体数量是否在允许的范围之内
		if(crunCount < 0 || leadCount < 0 || ctrlCount < 0)
			goto READFILEERROR;
		if(crunCount>MAX_CRUN_COUNT || leadCount>MAX_LEAD_COUNT || ctrlCount>MAX_CTRL_COUNT)
			goto READFILEERROR;

		//为每个物体申请内存空间
		for(i = crunCount-1; i >= 0; --i)
			crun[i] = new CRUN(i, pos1);
		for(i = ctrlCount-1; i >= 0; --i)
			ctrl[i] = new CTRL(i, pos1, SOURCE, false);
		for(i = leadCount-1; i >= 0; --i)
			lead[i] = new LEAD(i, motiBody[0],motiBody[1], false);

		//3读取结点
		CRUN::ResetInitNum();
		for(i = crunCount-1; i >= 0; --i)
			crun[i]->ReadFromFile(fp, lead);

		//4读取控件
		CTRL::ResetInitNum();
		for(i = ctrlCount-1; i >= 0; --i)
			ctrl[i]->ReadFromFile(fp, lead);

		//5读取导线
		LEAD::ResetInitNum();
		for(i = leadCount-1; i >= 0; --i)
			lead[i]->ReadFromFile(fp, lead, crun, ctrl);

		//6读取其他变量
		fread(&moveBodySense, sizeof(UINT), 1, fp);		//按方向键一次物体移动的距离
		fread(&maxLeaveOutDis, sizeof(UINT), 1, fp);	//导线合并最大距离
		fread(&textColor, sizeof(enum), 1, fp);			//字体颜色
		fread(&focusLeadStyle, sizeof(enum), 1, fp);	//焦点导线样式
		fread(&focusCrunColor, sizeof(enum), 1, fp);	//焦点结点颜色
		fread(&focusCtrlColor, sizeof(enum), 1, fp);	//焦点控件颜色
		body.ReadFromFile(fp, lead, crun, ctrl);		//读取焦点物体
		FocusBodySet(body);								//设置焦点物体
		fread(&viewOrig, sizeof(POINT), 1, fp);			//视角初始坐标

		ctx.SetTextColor(LEADCOLOR[textColor]);								//初始化字体颜色
		ctx.SetViewportOrg(-viewOrig.x, -viewOrig.y);						//初始化视角初始坐标
		wndPointer.SetScrollPos(SB_HORZ, viewOrig.x/mouseWheelSense.cx);	//初始化水平滚动条
		wndPointer.SetScrollPos(SB_VERT, viewOrig.y/mouseWheelSense.cy);	//初始化竖直滚动条

	}	//try

	catch(...)
	{
	READFILEERROR:
		fclose(fp);
		wndPointer.MessageBox("文件可能损坏了 !", "读取文件错误", MB_ICONERROR);
		exit(0);
	}

	fclose(fp);				//关闭文件句柄
	PutCircuitToVector();	//将当前电路信息保存到容器
	return true;			//正常退出
}

void Manager::CreateFile()
//建立新文件(空的)
{
	fileName[0] = '\0';											//路径清空
	ClearCircuitState();										//清除电路状态信息
	DeleteVector(circuitVector.begin(), circuitVector.end());	//清除容器保存的电路信息
	leadCount = crunCount = ctrlCount = 0;							//物体数量设为0
	PutCircuitToVector();										//将当前空电路信息保存到容器
}
