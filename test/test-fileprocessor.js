'use strict';
var assert = require('assert');
var helpers = require('./helpers');
var FileProcessor = require('../lib/fileprocessor.js');

describe('FileProcessor', function() {
  describe('constructor', function() {
    it('should fail if no pattern is furnished', function() {
      assert.throws(function() {
        new FileProcessor();
      }, /No pattern given/);
    });

    it('should accept a pattern name', function() {
      var fp = new FileProcessor('html', {});
      assert.ok(fp);
    });

    it('should access a pattern object', function() {
      var foo = {foo: 'bar'};
      var fp = new FileProcessor(foo, {});
      assert.ok(fp);
      assert.deepEqual(fp.patterns, foo);
    });

    it('should fail if pattern name is not known', function() {
      assert.throws(function() {
        new FileProcessor('foo');
      }, /Unsupported pattern: foo/);
    });

    it('should check all needed arguments are furnished', function() {
      assert.throws(function() {
        new FileProcessor('html');
      },
      /Missing parameter: finder/);
    });
  });

  describe('replaceBlocks', function(){
    it('should replace block with the right expression', function() {
      var fp = new FileProcessor('html',{});
      fp.replaceWith = function() { return 'foo';};
      var file = {
        content: 'foo\nbar\nbaz\n',
        blocks: [
          {
            raw: ['bar', 'baz'],
          }
        ]
      };
      var result = fp.replaceBlocks(file);
      assert.equal(result, 'foo\nfoo\n');
    });
  });

  describe('replaceWith', function() {
    it('should replace css blocks with a link to a stylesheet', function() {
      var fp = new FileProcessor('html',{});
      var block = {
        dest: 'foo.css',
        type: 'css',
        src: ['bar.css'],
        indent: '  '
      };

      var result = fp.replaceWith(block);
      assert.equal(result, '  <link rel="stylesheet" href="foo.css"/>');
    });

    it('should remove css blocks which have no stylesheets linked in them', function() {
      var fp = new FileProcessor('html', {});
      var block = {
        dest: 'foo.css',
        type: 'css',
        src: [],
        indent: '  '
      };

      var result = fp.replaceWith(block);
      assert.equal(result, '');
    });

    it('should replace js blocks with a link to a javascript file', function() {
      var fp = new FileProcessor('html',{});
      var block = {
        dest: 'foo.js',
        type: 'js',
        src: ['bar.js'],
        indent: '  '
      };

      var result = fp.replaceWith(block);
      assert.equal(result, '  <script src="foo.js"><\/script>');
    });

    it('should remove js blocks which have no javascripts linked in the block', function() {
      var fp = new FileProcessor('html',{});
      var block = {
        dest: 'foo.js',
        type: 'js',
        src: [],
        indent: '  '
      };

      var result = fp.replaceWith(block);
      assert.equal(result, '');
    });

    it('should preserve defer attribute (JS)', function () {
      var fp = new FileProcessor('html',{});
      var block = {
        dest: 'foo.js',
        type: 'js',
        src: ['bar.js'],
        defer: true,
        indent: '  '
      };

      var result = fp.replaceWith(block);
      assert.equal(result, '  <script defer src="foo.js"><\/script>');
    });

    it('should preserve async attribute (JS)', function () {
      var fp = new FileProcessor('html',{});
      var block = {
        dest: 'foo.js',
        type: 'js',
        async: true,
        indent: '  '
      };

      var result = fp.replaceWith(block);
      assert.equal(result, '  <script async src="foo.js"><\/script>');
    });

    it('should preserve media attribute', function () {
      var fp = new FileProcessor('html',{});
      var block = {
        dest: 'foo.css',
        type: 'css',
        src: ['bar.css'],
        media: '(min-width:980px)',
        indent: '  '
      };

      var result = fp.replaceWith(block);
      assert.equal(result, '  <link rel="stylesheet" href="foo.css" media="(min-width:980px)"/>');
    });

    it('should preserve IE conditionals for js blocks', function () {
      var fp = new FileProcessor('html',{});
      var block = {
        dest: 'foo.js',
        type: 'js',
        src: ['bar.js'],
        conditionalStart: '<!--[if (lt IE 9) & (!IEmobile)]>',
        conditionalEnd: '<![endif]-->',
        indent: '  '
      };

      var result = fp.replaceWith(block);
      assert.equal(result, '  <!--[if (lt IE 9) & (!IEmobile)]>\n  <script src="foo.js"><\/script>\n  <![endif]-->');
    });

    it('should preserve IE conditionals for css blocks', function () {
      var fp = new FileProcessor('html',{});
      var block = {
        dest: 'foo.css',
        type: 'css',
        src: ['bar.css'],
        conditionalStart: '<!--[if (lt IE 9) & (!IEmobile)]>',
        conditionalEnd: '<![endif]-->',
        indent: '  '
      };

      var result = fp.replaceWith(block);
      assert.equal(result, '  <!--[if (lt IE 9) & (!IEmobile)]>\n  <link rel="stylesheet" href="foo.css"/>\n  <![endif]-->');
    });
  });

  describe('replaceWithRevved', function() {
    it('should use furnished pattern to replace match with reference to revved files', function() {
      var pattern = [[
        /(foo\d+)/g,
        'Replaced numerical foo'
      ]];

      var finder = { find: function() { return 'toto'; }};
      var fp = new FileProcessor(pattern, finder);
      var content = 'bar\nfoo12345\nfoo8979\nbaz\n';
      var result = fp.replaceWithRevved(content,['']);

      assert.equal(result, 'bar\ntoto\ntoto\nbaz\n');
    });
    // FIXME: add tests on the filterIn / filterOut stuff
  });

  describe('process', function() {
    it('should call replaceWithRevved with the right arguments');
  });

  describe('html type', function() {
    var fp;
    var filemapping = {
      'foo.js': 'foo.1234.js',
      '/foo.js': '/foo.1234.js',
      'app/bar.css': 'bar.5678.css',
      'app/baz.css': '/baz.8910.css',
      'app/image.png': 'image.1234.png',
      'tmp/bar.css': 'bar.1234.css',
      'app/foo.js': 'foo.1234.js',
      '/styles/main.css': '/styles/main.1234.css'
    };

    var revvedfinder = helpers.makeFinder(filemapping);

    beforeEach(function() {
      fp = new FileProcessor('html', revvedfinder);

    });

    it('should not replace file if no revved version is found', function () {
      var content = '<script src="bar.js"></script>';
      var replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<script src="bar.js"></script>');
    });

    it('should not treat file reference that are coming from templating', function () {
      var content = '<script src="<% my_func() %>"></script>';
      var replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<script src="<% my_func() %>"></script>');
    });

    it('should not replace external references', function () {
      var content = '<script src="http://bar/foo.js"></script>';
      var replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<script src="http://bar/foo.js"></script>');
    });

    it('should not add .js to data-main for requirejs', function () {
      var content = '<script data-main="bar" src="require.js"></script>';
      var replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<script data-main="bar" src="require.js"></script>');
    });



    describe('absolute paths', function () {
      var fp;

      beforeEach(function() {
        fp = new FileProcessor('html', revvedfinder);
      });

      it('should replace file referenced from root', function () {
        var replaced = fp.replaceWithRevved('<link rel="stylesheet" href="/styles/main.css"/>', ['']);
        assert.equal(replaced, '<link rel="stylesheet" href="/styles/main.1234.css"/>');
      });

      it('should not replace the root (i.e /)', function () {
        var content = '<script src="/"></script>';
        var replaced = fp.replaceWithRevved(content, ['']);

        assert.equal(replaced, '<script src="/"></script>');
      });

      it('should replace accept additional parameters to script', function () {
        var content = '<script src="foo.js" type="text/javascript"></script>';
        var replaced = fp.replaceWithRevved(content, ['']);
        assert.equal(replaced, '<script src="' + filemapping['foo.js'] + '" type="text/javascript"></script>');
      });

      it('should allow for several search paths', function () {
        var content = '<script src="foo.js" type="text/javascript"></script><link rel="stylesheet" href="/baz.css"><link rel="stylesheet" href="/baz.css"/>';
        var replaced = fp.replaceWithRevved(content, ['app', 'tmp']);

        assert.ok(replaced.match(/<link rel="stylesheet" href="\/baz\.8910\.css"\/>/));
        assert.ok(replaced.match(/<link rel="stylesheet" href="\/baz\.8910\.css">/));
        assert.ok(replaced.match(/<script src="foo\.1234\.js" type="text\/javascript"><\/script>/));
      });
    });

    describe('relative paths', function () {
      var fp;

      beforeEach(function() {
        fp = new FileProcessor('html', revvedfinder);
      });

      it('should replace script source with revved version', function () {
        var content = '<script src="foo.js"></script>';
        var replaced = fp.replaceWithRevved(content, ['']);
        assert.equal(replaced, '<script src="' + filemapping['foo.js'] + '"></script>');
      });

      it('should replace accept additional parameters to script', function () {
        var content = '<script src="foo.js" type="text/javascript"></script>';
        var replaced = fp.replaceWithRevved(content, ['']);
        assert.equal(replaced, '<script src="' + filemapping['foo.js'] + '" type="text/javascript"></script>');
      });

    });

    it('should replace CSS reference with revved version', function () {
      var content = '<link rel="stylesheet" href="bar.css">';
      var replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<link rel="stylesheet" href="bar.5678.css">');
      content = '<link rel="stylesheet" href="bar.css"/>';
      replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<link rel="stylesheet" href="bar.5678.css"/>');

    });

    it('should replace img reference with revved version', function () {
      var content = '<img src="image.png">';
      var replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<img src="' + filemapping['app/image.png'] + '">');
    });

    it('should replace data reference with revved version', function () {
      var content = '<li data-lang="fr" data-src="image.png"></li>';
      var replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<li data-lang="fr" data-src="' + filemapping['app/image.png'] + '"></li>');
    });

    it('should replace image reference in inlined style', function () {
      var content = '<li style="background: url("image.png");"></li>';
      var replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<li style="background: url("' + filemapping['app/image.png'] + '");"></li>');
    });

    it('should replace image reference in anchors', function () {
      var content = '<a href="image.png"></a>';
      var replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<a href="' + filemapping['app/image.png'] + '"></a>');
    });

    it('should replace image reference in input', function () {
      var content = '<input type="image" src="image.png" />';
      var replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<input type="image" src="' + filemapping['app/image.png'] + '" />');
    });
  });

  describe('css type', function() {
    var cp;

    describe('absolute path', function() {
      var content = '.myclass {\nbackground: url("/images/test.png") no-repeat center center;\nbackground: url("/images/misc/test.png") no-repeat center center;\nbackground: url("//images/foo.png") no-repeat center center;\nfilter: progid:DXImageTransform.Microsoft.AlphaImageLoader(src="images/pic.png",sizingMethod="scale");}';
      var filemapping = {
        'build/images/test.png': '/images/test.23012.png',
        'build/images/foo.png': '//images/foo.23012.png',
        'build/images/misc/test.png': '/images/misc/test.23012.png',
        'foo/images/test.png': '/images/test.23012.png',
        'foo/images/foo.png': '//images/foo.23012.png',
        'foo/images/pic.png': '/images/pic.23012.png',
        'foo/images/misc/test.png': '/images/misc/test.23012.png'
      };

      var revvedfinder = helpers.makeFinder(filemapping);

      beforeEach(function() {
        cp = new FileProcessor('css', revvedfinder);
      });

      it('should replace with revved files when found', function(){
        var changed = cp.replaceWithRevved(content,['build']);
        assert.ok(changed.match(/\/images\/test\.23012\.png/));
        assert.ok(changed.match(/\/images\/misc\/test\.23012\.png/));
        assert.ok(changed.match(/\/\/images\/foo\.23012\.png/));
      });

      it('should take into account alternate search paths', function(){
        var changed = cp.replaceWithRevved(content, ['foo']);

        assert.ok(changed.match(/\/images\/test\.23012\.png/));
        assert.ok(changed.match(/\/images\/misc\/test\.23012\.png/));
        assert.ok(changed.match(/\/\/images\/foo\.23012\.png/));

      });

      it('should take into account src attribute', function(){
        var changed = cp.replaceWithRevved(content, ['foo']);

        assert.ok(changed.match(/\/images\/pic\.23012\.png/));
        assert.ok(changed.match(/\/images\/misc\/test\.23012\.png/));
        assert.ok(changed.match(/\/\/images\/foo\.23012\.png/));

      });

    });

    describe('relative path', function() {
      var content = '.myclass {\nbackground: url("images/test.png") no-repeat center center;\nbackground: url("../images/misc/test.png") no-repeat center center;\nbackground: url("images/foo.png") no-repeat center center;}';
      var filemapping = {
        'build/images/test.png': 'images/test.23012.png',
        'build/images/foo.png': 'images/foo.23012.png',
        'images/misc/test.png': '../images/misc/test.23012.png',
        'foo/images/test.png': 'images/test.23012.png',
        'foo/images/foo.png': 'images/foo.23012.png',
      };

      var revvedfinder = helpers.makeFinder(filemapping);

      beforeEach(function() {
        cp = new FileProcessor('css', revvedfinder);
      });

      it('should replace with revved files when found', function(){
        var changed = cp.replaceWithRevved(content, ['build']);

        assert.ok(changed.match(/\"images\/test\.23012\.png/));
        assert.ok(changed.match(/\"\.\.\/images\/misc\/test\.23012\.png/));
        assert.ok(changed.match(/\"images\/foo\.23012\.png/));
      });

      it('should take into account alternate search paths', function(){
        var changed = cp.replaceWithRevved(content, ['foo']);

        assert.ok(changed.match(/\"images\/test\.23012\.png/));
        assert.ok(changed.match(/\"\.\.\/images\/misc\/test\.23012\.png/));
        assert.ok(changed.match(/\"images\/foo\.23012\.png/));

      });
    });

    describe('font path', function() {
      var content = '@font-face {\nfont-family:"icons";\nsrc:url("/styles/fonts/icons.eot");\nsrc:url("/styles/fonts/icons.eot?#iefix") format("embedded-opentype"),\nurl("/styles/fonts/icons.woff") format("woff"),\nurl("/styles/fonts/icons.ttf") format("truetype"),\nurl("/styles/fonts/icons.svg?#icons") format("svg");\nfont-weight:normal;\nfont-style:normal;\n}';
      var filemapping = {
        'build/styles/fonts/icons.eot': '/styles/fonts/icons.12345.eot',
        'build/styles/fonts/icons.woff': '/styles/fonts/icons.12345.woff',
        'build/styles/fonts/icons.ttf': '/styles/fonts/icons.12345.ttf',
        'build/styles/fonts/icons.svg': '/styles/fonts/icons.12345.svg',
      };

      var revvedfinder = helpers.makeFinder(filemapping);

      beforeEach(function() {
        cp = new FileProcessor('css', revvedfinder);
      });

      it('should replace but ignore querystrings on revved files when found', function(){
        var changed = cp.replaceWithRevved(content, ['build']);

        assert.ok(changed.match(/\/styles\/fonts\/icons\.12345\.eot/));
        assert.ok(changed.match(/\/styles\/fonts\/icons\.12345\.woff/));
        assert.ok(changed.match(/\/styles\/fonts\/icons\.12345\.ttf/));
        assert.ok(changed.match(/\/styles\/fonts\/icons\.12345\.svg/));
      });

    });


  });
});
