'use strict';
var assert = require('assert');
var concatConfig = require('../lib/config/concat.js');
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

describe('Concat config write', function () {
  it('should exhibit a name', function() {
    assert.equal(concatConfig.name, 'concat');
  });

  it('should use the input files correctly', function () {
    var ctx = { inDir: '.', inFiles: ['foo.js', 'bar.js', 'baz.js'], outDir: 'tmp/concat', outFiles: []};
    var cfg = concatConfig.createConfig( ctx, block );
    assert.ok(cfg.files);
    assert.equal(cfg.files.length, 1);
    var files = cfg.files[0];

    assert.ok(files.src);
    assert.equal(files.dest, path.normalize('tmp/concat/scripts/site.js'));
    assert.deepEqual(files.src, ['foo.js', 'bar.js', 'baz.js']);
    assert.deepEqual(ctx.outFiles, ['scripts/site.js']);
  });
});
