var sqlite3 = require('sqlite3').verbose();
var dbDevice = new sqlite3.Database('./db/pv.db');
var dbWeather = new sqlite3.Database('./db/weather.db');

/**
 * 执行sql语句
 * @param  {string} sql
 * @param  {function} callback
 */
exports.getData = function (sql, callback) {
    dbDevice.serialize(function () {
        dbDevice.all(sql, function (err, rows) {
            if (err) {
                return console.log(err);
            }
            callback(rows, err);
        });
    });
};

/**
 * 将字符串表示的数据数组转化为一个数组
 * @param  {string} s
 */
function stringToArray(s) {
    return s.substring(1, s.length - 1).split(',').map(function (item) {
        return item === 'null' ? 0 : Number(item);
    });
}

/**
 * 获取给定经纬度的气象数据，callback(data)，data是[{}]
 * @param  {number} lat 纬度
 * @param  {number} lon 经度
 * @param  {function} callback 回调函数
 */
exports.getWeatherData = function (lat, lon, callback) {
    lat = (Math.round(lat + 0.5) + 90) % 180 - 90 - 0.5;
    lon = (Math.round(lon + 0.5) + 180) % 360 - 180 - 0.5;
    dbWeather.serialize(function () {
        dbWeather.all('select * from nasaweather where lat=' + lat + ' and lon=' + lon, function (err, rows) {
            if (err) {
                return console.log(err);
            }
            var data = [];
            var i;
            for (i = 0; i < 12; i++) {
                data.push({});
            }
            rows.forEach(function (row) {
                if (row.type === 'irradiance') {
                    stringToArray(row.data).forEach(function (h,index) {
                        data[index].H = h;
                    });
                } else if (row.type === 'temperature' || row.type === 'humidity' || row.type === 'wind') {
                    stringToArray(row.data).forEach(function(val,index){
                        data[index][row.type] = val;
                    })
                }
            });
            callback(data);
        });
    });
};