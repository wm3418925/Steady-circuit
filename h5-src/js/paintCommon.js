
var PaintCommonFunc = {
	
	// 在物体外部画矩形包围物体
	PaintSurrendedRect: function(ctx, x,y, cx,cy, rectColor) {
		ctx.lineWidth = 1;
		ctx.strokeStyle = rectColor;
		ctx.strokeRect(x-1,y-1,cx+2,cy+2);
	},
	
	// 以异或的逻辑 画物体
	PaintInverseImage(ctx, imageData, x,y) {
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
	}
};
