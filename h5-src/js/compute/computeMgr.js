var ComputeMgr = {};


ComputeMgr.CONVERT = function(a,b,size)	{return size*a-(a+1)*a/2+b-a-1;}	//用于CRUNMAP成员的访问




ComputeMgr.CombineGroup = function(
							/*int*/from,
							/*int*/to,
							/*int **/group,
							/*int*/groupSize)
//将2个连接组 的组号 合并
{
	ASSERT(group && groupSize>0 && from>=0 && to>=0);
	for (var i=groupSize-1; i>=0; --i) if (group[i]==from)
		group[i] = to;
};

/*char*/ComputeMgr.GetCrun2ConnectNum = function(/*int*/a, /*int*/b)
//获得2个WmMgr.crun2结点直接连接的线路个数
{
	/*int*/var i;
	/*char*/var connect = 0;
	/*CIRCU **/var temp;
	for (i=0; i<4; ++i)
	{
		temp = ComputeMgr.crun2[a].c[i];
		if (!temp)continue;
		if (temp.to == ComputeMgr.crun2[b] || temp.from == ComputeMgr.crun2[b]) ++connect;
	}
	return connect;
};

/*{c:CIRCU *,dir:int}*/ComputeMgr.GetCrun2FirstCircu = function(/*int*/ a, /*int*/ b)
//由结点编号获得第一个连接他们的线路
//函数返回的 {线路指针, 线路在WmMgr.crun2[a].c[i]的i}
{
	/*CIRCU **/var temp;

	for (var i=0; i<4; ++i)
	{
		temp = ComputeMgr.crun2[a].c[i];
		if (!temp) continue;
		if (temp.to == ComputeMgr.crun2[b] || temp.from == ComputeMgr.crun2[b])
		{
			num = i;
			return {"c":temp, "dir":i};
		}
	}

	return null;
};

ComputeMgr.PutIntoBuf = function(/*int */fromGroup,
							/*int */toGroup,
							/*CRUNMAP * */map,
							/*double * */buf) {
//将from,to结点第一个连接线路的电流电阻放入缓冲
	/*int*/var i;
	/*CIRCU **/var c;
	ASSERT(map != null && buf != null);

	if (fromGroup < toGroup)
		i = CONVERT(fromGroup, toGroup, map.size);
	else
		i = CONVERT(toGroup, fromGroup, map.size);

	c = map.firstCircuit[i];

	if (indexOfArray(ComputeMgr.crun2, c.from) == map.crunOrderMap[fromGroup]) {
		buf[ c.indexInGroup ]  =  c.resistance;
		buf[ map.circuitCount ] += c.pressure;
	} else {
		buf[ c.indexInGroup ]  = -c.resistance;
		buf[ map.circuitCount ] -= c.pressure;
	}
};

ComputeMgr.CreateCrunEquation = function(/*CRUN2 * */inputCrun2, /*double * */buf)
//建立结点方程,输出到缓存上
{
	/*CIRCU ***/var tempCircu = inputCrun2.c;
	/*int*/var connectNum = 0;
	/*int*/var i;

	for (i=0; i<4; ++i) if (tempCircu[i])
	{
		++ connectNum;

		if (inputCrun2 == tempCircu[i].from && i == tempCircu[i].dirFrom)
			buf[tempCircu[i].indexInGroup] += 1;
		else
			buf[tempCircu[i].indexInGroup] -= 1;
	}

	return connectNum;
};

ComputeMgr.CollectCircuitInfo = function()
//遍历一次电路,获得每个群组的线路电学信息
{
	/*Pointer*/var now, pre;	//当前的物体
	/*int*/var dir;			    //下一个物体在当前物体的方向
	/*int*/var i, j, tempVar;	//循环变量
	/*int*/var endCrunIndex;	//线路结束结点编号
	/*int **/var group;		    //物体分组
	/*int*/var groupSize = 0;	//当前使用的group数组的大小

	//1,初始化----------------------------------------------------
	ComputeMgr.groupCount = 0;	//组数,同一组的在一个连通图中,分组建立方程
	ComputeMgr.circuitCount = 0;	//线路数
	group = new Array(ComputeMgr.crunCount);		//组数不会超过ComputeMgr.crunCount
	ComputeMgr.crun2 = genrateArrayWithElementInitFunc(CRUN2.CreateNew, ComputeMgr.crunCount);		//用于计算的结点
	ComputeMgr.circu = genrateArrayWithElementInitFunc(CIRCU.CreateNew, ComputeMgr.crunCount*2);	//线路数不会超过ComputeMgr.crunCount*2
	for (i=ComputeMgr.crunCount-1; i>=0; --i)group[i] = i;

	//2，检索电路,以结点为头和尾-----------------------------------
	for (i=ComputeMgr.crunCount-1; i>=0; --i) if (crun[i].GetConnectNum() >= 3)
	//满足结点连接导线个数至少是3,否则结点不需要检索
	//0--结点是孤立的;1--结点断路;2--结点相当于导线
		for (j=0; j<4; ++j) if (crun[i].lead[j] && ComputeMgr.crun2[i].c[j] == null)
	//满足当前方向有导线连接 而且 没有检索过(ComputeMgr.crun2[i].c[j] == null)
	{
		now = lead[j];
		dir = true1AndFalse0(now.conBody[0].p == crun[i]);

		ComputeMgr.circu[ComputeMgr.circuitCount].resistance = 0;	//电阻清0
		ComputeMgr.circu[ComputeMgr.circuitCount].pressure   = 0;	//电压清0

		while (true)	//遇到下一个连接物体不是2个的结点结束
		{
			pre = now;

			if (now.hasOwnProperty("resist"))	//控件
			{
				//处理控件
				if (now.resist < 0 || now.lead[dir] == null)	//断路了
				{
					ComputeMgr.circu[ComputeMgr.circuitCount].resistance = -1;
					break;
				}
				ComputeMgr.circu[ComputeMgr.circuitCount].resistance += now.resist;
				ComputeMgr.circu[ComputeMgr.circuitCount].pressure   += now.GetPressure(1-dir);	//方向相反

				//到下一个物体
				now = pre.lead[dir];
				dir = true1AndFalse0(now.conBody[0].p == pre);
			}
			else	//导线,到下一个物体
			{
				now = pre.conBody[dir].p;
				if (IsOnCrun(now))	//遇到连接物体不是2个的结点结束
				{
					tempVar = now.GetConnectNum();
					if (tempVar >= 3)	//通路
					{
						dir = now.GetDirect(pre);	//记录下结束的结点和方向
						break;
					}
					else if (tempVar == 2)	//跳过,相当于导线
					{
						//找到结点连接的另一个导线
						for (dir=0; dir<4; ++dir)
							if (now.lead[dir]!=null && pre != now.lead[dir]) break;
						//转到结点连接的另一个导线
						pre = now;
						now = pre.lead[dir];
						dir = true1AndFalse0(now.conBody[0].p == pre);
					}
					else if (tempVar == 1)	//断路
					{
						ComputeMgr.circu[ComputeMgr.circuitCount].resistance = -1;
						break;	//断路返回
					}
					else
					{
						throw "电路文件有错 !导线连接结点,但是结点不连接导线 !";
						break;
					}
				}
				else if (now.hasOwnProperty("resist"))
				{
					dir = true1AndFalse0(now.lead[0] == pre);
				}
				else if (IsOnLead(now))
				{
					throw "2个导线直接连接出现会引起错误 !";
					break;
				}
				else
				{
					throw "电路文件有错 !导线只连接一个物体 !";
					break;
				}
				
			}
		}//while (true)

		if (ComputeMgr.circu[ComputeMgr.circuitCount].resistance >= 0)
		{
			endCrunIndex = now.num;

			ComputeMgr.circu[ComputeMgr.circuitCount].eleIndex = ComputeMgr.circuitCount;
			ComputeMgr.circu[ComputeMgr.circuitCount].from = ComputeMgr.crun2[i];
			ComputeMgr.circu[ComputeMgr.circuitCount].dirFrom = j;
			ComputeMgr.circu[ComputeMgr.circuitCount].to = ComputeMgr.crun2[endCrunIndex];
			ComputeMgr.circu[ComputeMgr.circuitCount].dirTo = dir;
			ComputeMgr.crun2[endCrunIndex].c[dir] = ComputeMgr.crun2[i].c[j] = ComputeMgr.circu[ComputeMgr.circuitCount];
			++ ComputeMgr.circuitCount;	//不是断路,计入有效线路

			if (ComputeMgr.crun2[i].group >= 0)
			{
				if (ComputeMgr.crun2[endCrunIndex].group >= 0 && group[ComputeMgr.crun2[i].group] == group[ComputeMgr.crun2[endCrunIndex].group])
					continue;
				if (ComputeMgr.crun2[endCrunIndex].group >= 0)	//group合并
				{
					CombineGroup(   group[ComputeMgr.crun2[endCrunIndex].group],
									group[ComputeMgr.crun2[i].group],
									group,
									groupSize);
					--ComputeMgr.groupCount;	//合并
				}
				else	//继承连接物体的group
				{
					ComputeMgr.crun2[endCrunIndex].group = ComputeMgr.crun2[i].group;
				}
			}
			else
			{
				if (ComputeMgr.crun2[endCrunIndex].group>=0)	//继承连接物体的group
				{
					ComputeMgr.crun2[i].group=ComputeMgr.crun2[endCrunIndex].group;
				}
				else	//建立新的group
				{
					ComputeMgr.crun2[i].group = ComputeMgr.crun2[endCrunIndex].group = groupSize;
					++groupSize;
					++ComputeMgr.groupCount;	//建立新的
				}
			}

		}//if ( ComputeMgr.circu[i].resistance >= 0 )

	}//for

	//3,将group排列成从0开始的连续数字-----------------------------------
	dir = 0;
	for (i=ComputeMgr.groupCount-1; i>=0; --i)
	{
		for (; dir<groupSize; ++dir) if (group[dir] >= 0) break;
		for (j=dir+1; j<groupSize; ++j) if (group[j]==group[dir]) group[j] = -i - 1;
		group[dir] = -i - 1;
		++dir;
	}
	for (j=groupSize-1; j>=0; --j) group[j] = -group[j] - 1;

	//4,以上WmMgr.crun2的group不是真正的组队标志,而是指向group数组的指针-------
	//现在转化为真正的组队标志
	for (i=ComputeMgr.crunCount-1; i>=0; --i) if (ComputeMgr.crun2[i].group >= 0) ComputeMgr.crun2[i].group = group[ComputeMgr.crun2[i].group];

	group = null;//delete [] group;
};

/*bool*/ComputeMgr.FindRoad = function(/*const CRUNMAP * */map, /*ROAD * */roads, /*int */j, /*int */k)
//形成一个结点j 到 其他结点的路径,屏蔽j k之间的直接连线
{
	/*const int*/var size = map.size;
	/*bool*/var state;			//记录是否改变了
	/*int*/var i, next;		    //循环变量
	/*bool **/var interFlag;	//j 是否找到与某点连线的标记

	interFlag = new Array(size);
	for (i=size-1; i>j; --i) interFlag[i] = map.direct[CONVERT(j,i,size)] > 0;
	for (i=j-1; i>=0; --i) interFlag[i] = map.direct[CONVERT(i,j,size)] > 0;
	interFlag[j] = interFlag[k] = false;

	do
	{
		state = false;	//清除上次状态

		for (i=size-1; i>=0; --i) if (i!=j && i!=k && interFlag[i])
		{
			for (next=size-1; next>i; --next)
				if (next-j && !interFlag[next] && map.direct[CONVERT(i,next,size)]>0)
			{
				state = true;	//改变了
				interFlag[next] = true;
				roads[i].Clone(roads[next]);
				roads[next].InsertPointAtTail(i);
			}

			if (interFlag[k]) {state = false;break;}	//退出循环

			for (next=i-1; next>=0; --next)
			{
				if (next != j && !interFlag[next] && map.direct[CONVERT(next,i,size)] > 0)
				{
					state = true;	//改变了
					interFlag[next] = true;
					roads[i].Clone(roads[next]);
					roads[next].InsertPointAtTail(i);
				}
			}

			if (interFlag[k]) {state = false;break;}	//退出循环
		}

	}
	while (state);


	state = interFlag[k];
	interFlag = null;//delete [] interFlag;
	return state;	//返回是否找到 j.k 的线路
}

ComputeMgr.CreateEquation = function()
//根据线路信息,分群组建立方程
{
	/*int*/var group, i, j, k, size;
	/*CRUNMAP **/var nowMap;
	/*CRUNMAP **/var maps;

	//1 初始化maps---------------------------------------------------------
	//1.1 初始化每个group的crun成员个数
    var mapsSizeArray = new Array(ComputeMgr.groupCount);
    zeroArray(mapsSizeArray);
    for (i=ComputeMgr.crunCount-1; i>=0; --i) if (ComputeMgr.crun2[i].group >= 0)
		++ mapsSizeArray[ComputeMgr.crun2[i].group];

	ComputeMgr.maps = maps = new Array(ComputeMgr.groupCount);
	for (i=ComputeMgr.groupCount-1; i>=0; --i)
	{
		maps[i] = CRUNMAP.CreateNew(mapsSizeArray[i]);
		maps[i].size = 0;
	}
	for (i=ComputeMgr.crunCount-1; i>=0; --i) if (ComputeMgr.crun2[i].group >= 0)
	{
		nowMap = maps[ComputeMgr.crun2[i].group];
		nowMap.crunOrderMap[nowMap.size] = i;
		++nowMap.size;
	}

	//1.2 初始化每个group的WmMgr.circu成员个数
	for (i=ComputeMgr.groupCount-1; i>=0; --i) maps[i].circuitCount = 0;
	for (i=ComputeMgr.circuitCount-1; i>=0; --i)
	{
		nowMap = maps[ComputeMgr.circu[i].from.group];
		ComputeMgr.circu[i].indexInGroup = nowMap.circuitCount;
		++nowMap.circuitCount;
	}

	//1.3 初始化每个group的direct成员个数
	for (group=ComputeMgr.groupCount-1; group>=0; --group)
	{
		nowMap = maps[group];
		size = nowMap.size;

		for (j=size-2; j>=0; --j) for (k=size-1; k>j; --k)
		{
			i = CONVERT(j, k, size);
			nowMap.direct[i] = GetCrun2ConnectNum(nowMap.crunOrderMap[j], nowMap.crunOrderMap[k]);
		}
	}

	//1.4  初始化连接2个结点的第一个线路
	for (group=ComputeMgr.groupCount-1; group>=0; --group)
	{
		nowMap = maps[group];
		size = nowMap.size;

		for (j=size-2; j>=0; --j) for (k=size-1; k>j; --k)
		{
			i = CONVERT(j, k, size);
            var crunfc = GetCrun2FirstCircu(nowMap.crunOrderMap[j], nowMap.crunOrderMap[k]);
			nowMap.firstCircuit[i] = crunfc.c;
            nowMap.dir[i] = crunfc.dir;
		}
	}


	//2	2个结点之间有>=2条直接连接的线路,	-----------------------------
	//	他们之间形成环路,得到部分方程		-----------------------------
	/*double **/var outPutBuf;	//输出到方程的缓存数组
	/*double*/var saveForBuf;	//保存部分数据
	/*CRUN2 **/var crunNum1, crunNum2;
	/*int*/var connect, firstConnect, nextConnect;

	ComputeMgr.equation = new Array(ComputeMgr.groupCount);	//申请指针
	for (group=ComputeMgr.groupCount-1; group>=0; --group)
	{
		nowMap = maps[group];
		size = nowMap.size;

		outPutBuf = new Array(nowMap.circuitCount+1);	//初始化输出到方程的数组
		ComputeMgr.equation[group] = Equation.CreateNew(size, nowMap.circuitCount);	//初始化方程类

		for (j=size-2; j>=0; --j) for (k=size-1; k>j; --k)
		{
			ZeroArray(outPutBuf);	//缓存清零
			i = CONVERT(j, k, size);
			if (nowMap.direct[i] < 2) continue;

			crunNum1 = ComputeMgr.crun2[nowMap.crunOrderMap[j]];
			crunNum2 = ComputeMgr.crun2[nowMap.crunOrderMap[k]];
			firstConnect = nowMap.dir[i];	//第一个连线

			//获取并保存部分线路数据
			if (crunNum1.c[firstConnect].from == crunNum2)
			{
				outPutBuf[crunNum1.c[firstConnect].indexInGroup] =
					-crunNum1.c[firstConnect].resistance;
				saveForBuf = -crunNum1.c[firstConnect].pressure;
			}
			else
			{
				outPutBuf[crunNum1.c[firstConnect].indexInGroup] =
					crunNum1.c[firstConnect].resistance;
				saveForBuf = crunNum1.c[firstConnect].pressure;
			}
			nextConnect = firstConnect + 1;

			//2个结点之间有>=2条直接连接的线路,他们之间形成环路,得到部分方程
			for (connect=nowMap.direct[i]-2; connect>=0; --connect)
			{
				//1,寻找下一个连接的线路
				while (	crunNum1.c[nextConnect] == null
						|| 
						(	crunNum1.c[nextConnect].to != crunNum2 
							&& 
							crunNum1.c[nextConnect].from != crunNum2
						)
					 )
					++ nextConnect;

				//2,将电阻,电压计入
				outPutBuf[nowMap.circuitCount] = saveForBuf;	//写入保存的数据
				if (crunNum1.c[nextConnect].from == crunNum2)
				{
					outPutBuf[crunNum1.c[nextConnect].indexInGroup] =
						crunNum1.c[nextConnect].resistance;
					outPutBuf[nowMap.circuitCount] += 
						crunNum1.c[nextConnect].pressure;
				}
				else
				{
					outPutBuf[crunNum1.c[nextConnect].indexInGroup] =
						- crunNum1.c[nextConnect].resistance;
					outPutBuf[nowMap.circuitCount] -= 
						crunNum1.c[nextConnect].pressure;
				}

				//3,输入方程
				ComputeMgr.equation[group].InputARow(outPutBuf);

				//4,恢复
				outPutBuf[crunNum1.c[nextConnect].indexInGroup] = 0;

				//5,下一个
				++ nextConnect;
			}
		}

		outPutBuf = null;//delete [] outPutBuf;	//释放缓存
	}//for (group


	//3 仅包含一个结点的环路,直接计算结果放入方程  ----------------------
	for (i=ComputeMgr.circuitCount-1; i>=0; --i) if (ComputeMgr.circu[i].from == ComputeMgr.circu[i].to)
	{
		//初始化缓存
		group  = ComputeMgr.circu[i].from.group;
		nowMap = maps[group];
		outPutBuf = new Array(nowMap.circuitCount+1);	//输出到方程的缓存
		ZeroArray(outPutBuf);	//缓存清零

		if (IsFloatZero(ComputeMgr.circu[i].resistance) && IsFloatZero(ComputeMgr.circu[i].pressure))
		{//电阻电压都是0;设电阻为1,电压为0
			outPutBuf[ComputeMgr.circu[i].indexInGroup]	= 1;
			outPutBuf[nowMap.circuitCount]		= 0;
		}
		else
		{//正常情况或短路情况
			outPutBuf[ComputeMgr.circu[i].indexInGroup]	= ComputeMgr.circu[i].resistance;
			outPutBuf[nowMap.circuitCount]		= ComputeMgr.circu[i].pressure;
		}

		ComputeMgr.equation[group].InputARow(outPutBuf);	//输入方程的一行

		outPutBuf = null;//delete [] outPutBuf;	//释放缓存
	}


	//4	有直接线路连接的2个结点, 形成一个环路，		---------------------
	//	该环路包含一次这个连接它们的线路,			---------------------
	//	由环路信息得出方程 .						---------------------
	for (group=ComputeMgr.groupCount-1; group>=0; --group)
	{
		nowMap = maps[group];
		size = nowMap.size;
		outPutBuf = new Array(nowMap.circuitCount+1);	//输出到方程的缓存
		/*ROAD **/var roads ;

		for (j=size-2; j>=0; --j) for (k=size-1; k>j; --k)
		{
			//初始化
			i = CONVERT(j, k, size);
			if (nowMap.direct[i] <= 0) continue;
			
			roads = genrateArrayWithElementInitFunc(ROAD.CreateNew, size);
			ZeroArray(outPutBuf);	//缓存清零

			//获得路径,建立方程
			if (FindRoad(nowMap, roads, j, k))	//有路径得到方程的一行
			{
				/*ROADSTEP **/var prep = roads[k].first;
				/*ROADSTEP **/var nowp;

				if (prep == null) continue;	//出错

				nowp = prep.next;
				PutIntoBuf(j, prep.crunIndex, nowMap, outPutBuf);

				while (nowp != null)
				{
					PutIntoBuf(prep.crunIndex, nowp.crunIndex, nowMap, outPutBuf);

					//下一个
					prep = nowp;
					nowp = nowp.next;
				}

				PutIntoBuf(prep.crunIndex, k, nowMap, outPutBuf);

				PutIntoBuf(k, j, nowMap, outPutBuf);	//最后加入j到k的第一个线路

				ComputeMgr.equation[group].InputARow(outPutBuf);	//输入方程
			}
			else if (1 == nowMap.direct[i])	//没有路径,该导线电流是0
			{
				//导线电流设为0
				outPutBuf[nowMap.firstCircuit[i].indexInGroup] = 1;
				outPutBuf[nowMap.circuitCount] = 0;

				ComputeMgr.equation[group].InputARow(outPutBuf);	//输入方程
			}

			roads = null;//delete [] roads;
		}

		outPutBuf = null;//delete [] outPutBuf;	//释放缓存
	}//for (group


	//5形成结点方程------------------------------------------------------
	for (group=ComputeMgr.groupCount-1; group>=0; --group)
	{
		nowMap = maps[group];
		size = nowMap.size;
		outPutBuf = new Array(nowMap.circuitCount+1);	//输出到方程的缓存

		for (k=size-2; k>=0; --k)	//只需输入k-1个结点方程
		{
			ZeroArray(outPutBuf);	//缓存清零
			if (CreateCrunEquation(ComputeMgr.crun2[nowMap.crunOrderMap[k]], outPutBuf))	//建立方程
				ComputeMgr.equation[group].InputARow(outPutBuf);	//输入方程
		}

		outPutBuf = null;//delete [] outPutBuf;	//释放缓存
	}
};

ComputeMgr.TravelCircuitPutElec = function(/*Pointer */now,
									/*const CRUN * */last,
									/*int */dir,
									/*double */elec,
									/*ELEC_STATE */flag)
//从指定物体遍历,将线路电流赋值到物体上
{
	/*Pointer*/var pre;

	do
	{
		pre = now;

		if (now.hasOwnProperty("resist"))	//控件
		{
			if (NORMALELEC == flag) //正常线路
			{
				now.elec	= elec;
				now.elecDir	= (1-dir);	//方向相反
			}
			else	//不正常线路
			{
				now.elecDir = flag;
			}

			//到下一个物体
			now = pre.lead[dir];
			dir = true1AndFalse0(now.conBody[0].p == pre);
		}
		else	//导线,到下一个物体
		{
			if (NORMALELEC == flag) //正常线路
			{
				now.elec	= elec;
				now.elecDir	= (1-dir);	//方向相反
			}
			else	//不正常线路
			{
				now.elecDir = flag;
			}

			now = now.conBody[dir].p;
			if (IsOnCrun(now))	//遇到终点(last结点)结束
			{
				if (now == last) break;	//到达终点
				else //跳过,相当于导线
				{
					//找到结点连接的另一个导线
					for (dir=0; dir<4; ++dir)
						if (now.lead[dir]!=null && pre != now.lead[dir]) break;
					//指针指向结点连接的另一个导线
					pre = now;
					now = pre.lead[dir];
					dir = true1AndFalse0(now.conBody[0].p == pre);
				}
			}
			else if (IsOnLead(now))
			{
				throw "2个导线直接连接出现会引起错误 !";
			}
			else //now.IsOnBody
			{
				dir = true1AndFalse0(now.lead[0] == pre);
			}
		}
	}//do
	while (!IsOnCrun(now) || now != last);	//遇到终点(last结点)结束
};

ComputeMgr.TravelCircuitFindOpenBody = function(/*Pointer */now, /*int */dir)
//从指定物体遍历,将断路物体设置电流断路
//终点条件:断路控件,连接数不等于2的结点
{
	/*const Pointer*/var first = now;
	/*Pointer*/var pre;

	do
	{
		pre = now;

		if (now.hasOwnProperty("resist"))	//控件
		{
			//输入电流
			now.elecDir = OPENELEC;
			now.elec = 0;

			//到下一个物体
			now = pre.lead[dir];
			if (now == null) break;	//结束遍历
			dir = true1AndFalse0(now.conBody[0].p == pre);
		}
		else	//导线,到下一个物体
		{
			//输入电流
			now.elecDir = OPENELEC;
			now.elec = 0;

			now = now.conBody[dir].p;
			if (IsOnCrun(now))	//遇到终点(last结点)结束
			{
				if (2 != now.GetConnectNum())	//到达终点
				{
					break;
				}
				else //跳过,相当于导线
				{
					//找到结点连接的另一个导线
					for (dir=0; dir<4; ++dir)
						if (now.lead[dir]!=null && pre != now.lead[dir]) break;
					//指针指向结点连接的另一个导线
					pre = now;
					now = pre.lead[dir];
					dir = true1AndFalse0(now.conBody[0].p == pre);
				}
			}
			else if (IsOnLead(now))
			{
				throw "2个导线直接连接出现会引起错误";
			}
			else //now.IsOnBody()
			{
				dir = true1AndFalse0(now.lead[0] == pre);
			}
		}
	}//do
	while (now != first);	//遍历到终点
};

/*ELEC_STATE*/ComputeMgr.TravelCircuitGetOrSetInfo = function(/*Pointer */now, /*int */dir, /*double &*/elec, /*ELEC_STATE */flag)
//从指定物体遍历,获得电压和电阻信息,起点就是终点
//指定物体不能是线路中包含的结点,否则函数进入死循环
{
	/*double*/var press = 0;
	/*double*/var resist = 0;
	/*const Pointer*/var self = now;	//记录下起点
	/*Pointer*/var pre;
	if (IsOnCrun(now)) return ERRORELEC;	//指定物体不能是线路中包含的结点

	do
	{
		pre = now;

		if (now.hasOwnProperty("resist"))	//控件
		{
			if (UNKNOWNELEC == flag)	//获得电压电阻
			{
				resist	+= now.resist;
				press	+= now.GetPressure(1-dir);	//方向相反
			}
			else if (NORMALELEC == flag)	//放入正常电流信息
			{
				now.elecDir	= (1-dir);	//方向相反
				now.elec	= elec;
			}
			else	//放入不正常电流信息
			{
				now.elecDir = flag;
			}

			//到下一个物体
			now = pre.lead[dir]);
			if (now == null) return ERRORELEC;	//结束遍历,这种情况是错误
			dir = true1AndFalse0(now.conBody[0].p == pre);
		}
		else	//导线,到下一个物体
		{
			if (NORMALELEC == flag)	//放入正常电流信息
			{
				now.elecDir	= (1-dir);	//方向相反
				now.elec	= elec;
			}
			else if (UNKNOWNELEC != flag)	//放入不正常电流信息
			{
				now.elecDir = flag;
			}

			now = now.conBody[dir].p;
			if (IsOnCrun(now))	//此时结点一定连接2个导线,跳过,相当于导线
			{
				//找到结点连接的另一个导线
				for (dir=0; dir<4; ++dir)
					if (now.lead[dir]!=null && pre != now.lead[dir]) break;
				//指针指向结点连接的另一个导线
				pre = now;
				now = pre.lead[dir];
				dir = true1AndFalse0(now.conBody[0].p == pre);
			}
			else if (IsOnLead(now))
			{
				throw "2个导线直接连接出现会引起错误";
			}
			else	//now.IsOnBody
			{
				dir = true1AndFalse0(now.lead[0] == pre);
			}
		}
	}//do
	while (now!=self);	//遍历到终点

	if (UNKNOWNELEC == flag)	//获得电压电阻
	{
		if (!IsFloatZero(resist))	//正常--电阻不是0
		{
			elec = press/resist;
			return NORMALELEC;
		}
		else if (IsFloatZero(press))	//正常--电阻电压都是0
		{
			elec = 0;
			return NORMALELEC;
		}
		else	//短路
		{
			elec = 0;
			return SHORTELEC;
		}
	}

	return NORMALELEC;
};

ComputeMgr.DistributeAnswer = function()
//将计算的电流结果分布到每个导线,控件
{
	/*int*/var i;			//循环变量
	/*int*/var dir;		//下一个物体在当前物体的方向
	/*Pointer*/var now;	//当前访问的线路控件
	/*CRUN **/var end;		//线路的终点
	/*double*/var elec;

	//1,初始化每个导线和电学元件的elecDir,当做标记使用
	for (i=leadNum-1; i>=0; --i) lead[i].elecDir = UNKNOWNELEC;
	for (i=ctrlNum-1; i>=0; --i) ctrl[i].elecDir = UNKNOWNELEC;

	//2,将WmMgr.circu的结果分布到每个线路中的物体
	for (i=ComputeMgr.circuitCount-1; i>=0; --i)
	{
		//1,找到线路的起点,end做临时变量
		end = crun[indexOfArray(ComputeMgr.crun2, ComputeMgr.circu[i].from)];
		now = end.lead[ComputeMgr.circu[i].dirFrom];

		//2,确定查找方向,end做临时变量
		dir = true1AndFalse0(now.conBody[0].p == end);

		//3,找到线路的终点,end存放终点结点指针
		end = crun[indexOfArray(ComputeMgr.crun2, ComputeMgr.circu[i].to)];

		//4,遍历线路
		TravelCircuitPutElec(now, end, dir, ComputeMgr.circu[i].elec, ComputeMgr.circu[i].elecDir);
	}

	//清除WmMgr.circu,ComputeMgr.crun2的内存
	ComputeMgr.circu = null;
	ComputeMgr.circuitCount = 0;
	ComputeMgr.crun2 = null;

	//3,找到孤立控件,将电流信息设置为断路
	for (i=ctrlNum-1; i>=0; --i) if (!ctrl[i].lead[0] && !ctrl[i].lead[1])
	{
		ctrl[i].elecDir = OPENELEC;
		ctrl[i].elec = 0;
	}

	//4,找到一端有连接的控件,将连接的所有断路物体电流信息设置好
	//思路:(每一步遍历都将断路信息写入)
	//		1,找到断路物体
	//		2,遍历到终点(终点条件:断路控件,连接数不等于2的结点)
	for (i=ctrlNum-1; i>=0; --i) if (1 == ctrl[i].GetConnectNum())
	{
		//1,找到线路的起点
		now = ctrl[i];

		//2,确定查找方向
		dir = true1AndFalse0(now.lead[1] != null);

		//3,遍历线路
		TravelCircuitFindOpenBody(now, dir);
	}
	for (i=ComputeMgr.crunCount-1; i>=0; --i) if (1 == crun[i].GetConnectNum())
	{
		//1,找到线路的起点
		for (dir=0;dir<4;dir++) if (crun[i].lead[dir]) break;
		now = crun[i].lead[dir];

		//2,确定查找方向
		dir = true1AndFalse0(now.conBody[0].p == crun[i]);

		//3,遍历线路
		TravelCircuitFindOpenBody(now, dir);
	}

	//5,对于UNKNOWNELEC == elecDir,而且控件是两边都有连接,但是resist<0
	//	出现这种情况的原因:线路中有断路元件(比如电容器),但是线路连接完好
	//	遍历断路电路,把断路信息写入物体
	for (i=ctrlNum-1; i>=0; --i)
	{
		if (UNKNOWNELEC != ctrl[i].elecDir || ctrl[i].resist >= 0) continue;

		//1,设置线路的起点
		now = ctrl[i];

		//2,从2个方向遍历
		TravelCircuitFindOpenBody(now, 0);
		TravelCircuitFindOpenBody(now, 1);
	}

	//6,对于 UNKNOWNELEC == elecDir的物体,计算电流和方向
	//出现这种情况的原因:线路中没有节点,是由导线和电学元件连接的环路
	//思路 :(每一步都要记录下走过的电阻和电压,因为需要计算)
	// 1 从物体左边开始找,一直找到自己停止
	// 2 计算电流大小,重新遍历一遍,把信息放入到物体中
	for (i=ctrlNum-1; i>=0; --i)
	{
		if (UNKNOWNELEC != ctrl[i].elecDir) continue;

		//1,设置线路的起点
		now = ctrl[i];

		//2,从左边遍历,获得电阻和电压
		dir = TravelCircuitGetOrSetInfo(now, 0, elec, UNKNOWNELEC);

		//3,把结果放入物体
		if (ERRORELEC == dir)
		{
			throw "计算电流出现错误!!!";
		}
		else
		{
			if (NORMALELEC == dir && elec < 0)
			{
				//电流改为正数,调转遍历方向
				elec = -elec;
				TravelCircuitGetOrSetInfo(now, 1, elec, dir);
			}
			else 
			{
				TravelCircuitGetOrSetInfo(now, 0, elec, dir);
			}
		}
	}

	//7,对于线路中只存在: 若干(导线) 和 若干(2端连接导线的结点), 将电流设置为0
	//	出现这种情况的原因:线路没有超过3端连线的节点,不会加入到线路列表中
	//	线路有没有短路,前面也不会检查到;第六步只检查控件也不会检查到
	for (i=leadNum-1; i>=0; --i) if (UNKNOWNELEC == lead[i].elecDir)
	{
		lead[i].elecDir = LEFTELEC;
		lead[i].elec = 0;
	}
};

ComputeMgr.ComputeElec = function()
//由形成的n元1次方程计算各个线路电流值
{
	/*int*/var group;
	/*int*/var i;
	/*ELEC_STATE*/var flag;
	/*const double **/var ans;

	ClearCircuitState();	//清除电路状态信息
	CollectCircuitInfo();	//遍历一次电路,获得每个群组的线路电学信息
	CreateEquation();		//根据线路信息,分群组建立方程

	for (group=0; group<ComputeMgr.groupCount; ++group)	//分群组计算
	{
		flag = ComputeMgr.equation[group].Count();	//计算方程

		if (NORMALELEC == flag)	//线路正常
		{
			ans = ComputeMgr.equation[group].GetAnswer();	//获得结果数组指针
			for (i=ComputeMgr.circuitCount-1; i>=0; --i) if (group == ComputeMgr.circu[i].from.group)
			{
				ComputeMgr.circu[i].elecDir = NORMALELEC;
				ComputeMgr.circu[i].elec = ans[ComputeMgr.circu[i].indexInGroup];
				ComputeMgr.circu[i].ConvertWhenElecLessZero();	//当电流负数时改为正数,并调转电流方向
			}
		}
		else	//短路或无法确定电流
		{
			for (i=ComputeMgr.circuitCount-1; i>=0; --i) if (group == ComputeMgr.circu[i].from.group)
			{
				ComputeMgr.circu[i].elecDir = flag;
			}
		}

		ComputeMgr.maps[group] = null;//ComputeMgr.maps[group].Uninit();	//删除一个线路图
		ComputeMgr.equation[group] = null;//delete ComputeMgr.equation[group];	//删除一个方程
	}

	ComputeMgr.maps = null;//delete [] ComputeMgr.maps;		//删除线路图数组
	ComputeMgr.equation = null;//delete [] ComputeMgr.equation;	//删除方程数组指针
	DistributeAnswer();	//将结果分布到每个物体,函数中释放了WmMgr.circu和WmMgr.crun2
};
