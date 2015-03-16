'use strict';

module.exports = function (grunt) {
  grunt.initConfig({

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      core: {
        src: ['lib/**/*.js', 'tasks/*.js']
      },
      test: {
        src: ['test/**/*.js', '!test/temp/**/*.js', '!test/fixtures/*.js']
      }
    },

    jscs: {
      options: {
        config: '.jscsrc'
      },
      gruntfile: {
        src: '<%= jshint.gruntfile.src %>'
      },
      core: {
        src: '<%= jshint.core.src %>'
      },
      test: {
        src: '<%= jshint.test.src %>'
      }
    },

    mochacli: {
      all: ['test/test-*.js']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('grunt-mocha-cli');

  grunt.loadTasks('tasks');

  grunt.registerTask('default', ['jshint', 'jscs', 'mochacli']);
  grunt.registerTask('test', function (file) {
    if (file) {
      grunt.config('mochacli.all', 'test/test-' + file + '.js');
    }
    grunt.task.run('mochacli');
  });
};
