var mongoose = require('mongoose');

var reviewSchema = new mongoose.Schema({
    created_at: {
        // auto added timestamp for creation of date entry
        type: Date,
        default: Date.now
    },
    review: {   // body of review
        type: String,
        required: true
    },
    left_by: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    }]
});

module.exports = mongoose.model('Review', reviewSchema);
