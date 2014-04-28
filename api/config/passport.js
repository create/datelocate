var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('./../models/user');

passport.serializeUser(function(user, done) {
    var createAccessToken = function() {
        var token = user.generateRandomToken();
        User.findOne({token: token}, function(err, existingUser) {
            if (err) {
                return res.send(500, {
                    'response': 'fail',
                    'errors': 'Something went wrong. Please try again later.'
                });
            }
            if (existingUser) {
                createAccessToken(); // Run the function again - the token has to be unique!
            } else {
                user.set('token', token);
                user.save(function(err) {
                    if (err) {
                        return res.send(500, {
                            'response': 'fail',
                            'errors': 'Something went wrong. Please try again later.'
                        });
                    }
                    return done(null, user.get('token'));
                });
            }
        });
    };

    if (user._id) {
        createAccessToken();
    }
});

passport.deserializeUser(function(token, done) {
    User.findOne({'token': token}, function(err, user) {
        done(err, user);
    });
});

/**
 * Sign in using Email and Password.
 */

passport.use(new LocalStrategy({ usernameField: 'userid' }, function(userid, password, done) {
    User.findOne({ id: userid }, function(err, user) {
        if (!user) {
            return done(null, false, { message: 'Invalid userid or password'});
        }
        user.comparePassword(password, function(err, isMatch) {
            if (isMatch) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Invalid userid or password'});
            }
        });
    });
}));

/**
 * Login Required middleware.
 */

exports.isAuthenticated = function(req, res, next) {
    User.findOne({'id': req.headers.access}, function(err, user) {
        console.log(user);
        if (err || !user) {
            return res.send(401, {
                'response': 'fail',
                'errors': 'Login to access this area.'
            });
        }

        req.user = user;
        return next();
    });
};
