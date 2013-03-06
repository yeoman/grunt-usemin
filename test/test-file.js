'use strict';
var assert = require('assert');
var path = require('path');
var File = require('../lib/file.js');

describe('File', function() {
  it('should store filename, file location, ...', function() {
    var filename = path.join(__dirname, 'fixtures', 'usemin.html');
    var file = new File(filename);
    assert.ok(file.dir, path.dirname(filename));
    assert.ok(file.name, path.basename(filename));
  });

  it('should extract a list of blocks from furnished file', function() {
    var file = new File(path.join(__dirname, 'fixtures', 'usemin.html'));
    assert.ok(file.blocks.length, 2);
  });

  it('should *not* skip blank lines', function () {
    var filename = __dirname + '/fixtures/block_with_empty_line.html';
    var file = new File(filename);

    assert.equal(1, file.blocks.length);
    assert.equal('foo.css', file.blocks[0].dest);
    assert.equal(5, file.blocks[0].raw.length);
    assert.equal(2, file.blocks[0].src.length);
    assert.equal('  ', file.blocks[0].indent);
  });

  it('should return the right number of blocks with the right number of lines', function () {
    var filename = __dirname + '/fixtures/usemin.html';
    var file = new File(filename);
    assert.equal(2, file.blocks.length);
    var b1 = file.blocks[0];
    var b2 = file.blocks[1];
    assert.equal(3, b1.raw.length);
    assert.equal('css', b1.type);
    assert.equal(1, b1.src.length);
    assert.equal(16, b2.raw.length);
    assert.equal('js', b2.type);
    assert.equal(13, b2.src.length);
  });

  it('should also detect block that use alternate search dir', function () {
    var filename = __dirname + '/fixtures/alternate_search_path.html';
    var file = new File(filename);
    assert.equal(1, file.blocks.length);
    var b1 = file.blocks[0];

    assert.equal(4, b1.raw.length);
    assert.equal('js', b1.type);
    assert.equal(2, b1.src.length);
    assert.equal(b1.searchPath.length, 1);
    assert.equal(b1.src[0], 'scripts/bar.js');
    assert.equal(b1.src[1], 'scripts/baz.js');

    assert.equal(2, b1.src.length);
  });

  it('should throw an exception if it finds RequireJS blocks', function() {
    var filename = __dirname + '/fixtures/requirejs.html';
    assert.throws( function() {
      new File(filename);
    }, Error);
  });

  it('should not take into consideration path of the source file', function () {
    var filename = __dirname + '/fixtures/usemin.html';
    var file = new File(filename);

    assert.equal(2, file.blocks.length);
    assert.equal('/styles/main.min.css', file.blocks[0].dest);
    assert.equal(1, file.blocks[0].src.length);
    assert.equal('styles/main.css', file.blocks[0].src[0]);
  });

  it('should not take into consideration source files referenced from root', function () {
    var filename = __dirname + '/fixtures/root_path.html';
    var file = new File(filename);

    assert.equal(1, file.blocks.length);
    assert.equal('/scripts/foo.js', file.blocks[0].dest);
  });

});
