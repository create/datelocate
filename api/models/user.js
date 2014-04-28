var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');

var Datel = require('./datel.js');

var userSchema = new mongoose.Schema({
    created_at: {
        type: Date,
        default: Date.now
    },
    id: {
        type: String
    },
    password: {
        type: String
    },
    profile: {
        name: { type: String, default: '' },
        location: { type: String, default: '' }
    },

    // list of date listings user has voted on
    voted_dates: [{
        type: mongoose.Schema.Types.ObjectId , 
        ref: Datel
    }],

    token: {
        type: String,
        unique: true
    },

    resetPasswordToken: String,
    resetPasswordExpires: Date
});


/**
 * Validate user's password.
 * Used by Passport-Local Strategy for password validation.
 */

userSchema.methods.comparePassword = function(candidatePassword, cb) {
    cb(null, candidatePassword == this.password);
};

userSchema.methods.generateRandomToken = function () {
    var user = this,
    chars = "_!abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
    token = new Date().getTime() + '_';
    for ( var x = 0; x < 16; x++ ) {
        var i = Math.floor( Math.random() * 62 );
        token += chars.charAt( i );
    }
return token;
};

module.exports = mongoose.model('User', userSchema);
