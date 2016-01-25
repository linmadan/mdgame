var pomelo = require('pomelo');
var configureHouse = require('./app/configure/configureHouse');
var configureThirteenWater = require('./app/configure/configureThirteenWater');

var app = pomelo.createApp();
app.set('name', 'mdgame-pomelo');

app.configure('production|development', 'gate', function () {
    app.set('connectorConfig',
        {
            connector: pomelo.connectors.hybridconnector
        });
});

app.configure('production|development', 'connector', function () {
    app.set('connectorConfig',
        {
            connector: pomelo.connectors.hybridconnector,
            heartbeat: 30
        });
});

var houseRoute = function (routeParam, msg, app, cb) {
    var houseServers = app.getServersByType('house');
    if (!houseServers || houseServers.length === 0) {
        cb(new Error('can not find house servers.'));
        return;
    }
    var serverID = routeParam;
    cb(null, serverID);
};

app.configure('production|development', 'house', function () {
    app.route('house', houseRoute);
    configureHouse(app);
});

var thirteenWaterRoute = function (routeParam, msg, app, cb) {
    var thirteenWaterServers = app.getServersByType('thirteenwater');
    if (!thirteenWaterServers || thirteenWaterServers.length === 0) {
        cb(new Error('can not find thirteenwater servers.'));
        return;
    }
    var serverID = routeParam;
    cb(null, serverID);
};

app.configure('production|development', 'thirteenwater', function () {
    app.route('thirteenwater', thirteenWaterRoute);
    configureThirteenWater(app);
});

app.start();

process.on('uncaughtException', function (err) {
    console.error(' Caught exception: ' + err.stack);
});
