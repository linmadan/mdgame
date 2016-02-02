var async = require('async');
var gameHouse = require('mdgame-gamehouse');
var AnonymousAccountCache = require('../cache/anonymousAccountCache');
var dispatcher = require('../util/dispatcher');
var code = require('../code');
var _ = require('underscore');

var configure = function (app) {
    var AGameHouse = gameHouse.createAGameHouse();
    AGameHouse.on(gameHouse.domainEvent.PLAYER_COMING_IN, function (err, eventData) {
        if (err) {
            return;
        }
        var uid = eventData.playerID;
        var connector = dispatcher.dispatch(uid, app.getServersByType('connector'));
        if (!connector) {
            return;
        }
        var sid = connector.id;
        app.get('anonymousAccountCache').getUser(uid, function (err, userData) {
            if (err) {
                return;
            }
            var playerData = {};
            playerData.playerID = userData.userID;
            playerData.playerName = userData.userName;
            playerData.playerIconImage = userData.userIconImage;
            var channel = app.get('channelService').getChannel("gameHouse", true);
            channel.pushMessage("onPlayerComingIn", playerData, function (err) {
                return;
            });
            channel.add(uid, sid);
            app.get('channelService').pushMessageByUids("onComingIn", playerData, [{
                uid: uid,
                sid: sid
            }], function (err) {
                return;
            });
        });
    });
    AGameHouse.on(gameHouse.domainEvent.PLAYER_COMING_IN_HALL, function (err, eventData) {
        if (err) {
            return;
        }
        var uid = eventData.playerID;
        var connector = dispatcher.dispatch(uid, app.getServersByType('connector'));
        if (!connector) {
            return;
        }
        var sid = connector.id;
        var channel = app.get('channelService').getChannel("gameHall", true);
        var playerData = {};
        app.get('anonymousAccountCache').getUser(uid, function (err, userData) {
            if (err) {
                return;
            }
            playerData.playerID = userData.userID;
            playerData.playerName = userData.userName;
            playerData.playerIconImage = userData.userIconImage;
            channel.pushMessage("onPlayerComingInHall", playerData, function (err) {
                return;
            });
            channel.add(uid, sid);
        });
        var playerIDs = _.keys(eventData.inHousePlayers);
        var getUserFunctionArray = [];
        _.each(playerIDs, function (playerID) {
            getUserFunctionArray.push(function (cb) {
                app.get('anonymousAccountCache').getUser(playerID, cb);
            });
        });
        async.parallel(getUserFunctionArray, function (err, results) {
            if (err) {
                return;
            }
            for (var i = 0; i < results.length; i++) {
                eventData.inHousePlayers[results[i].userID].playerName = results[i].userName;
                eventData.inHousePlayers[results[i].userID].playerIconImage = results[i].userIconImage;
            }
            var roomIDs = _.keys(eventData.openedGameRooms);
            var getUserFunctionArray = [];
            _.each(roomIDs, function (roomID) {
                getUserFunctionArray.push(function (cb) {
                    app.get('anonymousAccountCache').getUser(eventData.openedGameRooms[roomID].roomOwner, cb);
                });
            });
            async.parallel(getUserFunctionArray, function (err, results) {
                if (err) {
                    return;
                }
                for (var i = 0; i < results.length; i++) {
                    eventData.openedGameRooms[roomIDs[i]].roomOwner = results[i].userName;
                }
                app.get('channelService').pushMessageByUids("onComingInHall", eventData, [{
                    uid: uid,
                    sid: sid
                }], function (err) {
                    return;
                });
            });
        });
    });
    AGameHouse.on(gameHouse.domainEvent.PLAYER_LEAVE_HALL, function (err, eventData) {
        if (err) {
            return;
        }
        var uid = eventData.playerID;
        var connector = dispatcher.dispatch(uid, app.getServersByType('connector'));
        if (!connector) {
            return;
        }
        var sid = connector.id;
        var msg = eventData;
        var gameHallChannel = app.get('channelService').getChannel("gameHall", true);
        gameHallChannel.leave(uid, sid);
        gameHallChannel.pushMessage("onPlayerLeaveHall", msg, function (err) {
            return;
        });
    });
    AGameHouse.on(gameHouse.domainEvent.OPEN_NEW_ROOM, function (err, eventData) {
        if (err) {
            return;
        }
        var msg = eventData;
        var channel = app.get('channelService').getChannel("gameHall", true);
        channel.pushMessage("onNewRoomOpen", msg, function (err) {
            return;
        });
    });
    AGameHouse.on(gameHouse.domainEvent.ROOM_IS_MAX, function (err, eventData) {
        if (err) {
            return;
        }
        var uid = eventData.playerID;
        var connector = dispatcher.dispatch(uid, app.getServersByType('connector'));
        if (!connector) {
            return;
        }
        var sid = connector.id;
        var msg = eventData;
        app.get('channelService').pushMessageByUids("onRoomIsMax", msg, [{uid: uid, sid: sid}], function (err) {
            return;
        });
    });
    AGameHouse.on(gameHouse.domainEvent.PLAYER_COMING_IN_ROOM, function (err, eventData) {
        if (err) {
            return;
        }
        var hallChannel = app.get('channelService').getChannel("gameHall", true);
        app.get('anonymousAccountCache').getUser(eventData.roomOwner, function (err, userData) {
            if (err) {
                return;
            }
            hallChannel.pushMessage("onRoomChange", {
                roomID: eventData.roomID,
                roomName: eventData.roomName,
                roomOwner: userData.userName,
                gamePlayerAmount: eventData.gamePlayerAmount,
                currentPlayerAmount: _.keys(eventData.gamePlayers).length
            }, function (err) {
                return;
            });
        });
        var uid = eventData.playerID;
        var connector = dispatcher.dispatch(uid, app.getServersByType('connector'));
        if (!connector) {
            return;
        }
        var sid = connector.id;
        var rommID = eventData.roomID;
        var roomChannel = app.get('channelService').getChannel(rommID, true);
        app.get('anonymousAccountCache').getUser(uid, function (err, userData) {
            if (err) {
                return;
            }
            var playerData = {};
            playerData.playerID = userData.userID;
            playerData.playerName = userData.userName;
            playerData.playerIconImage = userData.userIconImage;
            roomChannel.pushMessage("onPlayerComingInRoom", playerData, function (err) {
                return;
            });
            roomChannel.add(uid, sid);
        });
        delete eventData.gamePlayers[uid];
        var playerIDs = _.keys(eventData.gamePlayers);
        var getUserFunctionArray = [];
        _.each(playerIDs, function (playerID) {
            getUserFunctionArray.push(function (cb) {
                app.get('anonymousAccountCache').getUser(playerID, cb);
            });
        });
        async.parallel(getUserFunctionArray, function (err, results) {
            if (err) {
                return;
            }
            for (var i = 0; i < results.length; i++) {
                eventData.gamePlayers[results[i].userID].playerName = results[i].userName;
                eventData.gamePlayers[results[i].userID].playerIconImage = results[i].userIconImage;
            }
            app.get('anonymousAccountCache').getUser(eventData.roomOwner, function (err, userData) {
                if (err) {
                    return;
                }
                var playerData = {};
                playerData.playerID = userData.userID;
                playerData.playerName = userData.userName;
                playerData.playerIconImage = userData.userIconImage;
                eventData.roomOwner = playerData;
                app.get('channelService').pushMessageByUids("onComingInRoom", eventData, [{
                    uid: uid,
                    sid: sid
                }], function (err) {
                    return;
                });
            });
        });
    });
    AGameHouse.on(gameHouse.domainEvent.PLAYER_IS_MAX, function (err, eventData) {
        if (err) {
            return;
        }
        var uid = eventData.playerID;
        var connector = dispatcher.dispatch(uid, app.getServersByType('connector'));
        if (!connector) {
            return;
        }
        var sid = connector.id;
        var msg = eventData;
        app.get('channelService').pushMessageByUids("onPlayerIsMax", msg, [{uid: uid, sid: sid}], function (err) {
            return;
        });
    });
    AGameHouse.on(gameHouse.domainEvent.PLAYER_READY_TO_PLAY_GAME, function (err, eventData) {
        if (err) {
            return;
        }
        var msg = eventData;
        var channel = app.get('channelService').getChannel(eventData.roomID, true);
        channel.pushMessage("onPlayerReadyGame", msg, function (err) {
            return;
        });
    });
    AGameHouse.on(gameHouse.domainEvent.PLAYER_CANCEL_READY, function (err, eventData) {
        if (err) {
            return;
        }
        var msg = eventData;
        var channel = app.get('channelService').getChannel(eventData.roomID, true);
        channel.pushMessage("onPlayerCancelReady", msg, function (err) {
            return;
        });
    });
    AGameHouse.on(gameHouse.domainEvent.ROOM_PLAYERS_CANCEL_READY, function (err, eventData) {
        if (err) {
            return;
        }
        var msg = eventData;
        var channel = app.get('channelService').getChannel(eventData.roomID, true);
        channel.pushMessage("onAllPlayersCancelReady", msg, function (err) {
            return;
        });
    });
    AGameHouse.on(gameHouse.domainEvent.CAN_START_GAME, function (err, eventData) {
        var AGameHouse = app.get('gameHouse');
        var roomData = {};
        roomData.roomID = eventData.roomID;
        if (err) {
            AGameHouse.roomPlayersCancelReady(roomData);
            return;
        }
        var gameServerName = eventData.gameName;
        var routeParam = "thirteenwater-server-1";
        app.rpc[gameServerName].gameRemote.createGame(routeParam, eventData, function (createErr) {
            if (createErr) {
                AGameHouse.roomPlayersCancelReady(roomData);
            }
        });
    });
    AGameHouse.on(gameHouse.domainEvent.GAME_START, function (err, eventData) {
        if (err) {
            var AGameHouse = app.get('gameHouse');
            var roomData = {};
            roomData.roomID = eventData.roomID;
            AGameHouse.roomPlayersCancelReady(roomData);
            return;
        }
        var getUserFunctionArray = [];
        _.each(_.keys(eventData.gameData.players), function (playerID) {
            getUserFunctionArray.push(function (cb) {
                app.get('anonymousAccountCache').getUser(playerID, cb);
            });
        });
        async.parallel(getUserFunctionArray, function (err, results) {
            if (err) {
                return;
            }
            for (var i = 0; i < results.length; i++) {
                eventData.gameData.players[results[i].userID].playerName = results[i].userName;
                eventData.gameData.players[results[i].userID].playerIconImage = results[i].userIconImage;
            }
            var channel = app.get('channelService').getChannel(eventData.roomID, true);
            channel.pushMessage("onGameStart", eventData, function (err) {
                return;
            });
        });
    });
    AGameHouse.on(gameHouse.domainEvent.PLAYER_RUN_AWAY, function (err, eventData) {
        if (err) {
            return;
        }
        var gameServerName = eventData.gameName;
        var routeParam = "thirteenwater-server-1";
        app.rpc[gameServerName].gameRemote.playerRunAway(routeParam, eventData, function (err) {
            if (err) {
                return;
            }
        });
    });
    AGameHouse.on(gameHouse.domainEvent.GAME_END, function (err, eventData) {
        if (err) {
            return;
        }
        var channel = app.get('channelService').getChannel(eventData.roomID, true);
        var getUserFunctionArray = [];
        _.each(_.keys(eventData.gamePlayers), function (playerID) {
            getUserFunctionArray.push(function (cb) {
                app.get('anonymousAccountCache').getUser(playerID, cb);
            });
        });
        async.parallel(getUserFunctionArray, function (err, results) {
            if (err) {
                return;
            }
            for (var i = 0; i < results.length; i++) {
                eventData.gamePlayers[results[i].userID].playerName = results[i].userName;
                eventData.gamePlayers[results[i].userID].playerIconImage = results[i].userIconImage;
            }
            app.get('anonymousAccountCache').getUser(eventData.roomOwner, function (err, userData) {
                if (err) {
                    return;
                }
                var playerData = {};
                playerData.playerID = userData.userID;
                playerData.playerName = userData.userName;
                playerData.playerIconImage = userData.userIconImage;
                eventData.roomOwner = playerData;
                channel.pushMessage("onGameEnd", eventData, function (err) {
                    return;
                });
            });
        });
    });
    AGameHouse.on(gameHouse.domainEvent.PLAYER_LEAVE_ROOM, function (err, eventData) {
        if (err) {
            return;
        }
        var uid = eventData.playerID;
        var connector = dispatcher.dispatch(uid, app.getServersByType('connector'));
        if (!connector) {
            return;
        }
        var sid = connector.id;
        var rommID = eventData.roomID;
        var roomChannel = app.get('channelService').getChannel(rommID, true);
        roomChannel.leave(uid, sid);
        var msg = eventData;
        roomChannel.pushMessage("onPlayerLeaveRoom", msg, function (err) {
            return;
        });
        if (eventData.currentPlayerAmount > 0) {
            var hallChannel = app.get('channelService').getChannel("gameHall", true);
            app.get('anonymousAccountCache').getUser(eventData.roomOwner, function (err, userData) {
                if (err) {
                    return;
                }
                hallChannel.pushMessage("onRoomChange", {
                    roomID: eventData.roomID,
                    roomName: eventData.roomName,
                    roomOwner: userData.userName,
                    gamePlayerAmount: eventData.gamePlayerAmount,
                    currentPlayerAmount: eventData.currentPlayerAmount
                }, function (err) {
                    return;
                });
            });
        }
    });
    AGameHouse.on(gameHouse.domainEvent.CLOSE_A_ROOM, function (err, eventData) {
        if (err) {
            return;
        }
        var msg = eventData;
        var rommID = eventData.roomID;
        var roomChannel = app.get('channelService').getChannel(rommID, true);
        roomChannel.destroy();
        var channel = app.get('channelService').getChannel("gameHall", true);
        channel.pushMessage("onRoomClose", msg, function (err) {
            if (err) {
                return;
            }
        });
    });
    AGameHouse.on(gameHouse.domainEvent.PLAYER_LEAVE, function (err, eventData) {
        if (err) {
            return;
        }
        var uid = eventData.playerID;
        var connector = dispatcher.dispatch(uid, app.getServersByType('connector'));
        if (!connector) {
            return;
        }
        var sid = connector.id;
        var channel = app.get('channelService').getChannel("gameHouse", true);
        channel.leave(uid, sid);
        app.get('anonymousAccountCache').getUser(uid, function (err, userData) {
            if (err) {
                return;
            }
            channel.pushMessage("onPlayerLeave", {
                playerID: uid,
                playerName: userData.userName
            }, function (err) {
                return;
            });
        });
        app.get('anonymousAccountCache').delUser(uid);
    });
    var houseData = {};
    AGameHouse.initHouse(houseData, function (err) {
        if (err) {
            return;
        }
        app.set('gameHouse', AGameHouse);
        var anonymousAccountCache = new AnonymousAccountCache(app);
        app.set('anonymousAccountCache', anonymousAccountCache);
    });
};

module.exports = configure;