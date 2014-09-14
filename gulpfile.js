'use strict';

var gulp = require('gulp');
var browserify = require('gulp-browserify');
var jshint = require('gulp-jshint');
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');
var rimraf = require('gulp-rimraf');
var uglify = require('gulp-uglify');
var karma = require('karma').server;

var paths = {
  src: ['js/src/*.js'],
  dist: 'js/dist/',
  karma: 'js/test/karma.conf.js',
  test: ['js/test/spec/**/*.spec.js']
};

gulp.task('clean', function() {
  return gulp.src(paths.dist, { read: false })
    .pipe(plumber())
    .pipe(rimraf());
});

gulp.task('dist', ['clean'], function() {
  return gulp.src(paths.src)
    .pipe(plumber())
    .pipe(browserify({
      insertGlobals: false,
      debug: true,
      standalone: 'kontact'
    }))
    .pipe(gulp.dest(paths.dist))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    .pipe(gulp.dest(paths.dist));
});

gulp.task('lint', function() {
  return gulp.src(paths.src.concat(paths.test, __filename))
    .pipe(plumber())
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('tdd', function() {
  gulp.watch(paths.src.concat(paths.test), ['lint', 'test']);
});

gulp.task('test', ['dist'], function(done) {
  karma.start({
    configFile: __dirname + '/js/test/karma.conf.js',
    singleRun: true
  }, done);
});

gulp.task('default', [
  'lint',
  'test'
]);
