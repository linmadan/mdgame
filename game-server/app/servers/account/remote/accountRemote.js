var account = require('mdgame-account');
var code = require('../../../code');

var Remote = function (app) {
    this.app = app;
};

Remote.prototype.register = function (userData, cb) {
    var AAccount = account;
    AAccount.registerUser(userData, function (err, userData) {
        if (err) {
            cb(err);
            return;
        }
        cb(null, userData);
    });
};

Remote.prototype.auth = function (authData, cb) {
    var AAccount = account;
    AAccount.userAuth(authData, function (err, isPass) {
        if (err) {
            cb(err);
            return;
        }
        cb(null, isPass);
    });
};

Remote.prototype.login = function (userID, accountType, cb) {
    var AAccount = account;
    AAccount.userLogin(userID, accountType, function (err, isSuccess) {
        if (err) {
            cb(err);
            return;
        }
        cb(null, isSuccess);
    });
};

Remote.prototype.logout = function (userID, accountType, cb) {
    var AAccount = account;
    AAccount.userLogout(userID, accountType, function (err, isSuccess) {
        if (err) {
            cb(err);
            return;
        }
        cb(null, isSuccess);
    });
};

Remote.prototype.getUser = function (userID, accountType, cb) {
    var AAccount = account;
    AAccount.getUserData(userID, accountType, function (err, userData) {
        if (err) {
            cb(err);
            return;
        }
        cb(null, userData);
    });
};

module.exports = function (app) {
    return new Remote(app);
};