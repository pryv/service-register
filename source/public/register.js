function proceedRegistration() {
  var ok = checks.userName && checks.email && checks.password && checks.sndpassword;
  if (ok) {
    console.log("procceed");
  } else {
    alert(my_messages['COMPLETE_ALL_FIELDS'])
  }
}

var checks = { userName: false, email: false, password: false, sndpassword: false };


$(function()
{
$(window).bind('load', function()
{

// TODO check errors when network is not available
// TODO trim() strings



// GENERIC FOR FIELDS MONITORING

function monitorKeyUp(field,fireChangeAfter) {
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

function monitorChange(field,callback,fireChangeAfter) { 
  var last_fieldValue = "";
  field.change(function() {
    console.log(field.selector+" "+last_fieldValue);
    if (last_fieldValue == field.val()) return;
    last_fieldValue = field.val();
    callback(last_fieldValue);
  });
  console.log("Monitoring change of: "+field.selector);
  monitorKeyUp(field,fireChangeAfter);
}

// ------------ continue button

var notReady = $("#notReady");
var allCheks = $("#allCheks");

function checkAll() {
  var ok = checks.userName && checks.email && checks.password && checks.sndpassword;
  if (! ok) {
    notReady.show();
    allCheks.hide();
  } else {
    notReady.hide();
    allCheks.show();
  }
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
    checks.userName = false;
    
    $.getJSON(register_config['REGISTER_URL']+"/"+value+"/check/",
      function(data){
        if (data != null && data.exists != undefined) {
          checks.userName = ! data.exists;
          userCheck.html((data.exists) ? my_messages['USERNAME_NOT_AVAILABLE'] 
                                       : my_messages['USERNAME_AVAILABLE']);
        } else {
          userCheck.html(register_messages['INTERNAL_ERROR']['detail']);
        }
        checkAll();
     });
}

monitorChange(userName_field,userNameChange,1000);
//---------------- EMAIL -----------------//

var email_field = $("#email");
var emailCheck = $("#emailCheck");
var email_regexp = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

function emailChange(value) {
    checks.email = false;
    if (! email_regexp.test(value)) {
      emailCheck.html(register_messages['INVALID_EMAIL']['detail']);
    } else {
      checks.email = true;
      emailCheck.html(my_messages['OK']);
    }
    checkAll();
}
monitorChange(email_field,emailChange,3000);

//---------------- PASSWORD -----------------//

var password_field = $("#password");
var passwordCheck = $("#passwordCheck");


//---------------- 2ND PASSWORD -----------------//

var sndpassword_field = $("#2ndpassword");
var sndpasswordCheck = $("#2ndpasswordCheck");

function passwordChange(str) {
    checks.password = false;
    if (str.length > 5 && str.length < 100) {
      checks.password = true;
      passwordCheck.html(my_messages['OK']);
    } else {
      passwordCheck.html(register_messages['INVALID_PASSWORD']['detail']);
    }
    if (sndpassword_field.val().length > 5) {
        sndpasswordChange(sndpassword_field.val());
    }
    checkAll();
}
monitorChange(password_field,passwordChange,3000);

function sndpasswordChange(str) {
    checks.sndpassword = false;
    if (str.length < 5 || str.length > 100) {
      sndpasswordCheck.html();
    } else if (password_field.val() == str) {
      sndpasswordCheck.html(my_messages['OK']);
      checks.sndpassword = true;
    } else {
      sndpasswordCheck.html(my_messages['PASSWORD_DO_NOT_MATCH']);
    }
    checkAll();
}
monitorChange(sndpassword_field,sndpasswordChange,1000);


});
});
    