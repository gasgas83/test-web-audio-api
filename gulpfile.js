var gulp = require('gulp');
var sass = require('gulp-sass');
var browserSync = require('browser-sync').create();
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var gulpIf = require('gulp-if');
var cssnano = require('gulp-cssnano');
var imagemin = require('gulp-imagemin');
var cache = require('gulp-cache');
var del = require('del');
var runSequence = require('run-sequence');
const gulpDeployFtp = require('gulp-deploy-ftp');

var php = require('gulp-connect-php'); //for PHP server



gulp.task('sass', function() {
  return gulp.src('app/scss/**/*.scss') // Gets all files ending with .scss in app/scss
    .pipe(sass())
    .pipe(gulp.dest('app/css'))
    .pipe(browserSync.reload({
      stream: true
    }))
});

gulp.task('php', function() {
    php.server({ base: 'app', port: 8010, keepalive: true});
});

gulp.task('server',['php'], function() {  //reload de browser en desarrollo
    browserSync.init({
      // server: {
      //   baseDir: 'app',
      // },
      open: false,
      proxy: '127.0.0.1:8010',
      port:8080
    })
})

gulp.task('phpbuild', function() {
    php.server({ base: 'build', port: 8010, keepalive: true});
});


gulp.task('serverbuild', ['phpbuild'], function() {  //server de build
    browserSync.init({
      // server: {
      //   baseDir: 'build',
      // },
      proxy: '127.0.0.1:8010',
      open: false,
      port:9000
    })
})

gulp.task('default', ['server', 'sass'], function (){  //crea un server
  gulp.watch('app/scss/**/*.scss', ['sass']);
  gulp.watch('app/*.html', browserSync.reload); 
  gulp.watch('app/js/**/*.js', browserSync.reload);
  gulp.watch('app/*.php', browserSync.reload);
  // Other watchers
})

gulp.task('server_build', ['serverbuild'], function (){  //crea un server de build
  gulp.watch('build/*.*', browserSync.reload);
  // Other watchers
})



gulp.task('images', function(){ // optimiza imagenes
  return gulp.src('app/img/**/*.+(png|jpg|jpeg|gif|svg)')
  // Caching images that ran through imagemin
  .pipe(cache(imagemin({
      interlaced: true
    })))
  .pipe(gulp.dest('build/img'))
});


gulp.task('copiar', function(){ // hace el build
  return gulp.src('app/*.*')
    .pipe(useref())
    .pipe(gulpIf('*.css', cssnano()))
    .pipe(gulpIf('*.js', uglify()))
    .pipe(gulp.dest('build'))
});


gulp.task('clean:build', function() { // limpia archivos no usados del build
  return del.sync('build');
})

gulp.task('build', function (callback) {
  runSequence('clean:build', 
    ['sass', 'copiar', 'images'],
    callback
  )
})

gulp.task('deploy', function () {
  return gulp.src('build/*.*')
      .pipe(gulpDeployFtp({
        remotePath: '/prueba',
        host: '185.28.21.195',
        port: 21,
        user: 'u924475518',
        pass: 'Beto2014'
      }))
      .pipe(gulp.dest('dest'));
})

