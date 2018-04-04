const gulp = require('gulp'),
      $ = require('gulp-load-plugins')({
        pattern: ['*'],
        scope: ['devDependencies']
      });

const isPublic = process.env.NODE_ENV ? process.env.NODE_ENV.trim() == 'production' : false;

function getTask(task) {
  return require('./' + task)(gulp, $);
}


// Build Vendor

gulp.task('clean-vendor', function() {
  return $.del([
    'frontend/js/vendor.js'
  ]);
});

gulp.task('js-vendor', function() {
  $.fancyLog('-> Building vendor');

  return gulp.src([
    'frontend/js/vendor/**'
  ])
    .pipe($.concat('vendor.js'))
    .pipe(gulp.dest('frontend/js/'));
});

gulp.task('vendor', 
  gulp.series(
    'clean-vendor',
    'js-vendor'
  )
);


// Public Scripts

gulp.task('public-scripts', function() {
  $.fancyLog('-> Building scripts');

  const f = $.filter(['frontend/js/*.js', '!frontend/js/vendor.js'], {restore: true});

  if (isPublic) {
    return gulp.src([
      'frontend/js/*.js'
    ])
      .pipe(f)
      .pipe($.babel({
        presets: ['env']
      }))
      .pipe(f.restore)
      .pipe($.uglify())
      .pipe($.rev())
      .pipe(gulp.dest('public/js/'))
      .pipe($.rev.manifest())
      .pipe(gulp.dest('manifest'))
  } else {
    return gulp.src([
      'frontend/js/*.js'
    ])
      .pipe(gulp.dest('public/js/'))
  }
});


// Public Styles

gulp.task('public-styles', function() {
  $.fancyLog('-> Building styles');

  if (isPublic) {
    return gulp.src('frontend/css/main.sass')
      .pipe($.sass({ 
        outputStyle: 'compressed' 
      }).on('error', $.sass.logError))
      .pipe($.autoprefixer({
        browsers: ['last 2 versions'],
        cascade: false
      }))
      .pipe($.rev())
      .pipe(gulp.dest('public/css/'))
      .pipe($.rev.manifest('manifest/rev-manifest.json', {
        base: 'manifest',
        merge: true 
      }))
      .pipe(gulp.dest('manifest'));
  } else {
    return gulp.src('frontend/css/main.sass')
      .pipe($.plumber())
      .pipe($.sourcemaps.init())
      .pipe($.sass().on('error', $.sass.logError))
      .pipe($.sourcemaps.write())
      .pipe(gulp.dest('public/css/'))
  }
});


// Manifest

gulp.task('manifest', function(done) {
  $.fancyLog('-> Manifest');

  const manifest = isPublic ? gulp.src('manifest/rev-manifest.json') : '';

  return gulp.src('public/*.html')
    .pipe($.if(isPublic, $.revReplace({manifest: manifest, replaceInExtensions: ['.html']})))
    .pipe(gulp.dest('public'));
});


// HTML & Assets

gulp.task('html', function() {
  $.fancyLog('-> Copy html');

  return gulp.src('frontend/*.pug')
  .pipe($.pug({
    pretty: true
  }))
  .pipe(gulp.dest('public'));
});

gulp.task('assets', function() {
  $.fancyLog('-> Copy assets');

  return gulp.src([
    'frontend/assets/**'
  ])
    .pipe($.cached('assets'))
    .pipe(gulp.dest('public/assets/'));
});


// Clean & Build Public

gulp.task('clean-public', function() {
  $.fancyLog('-> Clean');

  return $.del('public');
});

gulp.task('build-public', 
  gulp.series(
    'clean-public',
    'vendor',
    gulp.parallel('public-scripts', getTask('sprite')),
    gulp.parallel('public-styles', 'html', 'assets'),
    'manifest'
  )
);

gulp.task('public', function(cb) {
  $.fancyLog('-> Start ' + process.env.NODE_ENV.trim());

  if (isPublic) {
    gulp.series('build-public')(cb);
  } else {
    gulp.series(
      'build-public',
      gulp.parallel('watch', 'server')
    )(cb);
  }
});


// Watch

gulp.task('watch', function() {
  $.fancyLog('-> Run watch');

  gulp.watch('frontend/js/vendor/**', gulp.series('vendor'));
  gulp.watch(['frontend/js/**', '!frontend/js/vendor/**'], gulp.series('public-scripts'));
  
  gulp.watch('frontend/css/**', gulp.series('public-styles'));
  gulp.watch('frontend/*.pug', gulp.series('html'));
  gulp.watch('frontend/assets/images/icon/ui/sprite/**', gulp.series(getTask('sprite')));
  
  gulp.watch('frontend/assets/**', gulp.series('assets'));
});

gulp.task('server', function() {
  $.browserSync.init({
    server: {
      baseDir: 'public/'
    },
    open: false
  })

  $.browserSync.watch('public/**/*.*').on('change', $.browserSync.reload);
});