'use strict';
var path = require('path');

// Allow to find, on disk, the revved version of a furnished file, bellow a given
// directory
//
// +expandfn+ : a function that will return a list of file matching a given pattern (for example grunt.file.expand)
// +dirs+: restrict the search to these subdirectories
//
var RevvedFinder = module.exports = function (expandfn, dirs) {
    this.expandfn = expandfn;
    this.dirs = dirs;

    if (!dirs || dirs.length === 0) {
      this.dirsString = '';
    } else if (dirs.length === 1) {
      this.dirsString = dirs[0] + '/';
    } else {
      this.dirsString = '{' + dirs.join(',') + '}/';
    }
  };

//
// Find revved version of file, relatively to the furnished +basedir+
// Find a revved version of +ofile+ (i.e. a file which name is ending with +ofile+), relatively
// to the furnished +basedir+.
// Let's imagine you have the following directory structure:
//  + build
//  |  |
//  |  +- css
//  |      |
//  |      + style.css
//  + images
//     |
//     + 2123.pic.png
//
// and that somehow style.css is referencing '../../images/pic.png'
// When called like that:
//   revvedFinder.find('../../images/pic.png', 'build/css');
// the function must return
// '../../images/2123.pic.png'
//
RevvedFinder.prototype.find = function find(ofile, basedir) {
    var file = ofile;
    var startAtRoot = false;
    var regexpQuote = function (str) {
      return (str + '').replace(/([.?*+\^$\[\]\\(){}|\-])/g, '\\$1');
    };

    //do not touch external files or the root
    if (ofile.match(/\/\//) || ofile.match(/^\/$/)) {
      return ofile;
    }

    // Consider reference from site root
    if (ofile.match(/^\//)) {
      file = ofile.substr(1);
      startAtRoot = true;
      basedir = '.';
    }

    // Our filename
    var basename = path.basename(file);
    var safeBasename = regexpQuote(basename);
    // The path (possibly relative) to the file we're the revved looking for
    var dirname = path.dirname(file);
    // Normalized path from cwd to the file directory
    var normalizedDirname = path.normalize([basedir, dirname].join('/'));

    // Basically: starting at the current cwd we're looking for all the
    // files that are ending with the filename we've been asked to looked a revved version for
    // Once we found a couple of these files, we're filtering them out to be sure their path
    // is matching the path of the original file (to avoid clashes when there's a images/2123.test.png and
    // a images/misc/4567.test.png for example)
    var filepaths = this.expandfn(this.dirsString + '**/*' + basename);
    var re = new RegExp('[0-9a-fA-F]+\\.' + safeBasename + '$');
    var filepath = filepaths.filter(function (f) {
        var candidateDirname = path.normalize(path.dirname(f)),
          endsWith = function (suffix) {
            return this.indexOf(suffix, this.length - suffix.length) !== -1;
          };
        return f.match(re) && endsWith.call(candidateDirname, normalizedDirname);
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
