var Finance = function(){};

Finance.prototype.NPV = function(rate){
    var rate = rate/100, npv = 0;
    for (var i = 0; i < arguments[1].length; i++) {
        npv += (arguments[1][i] / Math.pow((1 + rate), i));
    }
    return Math.round(npv * 100) / 100;
};