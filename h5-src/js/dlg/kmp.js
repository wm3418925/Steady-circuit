function KMP(keyWord, isWholeWord, isMatchCase) {
	this.keyWord = keyWord;
	this.isWholeWord = isWholeWord
	this.isMatchCase = isMatchCase;
}

KMP.prototype.IsMatch = function(str) {
	var tmpKey = this.keyWord;
	if (!this.isMatchCase) {
		str = str.toUpperCase();
		tmpKey = tmpKey.toUpperCase();
	}
	
	if (this.isWholeWord) {
		return str == tmpKey;
	} else {
		return str.match(tmpKey) != null;
	}
};
