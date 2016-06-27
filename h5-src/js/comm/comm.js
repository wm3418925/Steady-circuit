function True1_False0(flag) { if (flag) return 1; else return 0; }

function ZeroArray(array) {
    for (var i = array.length - 1; i >= 0; --i) array[i] = 0;
}
function IndexOfArray(array, element) {
    for (var i=array.length-1; i>=0; --i) if (array[i] == element) return i;
    return -1;
}
function NextElementOfArray(array, element) {
    for (var i=array.length-1; i>=0; --i) {
		if (array[i] == element) {
			if (i+1 < array.length)
				return array[i+1];
			else
				return null;
		}
	}
    return null;
}
function GenrateArrayWithElementInitFunc(initFunc, size) {
    var a = new Array(size);
    for (var i=size-1; i>=0; --i) 
        a[i] = initFunc();
    return a;
}
function ArrayCopyAll(to, from) {
    for (var i = from.length - 1; i >= 0; --i) to[i] = from[i];
}
function ArrayCopyWithSize(to, from, size) {
    for (var i = size - 1; i >= 0; --i) to[i] = from[i];
}
function SubArray(array, startIndex, endIndex/*array.length*/) {
	var newArray = new Array();
	if (endIndex <= 0)
		return newArray;
	
	if (endIndex == undefined || endIndex > array.length)
		endIndex = array.length;
    for (var i = startIndex; i < endIndex; ++i) newArray.push(array[i]);
	return newArray;
}

// 深度复制对象
function MyDeepCopy(source) {
	if (!source)
		return null;
	
	if (source instanceof Array) {
		var result = new Array();
		for (var i=0; i<source.length; ++i) {
			result.push(MyDeepCopy(source[i]));
		}
		return result;
	} else {
		var result = {};
		for (var key in source) {
			result[key] = typeof source[key]==='object'? MyDeepCopy(source[key]) : source[key];
		}
		
		result.__proto__ = source.__proto__;
		return result;
	}
}
//复制坐标
function ClonePosition(pos) {
	return {x:pos.x, y:pos.y};
}
//复制坐标值
function SetPosition(leftValue, rightValue) {
	leftValue.x = rightValue.x;
	leftValue.y = rightValue.y;
}

function ASSERT(flag) {
    if (!flag) {
        flag.error();
	}
    return flag;
}

function IsFloatZero(x) {   //判断某个浮点数是否近似为0
    return x > -(1e-9) && x < (1e-9);
}

function IsElecError(/*const ELEC_STATE */e) {	//电流是否不正常
	return e < NORMALELEC || e > OPENELEC;
}

/*bool*/function IsStrPositiveFloat(str) {	//判断字符串是否是正数
	/*int*/var count = 0;

	//检查是否最多只有一个'.',没有其他数字以外的字符
	for (var i=0; i<str.length; ++i)
	{
	    var c = str.charCodeAt(i);
		if (46/*'.'*/ == c)
		{
			++count;
			if (count > 1) return false;
		}
        else if (c < 48 || c > 57)
		{
			return false;
		}
	}

	return true;
}

function IsUnsignedInteger(str) {	//判断字符串是否是正整数
    for (var i=0; i<str.length; ++i) {
        var c = str.charCodeAt(i);
        if (c < 48 || c > 57)
            return false;
    }
    return true;
}



// 获取当前时间中的鼠标坐标(相对client窗口)
function GetClientPosOfEvent(e) {
	return {"x":e.clientX, "y":e.clientY};
	
	//var x = e.clientX;
	//var y = e.clientY;
	//client.
	//return {"x":x, "y":y};
}
// 获取当前时间中的鼠标坐标(相对屏幕窗口)
function GetScreenPosOfEvent(e) {
	return {"x":e.screenX, "y":e.screenY};
}
// 获取点击的键code
function GetPressKeyCode(e) {
	if (window.event) {
		return e.keyCode;
	} else if(e.which) {
		return e.which;
	}
}
// 由设备坐标变换为逻辑坐标
function DPtoLP(posOrRect, client) {
	var l = document.body.scrollLeft + client.offsetLeft;
	var t = document.body.scrollTop + client.offsetTop;
	
	if (posOrRect.hasOwnProperty("left")) {
		posOrRect.left -= l;
	}
	if (posOrRect.hasOwnProperty("right")) {
		posOrRect.right -= l;
	}
	if (posOrRect.hasOwnProperty("top")) {
		posOrRect.top -= t;
	}
	if (posOrRect.hasOwnProperty("bottom")) {
		posOrRect.bottom -= t;
	}
	if (posOrRect.hasOwnProperty("x")) {
		posOrRect.x -= l;
	}
	if (posOrRect.hasOwnProperty("y")) {
		posOrRect.y -= t;
	}
}

function getPointOnCanvas(canvas, x, y) {
    var bbox = canvas.getBoundingClientRect();
    return {x: x - bbox.left * (canvas.width / bbox.width),
            y: y - bbox.top  * (canvas.height / bbox.height)};
}
