'use strict';
var path = require('path');
var assert = require('assert');
var grunt = require('grunt');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');

grunt.task.init([]);
grunt.config.init({});

var opts = grunt.cli.options;
opts.redirect = !opts.silent;

var directory = function directory(dir) {
  return function directory(done) {
    process.chdir(__dirname);
    rimraf(dir, function (err) {
      if (err) {
        return done(err);
      }
      mkdirp(dir, function (err) {
        if (err) {
          return done(err);
        }
        process.chdir(dir);
        done();
      });
    });
  };
};

describe('usemin', function () {
  before(directory('temp'));

  it('should take into account path when replacing references', function () {
    grunt.file.mkdir('images');
    grunt.file.mkdir('images/misc');
    grunt.file.write('images/23012.test.png', 'foo');
    grunt.file.write('images/misc/2a436.test.png', 'foo');
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('usemin', {html: 'index.html'});
    grunt.file.copy(path.join(__dirname, 'fixtures/usemin.html'), 'index.html');
    grunt.task.run('usemin');
    grunt.task.start();

    var changed = grunt.file.read('index.html');

    // Check replace has performed its duty
    assert.ok(changed.match(/img[^\>]+src=['"]images\/23012\.test\.png["']/));
    assert.ok(changed.match(/img[^\>]+src=['"]images\/misc\/2a436\.test\.png["']/));
    assert.ok(changed.match(/img[^\>]+src=['"]\/\/images\/test\.png["']/));
    assert.ok(changed.match(/img[^\>]+src=['"]\/images\/23012\.test\.png["']/));
    assert.ok(changed.match('<a href="http://foo/bar"></a><a href="ftp://bar"></a><a href="images/23012.test.png"></a><a href="/images/23012.test.png"></a><a href="#local"></a>'));
  });

  it('should work on CSS files', function () {
    grunt.file.mkdir('images');
    grunt.file.mkdir('images/misc');
    grunt.file.write('images/23012.test.png', 'foo');
    grunt.file.write('images/misc/2a436.test.png', 'foo');
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('usemin', {css: 'style.css'});
    grunt.file.copy(path.join(__dirname, 'fixtures/style.css'), 'style.css');
    grunt.task.run('usemin');
    grunt.task.start();

    var changed = grunt.file.read('style.css');

    // Check replace has performed its duty
    assert.ok(changed.match(/url\(\"images\/23012\.test\.png\"/));
    assert.ok(changed.match(/url\(\"images\/misc\/2a436\.test\.png\"/));
    assert.ok(changed.match(/url\(\"\/\/images\/test\.png\"/));
    assert.ok(changed.match(/url\(\"\/images\/23012\.test\.png\"/));
  });

  it('should take into account original file location when replacing', function () {
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('usemin', {html: 'build/index.html'});
    grunt.file.mkdir('build');
    grunt.file.mkdir('build/images');
    grunt.file.mkdir('build/images/misc');
    grunt.file.write('build/images/23012.test.png', 'foo');
    grunt.file.write('build/images/misc/2a436.test.png', 'foo');
    grunt.file.copy(path.join(__dirname, 'fixtures/relative_path.html'), 'build/index.html');
    grunt.task.run('usemin');
    grunt.task.start();


    var changed = grunt.file.read('build/index.html');

    // Check replace has performed its duty
    assert.ok(changed.match(/<script src=\"scripts\/foo\.js\"><\/script>/));
    assert.ok(changed.match(/<script src=\"scripts\/amd-app\.js\"><\/script>/));
    assert.ok(changed.match(/img[^\>]+src=['"]images\/23012\.test\.png["']/));
    assert.ok(changed.match(/img[^\>]+src=['"]images\/misc\/2a436\.test\.png["']/));
    assert.ok(changed.match(/img[^\>]+src=['"]\/\/images\/test\.png["']/));
    assert.ok(changed.match(/img[^\>]+src=['"]\/images\/23012\.test\.png["']/));
  });

  it('should take into account relative path when replacing', function () {
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('usemin', {css: 'build/css/style.css'});
    grunt.file.mkdir('images');
    grunt.file.mkdir('images/misc');
    grunt.file.write('images/23012.test.png', 'foo');
    grunt.file.write('images/misc/2a436.test.png', 'foo');
    grunt.file.write('build/css/style.css', '.body { background: url("../../images/test.png"); }');
    grunt.task.run('usemin');
    grunt.task.start();


    var changed = grunt.file.read('build/css/style.css');

    // Check replace has performed its duty
    assert.ok(changed.match(/url\(\"\.\.\/\.\.\/images\/23012\.test\.png\"/));
  });


  describe('useminPrepare', function () {
    it('should update the config (HTML)', function () {
      grunt.log.muted = true;
      grunt.config.init();
      grunt.config('useminPrepare', {html: 'index.html'});
      grunt.file.copy(path.join(__dirname, 'fixtures/usemin.html'), 'index.html');
      grunt.task.run('useminPrepare');
      grunt.task.start();

      var concat = grunt.config('concat');
      assert.ok(concat);
      assert.ok(concat['scripts/plugins.js']);
      assert.equal(concat['scripts/plugins.js'].length, 13);

      var requirejs = grunt.config('requirejs');
      assert.ok(requirejs.baseUrl);
      assert.equal(requirejs.baseUrl, 'scripts');
      assert.ok(requirejs.name);
      assert.equal(requirejs.name, 'main');
      assert.equal(requirejs.out, 'scripts/amd-app.js');

      var min = grunt.config('min');
      assert.equal(min['scripts/amd-app.js'], 'scripts/amd-app.js');
      assert.equal(min['scripts/plugins.js'], 'scripts/plugins.js');
    });

    it('output config for subsequent tasks (requirejs, concat, ..) should be relative to observed file', function () {
      grunt.log.muted = true;
      grunt.config.init();
      grunt.config('useminPrepare', {html: 'build/index.html'});
      grunt.file.mkdir('build');
      grunt.file.copy(path.join(__dirname, 'fixtures/relative_path.html'), 'build/index.html');
      grunt.task.run('useminPrepare');
      grunt.task.start();

      var concat = grunt.config('concat');
      assert.ok(concat);
      assert.ok(concat['build/scripts/foo.js']);
      assert.equal(concat['build/scripts/foo.js'].length, 2);

      var requirejs = grunt.config('requirejs');
      assert.ok(requirejs.baseUrl);
      assert.equal(requirejs.baseUrl, 'build/scripts');
      assert.ok(requirejs.name);
      assert.equal(requirejs.name, 'main');
      assert.equal(requirejs.out, 'build/scripts/amd-app.js');

      var min = grunt.config('min');
      assert.equal(min['build/scripts/amd-app.js'], 'build/scripts/amd-app.js');
      assert.equal(min['build/scripts/foo.js'], 'build/scripts/foo.js');
    });
  });
});
