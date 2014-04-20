'use strict';
var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var _ = require('lodash');
var helpers = module.exports;

helpers.directory = function directory(dir) {
  return function directory(done) {
    process.chdir(__dirname);
    rimraf(dir, function (err) {
      if (err) {
        return done(err);
      }
      mkdirp(dir, function (err) {
        if (err) {
          return done(err);
        }
        process.chdir(dir);
        done();
      });
    });
  };
};

helpers.blocks = function() {
  return [
      {
        type: 'js',
        dest: 'scripts/site.js',
        searchPath: [],
        indent: '    ',
        src: [
          'foo.js',
          'bar.js',
          'baz.js'
        ],
        raw: [
          '    <!-- build:js scripts/site.js -->',
          '    <script src="foo.js"></script>',
          '    <script src="bar.js"></script>',
          '    <script src="baz.js"></script>',
          '    <!-- endbuild -->'
        ]
      }
    ];
};

helpers.cssBlock = function() {
  return {
    type: 'css',
    dest: '/styles/main.min.js',
    searchPath: [],
    indent: '    ',
    src: [
      'foo.js',
      'bar.js',
      'baz.js'
    ],
    raw: [
      '    <!-- build:css sstyles/main.min.css -->',
      '    <link rel="stylesheet" href="styles/main.css">',
      '    <!-- endbuild -->'
    ]
  };
};

helpers.createFile = function(name, dir, blocks) {
  return {
    name: name,
    blocks: blocks,
    dir: dir,
    searchPath: [dir]
  };
};

helpers.file = {
  mkdir: function(path, mode) { fs.mkdirSync(path,mode);},
  write: function(path, content) {
    return fs.writeFileSync(path, content);
  },
  copy: function(srcFile, destFile, encoding) {
    var content = fs.readFileSync(srcFile, encoding);
    fs.writeFileSync(destFile, content, encoding);
  }
};

helpers.makeFinder = function(mapping) {
    return {
      find: function (s,b) {
        var output;
        if (_.isString(b)) {
          b = [b];
        }
        var dir = _.find(b, function(d) {return mapping[path.join(d,s).replace(/\\/g, '/')]; });
        var file = typeof dir !== 'undefined' ? mapping[path.join(dir,s).replace(/\\/g, '/')] : s;

        if (_.isArray(file)) {
          output = file[0];
        } else {
          output = file;
        }
        return output;
      }
    };
  };

helpers.normalize = function (object) {
  // turns {'foo/bar': ['app/bar.js', 'app/baz.js']}
  // into {'foo\\bar': ['app\\bar.js', 'app\\baz.js']} on Windows

  if (process.platform !== 'win32') {
    return object;
  }

  if (object) {
    if (_.isString(object)) {
      object = path.normalize(object);
    } else if (_.isArray(object)) {
      for (var i = 0; i < object.length; i++) {
        object[i] = helpers.normalize(object[i]);
      }
    } else {
      for (var prop in object) {
        if (object.hasOwnProperty(prop)) {
          if (prop.indexOf('/') !== -1) {
            object[path.normalize(prop)] = helpers.normalize(object[prop]);
            delete object[prop];
          }
          else {
            object[prop] = helpers.normalize(object[prop]);
          }
        }
      }
    }
  }

  return object;
};
