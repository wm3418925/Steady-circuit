function true1AndFalse0(flag) { if (flag) return 1; else return 0; }

function zeroArray(array) {
    for (var i = array.length - 1; i >= 0; --i) array[i] = 0;
}
function indexOfArray(array, element) {
    for (var i=array.length-1; i>=0; --i) if (array[i] == element) return i;
    return -1;
}
function nextElementOfArray(array, element) {
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
function genrateArrayWithElementInitFunc(initFunc, size) {
    var a = new Array(size);
    for (var i=size-1; i>=0; --i) 
        a[i] = initFunc();
    return a;
}
function arrayCopyAll(to, from) {
    for (var i = from.length - 1; i >= 0; --i) to[i] = from[i];
}
function arrayCopyWithSize(to, from, size) {
    for (var i = size - 1; i >= 0; --i) to[i] = from[i];
}
function subArray(array, startIndex, endIndex/*array.length*/) {
	var newArray = new Array();
	if (endIndex <= 0)
		return newArray;
	
	if (endIndex == undefined || endIndex > array.length)
		endIndex = array.length;
    for (var i = startIndex; i < endIndex; ++i) newArray.push(array[i]);
	return newArray;
}

// 深度复制对象
function deepCopy(source) { 
	var result = {};
	for (var key in source) {
		result[key] = typeof source[key]==='object'? deepCopy(source[key]) : source[key];
	}
	return result;
}


function ASSERT(flag) {
    if (!flag)
        console.log("error");
    return flag;
}

function IsFloatZero(/*double*/x) {   //判断某个浮点数是否近似为0
    return x > -(1e-9) && x < (1e-9);
}

function IsElecError(/*const ELEC_STATE */e)	//电流是否不正常
{
	return e < NORMALELEC || e > OPENELEC;
}

/*bool*/function IsFloat(/*const char * */str)	//判断字符串是否是浮点数据
{
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

/*bool*/function IsUnsignedInteger(/*const char * */str)	//判断字符串是否是正整数
{
    for (var i=0; i<str.length; ++i) {
        var c = str.charCodeAt(i);
        if (c < 48 || c > 57)
            return false;
    }
    return true;
}
