'use strict';
var fs = require('fs');
var path = require('path');
var assert = require('assert');
var helpers = require('./helpers');
var Flow = require('../lib/flow.js');
var ConfigWriter = require('../lib/configwriter.js');

describe('ConfigWriter', function () {
  before(helpers.directory('temp'));

  describe('constructor', function () {
    it('should check its input');

    it('should allow for user-defined steps per block type', function () {
      var copy = {
        name: 'copy',
        createConfig: function () {
          return {};
        }
      };

      var flow = new Flow({
        steps: {
          js: ['concat', 'uglify', copy]
        },
        post: {}
      });
      var cfgw = new ConfigWriter(flow, {
        input: 'app',
        dest: 'dist',
        staging: '.tmp'
      });
      var stepNames = [];
      cfgw.stepWriters('js').forEach(function (s) {
        stepNames.push(s.name);
      });
      assert.deepEqual(stepNames, ['concat', 'uglify', 'copy']);
    });

    it('should use in and out dirs');
  });

  describe('process', function () {
    beforeEach(helpers.directory('temp'));
    beforeEach(function () {
      helpers.file.mkdir('app');
      helpers.file.write(path.join('app', 'foo.js'), 'var foo=1;');
      helpers.file.write(path.join('app', 'bar.js'), 'var bar=1;');
      helpers.file.write(path.join('app', 'baz.js'), 'var baz=1;');
      helpers.file.write(path.join('app', 'fail.js'), 'var fail=1;');
    });

    var blocks = helpers.blocks();

    it('should check for input parameters');

    it('should output a set of config', function () {
      var flow = new Flow({
        steps: {
          js: ['concat', 'uglify']
        }
      });
      var file = helpers.createFile('foo', 'app', blocks);
      var c = new ConfigWriter(flow, {
        input: 'app',
        dest: 'dist',
        staging: '.tmp'
      });

      var config = c.process(file);
      var expected = helpers.normalize({
        concat: {
          generated: {
            files: [{
              dest: '.tmp/concat/scripts/site.js',
              src: ['app/foo.js', 'app/bar.js', 'app/baz.js']
            }]
          }
        },
        uglify: {
          generated: {
            files: [{
              dest: 'dist/scripts/site.js',
              src: ['.tmp/concat/scripts/site.js']
            }]
          }
        }
      });

      assert.deepEqual(config, expected);
    });

    it('should detect missing sources', function () {
      var flow = new Flow({
        steps: {
          js: ['concat', 'uglify']
        }
      });

      var blocks = helpers.blocks();
      blocks[0].src = ['foo.js'];

      var file = helpers.createFile('foo', 'warn-missing', blocks);
      var c = new ConfigWriter(flow, {
        input: 'warn-missing',
        dest: 'dist',
        staging: '.tmp'
      });

      // mock grunt.fail.warn
      helpers.mockGruntFailWarn(this);

      c.process(file);
      assert.ok(/can't resolve source reference "foo.js"/.test(this.warnMessage));

      this.warnMessage = ''; // clear log output

      // create file
      fs.mkdirSync('warn-missing');
      fs.writeFileSync(path.join('warn-missing', 'foo.js'), 'var a=1;');

      // process file
      c.process(file);

      // warning log should now be silent
      assert.ok(this.warnMessage === '');

      // restore grunt.fail.warn
      helpers.restoreGruntFailWarn();
    });

    it('should search all root paths', function () {
      var flow = new Flow({
        steps: {
          js: ['concat', 'uglify']
        }
      });

      var blocks = helpers.blocks();
      blocks[0].src = ['foo.js', 'bar.js'];

      var file = helpers.createFile('foo', 'app', blocks);

      var c = new ConfigWriter(flow, {
        root: ['dir1', 'dir2'],
        dest: 'dist',
        staging: '.tmp'
      });

      c.process(file);
    });

    it('should have a configurable destination directory', function () {
      var flow = new Flow({
        steps: {
          js: ['concat', 'uglify']
        }
      });

      var file = helpers.createFile('foo', 'app', blocks);
      var c = new ConfigWriter(flow, {
        input: 'app',
        dest: 'destination',
        staging: '.tmp'
      });
      var config = c.process(file);
      var expected = helpers.normalize({
        concat: {
          generated: {
            files: [{
              dest: '.tmp/concat/scripts/site.js',
              src: ['app/foo.js', 'app/bar.js', 'app/baz.js']
            }]
          }
        },
        uglify: {
          generated: {
            files: [{
              dest: 'destination/scripts/site.js',
              src: ['.tmp/concat/scripts/site.js']
            }]
          }
        }
      });

      assert.deepEqual(config, expected);
    });

    it('should have a configurable staging directory', function () {
      var flow = new Flow({
        steps: {
          js: ['concat', 'uglify']
        }
      });

      var file = helpers.createFile('foo', 'app', blocks);
      var c = new ConfigWriter(flow, {
        input: 'app',
        dest: 'dist',
        staging: 'staging'
      });
      var config = c.process(file);
      var expected = helpers.normalize({
        concat: {
          generated: {
            files: [{
              dest: 'staging/concat/scripts/site.js',
              src: ['app/foo.js', 'app/bar.js', 'app/baz.js']
            }]
          }
        },
        uglify: {
          generated: {
            files: [{
              dest: 'dist/scripts/site.js',
              src: ['staging/concat/scripts/site.js']
            }]
          }
        }
      });

      assert.deepEqual(config, expected);
    });

    it('should allow for single step flow', function () {
      var flow = new Flow({
        steps: {
          js: ['uglify']
        }
      });

      var file = helpers.createFile('foo', 'app', blocks);
      var c = new ConfigWriter(flow, {
        input: 'app',
        dest: 'dist',
        staging: 'staging'
      });
      var config = c.process(file);
      var expected = helpers.normalize({
        uglify: {
          generated: {
            files: [{
              dest: 'dist/scripts/site.js',
              src: ['app/foo.js', 'app/bar.js', 'app/baz.js']
            }]
          }
        }
      });
      assert.deepEqual(config, expected);
    });

    it('should allow for a configuration of the flow\'s step order', function () {
      var flow = new Flow({
        steps: {
          js: ['uglify', 'concat']
        }
      });

      var file = helpers.createFile('foo', 'app', blocks);
      var c = new ConfigWriter(flow, {
        input: 'app',
        dest: 'dist',
        staging: 'staging'
      });
      var config = c.process(file);
      var expected = helpers.normalize({
        uglify: {
          generated: {
            files: [{
              dest: 'staging/uglify/foo.js',
              src: ['app/foo.js']
            }, {
              dest: 'staging/uglify/bar.js',
              src: ['app/bar.js']
            }, {
              dest: 'staging/uglify/baz.js',
              src: ['app/baz.js']
            }]
          }
        },
        concat: {
          generated: {
            files: [{
              dest: 'dist/scripts/site.js',
              src: ['staging/uglify/foo.js', 'staging/uglify/bar.js', 'staging/uglify/baz.js']
            }]
          }
        }
      });
      assert.deepEqual(config, expected);
    });

    it('should augment the furnished config', function () {
      var flow = new Flow({
        steps: {
          js: ['concat', 'uglify']
        }
      });
      var config = {
        concat: {
          misc: {
            'foo.js': 'bar.js'
          }
        }
      };
      var file = helpers.createFile('foo', 'app', blocks);
      var c = new ConfigWriter(flow, {
        input: 'app',
        dest: 'destination',
        staging: '.tmp'
      });
      config = c.process(file, config);
      var expected = helpers.normalize({
        concat: {
          generated: {
            files: [{
              dest: '.tmp/concat/scripts/site.js',
              src: ['app/foo.js', 'app/bar.js', 'app/baz.js']
            }]
          },
          misc: {
            'foo.js': 'bar.js'
          }
        },
        uglify: {
          generated: {
            files: [{
              dest: 'destination/scripts/site.js',
              src: ['.tmp/concat/scripts/site.js']
            }]
          }
        }
      });
      assert.deepEqual(config, expected);
    });

    it('should allow for a flow per block type');
    it('should allow for an empty flow');
    it('should allow for a filename as input');

    it('should deduplicate blocks', function () {
      var flow = new Flow({
        steps: {
          js: ['concat', 'uglify']
        }
      });
      var doubleBlocks = [blocks[0], blocks[0]];
      var file = helpers.createFile('foo', 'app', doubleBlocks);
      var c = new ConfigWriter(flow, {
        input: 'app',
        dest: 'dist',
        staging: '.tmp'
      });
      var config = c.process(file);
      var expected = helpers.normalize({
        concat: {
          generated: {
            files: [{
              dest: '.tmp/concat/scripts/site.js',
              src: ['app/foo.js', 'app/bar.js', 'app/baz.js']
            }]
          }
        },
        uglify: {
          generated: {
            files: [{
              dest: 'dist/scripts/site.js',
              src: ['.tmp/concat/scripts/site.js']
            }]
          }
        }
      });

      assert.deepEqual(config, expected);
    });

    it('should deduplicate blocks across files', function () {
      var flow = new Flow({
        steps: {
          js: ['concat', 'uglify']
        }
      });
      var file = helpers.createFile('foo', 'app', blocks);
      var c = new ConfigWriter(flow, {
        input: 'app',
        dest: 'dist',
        staging: '.tmp'
      });
      var firstConfig = c.process(file);
      var repeatConfig = c.process(file);
      var expectedFirst = helpers.normalize({
        concat: {
          generated: {
            files: [{
              dest: '.tmp/concat/scripts/site.js',
              src: ['app/foo.js', 'app/bar.js', 'app/baz.js']
            }]
          }
        },
        uglify: {
          generated: {
            files: [{
              dest: 'dist/scripts/site.js',
              src: ['.tmp/concat/scripts/site.js']
            }]
          }
        }
      });
      var expectedRepeat = helpers.normalize({
        concat: {
          generated: {}
        },
        uglify: {
          generated: {}
        }
      });

      assert.deepEqual(firstConfig, expectedFirst);
      assert.deepEqual(repeatConfig, expectedRepeat);
    });

    it('should throw with conflicting blocks', function () {
      var flow = new Flow({
        steps: {
          js: ['concat', 'uglify']
        }
      });
      var conflictBlock = {
        type: 'js',
        dest: 'scripts/site.js',
        searchPath: [],
        indent: '    ',
        src: [
          'foo.js',
          'bar.js',
          'baz.js',
          'fail.js'
        ],
        raw: [
          '    <!-- build:js scripts/site.js -->',
          '    <script src="foo.js"></script>',
          '    <script src="bar.js"></script>',
          '    <script src="baz.js"></script>',
          '    <script src="fail.js"></script>',
          '    <!-- endbuild -->'
        ]
      };
      var file = helpers.createFile('foo', 'app', [blocks[0], conflictBlock]);
      var c = new ConfigWriter(flow, {
        input: 'app',
        dest: 'dist',
        staging: '.tmp'
      });

      assert.throws(function () {
        c.process(file);
      });
    });

    it('should not add the same block multiple times though we call process() explicitly 2 times.', function () {
      var flow = new Flow({
        steps: {
          js: ['concat', 'uglify']
        }
      });

      var file = helpers.createFile('foo', 'app', blocks);
      var c = new ConfigWriter(flow, {
        input: 'app',
        dest: 'destination',
        staging: '.tmp'
      });

      var config = c.process(file);
      config = c.process(file, config);  // This second process is intentional. Details are in issue #307.

      var expected = helpers.normalize({
        concat: {
          generated: {
            files: [{
              dest: '.tmp/concat/scripts/site.js',
              src: ['app/foo.js', 'app/bar.js', 'app/baz.js']
            }]
          }
        },
        uglify: {
          generated: {
            files: [{
              dest: 'destination/scripts/site.js',
              src: ['.tmp/concat/scripts/site.js']
            }]
          }
        }
      });

      assert.deepEqual(config, expected);
    });
  });

  describe('stepWriters', function () {
    it('should return all writers if called without block type', function () {
      var flow = new Flow({
        steps: {
          js: ['concat', 'uglify'],
          css: ['concat']
        }
      });
      var c = new ConfigWriter(flow, {
        input: 'app',
        dest: 'destination',
        staging: '.tmp'
      });

      var names = [];
      c.stepWriters().forEach(function (i) {
        names.push(i.name);
      });

      assert.deepEqual(names, ['concat', 'uglify']);
    });
  });

  describe('resolveSource hook option', function () {
    beforeEach(helpers.directory('temp'));

    it('should be invoked for each block', function () {
      var flow = new Flow({
        steps: {
          js: ['concat', 'uglify']
        }
      });
      var blocks = helpers.blocks();
      var file = helpers.createFile('foo', 'app', blocks);
      var queue = [];
      function resolveSource() {
        queue.push(Array.prototype.slice.call(arguments));
        return null;
      }
      var c = new ConfigWriter(flow, {
        root: 'app',
        dest: 'dist',
        staging: '.tmp'
      }, {
        resolveSource: resolveSource
      });

      helpers.file.mkdir('app');
      helpers.file.write(path.join('app', 'foo.js'), 'var foo=1;');
      helpers.file.write(path.join('app', 'bar.js'), 'var bar=1;');
      helpers.file.write(path.join('app', 'baz.js'), 'var baz=1;');

      c.process(file);
      assert.deepEqual(queue, [
        ['foo.js', 'app', 'foo', 'scripts/site.js', ['app', 'app']],
        ['bar.js', 'app', 'foo', 'scripts/site.js', ['app', 'app']],
        ['baz.js', 'app', 'foo', 'scripts/site.js', ['app', 'app']],
      ]);
    });

    it('should override normal search when it returns a string', function () {
      var flow = new Flow({
        steps: {
          js: ['concat', 'uglify']
        }
      });

      var blocks = helpers.blocks();
      var file = helpers.createFile('foo', 'app', blocks);

      function resolveSource(sourceUrl) {
        if (sourceUrl === 'foo.js') {
          return path.join('dir2', 'foo2.js');
        }
        return null;
      }
      var c = new ConfigWriter(flow, {
        root: 'app',
        dest: 'dist',
        staging: '.tmp'
      }, {
        resolveSource: resolveSource
      });

      helpers.file.mkdir('app');
      helpers.file.mkdir('dir2');
      helpers.file.write(path.join('app', 'bar.js'), 'var a=1;');
      helpers.file.write(path.join('app', 'baz.js'), 'var a=1;');
      helpers.file.write(path.join('dir2', 'foo2.js'), 'var a=1;');

      c.process(file);
    });

    it('should be prevented from returning non-existent paths', function () {
      var flow = new Flow({
        steps: {
          js: ['concat', 'uglify']
        }
      });

      var blocks = helpers.blocks();
      var file = helpers.createFile('foo', 'app', blocks);

      function resolveSource(sourceUrl) {
        if (sourceUrl === 'foo.js') {
          return path.join('missing', 'foo.js');
        }
        return null;
      }
      var c = new ConfigWriter(flow, {
        root: 'app',
        dest: 'dist',
        staging: '.tmp'
      }, {
        resolveSource: resolveSource
      });

      helpers.file.mkdir('app');
      helpers.file.write(path.join('app', 'bar.js'), 'var a=1;');
      helpers.file.write(path.join('app', 'baz.js'), 'var a=1;');

      // mock grunt.fail.warn
      helpers.mockGruntFailWarn(this);

      c.process(file);
      assert.ok(/returned non-existent path "missing[\\\/]foo.js"/.test(this.warnMessage));

      // restore grunt.fail.warn
      helpers.restoreGruntFailWarn();
    });

    it('should cancel normal search when it returns `false`, and invoke normal search when it returns `null`', function () {
      var flow = new Flow({
        steps: {
          js: ['concat', 'uglify']
        }
      });

      var blocks = helpers.blocks();
      var file = helpers.createFile('foo', 'app', blocks);
      var queue = [];

      function resolveSource(sourceUrl) {
        queue.push(sourceUrl);
        if (sourceUrl === 'baz.js') {
          return false;
        }
        return null;
      }
      var c = new ConfigWriter(flow, {
        root: 'app',
        dest: 'dist',
        staging: '.tmp'
      }, {
        resolveSource: resolveSource
      });

      helpers.file.mkdir('app');
      helpers.file.write(path.join('app', 'foo.js'), 'var a=1;');
      helpers.file.write(path.join('app', 'baz.js'), 'var a=1;');
      helpers.file.write(path.join('app', 'baz.js'), 'var a=1;');

      // mock grunt.fail.warn
      helpers.mockGruntFailWarn(this);

      c.process(file);
      assert.ok(/can't resolve source reference "baz.js"/.test(this.warnMessage));

      // restore grunt.fail.warn
      helpers.restoreGruntFailWarn();

      assert.deepEqual(queue, ['foo.js', 'bar.js', 'baz.js']);
    });
  });
});
