/**
 * @license
 * Copyright (C) 2020 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
//maybe there is a module arround that can clear up this file

try {
  Object.defineProperties(String.prototype, {
    rainbow: {
      get: function () {
        var rainbowcolors = ['red', 'yellow', 'green', 'blue', 'magenta']; //RoY G BiV
        var exploded = this.split('');
        var i = 0;
        exploded = exploded.map(function (letter) {
          if (letter === ' ') {
            return letter;
          }

          return letter[rainbowcolors[i++ % rainbowcolors.length]];
        });
        return exploded.join('');
      },
      enumerable: false,
      configurable: false
    },
    stripColors: {
      get: function () {
        return ('' + this).replace(/\u001b\[\d+m/g, '');
      },
      enumerable: false,
      configurable: false
    },
    //styles
    bold: {
      get: function () {
        return ['\x1B[1m', this, '\x1B[22m'].join('');
      },
      enumerable: false,
      configurable: false
    },
    italic: {
      get: function () {
        return ['\x1B[3m', this, '\x1B[23m'].join('');
      },
      enumerable: false,
      configurable: false
    },
    underline: {
      get: function () {
        return ['\x1B[4m', this, '\x1B[24m'].join('');
      },
      enumerable: false,
      configurable: false
    },
    inverse: {
      get: function () {
        return ['\x1B[7m', this, '\x1B[27m'].join('');
      },
      enumerable: false,
      configurable: false
    },
    //grayscale
    white: {
      get: function () {
        return ['\x1B[37m', this, '\x1B[39m'].join('');
      },
      enumerable: false,
      configurable: false
    },
    grey: {
      get: function () {
        return ['\x1B[90m', this, '\x1B[39m'].join('');
      },
      enumerable: false,
      configurable: false
    },
    black: {
      get: function () {
        return ['\x1B[30m', this, '\x1B[39m'].join('');
      },
      enumerable: false,
      configurable: false
    },
    //colors
    blue: {
      get: function () {
        return ['\x1B[34m', this, '\x1B[39m'].join('');
      },
      enumerable: false,
      configurable: false
    },
    cyan: {
      get: function () {
        return ['\x1B[36m', this, '\x1B[39m'].join('');
      },
      enumerable: false,
      configurable: false
    },
    green: {
      get: function () {
        return ['\x1B[32m', this, '\x1B[39m'].join('');
      },
      enumerable: false,
      configurable: false
    },
    magenta: {
      get: function () {
        return ['\x1B[35m', this, '\x1B[39m'].join('');
      },
      enumerable: false,
      configurable: false
    },
    red: {
      get: function () {
        return ['\x1B[31m', this, '\x1B[39m'].join('');
      },
      enumerable: false,
      configurable: false
    },
    yellow: {
      get: function () {
        return ['\x1B[33m', this, '\x1B[39m'].join('');
      },
      enumerable: false,
      configurable: false
    }
  });
} catch (e) {
  // IGNORE ALL ERRORS
}
