'use strict';
var util = require('util');
var path = require('path');

var inspect = function (obj) {
  return util.inspect(obj, false, 4, true);
};

//
// ### Usemin

// Replaces references to non-optimized scripts or stylesheets
// into a set of HTML files (or any templates/views).
//
// The users markup should be considered the primary source of information
// for paths, references to assets which should be optimized.We also check
// against files present in the relevant directory () (e.g checking against
// the revved filename into the 'temp/') directory to find the SHA
// that was generated.
//
// Todos:
// * Use a file dictionary during build process and rev task to
// store each optimized assets and their associated sha1.
//
// #### Usemin-handler
//
// A special task which uses the build block HTML comments in markup to
// get back the list of files to handle, and initialize the grunt configuration
// appropriately, and automatically.
//
// Custom HTML "block" comments are provided as an API for interacting with the
// build script. These comments adhere to the following pattern:
//
//     <!-- build:<type> <path> -->
//       ... HTML Markup, list of script / link tags.
//     <!-- endbuild -->
//
// - type: is either js or css.
// - path: is the file path of the optimized file, the target output.
//
// An example of this in completed form can be seen below:
//
//    <!-- build:js js/app.js -->
//      <script src="js/app.js"></script>
//      <script src="js/controllers/thing-controller.js"></script>
//      <script src="js/models/thing-model.js"></script>
//      <script src="js/views/thing-view.js"></script>
//    <!-- endbuild -->
//
//
// Internally, the task parses your HTML markup to find each of these blocks, and
// initializes for you the corresponding Grunt config for the concat / uglify tasks
// when `type=js`, the concat / cssmin tasks when `type=css`.
//
// The task also handles use of RequireJS, for the scenario where you specify
// the main entry point for your application using the "data-main" attribute
// as follows:
//
//     <!-- build:js js/app.min.js -->
//     <script data-main="js/main" src="js/vendor/require.js"></script>
//     <!-- -->
//
// One doesn't need to specify a concat/uglify/cssmin or requirejs configuration anymore.
//
// Inspired by previous work in https://gist.github.com/3024891
// For related sample, see: cli/test/tasks/usemin-handler/index.html
//

module.exports = function (grunt) {
  var HTMLProcessor = require('../lib/htmlprocessor');
  var CSSProcessor = require('../lib/cssprocessor');
  var RevvedFinder = require('../lib/revvedfinder');

  grunt.registerMultiTask('usemin', 'Replaces references to non-minified scripts / stylesheets', function () {
    var options = this.options({
      type: this.target
    });

    var processors = {
      css: CSSProcessor,
      html: HTMLProcessor
    };

    this.files.forEach(function (fileObj) {
      var files = grunt.file.expand({nonull: true}, fileObj.src);

      files.map(grunt.file.read).forEach(function (content, i) {
        var filepath = files[i];
        var filedir = options.basedir || path.dirname(filepath);

        grunt.log.subhead('Processing as ' + options.type.toUpperCase() + ' - ' + filepath);

        // make sure to convert back into utf8, `file.read` when used as a
        // forEach handler will take additional arguments, and thus trigger the
        // raw buffer read
        content = content.toString();

        // Our revved version locator
        var revvedfinder = new RevvedFinder(function (p) { return grunt.file.expand({filter: 'isFile'}, p); }, options.dirs);

        // ext-specific directives handling and replacement of blocks
        var proc = new processors[options.type](filedir, '', content, revvedfinder, function (msg) {
          grunt.log.writeln(msg);
        });

        content = proc.process();
        // write the new content to disk
        grunt.file.write(filepath, content);
      });
    });
  });

  grunt.registerMultiTask('useminPrepare', 'Using HTML markup as the primary source of information', function () {
    var options = this.options();
    // collect files
    var files = grunt.file.expand({filter: 'isFile'}, this.data);
    var uglifyName = options.uglify || 'uglify';
    var cssminName = options.cssmin || 'cssmin';
    var dest = options.dest;

    // concat / uglify / cssmin / requirejs config
    var concat = grunt.config('concat') || {};
    var uglify = grunt.config(uglifyName) || {};
    var cssmin = grunt.config(cssminName) || {};
    var requirejs = grunt.config('requirejs') || {};

    grunt.log
      .writeln('Going through ' + grunt.log.wordlist(files) + ' to update the config')
      .writeln('Looking for build script HTML comment blocks');

    files = files.map(function (filepath) {
      return {
        path: filepath,
        body: grunt.file.read(filepath)
      };
    });

    files.forEach(function (file) {
      var revvedfinder = new RevvedFinder(function (p) { return grunt.file.expand({filter: 'isFile'}, p); });
      var proc = new HTMLProcessor(path.dirname(file.path), dest, file.body, revvedfinder, function (msg) {
        grunt.log.writeln(msg);
      });

      proc.blocks.forEach(function (block) {
        grunt.log.subhead('Found a block:')
          .writeln(grunt.log.wordlist(block.raw, { separator: '\n' }))
          .writeln('Updating config with the following assets:')
          .writeln('    - ' + grunt.log.wordlist(block.src, { separator: '\n    - ' }));

        // update concat config for this block
        if (block.dest.match(/^_/)) {
          // grunt does not allow tasks with _, so convert to complex method
          concat[block.dest.replace('_', '')] = {
            src: block.src,
            dest: block.dest
          };
        } else {
          concat[block.dest] = block.src;
        }
        grunt.config('concat', concat);

        // update requirejs config as well, as during path lookup we might have
        // updated it on data-main attribute

        if (block.requirejs) {

          var hasTasks;
          for (var i in requirejs) {
            if (requirejs.hasOwnProperty(i)) {
              hasTasks = true;
              var task = requirejs[i];
              var options = task.options;
              if (options) {
                options.name = options.name || block.requirejs.name;
                options.out = options.out || block.requirejs.dest;
                options.baseUrl = options.baseUrl || block.requirejs.baseUrl;
                options.mainConfigFile = options.mainConfigFile || path.join(options.baseUrl, options.name) + '.js';
              } else {
                task.options = {
                  name: block.requirejs.name,
                  out: block.requirejs.dest,
                  baseUrl: block.requirejs.baseUrl,
                  mainConfigFile: block.requirejs.mainConfigFile || path.join(block.requirejs.baseUrl, block.requirejs.name) + '.js'
                };
              }
            }
          }
          if (!hasTasks) {
            requirejs.default = {
              options: {
                name: block.requirejs.name,
                out: block.requirejs.dest,
                baseUrl: block.requirejs.baseUrl
              }
            };
          }
          grunt.config('requirejs', requirejs);
        }

        // uglify config, only for js type block
        if (block.type === 'js') {
          // TODO: we should differentiate whether or not we're
          // using concat before ... Option ?
          uglify[block.dest] = block.dest;

          if (block.requirejs) {
            uglify[block.requirejs.srcDest] = block.requirejs.src;
          }
          grunt.config(uglifyName, uglify);
        }

        // cssmin config, only for cssmin type block
        if (block.type === 'css') {
          cssmin[block.dest] = block.dest;
          grunt.config(cssminName, cssmin);
        }
      });
    });

    // log a bit what was added to config
    grunt.log.subhead('Configuration is now:')
      .subhead('  cssmin:')
      .writeln('  ' + inspect(cssmin))
      .subhead('  concat:')
      .writeln('  ' + inspect(concat))
      .subhead('  uglify:')
      .writeln('  ' + inspect(uglify))
      .subhead('  requirejs:')
      .writeln('  ' + inspect(requirejs));
  });
};
