var globalMPD = null;

var MyPropertyDlg = {
	GenerateLabelId : function(index) {return "MPDLabelElement" + index;},
	GenerateTagId : function(index) {return "MPDTagElement" + index;},
	
	CreateNew : function(list, readonly, modelId, windowTitle, wndParent) {
		var inter = {x: 20, y: 15};
		var firstNotePos = {x: 20, y: 20};
		var noteTextSize = {cx: 180, cy: 20};
		var firstCtrlPos = {x: firstNotePos.x + noteTextSize.cx + inter.x, y: firstNotePos.y};	//第一个控件起始坐标
		var tagSize = {cx: 300, cy: noteTextSize.cy};	//控件大小
		var okButtonPos = {x: firstCtrlPos.x, y: firstCtrlPos.y + (tagSize.cy + inter.y) * list.GetListSize()};
		var cancelButtonPos = {x: okButtonPos.x + 150 + inter.x, y: okButtonPos.y};
		var wndSize = {cx: firstCtrlPos.x + tagSize.cx + inter.x + 10, cy: cancelButtonPos.y + 70};
		
		return {
			m_windowTitle: windowTitle,	//窗口名称
			m_modelId: modelId,				//示例
			m_readonly: readonly,		//是否只读
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
		var table = $("<table style='margin:10px;'></table>");
		var thead = $("<thead></thead>").appendTo(table);
		var tbody = $("<tbody></tbody>").appendTo(table);
		
		if (this.m_modelId != null) {
			var tr = $("<tr style='border: 0px;'></tr>");
			tr.appendTo(table);
			
			tr.append($("<td></td>").append($("<img style='margin:10px;' src='" + document.getElementById(this.m_modelId).src + "'></img>")));
			tr.append($("<td></td>"));
		}

		for (var i=0; i<this.m_list.GetListSize(); ++i) {
			var tr = $("<tr style='border: 1px solid #e4eaec;'></tr>");
			tr.appendTo(table);
			
			tr.append($("<td style='border: 0px'></td>").append(this.CreateLabel(i, this.m_list.noteTextList[i])));

			var valueElement;
			switch (this.m_list.dataTypeList[i]) {
			case DATA_TYPE_float:
			case DATA_TYPE_uint:
			case DATA_TYPE_string:
				valueElement = this.CreateInput(i, this.m_list.GetRowData(i), this.m_list.dataTypeList[i]);
				break;

			case DATA_TYPE_bool:
				valueElement = this.CreateCheck(i, this.m_list.GetRowData(i));
				break;

			case DATA_TYPE_enum:
				var optionArray = this.m_list.memberNameList[i].noteList;
				valueElement = this.CreateSelect(i, optionArray, this.m_list.GetRowData(i));
				break;
				
			case DATA_TYPE_color:
				valueElement = this.CreateColorPicker(i, this.m_list.GetRowData(i));
				break;
			}
			tr.append($("<td style='border: 0px'></td>").append(valueElement));
		}
		
		
		var div = $("#myStoreDlgDiv");
		if (div && div.length > 0)
			div.remove();
		div = $("<div id='myStoreDlgDiv' ></div>").appendTo($("#body"));
		div.append(table);
		
		var layerParam = {
			type: 1,
			scrollbar: false,
			area: 'auto',
			maxWidth: 500,
			
			title: this.m_windowTitle,
			content: table
		};
		if (!this.m_readonly) {
			layerParam.btn = ['保存', '取消'];
			layerParam.yes = MyPropertyDlg.OnOK;
			layerParam.no = null;
		}
		globalMPD = this;
		this.layerIndex = layer.open(layerParam);
	},
	
	//创建label控件
	CreateLabel : function(id, text) {
		var element = $("<p style='margin:0px;' id='" + MyPropertyDlg.GenerateLabelId(id) + "'>" + text + "</p>");
		element.css({"width": this.m_noteTextSize.cx+"px"/*, "height": this.m_noteTextSize.cy+"px"*/});
		if (id & 2)
			element.css({"backgroundColor": "#EFEFEF"});
		
		return element;
	},
	//创建checkbox控件
	CreateCheck : function(id, checked) {
		var element = $("<input type='checkbox' id='" + MyPropertyDlg.GenerateTagId(id) + "' />");
		element.css({"width": this.m_tagSize.cx+"px", "height": this.m_tagSize.cy+"px"});
		if (id & 2)
			element.css({"backgroundColor": "#EFEFEF"});
		if (this.m_readonly)
			element.attr("disabled", "disabled");
		
		if (checked)
			element.attr("checked", "checked");
		
		return element;
	},
	//创建select控件
	CreateSelect : function(id, optionNoteArray, selIndex) {
		var element = $("<select id='" + MyPropertyDlg.GenerateTagId(id) + "'></select>");
		element.css({"width": this.m_tagSize.cx+"px", "height": this.m_tagSize.cy+"px"});
		if (id & 2)
			element.css({"backgroundColor": "#EFEFEF"});
		if (this.m_readonly)
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
		var element = $("<input id='" + MyPropertyDlg.GenerateTagId(id) + "' value='" + initValue + "' />");
		element.css({"width": this.m_tagSize.cx+"px", "height": this.m_tagSize.cy+"px"});
		if (id & 2)
			element.css({"backgroundColor": "#EFEFEF"});
		if (this.m_readonly)
			element.attr("readonly", "true");
		
		switch (valueType) {
		case DATA_TYPE_float:
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
	CreateColorPicker : function(id, initValue) {
		var initColor = PaintCommonFunc.HexToRGBStr(initValue);
		
		var divHtml = 
			'<div id="wmCustomWidget">' +
				'<div id="wmColorSelector"><div style="background-color: ' + initColor + '" /></div>' + 
				'<div id="wmColorpickerHolder" />' +
			'</div>';
		var div = $(divHtml).appendTo($("#body"));
		
		$('#wmColorpickerHolder').ColorPicker({flat: false});
		return div;
				
				
				
		var element = $("<input id='" + MyPropertyDlg.GenerateTagId(id) + "' value='" + initColor + "' />");
		element.css({"display": "none"});
		if (this.m_readonly)
			element.attr("disabled", "disabled");
		
		var parentDiv = $("<div ></div>");
		parentDiv.css({"width": this.m_tagSize.cx+"px"/*, "height": this.m_tagSize.cy+"px"*/});
		parentDiv.append(element);
		
		element.colorpicker({history: true, color: initColor, displayIndicator: false});
		$("#body").append(parentDiv);
		return parentDiv;
	},


	//按确定按钮
	OnOK : function(index, layero) {
		if (globalMPD.m_readonly) {	//只读状态不返回有效信息
			parent.layer.close(globalMPD.layerIndex);
			return;
		}

		var errorType = ERROR_NO;
		var i;

		//测试数据
		for (i = globalMPD.m_list.GetListSize()-1; i>=0; --i) {
			errorType = globalMPD.m_list.CheckAMember(i, document.getElementById(MyPropertyDlg.GenerateTagId(i)));
			if (errorType != ERROR_NO) break;
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

			if (1 == globalMPD.m_list.GetListSize()) {
				showText = errorText + "\n请重新输入!";
			} else {
				showText = "第"+(i+1)+"个数据项:\n\t"+globalMPD.m_list.noteTextList[i]+"\n"+errorText+"\n请重新输入!";
			}
			alert(showText);
			document.getElementById(MyPropertyDlg.GenerateTagId(i)).focus();	//数据不合法控件获得焦点
			return false;
		}

		//测试成功写入数据
		for (i = globalMPD.m_list.GetListSize()-1; i>=0; --i)
			globalMPD.m_list.SaveAMember(i, document.getElementById(MyPropertyDlg.GenerateTagId(i)));

		parent.layer.close(globalMPD.layerIndex);
	}
};
