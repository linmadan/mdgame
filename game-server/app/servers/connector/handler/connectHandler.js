var async = require('async');
var code = require('../../../code');

var Handler = function (app) {
    this.app = app;
};
Handler.prototype.entry = function (msg, session, next) {
    var self = this;
    if (!msg.entryWay) {
        next(null, {code: code.FAIL});
        return;
    }
    var userID, user;
    switch (msg.entryWay) {
        case "anonymous" :
            async.waterfall([function (cb) {
                var authData = {};
                authData.userID = msg.userID;
                authData.authWay = msg.entryWay;
                userID = msg.userID;
                self.app.rpc.account.accountRemote.auth(session, authData, cb);
            }, function (isPass, cb) {
                if (!isPass) {
                    next(null, {code: code.FAIL});
                    return;
                }
                self.app.rpc.account.accountRemote.login(session, userID, "anonymous", cb);
            }, function (isSuccess, cb) {
                if (!isSuccess) {
                    next(null, {code: code.FAIL});
                    return;
                }
                self.app.rpc.account.accountRemote.getUser(session, userID, "anonymous", cb);
            }, function (userData, cb) {
                if (!userData) {
                    next(null, {code: code.FAIL, user: userData});
                    return;
                }
                user = userData;
                self.app.get('sessionService').kick(user.userID, cb);
            }, function (cb) {
                session.bind(user.userID, cb);
            }, function (cb) {
                if (!user) {
                    next(null, {code: code.FAIL, user: user});
                    return;
                }
                session.set('playername', user.name);
                session.set('playerId', user.userID);
                session.on('closed', onUserLeave.bind(null, self.app));
                session.pushAll(cb);
            }, function (cb) {
                var playerData = {};
                playerData.playerID = user.userID;
                playerData.name = user.name;
                self.app.rpc.house.houseRemote.playerComingIn(session, playerData, cb);
            }], function (err, comingInCode) {
                if (err) {
                    next(err, {code: code.FAIL});
                    return;
                }
                next(null, comingInCode);
            });
            break;
        default:
            next(null, {code: code.FAIL});
    }
};

var onUserLeave = function (app, session) {
    if (!session || !session.uid) {
        return;
    }
    var playerData = {};
    playerData.playerID = session.uid;
    app.rpc.house.houseRemote.playerLeave(session, playerData, null);
    app.rpc.account.accountRemote.logout(session, session.uid, "anonymous", null);
};

module.exports = function (app) {
    return new Handler(app);
};