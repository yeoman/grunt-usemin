'use strict';
var assert = require('assert');
var RevvedFinder = require('../lib/revvedfinder');
var expandfn = function () {
  return [];
};

describe('RevvedFinder', function () {
  it('should initialize correctly', function () {
    var rf = new RevvedFinder(expandfn);
    assert.equal(expandfn, rf.expandfn);
  });

  describe('find', function () {
    it('should return the file if it\'s external', function () {
      var rf = new RevvedFinder(expandfn);
      assert.equal('http://foo/bar.png', rf.find('http://foo/bar.png'));
    });

    it('should return the file if it references the root', function () {
      var rf = new RevvedFinder(expandfn);
      assert.equal('/', rf.find('/'));
    });

    it('should return revved version of the given file', function () {
      var rf = new RevvedFinder(function () {
        return ['2345.image.png'];
      });
      assert.equal('2345.image.png', rf.find('image.png', '.'));
    });

    it('should pay attention to the full given path', function () {
      var rf = new RevvedFinder(function () {
        return ['7345.image.png', 'bar/2345.image.png'];
      });
      assert.equal('bar/2345.image.png', rf.find('bar/image.png', '.'));
    });

    it('should return revved version if it ends hex in characters', function () {
      var rf = new RevvedFinder(function () {
        return ['11916fba.image.png'];
      });
      assert.equal('11916fba.image.png', rf.find('image.png', '.'));
    });

    it('should return the file if not revved version is found', function () {
      var rf = new RevvedFinder(function () {
        return [];
      });
      assert.equal('foo.png', rf.find('foo.png', '.'));
    });
    it('should return the file if not revved version is found (starting from root)', function () {
      var rf = new RevvedFinder(function () {
        return [];
      });
      assert.equal('/foo.png', rf.find('/foo.png', '.'));
    });

    it('should pay attention to the file starting at root', function () {
      var rf = new RevvedFinder(function () {
        return ['1234.foo.png'];
      });
      assert.equal('/1234.foo.png', rf.find('/foo.png', '.'));
    });
    it('should rev files starting at root regardless of file location', function () {
      var rf = new RevvedFinder(function () {
        return ['1234.foo.png'];
      });
      assert.equal('/1234.foo.png', rf.find('/foo.png', 'bar/baz'));
    });
    it('should only looked at revved files', function () {
      var rf = new RevvedFinder(function () {
        return ['bar-fred.html'];
      });
      assert.equal('fred.html', rf.find('fred.html', '.'));
    });

    it('should restrict to the furnished subdirectories', function () {
      var rf = new RevvedFinder(function (pattern) {
        assert.equal(pattern, '{temp,dist}/**/*fred.html');
        return ['fred.html'];
      }, ['temp', 'dist']);
      rf.find('fred.html', '.');
    });
  });
});
