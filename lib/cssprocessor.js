'use strict';
var path = require('path');

//
// CSSProcessor takes care, and processes CSS files.
// It is given:
//   - the filepath of the file to consider
//   - the content of the file to consider
//   - a file replacement locator
//   - an optional log callback that will be called as soon as there's something to log
//
var CSSProcessor = module.exports = function (filepath, content, revvedfinder, logcb) {
  this.content = content;
  this.filepath = filepath;
  this.linefeed = /\r\n/g.test(content) ? '\r\n' : '\n';
  this.revvedfinder = revvedfinder;
  this.logcb = logcb || function () {};
};

//
// Calls the log callback function
//
CSSProcessor.prototype.log = function log(msg) {
  this.logcb(msg);
};

// Process the CSS file, which is:
//  - replace image references by their revved version
//
CSSProcessor.prototype.process = function process() {
    var self = this;
    // Replace reference to images with the actual name of the optimized image
    this.log('Update the CSS with new img filenames');
    return this.content.replace(/url\(\s*['"]?([^'"\)]+)['"]?\s*\)/gm, function (match, src) {
      // Consider reference from site root
      var file = self.revvedfinder.find(src, path.dirname(self.filepath));
      var res = match.replace(src, file);

      if (src !== file) {
        self.log(match + ' changed to ' + res);
      }
      return res;
    });
  };
