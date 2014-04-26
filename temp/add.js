// TODO fix global variables


var addListener;
var MAX_PLACE_DISTANCE = 160; // meters
var placeTypes = [ 'accounting', 'airport', 'amusement_park', 'aquarium', 'art_gallery', 'atm', 'bakery', 'bank', 'bar', 'beauty_salon', 'bicycle_store', 'book_store', 'bowling_alley', 'bus_station', 'cafe', 'campground', 'car_dealer', 'car_rental', 'car_repair', 'car_wash', 'casino', 'cemetery', 'church', 'city_hall', 'clothing_store', 'convenience_store', 'courthouse', 'dentist', 'department_store', 'doctor', 'electrician', 'electronics_store', 'embassy', 'establishment', 'finance', 'fire_station', 'florist', 'food', 'funeral_home', 'furniture_store', 'gas_station', 'general_contractor', 'grocery_or_supermarket', 'gym', 'hair_care', 'hardware_store', 'health', 'hindu_temple', 'home_goods_store', 'hospital', 'insurance_agency', 'jewelry_store', 'laundry', 'lawyer', 'library', 'liquor_store', 'local_government_office', 'locksmith', 'lodging', 'meal_delivery', 'meal_takeaway', 'mosque', 'movie_rental', 'movie_theater', 'moving_company', 'museum', 'night_club', 'painter', 'park', 'parking', 'pet_store', 'pharmacy', 'physiotherapist', 'place_of_worship', 'plumber', 'police', 'post_office', 'real_estate_agency', 'restaurant', 'roofing_contractor', 'rv_park', 'school', 'shoe_store', 'shopping_mall', 'spa', 'stadium', 'storage', 'store', 'subway_station', 'synagogue', 'taxi_stand', 'train_station', 'travel_agency', 'university', 'veterinary_care', 'zoo'];
var addPlace;
// Initalizes an event listener for dropping pins
var addInit = function () {
    if (!addListener) {
        if (!addinfowindow) {
            addinfowindow = new google.maps.InfoWindow({noSupress:true});
            // TODO clean up contentstring button link is messy
            var content = '<div class="content">' +
                '<div id="place-name"></div>' +
                '<div id="bodyContent">' +
                "<a href='#add-details-page' id='add-confirm' data-theme='b' style='color:rgb(12,184,12);' role='button' data-icon='check' class='ui-link ui-btn ui-icon-check ui-btn-icon-left ui-shadow ui-corner-all' onclick='fillNamePlaces()' data-role='button' data-transition='slide'>Confirm</a>" + '</div></div>'
            addinfowindow.setContent(content);
        }
        addListener = google.maps.event.addListener(map, "click", confirmPopup);
    }
    if (!placesService) {
        placesService = new google.maps.places.PlacesService(map);
    }
};

// Resets the form and adds a new name from google places
function fillNamePlaces() {
    $('#namesuggestions').remove();
    $('#add-form')[0].reset();
    addPlace = null;
    var curPos = addMarker.getPosition();
    var request = {
        location: curPos,
        rankBy: google.maps.places.RankBy.DISTANCE,
        types: placeTypes
    };
    placesService.nearbySearch(request, function (results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            console.log(results);
            var fieldset = $('<fieldset data-role="controlgroup" id="namesuggestions" ><h4>Is this...</h4><br></fieldset>');
            for (var i = 0; i < Math.min(results.length, 3); i++) {
                var curResult = results[i];
                var ref = curResult.reference;
                var id = curResult.id;
                if (curResult.opening_hours) {
                    var openNow = curResult.opening_hours.open_now;
                }
                var distance = getDistanceFromLatLonInKm(curPos.lat(), curPos.lng(),
                    curResult.geometry.location.lat(), curResult.geometry.location.lng()) * 1000;
                if (distance <= MAX_PLACE_DISTANCE) {
                    // var label = $('input[value="'+i+'"]', fieldset);
                    // label.val(curResult.name);
                    // label.append(curResult.name);
                    // label.trigger("create");
                    fieldset.append($('<label><input type="radio" onchange="pickPlace(this)" ref="'+ref+'"bid="'+id+'" name="place" value="'+results[i].name+'">' + results[i].name + '</label>'));
                }
            }
            fieldset.hide().prependTo('#add-form div.ui-field-contain').trigger("create").slideDown();
            
        } else {
            console.log("error places " + status);
        }
    })
};

function pickPlace(tag) {
    var fieldset = $('#namesuggestions').slideUp(function(){fieldset.remove();});
    $('#add-name').val(tag.value);

    addPlace = {id: $(tag).attr("bid"), ref: $(tag).attr("ref")};
};

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
};

function deg2rad(deg) {
  return deg * (Math.PI / 180)
};

// Gets the address of the lat/lng
function fillNameGeocoding() {
        $.get(
            "https://maps.googleapis.com/maps/api/geocode/json?latlng=" +
            addMarker.getPosition().lat()+","+addMarker.getPosition().lng()+"&sensor=false&key="+API_KEY,
            function(data) {
                // Get the closest address within a certain radius
                console.log(data);
                
                $('#add-name').val(data.results[0].formatted_address.split(",")[0]);
            }
        );
}

// removes the pin dropping listener for the add page and confirm pin
var addDeInit = function () {
    if (addMarker) {
        addMarker.setMap(null);
    }
    google.maps.event.removeListener(addListener);
    addListener = null;
};

$('#add-page-link').click(addInit);
$('#map-page-link').click(addDeInit);

// Handler for submitting the bathroom details to add a bathroom
$('#add-form').submit(function (e) {
    e.stopImmediatePropagation();
    e.preventDefault();
    console.log("add-form submit");
    var form = $("#add-form");
    var bathroom_name = $('#add-name', form).val();
    var bathroom_access = $('input[name="access"]:checked').val();
    var gender = $('input[name="gender"]:checked').val();
    var voteDir = $('input[name="rating"]:checked').val();
    if (!addMarker) { // make sure user entered the page by selecting a marker
        $(".error", form).text("Please go back and select a marker.");
        return;
    }
    var postData = {
        "lat": addMarker.getPosition().lat(),
        "lng": addMarker.getPosition().lng(),
        "bathroom_name": bathroom_name,
        "bathroom_access": bathroom_access,
        "gender": gender,
        "voteDir": voteDir
    };
    if (addPlace) {
        postData.placesID = addPlace.id;
        postData.placesRef = addPlace.ref;
    }
    //console.log(postData);
    if (true) { // TODO validate input
        postReq(baseUrl+"addbathroom", postData, function(res) {
            console.log("addbathroom success");
            if (addMarker) {
                addMarker.setMap(null);
            }
            getBathrooms(map.getCenter(), map);
            form["0"].reset();
            $('#add-details-page').panel("close");
        })
        .fail(function(err) {
            
            $(".error", form).text(err.responseJSON.errors);
        });
    } else {
        $(".error", form).text('Whoops, looks like you missed something!');
    }
    return false;
});