'use strict';
module.exports = function (grunt) {
  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: [
        'Gruntfile.js',
        'lib/*.js',
        'tasks/*.js',
        'test/**/*.js',
        '!test/temp/scripts/*.js',
      ]
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.loadTasks('tasks');

  grunt.registerTask('test', 'Run tests', function () {
    var done = this.async();
    var spawnOpts = {
      cmd: 'node_modules/mocha/bin/mocha',
      args: grunt.file.expand('test/test-*.js')
    };
    grunt.util.spawn(spawnOpts, function (err, res, code) {
      grunt.log.write(res.stdout);
      if (code) {
        throw res.stderr;
      }
      done();
    });
  });
  grunt.registerTask('default', ['jshint', 'test']);
};
