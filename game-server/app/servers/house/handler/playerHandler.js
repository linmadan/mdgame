var async = require('async');
var code = require('../../../code');

var Handler = function (app) {
    this.app = app;
};
Handler.prototype.openNewRoom = function (msg, session, next) {
    var AGameHouse = this.app.get('gameHouse');
    var playerData = {};
    playerData.playerID = session.get("playerId");
    playerData.name = session.get('playername');
    var roomData = {};
    roomData.roomName = msg.roomName;
    roomData.gameName = msg.gameName;
    roomData.gamePlayerAmount = msg.gamePlayerAmount;
    AGameHouse.playerOpenNewRoom(playerData, roomData);
    next(null, {code: code.OK});
};

Handler.prototype.comingInRoom = function (msg, session, next) {
    var AGameHouse = this.app.get('gameHouse');
    var playerData = {};
    playerData.playerID = session.get("playerId");
    playerData.name = session.get('playername');
    var roomData = {};
    roomData.roomID = msg.roomID;
    AGameHouse.playerComingInRoom(playerData, roomData);
    next(null, {code: code.OK});
};

Handler.prototype.readyGame = function (msg, session, next) {
    var AGameHouse = this.app.get('gameHouse');
    var playerData = {};
    playerData.playerID = session.get("playerId");
    AGameHouse.playerReadyGame(playerData);
    next(null, {code: code.OK});
};

Handler.prototype.cancelReady = function (msg, session, next) {
    var AGameHouse = this.app.get('gameHouse');
    var playerData = {};
    playerData.playerID = session.get("playerId");
    AGameHouse.playerCancelReady(playerData);
    next(null, {code: code.OK});
};

Handler.prototype.leaveRoom = function (msg, session, next) {
    var AGameHouse = this.app.get('gameHouse');
    var playerData = {};
    playerData.playerID = session.get("playerId");
    playerData.name = session.get('playername');
    var roomData = {};
    roomData.roomID = msg.roomID;
    AGameHouse.playerLeaveRoom(playerData, roomData);
    next(null, {code: code.OK});
};

Handler.prototype.leave = function (msg, session, next) {
    var AGameHouse = this.app.get('gameHouse');
    var playerData = {};
    playerData.playerID = session.get("playerId");
    AGameHouse.playerLeave(playerData);
    this.app.rpc.account.accountRemote.logout(session, session.uid, "anonymous", null);
    next(null, {code: code.OK});
};

module.exports = function (app) {
    return new Handler(app);
};