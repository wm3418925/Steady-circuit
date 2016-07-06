var KMP = {
	CreateNew: function(keyWord, isWholeWord, isMatchCase) {
		var newObj = {"keyWord": keyWord, "isWholeWord":isWholeWord, "isMatchCase":isMatchCase};
		newObj.__proto__ = KMP;
		return newObj;
	},
	IsMatch: function(str) {
		var tmpKey = this.keyWord;
		if (!isMatchCase) {
			str = str.toUpperCase();
			tmpKey = tmpKey.toUpperCase();
		}
		
		if (isWholeWord) {
			return str == tmpKey;
		} else {
			return str.match(tmpKey) != null;
		}
	}
};