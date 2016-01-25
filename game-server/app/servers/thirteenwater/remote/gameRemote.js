var async = require('async');
var _ = require('underscore');
var thirteenWater = require('mdgame-thirteenwater');
var code = require('../../../code');
var dispatcher = require('../../../util/dispatcher');

var Remote = function (app) {
    this.app = app;
};

Remote.prototype.createGame = function (data, cb) {
    var AThirteenWater = thirteenWater.createAThirteenWater();
    var app = this.app;
    var gameData = null;
    async.waterfall([function (asyncCb) {
        var newGameData = {};
        newGameData.gameID = data.roomID;
        newGameData.ruleName = "general";
        newGameData.players = data.players;
        AThirteenWater.initGame(newGameData, asyncCb);
    }, function (newGameData, asyncCb) {
        gameData = newGameData;
        var gameID = newGameData.gameID;
        AThirteenWater.on(thirteenWater.applicationEvent.PLAYER_RUN_AWAY, function (err, eventData) {
            var channel = app.get('channelService').getChannel(gameID, true);
            channel.pushMessage("onPlayerRunAway", eventData, function (err) {
                return;
            });
        });
        AThirteenWater.on(thirteenWater.domainEvent.PLAYER_PLAY_A_HAND, function (err, eventData) {
            var channel = app.get('channelService').getChannel(gameID, true);
            channel.pushMessage("onPlayerPlayAHand", eventData, function (err) {
                return;
            });
        });
        AThirteenWater.on(thirteenWater.domainEvent.SHOW_DOWN, function (err, eventData) {
            var channel = app.get('channelService').getChannel(gameID, true);
            channel.pushMessage("onShowDown", eventData, function (err) {
                return;
            });
        });
        AThirteenWater.on(thirteenWater.applicationEvent.PLAYER_EXIT_GAME, function (err, eventData) {
            var channel = app.get('channelService').getChannel(gameID, true);
            channel.pushMessage("onPlayerExitGame", eventData, function (err) {
                return;
            });
        });
        AThirteenWater.on(thirteenWater.domainEvent.GAME_END, function (err, eventData) {
            app.get("gameManage").removeGame(gameID, function (err, gameID) {
                var channel = app.get('channelService').getChannel(gameID, true);
                channel.destroy();
                var routeParam = "house-server-1";
                app.rpc.house.houseRemote.endGameInRoom(routeParam, {
                    roomData: {roomID: gameID}
                }, function (err, code) {
                    if (err) {
                        return;
                    }
                });
            });
        });
        app.get("gameManage").addGame(newGameData.gameID, AThirteenWater, null, asyncCb);
    }, function (gameID, asyncCb) {
        var channel = app.get('channelService').getChannel(gameID, true);
        _.each(_.keys(gameData.players), function (key) {
            var uid = key;
            var connector = dispatcher.dispatch(uid, app.getServersByType('connector'));
            if (!connector) {
                cb(new Error("can not find connector server"), {code: code.FAIL});
                return;
            }
            var sid = connector.id;
            channel.add(uid, sid);
        });
        var routeParam = "house-server-1";
        app.rpc.house.houseRemote.startGameInRoom(routeParam, {
            roomData: {roomID: gameID},
            gameData: gameData
        }, asyncCb);
    }], function (err, startGameCode) {
        if (err) {
            cb(err, {code: code.FAIL});
            return;
        }
        cb(null, startGameCode);
    });
};

Remote.prototype.playerRunAway = function (data, cb) {
    var app = this.app;
    async.waterfall([function (asyncCb) {
        var gameID = data.roomID;
        app.get("gameManage").getGame(gameID, asyncCb);
    }], function (err, game) {
        if (err) {
            cb(err, {code: code.FAIL});
            return;
        }
        var playerData = {};
        playerData.playerID = data.playerID;
        game.playerRunAway(playerData);
        cb(null,  {code: code.OK});
    });
}

module.exports = function (app) {
    return new Remote(app);
};