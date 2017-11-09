'use strict';

var config = {
    environment: 'development', // default
    src_folder : '/media/ricardo/Dados/TEMP/testes-voip/webphone-sip',

    development: function () {
        return this.environment === 'development';
    },
    production: function () {
        return this.environment === 'production';
    }
};

var gulp = require('gulp'),
    useref = require('gulp-useref'),
    gulpif = require('gulp-if'),
    rename = require("gulp-rename"),
    uglify = require('gulp-uglify'),
    minifyCss = require('gulp-clean-css');

gulp.task('copy-deps', function() {
     // return gulp.src('../opendevice-clients/opendevice-js/dist/js/opendevice.js').pipe(gulp.dest(config.src_folder + "/js"));
});

gulp.task('build', function () {
    return gulp.src(config.src_folder+'/index.src.html')
        .pipe(rename('index.html'))
        .pipe(gulpif(config.production(), useref({ searchPath: config.src_folder , newLine : '\n/* ---------- */\n'})))
        // .pipe(gulpif(config.production(), gulpif('*.js', uglify())))
        .pipe(gulpif('*.css', minifyCss()))
        .pipe(gulp.dest(config.src_folder));
});


gulp.task('generate-service-worker', function(callback) {
        // var swPrecache = require('sw-precache');
        // var swConfig = require('./sw-precache-config.js');
        // if(config.development()){
        //     swConfig.handleFetch = false;
        //     swConfig.staticFileGlobs = [];
        // }
        // swPrecache.write(config.src_folder+'/service-worker.js', swConfig, callback);
});

gulp.task('build:production', ['set-production', 'build']);

gulp.task('set-production', function () {
    config.environment = 'production';
});

