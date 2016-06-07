
//9测试函数------------------------------------------------------------------------↓
void Manager::SaveCircuitInfoToTextFile()
//保存电路信息到文本文件,测试函数
{
	int i;
	FILE * fp = fopen("D:\\data.txt", "w");
	if(fp == null) return;

	fprintf(fp, "{\ncruns:[\n");
	for(i=0; i<crunCount; i++)
	{
		fprintf(fp, "{id:%d,x:%d,y:%d,", crun[i]->GetInitOrder(), crun[i]->coord.x, crun[i]->coord.y);
		fprintf(fp, "name:\"%s\",lead:[", crun[i]->name);
		for(int j=0; j<4; j++)
		{
			if(crun[i]->lead[j]) fprintf(fp, "%d", crun[i]->lead[j]->GetInitOrder());
			else fprintf(fp, "-1");
			if (j!=4-1) fprintf(fp, ",");
		}
		fprintf(fp, "]}\n");

		if (i != crunCount-1) fprintf(fp, ",");
	}
	fprintf(fp, "],\n");

	fprintf(fp, "leads:[\n");
	for(i=0; i<leadCount; ++i)
	{
		fprintf(fp, "{id:%d,", (int)lead[i]->GetInitOrder());
		lead[i]->SaveToTextFile(fp);
		fprintf(fp, "color:%d,", (int)lead[i]->color);
		fprintf(fp, "conBody[");	lead[i]->conBody[0].SaveToTextFile(fp);
		fprintf(fp, ",");	lead[i]->conBody[1].SaveToTextFile(fp);
		fprintf(fp, "]}\n");

		if (i != leadCount-1) fprintf(fp, ",");
	}
	fprintf(fp, "],\n");

	fprintf(fp, "ctrls:[\n", ctrlCount);
	const char * ctrlStyleStr[] = {"source","resistance","bulb","capa","switch"}; 
	for(i=0; i<ctrlCount; ++i)
	{
		fprintf(fp, "{id:%d,x:%d,y:%d,", ctrl[i]->GetInitOrder(), ctrl[i]->coord.x, ctrl[i]->coord.y);
		fprintf(fp, "name:\"%s\",lead:[", ctrl[i]->name);
		if(ctrl[i]->lead[0])fprintf(fp, "%d,", ctrl[i]->lead[0]->GetInitOrder());
		else fputs("-1,", fp);
		if(ctrl[i]->lead[1])fprintf(fp, "%d],", ctrl[i]->lead[1]->GetInitOrder());
		else fputs("-1],", fp);

		ctrl[i]->SaveToTextFile(fp);

		fprintf(fp, "style:\"%s\"}", ctrlStyleStr[ctrl[i]->GetStyle()]);
		
		if (i != leadCount-1) fprintf(fp, ",");
	}
	fprintf(fp, "]\n}\n");

	fclose(fp);
}

void Manager::SaveCountInfoToTextFile()
//保存计算过程到文本文件,测试函数
{
	FILE * fp = fopen("D:\\Circuit.txt", "w");
	int i, j, group, ijPos, tempDir;

	if(fp == null) return;

	CollectCircuitInfo();

	for(i=0; i<crunCount; ++i)
	{
		fprintf(fp, "crun[%d]:\n", i);
		fprintf(fp, "\tgroup = %d\n", crun2[i].group);
		//fprintf(fp, "\tgroup = %f\n", crun2[i].potential);
		for(j=0;j<4;j++)
		{
			if(crun2[i].c[j])fprintf(fp, "\tcircuit[%d] = %d\n", j, crun2[i].c[j]->eleNum);
			else fprintf(fp, "\tcircuit[%d] = null\n", j);
		}
	}

	fputc('\n', fp);

	for(i=0; i<circuNum; ++i)
	{
		fprintf(fp, "circu[%d]:\n", i);
		fprintf(fp, "\tnum in group = %d\n", circu[i].numInGroup);
		fprintf(fp, "\tfromcrun = %d\n", circu[i].from-crun2);
		fprintf(fp, "\tfromdir = %d\n", circu[i].dirFrom);
		fprintf(fp, "\ttocrun = %d\n", circu[i].to-crun2);
		fprintf(fp, "\ttodir = %d\n", circu[i].dirTo);
		//fprintf(fp, "\telectic = %f\n", circu[i].elec);
		fprintf(fp, "\tpressure = %f\n", circu[i].pressure);
		fprintf(fp, "\tresistance = %f\n", circu[i].resistance);
	}

	fclose(fp);

	//////////////////////
	CreateEquation();
	CRUNMAP * maps = this.maps;
	fp = fopen("D:\\Map.txt", "w");
	if(fp == null) return;

	for(group=0; group<groupNum; ++group) for(i=maps[group].size-2; i>=0; --i) for(j=maps[group].size-1; j>i; --j)
	{
		ijPos = CONVERT(i, j, maps[group].size);
		tempDir = maps[group].direct[ijPos];
	
		fprintf(fp, "%d Direct Connections ", tempDir);

		fprintf(fp, " between %3d and %3d \n", maps[group].crunTOorder[i], maps[group].crunTOorder[j]);
	}

	delete [] crun2;
	delete [] circu;
	circu = null;
	circuNum = 0;
	fclose(fp);

	fp = fopen("D:\\Equation.txt", "w");
	if(fp == null) return;
	for(group=0; group<groupNum; ++group)
	{
		fprintf(fp, "\ngroup[%d]------------\n", group);
		//equation[group]->Simple_Equation();
		equation[group]->OutputToFile(fp);
	}
	fclose(fp);

	for(group=0; group<groupNum; ++group)
	{
		maps[group].Uninit();
		delete equation[group];
	}
	delete [] maps;
	delete [] equation;
}
