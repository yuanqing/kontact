'use strict';

var gulp = require('gulp');
var browserify = require('gulp-browserify');
var jshint = require('gulp-jshint');
var karma = require('karma').server;
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

var paths = {
  dir: 'js/',
  src: 'js/kontact.js',
  distFile: 'kontact.min.js',
  test: ['js/test/spec/**/*.spec.js'],
  karma: __dirname + '/js/test/karma.conf.js',
  coverage: 'coverage/'
};

gulp.task('lint', function() {
  return gulp.src(paths.test.concat([paths.src, __filename]))
    .pipe(plumber())
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('dist', function() {
  return gulp.src(paths.src)
    .pipe(plumber())
    .pipe(browserify({
      insertGlobals: false,
      debug: false,
      standalone: 'kontact'
    }))
    .pipe(uglify())
    .pipe(rename(paths.distFile))
    .pipe(gulp.dest(paths.dir));
});

gulp.task('test', ['dist'], function(done) {
  karma.start({
    configFile: paths.karma,
    singleRun: true
  }, done);
});

gulp.task('tdd', function() {
  gulp.watch(paths.test.concat([paths.src]), ['test']);
});

gulp.task('default', [
  'lint',
  'test'
]);