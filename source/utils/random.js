exports.string = function (string_length) {
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var randomstring = '';
	for (var i=0; i<string_length; i++) 
		randomstring += chars.charAt(Math.floor(Math.random() * chars.length));
	return randomstring;
}