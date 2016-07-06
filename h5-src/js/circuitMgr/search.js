
//搜索下一个物体
Manager.SearchNext = function(searchParam) {
	var isAfterFocus = false;
	var isMatch;
	var round, j;
	var isSearchLead = (searchParam.range == BODY_ALL || searchParam.range == BODY_LEAD) && searchParam.searchBy == SEARCH_BY_ID;
	var isSearchCrun = (searchParam.range == BODY_ALL || searchParam.range == BODY_CRUN);
	var isSearchCtrl = (searchParam.range == BODY_ALL || searchParam.range == BODY_ALLCTRL || Pointer.IsCtrl(searchParam.range));
	var kmp = KMP.CreateNew(searchParam.keyWord, searchParam.isWholeWord, searchParam.isMatchCase || searchParam.searchBy == SEARCH_BY_ID);	//搜索序号时可以区分大小写, 加快速度
	var newFocus = Pointer.CreateNew();

	for (round=0; round<2; ++round) {
		//search lead ----------------------------------------------------------
		if (!isAfterFocus && Manager.focusBody.IsOnLead()) {
			isAfterFocus = true;
			if (isSearchLead)
				j = Manager.focusBody.p.index + 1;
			else
				j = Manager.lead.length;
		} else if (isAfterFocus && isSearchLead) {
			j = 0;
		} else if (isAfterFocus && !isSearchLead && Manager.focusBody.IsOnLead()) {
			return false;
		} else {
			j = Manager.lead.length;
		}

		for (; j<Manager.lead.length; ++j) {
			var str = Manager.lead[j].initOrder + "";
			isMatch = kmp.IsMatch(str);
			if (Manager.focusBody.IsLeadSame(Manager.lead[j])) {
				return isMatch;
			} else if (isMatch) {
				newFocus.SetOnLead(Manager.lead[j], true);
				Manager.FocusBodyPaint(newFocus);
				return true;
			}
		}

		//search crun ----------------------------------------------------------
		if (!isAfterFocus && Manager.focusBody.IsOnCrun()) {
			isAfterFocus = true;
			if (isSearchCrun)
				j = Manager.focusBody.p.index + 1;
			else
				j = Manager.crun.length;
		} else if (isAfterFocus && isSearchCrun) {
			j = 0;
		} else if (isAfterFocus && !isSearchCrun && Manager.focusBody.IsOnCrun()) {
			return false;
		} else {
			j = Manager.crun.length;
		}

		for (; j<Manager.crun.length; ++j) {
			if (searchParam.searchBy == SEARCH_BY_NAME) {
				isMatch = kmp.IsMatch(Manager.crun[j].name);
			} else {
				var str = Manager.crun[j].initOrder + "";
				isMatch = kmp.IsMatch(str);
			}
			if (Manager.focusBody.IsCrunSame(Manager.crun[j])) {
				return isMatch;
			} else if (isMatch) {
				newFocus.SetOnCrun(Manager.crun[j], true);
				Manager.FocusBodyPaint(newFocus);
				return true;
			}
		}

		//search ctrl ----------------------------------------------------------
		if (!isAfterFocus && Manager.focusBody.IsOnCtrl()) {
			isAfterFocus = true;
			if (isSearchCtrl)
				j = Manager.focusBody.p.index + 1;
			else
				j = Manager.ctrl.length;
		} else if (isAfterFocus && isSearchCtrl) {
			j = 0;
		} else if (isAfterFocus && !isSearchCtrl && Manager.focusBody.IsOnCtrl()) {
			return false;
		} else {
			j = Manager.ctrl.length;
		}

		for (; j<Manager.ctrl.length; ++j) {
			if (searchParam.range == BODY_ALL || searchParam.range == BODY_ALLCTRL || Manager.ctrl[j].style == searchParam.range) {
				if (searchParam.searchBy == SEARCH_BY_NAME) {
					isMatch = kmp.IsMatch(Manager.ctrl[j].name);
				} else {
					var str = Manager.ctrl[j].initOrder + "";
					isMatch = kmp.IsMatch(str);
				}
				if (Manager.focusBody.IsCtrlSame(Manager.ctrl[j])) {
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
	var isSearchCtrl = (searchParam.range == BODY_ALL || searchParam.range == BODY_ALLCTRL || Pointer.IsCtrl(searchParam.range));
	var kmp = KMP.CreateNew(searchParam.keyWord, searchParam.isWholeWord, searchParam.isMatchCase || searchParam.searchBy == SEARCH_BY_ID);	//搜索序号时可以区分大小写, 加快速度
	var newFocus = Pointer.CreateNew();

	for (round=0; round<2; ++round) {
		//search ctrl ----------------------------------------------------------
		if (!isAfterFocus && Manager.focusBody.IsOnCtrl()) {
			isAfterFocus = true;
			if (isSearchCtrl)
				j = Manager.focusBody.p.index - 1;
			else
				j = -1;
		} else if (isAfterFocus && isSearchCtrl) {
			j = Manager.ctrl.length-1;
		} else if (isAfterFocus && !isSearchCtrl && Manager.focusBody.IsOnCtrl()) {
			return false;
		} else {
			j = -1;
		}

		for (; j>=0; --j) {
			if (searchParam.range == BODY_ALL || searchParam.range == BODY_ALLCTRL || Manager.ctrl[j].style == searchParam.range) {
				if (searchParam.searchBy == SEARCH_BY_NAME) {
					isMatch = kmp.IsMatch(Manager.ctrl[j].name);
				} else {
					var str = Manager.ctrl[j].initOrder + "";
					isMatch = kmp.IsMatch(str);
				}
				if (Manager.focusBody.IsCtrlSame(Manager.ctrl[j])) {
					return isMatch;
				} else if (isMatch) {
					newFocus.SetOnCtrl(Manager.ctrl[j], true);
					Manager.FocusBodyPaint(newFocus);
					return true;
				}
			}
		}

		//search crun ----------------------------------------------------------
		if (!isAfterFocus && Manager.focusBody.IsOnCrun()) {
			isAfterFocus = true;
			if (isSearchCrun)
				j = Manager.focusBody.p.index - 1;
			else
				j = -1;
		} else if (isAfterFocus && isSearchCrun) {
			j = Manager.crun.length - 1;
		} else if (isAfterFocus && !isSearchCrun && Manager.focusBody.IsOnCrun()) {
			return false;
		} else {
			j = -1;
		}

		for (; j>=0; --j) {
			if (searchParam.searchBy == SEARCH_BY_NAME) {
				isMatch = kmp.IsMatch(Manager.crun[j].name);
			} else {
				var str = Manager.crun[j].initOrder + "";
				isMatch = kmp.IsMatch(str);
			}
			if (Manager.focusBody.IsCrunSame(Manager.crun[j])) {
				return isMatch;
			} else if (isMatch) {
				newFocus.SetOnCrun(Manager.crun[j], true);
				Manager.FocusBodyPaint(newFocus);
				return true;
			}
		}

		//search lead ----------------------------------------------------------
		if (!isAfterFocus && Manager.focusBody.IsOnLead()) {
			isAfterFocus = true;
			if (isSearchLead)
				j = Manager.focusBody.p.index - 1;
			else
				j = -1;
		} else if (isAfterFocus && isSearchLead) {
			j = Manager.lead.length - 1;
		} else if (isAfterFocus && !isSearchLead && Manager.focusBody.IsOnLead()) {
			return false;
		} else {
			j = -1;
		}

		for (; j>=0; --j) {
			var str = Manager.lead[j].initOrder + "";
			isMatch = kmp.IsMatch(str);
			if (Manager.focusBody.IsLeadSame(Manager.lead[j])) {
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
