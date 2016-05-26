//结点类
var CRUN = {
	//节点全局初始化次序
	globalInitOrder: 1,
	//重置全局初始化次序
	ResetGlobalInitNum: function() {
		return (globalInitOrder = 1);
	}

	CreateNew: function(memIdx, x, y) {
		var initOrder = globalInitOrder++;
		var newObj = {
			initOrder : initOrder,		//初始化序号
			index : memIdx,				//在节点数组中序号
			isPaintName : false,		//默认不显示结点标签
			name : "Crun" + initOrder,	//默认名称
			x:x, y:y,					//坐标
			lead:[-1,-1,-1,-1]			//结点连接导线的位置,0↑,1↓,2←,3→*/
		};
        return newObj;
	}

	//保存结点信息到文件
	SaveToFile: function(fp) {
		/*int*/var j, t;
		ASSERT(fp != NULL);

		fwrite(&coord, sizeof(POINT), 1, fp);
		fwrite(&isPaintName, sizeof(bool), 1, fp);
		fwrite(name, 1, NAME_LEN, fp);

		for(j=0; j<4; ++ j)
		{
			if(lead[j])
				t = lead[j]->index;
			else
				t = -1;
			fwrite(&t, sizeof(int), 1, fp);
		}
	}

	void CRUN::ReadFromFile(FILE * fp, LEAD ** allLead)
	//从文件读取结点信息
	{
		int j, t;
		ASSERT(fp != NULL);

		fread(&coord, sizeof(POINT), 1, fp);
		fread(&isPaintName, sizeof(bool), 1, fp);
		fread(name, 1, NAME_LEN, fp);

		for(j = 0; j < 4; ++ j)
		{
			fread(&t, sizeof(t), 1, fp);
			if(t >= 0 && t < MAXLEADNUM)
				lead[j] = allLead[t];
			else 
				lead[j] = NULL;
		}
	}

	int CRUN::At(POINT p)const
	//获得鼠标在结点的位置
	{
		int dis, disBetweenCenter;

		disBetweenCenter = (p.x-coord.x)*(p.x-coord.x)+(p.y-coord.y)*(p.y-coord.y);
		if(disBetweenCenter > 4 * DD * DD) return 0;	//距离点远,不可能在旁边的连接点

		dis = (p.x-coord.x)*(p.x-coord.x)+(p.y-coord.y+DD)*(p.y-coord.y+DD);
		if(dis <= DD)	//在上连接点
		{
			if(lead[0] != NULL) return -1;
			else return 1;
		}

		dis = (p.x-coord.x)*(p.x-coord.x)+(p.y-coord.y-DD)*(p.y-coord.y-DD);
		if(dis <= DD)	//在下连接点
		{
			if(lead[1] != NULL) return -1;
			else return 2;
		}

		dis = (p.x-coord.x+DD)*(p.x-coord.x+DD)+(p.y-coord.y)*(p.y-coord.y);
		if(dis <= DD)	//在左连接点
		{
			if(lead[2] != NULL) return -1;
			else return 3;
		}

		dis = (p.x-coord.x-DD)*(p.x-coord.x-DD)+(p.y-coord.y)*(p.y-coord.y);
		if(dis <= DD)	//在右连接点
		{
			if(lead[3] != NULL) return -1;
			else return 4;
		}

		if(disBetweenCenter <= DD * DD) return -1;//在点上

		return 0;
	}

	CRUN * CRUN::Clone(CLONE_PURPOSE cp)const
	//拷贝控件结点信息到新的结点
	{
		CRUN * newCrun = new CRUN(index, coord);
		strcpy(newCrun->name, name);

		if(CLONE_FOR_USE != cp)
		{
			newCrun->initOrder = this->initOrder;
			--globalInitOrder;
		}
		return newCrun;
	}

	void CRUN::GetDataList(LISTDATA * list)const
	//和CProperty交互
	{
		list->Init(2);
		list->SetAMember(DATA_STYLE_LPCTSTR, TITLE_NOTE, (void *)name);
		list->SetAMember(DATA_STYLE_bool, TITLESHOW_NOTE, (void *)(&isPaintName));
	}

	int CRUN::GetDirect(const LEAD * l)const
	//寻找导线在哪个方向
	{
		for(int i=0; i<4; ++i) if(lead[i] == l) return i;
		return -1;	//没有找到
	}

	int CRUN::GetConnectNum()const
	//获得连接了几个导线
	{
		return  (lead[0] != NULL) + 
				(lead[1] != NULL) + 
				(lead[2] != NULL) + 
				(lead[3] != NULL);
	}
};