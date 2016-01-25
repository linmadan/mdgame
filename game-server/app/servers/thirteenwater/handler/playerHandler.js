var async = require('async');
var _ = require('underscore');
var code = require('../../../code');

var Handler = function (app) {
    this.app = app;
};
Handler.prototype.viewHand = function (msg, session, next) {
    var app = this.app;
    async.waterfall([function (cb) {
        var gameID = msg.gameID;
        app.get('gameManage').getGame(gameID, cb);
    }, function (aThirteenWater, cb) {
        var playerData = {};
        playerData.playerID = session.get("playerId");
        aThirteenWater.playerViewHand(playerData, cb);
    }], function (err, handData) {
        if (err) {
            next(err, {code: code.FAIL});
            return;
        }
        next(null, {
            code: code.OK,
            playerID: handData.playerID,
            hand: handData.hand
        });
    });
};
Handler.prototype.playAHand = function (msg, session, next) {
    var app = this.app;
    async.waterfall([function (cb) {
        var gameID = msg.gameID;
        app.get('gameManage').getGame(gameID, cb);
    }], function (err, aThirteenWater) {
        if (err) {
            next(err, {code: code.FAIL});
            return;
        }
        var playerData = {};
        playerData.playerID = session.get("playerId");
        var playAHandAction = msg.playAHandAction;
        var cardIndexs = msg.cardIndexs;
        aThirteenWater.playerPlayAHand(playerData, playAHandAction, cardIndexs);
        next(null, {
            code: code.OK
        });
    });
};
Handler.prototype.viewsShowDownResult = function (msg, session, next) {
    var app = this.app;
    async.waterfall([function (cb) {
        var gameID = msg.gameID;
        app.get('gameManage').getGame(gameID, cb);
    }, function (aThirteenWater, cb) {
        var playerData = {};
        playerData.playerID = session.get("playerId");
        aThirteenWater.playerViewsShowDownResult(playerData, cb);
    }], function (err, resultData) {
        if (err) {
            next(err, {code: code.FAIL});
            return;
        }
        next(null, {
            code: code.OK,
            playerID: resultData.playerID,
            results: resultData.results
        });
    });
};
Handler.prototype.exitGame = function (msg, session, next) {
    var app = this.app;
    async.waterfall([function (cb) {
        var gameID = msg.gameID;
        app.get('gameManage').getGame(gameID, cb);
    }], function (err, aThirteenWater) {
        if (err) {
            next(err, {code: code.FAIL});
            return;
        }
        var playerData = {};
        playerData.playerID = session.get("playerId");
        aThirteenWater.playerExitGame(playerData);
        next(null, {
            code: code.OK
        });
    });
};
module.exports = function (app) {
    return new Handler(app);
};