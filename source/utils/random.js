exports.string = function (stringLength) {
	var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';
	var randomstring = '';
	for (var i=0; i<stringLength; i++) 
		randomstring += chars.charAt(Math.floor(Math.random() * chars.length));
	return randomstring;
}