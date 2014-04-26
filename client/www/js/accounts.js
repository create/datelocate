//accounts.js

function findName() {
	FB.api('/me', function(response) {
    $('#username').html("Welcome " + response.name);
    console.log(response.name);
	});
}