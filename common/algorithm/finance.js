var Finance = function () { };

// seekZero seeks the zero point of the function fn(x), accurate to within x \pm 0.01. fn(x) must be decreasing with x.
function seekZero(fn) {
    var x = 1;
    while (fn(x) > 0) {
        x += 1;
    }
    while (fn(x) < 0) {
        x -= 0.01
    }
    return x + 0.01;
}

Finance.prototype.NPV = function (rate) {
    var rate = rate / 100, npv = 0;
    for (var i = 0; i < arguments[1].length; i++) {
        npv += (arguments[1][i] / Math.pow((1 + rate), i + 1));
    }
    return Math.round(npv * 100) / 100;
};

Finance.prototype.IRR = function (cfs) {
    var args = arguments;
    function npv(rate) {
        var rrate = (1 + rate / 100);
        var npv = args[0];
        for (var i = 1; i < args.length; i++) {
            npv += (args[1][i] / Math.pow(rrate, i));
        }
        return npv;
    }
    return Math.round(seekZero(npv) * 100) / 100;
};

module.exports = Finance;