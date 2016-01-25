var fs = require('fs');

module.exports = function (log) {
    fs.writeSync(fs.openSync("log.txt", "a"), log);
}

