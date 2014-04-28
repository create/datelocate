var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');

var User = require('../models/user');
var secrets = require('./../config/secrets');


// register a new user.
exports.signup = function(req, res, next) {
    req.assert('userid', 'Id is not valid.').notEmpty();
    req.assert('password', 'Id is not valid.').notEmpty();

    var errors = req.validationErrors();

    if (errors) {
        console.log(errors);
        return res.send(400, {
            'response': 'fail',
            'errors': 'Invalid values passed, please fix these. ' + errors
        });
    }

    var user = new User({
        id: req.body.userid,
        password: req.body.password
    });

    user.save(function(err) {
        console.log(err);
        if (err) {
            if (err.code === 11000 || err.code === 11001) {
                return res.send(400, {
                    'response': 'fail',
                    'errors': 'User with that id already exists.'
                });
            }
        }
        req.logIn(user, function(err) {
            if (err) {
                return res.send(500, {
                    'response': 'fail',
                    'errors': 'Something went wrong. Please try again later.'
                });
            }
            console.log(req.user);
            return res.json({'response': 'ok', 'user': req.user});
        });
    });
}

// login an existing user
exports.signin = function(req, res, next) {
    req.assert('userid', 'Userid is not valid').notEmpty();
    req.assert('password', 'Password not valid').notEmpty();

    var errors = req.validationErrors();

    if (errors) {
        return res.send(400, {
            'response': 'fail',
            'errors': 'Invalid values passed, please fix these. ' + errors
        });
    }

    passport.authenticate('local', function(err, user, info) {
        if (err) {
            return res.send(500, {
                'response': 'fail',
                'errors': 'Something went wrong. Please try again later.'
            });
        }
        if (!user) {
            return res.send(400, {
                'response': 'fail',
                'errors': info.message
            });
        }
        req.logIn(user, function(err) {
            if (err) {
                return res.send(500, {
                    'response': 'fail',
                    'errors': 'Something went wrong. Please try again later.'
                });
            }
            return res.json({'response': 'ok', 'user': req.user});
        });
    })(req, res, next);
};

// sign out a logged in user
exports.signout = function(req, res) {
    req.logout();
    User.findOne({'token': req.headers.access}, function(err, user) {
        user.token = '';
        user.save(function(err) {
            if (err) {
                return res.send(500, {
                    'response': 'fail',
                    'errors': 'Something went wrong. Please try again later.'
                });
            }
            return res.json({'response': 'ok'});
        });
    });
};

// get details about the logged in user
exports.userDetails = function(req, res) {
    if (req.user) {
        return res.json({'response': 'ok', 'user': req.user});
    } else {
        return res.send(400, {
            'response': 'fail',
            'errors': 'Please sign in first.'
        });
    }
}

// update general profile info
exports.postUpdateProfile = function(req, res, next) {
    User.findById(req.user.id, function(err, user) {
        if (err) {
            return res.send(500, {
                'response': 'fail',
                'errors': 'Something went wrong. Please try again later.'
            });
        }
        //user.email = req.body.email || user.email;
        user.profile.name = req.body.name || user.profile.name;
        user.profile.location = req.body.location || user.profile.name;

        user.save(function(err) {
            if (err) {
                if (11000 === err.code || 11001 === err.code) {
                    return res.send(400, {
                        'response': 'fail',
                        'errors': 'Email is associated with another user.'
                    });
                }
                return res.send(500, {
                    'response': 'fail',
                    'errors': 'Something went wrong. Please try again later.'
                });
            }
            return res.json({'response': 'ok', 'user': user});
        });
    });
};

// change password for logged in user
exports.postUpdatePassword = function(req, res, next) {
    req.assert('password', 'Password must be at least 4 characters long').len(4);

    var errors = req.validationErrors();

    if (errors) {
        return res.send(500, {
            'response': 'fail',
            'errors': 'Invalid values passed, please fix these.'
        });
    }

    User.findById(req.user.id, function(err, user) {
        if (err) {
            return res.send(500, {
                'response': 'fail',
                'errors': 'Something went wrong. Please try again later.'
            });
        }

        user.password = req.body.password;

        user.save(function(err) {
            if (err) {
                return res.send(500, {
                    'response': 'fail',
                    'errors': 'Something went wrong. Please try again later.'
                });
            }
            return res.json({'response': 'ok'});
        });
    });
};

// reset the password
exports.resetPassword = function(req, res, next) {
    req.assert('email', 'Please enter a valid email address.').isEmail();

    var errors = req.validationErrors();

    if (errors) {
        return res.send(400, {
            'response': 'fail',
            'errors': 'Invalid values passed, please fix these.'
        });
    }

    async.waterfall([
        function(done) {
            crypto.randomBytes(16, function(err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done) {
            User.findOne({ email: req.body.email.toLowerCase() }, function(err, user) {
                if (!user) {
                    return res.send(400, {
                        'response': 'fail',
                        'errors': 'No account with that email address exists.'
                    });
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(function(err) {
                    done(err, token, user);
                });
            });
        }
    ], function(err) {
        if (err) {
            return res.send(400, {
                'response': 'fail',
                'errors': 'Invalid values passed, please fix these.'
            });
        }
        return res.json({'response': 'ok'});
    });
}

