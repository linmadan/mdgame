var _ = require('underscore');

var configure = function (app) {
    var GameManage = {
        DEFAULT_TIMEOUT: 300000,
        __games__: {},
        __timeouts__: {},
        getGame: function (gameID, cb) {
            var game = this.__games__[gameID];
            if (_.isUndefined(game)) {
                cb(new Error("this game is not exist"), null);
                return;
            }
            cb(null, game);
        },
        addGame: function (gameID, game, timeout, cb) {
            if (this.__games__[gameID]) {
                cb(new Error("this game have exist"), gameID);
                return;
            }
            this.__games__[gameID] = game;
            var GameManage = this;
            this.__timeouts__[gameID] = setTimeout(function () {
                app.get("gameManage").removeGame(gameID, function (err, gameID) {
                    var channel = app.get('channelService').getChannel(gameID, true);
                    channel.destroy();
                    var routeParam = "house-server-1";
                    app.rpc.house.houseRemote.endGameInRoom(routeParam, {
                        roomData: {roomID: gameID}
                    }, function (err, returnCode) {
                        if (err) {
                            return;
                        }
                    });
                });
            }, timeout ? timeout : this.DEFAULT_TIMEOUT);
            cb(null, gameID);
        },
        removeGame: function (gameID, cb) {
            delete this.__games__[gameID];
            var timeout = this.__timeouts__[gameID];
            if (timeout) {
                clearTimeout(timeout);
                delete this.__timeouts__[gameID];
            }
            cb(null, gameID);
        }
    };
    app.set('gameManage', GameManage);
};

module.exports = configure;