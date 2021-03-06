//accounts.js
window.fbAsyncInit = function () {
    FB.init({
        appId      : '233709206819119',
        status     : true, // check login status
        cookie     : true, // enable cookies to allow the server to access the session
        xfbml      : true  // parse XFBML
    });

    // Here we subscribe to the auth.authResponseChange JavaScript event. This event is fired
    // for any authentication related change, such as login, logout or session refresh. This means that
    // whenever someone who was previously logged out tries to log in again, the correct case below
    // will be handled.
    FB.Event.subscribe('auth.authResponseChange', function(response) {
        // Here we specify what we do with the response anytime this event occurs.
        if (response.status === 'connected') {
            // The response object is returned with a status field that lets the app know the current
            // login status of the person. In this case, we're handling the situation where they
            // have logged in to the app.

            signIn();
        } else if (response.status === 'not_authorized') {
            // In this case, the person is logged into Facebook, but not into the app, so we call
            // FB.login() to prompt them to do so.
            // In real-life usage, you wouldn't want to immediately prompt someone to login
            // like this, for two reasons:
            // (1) JavaScript created popup windows are blocked by most browsers unless they
            // result from direct interaction from people using the app (such as a mouse click)
            // (2) it is a bad experience to be continually prompted to login upon page load.
            console.log("not_auth");
            setLoginStatus(false);
        } else {
            // In this case, the person is not logged into Facebook, so we call the login()
            // function to prompt them to do so. Note that at this stage there is no indication
            // of whether they are logged into the app. If they aren't then they'll see the Login
            // dialog right after they log in to Facebook.
            // The same caveats as above apply to the FB.login() call here.
            console.log("else notloggedin");
                setLoginStatus(false);
        }
    });
};

// Load the SDK asynchronously
(function(d){
    var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
    if (d.getElementById(id)) {return; }
    js = d.createElement('script'); js.id = id; js.async = true;
    js.src = "//connect.facebook.net/en_US/all.js";
    ref.parentNode.insertBefore(js, ref);
}(document));

// Here we run a very simple test of the Graph API after login is successful.
// This testAPI() function is only called in those cases.
function signIn() {
    console.log('Welcome!  Fetching your information.... ');
    FB.api('/me', function (response) {
        console.log('Good to see you, ' + response.name + '.');
        console.log("fb id: " + response.id);
        window.localStorage.userid = response.id;
        $.post(baseUrl +"signin", {userid: window.localStorage.userid, password: window.localStorage.userid}, function(res) {
            console.log("signin success");
            setLoginStatus(true, response.name);
            getAccountInfo();
        }).fail(function(err) {
            console.log(err.responseJSON.errors);
            $.post(baseUrl+"signup", {userid: window.localStorage.userid, password: window.localStorage.userid}, function(res) {
                console.log("signup success");
                setLoginStatus(true, response.name);
                getAccountInfo();
            }).fail(function(err) {
                console.log(err.responseJSON.errors);
            });
        });
    });
}
function setLoginStatus(inOrOut, name) {
    if (inOrOut) {
        $('#username').html("Welcome <span style='font-weight: 300;'>" + name+"</span>");
        $('#not-logged-in').css("display", "none");
        $('#logged-in').css("display", "default");
    } else {
        $('#logged-in').css("display", "none");
        $('#not-logged-in').css("display", "default");
        $('#username').html("Not logged in");
    }
}
function getAccountInfo() {
    getReq(baseUrl + "account", function(data, status) {
        var datesArr = data.user.voted_dates;
        var kudoPoints = datesArr.length;
        var currentPoints = $("#reviewcount").text();
        var options = {
            useEasing: true,
            useGrouping: true,
            seperator: ",",
            decimal:"."
        };
        var list = $('#dates-list');
        var demo = new countUp("reviewcount", 0, kudoPoints, 0, 2.2, options);
        demo.start();
        console.log(kudoPoints + " " + currentPoints + " " + $('#dates-list').children().length);
        if (kudoPoints != currentPoints || $('#dates-list').children().length == 0) {
            $('.donedate', list).remove();
            var dateSet = new MiniSet();
            dateSet.add(datesArr);
            var keys = dateSet.keys();

            // get array of date id's
            // for each one, add it to the div in a similar fashion to the reviews
            for (var i = 0; i < keys.length; i++) {
                getReq(baseUrl + "getdate/" + keys[i], function (res) {
                    if (res != null && res.date != null) {
                        $('<li class="donedate"><a href="#" onclick="(function(){currentDID = \''+res.date._id+'\'; onDetailsLoad(true);})();" ><strong>' + res.date.name +
                        '</strong> at '+res.date.location_name+'</a></li>').hide().appendTo(list).slideDown();
                    }
                });

            }
            list.listview("refresh");
        }
    }).fail(function(err) {
        console.log("get account error");
        $(".error", list.parent()).text(err.responseJSON.errors);
    });
}
$(document).ready(function() {
    $('#logout').click(function (e) {
        e.stopImmediatePropagation();
        e.preventDefault();
        FB.api('me/permissions', 'delete', function (res) {
            console.log(res);
            setLoginStatus(false);
        });
    });
    $('#accountbutton').click(function(e) {
        getAccountInfo();
    });
});