// 如果当前有焦点物体,从搜索焦点下一个开始搜索; 如果当前没有焦点, 从第一个物体开始搜索
Manager.GetSearchStartFocus = function() {
	if (Manager.focusBody.IsOnBody() || Manager.focusBody.IsOnLead())
		return Manager.focusBody.Clone();
	
	var ssf = new Pointer();
	if (Manager.ctrl.length > 0) {
		ssf.SetOnCtrl(Manager.ctrl[Manager.ctrl.length-1], true);
		return ssf;
	}
	if (Manager.crun.length > 0) {
		ssf.SetOnCrun(Manager.crun[Manager.crun.length-1], true);
		return ssf;
	}
	if (Manager.lead.length > 0) {
		ssf.SetOnLead(Manager.lead[Manager.lead.length-1], true);
		return ssf;
	}
	return ssf;
};

//搜索下一个物体
Manager.SearchNext = function(searchParam) {
	var isAfterFocus = false;
	var isMatch;
	var round, j;
	var isSearchLead = (searchParam.range == BODY_ALL || searchParam.range == BODY_LEAD) && searchParam.searchBy == SEARCH_BY_ID;
	var isSearchCrun = (searchParam.range == BODY_ALL || searchParam.range == BODY_CRUN);
	var isSearchCtrl = (searchParam.range == BODY_ALL || searchParam.range == BODY_ALLCTRL || IsBodyTypeCtrl(searchParam.range));
	var kmp = new KMP(searchParam.keyWord, searchParam.isWholeWord, searchParam.isMatchCase || searchParam.searchBy == SEARCH_BY_ID);	//搜索序号时可以区分大小写, 加快速度
	
	var ssf = Manager.GetSearchStartFocus();
	var newFocus = new Pointer();

	for (round=0; round<2; ++round) {
		//search lead ----------------------------------------------------------
		if (!isAfterFocus && ssf.IsOnLead()) {
			isAfterFocus = true;
			if (isSearchLead)
				j = ssf.p.index + 1;
			else
				j = Manager.lead.length;
		} else if (isAfterFocus && isSearchLead) {
			j = 0;
		} else if (isAfterFocus && !isSearchLead && ssf.IsOnLead()) {
			return false;
		} else {
			j = Manager.lead.length;
		}

		for (; j<Manager.lead.length; ++j) {
			isMatch = kmp.IsMatch(Manager.lead[j].initOrder + "");
			if (ssf.IsLeadSame(Manager.lead[j])) {
				return isMatch;
			} else if (isMatch) {
				newFocus.SetOnLead(Manager.lead[j], true);
				Manager.FocusBodyPaint(newFocus);
				return true;
			}
		}

		//search crun ----------------------------------------------------------
		if (!isAfterFocus && ssf.IsOnCrun()) {
			isAfterFocus = true;
			if (isSearchCrun)
				j = ssf.p.index + 1;
			else
				j = Manager.crun.length;
		} else if (isAfterFocus && isSearchCrun) {
			j = 0;
		} else if (isAfterFocus && !isSearchCrun && ssf.IsOnCrun()) {
			return false;
		} else {
			j = Manager.crun.length;
		}

		for (; j<Manager.crun.length; ++j) {
			if (searchParam.searchBy == SEARCH_BY_NAME)
				isMatch = kmp.IsMatch(Manager.crun[j].name);
			else
				isMatch = kmp.IsMatch(Manager.crun[j].initOrder + "");
			if (ssf.IsCrunSame(Manager.crun[j])) {
				return isMatch;
			} else if (isMatch) {
				newFocus.SetOnCrun(Manager.crun[j], true);
				Manager.FocusBodyPaint(newFocus);
				return true;
			}
		}

		//search ctrl ----------------------------------------------------------
		if (!isAfterFocus && ssf.IsOnCtrl()) {
			isAfterFocus = true;
			if (isSearchCtrl)
				j = ssf.p.index + 1;
			else
				j = Manager.ctrl.length;
		} else if (isAfterFocus && isSearchCtrl) {
			j = 0;
		} else if (isAfterFocus && !isSearchCtrl && ssf.IsOnCtrl()) {
			return false;
		} else {
			j = Manager.ctrl.length;
		}

		for (; j<Manager.ctrl.length; ++j) {
			if (searchParam.range == BODY_ALL || searchParam.range == BODY_ALLCTRL || Manager.ctrl[j].style == searchParam.range) {
				if (searchParam.searchBy == SEARCH_BY_NAME)
					isMatch = kmp.IsMatch(Manager.ctrl[j].name);
				else
					isMatch = kmp.IsMatch(Manager.ctrl[j].initOrder + "");
				if (ssf.IsCtrlSame(Manager.ctrl[j])) {
					return isMatch;
				} else if (isMatch) {
					newFocus.SetOnCtrl(Manager.ctrl[j], true);
					Manager.FocusBodyPaint(newFocus);
					return true;
				}
			}
		}
	}

	return false;
};

//搜索上一个物体
Manager.SearchPre = function(searchParam) {
	var isAfterFocus = false;
	var isMatch;
	var round, j;
	var isSearchLead = (searchParam.range == BODY_ALL || searchParam.range == BODY_LEAD) && searchParam.searchBy == SEARCH_BY_ID;
	var isSearchCrun = (searchParam.range == BODY_ALL || searchParam.range == BODY_CRUN);
	var isSearchCtrl = (searchParam.range == BODY_ALL || searchParam.range == BODY_ALLCTRL || IsBodyTypeCtrl(searchParam.range));
	var kmp = new KMP(searchParam.keyWord, searchParam.isWholeWord, searchParam.isMatchCase || searchParam.searchBy == SEARCH_BY_ID);	//搜索序号时可以区分大小写, 加快速度
	
	var ssf = Manager.GetSearchStartFocus();
	var newFocus = new Pointer();

	for (round=0; round<2; ++round) {
		//search ctrl ----------------------------------------------------------
		if (!isAfterFocus && ssf.IsOnCtrl()) {
			isAfterFocus = true;
			if (isSearchCtrl)
				j = ssf.p.index - 1;
			else
				j = -1;
		} else if (isAfterFocus && isSearchCtrl) {
			j = Manager.ctrl.length-1;
		} else if (isAfterFocus && !isSearchCtrl && ssf.IsOnCtrl()) {
			return false;
		} else {
			j = -1;
		}

		for (; j>=0; --j) {
			if (searchParam.range == BODY_ALL || searchParam.range == BODY_ALLCTRL || Manager.ctrl[j].style == searchParam.range) {
				if (searchParam.searchBy == SEARCH_BY_NAME)
					isMatch = kmp.IsMatch(Manager.ctrl[j].name);
				else
					isMatch = kmp.IsMatch(Manager.ctrl[j].initOrder + "");
				if (ssf.IsCtrlSame(Manager.ctrl[j])) {
					return isMatch;
				} else if (isMatch) {
					newFocus.SetOnCtrl(Manager.ctrl[j], true);
					Manager.FocusBodyPaint(newFocus);
					return true;
				}
			}
		}

		//search crun ----------------------------------------------------------
		if (!isAfterFocus && ssf.IsOnCrun()) {
			isAfterFocus = true;
			if (isSearchCrun)
				j = ssf.p.index - 1;
			else
				j = -1;
		} else if (isAfterFocus && isSearchCrun) {
			j = Manager.crun.length - 1;
		} else if (isAfterFocus && !isSearchCrun && ssf.IsOnCrun()) {
			return false;
		} else {
			j = -1;
		}

		for (; j>=0; --j) {
			if (searchParam.searchBy == SEARCH_BY_NAME)
				isMatch = kmp.IsMatch(Manager.crun[j].name);
			else
				isMatch = kmp.IsMatch(Manager.crun[j].initOrder + "");
			if (ssf.IsCrunSame(Manager.crun[j])) {
				return isMatch;
			} else if (isMatch) {
				newFocus.SetOnCrun(Manager.crun[j], true);
				Manager.FocusBodyPaint(newFocus);
				return true;
			}
		}

		//search lead ----------------------------------------------------------
		if (!isAfterFocus && ssf.IsOnLead()) {
			isAfterFocus = true;
			if (isSearchLead)
				j = ssf.p.index - 1;
			else
				j = -1;
		} else if (isAfterFocus && isSearchLead) {
			j = Manager.lead.length - 1;
		} else if (isAfterFocus && !isSearchLead && ssf.IsOnLead()) {
			return false;
		} else {
			j = -1;
		}

		for (; j>=0; --j) {
			isMatch = kmp.IsMatch(Manager.lead[j].initOrder + "");
			if (ssf.IsLeadSame(Manager.lead[j])) {
				return isMatch;
			} else if (isMatch) {
				newFocus.SetOnLead(Manager.lead[j], true);
				Manager.FocusBodyPaint(newFocus);
				return true;
			}
		}
	}

	return false;
};
