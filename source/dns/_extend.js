/*jshint bitwise: false*/

//maybe there is a module arround that can clear up this file

Array.prototype.rotate = (function() {
  var unshift = Array.prototype.unshift,
  splice = Array.prototype.splice;

  return function(c) {
    var len = this.length >>> 0,
    count = c >> 0;

    unshift.apply(this, splice.call(this, count % len, len));
    return this;
  };
})();

Date.prototype.format = function(format) {
  var fullYear = this.getFullYear();
  if (fullYear < 1000) {
    fullYear = fullYear + 1900;
  }
  var hour = this.getHours();
  var day = this.getDate();
  var month = this.getMonth() + 1;
  var minute = this.getMinutes();
  var seconde = this.getSeconds();
  var reg = new RegExp('(d|m|Y|H|i|s)', 'g');
  var replacement = [];
  replacement.d = day < 10 ? '0' + day : day;
  replacement.m = month < 10 ? '0' + month : month;
  replacement.Y = fullYear;
  replacement.H = hour < 10 ? '0' + hour : hour;
  replacement.i = minute < 10 ? '0' + minute : minute;
  replacement.s = seconde < 10 ? '0' + seconde : seconde;
  return format.replace(reg, function($0) {
    return ($0 in replacement) ? replacement[$0] : $0.slice(1,
        $0.length - 1);
  });
};

try {
  Object.defineProperties(Object.prototype, {
    apply : {
      value: function(config, defaults) {
        if (defaults) {
          this.apply(defaults);
        }
        if (config && typeof config === 'object') {
          var i;
          for (i in config) {
            if(config.hasOwnProperty(i)) {
              this[i] = config[i];
            }
          }
        }
        return this;
      },
      writable: false,
      enumerable: false,
      configurable: false
    },
    applyIf : {
      value: function(config) {
        var property;
        for (property in config) {
          if (config.hasOwnProperty(property) && !this.hasOwnProperty(property)) {
            this[property] = config[property];
          }
        }
        return this;
      },
      writable: false,
      enumerable: false,
      configurable: false
    }
  });

  Object.defineProperties(String.prototype,{
    'rainbow'      : {
      get: function() {
        var rainbowcolors = ['red','yellow','green','blue','magenta']; //RoY G BiV
        var exploded = this.split('');
        var i=0;
        exploded = exploded.map(function(letter) {
          if (letter===' ') {
            return letter;
          }
         
            return letter[rainbowcolors[i++ % rainbowcolors.length]];
          
        });
        return exploded.join('');
      },
      enumerable: false,
      configurable: false
    },
    'stripColors'      : {
      get: function() {
        return ('' + this).replace(/\u001b\[\d+m/g,'');
      },
      enumerable: false,
      configurable: false
    },
    //styles
    'bold'      : {
      get: function() {
        return ['\033[1m',this, '\033[22m'].join('');
      },
      enumerable: false,
      configurable: false
    },
    'italic'    : {
      get: function() {
        return ['\033[3m',this, '\033[23m'].join('');
      },
      enumerable: false,
      configurable: false
    },
    'underline' : {
      get: function() {
        return ['\033[4m',this, '\033[24m'].join('');
      },
      enumerable: false,
      configurable: false
    },
    'inverse'   : {
      get: function() {
        return ['\033[7m',this, '\033[27m'].join('');
      },
      enumerable: false,
      configurable: false
    },
    //grayscale
    'white'     : {
      get: function() {
        return ['\033[37m',this, '\033[39m'].join('');
      },
      enumerable: false,
      configurable: false
    },
    'grey'      : {
      get: function() {
        return ['\033[90m',this, '\033[39m'].join('');
      },
      enumerable: false,
      configurable: false
    },
    'black'     : {
      get: function() {
        return ['\033[30m',this, '\033[39m'].join('');
      },
      enumerable: false,
      configurable: false
    },
    //colors
    'blue'      : {
      get: function() {
        return ['\033[34m',this, '\033[39m'].join('');
      },
      enumerable: false,
      configurable: false
    },
    'cyan'      : {
      get: function() {
        return ['\033[36m',this, '\033[39m'].join('');
      },
      enumerable: false,
      configurable: false
    },
    'green'     : {
      get: function() {
        return ['\033[32m',this, '\033[39m'].join('');
      },
      enumerable: false,
      configurable: false
    },
    'magenta'   : {
      get: function() {
        return ['\033[35m',this, '\033[39m'].join('');
      },
      enumerable: false,
      configurable: false
    },
    'red'       : {
      get: function() {
        return ['\033[31m',this, '\033[39m'].join('');
      },
      enumerable: false,
      configurable: false
    },
    'yellow'    : {
      get: function() {
        return ['\033[33m',this, '\033[39m'].join('');
      },
      enumerable: false,
      configurable: false
    }
  });
} catch(e){}