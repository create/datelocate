// called when user navigate to me tab
var getAndShowAccountInfo = function() {
    getReq(baseUrl + "account", function (data, status) {
        window.localStorage['email'] = data.user.email;
        window.localStorage['loc'] = data.user.profile.location;
        $('#uemail').text(data.user.email);
        var options = {
            useEasing : true, 
            useGrouping : true, 
            separator : ',', 
            decimal : '.' 
        }
        var demo = new countUp("ureviewcount", 0, data.user.voted_bathrooms.length, 0, 2, options);
        demo.start();
        //$('#ureviewcount').text(data.user.voted_bathrooms.length);
        $('#ulocation').text(data.user.profile.location);
    }).fail(tryLogin);
};

// called when user navigates to change email page
var onUpdateEmailStart = function() {
    var input = $('#change-email');
    var form = $('#change-email-form');
    $(".error", form).text("");
    input.val(window.localStorage.email);
};

// when submitting an email change
var onUpdateEmailFinish = function(e) {
    e.stopImmediatePropagation();
    e.preventDefault();
    var form = $('#change-email-form');
    var email = $('#change-email').val();
    var formData = {
        "email": email
    };
    postReq(baseUrl + "account/profile/", formData, function() {
        // TODO display some temporary success message or toast
        console.log("succesfully changed email");
        save('email', email);
        $('#uemail').text(email);
        history.back();
    }).fail(function(err) {
        tryLogin(err);
        console.log("error");
        $(".error", form).text(err.responseJSON.errors);
    });
};

// called when user navigates to change location page
var onUpdateLocationStart = function() {
    var input = $('#change-loc');
    var form = $('#change-email-form');
    $(".error", form).text("");
    if (window.localStorage.loc) {
        input.val(window.localStorage.loc);
    }
};

var onUpdateLocationFinish = function(e) {

    e.stopImmediatePropagation();
    e.preventDefault();
    var form = $('#change-loc-form');
    var loc = $('#change-loc').val();
    if (loc) {
        var formData = {
            "location": loc
        };
        postReq(baseUrl + "account/profile/", formData, function() {
            // TODO display some temporary success message or toast
            console.log("succesfully changed loc");
            save('loc', loc);
            $('#ulocation').text(loc);
            history.back();
        }).fail(function(err) {
            console.log("error");
            $(".error", form).text(err.responseJSON.errors);
        });
    }
    
};

var onSignout = function() {
    save('token', null);
    save('email', null);
    getReq(baseUrl + "signout");
    window.location.replace('index.html');
};

$('#account-page-link').click(getAndShowAccountInfo);
$('#uemail').click(onUpdateEmailStart);
$('#change-email-form').submit(onUpdateEmailFinish);
$('#ulocation').click(onUpdateLocationStart);
$('#change-loc-form').submit(onUpdateLocationFinish);
$('#signout-link').click(onSignout);