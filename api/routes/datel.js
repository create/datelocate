var mongoose = require('mongoose');
var async = require('async');

var secrets = require('./../config/secrets');
var Datel = require('../models/datel');
var User = require('../models/user');
var Review = require('../models/review');

// get details about a single date
exports.getDate = function(req, res) {
    Datel.findOne({'_id': req.params.did}, function(err, date) {
        if (err) {
            return res.send(400, {
                'response': 'fail',
                'errors': 'Invalid date requested.'
            });
        } else {
            return res.json({'response': 'ok', 'date': date});
        }
    });
}

// add a new date to the database
exports.addDate = function(req, res, next) {

    req.assert('lat', 'Location has to be complete.').isFloat();
    req.assert('lng', 'Location has to be complete.').isFloat();
    req.assert('date_name', 'Name has to be complete.').notEmpty();
    req.assert('price', 'Price should be 0 through 3.').isInt();
    req.assert('review', 'Review has to be complete.').notEmpty();
    // materials and location are optional
    console.log("price: " + req.body.price);
    var errors = req.validationErrors();

    if (errors) {
        console.log(errors);
        return res.send(400, {
            'response': 'fail',
            'errors': 'You passed incorrect info. ' + errors
            });
    }

    async.waterfall([
        // build object
        function(done) {
            var newDate = new Datel({
                "loc": [+req.body.lng, +req.body.lat],
                "name": req.body.date_name,
                "location_name": req.body.location || '',
                "price": req.body.price,
                "materials": req.body.materials,
                "review": req.body.review,
                "upvotes": 0,
                "downvotes": 0,
                "flags": 0,
                "placesID": req.body.placesID || '',
                "placesRef": req.body.placesRef || ''
            });


            done(null, newDate)
        },
        // store object
        function(newDate, done) {
            newDate.save(function(err) {
                if (err) {
                    console.log(err);
                    done('Invalid date.');
                }
                done(null, newDate);
            });
        },
        // find user, and update vote count
        function(newDate, done) {
            var user = req.user;
            User.update({_id: user._id}, {$push: {'voted_dates': user}}, function(err, result) {
                done(err);
            });
        }
    ], function(err) {
        if (err) {
            console.log(err);
            return res.send(400, {
                'response': 'fail',
                'errors': 'Invalid values passed, please fix these.'
            });
        }
        Datel.findOne({'name': req.body.date_name,
                        'loc': [req.body.lng, req.body.lat]}, function(err, b) {
            return res.json({'response': 'ok', 'date': b});
        });
    });
}

// add vote to an existing date
exports.addVote = function(req, res, next) {
    var datelID = req.body.did;
    var voteDir = +req.body.voteDir;

    console.log(typeof(voteDir));
    console.log(voteDir);

    if ((voteDir !== -1) && (voteDir !== 1)) {
        return res.send(400, {
                'response': 'fail',
                'errors': 'Invalid vote sent.'
            });
    }

    // find the date
    Datel.findOne({'_id': datelID}, function(err, date) {
        if (err) {
            return res.send(400, {
                'response': 'fail',
                'errors': 'Invalid date.'
            });
        }

        // check if user has not voted for this date before
        User.findOne({'_id': req.user._id, 'voted_dates': date._id}, function(err, user) {
            if (user) {
                return res.send(500, {
                    'response': 'fail',
                    'errors': 'You have voted here already.'
                });
            }

            // update the values depending on vote direction
            if (voteDir === 1) date.upvotes += 1
            else date.downvotes += 1

            // update the document in db
            date.save(function(err) {
                if (err) {
                    return res.send(500, {
                        'response': 'fail',
                        'errors': 'Something went wrong.'
                    });
                }

                // now update the user
                User.update({'_id': req.user._id}, { $push: { voted_dates: date } },
                    function(err) {
                    if (err) {
                        return res.send(500, {
                            'response': 'fail',
                            'errors': 'Something went wrong.'
                        });
                    }

                    User.findOne({'_id': req.user._id}, function(err, user) {
                        return res.send(200, {
                            'response': 'ok',
                            'user': user
                        });
                    });
                });

            });

        });

    });
}

// add flag to an existing date
exports.addFlag = function(req, res, next) {
    var datelID = req.body.did;

    console.log("flag");

    // find the date
    Datel.findOne({'_id': datelID}, function(err, date) {
        if (err) {
            return res.send(400, {
                'response': 'fail',
                'errors': 'Invalid date.'
            });
        }

        // check if user has not voted for this date before
        User.findOne({'_id': req.user._id, 'flagged_dates': date._id}, function(err, user) {
            if (user) {
                return res.send(500, {
                    'response': 'fail',
                    'errors': 'You have already flagged this date.'
                });
            }

            // update the values depending on vote direction
            if (date.flags) {
                date.flags += 1;
            } else {
                date.flags = 1;
            }


            // update the document in db
            date.save(function(err) {
                if (err) {
                    console.log(err);
                    return res.send(500, {
                        'response': 'fail',
                        'errors': 'Something went wrong flagging the date.'
                    });
                }

                // now update the user
                User.update({'_id': req.user._id}, { $push: { flagged_dates: date } },
                    function(err) {
                    if (err) {
                        return res.send(500, {
                            'response': 'fail',
                            'errors': 'Something went wrong updating your flags.'
                        });
                    }

                    User.findOne({'_id': req.user._id}, function(err, user) {
                        return res.send(200, {
                            'response': 'ok',
                            'user': user
                        });
                    });
                });

            });

        });

    });
}

// add a review for the given date
exports.addReview = function(req, res, next) {
    var minChar = 4;
    req.assert('review', 'Review must be 4-2000 characters.').len(minChar, 2000);

    var errors = req.validationErrors();

    if (errors) {
        return res.send(400, {
            'response': 'fail',
            'errors': 'Write more than '+minChar+' characters please!'
            });
    }

    var datelID = req.body.did;
    var review = req.body.review;

    var review = new Review({
        'review': review,
        'left_by': req.user
    });

    // find the date
    Datel.findOne({'_id': datelID}).populate('reviews').exec(function(err, date) {
        if (err) {
            return res.send(400, {
                'response': 'fail',
                'errors': 'Invalid date.'
            });
        }

        // save the review
        review.save(function(err) {
            if (err) {
                return res.send(500, {
                    'response': 'fail',
                    'errors': 'Something went wrong.'
                });
            }

            // now add the relationship from date -> review
            Datel.update({'_id': datelID}, { $push: { reviews: review } },
                function(err) {
                if (err) {
                    return res.send(500, {
                        'response': 'fail',
                        'errors': 'Something went wrong.'
                    });
                }

                Datel.findOne({'_id': datelID}, function(err, date) {
                    return res.send(200, {
                        'response': 'ok',
                        'date': date
                    });
                });
            });

            // now update the user
            User.update({'_id': req.user._id}, { $push: { voted_dates: date } },
                function(err) {
                if (err) {
                    return res.send(500, {
                        'response': 'fail',
                        'errors': 'Something went wrong.'
                    });
                }

                User.findOne({'_id': req.user._id}, function(err, user) {
                    return res.send(200, {
                        'response': 'ok',
                        'user': user
                    });
                });
            });


        });
    });

}

exports.getReviews = function(req, res) {

    var datelID = req.params.did;

    Datel.findOne({'_id': datelID}).populate('reviews').exec(function(err, date) {
        if (err) {
            return res.send(400, {
                'response': 'fail',
                'errors': 'Invalid date.'
            });
        }

        res.send(200, {
            'response': 'ok',
            'date': date
        });
    });

}

// get all dates near the passed coordinate
exports.getAllNear = function(req, res) {

    req.assert('lat', 'lat must be float.').isFloat();
    req.assert('lng', 'lng must be float.').isFloat();
    req.assert('zoom', 'zoom must be int').isInt();

    var errors = req.validationErrors();

    if (errors) {
        return res.send(400, {
            'response': 'fail',
            'errors': 'Latitude and longitude must be numbers.'
            });
    }

    var lat = +req.params.lat;
    var lng = +req.params.lng;
    var zoom = +req.params.zoom;

    // scale distance with zoom - smaller zoom, larger distance
    var maxDistance = Math.pow(22 - zoom, 2) * secrets.distanceFactor / (111.12 * 1000);

    Datel.find({loc: {
        $near : [lng, lat],
        $maxDistance: maxDistance
    }}, function(err, dates) {
        if (err) {
            return res.send(500, {
                'response': 'fail',
                'errors': 'Something went wrong. Please try again later.'
            });
        }
        res.send(200, {
            'response': 'ok',
            'dates': dates
        });

    });
}