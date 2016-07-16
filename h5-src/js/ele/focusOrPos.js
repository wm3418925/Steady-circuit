//焦点物体或者坐标上的物体
function FOCUS_OR_POS(isFocusBody, pos) {
	this.isFocusBody = (true == isFocusBody);
	
	if (pos) 
		this.pos = ClonePosition(pos);
	else
		this.pos = {x:0, y:0};
};
