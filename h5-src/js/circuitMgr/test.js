
//保存电路信息到文本文件,测试函数
Manager.SaveCircuitInfoToTextFile = function() {
	var rj = {};
	var i;

	rj += "{\ncruns:[\n";
	for (i=0; i<Manager.crun.length; i++) {
		var tmp = Manager.crun[i].GenerateStoreJsonObj();
		tmp.index = Manager.crun[i].index;
		rj += tmp + "\n";

		if (i != Manager.crun.length-1) rj += ",";
	}
	rj += "]\n";

	rj += ",leads:[\n";
	for (i=0; i<Manager.lead.length; ++i) {
		var tmp = Manager.lead[i].GenerateStoreJsonObj();
		tmp.index = Manager.lead[i].index;
		rj += tmp + "\n";

		if (i != Manager.lead.length-1) rj += ",";
	}
	rj += "]\n";

	rj += ",ctrls:[\n";
	for (i=0; i<Manager.ctrl.length; ++i) {
		var tmp = Manager.ctrl[i].GenerateStoreJsonObj();
		tmp.index = Manager.ctrl[i].index;
		rj += tmp + "\n";
		
		if (i != Manager.lead.length-1) rj += ",";
	}
	rj += "]\n}\n";

	console.log(rj);
};

//保存计算过程到文本文件,测试函数
Manager.SaveCountInfoToTextFile = function() {
	var rj = {};
	var i, j, group, ijPos, tempDir;

	ComputeMgr.CollectCircuitInfo();

	for (i=0; i<ComputeMgr.crun2.length; ++i) {
		rj += "ComputeMgr.crun2[" + i + "]:\n";
		rj += "\tgroup = " + ComputeMgr.crun2[i].group + "\n";
		//rj += "\tgroup = %f\n", ComputeMgr.crun2[i].potential;
		for (j=0;j<4;j++) {
			if (ComputeMgr.crun2[i].c[j])rj += "\tcircuit[" + j + "] = " + ComputeMgr.crun2[i].c[j].eleNum + "\n";
			else rj += "\tcircuit[" + j + "] = null\n";
		}
	}

	fputc('\n', rj);

	for (i=0; i<Manager.circuCount; ++i) {
		rj += "circu[" + i + "]:\n";
		rj += "\tnum in group = " + ComputeMgr.circu[i].numInGroup + "\n";
		rj += "\tfromcrun = " + ComputeMgr.circu[i].from-crun2 + "\n";
		rj += "\tfromdir = " + ComputeMgr.circu[i].dirFrom + "\n";
		rj += "\ttocrun = " + ComputeMgr.circu[i].to-crun2 + "\n";
		rj += "\ttodir = " + ComputeMgr.circu[i].dirTo + "\n";
		//rj += "\telectic = %f\n", ComputeMgr.circu[i].elec;
		rj += "\tpressure = " + ComputeMgr.circu[i].pressure + "\n";
		rj += "\tresistance = " + ComputeMgr.circu[i].resistance + "\n";
	}

	console.log(rj);

	//////////////////////
	ComputeMgr.CreateEquation();
	var maps = ComputeMgr.maps;
	rj = {};

	for (group=0; group<groupNum; ++group) for (i=maps[group].size-2; i>=0; --i) for (j=maps[group].size-1; j>i; --j) {
		ijPos = ComputeMgr.CONVERT(i, j, maps[group].size);
		tempDir = ComputeMgr.maps[group].direct[ijPos];
	
		rj += "" + tempDir + " Direct Connections ";

		rj += " between " + maps[group].crunTOorder[i] + " and " + maps[group].crunTOorder[j] + " \n";
	}

	ComputeMgr.crun2 = null;
	ComputeMgr.circu = null;
	console.log(rj);

	for (group=0; group<groupNum; ++group) {
		console.log("\ngroup[" + group + "]------------\n");
		ComputeMgr.equation[group].OutputToFile();
	}
};
