exports.hexdump = function hexdump (buf, length, start, count)
{
  if (!Buffer.isBuffer (buf))
    throw new Error ('argument must be buffer');
  start = (arguments.length > 2) ? arguments[2] : 0;
  count = (arguments.length > 3) ? arguments[3] : 16;
  util.print (0);
  util.print ('\t');

  for (var i = start; i < length; i++) {
    util.print (hexvalue[buf[i]]);
    util.print (' ');
    if ((i + 1) % (count / 2)) continue;
    util.print (' ');
    if ((i + 1) % (count)) continue;
    util.print ('\n');
    util.print (i + 1);
    util.print ('\t');
  }
  util.print ('\n');
}

exports.bin2hex = function bin2hex (s) {
    // Converts the binary representation of data to hex  
    // 
    // version: 1109.2015
    // discuss at: http://phpjs.org/functions/bin2hex
    // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Onno Marsman
    // +   bugfixed by: Linuxworld
    // *     example 1: bin2hex('Kev');
    // *     returns 1: '4b6576'
    // *     example 2: bin2hex(String.fromCharCode(0x00));
    // *     returns 2: '00'
    var i, f = 0,
        a = [];
 
    s += '';
    f = s.length;
 
    for (i = 0; i < f; i++) {
        a[i] = s.charCodeAt(i).toString(16).replace(/^([\da-f])$/, "0$1");
    }
 
    return a.join('');
}