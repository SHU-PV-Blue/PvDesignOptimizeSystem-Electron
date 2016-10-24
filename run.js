var page = require('webpage').create();
var system = require('system');
savePath = system.args[1];

page.open('report.html', function () {
    page.paperSize = {
        format: 'A4',
        orientation: 'portrait',
        border: "0.8cm"
    }
    page.render(savePath);
    phantom.exit();
});