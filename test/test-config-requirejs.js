'use strict';
var assert = require('assert');
var requirejsConfig = require('../lib/config/requirejs.js');
var helpers = require('./helpers');

var block = {
    type: 'js',
    dest: 'scripts/amd-app.js',
    requirejs: {
      dest: 'scripts/amd-app.js',
      baseUrl: 'scripts',
      name: 'main',
      origScript: 'foo/require.js',
      src: 'foo/require.js'
    },
    src: [
      'foo/require.js'
    ],
    raw: [
      '<!-- build:js scripts/amd-app.js -->',
      '<script data-main="scripts/main" src="foo/require.js"></script>',
      '<!-- endbuild -->'
    ]
  };

var blockWithoutRequirejs = {
    type: 'js',
    dest: 'scripts/amd-app.js',
    src: [
      'foo/require.js'
    ],
    raw: [
      '<!-- build:js scripts/amd-app.js -->',
      '<script data-main="scripts/main" src="foo/require.js"></script>',
      '<!-- endbuild -->'
    ]
  };


describe('Requirejs config write', function() {

  it('should use the input files correctly', function () {
    var ctx = { inDir: 'zzz', inFiles: ['foo.js'], outDir: 'tmp/requirejs', outFiles: []};
    var cfg = requirejsConfig.createConfig( ctx, block );
    assert.deepEqual(cfg,helpers.normalize({
      'default': {
        'options': { 'name': 'main', 'out': 'tmp/requirejs/scripts/amd-app.js', 'baseUrl': 'zzz/scripts', 'mainConfigFile': 'zzz/scripts/main.js'}
      }
    }));
  });

  it('should do nothing if the block is not requirejs enabled', function() {
    var ctx = { inDir: 'zzz', inFiles: ['foo.js'], outDir: 'tmp/requirejs', outFiles: []};
    var cfg = requirejsConfig.createConfig( ctx, blockWithoutRequirejs);
    assert.deepEqual(cfg, {});
  });

  it('should add a .js when needed to mainConfigFile', function() {
    var ctx = { inDir: 'zzz', inFiles: ['foo.js'], outDir: 'tmp/requirejs', outFiles: []};
    var cfg = requirejsConfig.createConfig( ctx, block );
    assert.equal(cfg['default'].options.mainConfigFile, helpers.normalize('zzz/scripts/main.js'));
  });

  it('should treat multi-config requirejs');

});
