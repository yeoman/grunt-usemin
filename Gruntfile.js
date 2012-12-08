'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    test: {
      files: ['test/**/*.js']
    },
    jshint: {
      all: [ 'Gruntfile.js', 'lib/*.js', 'tasks/*.js', 'test/**/*.js'],
      options: {
        jshintrc: '.jshintrc'
      },
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'default'
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');

  // Load local tasks.
  grunt.loadTasks('tasks');

  // Default task.
  grunt.registerTask('default', 'jshint');

};
