
// 搜索函数

bool Manager::SearchNext(SEARCH_BY searchBy, BODY_TYPE range, bool isWholeWord, bool isMatchCase, char * keyWord)
//搜索下一个物体
{
	bool isAfterFocus = false;
	char str[32];
	bool isMatch;
	int round, j;
	bool isSearchLead = (range == BODY_ALL || range == BODY_LEAD) && searchBy == SEARCH_BY_ID;
	bool isSearchCrun = (range == BODY_ALL || range == BODY_CRUN);
	bool isSearchCtrl = (range == BODY_ALL || range == BODY_ALLCTRL || Pointer::IsCtrl(range));
	KMP kmp(keyWord, isWholeWord, isMatchCase || searchBy == SEARCH_BY_ID);	//搜索序号时可以区分大小写, 加快速度
	Pointer newFocus;

	for(round=0; round<2; ++round)
	{
		//search lead ----------------------------------------------------------
		if(!isAfterFocus && focusBody.IsOnLead())
		{
			isAfterFocus = true;
			if(isSearchLead)
				j = focusBody.p1.num + 1;
			else
				j = leadCount;
		}
		else if(isAfterFocus && isSearchLead)
		{
			j = 0;
		}
		else if(isAfterFocus && !isSearchLead && focusBody.IsOnLead())
		{
			return false;
		}
		else
		{
			j = leadCount;
		}

		for(; j<leadCount; ++j)
		{
			itoa(lead[j]->GetInitOrder(), str, 10);
			isMatch = kmp.IsMatch(str);
			if(focusBody.IsLeadSame(lead[j]))
			{
				return isMatch;
			}
			else if(isMatch)
			{
				newFocus.SetOnLead(lead[j], true);
				FocusBodyPaint(&newFocus);
				return true;
			}
		}

		//search crun ----------------------------------------------------------
		if(!isAfterFocus && focusBody.IsOnCrun())
		{
			isAfterFocus = true;
			if(isSearchCrun)
				j = focusBody.p2.num + 1;
			else
				j = crunCount;
		}
		else if(isAfterFocus && isSearchCrun)
		{
			j = 0;
		}
		else if(isAfterFocus && !isSearchCrun && focusBody.IsOnCrun())
		{
			return false;
		}
		else
		{
			j = crunCount;
		}

		for(; j<crunCount; ++j)
		{
			if(searchBy == SEARCH_BY_NAME)
			{
				isMatch = kmp.IsMatch(crun[j]->name);
			}
			else
			{
				itoa(crun[j]->GetInitOrder(), str, 10);
				isMatch = kmp.IsMatch(str);
			}
			if(focusBody.IsCrunSame(crun[j]))
			{
				return isMatch;
			}
			else if(isMatch)
			{
				newFocus.SetOnCrun(crun[j], true);
				FocusBodyPaint(&newFocus);
				return true;
			}
		}

		//search ctrl ----------------------------------------------------------
		if(!isAfterFocus && focusBody.IsOnCtrl())
		{
			isAfterFocus = true;
			if(isSearchCtrl)
				j = focusBody.p3.num + 1;
			else
				j = ctrlCount;
		}
		else if(isAfterFocus && isSearchCtrl)
		{
			j = 0;
		}
		else if(isAfterFocus && !isSearchCtrl && focusBody.IsOnCtrl())
		{
			return false;
		}
		else
		{
			j = ctrlCount;
		}

		for(; j<ctrlCount; ++j)
		{
			if(range == BODY_ALL || range == BODY_ALLCTRL || ctrl[j]->GetStyle() == range)
			{
				if(searchBy == SEARCH_BY_NAME)
				{
					isMatch = kmp.IsMatch(ctrl[j]->name);
				}
				else
				{
					itoa(ctrl[j]->GetInitOrder(), str, 10);
					isMatch = kmp.IsMatch(str);
				}
				if(focusBody.IsCtrlSame(ctrl[j]))
				{
					return isMatch;
				}
				else if(isMatch)
				{
					newFocus.SetOnCtrl(ctrl[j], true);
					FocusBodyPaint(&newFocus);
					return true;
				}
			}
		}
	}

	return false;
}

bool Manager::SearchPre(SEARCH_BY searchBy, BODY_TYPE range, bool isWholeWord, bool isMatchCase, char * keyWord)
//搜索上一个物体
{
	bool isAfterFocus = false;
	char str[32];
	bool isMatch;
	int round, j;
	bool isSearchLead = (range == BODY_ALL || range == BODY_LEAD) && searchBy == SEARCH_BY_ID;
	bool isSearchCrun = (range == BODY_ALL || range == BODY_CRUN);
	bool isSearchCtrl = (range == BODY_ALL || range == BODY_ALLCTRL || Pointer::IsCtrl(range));
	KMP kmp(keyWord, isWholeWord, isMatchCase || searchBy == SEARCH_BY_ID);	//搜索序号时可以区分大小写, 加快速度
	Pointer newFocus;

	for(round=0; round<2; ++round)
	{
		//search ctrl ----------------------------------------------------------
		if(!isAfterFocus && focusBody.IsOnCtrl())
		{
			isAfterFocus = true;
			if(isSearchCtrl)
				j = focusBody.p3.num - 1;
			else
				j = -1;
		}
		else if(isAfterFocus && isSearchCtrl)
		{
			j = ctrlCount-1;
		}
		else if(isAfterFocus && !isSearchCtrl && focusBody.IsOnCtrl())
		{
			return false;
		}
		else
		{
			j = -1;
		}

		for(; j>=0; --j)
		{
			if(range == BODY_ALL || range == BODY_ALLCTRL || ctrl[j]->GetStyle() == range)
			{
				if(searchBy == SEARCH_BY_NAME)
				{
					isMatch = kmp.IsMatch(ctrl[j]->name);
				}
				else
				{
					itoa(ctrl[j]->GetInitOrder(), str, 10);
					isMatch = kmp.IsMatch(str);
				}
				if(focusBody.IsCtrlSame(ctrl[j]))
				{
					return isMatch;
				}
				else if(isMatch)
				{
					newFocus.SetOnCtrl(ctrl[j], true);
					FocusBodyPaint(&newFocus);
					return true;
				}
			}
		}

		//search crun ----------------------------------------------------------
		if(!isAfterFocus && focusBody.IsOnCrun())
		{
			isAfterFocus = true;
			if(isSearchCrun)
				j = focusBody.p2.num - 1;
			else
				j = -1;
		}
		else if(isAfterFocus && isSearchCrun)
		{
			j = crunCount - 1;
		}
		else if(isAfterFocus && !isSearchCrun && focusBody.IsOnCrun())
		{
			return false;
		}
		else
		{
			j = -1;
		}

		for(; j>=0; --j)
		{
			if(searchBy == SEARCH_BY_NAME)
			{
				isMatch = kmp.IsMatch(crun[j]->name);
			}
			else
			{
				itoa(crun[j]->GetInitOrder(), str, 10);
				isMatch = kmp.IsMatch(str);
			}
			if(focusBody.IsCrunSame(crun[j]))
			{
				return isMatch;
			}
			else if(isMatch)
			{
				newFocus.SetOnCrun(crun[j], true);
				FocusBodyPaint(&newFocus);
				return true;
			}
		}

		//search lead ----------------------------------------------------------
		if(!isAfterFocus && focusBody.IsOnLead())
		{
			isAfterFocus = true;
			if(isSearchLead)
				j = focusBody.p1.num - 1;
			else
				j = -1;
		}
		else if(isAfterFocus && isSearchLead)
		{
			j = leadCount - 1;
		}
		else if(isAfterFocus && !isSearchLead && focusBody.IsOnLead())
		{
			return false;
		}
		else
		{
			j = -1;
		}

		for(; j>=0; --j)
		{
			itoa(lead[j]->GetInitOrder(), str, 10);
			isMatch = kmp.IsMatch(str);
			if(focusBody.IsLeadSame(lead[j]))
			{
				return isMatch;
			}
			else if(isMatch)
			{
				newFocus.SetOnLead(lead[j], true);
				FocusBodyPaint(&newFocus);
				return true;
			}
		}
	}

	return false;
}
