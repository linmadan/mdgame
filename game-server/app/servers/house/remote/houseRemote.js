var code = require('../../../code');

var Remote = function (app) {
    this.app = app;
};

Remote.prototype.playerComingIn = function (playerData, cb) {
    var AGameHouse = this.app.get('gameHouse');
    AGameHouse.playerComingIn(playerData);
    cb(null, code.OK);
};

Remote.prototype.playerLeave = function (playerData, cb) {
    var AGameHouse = this.app.get('gameHouse');
    AGameHouse.playerLeave(playerData);
    cb(null, code.OK);
};

Remote.prototype.startGameInRoom = function (data, cb) {
    var AGameHouse = this.app.get('gameHouse');
    AGameHouse.roomStartGame(data.roomData, data.gameData);
    cb(null, code.OK);
};

Remote.prototype.endGameInRoom = function (data, cb) {
    var AGameHouse = this.app.get('gameHouse');
    AGameHouse.roomEndGame(data.roomData);
    cb(null, code.OK);
};

module.exports = function (app) {
    return new Remote(app);
};