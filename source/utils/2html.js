exports.toTable = function toTable(headers, jsonTable) {
  var result = '<table border="1">\n<tr>';
  Object.keys(headers).forEach(function (key) {
    result += '<th>' + headers[key] + '</th>';
  });
  result += '</tr>\n';


  Object.keys(jsonTable).forEach(function (keyline) {
    var line = jsonTable[keyline];
    result += '<tr>';
    Object.keys(headers).forEach(function (key) {
      var value = '';
      if (line[key]) {
        if (typeof a_string === line[key]) {
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