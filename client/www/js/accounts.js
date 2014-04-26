//accounts.js

function findName() {
	FB.api('/me', function(response) {
    $('#username').html("Welcome " + response.name);
    $('#userphoto').html(<img src=response.userphoto />)
    console.log(response.name);
	});
}