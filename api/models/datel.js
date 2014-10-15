var mongoose = require('mongoose');

var datelSchema = new mongoose.Schema({
    created_at: {
        type: Date,
        default: Date.now
    },
    loc: {
        // lng, lat
        type: [],
        index: '2d'
    },
    name: {    // name of the place
        type: String,
        required: true
    },
    location_name: String,
    materials: String,
    price: Number,
    upvotes: Number,
    downvotes: Number,
    flags: Number,
    price: {   // 0, 1, 2, 3
        type: Number,
        required: true
    },
    placesID: { // google places id for associated POI
        type: String
    },
    placesRef: { // google places reference to get POI details
        type: String
    },
    review: String,
    reviews: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Review'
    }]
});

datelSchema.virtual('netvotes').get(function () {
    var net = this.upvotes - this.downvotes;
    return (net >= 0 ? net : 0);
});

module.exports = mongoose.model('Datel', datelSchema);
