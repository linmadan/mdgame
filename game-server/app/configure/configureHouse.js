var gameHouse = require('mdgame-gamehouse');
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
        var channel = app.get('channelService').getChannel("gameHouse", true);
        channel.pushMessage("onPlayerComingIn", {
            playerID: uid,
            playerName: eventData.name
        }, function (err) {
            return;
        });
        channel.add(uid, sid);
        app.get('channelService').pushMessageByUids("onComingIn", eventData, [{uid: uid, sid: sid}], function (err) {
            return;
        });
    });
    AGameHouse.on(gameHouse.domainEvent.PLAYER_COMING_IN_HALL, function (err, eventData) {
        if (err) {
            return;
        }
        var msg1 = {};
        msg1.playerID = eventData.playerID;
        msg1.playerName = eventData.name;
        var channel = app.get('channelService').getChannel("gameHall", true);
        channel.pushMessage("onPlayerComingInHall", msg1, function (err) {
            return;
        });
        var uid = eventData.playerID;
        var connector = dispatcher.dispatch(uid, app.getServersByType('connector'));
        if (!connector) {
            return;
        }
        var sid = connector.id;
        channel.add(uid, sid);
        var msg2 = eventData;
        app.get('channelService').pushMessageByUids("onComingInHall", msg2, [{uid: uid, sid: sid}], function (err) {
            return;
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
        var uid = eventData.playerID;
        var connector = dispatcher.dispatch(uid, app.getServersByType('connector'));
        if (!connector) {
            return;
        }
        var sid = connector.id;
        var hallChannel = app.get('channelService').getChannel("gameHall", true);
        hallChannel.pushMessage("onRoomChange", {
            roomID: eventData.roomID,
            roomName: eventData.roomName,
            roomOwner: eventData.roomOwner,
            gamePlayerAmount: eventData.gamePlayerAmount,
            currentPlayerAmount: _.keys(eventData.gamePlayers).length
        }, function (err) {
            return;
        });
        var rommID = eventData.roomID;
        var roomChannel = app.get('channelService').getChannel(rommID, true);
        roomChannel.pushMessage("onPlayerComingInRoom", {
            playerID: uid,
            playerName: eventData.playerName
        }, function (err) {
            return;
        });
        roomChannel.add(uid, sid);
        delete eventData.gamePlayers[uid];
        var msg = eventData;
        app.get('channelService').pushMessageByUids("onComingInRoom", msg, [{uid: uid, sid: sid}], function (err) {
            return;
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
        var msg = eventData;
        var channel = app.get('channelService').getChannel(eventData.roomID, true);
        channel.pushMessage("onGameStart", msg, function (err) {
            return;
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
        var msg = eventData;
        var channel = app.get('channelService').getChannel(eventData.roomID, true);
        channel.pushMessage("onGameEnd", msg, function (err) {
            return;
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
            hallChannel.pushMessage("onRoomChange", {
                roomID: eventData.roomID,
                roomName: eventData.roomName,
                roomOwner: eventData.roomOwner,
                gamePlayerAmount: eventData.gamePlayerAmount,
                currentPlayerAmount: eventData.currentPlayerAmount
            }, function (err) {
                return;
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
        channel.pushMessage("onPlayerLeave", {
            playerID: uid,
            playerName: eventData.playerName
        }, function (err) {
            return;
        });
    });
    var houseData = {};
    AGameHouse.initHouse(houseData, function (err) {
        if (err) {
            return;
        }
        app.set('gameHouse', AGameHouse);
    });
};

module.exports = configure;