//#include <math.h>

class StaticClass
{
public:

	static bool IsZero(const double x)	//判断某个浮点数是否近似为0
	{
		return x > -(1e-9) && x < (1e-9);
	}
	/*static bool IsFloatEqual(const double a, const double b)	//判断2个浮点数是否近似相等
	{
		double max = fabs(a);
		if(fabs(b) > fabs(a)) max = fabs(b);
		return (fabs(a - b) <= (1e-7) * max);
	}*/
	static bool IsElecError(const ELEC_STATE e)	//电流是否不正常
	{
		return e < NORMALELEC || e > OPENELEC;
	}

	static bool IsFloat(const char * str)	//判断字符串是否是浮点数据
	{
		int count = 0;

		//检查是否最多只有一个'.',没有其他数字以外的字符
		while(*str != '\0')
		{
			if('.' == *str)
			{
				++count;
				if(count > 1) return false;
			}
			else if(!isdigit(* str))
			{
				return false;
			}

			++ str;
		}

		return true;
	}

	static bool IsUnsignedInteger(const char * str)	//判断字符串是否是正整数
	{
		while(*str != '\0' && isdigit(*str)) ++str;
		return *str == '\0';
	}

	static bool IsNormalStr(const char * str)	//判断字符串是否不含[](){}
	{
		while(*str != '\0')
		{
			if(    '[' == *str || ']' == *str 
				|| '(' == *str || ')' == *str
				|| '{' == *str || '}' == *str)
				return false;
			++ str;
		}
		return true;
	}

	static bool IsCtrlDown()			//获得左或右Ctrl键是否按下
	{
		return 0x1000 & GetKeyState(VK_CONTROL) || 0x1000 & GetKeyState(VK_RCONTROL);
	}

	static int SaveBitmapToFile(HBITMAP hBitmap, const char * fileName)
	//将图片存成文件, hBitmap为位图句柄, fileName为位图文件名
	{
		HDC hDC;					//设备描述表
		int iBits;					//当前显示分辨率下每个像素所占字节数
		WORD wBitCount;				//位图中每个像素所占字节数
		DWORD dwPaletteSize = 0;	//调色板大小
		DWORD dwBmBitsSize;			//位图中像素字节大小
		DWORD dwDIBSize;			//位图文件大小
		DWORD dwWritten;			//写入文件字节数
		BITMAP Bitmap;				//位图属性结构
		BITMAPFILEHEADER bmfHdr;	//位图文件头结构
		BITMAPINFOHEADER bi;		//位图信息头结构 
		LPBITMAPINFOHEADER lpbi;	//指向位图信息头结构
		HANDLE fh;					//文件句柄
		HANDLE hDib;				//分配内存句柄
		HANDLE hPal;				//调色板句柄
		HPALETTE hOldPal = NULL;	//原先调色板句柄

		//计算位图文件每个像素所占字节数
		hDC = CreateDC("DISPLAY", NULL, NULL, NULL);
		iBits = GetDeviceCaps(hDC, BITSPIXEL) * GetDeviceCaps(hDC, PLANES);
		DeleteDC(hDC);
		if(iBits <= 1)
			wBitCount = 1;
		else if(iBits <= 4)
			wBitCount = 4;
		else if(iBits <= 8)
			wBitCount = 8;
		else if(iBits <= 24)
			wBitCount = 24;
		else
			wBitCount = 32;

		//计算调色板大小
		if (wBitCount <= 8) dwPaletteSize = (1<<wBitCount) * sizeof(RGBQUAD);

		//设置位图信息头结构
		GetObject(hBitmap, sizeof(BITMAP), (LPSTR)&Bitmap);
		bi.biSize			= sizeof(BITMAPINFOHEADER);
		bi.biWidth			= Bitmap.bmWidth;
		bi.biHeight			= Bitmap.bmHeight;
		bi.biPlanes			= 1;
		bi.biBitCount		= wBitCount;
		bi.biCompression	= BI_RGB;
		bi.biSizeImage		= 0;
		bi.biXPelsPerMeter	= 0;
		bi.biYPelsPerMeter	= 0;
		bi.biClrUsed		= 0;
		bi.biClrImportant	= 0;

		//为位图内容分配内存
		dwBmBitsSize = ((Bitmap.bmWidth*wBitCount+31)/32) * 4 * Bitmap.bmHeight;

		/*xxxxxxxx计算位图大小分解一下(解释一下上面的语句)xxxxxxxxxxxxxxxxxxxx 
		//每个扫描行所占的字节数应该为4的整数倍，具体算法为:
		int biWidth = (Bitmap.bmWidth*wBitCount) / 32;
		if((Bitmap.bmWidth*wBitCount) % 32) biWidth++;	//不是整数倍的加1
		biWidth *= 4;									//到这里，计算得到的为每个扫描行的字节数。
		dwBmBitsSize = biWidth * Bitmap.bmHeight;		//得到大小
		xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx*/

		hDib = GlobalAlloc(GHND, dwBmBitsSize + dwPaletteSize + sizeof(BITMAPINFOHEADER));
		lpbi = (LPBITMAPINFOHEADER)GlobalLock(hDib);
		*lpbi = bi;

		// 处理调色板   
		hPal = GetStockObject(DEFAULT_PALETTE);
		if(hPal)
		{
			hDC = ::GetDC(NULL);
			hOldPal = SelectPalette(hDC, (HPALETTE)hPal, FALSE);
			RealizePalette(hDC);
		}

		// 获取该调色板下新的像素值
		GetDIBits(	hDC,
					hBitmap,
					0,
					(UINT)Bitmap.bmHeight,
					(LPSTR)lpbi + sizeof(BITMAPINFOHEADER) + dwPaletteSize,
					(BITMAPINFO *)lpbi,
					DIB_RGB_COLORS);

		//恢复调色板   
		if(hOldPal)
		{
			SelectPalette(hDC, hOldPal, TRUE);
			RealizePalette(hDC);
			::ReleaseDC(NULL, hDC);
		}

		//创建位图文件    
		fh = CreateFile(fileName, GENERIC_WRITE, 0, NULL, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL | FILE_FLAG_SEQUENTIAL_SCAN, NULL);
		if(fh == INVALID_HANDLE_VALUE) return FALSE;

		// 设置位图文件头
		bmfHdr.bfType = 0x4D42;	// "BM"
		dwDIBSize = sizeof(BITMAPFILEHEADER) + sizeof(BITMAPINFOHEADER) + dwPaletteSize + dwBmBitsSize;  
		bmfHdr.bfSize = dwDIBSize;
		bmfHdr.bfReserved1 = 0;
		bmfHdr.bfReserved2 = 0;
		bmfHdr.bfOffBits = (DWORD)sizeof(BITMAPFILEHEADER) + (DWORD)sizeof(BITMAPINFOHEADER) + dwPaletteSize;

		// 写入位图文件头
		WriteFile(fh, (LPSTR)&bmfHdr, sizeof(BITMAPFILEHEADER), &dwWritten, NULL);

		// 写入位图文件其余内容
		WriteFile(fh, (LPSTR)lpbi, sizeof(BITMAPINFOHEADER) + dwPaletteSize + dwBmBitsSize , &dwWritten, NULL);

		//清除
		GlobalUnlock(hDib);
		GlobalFree(hDib);
		CloseHandle(fh);
		return TRUE;
	}

};