"use strict";
var path = require('path');

// Create a new CSS Processor for the file at filepath with content content
//
var CSSProcessor = module.exports = function(filepath, content, revvedfinder) {
  this.content = content;
  this.filepath = filepath;
  this.linefeed = /\r\n/g.test(content) ? '\r\n' : '\n';
  this.revvedfinder = revvedfinder;
};

CSSProcessor.prototype.process = function process() {
    var self = this;
    // Replace reference to images with the actual name of the optimized image
    return this.content.replace( /url\(\s*['"]?([^'"\)]+)['"]?\s*\)/gm, function(match, src) {
        // Consider reference from site root
        var file = self.revvedfinder.find(src, path.dirname(self.filepath));
        return match.replace(src,file);
    });
};
