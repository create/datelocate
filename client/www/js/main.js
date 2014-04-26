var baseUrl = "http://d-api.herokuapp.com/";
var map;
var DIDSet;
var API_KEY = "AIzaSyA_3-FTpr5X41YFGR-xFHVZMbjcU-BJp1Q"; // google maps api key (jeff's acc)
var currentDID;
var addMarker; // marker for adding
var addinfowindow;
var placesService;
var DEFAULT_ZOOM = 13;
var currentLocationMarker; // blue dot to show current location

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
//$(document).on('pageinit', '#landing-page', function() {
$(document).ready(function() {
    console.log("page loaded");
    if (window.localStorage.userid) {
        // say already logged in
    }
    $('#loading').hide();
    $('#content').show();
    DIDSet = new MiniSet();
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
     $('#addbutton').click(function() {
        
        $('#header').panel("close");
    });
    
});
$(document).bind('pagechange', '#main-app', function (event, data) {
    if (data.toPage[0].id == 'map-page') {
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
      // {
      //   featureType: "road",
        
      //   stylers: [
      //     { visibility: "simplified" }
      //   ]   
      // }
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
            getDates(map.getCenter(), map);
        });
    google.maps.event.addListener(map, "dragstart", function (event) {
        $('#locate img').attr("src", "img/geolocation.png");
        closePanels();
    });
    google.maps.event.addListener(map, "click", function (event) {
        closePanels();
    })

    getDates(myLatlng, map);

    // Create the search box and link it to the UI element.
    var input = /** @type {HTMLInputElement} */(
      document.getElementById('pac-input'));
    //map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    var searchBox = new google.maps.places.SearchBox(
    /** @type {HTMLInputElement} */(input));

    // Listen for the event fired when the user selects an item from the
    // pick list. Retrieve the matching places for that item.
    google.maps.event.addListener(searchBox, 'places_changed', function() {
    var places = searchBox.getPlaces();
    // for (var i = 0, marker; marker = markers[i]; i++) {
    //     marker.setMap(null);
    // }

    // For each place, get the icon, place name, and location.
    //markers = [];
    var bounds = new google.maps.LatLngBounds();

    for (var i = 0, place; place = places[i]; i++) {
      var image = {
        // url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25)
      };
      map.panTo(place.geometry.location);
        var zoom = map.getZoom();
        setTimeout(smoothZoom(map, DEFAULT_ZOOM, zoom), 150);
      bounds.extend(place.geometry.location);
    }

    
    });

    // Bias the SearchBox results towards places that are within the bounds of the
    // current map's viewport.
    google.maps.event.addListener(map, 'bounds_changed', function() {
    var bounds = map.getBounds();
    searchBox.setBounds(bounds);
    });
    
};

function closePanels() {
    $('#account-panel').panel("close");
}

// gets all bathrooms near LatLng position and displays them to map. called initially and when map is panned
var getDates = function(LatLng, map) {
    getReq(baseUrl+"getallnear/"+LatLng.lat()+","+LatLng.lng(),
        function (data, status) {
            var marker;
            for (var i = 0; i < data.dates.length; i++) {
                var current = data.dates[i];
                var did = current._id;
                if (!DIDSet.has(did)) {
                    var name = current.name;
                    var lat = current.location.lat;
                    var lng = current.location.lng;
                    console.log("creating date: "+name);
                    DIDSet.add(did);
                    var newBathPos = new google.maps.LatLng(lat, lng);
                    marker = new google.maps.Marker({
                        position: newBathPos,
                        map: map,
                        title: name
                        //animation: google.maps.Animation.DROP
                    });
                    var markerClickCallback = function (did) {
                        return function() {
                            currentDID = did;
                            $('#account-panel').panel("close");

                            onDetailsLoad();
                        };
                    };
                    google.maps.event.addListener(marker, 'click', markerClickCallback(did));
                }
            }
        });
};

var NUM_REVIEWS = 3; // max number of reviews to show initially

// called when a marker is clicked. gets info and displays in panel
function onDetailsLoad() {
    var list = $('#detailslist');
    $('.error', list.parent()).text(""); // clear errors
    $('#dplace').hide();
    $('#at').hide();
    $('#dpicture').hide();
    $('#dates-details-page').panel("open");
    getReq(baseUrl + "getdate/" + currentDID, function (res) {
        $('#dname', list).text(res.date.name);
        if (res.date.location_name) {
            $('#dlocation', list).text(res.date.location_name);
        } else {
            $('#dlocation', list).text("No specific location!");
        }
        var price = res.date.price;
        if (price == 0) {
            price = "Free";
        } else if (price == 1) {
            price = "$";
        } else if (price == 2) {
            price = "$$";
        } else if (price == 3) {
            price = "$$$";
        }
        $('#dprice', list).text(price);
        if (res.date.materials) {
            $('#dmaterials', list).text(res.date.materials);
        } else {
            $('#dmaterials', list).text("Nothing to bring!");
        }
        $('#dreview', list).text(res.date.review);
        $('#dpicture').empty();
        console.log(res);
        if (res.date.placesRef) {
            placesService.getDetails({key: API_KEY, reference: res.date.placesRef, sensor: true}, function (res, status) {
                console.log(res);
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    console.log("getDetails sucess");
                    $('#at').show();
                    $('#bplace').show().text(res.name);
                    // get picture
                    //$('#bplace').slideDown().empty().append($('<a target="_blank" href="'+res.url+'">'+res.name+'</a>'));
                    if (res.photos && res.photos.length > 0) {
                        console.log("Found photo");
                        $('#dpicture', list).show().empty().append($('<a target="_blank" href="'+res.url+'"><img style="width: 100%; height: auto;" src='+res.photos[0].getUrl({'maxWidth': 500, 'maxHeight': 500})+'alt="photo"></a>'));
                        list.listview("refresh");
                    }
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

// EXTRA STUFF

function getReq(url, success) {
    return $.ajax({
        url: url,
        type: "GET",
        beforeSend: function(xhr){xhr.setRequestHeader('access', window.localStorage.userid)},
        success: success
    });
}
function postReq(url, data, success) {
    return $.ajax({
        url: url,
        type: "POST",
        data: data,
        beforeSend: function(xhr){xhr.setRequestHeader('access', window.localStorage.userid)},
        success: success
    });
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
    $('#toast').fadeIn();
    setTimeout(function(){$('#toast').fadeOut("slow")}, 3500);
    findName();
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

var getReviews = function() {
    var list = $('#detailslist');
    getReq(baseUrl+"getreviews/"+currentDID, function (res) {
        $('.review', list).remove();
        var moreReviewsBtn = $('#more-reviews');
        var reviews = res.date.reviews.reverse();
        if (reviews.length == 0) {
            list.append($('<li class="review">Nothing... yet!</li>')).listview("refresh");
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
    $('<li class="review"><q>'+myReview.review+'</q></li>').hide().appendTo(list).slideDown();
}

$('#review-form').submit(function (e) {
    e.stopImmediatePropagation();
    e.preventDefault();
    var form = $('#review-form');
    $('.error', form).text("");
    var review = $('#add-review-texta').val();
    var formData = {
        "did": currentDID,
        "review": review
    };
    postReq(baseUrl + "addreview", formData, function(res) {
        $('#review-form')[0].reset();
        getReviews();
        console.log("successfully added review");
    }).fail(function(err) {
        $("#review-form .error").text(err.responseJSON.errors);
    });
});