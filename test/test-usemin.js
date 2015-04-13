'use strict';
var path = require('path');
var assert = require('assert');
var grunt = require('grunt');
var helpers = require('./helpers');

grunt.task.init([]);
grunt.config.init({});

var opts = grunt.cli.options;
opts.redirect = !opts.silent;

describe('usemin', function () {
  describe('absolute paths', function () {
    beforeEach(helpers.directory('temp'));

    it('should warn user if no html file found', function () {
      grunt.log.muted = true;
      grunt.config.init();
      grunt.config('usemin', {
        html: 'build/foo.html'
      });

      // mock grunt.fail.warn
      helpers.mockGruntFailWarn(this);

      grunt.task.run('usemin');
      grunt.task.start();

      // restore grunt.fail.warn
      helpers.restoreGruntFailWarn();
      assert.ok(this.warnMessage, 'No files found for target html');
    });

    it('should replace with revved files when found', function () {
      grunt.file.mkdir('build');
      grunt.file.mkdir('build/images');
      grunt.file.mkdir('build/images/misc');
      grunt.file.write('build/images/test.23012.png', 'foo');
      grunt.file.write('build/images/bar.23012.png', 'foo');
      grunt.file.write('build/images/misc/test.2a436.png', 'foo');
      grunt.file.copy(path.join(__dirname, 'fixtures/htmlprocessor_absolute.html'), 'build/index.html');

      grunt.log.muted = true;
      grunt.config.init();
      grunt.config('usemin', {
        html: 'build/index.html'
      });
      // grunt.file.copy(path.join(__dirname, 'fixtures/usemin.html'), 'index.html');
      grunt.task.run('usemin');
      grunt.task.start();

      var changed = grunt.file.read('build/index.html');

      assert.ok(changed.match(/<img src="\/images\/test\.23012\.png">/));
      assert.ok(changed.match(/<img src="\/\/images\/bar\.23012\.png">/));
      assert.ok(changed.match(/<img src="\/images\/misc\/test\.2a436\.png">/));

    });

    it('should take into account alternate search path for assets', function () {
      grunt.file.mkdir('build');
      grunt.file.mkdir('foo');
      grunt.file.mkdir('foo/images');
      grunt.file.mkdir('foo/images/foo');
      grunt.file.write('foo/images/test.23012.png', 'foo');
      grunt.file.write('foo/images/bar.23012.png', 'foo');
      grunt.file.write('foo/images/misc/test.2a436.png', 'foo');
      grunt.file.copy(path.join(__dirname, 'fixtures/htmlprocessor_absolute.html'), 'build/index.html');

      grunt.log.muted = true;
      grunt.config.init();
      grunt.config('usemin', {
        html: 'build/index.html',
        options: {
          assetsDirs: ['foo']
        }
      });
      grunt.task.run('usemin');
      grunt.task.start();

      var changed = grunt.file.read('build/index.html');

      assert.ok(changed.match(/<img src="\/images\/test\.23012\.png">/));
      assert.ok(changed.match(/<img src="\/\/images\/bar\.23012\.png">/));
      assert.ok(changed.match(/<img src="\/images\/misc\/test\.2a436\.png">/));

    });

    it('should allow for several asset dirs', function () {
      grunt.file.mkdir('build');
      grunt.file.mkdir('foo');
      grunt.file.mkdir('foo/images');
      grunt.file.mkdir('foo/images/misc');
      grunt.file.write('foo/images/test.23012.png', 'foo');
      grunt.file.write('foo/images/bar.23012.png', 'foo');
      grunt.file.write('foo/images/misc/test.2a436.png', 'foo');
      grunt.file.mkdir('bar');
      grunt.file.mkdir('bar/scripts');
      grunt.file.write('bar/scripts/plugins.12345.js', 'bar');
      grunt.file.write('bar/scripts/amd-app.6789.js', 'bar');
      grunt.file.copy(path.join(__dirname, 'fixtures/htmlprocessor_absolute.html'), 'build/index.html');

      grunt.log.muted = true;
      grunt.config.init();
      grunt.config('usemin', {
        html: 'build/index.html',
        options: {
          assetsDirs: ['foo', 'bar']
        }
      });
      grunt.task.run('usemin');
      grunt.task.start();

      var changed = grunt.file.read('build/index.html');

      assert.ok(changed.match(/<img src="\/images\/test\.23012\.png">/));
      assert.ok(changed.match(/<img src="\/\/images\/bar\.23012\.png">/));
      assert.ok(changed.match(/<img src="\/images\/misc\/test\.2a436\.png">/));
      assert.ok(changed.match(/<script src="\/scripts\/plugins\.12345\.js">/));
    });

  });

  describe('relative paths', function () {
    beforeEach(helpers.directory('temp'));

    it('should replace with revved files when found', function () {
      grunt.file.mkdir('build');
      grunt.file.mkdir('build/images');
      grunt.file.mkdir('build/foo');
      grunt.file.mkdir('build/images/misc');
      grunt.file.write('build/images/test.23012.png', 'foo');
      grunt.file.write('build/images/bar.23012.png', 'foo');
      grunt.file.write('build/images/misc/test.2a436.png', 'foo');
      grunt.file.copy(path.join(__dirname, 'fixtures/htmlprocessor_relative.html'), 'build/foo/index.html');

      grunt.log.muted = true;
      grunt.config.init();
      grunt.config('usemin', {
        html: 'build/foo/index.html'
      });
      grunt.task.run('usemin');
      grunt.task.start();

      var changed = grunt.file.read('build/foo/index.html');

      assert.ok(changed.match(/<img src="\.\.\/images\/test\.23012\.png"\>/));
      assert.ok(changed.match(/<link rel=\"stylesheet\" href=\"styles\/main\.min\.css\">/));
      assert.ok(changed.match(/<img src=\"\.\.\/images\/misc\/test\.2a436\.png\">/));

    });

    it('should take into account alternate path for assets', function () {
      grunt.file.mkdir('build');
      grunt.file.mkdir('foo');
      grunt.file.mkdir('foo/bar');
      grunt.file.mkdir('foo/images');
      grunt.file.mkdir('foo/images/foo');
      grunt.file.write('foo/images/test.23012.png', 'foo');
      grunt.file.write('foo/images/bar.23012.png', 'foo');
      grunt.file.write('foo/images/misc/test.2a436.png', 'foo');
      grunt.file.copy(path.join(__dirname, 'fixtures/htmlprocessor_relative.html'), 'build/index.html');

      grunt.log.muted = true;
      grunt.config.init();
      grunt.config('usemin', {
        html: 'build/index.html',
        options: {
          assetsDirs: ['foo/bar']
        }
      });
      grunt.task.run('usemin');
      grunt.task.start();

      var changed = grunt.file.read('build/index.html');

      assert.ok(changed.match(/<img src="\.\.\/images\/test\.23012\.png">/));
      assert.ok(changed.match(/<img src="\.\.\/images\/misc\/test\.2a436\.png">/));
    });

    it('should allow for several asset dirs', function () {
      grunt.file.mkdir('build');
      grunt.file.mkdir('foo/bar');
      grunt.file.mkdir('foo/images');
      grunt.file.mkdir('foo/images/misc');
      grunt.file.write('foo/images/test.23012.png', 'foo');
      grunt.file.write('foo/images/bar.23012.png', 'foo');
      grunt.file.write('foo/images/misc/test.2a436.png', 'foo');
      grunt.file.mkdir('bar');
      grunt.file.mkdir('bar/scripts');
      grunt.file.write('bar/scripts/plugins.12345.js', 'bar');
      grunt.file.write('bar/scripts/amd-app.6789.js', 'bar');
      grunt.file.copy(path.join(__dirname, 'fixtures/htmlprocessor_relative.html'), 'build/index.html');

      grunt.log.muted = true;
      grunt.config.init();
      grunt.config('usemin', {
        html: 'build/index.html',
        options: {
          assetsDirs: ['foo/bar', 'bar']
        }
      });
      grunt.task.run('usemin');
      grunt.task.start();

      var changed = grunt.file.read('build/index.html');

      assert.ok(changed.match(/<img src="\.\.\/images\/test\.23012\.png">/));
      assert.ok(changed.match(/<img src="\.\.\/images\/misc\/test\.2a436\.png">/));
      assert.ok(changed.match(/<script src="scripts\/plugins\.12345\.js">/));
    });
  });

  before(helpers.directory('temp'));

  it('should work on CSS files', function () {
    grunt.file.mkdir('images');
    grunt.file.mkdir('images/misc');
    grunt.file.write('images/test.23012.png', 'foo');
    grunt.file.write('images/misc/test.2a436.png', 'foo');
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('usemin', {
      css: 'style.css'
    });
    grunt.file.copy(path.join(__dirname, 'fixtures/style.css'), 'style.css');
    grunt.task.run('usemin');
    grunt.task.start();

    var changed = grunt.file.read('style.css');

    // Check replace has performed its duty
    assert.ok(changed.match(/url\(\"images\/test\.23012\.png\"/));
    assert.ok(changed.match(/url\(\"images\/misc\/test\.2a436\.png\"/));
    assert.ok(changed.match(/url\(\"\/\/images\/test\.23012\.png\"/));
    assert.ok(changed.match(/url\(\"\/images\/test\.23012\.png\"/));
  });

  it('should not replace reference to file not revved', function () {
    grunt.file.write('foo.html', 'foo');
    grunt.file.write('bar-foo.html', 'foo');
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('usemin', {
      html: 'index.html'
    });
    grunt.file.copy(path.join(__dirname, 'fixtures/usemin.html'), 'index.html');
    grunt.task.run('usemin');
    grunt.task.start();

    var changed = grunt.file.read('index.html');

    // Check replace has performed its duty
    assert.ok(changed.match('<a href="foo.html"></a>'));
  });

  it('should allow for additional replacement patterns', function () {
    grunt.file.mkdir('images');
    grunt.file.write('images/image.2132.png', 'foo');
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('usemin', {
      js: 'misc.js',
      options: {
        assetsDirs: 'images',
        patterns: {
          js: [
            [/referenceToImage = '([^\']+)'/, 'Replacing image']
          ]
        }
      }
    });
    grunt.file.copy(path.join(__dirname, 'fixtures/misc.js'), 'misc.js');
    grunt.task.run('usemin');
    grunt.task.start();
    var changed = grunt.file.read('misc.js');

    // Check replace has performed its duty
    assert.ok(changed.match(/referenceToImage = 'image\.2132\.png'/));
  });

  it('should use revved summary file when given one', function () {
    grunt.file.mkdir('images');
    grunt.file.write('images/test.2132.png', 'foo');
    grunt.file.write('images/test.2134.png', 'foo');

    var summary = {};
    summary[helpers.normalize('images/test.png')] = 'images/test.2134.png';

    grunt.file.write('summary.js', JSON.stringify(summary));
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('usemin', {
      html: 'index.html',
      options: {
        revmap: 'summary.js'
      }
    });
    grunt.file.copy(path.join(__dirname, 'fixtures/usemin.html'), 'index.html');
    grunt.task.run('usemin');
    grunt.task.start();

    var changed = grunt.file.read('index.html');
    // Check replace has performed its duty
    assert.ok(changed.match('<img src="images/test.2134.png">'));

  });

  it('should use filerev map object when available', function () {
    // grunt.file.mkdir('images');
    // grunt.file.write('images/test.2132.png', 'foo');
    // grunt.file.write('images/test.2134.png', 'foo');
    var summary = {};
    summary[helpers.normalize('images/test.png')] = 'images/test.2134.png';

    grunt.filerev = {
      summary: summary
    };
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('usemin', {
      html: 'index.html'
    });
    grunt.file.copy(path.join(__dirname, 'fixtures/usemin.html'), 'index.html');
    grunt.task.run('usemin');
    grunt.task.start();
    grunt.filerev = null;

    var changed = grunt.file.read('index.html');
    // Check replace has performed its duty
    assert.ok(changed.match('<img src="images/test.2134.png">'));
  });

  it('should allow for custom block replacement functions', function () {
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('usemin', {
      html: 'index.html',
      options: {
        blockReplacements: {
          less: function (block) {
            return '<link rel="stylesheet" href="' + block.dest + '">';
          }
        }
      }
    });
    grunt.file.copy(path.join(__dirname, 'fixtures/block_with_custom_type.html'), 'index.html');
    grunt.task.run('usemin');
    grunt.task.start();

    var changed = grunt.file.read('index.html');
    // Check replace has performed its duty
    assert.ok(changed.match('<link rel="stylesheet" href="styles/main.css">'));
  });
});
