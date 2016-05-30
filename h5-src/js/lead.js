
//导线类
var LEAD = {
	
	//全局初始化次序
	globalInitOrder: 1,
	//重置全局初始化次序
	ResetGlobalInitNum: function() {
		return (LEAD.globalInitOrder = 1);
	},


	CreateNew: function(memberIdx, color, p1, p2, isInit) {
		var initOrder = CRUN.globalInitOrder++;
		
		var newObj = {
			initOrder : initOrder,		//初始化序号
			index : memberIdx,			//在数组中序号
			
			color : color,
			elecDir : UNKNOWNELEC,	//电流方向
			coord : new Array(),
			conBody : new Array(null, null)
		};
		
		if (isInit) {
			newObj.conBody[0] = p1;	//连接物体
			newObj.conBody[1] = p2;	//连接物体
			RefreshPos();		//更新坐标链表
		}
		
		return newObj;
	},

	Clone: function(clonePurpose) {
		var newLead = LEAD.CreateNew(index, color, conBody[0], conBody[1], false);

		//复制坐标
		newLead.coord = deepCopy(this.coord);

		if (CLONE_FOR_USE != clonePurpose) {
			newLead.initOrder = this.initOrder;
			--LEAD.globalInitOrder;
		}
		return newLead;
	},
	
	//保存信息到json
	GenerateStoreJsonObj: function() {
		return {
			color : color,
			coord : deepCopy(this.coord),
			conBody  : new Array(conBody[0].GenerateStoreJsonObj(), conBody[1].GenerateStoreJsonObj())
		};
	},
	//从json读取信息
	ReadFromStoreJsonObj: function(jsonObj, leadList, crunList, ctrlList) {
		ASSERT(jsonObj!=null && leadList!=null && crunList!=null && ctrlList!=null);

		this.color = jsonObj.color;
		this.coord = deepCopy(jsonObj.coord);
		this.conBody[0] = Pointer.ReadFromStoreJsonObj(jsonObj, leadList, crunList, ctrlList);
		this.conBody[1] = Pointer.ReadFromStoreJsonObj(jsonObj, leadList, crunList, ctrlList);
	},

	//获得导线两个连接物体的相对位置
	//字节最后一位:
	//			0 起点物体 在 终点物体 上面
	//			1 起点物体 在 终点物体 下面
	//字节倒数第二位:
	//			0 起点物体 在 终点物体 左面
	//			1 起点物体 在 终点物体 右面
	GetBodyPos: function() {
		var a = conBody[0].p;
		var b = conBody[1].p;

		return ((a.x > b.x) << 1) + (a.y > b.y);
	},

	//与CProperty交换信息
	GetDataList: function(list, name) {
		list.Init(this, 1);
		list.SetAEnumMember(name, "color");
	},

	//粗糙的初始化导线坐标
	EasyInitPos: function(from, to) {
		//释放坐标占用空间
		this.coord.length = 0;

		//起始坐标
		coord.push({x:from.x, y:from.y});

		//中间点坐标
		if (from.x != to.x && from.y != to.y) {
			coord.push({x:from.x, y:to.y});
		}

		//终点坐标
		coord.push({x:to.x, y:to.y});
	},

	//导线坐标一分为二
	Divide: function(int atState, pos, leadCoord) {
		ASSERT(atState <= -2);
		atState = (-atState - 2) >> 1;

		if (this.coord.length < atState+2)
			return false;
		
		// 获得连接点坐标
		var nowPos = this.coord[atState];
		var nownext1Pos = this.coord[atState+1];
		var dividePos = {x:pos.x, y:pos.y};
		if (nowPos.x == nownext1Pos.x)	//在竖线上
			dividePos.x = nowPos.x;
		else	//在横线上
			dividePos.y = nowPos.y;
		
		// 前半段
		leadCoord.first = new Array();
		for (var i=0; i<=atState; ++i) {
			leadCoord.first.push({x:this.coord[i].x, y:this.coord[i].y});
		}
		leadCoord.first.push({x:dividePos.x, y:dividePos.y});
		
		// 后半段
		leadCoord.second = new Array();
		leadCoord.second.push({x:dividePos.x, y:dividePos.y});
		for (var i=atState+1; i<this.coord.length; ++i) {
			leadCoord.second.push({x:this.coord[i].x, y:this.coord[i].y});
		}

		//销毁导线坐标
		this.coord.length = 0;

		return true;
	},

	//替换原来的坐标
	ReplacePos: function(newPosArray) {
		this.coord.length = 0;
		this.coord = newPosArray;
	},

	//获得鼠标在导线的位置 : -3,-5,-7,...横线部分; -2,-4,-6,...竖线部分; 0不在.
	At: function(xPos, yPos) {
		var min, max;
		var i = -2;

		var nowIndex = 1;
		var pre = this.coord[nowIndex-1];
		var now = this.coord[nowIndex];
		while (nowIndex < this.coord.length) {
			if (pre.x == now.x) {	//在竖线上
				if (now.y > pre.y) {
					min = pre.y; 
					max = now.y;
				} else {
					min = now.y; 
					max = pre.y;
				}
				if (yPos > min 
					&& yPos < max 
					&& xPos > now.x - DD 
					&& xPos < now.x + DD)
					return i;
			} else {	//在横线上
				if (now.x > pre.x) {
					min = pre.x; 
					max = now.x;
				} else {
					min = now.x; 
					max = pre.x;
				}
				if (xPos > min 
					&& xPos < max 
					&& yPos > now.y - DD
					&& yPos < now.y + DD)
					return i-1;
			}

			pre = now;
			++nowIndex;
			now = this.coord[nowIndex];
			
			i -= 2;
		}

		return 0;
	},

	//删除有相同坐标的导线结点
	CleanLead: function() {
		if (this.coord.length <= 2) return;	//只有2个节点的导线不考虑
		
		var p1 = this.coord[0];
		var p2 = this.coord[1];
		var p3 = this.coord[2];
		var currentIndex = 2;

		if (p1.x == p2.x && p1.y == p2.y) {	// leave out p2
			var newCoord = new Array();
			for (var i=0; i<currentIndex-1; ++i)
				newCoord.push(this.coord[i]);
			for (var i=currentIndex; i<this.coord.length; ++i)
				newCoord.push(this.coord[i]);
			this.coord = newCoord;
			return;
		}
		while (true) {
			if (p2.x == p3.x && p2.y == p3.y) {
				if (currentIndex+1 < this.coord.length) {	// leave out p2,p3
					var newCoord = new Array();
					for (var i=0; i<currentIndex-1; ++i)
						newCoord.push(this.coord[i]);
					for (var i=currentIndex+1; i<this.coord.length; ++i)
						newCoord.push(this.coord[i]);
					this.coord = newCoord;
					return;
				} else {	// leave out p3
					--this.coord.length;
					return;
				}
			}

			++currentIndex;
			if (currentIndex >= this.coord.length) break;
			p1 = p2;
			p2 = p3;
			p3 = this.coord[currentIndex];
		}
	},

	// static函数, 不需要this对象
	//在2段平行导线之间或两边找到合适的另一个平行导线的位置
	GetPosFit: function(pos1, pos2, dis, isEnd) {
		int dis2 = -2;
		if (isEnd) dis2 = 2;

		if (pos2 - pos1 > dis || pos1 - pos2 > dis) {
			return (pos2 + pos1)/2 + dis2;
		} else if (pos1 < 300) {
			if (pos2 >= pos1)
				return pos2 + dis + dis2;
			else
				return pos1 + dis + dis2;
		} else {
			if (pos2 <= pos1)
				return pos2 - dis - dis2;
			else
				return pos1 - dis - dis2;
		}
	},

	//使导线不遮挡连接的第1个物体
	FitStart: function(dis) {
		ASSERT(this.coord.length >= 2);
		
		//初始化变量 -------------------------------------------------------
		var dir = conBody[0].GetConnectPosDir();
		var dirSum = dir + conBody[1].GetConnectPosDir();
		
		var oppositeFlag = (dirSum == 3 || dirSum == 7);
		var dis2 = 15;
		if (dir & 1 != 0) dis2 = -15;
		
		var next1 = coord[1];
		var next2 = null;
		if (this.coord.length >= 3)
			next2 = coord[2];
		
		var theLast;

		//判断执行条件 -----------------------------------------------------
		switch (dir) {
		case 1:	//上连接点
			if (this.coord[0].x != next1.x || this.coord[0].y >= next1.y)
				return;
			break;
		case 2:	//下连接点
			if (this.coord[0].x != next1.x || this.coord[0].y <= next1.y)
				return;
			break;
		case 3:	//左连接点
			if (this.coord[0].y != next1.y || this.coord[0].x >= next1.x)
				return;
			break;
		case 4:	//右连接点
			if (this.coord[0].y != next1.y || this.coord[0].x <= next1.x)
				return;
			break;
		}

		//导线只有2个节点 ---------------------------------------------------
		if (this.coord.length == 2) {
			switch (dir) {
			case 1:	//上连接点
			case 2:	//下连接点
				this.coord.length = 1;
				
				theLast = this.coord[0];
				this.coord.push({x:theLast.x, y:theLast.y + dis2});
				theLast = this.coord[1];
				this.coord.push({x:theLast.x - dis, y:theLast.y});
				theLast = this.coord[2];
				this.coord.push({x:theLast.x, y:theLast.y - dis2*2 + next1.y - this.coord[0].y});
				theLast = this.coord[3];
				this.coord.push({x:theLast.x + dis, y:theLast.y});
				this.coord.push(next1);
				return;

			case 3:	//左连接点
			case 4:	//右连接点
				this.coord.length = 1;
				
				theLast = this.coord[0];
				this.coord.push({y:theLast.y, x:theLast.x + dis2});
				theLast = this.coord[1];
				this.coord.push({y:theLast.y - dis, x:theLast.x});
				theLast = this.coord[2];
				this.coord.push({y:theLast.y, x:theLast.x - dis2*2 + next1.x - this.coord[0].x});
				theLast = this.coord[3];
				this.coord.push({y:theLast.y + dis, x:theLast.x});
				this.coord.push(next1);
				return;
			}
		}
		
		//导线只有3个节点 ---------------------------------------------------
		else if (this.coord.length == 3) {
			if (oppositeFlag) {
				switch (dir) {
				case 1:	//上连接点
				case 2:	//下连接点
					this.coord.length = 1;
					
					theLast = this.coord[0];
					this.coord.push({x:theLast.x, y:theLast.y + dis2});
					theLast = this.coord[1];
					this.coord.push({x:GetPosFit(this.coord[0].x, next2.x, dis, false), y:theLast.y});
					theLast = this.coord[2];
					this.coord.push({x:theLast.x, y:next2.y - dis2});
					theLast = this.coord[3];
					this.coord.push({x:next2.x, y:theLast.y});
					this.coord.push(next2);
					return;

				case 3:	//左连接点
				case 4:	//右连接点
					this.coord.length = 1;
					
					theLast = this.coord[0];
					this.coord.push({y:theLast.y, x:theLast.x + dis2});
					theLast = this.coord[1];
					this.coord.push({y:GetPosFit(this.coord[0].y, next2.y, dis, false), x:theLast.x});
					theLast = this.coord[2];
					this.coord.push({y:theLast.y, x:next2.x - dis2});
					theLast = this.coord[3];
					this.coord.push({y:next2.y, x:theLast.x});
					this.coord.push(next2);
					return;
				}
			} else {
				switch (dir) {
				case 1:	//上连接点
				case 2:	//下连接点
					this.coord.length = 1;
					
					theLast = this.coord[0];
					this.coord.push({x:theLast.x, y:theLast.y + dis2});
					theLast = this.coord[1];
					this.coord.push({x:next2.x, y:theLast.y});
					this.coord.push(next2);
					return;

				case 3:	//左连接点
				case 4:	//右连接点
					this.coord.length = 1;
					
					theLast = this.coord[0];
					this.coord.push({y:theLast.y, x:theLast.x + dis2});
					theLast = this.coord[1];
					this.coord.push({y:next2.y, x:theLast.x});
					this.coord.push(next2);
					return;
				}
			}
		}
		
		//导线只有4个节点且连接点相对 ---------------------------------------
		else if (oppositeFlag && this.coord.length == 4) {
			var next3 = coord[3];
			switch (dir) {
			case 1:	//上连接点
			case 2:	//下连接点
				this.coord.length = 1;
				
				theLast = this.coord[0];
				this.coord.push({x:GetPosFit(theLast.x, next2.x, dis, false), y:theLast.y});
				
				theLast = this.coord[1];
				this.coord.push({x:theLast.x, y:next1.y});
				this.coord.push(next2);
				this.coord.push(next3);
				return;

			case 3:	//左连接点
			case 4:	//右连接点
				this.coord.length = 1;
				
				theLast = this.coord[0];
				this.coord.push({y:GetPosFit(theLast.y, next2.y, dis, false), x:theLast.x});
				
				theLast = this.coord[1];
				this.coord.push({y:theLast.y, x:next1.x});
				this.coord.push(next2);
				this.coord.push(next3);
				return;
			}
		}
		
		// (导线至少有5个节点) or (导线至少有4个节点 and 连接点不相对) ------
		else {
			switch (dir) {
			case 1:	//上连接点
			case 2:	//下连接点
				next2.y = next1.y = this.coord[0].y + dis2;
				return;

			case 3:	//左连接点
			case 4:	//右连接点
				next2.x = next1.x = this.coord[0].x + dis2;
				return;
			}
		}
	},

	//使导线不遮挡连接的第2个物体
	FitEnd: function(dis) {
		ASSERT(this.coord.length >= 2);
		
		//初始化变量 -------------------------------------------------------
		var dir = conBody[1].GetConnectPosDir();
		var dirOther = conBody[0].GetConnectPosDir();
		int dis2 = 15;
		if ((dir & 1) != 0) dis2 = -15;

		var pre2 = null;
		if (this.coord.length >= 3)
			pre2 = this.coord[this.coord.length-3];
		var pre1 = this.coord[this.coord.length-2];
		var now = this.coord[this.coord.length-1];
		
		var next1 = this.coord[1];
		var next2 = null;
		if (this.coord.length >= 3)
			next2 = this.coord[2];
		
		var theLast;

		//判断执行条件 -----------------------------------------------------
		switch (dir) {
		case 1:	//上连接点
			if (now.x != pre1.x || now.y >= pre1.y)
				return;
			break;
		case 2:	//下连接点
			if (now.x != pre1.x || now.y <= pre1.y)
				return;
			break;
		case 3:	//左连接点
			if (now.y != pre1.y || now.x >= pre1.x)
				return;
			break;
		case 4:	//右连接点
			if (now.y != pre1.y || now.x <= pre1.x)
				return;
			break;
		}

		//导线只有2个节点 ---------------------------------------------------
		if (this.coord.length == 2) {
			switch (dir) {
			case 1:	//上连接点
			case 2:	//下连接点
				this.coord.length = 1;
				
				theLast = this.coord[0];
				var tempX;
				if (dirOther == 4)
					tempX = theLast.x - dis;
				else
					tempX = theLast.x + dis;
				this.coord.push({x:tempX, y:theLast.y});
				
				theLast = this.coord[1];
				this.coord.push({x:theLast.x, y:next1.y + dis2});
				theLast = this.coord[2];
				this.coord.push({x:next1.x, y:theLast.y});
				this.coord.push(next1);
				return;

			case 3:	//左连接点
			case 4:	//右连接点
				this.coord.length = 1;
				
				theLast = this.coord[0];
				var tempY;
				if (dirOther == 2)
					tempY = theLast.y - dis;
				else
					tempY = theLast.y + dis;
				this.coord.push({y:tempY, x:theLast.x});
				
				theLast = this.coord[1];
				this.coord.push({y:theLast.y, x:next1.x + dis2});
				theLast = this.coord[2];
				this.coord.push({y:next1.y, x:theLast.x});
				this.coord.push(next1);
				return;
			}
		}

		//导线只有3个节点 ---------------------------------------------------
		else if (this.coord.length == 3) {
			switch (dir) {
			case 1:	//上连接点
			case 2:	//下连接点
				//next1.x
				if (dirOther == 4)
					next1.x = next2.x + dis;
				else if (dirOther == 3)
					next1.x = next2.x - dis;
				else
					next1.x = GetPosFit(this.coord[0].x, next2.x, dis, true);

				this.coord.length = 2;
				this.coord.push({x:next1.x, y:next2.y});
				this.coord.push(next2);
				return;

			case 3:	//左连接点
			case 4:	//右连接点
				//next1.y
				if (dirOther == 2)
					next1.y = next2.y + dis;
				else if (dirOther == 1)
					next1.y = next2.y - dis;
				else
					next1.y = GetPosFit(this.coord[0].y, next2.y, dis, true);

				this.coord.length = 2;
				this.coord.push({x:next2.x, y:next1.y});
				this.coord.push(next2);
				return;
			}
		}
		
		//导线只有4个节点 ----------------------------------------------
		else if (this.coord.length == 4) {
			switch (dir) {
			case 1:	//上连接点
			case 2:	//下连接点
				if (dirOther == 3 || dirOther == 4) {
					pre1.y = pre2.y = now.y + dis2;
				} else { //dir != dirOther
					this.coord.length = 3;
					
					temp = {y: now.y};
					next2.x = temp.x = GetPosFit(this.coord[0].x, next2.x, dis, true);
					this.coord.push(temp);
					this.coord.push(now);
				}
				return;

			case 3:	//左连接点
			case 4:	//右连接点
				if (dirOther == 1 || dirOther == 2) {
					pre1.x = pre2.x = now.x + dis2;
				} else { //dir != dirOther
					this.coord.length = 3;
					
					temp = {x: now.x};
					next2.y = temp.y = GetPosFit(this.coord[0].y, next2.y, dis, true);
					this.coord.push(temp);
					this.coord.push(now);
				}
				return;
			}
		}

		//导线至少有5个节点 --------------------------------------------
		else {
			switch (dir) {
			case 1:	//上连接点
			case 2:	//下连接点
				pre1.y = pre2.y = now.y + dis2;
				return;

			case 3:	//左连接点
			case 4:	//右连接点
				pre1.x = pre2.x = now.x + dis2;
				return;
			}
		}
	},

	//当新的导线位置覆盖连接的物体时,美化导线
	MakeFit: function() {
		ASSERT(coord.next != null);

		if (conBody[0].IsOnCrun()) {
			FitStart(DD*3);
		} else { //if (conBody[0].IsOnCtrl())
			FitStart(BODYSIZE.cx);
		}

		if (conBody[1].IsOnCrun()) {
			FitEnd(DD*3);
		} else { //if (conBody[1].IsOnCtrl())
			FitEnd(BODYSIZE.cx);
		}
	},

	//移动导线
	Move: function(dir, pos, dis) {
		var pre2 = null;
		var pre1 = this.coord[0];
		var now = this.coord[1];
		var next1 = null;
		var isNext1TheLast;
		var currentIndex = 1;
		
		int inter = 0;

		//1,找到指针----------------------------------
		int i = -2;
		while (true) {
			if (pre1.x == now.x) {	//在竖线上
				if (i == dir) break;
			} else {	//在横线上
				if (i-1 == dir) break;
			}
			
			++currentIndex;
			if (currentIndex >= this.coord.length) return false;	//没有找到
			
			pre2 = pre1;
			pre1 = now;
			now = this.coord.[currentIndex];
			
			i -= 2;
		}
		next1 = null;
		if (currentIndex+1 < this.coord.length)
			next1 = this.coord.[currentIndex+1];
		isNext1TheLast = (currentIndex+1 == this.coord.length-1);

		//2重新设置竖线坐标--------------------------
		if (pre1.x == now.x) {	//在竖线上
			if (pos.x == pre1.x) return false;	//无需改变

			//2.1处理pre是头.........................
			if (pre2 == null) {	//pre1是头
				if (next1 != null) {	//now不是结尾
					inter = pos.x - next1.x;
					if (inter < 0) inter = -inter;
				}

				if (next1 != null && inter <= dis) {	//now不是结尾
					if (!isNext1TheLast) {	//next1不是结尾
						next1.y = pre1.y;
						
						this.coord.splice(currentIndex, 1);	// 删除now
					} else {	//next1是结尾
						now.x = next1.x;
						now.y = pre1.y;
					}
				} else if (next1 != null) {	//now不是结尾
					var tmp = {x: pos.x, y: pre1.y};
					now.x = pos.x;
					this.coord.splice(currentIndex, 0, tmp);	// 在pre1后面插入tmp
				} else {	//now是结尾
					var tmp1  = {x: pos.x, y: pre1.y};
					var tmp2 = {x: pos.x, y: now.y};
					
					this.coord.splice(currentIndex, 0, tmp1, tmp2);	//在pre1后面插入元素
				}

				CleanLead(); return true;
			}//以下pre不是头

			//2.2处理now是结尾.........................
			if (next1 == null) {	//now是结尾
				inter = pos.x - pre2.x;
				if (inter < 0) inter = -inter;

				if (inter <= dis) {
					if (pre2 != coord[0]) {	//pre2不是头
						pre2.y = now.y;
						this.coord.splice(currentIndex-1, 1);	// 删除pre1
					} else {	//pre2是头
						pre1.x = pre2.x;
						pre1.y = now.y;
					}
				} else {
					pre1.x = pos.x;
					var tmp  = {x: pos.x, y: now.y};
					this.coord.splice(currentIndex-1, 0, tmp);	//在pre1后面插入元素
				}

				CleanLead(); return true;
			}//以下now不是结尾

			//2.3处理与前面合并..........................
			inter = pos.x - pre2.x;
			if (inter < 0) inter = -inter;

			if (inter <= dis) {	//导线合并
				if (pre2 != coord[0]) {	//pre2不是头
					pre2.y = next1.y;
					this.coord.splice(currentIndex-1, 2);	// 删除pre1,now
				} else {	//pre2是头
					now.x = pre2.x;

					if (now.x == next1.x && now.y == next1.y) {
						this.coord.splice(currentIndex-1, 2);	// 删除pre1,now
					} else  {
						this.coord.splice(currentIndex-1, 1);	// 删除pre1
					}
				}
				
				CleanLead(); return true;
			}

			//2.4处理与后面合并..........................
			inter = pos.x - next1.x;
			if (inter < 0) inter = -inter;

			if (inter <= dis) {	//导线合并
				if (!isNext1TheLast) {	//next1不是结尾
					next1.y = pre2.y;
					this.coord.splice(currentIndex-1, 2);	// 删除pre1,now
				} else {	//next1是结尾
					pre1.x = next1.x;
					this.coord.splice(currentIndex, 1);	// 删除now
				}
				CleanLead(); return true;
			}

			//2.5处理其他情况..........................
			now.x = pos.x;
			pre1.x = pos.x;
			CleanLead(); return true;

		}//重新设置竖线坐标

		//3重新设置横线坐标--------------------------
		if (pre1.y == now.y) {	//在横线上
			if (pos.y == pre1.y) return false;	//无需改变

			//3.1处理pre是头.........................
			if (pre2 == null) {	//pre是头
				if (next1 != null) {	//now不是结尾
					inter = pos.y - next1.y;
					if (inter < 0) inter = -inter;
				}

				if (next1 != null && inter <= dis) {	//now不是结尾
					if (!isNext1TheLast) {	//next1不是结尾
						next1.x = pre1.x;
						this.coord.splice(currentIndex, 1);	// 删除now
					} else {	//next1是结尾
						now.y = next1.y;
						now.x = pre1.x;
					}
				} else if (next1 != null) {	//now不是结尾
					now.y = pos.y;
					this.coord.splice(currentIndex-1, 0, {x:pre1.x, y:pos.y});	//在pre1后面插入元素
				} else {	//now是结尾
					this.coord.splice(currentIndex-1, 0, {x:pre1.x, y:pos.y}, {x:now.x, y:pos.y});	//在pre1后面插入元素
				}

				CleanLead(); return true;
			}//以下pre不是头

			//3.2处理now是结尾.........................
			if (next1 == null) {	//now是结尾
				inter = pos.y - pre2.y;
				if (inter < 0) inter = -inter;

				if (inter <= dis) {
					if (pre2 != &coord) {	//pre2不是头
						pre2.x = now.x;
						this.coord.splice(currentIndex-1, 1);	// 删除pre1
					} else {	//pre2是头
						pre1.y = pre2.y;
						pre1.x = now.x;
					}
				} else {
					pre1.y = pos.y;
					this.coord.splice(currentIndex-1, 0, {x:now.x, y:pos.y});	//在pre1后面插入元素
				}

				CleanLead(); return true;
			}//以下now不是结尾

			//3.3处理与前面合并..........................
			inter = pos.y - pre2.y;
			if (inter < 0) inter = -inter;

			if (inter <= dis) {	//导线合并
				if (pre2 != coord[0]) {	//pre2不是头
					pre2.x = next1.x;
					this.coord.splice(currentIndex-1, 2);	// 删除pre1,now
				} else {	//pre2是头
					now.y = pre2.y;
					
					if (now.x == next1.x && now.y == next1.y) {
						this.coord.splice(currentIndex-1, 2);	// 删除pre1,now
					} else {
						this.coord.splice(currentIndex-1, 1);	// 删除pre1
					}
				}

				CleanLead(); return true;
			}

			//3.4处理与后面合并..........................
			inter = pos.y - next1.y;
			if (inter < 0) inter = -inter;

			if (inter <= dis) {	//导线合并
				if (!isNext1TheLast) {	//next1不是结尾
					next1.x = pre2.x;
					this.coord.splice(currentIndex-1, 2);	// 删除pre1,now
				} else {	//next1是结尾
					pre1.y = next1.y;
					this.coord.splice(currentIndex, 1);	// 删除now
				}
				CleanLead(); return true;
			}

			//3.5处理其他情况..........................
			now.y = pos.y;
			pre1.y = pos.y;
			CleanLead(); return true;

		}	//重新设置横线坐标


		CleanLead();	//删除有相同坐标的导线结点
		return true;
	},

	//连接物体坐标改变,更新导线位置
	RefreshPos: function() {
		POINT from, to;
		LEADSTEP * now;
		LEADSTEP * p1, * p2, * p3;

		//重新获得两个端点坐标
		conBody[0].GetPosFromBody(from);
		conBody[1].GetPosFromBody(to);

		//初始化
		if (coord.next == null || coord.next.next == null) {
			EasyInitPos(from, to);
			MakeFit();	//美化导线
			return;
		}

		now = &coord;
		
		//起点坐标改变
		if (from.x != now.x || from.y != now.y)
		{
			p1 = now.next;
			p2 = p1.next;
			if (p2 != null) p3 = p2.next;
			else p3 = null;
			
			if (p1.x != now.x || p1.y != now.y)
			{//前2个坐标不同
				if (p1.x == now.x)
					p1.x = from.x;
				else
					p1.y = from.y;
				now.pos = from;
			}
			else if (p1.x != p2.x || p1.y != p2.y)
			{//第2,3个坐标不同
				if (p1.x == p2.x)
					p1.y = from.y;
				else
					p1.x = from.x;
				now.pos = from;
			}
			else
			{
				EasyInitPos(from, to);	//初始化
				MakeFit();	//美化导线
				return;
			}
		}
		
		//得到终点坐标
		p1 = p2 = p3 = null;
		while (now.next != null)
		{
			p3 = p2;
			p2 = p1;
			p1 = now;
			now = now.next;
		}
		
		//终点坐标改变
		if (to.x != now.x || to.y != now.y)
		{
			if (p1.x != now.x || p1.y != now.y)
			{//后2个坐标不同
				if (p1.x == now.x)
					p1.x = to.x;
				else
					p1.y = to.y;
				now.pos = to;
			}
			else if (p1.x != p2.x || p1.y != p2.y)
			{//倒数2,3个坐标不同
				if (p1.x == p2.x)
					p1.y = to.y;
				else
					p1.x = to.x;
				now.pos = to;
			}
			else
			{
				EasyInitPos(from, to);	//初始化
				MakeFit();	//美化导线
				return;
			}
		}

		CleanLead();	//去除相同坐标的导线节点
		MakeFit();		//美化导线
	},

	//画导线
	PaintLead: function(CDC * dc) {
		ASSERT(dc != null);

		const LEADSTEP * temp = &coord;
		dc.MoveTo(temp.pos);
		temp = temp.next;
		while (temp != null)
		{
			dc.LineTo(temp.pos);
			temp = temp.next;
		}
	},

	//获得导线开始位置和结尾坐标
	GetStartEndPos: function(POINT &pos1, POINT &pos2) {
		const LEADSTEP * temp = &coord;
		while (temp.next != null) temp = temp.next;
		pos1 = coord.pos;
		pos2 = temp.pos;
	}

};