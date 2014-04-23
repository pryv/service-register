exports.toTable = function toTable(headers, infoArray) {
  var result = '<table border="1">\n<tr>';
  Object.keys(headers).forEach(function (key) {
    result += '<th>' + headers[key] + '</th>';
  });
  result += '</tr>\n';


  infoArray.forEach(function (line) {
    result += '<tr>';
    Object.keys(headers).forEach(function (key) {
      var value = '';
      if (line[key]) {
        if (typeof line[key] === 'string') {
          value = line[key];
        } else {
          value = JSON.stringify(line[key]);
        }
      }
      result += '<td>' + value + '</td>';
    });

    result += '</tr>\n';
  });

  result += '</table>';
  return result;
};