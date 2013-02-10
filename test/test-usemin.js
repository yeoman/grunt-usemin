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
    console.log('should take into account original file location when replacing ' + changed);

    // Check replace has performed its duty
    assert.ok(changed.match(/<script src=\"scripts\/foo\.js\"><\/script>/));
    assert.ok(changed.match(/<script data-main=\"scripts\/amd-app.js\" src=\"scripts\/vendor\/require.js\"><\/script>/));
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

  it('should take into account css reference from root', function () {
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('usemin', {html: 'build/index.html'});
    grunt.file.mkdir('build/styles');
    grunt.file.write('build/styles/23012.main.min.css', 'foo');
    grunt.file.copy(path.join(__dirname, 'fixtures/usemin.html'), 'build/index.html');

    grunt.task.run('usemin');
    grunt.task.start();

    var changed = grunt.file.read('build/index.html');

    // Check replace has performed its duty
    assert.ok(changed.match(/<link rel="stylesheet" href="\/styles\/23012\.main\.min\.css">/));
  });

  it('should not replace reference to file not revved', function () {
    grunt.file.write('foo.html', 'foo');
    grunt.file.write('bar-foo.html', 'foo');
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('usemin', {html: 'index.html'});
    grunt.file.copy(path.join(__dirname, 'fixtures/usemin.html'), 'index.html');
    grunt.task.run('usemin');
    grunt.task.start();

    var changed = grunt.file.read('index.html');

    // Check replace has performed its duty
    assert.ok(changed.match('<a href="foo.html"></a>'));
  });

  it('should limit search to selected directories when asked to', function () {
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('usemin', {html: 'index.html', options: { dirs: ['build']}});
    grunt.file.mkdir('ape');
    grunt.file.mkdir('ape/images');
    grunt.file.mkdir('ape/images/misc');
    grunt.file.write('ape/images/23013.test.png', 'foo');
    grunt.file.write('ape/images/misc/2a437.test.png', 'foo');

    grunt.file.mkdir('build');
    grunt.file.mkdir('build/images');
    grunt.file.mkdir('build/images/misc');
    grunt.file.write('build/images/23012.test.png', 'foo');
    grunt.file.write('build/images/misc/2a436.test.png', 'foo');
    grunt.file.copy(path.join(__dirname, 'fixtures/relative_path.html'), 'index.html');
    grunt.task.run('usemin');
    grunt.task.start();


    var changed = grunt.file.read('index.html');
    console.log('should limit search to selected directories when asked to ' + changed);

    // Check replace has performed its duty
    assert.ok(changed.match(/<script src=\"scripts\/foo\.js\"><\/script>/));
    assert.ok(changed.match(/<script data-main=\"scripts\/amd-app.js\" src=\"scripts\/vendor\/require.js\"><\/script>/));
    assert.ok(changed.match(/img[^\>]+src=['"]images\/23012\.test\.png["']/));
    assert.ok(changed.match(/img[^\>]+src=['"]images\/misc\/2a436\.test\.png["']/));
    assert.ok(changed.match(/img[^\>]+src=['"]\/\/images\/test\.png["']/));
    assert.ok(changed.match(/img[^\>]+src=['"]\/images\/23012\.test\.png["']/));
  });

  it('should consider that data-main point to a JS file', function () {
    grunt.file.mkdir('scripts');
    grunt.file.write('scripts/23012.main.js', 'foo');
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('usemin', {html: 'index.html'});
    grunt.file.copy(path.join(__dirname, 'fixtures/usemin.html'), 'index.html');
    grunt.task.run('usemin');
    grunt.task.start();

    var changed = grunt.file.read('index.html');
    console.log('should consider that data-main point to a JS file ' + changed);

    // Check replace has performed its duty
    assert.ok(changed.match(/data-main="scripts\/23012.main.js"/));
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
      assert.ok(concat['styles/main.min.css']);
      assert.equal(concat['styles/main.min.css'].length, 1);

      var requirejs = grunt.config('requirejs');
      assert.ok(requirejs.default.options.baseUrl);
      assert.equal(requirejs.default.options.baseUrl, 'scripts');
      assert.ok(requirejs.default.options.name);
      assert.equal(requirejs.default.options.name, 'main');
      assert.equal(requirejs.default.options.out, 'scripts/amd-app.js');


      var uglify = grunt.config('uglify');
      assert.equal(uglify['scripts/amd-app.js'], 'scripts/amd-app.js');
      assert.equal(uglify['scripts/plugins.js'], 'scripts/plugins.js');
    });

    it('should update all requirejs multitask configs setting name and output', function () {
      grunt.log.muted = true;
      grunt.config.init();
      grunt.config('useminPrepare', {html: 'index.html'});
      grunt.config('requirejs', {
        task1: {},
        task2: {
          options: {
            baseUrl: 'base'
          }
        }
      });
      grunt.file.copy(path.join(__dirname, 'fixtures/usemin.html'), 'index.html');
      grunt.task.run('useminPrepare');
      grunt.task.start();

      var requirejs = grunt.config('requirejs');
      assert.ok(requirejs.task1.options.name);
      assert.ok(requirejs.task2.options.name);

      assert.equal(requirejs.task1.options.name, 'main');
      assert.equal(requirejs.task2.options.name, 'main');

      assert.equal(requirejs.task1.options.out, 'scripts/amd-app.js');
      assert.equal(requirejs.task2.options.out, 'scripts/amd-app.js');

      assert.equal(requirejs.task1.options.baseUrl, 'scripts');
      assert.equal(requirejs.task2.options.baseUrl, 'base');


    });

    it('should create a requirejs multitask config setting with name and output if non settings exists', function () {
      grunt.log.muted = true;
      grunt.config.init();
      grunt.config('useminPrepare', {html: 'index.html'});

      grunt.file.copy(path.join(__dirname, 'fixtures/usemin.html'), 'index.html');
      grunt.task.run('useminPrepare');
      grunt.task.start();

      var requirejs = grunt.config('requirejs');
      assert.ok(requirejs.default.options.name);
      assert.equal(requirejs.default.options.name, 'main');
      assert.equal(requirejs.default.options.out, 'scripts/amd-app.js');
      assert.equal(requirejs.default.options.baseUrl, 'scripts');
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

      assert.ok(requirejs.default.options.baseUrl);
      assert.equal(requirejs.default.options.baseUrl, 'build/scripts');
      assert.ok(requirejs.default.options.name);
      assert.equal(requirejs.default.options.name, 'main');
      assert.equal(requirejs.default.options.out, 'build/scripts/amd-app.js');

      var uglify = grunt.config('uglify');
      assert.equal(uglify['build/scripts/amd-app.js'], 'build/scripts/amd-app.js');
      assert.equal(uglify['build/scripts/foo.js'], 'build/scripts/foo.js');
    });

    it('should have configurable name for ugligy', function () {
      grunt.log.muted = true;
      grunt.config.init();
      grunt.config('useminPrepare', {html: 'index.html', options: { 'uglify': 'foo'}});
      grunt.file.copy(path.join(__dirname, 'fixtures/usemin.html'), 'index.html');
      grunt.task.run('useminPrepare');
      grunt.task.start();

      var uglify = grunt.config('foo');
      assert.equal(uglify['scripts/amd-app.js'], 'scripts/amd-app.js');
      assert.equal(uglify['scripts/plugins.js'], 'scripts/plugins.js');
    });
  });
});
