$(function()
{
$(window).bind('load', function()
{
    var userName_field = $("#userName");
    var userCheck = $("#userCheck");
    var userName_regexp = /^([a-zA-Z0-9]{5,21})$/;
    
    var fireChangeAfter = 1000;

    var lastUserNameValue = "";
// CODE THAT WILL BE EXECUTED AFTER THE PAGE COMPLETELY LOADED...
    userName_field.change(function() {
      if (lastUserNameValue == userName_field.val()) return;
      lastUserNameValue = userName_field.val();
      if (! userName_regexp.test(userName_field.val())) {
          userCheck.html(register_messages['INVALID_USER_NAME']['detail']);
          return;
      }
      
      $.getJSON(register_config['REGISTER_URL']+"/"+lastUserNameValue+"/check/",
         function(data){
          if (data != null && data.exists != undefined) {
              userCheck.html((data.exists) ? my_messages['USERNAME_NOT_AVAILABLE'] 
                                           : my_messages['USERNAME_AVAILABLE']);
          } else {
              userCheck.html(register_messages['INTERNAL_ERROR']['detail']);
          }
       });
 
      
      userCheck.html(my_messages['CHECKING_USERNAME']);
      console.log("test");
    });
    
    var keyupcount = 0;
    // fire "change event after n second"
     userName_field.keyup(function() {
      var mynum = ++keyupcount; // to check I'm the last one
      setTimeout(function() {
           if (mynum == keyupcount) {
               userName_field.change();
               console.log("for me");
           } 
        },2000);
    });
  
    console.log("loaded");
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