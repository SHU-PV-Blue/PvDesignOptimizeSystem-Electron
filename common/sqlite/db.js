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
 * 将数组转化为字符串[1,2,3]形式
 * @param  {} array
 */
function arrayToString(array) {
    return '[' + array.toString() + ']';
}

/**
 * 获取给定经纬度的气象数据，callback(data)，data是[{}]
 * @param  {number} lat 纬度
 * @param  {number} lon 经度
 * @param  {function} callback 回调函数
 */
exports.getWeatherData = function (tableName,lat, lon, callback) {
    lat = (Math.round(lat + 0.5) + 90) % 180 - 90 - 0.5;
    lon = (Math.round(lon + 0.5) + 180) % 360 - 180 - 0.5;
    dbWeather.serialize(function () {
        dbWeather.all('select * from ' + tableName + ' where lat=' + lat + ' and lon=' + lon, function (err, rows) {
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
                    stringToArray(row.data).forEach(function (h, index) {
                        data[index].H = h;
                    });
                } else if (row.type === 'temperature' || row.type === 'humidity' || row.type === 'wind') {
                    stringToArray(row.data).forEach(function (val, index) {
                        data[index][row.type] = val;
                    })
                }
            });
            callback(data, (rows.length === 0));   //第二个参数是数据是否为空
        });
    });
};
/**
 * 保存或更新用户自定义气象数据
 * @param  {} lat 纬度
 * @param  {} lon 经度
 * @param  {} data 气象数据
 */
exports.addOrUpdateWeatherData = function (lat, lon, data) {
    lat = (Math.round(lat + 0.5) + 90) % 180 - 90 - 0.5;
    lon = (Math.round(lon + 0.5) + 180) % 360 - 180 - 0.5;
    var humidity = [], irradiance = [], wind = [], temperature = [];

    data.forEach(function (monthdata) {
        irradiance.push(monthdata.H);
        humidity.push(monthdata.humidity);
        wind.push(monthdata.wind);
        temperature.push(monthdata.temperature);
    });

    dbWeather.serialize(function () {
        dbWeather.all('select * from userdata where lat = ? and lon = ?',[lat,lon],function(err, rows){
            if(err){
                return console.log(err);
            }else if(rows.length === 0){
                alert(0);
                dbWeather.run('insert into userdata (lat,lon,type,data) values(?,?,?,?)',lat,lon,"irradiance", arrayToString(irradiance));
                dbWeather.run('insert into userdata (lat,lon,type,data) values(?,?,?,?)',lat,lon,"humidity", arrayToString(humidity));
                dbWeather.run('insert into userdata (lat,lon,type,data) values(?,?,?,?)',lat,lon,"wind", arrayToString(wind));
                dbWeather.run('insert into userdata (lat,lon,type,data) values(?,?,?,?)',lat,lon,"temperature", arrayToString(temperature));
            }else{
                dbWeather.run("UPDATE userdata SET data=? WHERE type = ? and lat=? and lon=?", arrayToString(irradiance),"irradiance", lat,lon);
                dbWeather.run("UPDATE userdata SET data=? WHERE type = ? and lat=? and lon=?", arrayToString(humidity),"humidity", lat,lon);
                dbWeather.run("UPDATE userdata SET data=? WHERE type = ? and lat=? and lon=?", arrayToString(wind),"wind", lat,lon);
                dbWeather.run("UPDATE userdata SET data=? WHERE type = ? and lat=? and lon=?", arrayToString(temperature),"temperature",lat,lon);
            }
        });
    });
}