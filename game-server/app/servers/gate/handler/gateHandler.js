var async = require('async');
var dispatcher = require('../../../util/dispatcher');
var code = require('../../../code');

var Handler = function (app) {
    this.app = app;
};
Handler.prototype.queryConnector = function (msg, session, next) {
    var connectors = this.app.getServersByType('connector');
    if (!connectors || connectors.length === 0) {
        next(null, {code: code.FAIL});
        return;
    }
    var self = this;
    switch (msg.entryWay) {
        case "anonymous" :
            async.waterfall([function (cb) {
                self.app.rpc.account.accountRemote.register(session, msg, cb);
            }], function (err, userData) {
                if (err) {
                    next(err, {code: code.FAIL});
                    return;
                }
                if (!userData) {
                    next(null, {code: code.FAIL});
                    return;
                }
                var connector = dispatcher.dispatch(userData.userID, connectors);
                next(null, {
                    code: code.OK,
                    userID: userData.userID,
                    userName: userData.userName,
                    userIconImage: userData.userIconImage,
                    host: connector.host,
                    port: connector.clientPort
                });
            });
            break;
        default:
            next(null, {code: code.FAIL});
    }
};

module.exports = function (app) {
    return new Handler(app);
};