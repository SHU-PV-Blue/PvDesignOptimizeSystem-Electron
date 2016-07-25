var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./db/pv.db');

exports.getData = function (sql, callback) {
    db.serialize(function () {
        db.all(sql, function (err, rows) {
            if (err) {
                return console.log(err);
            }
            callback(rows, err);
        });
    });
}
