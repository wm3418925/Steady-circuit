var globalMPD = null;

var MyPropertyDlg = {
	GenerateLabelId : function(index) {return "MPDLabelElement" + index;},
	GenerateTagId : function(index) {return "MPDTagElement" + index;},
	
	// 回调函数 changedCallback, dlgEndCallback 都不携带任何参数
	CreateNew : function(list, readonly, modelId, windowTitle, wndParent, changedCallback, dlgEndCallback) {
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
			m_modelId: modelId,			//示例
			m_readonly: readonly,		//是否只读
			m_list: list,				//数据列表

			m_inter: inter,	// x:控件 与 数据提示text 的间距; y:控件之间 或者 数据提示text 之间 的间距

			m_firstNotePos: firstNotePos,	//第一个数据提示text起始坐标
			m_noteTextSize: noteTextSize,	//数据提示text大小

			m_firstCtrlPos: firstCtrlPos,	//第一个控件起始坐标
			m_tagSize: tagSize,				//控件大小
			
			m_okButtonPos: okButtonPos,	//确定按钮的坐标
			m_cancelButtonPos: cancelButtonPos,	//取消按钮的坐标
			
			m_wndSize: wndSize,	//窗口大小
			
			m_changedCallback: changedCallback,	// 点击确定修改值的回调
			m_dlgEndCallback: dlgEndCallback,	// 窗口关闭回调
			
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
		
		var tdStrArray = ["<td style='border:1px solid #aaa;'></td>", "<td style='background-color:#F3F3F3;border:1px solid #aaa;'></td>"];

		for (var i=0; i<this.m_list.GetListSize(); ++i) {
			var tr = $("<tr></tr>");
			table.append(tr);
			
			var labelTd = $(tdStrArray[i&1])
			tr.append(labelTd);
			labelTd.append(this.CreateLabel(i, this.m_list.noteTextList[i]));
			
			var valueTd = $(tdStrArray[i&1]);
			tr.append(valueTd);

			var valueElement = null;
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
				var tmpDiv = $("<div></div>");
				valueTd.append(tmpDiv);
				this.CreateColorPicker(i, this.m_list.GetRowData(i), tmpDiv);
				break;
			}
			if (valueElement)
				valueTd.append(valueElement);
		}
		
		
		var dlgDiv = $("#myStoreDlgDiv");
		if (dlgDiv && dlgDiv.length > 0)
			dlgDiv.remove();
		dlgDiv = $("<div id='myStoreDlgDiv' ></div>").appendTo($("#body"));
		dlgDiv.append(table);
		
		var layerParam = {
			type: 1,
			scrollbar: false,
			area: 'auto',
			maxWidth: 500,
			
			title: this.m_windowTitle,
			content: table,
			
			moveEnd: function() {
				// 移动完毕后, 所有子标签失去焦点
				for (var i=0; i<globalMPD.m_list.GetListSize(); ++i) {
					$("#"+MyPropertyDlg.GenerateTagId(i)).blur();
				}
			},
			end: function(){
				if (globalMPD.m_dlgEndCallback)
					globalMPD.m_dlgEndCallback();
			}
		};
		if (!this.m_readonly) {
			layerParam.btn = ['保存', '取消'];
			layerParam.yes = MyPropertyDlg.OnOK;
			layerParam.no = null;
		}
		globalMPD = this;
		this.m_layerIndex = layer.open(layerParam);
	},
	
	//创建label控件
	CreateLabel : function(id, text) {
		var element = $("<p style='margin:0px;' id='" + MyPropertyDlg.GenerateLabelId(id) + "'>" + text + "</p>");
		element.css({"width": this.m_noteTextSize.cx+"px", "height": this.m_noteTextSize.cy+"px"});
		return element;
	},
	//创建checkbox控件
	CreateCheck : function(id, checked) {
		var element = $("<input type='checkbox' id='" + MyPropertyDlg.GenerateTagId(id) + "' />");
		element.css({"width": "25px", "height": (this.m_tagSize.cy-5)+"px", "margin":"0px", "verticalAlign":"middle"});
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
		element.css({"width": this.m_tagSize.cx+"px", "height": this.m_tagSize.cy+"px", "border": "0px", "backgroundColor":"transparent"});
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
	CreateColorPicker : function(id, initValue, parentDiv) {
		var initColor = PaintCommonFunc.HexToRGBStr(initValue).toUpperCase();
		var id = MyPropertyDlg.GenerateTagId(id);
		
		var input = $('<input id="' + id + '" value="' + initColor + '" />');
		parentDiv.append(input);
		input.colorPicker({
			customBG: initColor,
			readOnly: true,
			noAlpha: true,
			size: 1,
			noResize: true,
			init: function(elm, colors) { // colors is a different instance (not connected to colorPicker)
				elm.style.backgroundColor = elm.value;
				elm.style.color = colors.rgbaMixCustom.luminance > 0.22 ? '#222' : '#DDD';
			}
		});
		
		return null;
	},


	//按确定按钮
	OnOK : function(index, layero) {
		if (globalMPD.m_readonly) {	//只读状态不返回有效信息
			parent.layer.close(globalMPD.m_layerIndex);
			return;
		}

		var errorType = ERROR_NO;
		var i;
		var listSize = globalMPD.m_list.GetListSize();

		//测试数据
		for (i=0; i<listSize; ++i) {
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

			if (1 == listSize) {
				showText = errorText + "<br>请重新输入!";
			} else {
				showText = "第<span style='color:#30E030'>"+(i+1)+"</span>个数据项 ["
						+ "<span style='color:#30E030'>"+globalMPD.m_list.noteTextList[i]+"</span>] 错误<br>"
						+ "<span style='color:#E03030'>" + errorText + "</span>";
			}
			swal({title: "请重新输入!", text: showText, type: "warning", html: true},
				function() {
					document.getElementById(MyPropertyDlg.GenerateTagId(i)).focus();	//数据不合法控件获得焦点
				}
			);
			return false;
		}

		//测试成功写入数据
		for (i=0; i<listSize; ++i)
			globalMPD.m_list.SaveAMember(i, document.getElementById(MyPropertyDlg.GenerateTagId(i)));

		// 关闭layer
		parent.layer.close(globalMPD.m_layerIndex);
		
		// 写入成功回调
		if (globalMPD.m_changedCallback != null) globalMPD.m_changedCallback();
	}
};
