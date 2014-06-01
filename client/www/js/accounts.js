var baseUrl = "http://d-api.herokuapp.com/";
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
      
      testAPI();
    } else if (response.status === 'not_authorized') {
      // In this case, the person is logged into Facebook, but not into the app, so we call
      // FB.login() to prompt them to do so. 
      // In real-life usage, you wouldn't want to immediately prompt someone to login 
      // like this, for two reasons:
      // (1) JavaScript created popup windows are blocked by most browsers unless they 
      // result from direct interaction from people using the app (such as a mouse click)
      // (2) it is a bad experience to be continually prompted to login upon page load.
      console.log("notloggedin");
      
      FB.login();
    } else {
      // In this case, the person is not logged into Facebook, so we call the login() 
      // function to prompt them to do so. Note that at this stage there is no indication
      // of whether they are logged into the app. If they aren't then they'll see the Login
      // dialog right after they log in to Facebook. 
      // The same caveats as above apply to the FB.login() call here.
      console.log("notloggedin");
      FB.login();
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
  function testAPI() {
    console.log('Welcome!  Fetching your information.... ');
    FB.api('/me', function(response) {
      console.log('Good to see you, ' + response.name + '.');
    });
    FB.api('/me', function (response) {
        console.log("fb id: " + response.id);
        window.localStorage.userid = response.id;
        $.post(baseUrl +"signin", {userid: window.localStorage.userid, password: window.localStorage.userid}, function(res) {
            console.log("signin success");
            // redirectOnLogin();
        }).fail(function(err) {
            console.log(err.responseJSON.errors);
            $.post(baseUrl+"signup", {userid: window.localStorage.userid, password: window.localStorage.userid}, function(res) {
            console.log("signup success");
            // redirectOnLogin();
          }).fail(function(err) {
            console.log(err.responseJSON.errors);
          });
        });
    });
  }
function findName() {
	FB.api('/me', function(response) {
		console.log("Success " + response.name);
		if (response.name != undefined) {
			$('#not-logged-in').css("display", "none");
			$('#logged-in').css("display", "default");
			$('#username').html("Welcome <span style='font-weight: 300;'>" + response.name+"</span>");
			
		} else {
			$('#logged-in').css("display", "none");
			$('#not-logged-in').css("display", "default");
			$('#username').html("Not logged in");
		}
    
	});
  getReq(baseUrl + "account", function(data, status) {
        var datesArr = data.user.voted_dates;
        var options = {
          useEasing: true,
          useGrouping: true,
          seperator: ",",
          decimal:"."
        }
        var list = $('#dates-list');
        $('.donedate', list).remove();
        var demo = new countUp("reviewcount", 0, datesArr.length, 0, 2, options);
        demo.start();
        var dateSet = new MiniSet();
        dateSet.add(datesArr);
        var keys = dateSet.keys();

        //get array of date id's 
        //for each one, add it to the div in a similar fashion to the reviews
        for (var i = 0; i < keys.length; i++) {
          getReq(baseUrl + "getdate/" + keys[i], function (res) {
            console.log(res);
                if (res != null && res.date != null) {
                  $('<li class="donedate"><a href="#" onclick="(function(){currentDID = \''+res.date._id+'\'; onDetailsLoad();})();" ><strong>' + res.date.name +
                    '</strong> at '+res.date.location_name+'</a></li>').hide().appendTo(list).slideDown();
                }
          });
          
        }
        list.listview("refresh");
      }).fail(function(err) {
          console.log("get account error");
          $(".error", list.parent()).text(err.responseJSON.errors);
      });
}
function redirectOnLogin() {
	$.mobile.changePage('#map-page', {allowSamePageTransition: true, transition: "slideup"});
	setTimeout(function(){
            navigator.geolocation.getCurrentPosition(centerMap);
        }, 500);
}