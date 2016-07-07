var globalMSD = null;
var globalSearchParam = SearchParam.CreateNew();

var MySearchDlg = {
	CreateNew : function(wndParent) {
		return {
			__proto__: MySearchDlg
		};
	},

	DoModal : function() {
		var dlgDiv = $("#mySStoreDlgDiv");
		var scts = $("#searchCtrlTypeSelect");
		if (scts.children().length <= 0) {
			var searchOkFunc = function() {
				globalSearchParam.searchRange = $("#searchRangeSelect").val();
				if (0 == globalSearchParam.searchRange)
					globalSearchParam.searchRange = $("#searchCtrlTypeSelect").val();
				globalSearchParam.searchBy = parseInt($("#searchBySelect").val());
				globalSearchParam.keyWord = $("#searchKeywordInput").val();
				globalSearchParam.isWholeWord = $("#searchIsWholeWordInput").prop("checked");
				globalSearchParam.isMatchCase = $("#searchIsMatchCaseInput").prop("checked");
				globalSearchParam.isSearchPre = $("input[name='searchIsPreName']:checked").val() == "true";
				globalMSD.OnSearch();
			};
			$("#searchOkButton").bind("click", searchOkFunc);
			
			var searchCancelFunc = function() {
				parent.layer.close(globalMSD.m_layerIndex);
			};
			$("#searchCancelButton").bind("click", searchCancelFunc);
			
			for (var i=0; i<CTRL_TYPE_NAMES.length; ++i)
				$("<option value='"+i+"'>"+CTRL_TYPE_NAMES[i]+"</option>").appendTo(scts);
		}
		
		var layerParam = {
			type: 1,
			title: '搜索',
			shadeClose: true,
			shade: false,
			area: ['300px', '320px'],
			content: dlgDiv
		};

		globalMSD = this;
		this.m_layerIndex = layer.open(layerParam);
	},
	
	OnSearch: function() {
		var isMatch;
		if (globalSearchParam.isSearchPre)
			isMatch = Manager.SearchPre(globalSearchParam);		//搜索上一个
		else
			isMatch = Manager.SearchNext(globalSearchParam);	//搜索下一个

		if (!isMatch) swal({title:"未找到匹配 !"});
	}
};
