'use strict';
var assert = require('assert');
var uglifyConfig = require('../lib/config/uglify.js');
var path = require('path');

var block = {
  type: 'js',
  dest: 'scripts/site.js',
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
};

describe('Uglify config write', function () {
  it('should have a correct name', function () {
    assert.equal(uglifyConfig.name, 'uglify');
  });

  it('should use the input files correctly', function () {
    var ctx = {
      inDir: 'zzz',
      inFiles: ['foo.js', 'bar.js', 'baz.js'],
      outDir: 'tmp/uglify',
      outFiles: []
    };
    var cfg = uglifyConfig.createConfig(ctx, block);
    assert.ok(cfg.files);
    assert.equal(cfg.files.length, 3);
    var dests = ['tmp/uglify/foo.js', 'tmp/uglify/bar.js', 'tmp/uglify/baz.js'];
    var srcs = ['zzz/foo.js', 'zzz/bar.js', 'zzz/baz.js'];

    cfg.files.forEach(function (files, idx) {
      assert.ok(files.src);
      assert.ok(files.dest);
      assert.equal(files.dest, path.normalize(dests[idx]));
      assert.deepEqual(files.src, [path.normalize(srcs[idx])]);
    });

    assert.deepEqual(ctx.outFiles, ['foo.js', 'bar.js', 'baz.js']);
  });

  it('should use the destination file if it is the last step of the pipe.', function () {
    var ctx = {
      inDir: 'zzz',
      inFiles: ['foo.js', 'bar.js', 'baz.js'],
      outDir: 'dist',
      outFiles: [],
      last: true
    };
    var cfg = uglifyConfig.createConfig(ctx, block);
    assert.ok(cfg.files);
    assert.equal(cfg.files.length, 1);
    var files = cfg.files[0];
    assert.equal(files.dest, path.normalize('dist/scripts/site.js'));
    assert.deepEqual(files.src, [path.normalize('zzz/foo.js'), path.normalize('zzz/bar.js'), path.normalize('zzz/baz.js')]);
    assert.deepEqual(ctx.outFiles, ['scripts/site.js']);
  });


  // it('should allow for concatenation', function () {
  //   var requirejsConfig = {};
  //   var co = new uglifyConfig( 'tmp/uglify', requirejsConfig );
  //   var ctx = { inFiles: ['foo.js', 'bar.js', 'baz.js'], outFiles: []};
  //   var cfg = co.createConfig(ctx, block);
  //   assert.ok(cfg['tmp/uglify/foo.js']);
  //   assert.deepEqual(cfg['tmp/uglify/scripts/site.js'], ['foo.js', 'bar.js', 'baz.js']);
  //   assert.deepEqual(ctx.outFiles, ['tmp/uglify/scripts/site.js']);
  // });

});
