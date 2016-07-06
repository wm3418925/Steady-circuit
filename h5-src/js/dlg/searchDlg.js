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
		if (!dlgDiv || dlgDiv.length <= 0) {
			var outDiv = $("<div id='searchDlgOutDiv' ></div>").appendTo($("#body"));
			dlgDiv = $("<div id='mySStoreDlgDiv' ></div>").appendTo(outDiv);
		}
		
		var layerParam = {
			type: 1,
			title: '搜索',
			shadeClose: true,
			shade: false,
			area: ['245px', '314px'],
			content: dlgDiv,
			
			btn: ['保存', '取消'],
			yes: MySearchDlg.OnOK,
			no: null
		};

		globalMSD = this;
		this.m_layerIndex = layer.open(layerParam);
	},
	
	OnSearch: function() {
		var isMatch;
		if (CanvasMgr.searchParam.isSearchPre)
			isMatch = Manager.SearchPre(CanvasMgr.searchParam);		//搜索上一个
		else
			isMatch = Manager.SearchNext(CanvasMgr.searchParam);	//搜索下一个

		if (!isMatch) swal({title:"未找到匹配 !"});
	}
};
