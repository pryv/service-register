// maybe there is a module arround that can clear up this file

Array.prototype.rotate = (function() {
    var unshift = Array.prototype.unshift,
        splice = Array.prototype.splice;

    return function(count) {
        var len = this.length >>> 0,
            count = count >> 0;

        unshift.apply(this, splice.call(this, count % len, len));
        return this;
    };
})();

Object.prototype.toArray = function(all){
	var tab=[];
	all = Boolean(all);
	for(var i in this )
		if(!isNaN(i) || all )
			tab.push(this[i]);
	return tab;
}

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
	var milliSeconde = this.getMilliseconds();
	var reg = new RegExp('(d|m|Y|H|i|s)', 'g');
	var replacement = new Array();
	replacement['d'] = day < 10 ? '0' + day : day;
	replacement['m'] = month < 10 ? '0' + month : month;
	replacement['Y'] = fullYear;
	replacement['Y'] = fullYear;
	replacement['H'] = hour < 10 ? '0' + hour : hour;
	replacement['i'] = minute < 10 ? '0' + minute : minute;
	replacement['s'] = seconde < 10 ? '0' + seconde : seconde;
	return format.replace(reg, function($0) {
		return ($0 in replacement) ? replacement[$0] : $0.slice(1,
				$0.length - 1);
	});
};


 /*Extend Some DataStructure*/
    Buffer.prototype.toArray = function(){
		for(var ret=[];ret.length<this.length;ret.push(this[ret.length]));
		return ret;
	};
	
	/*String.prototype.trim = function(c) {
		c = (c || "\s");
		return this.replace(new RegExp("^["+c+"]+|["+c+"]+$", "g"),"");
	};*/

	//trimming space from left side of the string
	String.prototype.ltrim = function(c) {
		
		return this.trimLeft.apply(this,arguments);
	}
	 
	//trimming space from right side of the string
	String.prototype.rtrim = function(c) {
		return this.trimRight.apply(this,arguments);
	}

	String.prototype.pad = function(pad_length, pad_string, pad_type) {
		// http://kevin.vanzonneveld.net
		// +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
		// + namespaced by: Michael White (http://getsprink.com)
		// +      input by: Marco van Oort
		// +   bugfixed by: Brett Zamir (http://brett-zamir.me)
		// *     example 1: str_pad('Kevin van Zonneveld', 30, '-=', 'STR_PAD_LEFT');
		// *     returns 1: '-=-=-=-=-=-Kevin van Zonneveld'
		// *     example 2: str_pad('Kevin van Zonneveld', 30, '-', 'STR_PAD_BOTH');
		// *     returns 2: '------Kevin van Zonneveld-----'
		var input = this;
		var half = '',
			pad_to_go;

		var str_pad_repeater = function (s, len) {
			var collect = '',
			    i;

			while (collect.length < len) {
			    collect += s;
			}
			collect = collect.substr(0, len);

			return collect;
		};

		input += '';
		pad_string = pad_string || ' ';

		if (pad_type != 'STR_PAD_LEFT' && pad_type != 'STR_PAD_RIGHT' && pad_type != 'STR_PAD_BOTH') {
			pad_type = 'STR_PAD_RIGHT';
		}
		if ((pad_to_go = pad_length - input.length) > 0) {
			if (pad_type == 'STR_PAD_LEFT') {
			    input = str_pad_repeater(pad_string, pad_to_go) + input;
			} else if (pad_type == 'STR_PAD_RIGHT') {
			    input = input + str_pad_repeater(pad_string, pad_to_go);
			} else if (pad_type == 'STR_PAD_BOTH') {
			    half = str_pad_repeater(pad_string, Math.ceil(pad_to_go / 2));
			    input = half + input + half;
			    input = input.substr(0, pad_length);
			}
		}

		return input;
	}

	String.prototype.lpad = function(pad_length, pad_string){
		return this.pad.call(this,pad_length, pad_string,'STR_PAD_LEFT');
	}
	String.prototype.rpad = function(pad_length, pad_string){
		return this.pad.call(this,pad_length, pad_string,'STR_PAD_RIGHT');
	}
	String.prototype.padLeft = function(){
		return this.lpad.apply(this,arguments);
	}
	String.prototype.padRight = function(){
		return this.rpad.apply(this,arguments);
	}
	
	String.prototype.charsCode = function(){
		for(var i=[],j=0; i.length<this.length;i.push(this.charCodeAt(j++)));
		return i;
	};
	
	
try{
Object.defineProperties(Object.prototype, {
	apply : {
		value: function(config, defaults) {
			if (defaults) {
				this.apply(defaults);
			};
			if (config && typeof config === 'object') {
				var i;
				for (i in config) {
				    this[i] = config[i];
				}
			};    
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
				if (!this.hasOwnProperty(property)) {
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
		  var exploded = this.split("");
		  var i=0;
		  exploded = exploded.map(function(letter) {
			if (letter==" ") {
			  return letter;
			}
			else {
			  return letter[rainbowcolors[i++ % rainbowcolors.length]];
			}
		  });
		  return exploded.join("");
	},
	enumerable: false,
	configurable: false
  },
  'stripColors'      : {
	get: function() {
		return ("" + this).replace(/\u001b\[\d+m/g,'');
	},
	enumerable: false,
	configurable: false
  },
    //styles
  'bold'      : {
	get: function() {
		return ['\033[1m',this, '\033[22m'].join("");
	},
	enumerable: false,
	configurable: false
  },
  'italic'    : {
	get: function() {
		return ['\033[3m',this, '\033[23m'].join("");
	},
	enumerable: false,
	configurable: false
  },
  'underline' : {
	get: function() {
		return ['\033[4m',this, '\033[24m'].join("");
	},
	enumerable: false,
	configurable: false
  },
  'inverse'   : {
	get: function() {
		return ['\033[7m',this, '\033[27m'].join("");
	},
	enumerable: false,
	configurable: false
  },
  //grayscale
  'white'     : {
	get: function() {
		return ['\033[37m',this, '\033[39m'].join("");
	},
	enumerable: false,
	configurable: false
  },
  'grey'      : {
	get: function() {
		return ['\033[90m',this, '\033[39m'].join("");
	},
	enumerable: false,
	configurable: false
  },
  'black'     : {
	get: function() {
		return ['\033[30m',this, '\033[39m'].join("");
	},
	enumerable: false,
	configurable: false
  },
  //colors
  'blue'      : {
	get: function() {
		return ['\033[34m',this, '\033[39m'].join("");
	},
	enumerable: false,
	configurable: false
  },
  'cyan'      : {
	get: function() {
		return ['\033[36m',this, '\033[39m'].join("");
	},
	enumerable: false,
	configurable: false
  },
  'green'     : {
	get: function() {
		return ['\033[32m',this, '\033[39m'].join("");
	},
	enumerable: false,
	configurable: false
  },
  'magenta'   : {
	get: function() {
		return ['\033[35m',this, '\033[39m'].join("");
	},
	enumerable: false,
	configurable: false
  },
  'red'       : {
	get: function() {
		return ['\033[31m',this, '\033[39m'].join("");
	},
	enumerable: false,
	configurable: false
  },
  'yellow'    : {
	get: function() {
		return ['\033[33m',this, '\033[39m'].join("");
	},
	enumerable: false,
	configurable: false
  }
});
}catch(e){};
