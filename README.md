# grunt-usemin [![Build Status](https://secure.travis-ci.org/yeoman/grunt-usemin.png?branch=master)](http://travis-ci.org/yeoman/grunt-usemin)

> Replaces references to non-optimized scripts or stylesheets into a set of HTML files (or any templates/views).

## Getting Started
_If you haven't used [grunt][] before, be sure to check out the [Getting Started][] guide._

From the same directory as your project's [Gruntfile][Getting Started] and [package.json][], install this plugin with the following command:

```bash
npm install grunt-usemin
```

Once that's done, add this line to your project's Gruntfile:

```js
grunt.loadNpmTasks('grunt-usemin');
```

If the plugin has been installed correctly, running `grunt --help` at the command line should list the newly-installed plugin's task or tasks. In addition, the plugin should be listed in package.json as a `devDependency`, which ensures that it will be installed whenever the `npm install` command is run.

[grunt]: http://gruntjs.com/
[Getting Started]: https://github.com/gruntjs/grunt/blob/devel/docs/getting_started.md
[package.json]: https://npmjs.org/doc/json.html

## The usemin-handler task

A special task which uses the build block HTML comments in markup to get back the list of files to handle, and initialize the grunt configuration appropriately, and automatically.

Custom HTML "block" comments are provided as an API for interacting with the build script. These comments adhere to the following pattern:

```
     <!-- build:<type> <path> -->
       ... HTML Markup, list of script / link tags.
     <!-- endbuild -->
```

 - type: is either js or css.
 - path: is the file path of the optimized file, the target output.

 An example of this in completed form can be seen below:

```
    <!-- build:js js/app.js -->
      <script src="js/app.js"></script>
      <script src="js/controllers/thing-controller.js"></script>
      <script src="js/models/thing-model.js"></script>
      <script src="js/views/thing-view.js"></script>
    <!-- endbuild -->
```

 Internally, the task parses your HTML markup to find each of these blocks, and initializes for you the corresponding Grunt config for the concat / min tasks
 when `type=js`, the concat / css tasks when `type=css`.

 The task also handles use of RequireJS, for the scenario where you specify the main entry point for your application using the "data-main" attribute
 as follows:

```
     <!-- build:js js/app.min.js -->
     <script data-main="js/main" src="js/vendor/require.js"></script>
     <!-- -->
```

One doesn't need to specify a concat/min/css or rjs configuration anymore.

It is using only one target: `html`, with a list of the concerned files. For example, in your `Gruntfile.js`:

```
    'usemin-handler': {
      html: 'index.html'
    }
```

## The usemin task

This task is responsible for replacing in HTML and CSS files, references to non-minified files with reference to their minified/revved version if they are found on the disk.

```
    usemin: {
      html: ['**/*.html'],
      css: ['**/*.css']
    }
```





