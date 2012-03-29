$(function()
{
$(window).bind('load', function()
{
// CODE THAT WILL BE EXECUTED AFTER THE PAGE COMPLETELY LOADED...
confirm_token();

});
});

function confirm_token() {
var challenge = window.location.href.slice(window.location.href.indexOf('?') + 1);

// test if token is valid
if (! /^([a-zA-Z0-9]{5,200})$/.test(challenge) ) {
    $('div.response_flag').html('FAILED');
    $('div.response_message').html(register_messages['INVALID_CHALLENGE']['message']);
    $('div.response_detail').html(register_messages['INVALID_CHALLENGE']['detail']);
    return ;
}

$.getJSON("http://localhost:3000/confirm/challenge",
    function(data){
      $.each(data.items, function(i,item){
        $("<img/>").attr("src", item.media.m).appendTo("#images");
        if ( i == 4 ) return false;
      });
    });
    
    
}