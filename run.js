var page = require('webpage').create();
var system = require('system');
savePath = system.args[1];

page.open('report.html', function () {
    page.viewportSize = { width: 600, height: 800 };
    page.zoomFactor = 1;
    page.paperSize = {
        format: 'A4',
        orientation: 'portrait',
        border: "0.8cm"
    };
    page.render(savePath);
    phantom.exit();
});