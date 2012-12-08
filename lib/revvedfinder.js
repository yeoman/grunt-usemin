'use strict';
var path = require('path');

// Allow to find, on disk, the revved version of a furnished file, bellow a given
// directory
//
// +base_dir+  : the base repository which will be the root for our search
// +expandfn+ : a function that will return a list of file matching a given pattern (for example grunt.file.expand)
//
var RevvedFinder = module.exports = function (expandfn) {
    this.expandfn = expandfn;
  };

//
// Find revved version of file, relatively to the furnished +basedir+
//
RevvedFinder.prototype.find = function find(ofile, basedir) {
    var file = ofile;
    var startAtRoot = false;

    //do not touch external files or the root
    if (ofile.match(/\/\//) || ofile.match(/^\/$/)) {
      return ofile;
    }

    // Consider reference from site root
    if (ofile.match(/^\//)) {
      file = ofile.substr(1);
      startAtRoot = true;
    }

    var basename = path.basename(file);
    var dirname = path.dirname(file);
    var normalizedDirname = path.normalize([basedir, dirname].join('/'));

    // XXX files won't change, the filepath should filter the original list
    // of cached files (we need to treat the filename collision -- i.e. 2 files with same names
    // in different subdirectories)
    var filepaths = this.expandfn(path.join('**/*') + basename);
    var filepath = filepaths.filter(function (f) {
        return normalizedDirname === path.dirname(f);
      })[0];

    // not a file in temp, skip it
    if (!filepath) {
      return ofile;
    }

    var filename = path.basename(filepath);
    // handle the relative prefix (with always unix like path even on win32)
    if (dirname !== '.') {
      filename = [dirname, filename].join('/');
    }

    // if file not exists probaly was concatenated into another file so skip it
    if (!filename) {
      return '';
    }

    // Do not forget to start from root if this was the case of the input

    return startAtRoot ? '/' + filename : filename;
  };
