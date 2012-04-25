function proceedRegistration() {
  var ok = register_checks.userName && register_checks.email && register_checks.password && register_checks.sndpassword;
  if (! ok) {
    alert(my_messages['COMPLETE_ALL_FIELDS']);
    return false;
  }
  
  //register_checks.userName = "bob";
  var data = {
    userName: register_checks.userName,
    password: register_checks.password,
    email: register_checks.email,
    languageCode: my_messages['LANGUAGE_CODE']};
  
  var url = register_config['REGISTER_URL']+"init";
  
  
  $.post(url, data, function(json, textStatus) {
      alert("yes! "+JSON.stringify(json));
   }, "json").error(function(xhr, textStatus, errorThrown) {
      var res = {id: 'UNKOWN_ERROR', message: xhr.statusText, text: xhr.responseText};
      try { 
        res = JSON.parse(xhr.responseText);
      } catch (e) {}
      alert("error:"+JSON.stringify(res));
   });
  
  // WHY IS THE FOLOOWING NOT WORKING? SME CROSS-DOMAIN concerns I don't get (perki)
  /**
   $.ajax({
    type: "POST",
    url: url,
    async: true,
    crossDomain: true,
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    data: data,
    success: function(json) {
        console.log(json);
    },
    error: function (xhr, textStatus, errorThrown) {
        console.log(xhr.responseText);
    }
  });**/
  return false;
}

var register_checks = { userName: false, email: false, password: false, sndpassword: false };


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
  // call change once if form is pre-filed
  field.change();
}

// ------------ continue button

var notReady = $("#notReady");
var allCheks = $("#allValid");

function checkIfAllValid() {
  var ok = register_checks.userName && register_checks.email && register_checks.password && register_checks.sndpassword;
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
  register_checks.userName = false;
  if (! userName_regexp.test(value)) {
    userCheck.html(register_messages['INVALID_USER_NAME']['detail']);
  } else {
    $.getJSON(register_config['REGISTER_URL']+value+"/check",
        function(data){
      if (data != null && data.exists != undefined) {
        register_checks.userName = data.exists ? false : value;
        userCheck.html((data.exists) ? my_messages['USERNAME_NOT_AVAILABLE'] 
        : my_messages['USERNAME_AVAILABLE']);
      } else {
        userCheck.html(register_messages['INTERNAL_ERROR']['detail']);
      }

    });
  }
  checkIfAllValid();
}

monitorChange(userName_field,userNameChange,1000);
//---------------- EMAIL -----------------//

var email_field = $("#email");
var emailCheck = $("#emailCheck");
var email_regexp = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

function emailChange(value) {
  register_checks.email = false;
  if (! email_regexp.test(value)) {
    emailCheck.html(register_messages['INVALID_EMAIL']['detail']);
  } else {
    $.getJSON(register_config['REGISTER_URL']+value+"/check_email",
        function(data){
      if (data != null && data.exists != undefined) {
        register_checks.email = data.exists ? false : value;
        emailCheck.html((data.exists) ? my_messages['EMAIL_NOT_AVAILABLE'] 
        : my_messages['OK']);
      } else {
        emailCheck.html(register_messages['INTERNAL_ERROR']['detail']);
      }
    });
  }
  checkIfAllValid();
}
monitorChange(email_field,emailChange,3000);

//---------------- PASSWORD -----------------//

var password_field = $("#password");
var passwordCheck = $("#passwordCheck");


//---------------- 2ND PASSWORD -----------------//

var sndpassword_field = $("#2ndpassword");
var sndpasswordCheck = $("#2ndpasswordCheck");

function passwordChange(str) {
    register_checks.password = false;
    if (str.length > 5 && str.length < 100) {
      register_checks.password = str;
      passwordCheck.html(my_messages['OK']);
    } else {
      passwordCheck.html(register_messages['INVALID_PASSWORD']['detail']);
    }
    if (sndpassword_field.val().length > 5) {
        sndpasswordChange(sndpassword_field.val());
    }
    checkIfAllValid();
}
monitorChange(password_field,passwordChange,3000);

function sndpasswordChange(str) {
    register_checks.sndpassword = false;
    if (str.length < 5 || str.length > 100) {
      sndpasswordCheck.html();
    } else if (password_field.val() == str) {
      sndpasswordCheck.html(my_messages['OK']);
      register_checks.sndpassword = str;
    } else {
      sndpasswordCheck.html(my_messages['PASSWORD_DO_NOT_MATCH']);
    }
    checkIfAllValid();
}
monitorChange(sndpassword_field,sndpasswordChange,1000);



checkIfAllValid();

});
});
    