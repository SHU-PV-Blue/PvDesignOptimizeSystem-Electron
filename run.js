var page = require('webpage').create();
var system = require('system');
savePath = system.args[1];
page.open('report.html', function () {
    page.render(savePath);
    phantom.exit();
});