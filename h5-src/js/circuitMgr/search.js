
// 搜索函数

bool Manager.SearchNext(SEARCH_BY searchBy, BODY_TYPE range, bool isWholeWord, bool isMatchCase, char * keyWord)
//搜索下一个物体
{
	bool isAfterFocus = false;
	char str[32];
	bool isMatch;
	int round, j;
	bool isSearchLead = (range == BODY_ALL || range == BODY_LEAD) && searchBy == SEARCH_BY_ID;
	bool isSearchCrun = (range == BODY_ALL || range == BODY_CRUN);
	bool isSearchCtrl = (range == BODY_ALL || range == BODY_ALLCTRL || Pointer.IsCtrl(range));
	KMP kmp(keyWord, isWholeWord, isMatchCase || searchBy == SEARCH_BY_ID);	//搜索序号时可以区分大小写, 加快速度
	var newFocus = Pointer.CreateNew();

	for (round=0; round<2; ++round)
	{
		//search lead ----------------------------------------------------------
		if (!isAfterFocus && Manager.focusBody.IsOnLead())
		{
			isAfterFocus = true;
			if (isSearchLead)
				j = Manager.focusBody.p1.num + 1;
			else
				j = Manager.lead.length;
		}
		else if (isAfterFocus && isSearchLead)
		{
			j = 0;
		}
		else if (isAfterFocus && !isSearchLead && Manager.focusBody.IsOnLead())
		{
			return false;
		}
		else
		{
			j = Manager.lead.length;
		}

		for (; j<Manager.lead.length; ++j)
		{
			itoa(lead[j].initOrder, str, 10);
			isMatch = kmp.IsMatch(str);
			if (Manager.focusBody.IsLeadSame(lead[j]))
			{
				return isMatch;
			}
			else if (isMatch)
			{
				newFocus.SetOnLead(lead[j], true);
				FocusBodyPaint(newFocus);
				return true;
			}
		}

		//search crun ----------------------------------------------------------
		if (!isAfterFocus && Manager.focusBody.IsOnCrun())
		{
			isAfterFocus = true;
			if (isSearchCrun)
				j = Manager.focusBody.p2.num + 1;
			else
				j = Manager.crun.length;
		}
		else if (isAfterFocus && isSearchCrun)
		{
			j = 0;
		}
		else if (isAfterFocus && !isSearchCrun && Manager.focusBody.IsOnCrun())
		{
			return false;
		}
		else
		{
			j = Manager.crun.length;
		}

		for (; j<Manager.crun.length; ++j)
		{
			if (searchBy == SEARCH_BY_NAME)
			{
				isMatch = kmp.IsMatch(crun[j].name);
			}
			else
			{
				itoa(crun[j].initOrder, str, 10);
				isMatch = kmp.IsMatch(str);
			}
			if (Manager.focusBody.IsCrunSame(crun[j]))
			{
				return isMatch;
			}
			else if (isMatch)
			{
				newFocus.SetOnCrun(crun[j], true);
				FocusBodyPaint(&newFocus);
				return true;
			}
		}

		//search ctrl ----------------------------------------------------------
		if (!isAfterFocus && Manager.focusBody.IsOnCtrl())
		{
			isAfterFocus = true;
			if (isSearchCtrl)
				j = Manager.focusBody.p3.num + 1;
			else
				j = Manager.ctrl.length;
		}
		else if (isAfterFocus && isSearchCtrl)
		{
			j = 0;
		}
		else if (isAfterFocus && !isSearchCtrl && Manager.focusBody.IsOnCtrl())
		{
			return false;
		}
		else
		{
			j = Manager.ctrl.length;
		}

		for (; j<Manager.ctrl.length; ++j)
		{
			if (range == BODY_ALL || range == BODY_ALLCTRL || ctrl[j].GetStyle() == range)
			{
				if (searchBy == SEARCH_BY_NAME)
				{
					isMatch = kmp.IsMatch(ctrl[j].name);
				}
				else
				{
					itoa(ctrl[j].initOrder, str, 10);
					isMatch = kmp.IsMatch(str);
				}
				if (Manager.focusBody.IsCtrlSame(ctrl[j]))
				{
					return isMatch;
				}
				else if (isMatch)
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

bool Manager.SearchPre(SEARCH_BY searchBy, BODY_TYPE range, bool isWholeWord, bool isMatchCase, char * keyWord)
//搜索上一个物体
{
	bool isAfterFocus = false;
	char str[32];
	bool isMatch;
	int round, j;
	bool isSearchLead = (range == BODY_ALL || range == BODY_LEAD) && searchBy == SEARCH_BY_ID;
	bool isSearchCrun = (range == BODY_ALL || range == BODY_CRUN);
	bool isSearchCtrl = (range == BODY_ALL || range == BODY_ALLCTRL || Pointer.IsCtrl(range));
	KMP kmp(keyWord, isWholeWord, isMatchCase || searchBy == SEARCH_BY_ID);	//搜索序号时可以区分大小写, 加快速度
	var newFocus = Pointer.CreateNew();

	for (round=0; round<2; ++round)
	{
		//search ctrl ----------------------------------------------------------
		if (!isAfterFocus && Manager.focusBody.IsOnCtrl())
		{
			isAfterFocus = true;
			if (isSearchCtrl)
				j = Manager.focusBody.p3.num - 1;
			else
				j = -1;
		}
		else if (isAfterFocus && isSearchCtrl)
		{
			j = Manager.ctrl.length-1;
		}
		else if (isAfterFocus && !isSearchCtrl && Manager.focusBody.IsOnCtrl())
		{
			return false;
		}
		else
		{
			j = -1;
		}

		for (; j>=0; --j)
		{
			if (range == BODY_ALL || range == BODY_ALLCTRL || ctrl[j].GetStyle() == range)
			{
				if (searchBy == SEARCH_BY_NAME)
				{
					isMatch = kmp.IsMatch(ctrl[j].name);
				}
				else
				{
					itoa(ctrl[j].initOrder, str, 10);
					isMatch = kmp.IsMatch(str);
				}
				if (Manager.focusBody.IsCtrlSame(ctrl[j]))
				{
					return isMatch;
				}
				else if (isMatch)
				{
					newFocus.SetOnCtrl(ctrl[j], true);
					FocusBodyPaint(newFocus);
					return true;
				}
			}
		}

		//search crun ----------------------------------------------------------
		if (!isAfterFocus && Manager.focusBody.IsOnCrun())
		{
			isAfterFocus = true;
			if (isSearchCrun)
				j = Manager.focusBody.p2.num - 1;
			else
				j = -1;
		}
		else if (isAfterFocus && isSearchCrun)
		{
			j = Manager.crun.length - 1;
		}
		else if (isAfterFocus && !isSearchCrun && Manager.focusBody.IsOnCrun())
		{
			return false;
		}
		else
		{
			j = -1;
		}

		for (; j>=0; --j)
		{
			if (searchBy == SEARCH_BY_NAME)
			{
				isMatch = kmp.IsMatch(crun[j].name);
			}
			else
			{
				itoa(crun[j].initOrder, str, 10);
				isMatch = kmp.IsMatch(str);
			}
			if (Manager.focusBody.IsCrunSame(crun[j]))
			{
				return isMatch;
			}
			else if (isMatch)
			{
				newFocus.SetOnCrun(crun[j], true);
				FocusBodyPaint(&newFocus);
				return true;
			}
		}

		//search lead ----------------------------------------------------------
		if (!isAfterFocus && Manager.focusBody.IsOnLead())
		{
			isAfterFocus = true;
			if (isSearchLead)
				j = Manager.focusBody.p1.num - 1;
			else
				j = -1;
		}
		else if (isAfterFocus && isSearchLead)
		{
			j = Manager.lead.length - 1;
		}
		else if (isAfterFocus && !isSearchLead && Manager.focusBody.IsOnLead())
		{
			return false;
		}
		else
		{
			j = -1;
		}

		for (; j>=0; --j)
		{
			itoa(lead[j].initOrder, str, 10);
			isMatch = kmp.IsMatch(str);
			if (Manager.focusBody.IsLeadSame(lead[j]))
			{
				return isMatch;
			}
			else if (isMatch)
			{
				newFocus.SetOnLead(lead[j], true);
				FocusBodyPaint(&newFocus);
				return true;
			}
		}
	}

	return false;
}
