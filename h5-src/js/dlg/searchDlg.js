var globalSearchParam = new SearchParam();

var MySearchDlg = {
	Init : function(wndParent) {
		return MySearchDlg;
	},

	DoModal : function() {
		var dlgDiv = $("#mySStoreDlgDiv");
		var scts = $("#searchCtrlTypeSelect");
		if (scts.children().length <= 0) {
			for (var i=0; i<CTRL_TYPE_NAMES.length; ++i)
				$("<option value='"+i+"'>"+CTRL_TYPE_NAMES[i]+"</option>").appendTo(scts);
			
			var searchOkFunc = function() {
				globalSearchParam.range = $("#searchRangeSelect").val();
				if (0 == globalSearchParam.range)
					globalSearchParam.range = $("#searchCtrlTypeSelect").val();
				globalSearchParam.searchBy = parseInt($("#searchBySelect").val());
				globalSearchParam.keyWord = $("#searchKeywordInput").val();
				globalSearchParam.isWholeWord = $("#searchIsWholeWordInput").prop("checked");
				globalSearchParam.isMatchCase = $("#searchIsMatchCaseInput").prop("checked");
				globalSearchParam.isSearchPre = $("input[name='searchIsPreName']:checked").val() == "true";
				MySearchDlg.OnSearch();
			};
			$("#searchOkButton").bind("click", searchOkFunc);
			
			var searchCancelFunc = function() {
				parent.layer.close(MySearchDlg.m_layerIndex);
			};
			$("#searchCancelButton").bind("click", searchCancelFunc);
		}
		
		var layerParam = {
			type: 1,
			title: '搜索',
			shadeClose: true,
			shade: false,
			area: ['270px', '260px'],
			content: dlgDiv
		};

		MySearchDlg.m_layerIndex = layer.open(layerParam);
	},
	
	OnSearch: function() {
		var isMatch;
		if (globalSearchParam.isSearchPre)
			isMatch = Manager.SearchPre(globalSearchParam);		//搜索上一个
		else
			isMatch = Manager.SearchNext(globalSearchParam);	//搜索下一个

		if (!isMatch) {
			$(".layui-layer-title").html("搜索 - <span style='color:#E03030'>未找到匹配</span>");
		} else {
			$(".layui-layer-title").html("搜索");
		}
	}
};
