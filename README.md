# grunt-usemin [![Build Status](https://secure.travis-ci.org/yeoman/grunt-usemin.png?branch=master)](http://travis-ci.org/yeoman/grunt-usemin)

> Replaces references to non-optimized scripts or stylesheets into a set of HTML files (or any templates/views).

Watch out, this task is designed for Grunt 0.4 and upwards.

## Getting Started
If you haven't used [grunt][] before, be sure to check out the [Getting Started][] guide, as it explains how to create a [gruntfile][Getting Started] as well as install and use grunt plugins. Once you're familiar with that process, install this plugin with this command:

```shell
npm install grunt-usemin --save-dev
```

[grunt]: http://gruntjs.com/
[Getting Started]: https://github.com/gruntjs/grunt/blob/devel/docs/getting_started.md

## Workflow

usemin is composed of 2 different tasks (`useminPrepare` and `usemin`) that are part of the same workflow:

- **useminPrepare**: detects special construction (blocks) in the HTML files and update the `grunt` config to run `concat`/`uglify`/`cssmin`/`requirejs` on the files referenced in the block. It does not changes the HTML files it is working on.
- **usemin**: in the HTML and CSS files it treats, it replaces the blocks by a reference to a single file, as well as all references to images, scripts, CSS files, by their minified/revved/.. version if it is found on the disk. As such this target rewrites the HTML and CSS files it is working on.

Usually, `useminPrepare` is launched first, then the `concat`, `uglify`, `cssmin` and `requirejs` tasks are launched (they will created the minified/revved version of the referenced files), and then, in the end `usemin` is launched.

## The useminPrepare task

A special task which uses the build block HTML comments in markup to get back the list of files to handle, and initialize the grunt configuration appropriately, and automatically.

Custom HTML "block" comments are provided as an API for interacting with the build script. These comments adhere to the following pattern:

```html
<!-- build:<type>(alternate search path) <path> -->
... HTML Markup, list of script / link tags.
<!-- endbuild -->
```

- **type**: either `js` or `css`
- ** alternate search path **: (optional) By default the input files are relative to the treated file. Alternate search path allow to change that
- **path**: the file path of the optimized file, the target output

An example of this in completed form can be seen below:

```html
<!-- build:js js/app.js -->
<script src="js/app.js"></script>
<script src="js/controllers/thing-controller.js"></script>
<script src="js/models/thing-model.js"></script>
<script src="js/views/thing-view.js"></script>
<!-- endbuild -->
```

Internally, the task parses your HTML markup to find each of these blocks, and initializes for you the corresponding Grunt config for the concat / uglify tasks when `type=js`, the concat / cssmin tasks when `type=css`.

The task also handles use of RequireJS, for the scenario where you specify the main entry point for your application using the "data-main" attribute as follows:

```html
<!-- build:js js/app.min.js -->
<script data-main="js/main" src="js/vendor/require.js"></script>
<!-- -->
```

One doesn't need to specify a concat/uglify/cssmin or RequireJS configuration anymore.

It is using only one target: `html`, with a list of the concerned files. For example, in your `Gruntfile.js`:

```js
'useminPrepare': {
  html: 'index.html'
}
```

### Options

#### uglify
Type: 'string'
Default: 'uglify'

Name of the tool used to uglify the JavaScript.

#### cssmin
Type: 'string'
Default: 'cssmin'

Name of the tool used to minify the CSS.

### dest
Type: 'string'
Default: nil

Base directory where the transformed files should be output.

## The usemin task

This task is responsible for replacing in HTML and CSS files, references to non-minified files with reference to their minified/revved version if they are found on the disk.

```js
usemin: {
  html: ['**/*.html'],
  css: ['**/*.css'],
  options: {
    dirs: ['temp', 'dist']
  }
}
```
### dirs
Type: 'array of strings'
Default: nil

Used to limit the directories that will be looked for revved files when replacing reference. By default all subdirectories are looked at.

### basedir
Type: 'string'
Default: nil

Change the basedir that represent the location of the transformed file. For example, let's imagine you have someting like:

```
|
+--- styles
    \ main.css
+--- views
    \ index.html
```

By default, if the file to be transformed is `index.html`, the images, scripts, ... referenced by this file will be considered are being in the `views` directory, whereas they must be linked to the `styles` directory.

## License

[BSD license](http://opensource.org/licenses/bsd-license.php) and copyright Google
