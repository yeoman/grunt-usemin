'use strict';
var assert = require('assert');
var helpers = require('./helpers');
var Flow = require('../lib/flow.js');
var ConfigWriter = require('../lib/configwriter.js');

describe('ConfigWriter', function () {
  before(helpers.directory('temp'));

  describe('constructor', function () {
    it('should check it\'s input');

    it('should allow for user-defined steps per block type', function () {
      var copy = {
        name: 'copy',
        createConfig: function () {
          return {};
        }
      };

      var flow = new Flow({
        steps: {
          js: ['concat', 'uglifyjs', copy]
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
    var blocks = helpers.blocks();

    it('should check for input parameters');

    it('should output a set of config', function () {
      var flow = new Flow({
        steps: {
          js: ['concat', 'uglifyjs']
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

    it('should have a configurable destination directory', function () {
      var flow = new Flow({
        steps: {
          js: ['concat', 'uglifyjs']
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
          js: ['concat', 'uglifyjs']
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
          js: ['uglifyjs']
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
          js: ['uglifyjs', 'concat']
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
          js: ['concat', 'uglifyjs']
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

    describe('stepWriters', function () {
      it('should return all writers if called without block type', function () {
        var flow = new Flow({
          steps: {
            js: ['concat', 'uglifyjs'],
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
  });
});
