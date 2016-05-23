/* 稳恒电路教学模拟器
   版权所有（C） 2013 <王敏>

   This program is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation; version 2 of the License.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program; if not, write to the Free Software
   Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA */
   
#include "StdAfx.h"
#include "StaticClass.h"	//包含static方法的类
#include "Equation.h"		//当前类


Equation::Equation(int crunNum, int eleNum)
{
	gotoRow = 0;
	m = -1;
	n = 0;
	c = NULL;
	x = NULL;
	a = NULL;

	if(eleNum <= 0 || crunNum <= 0) return;	//无需初始化

	m = eleNum + crunNum - 1;
	n = eleNum + 1;

	x = (double *)malloc(eleNum * sizeof(double));
	ZeroMemory(x, eleNum * sizeof(double));
	
	c = (int *)malloc(m * sizeof(int));
	ZeroMemory(c, m * sizeof(int));
	
	a = (double **)malloc(m * sizeof(double *));
	for(int i=m-1; i>=0; --i)
	{
		a[i] = (double *)malloc(n * sizeof(double));
		ZeroMemory(a[i], n * sizeof(double));
	}
}

Equation::~Equation()
{
	if(m > 0 && n > 1)
	{
		free(c);
		free(x);
		for(int i=m-1; i>=0; --i) free(a[i]);
		free(a);
	}
}

const double * Equation::GetAnswer()
//获得方程解的数组
{
	return x;
}

void Equation::InputARow(const double * buf)
//输入从gotoRows开始的1行数据到主数组中
{
	ASSERT(gotoRow < m);

	memcpy((void *)a[gotoRow], (const void *)buf, n * sizeof(double));
	++gotoRow;
}

void Equation::OutputToFile(FILE * fp)
//将方程保存到文件,测试函数
{
	int i, j;

	fprintf(fp, "已输入到 第 %d 行 .\n\n", gotoRow);

	fputs("x数组(解):\n", fp);
	for(i=0; i<n-1; ++i) fprintf(fp, "%6.2f ", x[i]);

	fputs("\n\nc数组(某一行第一个不是0的数的位置):\n", fp);
	for(i=0; i<m; ++i) fprintf(fp, "%3d ", c[i]);

	fputs("\n\na数组(主数组,存储n元一次方程):\n", fp);
	for(i=0; i<m; ++i)
	{
		for(j=0; j<n; ++j) fprintf(fp, "%6.2f ", a[i][j]);
		fputc('\n', fp);
	}
	fputc('\n', fp);
}

ELEC_STATE Equation::Count()
{
	const int m = gotoRow;	//记录已经输入到的行,而不是this->m
    int i, j, l, k, w;
    double temp;
	if(m <= 0 || n <= 1) return NORMALELEC;	//无须计算
	w = n<m-1 ? n : m-1;					//w的值为m-1,n的较小值

	for(i=n-2; i>=0; --i) x[i] = 0;

	//化阶梯-----------------------------------------------------------------------------
	for(l=0,k=0; l<w; ++l,++k)
	{
		while(k < n)
		{
			for(i=l; i<m; ++i)
				if(!StaticClass::IsZero(a[i][k])) break;
			if(i == m)
			{
				--w; 
				++k;
			}
			else 
			{
				break;
			}
		}

		if(k == n)
		{
			if(l == 0) return NORMALELEC;	//l==0,电流都为0
			break;
		}

		if(k == n-1) return SHORTELEC;	//电路短路

		if(i != l)
		{
			for(j=k; j<n; ++j)
			{
				temp = a[i][j];
				a[i][j] = a[l][j];
				a[l][j] = temp;
			}
		}

		for(i=l+1; i<m; ++i)
		{
			if(!StaticClass::IsZero(a[i][k]))
			{
				temp = a[i][k] / a[l][k];
				for(j=k; j<n; ++j) a[i][j] -= a[l][j] * temp;
			}
			else a[i][k] = 0;
		}
	}

	//判断并返回电流---------------------------------------------------------------------
	w = n - 1;	//m代表含有非0值行的个数
	for(i=0; i<w; ++i)
	{
		for(j=i; j<n; ++j) if(!StaticClass::IsZero(a[i][j])) break;
		c[i] = j;

		if(j > i)
		{
			if(j == n-1)
				return SHORTELEC;		//电路短路
			else
				return UNCOUNTABLEELEC;	//无法计算
		}
	}

	for(i=0; i<w; ++i)
	{
		for(j=n-1; j>c[i]; --j) a[i][j] /= a[i][c[i]];
		a[i][c[i]] = 1;
	}

	for(l=w-1; l>0; --l) 
	{
		ASSERT(!StaticClass::IsZero(a[l][c[l]]));

		for(i=0; i<l; ++i)
		{
			for(j=c[l]+1; j<n; ++j) a[i][j] -= a[l][j] * a[i][c[l]];
			a[i][c[l]] = 0;
		}
	}

	for(i=n-2; i>=0; --i) x[i] = a[i][n-1];							//放入结果到数组
	for(i=n-2; i>=0; --i) if(StaticClass::IsZero(x[i])) x[i] = 0;	//近似0的数设为0

	return NORMALELEC;	//正常返回
}
