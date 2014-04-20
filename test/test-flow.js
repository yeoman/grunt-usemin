'use strict';
var assert = require('assert');
var helpers = require('./helpers');
var Flow = require('../lib/flow.js');

describe('ConfigWriter', function () {
  before(helpers.directory('temp'));

  it('should allow steps per block type', function () {
    var flow = new Flow({
      steps: {
        js: ['bar', 'baz'],
        css: ['foo']
      }
    });
    assert.deepEqual(flow.steps('js'), ['bar', 'baz']);
    assert.deepEqual(flow.steps('css'), ['foo']);
  });

  it('should be able to return post-processors per block type', function () {
    var flow = new Flow({
      post: {
        js: ['bar', 'baz'],
        css: ['foo']
      }
    });
    assert.deepEqual(flow.post('js'), ['bar', 'baz']);
    assert.deepEqual(flow.post('css'), ['foo']);
  });

  it('should return all block types', function () {
    var flow = new Flow({
      steps: {
        js: ['bar', 'baz'],
        css: ['foo']
      },
      post: {
        html: ['bar']
      }
    });
    assert.deepEqual(flow.blockTypes(), ['js', 'css', 'html']);
  });

  it('should return an empty array if no steps are existing', function () {
    var flow = new Flow({
      steps: {},
      post: {
        html: ['bar']
      }
    });
    assert.deepEqual(flow.steps('js'), []);
  });

  it('should return an empty array if no post are existing', function () {
    var flow = new Flow({
      post: {},
      steps: {
        html: ['bar']
      }
    });
    assert.deepEqual(flow.post('js'), []);
  });

  it('should allow to set steps', function () {
    var flow = new Flow({
      steps: {
        html: ['bar']
      }
    });
    flow.setSteps({
      js: ['foo', 'bar']
    });
    assert.deepEqual(flow.steps('js'), ['foo', 'bar']);
  });

  it('should allow to set steps', function () {
    var flow = new Flow({
      post: {
        html: ['bar']
      }
    });
    flow.setPost({
      js: ['foo', 'bar']
    });
    assert.deepEqual(flow.post('js'), ['foo', 'bar']);
  });

});
