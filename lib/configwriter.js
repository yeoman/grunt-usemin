'use strict';
var path = require('path');
var fs = require('fs');
var grunt = require('grunt');
var File = require('./file');
var _ = require('lodash');

var deepMerge = function (origCfg, cfg) {
  var outCfg = origCfg;

  // If the newly generated part is already in the config file
  // with the same destination update only the source part, instead of add the whole block again.
  // This way the same targets wont be regenerated multiple times if usemin is called
  // multiple times which can happen with grunt-watcher spawn:false mode (#307)

  if (origCfg.files && cfg.files) {
    var done = false;
    for (var i = 0; i < origCfg.files.length; i++) {
      if (outCfg.files[i].dest === cfg.files[0].dest) {
        outCfg.files[i].src = cfg.files[0].src;
        done = true;
      }
    }
    if (!done) {
      outCfg.files = _.union(origCfg.files, cfg.files);
    }
  } else if (cfg.files) {
    outCfg.files = cfg.files;
  }

  return outCfg;
};

//
// Create a config writer for the furnished flow.
// The created config will:
//  - use staging directory for intermediate created files
//  - output the final files under the dest directory.
//
// flow is an array of strings that contains name of each steps, in order.
// Each of the steps is corresponding to a processor that will be used on the files
// enclosed in blocks (for example, concat, uglify).
// Note that a corresponding file implementing a dedicated writer needs to be present
// under the same name, in config directory.
//
// Additional configurations post-processors can be also given.
// These post-processors are updating additional configuration based on the output of the flow.
//
// For example:
//
//   var w = new ConfigWriter( ['concat', 'uglify'], [], {input: 'app', staging: '.tmp', dest: 'dist'});
//
//   We'll:
//     - have files config/concat.js and config/uglify.js implementing each config writer
//     - Use .tmp for the output of concat and input of uglify
//     - Deliver for each block the requested file under dist directory
//
//
var ConfigWriter = module.exports = function (flow, dirs, options) {
  var self = this;
  this.flow = flow;
  // FIXME: check dest and staging are furnished
  this.root = dirs.root;
  this.dest = dirs.dest;
  this.staging = dirs.staging;

  // optional hook to resolve source url
  this.resolveSource = options && options.resolveSource;

  this.steps = {};
  this.postprocessors = [];
  this.destinations = {};

  // We need to create all the needed config writers, given them their output directory
  // E.g, if we do have the flow concat | uglify, the output dir will be .tmp/concat and dist
  // if the flow is concat | uglify | foo, the dirs will be .tmp/concat, .tmp/uglify, dist
  flow.blockTypes().forEach(function (blockType) {
    self.steps[blockType] = [];
    self.postprocessors[blockType] = [];

    flow.steps(blockType).forEach(function (item) {
      var step;
      if (_.isString(item)) {
        step = require(path.join(__dirname, 'config', item));
      } else {
        // Assume this is a user furnished step
        // FIXME: Add checks on object attributes
        step = item;
      }
      self.steps[blockType].push(step);
    });

    flow.post(blockType).forEach(function (item) {
      var pp;
      if (_.isString(item)) {
        pp = require(path.join(__dirname, 'config', item));
      } else {
        // Assume this is a user furnished post-processor
        // FIXME: Add checks on object attributes
        pp = item;
      }
      self.postprocessors[blockType].push(pp);
    });

  });

  // postprocessorsList.forEach(function (item) {
  //   var pp;
  //   if (_.isString(item)) {
  //     pp = require(path.join(__dirname, 'config', item));
  //   } else {
  //     // Assume this is a user furnished post-processor
  //     // FIXME: Add checks on object attributes
  //     pp = item;
  //   }
  //   self.postprocessors.push(pp);
  // });
};

ConfigWriter.prototype.stepWriters = function (blockType) {
  var writers;

  if (blockType) {
    writers = this.steps[blockType] || [];
  } else {
    writers = _.uniq(_.flatten(_.values(this.steps), true)); // Only 1 level
  }
  return writers;
};

ConfigWriter.prototype.postWriters = function (blockType) {
  return this.postprocessors[blockType] || [];
};


//
// Iterate over steps for the furnished block type.
// The callback is called with the following parameters:
//  - step : the step by itself
//  - last : boolean indicating if this is the last writer of the pipe
//
ConfigWriter.prototype.forEachStep = function (blockType, cb) {
  var writersCount = this.stepWriters(blockType).length;
  this.stepWriters(blockType).forEach(function (step, index) {
    cb(step, index === writersCount - 1);
  });
};

//
// Process the blocks of the furnished file. This means:
//  + have each block go through the flow of processors
//  + update dependent configuration based on the output of the flow
// and update the furnished config
//
// If file is a string it will be considered as the filepath,
// otherwise it should be an object that conforms to File (in lib/file.js) API
//
ConfigWriter.prototype.process = function (file, config) {
  var self = this;
  var lfile = file;
  var rootPath = self.root || [];
  if (!Array.isArray(rootPath)) { rootPath = [rootPath]; }

  config = config || {};

  if (_.isString(file)) {
    lfile = new File(file);
  }

  lfile.blocks.forEach(function (block) {
    // NOTE: initial context.inDir is only used by ./config/requirejs,
    //       everything else uses context.resolveInFile(),
    //       which checks entire searchPath.
    var searchPath = block.searchPath.concat(rootPath, lfile.searchPath);
    var context = {
      inDir: self.root || lfile.searchPath[0],
      inFiles: block.src,
      outFiles: []
    };

    function resolveInFile (fname) {
      var source = null;
      // if a resolveSource hook function is provided use it for file source
      if (self.resolveSource) {
        source = self.resolveSource(fname, lfile.dir, lfile.name, block.dest, searchPath);
        if (source) {
          if (!fs.existsSync(source)) {
            grunt.fail.warn(_.template(
              'usemin: resolveSource() returned non-existent path "<%= source %>"' +
              ' for source "<%= fname %>".')(
            {
              source: source,
              fname: fname
            }));
          }
          return source;
        }
      }
      // default behavior to search file in provided search paths.
      //  * source being null meaning that no resolveSource hook provided
      //  * source being false meaning that
      if (source !== false) {
        for (var i = 0; i < searchPath.length; ++i) {
          source = path.join(searchPath[i], fname);
          if (fs.existsSync(source)) {
            return source;
          }
        }
      }
      grunt.fail.warn(_.template(
        'usemin: can\'t resolve source reference "<%= fname %>" ' +
        '(file "<%= filepath %>", block "<%= block.dest %>").')(
      {
        fname: fname,
        block: block,
        filepath: path.join(lfile.dir, lfile.name)
      }));
      // we know it's not there, but return placeholder to match old behavior.
      return path.join(searchPath[0], fname);
    }
    context.resolveInFile = resolveInFile;

    function resolveTempFile(fname) {
      return path.join(context.inDir, fname);
    }

    self.forEachStep(block.type, function (writer, last) {
      var blockConfig;
      var fileSet;
      var dest;

      // If this is the last writer of the pipe, we need to output
      // in the destination directory
      context.outDir = last ? self.dest : path.join(self.staging, writer.name);
      context.last = last;
      config[writer.name] = config[writer.name] || {};
      config[writer.name].generated = config[writer.name].generated || {};
      context.options = config[writer.name];
      // config[writer.name].generated = _.extend(config[writer.name].generated, writer.createConfig(context, block));
      blockConfig = writer.createConfig(context, block);
      if (blockConfig.files) {
        fileSet = blockConfig.files;
        blockConfig.files = [];
        fileSet.forEach(function (filesInfo) {
          dest = filesInfo.dest;
          if (!self.destinations[dest]) {
            self.destinations[dest] = filesInfo;
            blockConfig.files.push(filesInfo);
          } else if (!_.isEqual(self.destinations[dest], filesInfo)) {
            throw new Error('Different sources attempting to write to the same destination:\n ' + JSON.stringify(self.destinations[dest], null, '    ') + '\n  ' + JSON.stringify(blockConfig, null, '    '));
          }
        });

        if (blockConfig.files.length) {
          config[writer.name].generated = deepMerge(config[writer.name].generated, blockConfig);
        }
      } else {
        config[writer.name].generated = deepMerge(config[writer.name].generated, blockConfig);
      }
      context.inDir = context.outDir;
      context.inFiles = context.outFiles;
      context.resolveInFile = resolveTempFile;
      context.outFiles = [];
      context.options = null;
    });

    context.inDir = searchPath[0];
    context.inFiles = block.src;
    context.resolveInFile = resolveInFile;

    if (self.postprocessors.hasOwnProperty(block.type)) {
      self.postprocessors[block.type].forEach(function (pp) {
        config[pp.name] = config[pp.name] || {};
        context.options = config[pp.name];
        config[pp.name] = _.extend(config[pp.name], pp.createConfig(context, block));
        context.options = null;
      });
    }
  });

  return config;
};
