const gulp = require('gulp'),
      $ = require('gulp-load-plugins')({
        pattern: ['*'],
        scope: ['devDependencies']
      });

require('dotenv').config({path: './.env'})

const ftpConf = {
  host:     process.env.FTP_HOST,
  user:     process.env.FTP_USER,
  password: process.env.FTP_PASS,
  //log:      gutil.log,
  parallel: 10
};

const ftpConn = $.vinylFtp.create(ftpConf),
      ftpPath = process.env.FTP_PATH;

gulp.task('deploy-manifest', function() {
  const globs = [
          './manifest/**'
        ];

  return gulp.src(globs, { base: '.', buffer: false })
    .pipe(ftpConn.dest(ftpPath));
});

gulp.task('deploy-public', function() {
  const globs = [
          './public/js/**',
          './public/css/**'
        ];

  return gulp.src(globs, { base: './public', buffer: false })
    .pipe(ftpConn.dest(ftpPath));
});

gulp.task('deploy',  gulp.series('deploy-manifest', 'deploy-public'));


// Remove

gulp.task('d-deploy-manifest', function(cb) {
  ftpConn.rmdir(ftpPath + 'manifest', cb);
});

gulp.task('d-deploy-js', function(cb) {
  ftpConn.rmdir(ftpPath + 'js', cb);
});

gulp.task('d-deploy-css', function(cb) {
  ftpConn.rmdir(ftpPath + 'css', cb);
});

gulp.task('d-deploy',  gulp.series('d-deploy-manifest', 'd-deploy-js', 'd-deploy-css'));