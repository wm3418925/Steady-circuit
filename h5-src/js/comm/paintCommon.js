
var PaintCommonFunc = {
	
	ZeroFixHex: function(num, digitCount) {
	  var s = num.toString(16);
	  while (s.length < digitCount)
		s = "0" + s;
	  return s;
	},
	HexToRGBStr: function(color) {
		return "#" + PaintCommonFunc.ZeroFixHex(color, 6);
	},
	RGBStrToHex: function(rgbStr) {
		if (rgbStr.charAt(0) == '#')
			rgbStr = rgbStr.substr(1);
	
		if (rgbStr.length == 3) {
			return (parseInt(rgbStr.charAt(0), 16) << 20) | (parseInt(rgbStr.charAt(1), 16) << 12) | (parseInt(rgbStr.charAt(2), 16) << 4);
		}

		if (rgbStr.length == 6) {
			return parseInt(rgbStr, 16);
		}
		
		return 0;
	},
	CheckRGBStr: function(rgbStr) {
		if (rgbStr.charAt(0) == '#')
			rgbStr = rgbStr.substr(1);
		
		if (rgbStr.length != 3 && rgbStr.length != 6)
			return false;
	
		for (var i=0; i<rgbStr.length; ++i) {
			var chc = rgbStr.charCodeAt(i);
			if (!(chc>=0x30 && chc<=0x39) && !(chc>=0x41 && chc<=0x46) && !(chc>=0x61 && chc<=0x66))
				return false;
		}
		
		return true;
	},
	RGBToHex: function(r, g, b) {
		return (r << 16) | (g << 8) | b;
	},
	RGBToRGBStr: function(r, g, b) {
		return PaintCommonFunc.HexToRGBStr(PaintCommonFunc.RGBToHex(r,g,b));
	},
	RedOfHexRGB: function(color) {
		return (color>>16) & 0xff;
	},
	GreenOfHexRGB: function(color) {
		return (color>>8) & 0xff;
	},
	BlueOfHexRGB: function(color) {
		return color & 0xff;
	},
	HexRGBToRGBStruct: function(color) {
		return {r: PaintCommonFunc.RedOfHexRGB(color), g: PaintCommonFunc.GreenOfHexRGB(color), b: PaintCommonFunc.BlueOfHexRGB(color)};
	},

	
	// 在物体外部画矩形包围物体
	PaintSurrendedRect: function(ctx, x,y, cx,cy, rectColor) {
		ctx.lineWidth = 1;
		ctx.strokeStyle = PaintCommonFunc.HexToRGBStr(rectColor);
		ctx.strokeRect(x-1,y-1,cx+2,cy+2);
	},
	
	// 以异或的逻辑 画物体
	PaintImageDataXor: function(ctx, imageData, x,y) {
		var orgImgData = ctx.getImageData(x,y, imageData.width,imageData.height);
		for (var i=0; i<imageData.data.length; ) {
			orgImgData.data[i] ^= imageData.data[i];
			++i;
			orgImgData.data[i] ^= imageData.data[i];
			++i;
			orgImgData.data[i] ^= imageData.data[i];
			++i;
			orgImgData.data[i] = imageData.data[i];
			++i;
		}
		ctx.putImageData(orgImgData, x,y);
	},
	// 以或的逻辑 画物体
	PaintImageDataOr: function(ctx, imageData, x,y) {
		var orgImgData = ctx.getImageData(x,y, imageData.width,imageData.height);
		for (var i=0; i<imageData.data.length; ) {
			orgImgData.data[i] |= imageData.data[i];
			++i;
			orgImgData.data[i] |= imageData.data[i];
			++i;
			orgImgData.data[i] |= imageData.data[i];
			++i;
			orgImgData.data[i] = imageData.data[i];
			++i;
		}
		ctx.putImageData(orgImgData, x,y);
	}
};
