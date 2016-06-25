
function pageOnload() {
	var canvas = document.getElementById("myCanvas");
	Manager.Init(canvas);
	//Manager.ReadFile("testData.json");
	//Manager.PaintAll();
	//ComputeMgr.ComputeElec(Manager.lead,Manager.crun,Manager.ctrl);
};
function onReadFromJson() {
	Manager.ReadFile("testData.json");
	Manager.PaintAll();
}
function onComputeElec() {
	ComputeMgr.ComputeElec(Manager.lead,Manager.crun,Manager.ctrl);
}


function onLClick() {Manager.SetTextColor();
}
function onDbLClick() {
	var pos = GetClientPosOfEvent();
	Manager.ShowBodyElec(FOCUS_OR_POS.CreateNew(false, pos));
	Manager.PaintAll();
}
function onMouseUp() {
}