'use strict';
var util = require('util');

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
// initializes for you the corresponding Grunt config for the concat / min tasks
// when `type=js`, the concat / css tasks when `type=css`.
//
// The task also handles use of RequireJS, for the scenario where you specify
// the main entry point for your application using the "data-main" attribute
// as follows:
//
//     <!-- build:js js/app.min.js -->
//     <script data-main="js/main" src="js/vendor/require.js"></script>
//     <!-- -->
//
// One doesn't need to specify a concat/min/css or requirejs configuration anymore.
//
// Inspired by previous work in https://gist.github.com/3024891
// For related sample, see: cli/test/tasks/usemin-handler/index.html
//

module.exports = function (grunt) {
  var HTMLProcessor = require('../lib/htmlprocessor');
  var CSSProcessor = require('../lib/cssprocessor');
  var RevvedFinder = require('../lib/revvedfinder');

  grunt.registerMultiTask('usemin', 'Replaces references to non-minified scripts / stylesheets', function () {
    var processors = {
      css: CSSProcessor,
      html: HTMLProcessor
    };
    var name = this.target;
    var data = this.data;
    var files = grunt.file.expand(data);

    files.map(grunt.file.read).forEach(function (content, i) {
      var filepath = files[i];

      grunt.log.subhead('usemin:' + name + ' - ' + filepath);

      // make sure to convert back into utf8, `file.read` when used as a
      // forEach handler will take additional arguments, and thus trigger the
      // raw buffer read
      content = content.toString();

      // Our revved version locator
      var revvedfinder = new RevvedFinder(grunt.file.expand);

      // ext-specific directives handling and replacement of blocks
      var proc = new processors[name](filepath, content, revvedfinder, function (msg) {
        grunt.log.writeln(msg);
      });

      content = proc.process();
      // write the new content to disk
      grunt.file.write(filepath, content);
    });
  });

  grunt.registerMultiTask('useminPrepare', 'Using HTML markup as the primary source of information', function () {
    // collect files
    var files = grunt.file.expandFiles(this.data);

    // concat / min / css / requirejs config
    var concat = grunt.config('concat') || {};
    var min = grunt.config('min') || {};
    var css = grunt.config('css') || {};
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
      var revvedfinder = new RevvedFinder(grunt.file.expand);
      var proc = new HTMLProcessor(file.path, file.body, revvedfinder, function (msg) {
        grunt.log.writeln(msg);
      });

      proc.blocks.forEach(function (block) {
        grunt.log.subhead('Found a block:')
          .writeln(grunt.log.wordlist(block.raw, { separator: '\n' }))
          .writeln('Updating config with the following assets:')
          .writeln('    - ' + grunt.log.wordlist(block.src, { separator: '\n    - ' }));

        // update concat config for this block
        concat[block.dest] = block.src;
        grunt.config('concat', concat);

        // update requirejs config as well, as during path lookup we might have
        // updated it on data-main attribute
        if (block.requirejs) {
          requirejs.out = requirejs.out || block.requirejs.dest;
          requirejs.name = requirejs.name || block.requirejs.name;
          grunt.config('requirejs', requirejs);
        }

        // min config, only for js type block
        if (block.type === 'js') {
          min[block.dest] = block.dest;
          grunt.config('min', min);
        }

        // css config, only for css type block
        if (block.type === 'css') {
          css[block.dest] = block.dest;
          grunt.config('css', css);
        }
      });
    });

    // log a bit what was added to config
    grunt.log.subhead('Configuration is now:')
      .subhead('  css:')
      .writeln('  ' + inspect(css))
      .subhead('  concat:')
      .writeln('  ' + inspect(concat))
      .subhead('  min:')
      .writeln('  ' + inspect(min))
      .subhead('  requirejs:')
      .writeln('  ' + inspect(requirejs));
  });
};
