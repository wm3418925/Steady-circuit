#if !defined(AFX_EQUATION_FDEF)
#define AFX_EQUATION_FDEF


class Equation
{
private:
	double ** a, * x;	//a存储数据主数组m*n,x是方程的解
	int m, n;			//n-1==电流的个数
	int gotoRow;		//记录已经输入到哪行
	int * c;			//c[i]存储第i行第一个不是0的数

	Equation(const Equation &);			//不允许直接复制对象
	void operator =(const Equation &);	//不允许直接赋值对象

public:
	Equation(int crunNum, int eleNum);
	~Equation();

	void InputARow(const double * buf);	//输入从gotoRows开始的1行数据到主数组中
	ELEC_STATE Count();					//主函数,求解N元一次方程
	const double * GetAnswer();			//获得方程解的数组
	void OutputToFile(FILE *);			//将方程保存到文件,测试函数

};


#endif	//!defined(AFX_EQUATION_FDEF)