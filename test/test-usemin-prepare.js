'use strict';
var path = require('path');
var assert = require('assert');
var grunt = require('grunt');
var helpers = require('./helpers');

grunt.task.init([]);
grunt.config.init({});

var opts = grunt.cli.options;
opts.redirect = !opts.silent;

describe('useminPrepare', function () {
  before(helpers.directory('temp'));

  it('should update the config (HTML)', function () {
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('useminPrepare', {
      html: 'index.html'
    });
    grunt.file.copy(path.join(__dirname, 'fixtures/usemin.html'), 'index.html');
    grunt.file.copy(path.join(__dirname, 'fixtures/style.css'), 'styles/main.css');
    grunt.file.mkdir('scripts');
    grunt.file.write('scripts/bar.js', 'bar');
    grunt.file.write('scripts/baz.js', 'baz');
    grunt.file.mkdir('scripts/vendor');
    grunt.file.mkdir('scripts/vendor/bootstrap');
    grunt.file.write('scripts/vendor/bootstrap/bootstrap-affix.js', 'bootstrap-affix');
    grunt.file.write('scripts/vendor/bootstrap/bootstrap-alert.js', 'bootstrap-alert');

    grunt.task.run('useminPrepare');
    grunt.task.start();

    var concat = grunt.config('concat');

    assert.ok(concat);
    assert.ok(concat.generated.files);
    assert.equal(concat.generated.files.length, 2);

    assert.equal(concat.generated.files[1].dest, path.normalize('.tmp/concat/scripts/plugins.js'));
    assert.equal(concat.generated.files[1].src.length, 2);
    assert.equal(concat.generated.files[0].dest, path.normalize('.tmp/concat/styles/main.min.css'));
    assert.equal(concat.generated.files[0].src.length, 1);

    var uglify = grunt.config('uglify');

    assert.equal(uglify.generated.files[0].dest, path.normalize('dist/scripts/plugins.js'));
    assert.deepEqual(uglify.generated.files[0].src, [path.normalize('.tmp/concat/scripts/plugins.js')]);
  });

  it('should use alternate search dir if asked to', function () {
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('useminPrepare', {
      html: 'index.html'
    });
    grunt.file.copy(path.join(__dirname, 'fixtures/alternate_search_path.html'), 'index.html');
    grunt.file.mkdir('build');
    grunt.file.mkdir('build/scripts');
    grunt.file.write('build/scripts/bar.js', 'bar');
    grunt.file.write('build/scripts/baz.js', 'baz');

    grunt.task.run('useminPrepare');
    grunt.task.start();

    var concat = grunt.config('concat');
    assert.ok(concat);
    assert.equal(concat.generated.files[0].dest, path.normalize('.tmp/concat/scripts/foo.js'));
    assert.deepEqual(concat.generated.files[0].src, [path.normalize('build/scripts/bar.js'), path.normalize('build/scripts/baz.js')]);

    var uglify = grunt.config('uglify');
    assert.equal(uglify.generated.files[0].dest, path.normalize('dist/scripts/foo.js'));
    assert.deepEqual(uglify.generated.files[0].src, [path.normalize('.tmp/concat/scripts/foo.js')]);
  });

  it('should warn user if no html file found', function () {
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('useminPrepare', {
      html: 'foo.html'
    });

    // mock grunt.fail.warn
    helpers.mockGruntFailWarn(this);

    grunt.task.run('usemin');
    grunt.task.start();

    grunt.task.run('useminPrepare');
    grunt.task.start();

    // restore grunt.fail.warn
    helpers.restoreGruntFailWarn();
    assert.ok(this.warnMessage, 'No source file found.');
  });

  it('output config for subsequent tasks should be relative to observed file', function () {
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('useminPrepare', {
      html: 'build/index.html'
    });
    grunt.file.mkdir('build');
    grunt.file.copy(path.join(__dirname, 'fixtures/relative_path.html'), 'build/index.html');
    grunt.task.run('useminPrepare');
    grunt.task.start();

    var concat = grunt.config('concat');
    assert.ok(concat);
    assert.equal(concat.generated.files[0].dest, path.normalize('.tmp/concat/scripts/foo.js'));
    assert.equal(concat.generated.files[0].src.length, 2);

    var uglify = grunt.config('uglify');
    assert.equal(uglify.generated.files[0].dest, path.normalize('dist/scripts/foo.js'));
    assert.deepEqual(uglify.generated.files[0].src, [path.normalize('.tmp/concat/scripts/foo.js')]);
  });

  describe('absolute path', function () {
    before(helpers.directory('temp'));

    // This is an interesting test case: root file is foo, html file is in foo/build and js
    // sources in foo/scripts
    // we should thus read file in foo/scripts ...
    it('should accept a root directory', function () {
      grunt.log.muted = true;
      grunt.config.init();
      grunt.config('useminPrepare', {
        html: 'foo/build/index.html',
        options: {
          root: 'foo'
        }
      });
      grunt.file.mkdir('foo');
      grunt.file.mkdir('foo/build');
      grunt.file.copy(path.join(__dirname, 'fixtures/style.css'), 'styles/main.css');
      grunt.file.mkdir('foo');
      grunt.file.write('foo/scripts/bar.js', 'bar');
      grunt.file.write('foo/scripts/baz.js', 'baz');

      grunt.file.copy(path.join(__dirname, 'fixtures/absolute.html'), 'foo/build/index.html');
      grunt.task.run('useminPrepare');
      grunt.task.start();

      var concat = grunt.config('concat');
      assert.ok(concat);
      assert.ok(concat.generated);
      assert.equal(concat.generated.files.length, 1);
      var files = concat.generated.files[0];

      assert.equal(files.dest, path.normalize('.tmp/concat/scripts/foo.js'));
      assert.equal(files.src.length, 2);
      assert.equal(files.src[0], path.normalize('foo/scripts/bar.js'));

      var uglify = grunt.config('uglify');
      assert.equal(uglify.generated.files.length, 1);
      files = uglify.generated.files[0];
      assert.equal(files.dest, path.normalize('dist/scripts/foo.js'));
    });
  });

  it('should take dest option into consideration', function () {
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('useminPrepare', {
      html: 'index.html',
      options: {
        dest: 'foo'
      }
    });
    grunt.file.copy(path.join(__dirname, 'fixtures/usemin.html'), 'index.html');
    grunt.task.run('useminPrepare');
    grunt.task.start();

    var uglify = grunt.config('uglify');
    assert.equal(uglify.generated.files[0].dest, path.normalize('foo/scripts/plugins.js'));
    assert.deepEqual(uglify.generated.files[0].src, [path.normalize('.tmp/concat/scripts/plugins.js')]);

  });
  it('should take staging option into consideration', function () {
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('useminPrepare', {
      html: 'index.html',
      options: {
        staging: 'foo'
      }
    });
    grunt.file.copy(path.join(__dirname, 'fixtures/usemin.html'), 'index.html');
    grunt.task.run('useminPrepare');
    grunt.task.start();

    var concat = grunt.config('concat');
    var uglify = grunt.config('uglify');
    assert.equal(concat.generated.files[0].dest, path.normalize('foo/concat/styles/main.min.css'));
    assert.deepEqual(uglify.generated.files[0].src, [path.normalize('foo/concat/scripts/plugins.js')]);

  });

  it('should take staging option into consideration', function () {
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('useminPrepare', {
      html: 'index.html',
      options: {
        staging: 'foo'
      }
    });
    grunt.file.copy(path.join(__dirname, 'fixtures/usemin.html'), 'index.html');
    grunt.task.run('useminPrepare');
    grunt.task.start();

    var uglify = grunt.config('uglify');
    assert.equal(uglify.generated.files[0].dest, path.normalize('dist/scripts/plugins.js'));
    assert.deepEqual(uglify.generated.files[0].src, [path.normalize('foo/concat/scripts/plugins.js')]);

  });

  it('should have configurable flow', function () {
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('useminPrepare', {
      html: 'index.html',
      options: {
        flow: {
          steps: {
            js: ['uglify']
          },
          post: {}
        }
      }
    });
    grunt.file.copy(path.join(__dirname, 'fixtures/usemin.html'), 'index.html');
    grunt.task.run('useminPrepare');
    grunt.task.start();

    var uglify = grunt.config('uglify');
    var concat = grunt.config('concat');

    assert.equal(concat, null);
    assert.ok(uglify);

    assert.equal(uglify.generated.files.length, 1);
    var files = uglify.generated.files[0];

    assert.equal(files.dest, path.normalize('dist/scripts/plugins.js'));

  });

  it('should have configurable flow per target', function () {
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('useminPrepare', {
      html: 'index.html',
      options: {
        flow: {
          html: {
            steps: {
              js: ['uglify']
            },
            post: {}
          }
        }
      }
    });
    grunt.file.copy(path.join(__dirname, 'fixtures/usemin.html'), 'index.html');
    grunt.task.run('useminPrepare');
    grunt.task.start();

    var uglify = grunt.config('uglify');
    var concat = grunt.config('concat');

    assert.equal(concat, null);
    assert.ok(uglify);
    assert.equal(uglify.generated.files.length, 1);
    var files = uglify.generated.files[0];
    assert.equal(files.dest, path.normalize('dist/scripts/plugins.js'));

  });

  it('should allow use to furnish new steps of the flow', function () {
    var copy = {
      name: 'copy',
      createConfig: function (context, block) {
        var cfg = {};
        var files = {};
        var inFiles = [];
        context.inFiles.forEach(function (file) {
          inFiles.push(path.join(context.inDir, file));
        });
        files.dest = path.join(context.outDir, block.dest);
        files.src = inFiles;
        cfg.files = [files];
        return cfg;
      }
    };
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('useminPrepare', {
      html: 'index.html',
      options: {
        flow: {
          steps: {
            js: [copy]
          },
          post: {}
        }
      }
    });
    grunt.file.copy(path.join(__dirname, 'fixtures/usemin.html'), 'index.html');
    grunt.task.run('useminPrepare');
    grunt.task.start();

    var copyCfg = grunt.config('copy');

    assert.ok(copyCfg);
    assert.equal(copyCfg.generated.files[0].dest, path.normalize('dist/scripts/plugins.js'));
  });

  it('should allow to post configure generated steps', function () {

    var concatPostConfig = {
      name: 'concat',
      createConfig: function (context) {
        var generated = context.options.generated;
        generated.options = {
          foo: 'bar'
        };
      }
    };

    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('useminPrepare', {
      html: 'index.html',
      options: {
        flow: {
          steps: {
            js: ['concat']
          },
          post: {
            js: [concatPostConfig]
          }
        }
      }
    });

    grunt.file.copy(path.join(__dirname, 'fixtures/usemin.html'), 'index.html');

    grunt.file.copy(path.join(__dirname, 'fixtures/style.css'), 'styles/main.css');
    grunt.file.mkdir('foo');
    grunt.file.write('foo/scripts/bar.js', 'bar');
    grunt.file.write('foo/scripts/baz.js', 'baz');
    grunt.file.mkdir('foo/scripts/vendor');
    grunt.file.mkdir('foo/scripts/vendor/bootstrap');
    grunt.file.write('foo/scripts/vendor/bootstrap/bootstrap-affix.js', 'bootstrap-affix');
    grunt.file.write('foo/scripts/vendor/bootstrap/bootstrap-alert.js', 'bootstrap-alert');

    grunt.task.run('useminPrepare');
    grunt.task.start();

    var concatCfg = grunt.config('concat');
    var options = concatCfg.generated.options;

    assert.ok(options);
    assert.equal(options.foo, 'bar');

  });
});
