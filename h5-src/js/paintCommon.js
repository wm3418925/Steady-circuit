
var PaintCommonFunc = {
	
	ZeroFixHex: function(num, digitCount) {
	  var s = num.toString(16);
	  while (s.length < digitCount)
		s = "0" + s;
	  return s;
	},
	HexToRGBStr: function(color) {
		return "#" + ZeroFixHex(color, 6);
	},
	RGBStrToHex: function(rgbStr) {
		if (rgbStr.charAt(0) == '#')
			rgbStr = rgbStr.substr(1);
	
		if (rgbStr.length == 3) {
			return (parseInt(rgbStr.charAt(0), 16) << 20) | (parseInt(rgbStr.charAt(1), 16) << 12) | (parseInt(rgbStr.charAt(2), 16) << 4);
		}

		if (rgbStr.length == 3) {
			return parseInt(rgbStr, 16);
		}
		
		return 0;
	},
	RGBToHex: function(r, g, b) {
		return (r << 16) | (g << 8) | b;
	},
	RGBToRGBStr: function(r, g, b) {
		return HexToRGBStr(RGBToHex(r,g,b));
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
