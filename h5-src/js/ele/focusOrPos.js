//焦点物体或者坐标上的物体
FOCUS_OR_POS = {
	CreateNew: function(isFocusBody, pos) {
		var newObj = {};
		
		if (true == isFocusBody) 
			newObj.isFocusBody = true;
		
		if (pos) 
			newObj.pos = ClonePosition(pos);
		else
			newObj.pos = {x:0, y:0};
		
		newObj.__proto__ = FOCUS_OR_POS;
        return newObj;
	}
};
