var fs = require('fs');
var devices = JSON.parse(fs.readFileSync('./devices/customer.json', "utf8"));
console.log(devices);

function saveToDiskAndReload() {
    fs.writeFileSync('./devices/customer.json', JSON.stringify(devices, null, "    "), 'utf8');
    devices = JSON.parse(fs.readFileSync('./devices/customer.json', "utf8"));
}

exports.getItems = function (deviceName) {
    var res = [];
    for (var key in devices[deviceName].items) {
        res.push({
            index: key,
            item: devices[deviceName].items[key]
        });
    }
    return res;
}

exports.getItem = function (deviceName, index) {
    return {
        index: index,
        item: devices[deviceName].items[index]
    };
}

exports.saveItem = function (deviceName, index, item) {
    devices[deviceName].items[index] = item;
    saveToDiskAndReload();
}

exports.addItem = function (deviceName, item) {
    var index = ++ devices[deviceName].nextIndex;
    devices[deviceName].items[index] = item;
    saveToDiskAndReload();
}

exports.deleteItem = function(deviceName, index){
    delete devices[deviceName].items[index];
    saveToDiskAndReload();
}