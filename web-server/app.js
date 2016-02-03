var express = require('express');

var app = express();
var oneYear = 31557600000;
app.use(express.static(__dirname + '/public', {maxAge: oneYear}));
app.get('/', function (req, res) {
    res.redirect('public/index.html');
});
console.log("Web server has started.");
app.listen(80);
