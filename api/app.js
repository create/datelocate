//require('newrelic');
/*
    Module dependencies
*/

var express = require('express');       // the main ssjs framework
var path = require('path');             // for path manipulation
var mongoose = require('mongoose');
var passport = require('passport');
var RedisStore = require('connect-redis')(express);
var expressValidator = require('express-validator');

var app = express();                    // create an express app

var pass = require('./config/passport');
var secrets = require('./config/secrets');

var db = require('./db');

var routes = require('./routes');
var user = require('./routes/user');
var datel = require('./routes/datel');

/**
 * Express configuration.
 */

if (process.env.REDISTOGO_URL) {
    console.log("using reditogo");
    rtg   = require('url').parse(process.env.REDISTOGO_URL);
    redis = require('redis').createClient(rtg.port, rtg.hostname);
    redis.auth(rtg.auth.split(':')[1]); // auth 1st part is username and 2nd is password separated by ":"
} else {
    console.log("using local redis");
    redis = require("redis").createClient();
}

app.set('port', process.env.PORT || 3000);
app.use(express.compress());
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.json());
app.use(express.urlencoded());
app.use(expressValidator());
app.use(express.methodOverride());
app.use(passport.initialize());
// app.use(passport.session());
app.use(function(req, res, next) {
    res.locals.user = req.user;
    next();
});
app.use(app.router);

app.all('*', function(req, res, next){
    if (!req.get('Origin')) return next();
    // use "*" here to accept any origin
    res.header('Access-Control-Allow-Origin', req.headers.origin || "*");
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, access');
    if ('OPTIONS' == req.method) return res.send(200);
    next();
});

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

/*
 * All user API end points.
 */

app.get('/', function(req, res) {
    res.sendfile('./public/index.html');
});


// register a new user
app.post('/signup', user.signup);
// log a user in
app.post('/signin', user.signin);
// logout a logged in user
app.get('/signout', user.signout);
// get details about logged in user
app.get('/account', pass.isAuthenticated, user.userDetails);
// update general profile info
app.post('/account/profile', pass.isAuthenticated, user.postUpdateProfile);
// change password
app.post('/account/password', pass.isAuthenticated, user.postUpdatePassword);
// reset password
app.post('/forgot', user.resetPassword);


// get details about a single datel
app.get('/getdate/:did', datel.getDate);
// add a new datel
app.post('/adddate', pass.isAuthenticated, datel.addDate);
// vote on a datel
app.post('/addvote', pass.isAuthenticated, datel.addVote);
// flag a datel
app.post('/addflag', pass.isAuthenticated, datel.addFlag);
// post a new review for the datel
app.post('/addreview', pass.isAuthenticated, datel.addReview);
// get reviews for a datel
app.get('/getreviews/:did', datel.getReviews);
// get all dates near the passed coordinatee
app.get('/getallnear/:lat,:lng', datel.getAllNear);

app.listen(app.get('port'));

console.log('Express server listening on port ' + app.get('port'));
