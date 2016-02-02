var _ = require('underscore');

var AnonymousAccountCache = function (app) {
    this.__users__ = {};
    this.app = app;
};

AnonymousAccountCache.prototype.getUser = function (userID, cb) {
    if (_.isUndefined(this.__users__[userID])) {
        var routeParam = "account-server-1";
        var cache = this;
        this.app.rpc.account.accountRemote.getUser(routeParam, userID, "anonymous", function (err, userData) {
            if (err) {
                cb(err);
                return;
            }
            cache.__users__[userID] = userData;
            cb(null, cache.__users__[userID]);
        });
    }
    else {
        cb(null, this.__users__[userID]);
    }
};

AnonymousAccountCache.prototype.delUser = function (userID) {
    if (_.isUndefined(this.__users__[userID])) {
        return;
    }
    delete this.__users__[userID];
};

module.exports = AnonymousAccountCache;

