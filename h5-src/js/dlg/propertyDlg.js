
var MyPropertyDlg = {
	labelIdPrefix : "MPDLabelElement",
	tagIdPrefix : "MPDTagElement",
	
	CreateNew : function(list, readOnly, model, windowTitle, wndParent) {
		var inter = {x: 20, y: 15};
		var firstNotePos = {x: 20, y: 20};
		var noteTextSize = {cx: 180, cy: 20};
		var firstCtrlPos = {x: firstNotePos.x + noteTextSize.cx + inter.x, y: firstNotePos.y};	//第一个控件起始坐标
		var tagSize = {cx: 300, cy: noteTextSize.cy};	//控件大小
		var okButtonPos = {x: firstCtrlPos.x, y: firstCtrlPos.y + (tagSize.cy + inter.y) * list.GetListSize()};
		var cancelButtonPos = {x: okButtonPos.x + 150 + m_inter.x, y: okButtonPos.y};
		var wndSize = {cx: firstCtrlPos.x + tagSize.cx + inter.x + 10, cy: cancelButtonPos.y + 70};
		
		return {
			m_windowTitle: windowTitle,	//窗口名称
			m_model: model,				//示例
			m_readOnly: readOnly,		//是否只读
			m_list: list,				//数据列表

			m_inter: inter,	// x:控件 与 数据提示text 的间距; y:控件之间 或者 数据提示text 之间 的间距

			m_firstNotePos: firstNotePos,	//第一个数据提示text起始坐标
			m_noteTextSize: noteTextSize,	//数据提示text大小

			m_firstCtrlPos: firstCtrlPos,	//第一个控件起始坐标
			m_tagSize: tagSize,			//控件大小
			
			m_okButtonPos: okButtonPos,	//确定按钮的坐标
			m_cancelButtonPos: cancelButtonPos,	//取消按钮的坐标
			
			m_wndSize: wndSize,	//窗口大小
			
			__proto__: MyPropertyDlg
		};
	},

	DoModal : function() {
		var div = $("<div></div>");
		if (this.m_model != null) {
			MyPropertyDlg.CreateLabel(0, "示例").appendTo(div);
			$("<img src='" + this.m_model + "'></img>").appendTo(div);
		}

		for (var i=0; i<this.m_list.GetListSize(); ++i) {
			MyPropertyDlg.CreateLabel(i+1, this.m_list.noteText[i]).appendTo(div);

			switch (this.m_list.dataTypeList[i]) {
			case DATA_STYLE_float:
			case DATA_TYPE_uint:
			case DATA_TYPE_string:
				MyPropertyDlg.CreateInput(i+1, this.m_list.GetRowData(i), this.m_list.dataTypeList[i]).appendTo(div);
				break;

			case DATA_STYLE_bool:
				MyPropertyDlg.CreateCheck(i+1, this.m_list.GetRowData(i)).appendTo(div);
				break;

			case DATA_STYLE_enum:
				var optionArray = this.m_list.memberNameList[i].noteList;
				MyPropertyDlg.CreateSelect(i+1, optionArray, this.m_list.GetRowData(i)).appendTo(div);
				break;
				
			case DATA_TYPE_color:
				break;
			}
		}
		
		this.layerIndex = layer.open({
			type: 1,
			scrollbar: false,
			
			title: this.m_windowTitle,
			content: div,
			yes: ProperyDlg.OnOK
		});
	},
	
	//创建label控件
	CreateLabel : function(id, text) {
		var element = $("<span id=" + MyPropertyDlg.labelIdPrefix+id + ">" + text + "</span>");
		element.css({"width": this.m_noteTextSize.cx+"px", "height": this.m_noteTextSize.cy+"px"});
		if (id & 2)
			element.css({"border": "1px lightgrey solid"});
		
		return element;
	},
	//创建checkbox控件
	CreateCheck : function(id, checked) {
		var element = $("<input type='checkbox' id=" + MyPropertyDlg.tagIdPrefix+id + " />");
		element.css({"width": this.m_tagSize.cx+"px", "height": this.m_tagSize.cy+"px"});
		if (id & 2)
			element.css({"border": "1px lightgrey solid"});
		if (this.m_readOnly)
			element.attr("disabled", "disabled");
		
		if (checked)
			element.attr("checked", "checked");
		
		return element;
	},
	//创建select控件
	CreateSelect : function(id, optionNoteArray, selIndex) {
		var element = $("<select id=" + MyPropertyDlg.tagIdPrefix+id + "></select>");
		element.css({"width": this.m_tagSize.cx+"px", "height": this.m_tagSize.cy+"px"});
		if (id & 2)
			element.css({"border": "1px lightgrey solid"});
		if (this.m_readOnly)
			element.css({"disabled": "disabled"});
		
		for (var i=0; i<optionNoteArray.length; ++i) {
			var option = $("<option value=" + optionNoteArray[i] + ">" + optionNoteArray[i] + "</option>").appendTo(element);
			if (selIndex == i) 
				option.attr("selected", "true");
		}
		
		return element;
	},
	// 创建input控件
	CreateInput : function(id, initValue, valueType) {
		var element = $("<input id=" + MyPropertyDlg.tagIdPrefix+id + " />");
		element.css({"width": this.m_tagSize.cx+"px", "height": this.m_tagSize.cy+"px"});
		if (id & 2)
			element.css({"border": "1px lightgrey solid"});
		if (this.m_readOnly)
			element.attr("disabled", "disabled");
		
		switch (valueType) {
		case DATA_STYLE_float:
			element.attr("type", "text");
			element.attr("maxLength", 17);
			break;
		case DATA_TYPE_uint:
			element.attr("type", "number");
			element.attr("maxLength", 9);
			break;
		case DATA_TYPE_string:
			element.attr("type", "text");
			element.attr("maxLength", NAME_LEN);
			break;
		default:
			return null;
		}
		
		return element;
	},


	//按确定按钮
	OnOK : function(index, layero) {
		if (this.m_readOnly) {	//只读状态不返回有效信息
			parent.layer.close(this.layerIndex);
			return;
		}

		var errorType = ERROR_NO;
		var i;

		//测试数据
		for (i = this.m_list.GetListSize()-1; i>=0; --i) {
			errorType = this.m_list.CheckAMember(i, GetDlgItem(CTRLID(i)));
			if(errorType != ERROR_NO) break;
		}

		//出错提示
		if (errorType != ERROR_NO) {
			var showText;
			var errorText;

			switch (errorType) { //错误类型
			case ERROR_STRNULL:
				errorText = "数据项不能为空!";
				break;
			case ERROR_FLOATMIX:
				errorText = "浮点类型数据只能有数字和最多一个小数点!";
				break;
			case ERROR_UINTMIX:
				errorText = "正整数含有数字以外的其他字符!";
				break;
			case ERROR_UINTOVER:
				errorText = "整数不在允许的范围内!";
				break;
			case ERROR_ENUMOVER:
				errorText = "没有选择选项中的某一个!";
				break;
			case ERROR_STRMIX:
				errorText = "标签中不能包含 [ ] ( ) { }";
				break;
			case ERROR_ENUMNOTALLOWED:
				errorText = "选定结点或者选定电学元件颜色不能为黑色 !";
				break;
			}

			if (1 == this.m_list.GetListSize()) {
				showText = errorText + "\n请重新输入!";
			} else {
				showText = "第"+(i+1)+"个数据项:\n\t"+this.m_list.noteTextList[i]+"\n"+errorText+"\n请重新输入!";
			}
			alert(showText);
			document.getElementById(tagIdPrefix+(i+1)).focus();	//数据不合法控件获得焦点
			return;
		}

		//测试成功写入数据
		for (i = this.m_list.GetListSize()-1; i>=0; --i)
			this.m_list.SaveAMember(i, GetDlgItem(CTRLID(i)));

		parent.layer.close(this.layerIndex);
	}
};
