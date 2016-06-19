
//保存电路信息到文本文件,测试函数
Manager.SaveCircuitInfoToTextFile = function() {
	var rj = {};
	var i;

	rj += "{\ncruns:[\n";
	for (i=0; i<Manager.crun.length; i++) {
		rj += "{id:%d,x:%d,y:%d,", Manager.crun[i].initOrder, Manager.crun[i].coord.x, Manager.crun[i].coord.y;
		rj += "name:\"%s\",Manager.lead:[", Manager.crun[i].name;
		for (var j=0; j<4; j++) {
			if (Manager.crun[i].Manager.lead[j]) rj += "%d", Manager.crun[i].Manager.lead[j].initOrder;
			else rj += "-1";
			if (j!=4-1) rj += ",";
		}
		rj += "]}\n";

		if (i != Manager.crun.length-1) rj += ",";
	}
	rj += "],\n";

	rj += "leads:[\n";
	for (i=0; i<Manager.lead.length; ++i) {
		rj += "{id:%d,", (var)Manager.lead[i].initOrder;
		Manager.lead[i].SaveToTextFile(rj);
		rj += "color:%d,", (var)Manager.lead[i].color;
		rj += "conBody[";	Manager.lead[i].conBody[0].SaveToTextFile(rj);
		rj += ",";	Manager.lead[i].conBody[1].SaveToTextFile(rj);
		rj += "]}\n";

		if (i != Manager.lead.length-1) rj += ",";
	}
	rj += "],\n";

	rj += "ctrls:[\n", Manager.ctrl.length;
	const char * ctrlStyleStr[] = {"source","resistance","bulb","capa","switch"}; 
	for (i=0; i<Manager.ctrl.length; ++i) {
		rj += "{id:%d,x:%d,y:%d,", Manager.ctrl[i].initOrder, Manager.ctrl[i].coord.x, Manager.ctrl[i].coord.y;
		rj += "name:\"%s\",Manager.lead:[", Manager.ctrl[i].name;
		if (Manager.ctrl[i].Manager.lead[0])rj += "%d,", Manager.ctrl[i].Manager.lead[0].initOrder;
		else fputs("-1,", rj);
		if (Manager.ctrl[i].Manager.lead[1])rj += "%d],", Manager.ctrl[i].Manager.lead[1].initOrder;
		else fputs("-1],", rj);

		Manager.ctrl[i].SaveToTextFile(rj);

		rj += "style:\"%s\"}", ctrlStyleStr[Manager.ctrl[i].style];
		
		if (i != Manager.lead.length-1) rj += ",";
	}
	rj += "]\n}\n";

	console.log(rj);
};

//保存计算过程到文本文件,测试函数
Manager.SaveCountInfoToTextFile = function() {
	var rj = {};
	var i, j, group, ijPos, tempDir;

	CollectCircuitInfo();

	for (i=0; i<Manager.crun.length; ++i) {
		rj += "Manager.crun[%d]:\n", i;
		rj += "\tgroup = %d\n", crun2[i].group;
		//rj += "\tgroup = %f\n", crun2[i].potential;
		for (j=0;j<4;j++)
		{
			if (crun2[i].c[j])rj += "\tcircuit[%d] = %d\n", j, crun2[i].c[j].eleNum;
			else rj += "\tcircuit[%d] = null\n", j;
		}
	}

	fputc('\n', rj);

	for (i=0; i<circuNum; ++i) {
		rj += "circu[%d]:\n", i;
		rj += "\tnum in group = %d\n", ComputeMgr.circu[i].numInGroup;
		rj += "\tfromcrun = %d\n", ComputeMgr.circu[i].from-crun2;
		rj += "\tfromdir = %d\n", ComputeMgr.circu[i].dirFrom;
		rj += "\ttocrun = %d\n", ComputeMgr.circu[i].to-crun2;
		rj += "\ttodir = %d\n", ComputeMgr.circu[i].dirTo;
		//rj += "\telectic = %f\n", ComputeMgr.circu[i].elec;
		rj += "\tpressure = %f\n", ComputeMgr.circu[i].pressure;
		rj += "\tresistance = %f\n", ComputeMgr.circu[i].resistance;
	}

	console.log(rj);

	//////////////////////
	CreateEquation();
	var maps = ComputeMgr.maps;
	rj = {};

	for (group=0; group<groupNum; ++group) for (i=maps[group].size-2; i>=0; --i) for (j=maps[group].size-1; j>i; --j) {
		ijPos = CONVERT(i, j, maps[group].size);
		tempDir = maps[group].direct[ijPos];
	
		rj += "%d Direct Connections ", tempDir;

		rj += " between %3d and %3d \n", maps[group].crunTOorder[i], maps[group].crunTOorder[j];
	}

	ComputeMgr.crun2 = null;
	ComputeMgr.circu = null;
	console.log(rj);

	for (group=0; group<groupNum; ++group) {
		console.log("\ngroup[%d]------------\n", group);
		equation[group].OutputToFile();
	}
};
