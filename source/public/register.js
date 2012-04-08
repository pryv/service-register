$(function()
{
$(window).bind('load', function()
{
  
console.log("Register Loading");
  
// GENERIC FOR FIELDS MONITORING

var fireChangeAfter = 1000;
function monitorKeyUp(field) {
  var keyupcount = 0;
  // fire "change event after n second"
  field.keyup(function() {
    var mynum = ++keyupcount; // to check I'm the last one
    setTimeout(function() {
      if (mynum == keyupcount) {
        field.change();
        console.log("fire keyup for"+field.selector);
      } 
    },fireChangeAfter);
  });
}

function monitorChange(field,callback) { 
  var last_fieldValue = "";
  field.change(function() {
    console.log(field.selector+" "+last_fieldValue);
    if (last_fieldValue == field.val()) return;
    last_fieldValue = field.val();
    callback(last_fieldValue);
  });
  console.log("Monitoring change of: "+field.selector);
  monitorKeyUp(field);
}
    
//---------------- USERNAME -----------------//

var userName_field = $("#userName");
var userCheck = $("#userCheck");
var userName_regexp = /^([a-zA-Z0-9]{5,21})$/;


function userNameChange(value) {
    if (! userName_regexp.test(value)) {
      userCheck.html(register_messages['INVALID_USER_NAME']['detail']);
      return;
    }
    
    $.getJSON(register_config['REGISTER_URL']+"/"+value+"/check/",
      function(data){
        if (data != null && data.exists != undefined) {
          userCheck.html((data.exists) ? my_messages['USERNAME_NOT_AVAILABLE'] 
                                       : my_messages['USERNAME_AVAILABLE']);
        } else {
          userCheck.html(register_messages['INTERNAL_ERROR']['detail']);
        }
     });
}

monitorChange(userName_field,userNameChange);
//---------------- EMAIL -----------------//

var email_field = $("#email");
var emailCheck = $("#emailCheck");
var email_regexp = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

function emailChange(value) {
    if (! email_regexp.test(value)) {
      emailCheck.html(register_messages['INVALID_EMAIL']['detail']);
    } else {
      emailCheck.html(my_messages['OK']);
    }
}
monitorChange(email_field,emailChange);

//---------------- PASSWORD -----------------//

var password_field = $("#password");
var passwordCheck = $("#passwordCheck");

function passwordChange(str) {
    if (str.length > 5 && str.length < 100) {
      passwordCheck.html(my_messages['OK']);
    } else {
      passwordCheck.html(register_messages['INVALID_PASSWORD']['detail']);
    }
}
monitorChange(password_field,passwordChange);

//---------------- 2ND PASSWORD -----------------//

var sndpassword_field = $("#2ndpassword");
var sndpasswordCheck = $("#2ndpasswordCheck");

function sndpasswordChange(str) {
    if (password_field == sndpassword_field) {
      sndpasswordCheck.html(my_messages['OK']);
    } else {
      sndpasswordCheck.html(my_messages['PASSWORD_DO_NOT_MATCH']);
    }
}
monitorChange(sndpassword_field,sndpasswordChange);


});
});
    