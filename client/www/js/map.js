var baseUrl = "http://z-api.herokuapp.com/";
var map; // global for use in add.js may need to refactor
var bathInfoWindow; // singleton
var BIDSet;
var API_KEY = "AIzaSyA_3-FTpr5X41YFGR-xFHVZMbjcU-BJp1Q"; // google maps api key (jeff's acc)
var currentBID;
var addMarker; // marker for adding
var addinfowindow;
var placesService;
var DEFAULT_ZOOM = 17;
var currentLocationMarker; // blue dot to show current location

function getReq(url, success) {
    return $.ajax({
        url: url,
        type: "GET",
        beforeSend: function(xhr){xhr.setRequestHeader('access', window.localStorage.token)},
        success: success
    });
}
function postReq(url, data, success) {
    return $.ajax({
        url: url,
        type: "POST",
        data: data,
        beforeSend: function(xhr){xhr.setRequestHeader('access', window.localStorage.token)},
        success: success
    });
}

$(document).bind("mobileinit", function() {
    console.log("in mobileinit");
    $.support.cors = true;
    $.mobile.allowCrossDomainPages = true;
});

$(document).ajaxStart(function() {
    // console.log("in loading animation");
    $.mobile.loading('show', {
        text: "Fetching..."
    });
});

$(document).ajaxStop(function() {
    // console.log("in stop animation");
    $.mobile.loading('hide');
});

// Show the main map with user's position and bathrooms close to the user
$(document).on('pageinit', '#main-app', function() {
    console.log("map page loaded");
    $('#loading').hide();
    $('#content').show();
    setTimeout( function(){$('#map-page-link').click();}, 100);
    BIDSet = new MiniSet();
    bathInfoWindow = new google.maps.InfoWindow({noSupress: true});
    // $("#map-page").click();
    fixInfoWindow();
    navigator.geolocation.getCurrentPosition(showOnMap);
     $( document ).on( "swipeleft swiperight", "#account-page", function( e ) {
        // We check if there is no open panel on the page because otherwise
        // a swipe to close the left panel would also open the right panel (and v.v.).
        // We do this by checking the data that the framework stores on the page element (panel: open).
        if ( $.mobile.activePage.jqmData( "panel" ) !== "open" ) {
            if ( e.type === "swipeleft"  ) {
                //$( "#right-panel" ).panel( "open" );
            } else if ( e.type === "swiperight" ) {
                $( "#header" ).panel( "open" );
            }
        }
    });
    $('#back-to-map').click(function() {$('#map-page-link').click();})
    $('#map-page-link').click(function() {
        if ($('#account-page-link').hasClass("ui-state-persist")) {
            google.maps.event.trigger(map, 'resize');
        }
        $('#header ul li a').removeClass("ui-state-persist");
        $('#map-page-link').addClass("ui-state-persist");
        $('#toast').hide();
        $('#header').panel("close");
    });
    $('#add-page-link').click(function() {
        if ($('#account-page-link').hasClass("ui-state-persist")) {
            google.maps.event.trigger(map, 'resize');
        }
        $('#header ul li a').removeClass("ui-state-persist");
        $('#add-page-link').addClass("ui-state-persist");
        if (bathInfoWindow) {
            bathInfoWindow.close(); // hide the info window when going to add
        }
        toast("Tap to add...");
        $('#header').panel("close");
    });
    $('#account-page-link').click(function() {
        $('#header ul li a').removeClass("ui-state-persist");
        $('#account-page-link').addClass("ui-state-persist");
        $('#toast').hide();
        $('#header').panel("close");
    });
    $('#uemail').text(window.localStorage.email); // set user email on account page
    if (window.localStorage.loc) {
        $('#ulocation').text(window.localStorage.loc);
    }
    $('#change-email').val(window.localStorage.email); // set user email on change email page
});
$(document).bind('pagechange', '#main-app', function (event, data) {
    if (data.toPage[0].id == 'main-app') {
        google.maps.event.trigger(map, 'resize'); // prevent greyboxes
    }
});

// Draws a marker with the passed position on a map
var showOnMap = function(position) {
    console.log("showing map");
    var pinColor = "33CCFF";
    var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" +
        pinColor,
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34));

    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;
    var myLatlng = new google.maps.LatLng(latitude, longitude);
    var location = latitude + "," + longitude;
    var mapOptions = {
        center: myLatlng,
        mapTypeControl: false,
        //streetViewControl: false,
        panControl: false,
        zoomControl: false,
        //minZoom: 12,
        zoom: DEFAULT_ZOOM,
        tilt: 45,
        
    };
    map = new google.maps.Map(document.getElementById("map_canvas"),
        mapOptions);
    placesService = new google.maps.places.PlacesService(map);
    var noPoi = [
    // {
    //     featureType: "poi",
        
    //     stylers: [
    //       { visibility: "simplified" }
    //     ]   
    //   },
      {
        featureType: "road",
        
        stylers: [
          { visibility: "simplified" }
        ]   
      }
    ];

    map.setOptions({styles: noPoi});
    var infowindow = new google.maps.InfoWindow({
        content: 'You are here!',
        noSupress: true
    });
    currentLocationMarker = new google.maps.Marker({
        position: myLatlng,
        map: map,
        icon: {path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#33CCFF',
            fillOpacity: 0.8,
            strokeWeight: 2,
            strokeColor: 'silver',
            scale: 8}
    });
    google.maps.event.addListener(currentLocationMarker, 'click', function() {
        infowindow.open(map,currentLocationMarker);
    });

    google.maps.event.addListener(map, "idle", function (event) {
            //console.log("idle");
            getBathrooms(map.getCenter(), map);
        });
    google.maps.event.addListener(map, "dragstart", function (event) {
        $('#locate img').attr("src", "img/geolocation.png");
        closePanels();
    });
    google.maps.event.addListener(map, "click", function (event) {
        closePanels();
    })

    getBathrooms(myLatlng, map);
};

function closePanels() {
    $('.panel').panel("close");
}

// gets all bathrooms near LatLng position and displays them to map
var getBathrooms = function(LatLng, map) {
    //console.log("getting nearby bathrooms");
    getReq(baseUrl+"getallnear/"+LatLng.lat()+","+LatLng.lng(),
        function (data, status) {
            
            var marker;

            for (var i = 0; i < data.bathrooms.length; i++) {
                var currentB = data.bathrooms[i];
                var b_id = currentB._id;
                if (currentB["location"] != undefined && !BIDSet.has(b_id)) {
                    var name = currentB.name;
                    console.log("creating bathroom: " + name);
                    BIDSet.add(b_id);

                    // get details about each bathroom
                    var lat = currentB.location.lat;
                    var lng = currentB.location.lng;
                    var genderNum = currentB.gender;
                    var upvotes = currentB.upvotes;
                    var downvotes = currentB.downvotes;
                    var gender;
                    var typeNum = currentB.access;
                    var type;
                    var distance = currentB.distance;
                    var genderFA;
                    
                    if (genderNum == 0) {
                        gender = "Men's";
                        genderFA = '<i class="fa fa-male fa-2x"></i>'
                    } else if (genderNum == 1) {
                        gender = "Women's";
                        genderFA = '<i class="fa fa-female fa-2x"></i>'
                    } else {
                        gender = "Unisex";
                    }
                    
                    if (typeNum == 0) {
                        type = "Public";
                    } else if (typeNum == 1) {
                        type = "Private";
                    } else {
                        type = "Customers Only";
                    }

                    var newBathPos = new google.maps.LatLng(lat, lng);
                    
                    marker = new google.maps.Marker({
                        position: newBathPos,
                        map: map,
                        title: name
                        //animation: google.maps.Animation.DROP
                    });
                    var netVotes = upvotes - downvotes;
                    var style = "";
                    if (netVotes > 0) {
                        style = "color: green;";
                    } else if (netVotes < 0) {
                        style = "color: red;";
                    }

                    var content = '<div class="content">' + parseInt(distance) + 'm' +
                        '<h3 class="firstHeading"><div class="gender">' + genderFA + "</div>" + 
                            '<div class="name">' + name + '</div></h3>' +
                        '<div id="bodyContent">' +
                        '<div class="ratings"><i class="fa fa-thumbs-up rating">' + upvotes +'</i>' +
                        '<i class="fa fa-thumbs-down rating">' + downvotes +'</i></div>' + 
                        "<br><a href='#bathroom-details-page' id='add-confirm' data-theme='b' class='ui-btn ui-btn-inline ui-icon-arrow-r ui-btn-icon-right ui-mini' data-transition='slide'>Reviews</a></div>";
                    var markerClickCallback = function (marker, content, infowindow, b_id) {
                        return function() {
                            infowindow.setContent(content);
                            infowindow.open(map, marker);
                            currentBID = b_id;
                            $('#header').panel("close");
                            onDetailsLoad();
                        };
                    };
                    google.maps.event.addListener(marker, 'click', markerClickCallback(marker, content, bathInfoWindow, b_id));
                }
            }
        });
};

// called when user clicks on locate div
function locate() {
    $('#locate img').attr("src", "img/geolocationblue.png");
    navigator.geolocation.getCurrentPosition(centerMap);
}
function centerMap(position) {
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;
    var myLatlng = new google.maps.LatLng(latitude, longitude);
    currentLocationMarker.setPosition(myLatlng);
    map.panTo(myLatlng);
    var zoom = map.getZoom();
    setTimeout(smoothZoom(map, DEFAULT_ZOOM, zoom), 150);
}


function smoothZoom (map, max, cnt) {
    if (cnt >= max) {
            return;
        }
    else {
        z = google.maps.event.addListener(map, 'zoom_changed', function(event){
            google.maps.event.removeListener(z);
            smoothZoom(map, max, cnt + 1);
        });
        setTimeout(function(){map.setZoom(cnt)}, 80); // 80ms is what I found to work well on my system -- it might not work well on all systems
    }
}  
function save (key, value) {
    window.localStorage[key] = value;
};

function toast(message) {
    $('#toast').text(message);
    $('#toast').fadeIn("slow");
    setTimeout(function(){$('#toast').fadeOut("slow")}, 2500);
};

//infowindow fix:
function fixInfoWindow() {
    //If it is called for map option, we hide InfoWindow, if "noSupress" option isnt true.
    var set = google.maps.InfoWindow.prototype.set;
    google.maps.InfoWindow.prototype.set = function (key, val) {
        if (key === 'map') {
            if (!this.get('noSupress')) {
                if (addListener) {
                    var event = {latLng: this.position};
                    confirmPopup(event);
                }
                return;
            }
        }
        set.apply(this, arguments);
    }
};

function confirmPopup(event) {
    var lat = event.latLng.lat();
    var lng = event.latLng.lng();
    if (addMarker) {
        addMarker.setMap(null);
    }
    addMarker = new google.maps.Marker({
        position: new google.maps.LatLng(lat, lng),
        map: map,
        title: "Selected",
        animation: google.maps.Animation.DROP
    });
    setTimeout(function() {addinfowindow.open(map, addMarker);}, 300);
};

var NUM_REVIEWS = 5; // max number of reviews to show initially

// called when details button is clicked, gets bathroom info
function onDetailsLoad() {
    var list = $('#bdetailslist');
    $('.error', list.parent()).text(""); // clear errors
    $('#bplace').hide();
    getReq(baseUrl + "getbathroom/" + currentBID, function (res) {
        $('#bname').text(res.bathroom.name);
        var netVotes = res.bathroom.upvotes - res.bathroom.downvotes;
        var brating = $('#brating');
        brating.removeClass("red green");
        if (netVotes > 0) {
            brating.css("color", "green");
        } else if (netVotes < 0) {
            brating.css("color", "red");
        }
        // '<div class="ratings"><i class="fa fa-thumbs-up rating">' + upvotes +'</i>' +
        //                 '<i class="fa fa-thumbs-down rating">' + downvotes +'</i></div>' + 
        $('#brating').text(netVotes);
        console.log(res);
        if (res.bathroom.placesRef) {
            placesService.getDetails({key: API_KEY, reference: res.bathroom.placesRef, sensor: true}, function (res, status) {
                console.log(res);
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    console.log("getDetails sucess");
                    $('#bplace').slideDown().empty().append($('<a target="_blank" href="'+res.url+'">'+res.name+'</a>'));
                } else {
                    console.log("error details");

                }
            });
        } else {
            console.log("no places ref");
        }
    }).fail(function(err) {
        console.log("get bathroom error");
        $(".error", list.parent()).text(err.responseJSON.errors);
    });
    save('reviews', null);
    getReviews();
    $('#review-form')[0].reset();
};

// Gets reviews and displays them in the bathroom details
var getReviews = function() {
    var list = $('#bdetailslist');
    getReq(baseUrl+"getreviews/"+currentBID, function (res) {
        $('.review', list).remove();
        var moreReviewsBtn = $('#more-reviews');
        var reviews = res.bathroom.reviews.reverse();
        if (reviews.length == 0) {
            list.append($('<li class="review"><div class="card"><p>No reviews... yet!</p></div></li>'));
            moreReviewsBtn.hide();
        } else {
            for (var i = 0; i < Math.min(reviews.length, NUM_REVIEWS); i++) {
                appendReview(list, reviews[i]);
            }
            if (reviews.length > NUM_REVIEWS) {
                moreReviewsBtn.show();
                window.localStorage.reviews = JSON.stringify(reviews);
            } else {
                moreReviewsBtn.hide();
            }
        }
    }).fail(function (err) {
        $(".error", list.parent()).text(err.responseJSON.errors);
    })
}
function appendReview(list, myReview) {
    $('<li class="review"><div class="card"><q>'+myReview.review+'</q></div></li>').hide().appendTo(list).slideDown();
}

// Handler upon submitting a new review for a bathroom
$('#review-form').submit(function (e) {
    e.stopImmediatePropagation();
    e.preventDefault();
    var form = $('#review-form');
    $('.error', form).text("");
    var cleanliness = $('input[name="clean"]', form).prop('checked');
    if (cleanliness) {
        cleanliness = 5;
    } else {
        cleanliness = 1;
    }
    var vote = $('input[name="vote"]', form).val(); // TODO send vote to api
    if (vote == '0') {
        vote = "-1";
    }
    var review = $('#add-review-text').val();
    var formData = {
        "bid": currentBID,
        "cleanliness": cleanliness,
        "review": review
    };
    postReq(baseUrl + "addreview", formData, function(res) {
        $('#review-form')[0].reset();
        getReviews();
        console.log("successfully added review");
    }).fail(function(err) {
        $("#review-form .error").text(err.responseJSON.errors);
    });
    postReq(baseUrl + "addvote", {"bid": currentBID, "voteDir": vote}, function(res) {
        console.log("succesfully added vote");
    });
});

// Handler for clicking the more button to show more reviews
$('#more-reviews').click(function() {
    var reviews = JSON.parse(window.localStorage.reviews);
    var list = $('#bdetailslist');
    if (reviews) {
        for (var i = NUM_REVIEWS; i < reviews.length; i++) {
            appendReview(list, reviews[i]);
        }
    }
    $('#more-reviews').hide();
});

function tryLogin(err) {
    if (err.status == 401) {
        $.get(baseUrl+"validatetoken/"+window.localStorage.token, function(res) {
            console.log("signin successful");
        }).fail(function(err) {
            window.location.replace('index.html');
        });
    }
}
