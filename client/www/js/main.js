var baseUrl = "http://d-api.herokuapp.com/";
var map;
var DIDSet;
var API_KEY = "AIzaSyA_3-FTpr5X41YFGR-xFHVZMbjcU-BJp1Q"; // google maps api key (jeff's acc)
var currendDID;
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
};

function closePanels() {
    $('.panel').panel("close");
}

// gets all bathrooms near LatLng position and displays them to map. called initially and when map is panned
var getDates = function(LatLng, map) {
    
};

var NUM_REVIEWS = 3; // max number of reviews to show initially

// called when a marker is clicked. gets info and displays in panel
function onDetailsLoad() {
    
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



function tryLogin(err) {
    if (err.status == 401) {
        $.get(baseUrl+"validatetoken/"+window.localStorage.token, function(res) {
            console.log("signin successful");
        }).fail(function(err) {
            window.location.replace('index.html');
        });
    }
}
