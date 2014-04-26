//accounts.js

FB.api('/me', function(response) {
    $('#username').html("Welcome " + response.name);
});