var _ = require('underscore');
var crc = require('crc');

module.exports.dispatch = function(uid, servers) {
    var index = Math.abs(crc.crc32(uid)) % servers.length;
    return servers[index];
};