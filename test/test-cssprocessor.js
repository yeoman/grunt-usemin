'use strict';
var assert = require('assert');
var CSSProcessor = require('../lib/cssprocessor');

describe('cssprocessor', function () {
  it('should initialize correctly', function () {
    var cp = new CSSProcessor('myfile.css', '\n', 3);
    assert(cp !== null);
    assert.equal(3, cp.revvedfinder);
    assert.equal('\n', cp.linefeed);
  });

  describe('process', function () {
    var mapping = {
      'images/pic.png': 'images/2123.pic.png',
      '/images/pic.png': '/images/2123.pic.png',
      '../../images/pic.png': '../../images/2123.pic.png',
    };
    var revvedfinder = {
      find: function (s) {
        return mapping[s] || s;
      }
    };

    it('should update the CSS with new img filenames', function () {
      var content = 'background-image:url(images/pic.png);';
      var cp = new CSSProcessor('foo.css', content, revvedfinder);
      var awaited = 'background-image:url(images/2123.pic.png);';
      assert.equal(awaited, cp.process());
    });

    it('should replace file referenced from root', function () {
      var content = 'background-image:url(/images/pic.png);';
      var cp = new CSSProcessor('foo.css', content, revvedfinder);
      var awaited = 'background-image:url(/images/2123.pic.png);';
      assert.equal(awaited, cp.process());
    });

    it('should not replace the root (i.e /)', function () {
      var content = 'background-image:url(/);';
      var cp = new CSSProcessor('foo.css', content, revvedfinder);
      var awaited = 'background-image:url(/);';
      assert.equal(awaited, cp.process());
    });

    it('should not replace external references', function () {
      var content = 'background-image:url(http://images/pic.png);';
      var cp = new CSSProcessor('foo.css', content, revvedfinder);
      var awaited = 'background-image:url(http://images/pic.png);';
      assert.equal(awaited, cp.process());
    });

    it('should take into account relative paths', function () {
      var content = 'background-image:url(../../images/pic.png);';
      var cp = new CSSProcessor('build/css/foo.css', content, revvedfinder);
      var awaited = 'background-image:url(../../images/2123.pic.png);';
      assert.equal(awaited, cp.process());
    });
  });
});
