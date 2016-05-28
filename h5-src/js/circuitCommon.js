
IsOnCrun = function(element) {
    return element.hasOwnProperty("lead") && element.lead.length == 4;
};
IsOnCtrl = function(element) {
    return element.hasOwnProperty("resist");
};
IsOnLead = function(element) {
    return element.hasOwnProperty("conBody");
};
