const gulp = require("gulp"),
      $ = require("gulp-load-plugins")({
        pattern: ["*"],
        scope: ["devDependencies"]
      });

let public = true;

// Build Scripts

gulp.task('clean-vendor', function() {
  return $.del([
    'frontend/js/vendor.js'
  ]);
});

gulp.task('js-vendor', function() {
  $.fancyLog("-> Building vendor");

  return gulp.src([
    'frontend/js/vendor/**'
  ])
    .pipe($.concat('vendor.js'))
    .pipe(gulp.dest('frontend/js'));
});

gulp.task('vendor', 
  gulp.series(
    'clean-vendor',
    'js-vendor'
  )
);

// Public Scripts

gulp.task('public-scripts', function() {
  $.fancyLog("-> Building scripts");

  const f = $.filter(['frontend/js/*.js', '!frontend/js/vendor.js'], {restore: true});

  if (public) {
    return gulp.src(["frontend/js/*.js"])
      .pipe(f)
      .pipe($.babel({
        presets: ['env']
      }))
      .pipe(f.restore)
      .pipe($.uglify())
      .pipe($.rev())
      .pipe(gulp.dest("public/js/"))
      .pipe($.rev.manifest())
      .pipe(gulp.dest("manifest"))
  } else {
    return gulp.src(["frontend/js/*.js"])
      .pipe(gulp.dest("public/js/"))
  }
});

// Public Styles

gulp.task('public-styles', function() {
  $.fancyLog("-> Building styles");

  if (public) {
    return gulp.src('frontend/css/main.css')
      .pipe($.cleanCss())
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
    return gulp.src('frontend/css/main.css')
      .pipe($.cleanCss())
      .pipe(gulp.dest('public/css/'))
  }
});

// Manifest

gulp.task('manifest', function(done) {
  if (public) {
    $.fancyLog("-> Manifest");

    const manifest = gulp.src("manifest/rev-manifest.json");

    return gulp.src("public/*.html")
      .pipe($.revReplace({manifest: manifest, replaceInExtensions: ['.html']}))
      .pipe(gulp.dest("public"));
  } else {
    done();
  }
});

// HTML & Assets

gulp.task('html', function() {
  $.fancyLog("-> Copy html");

  return gulp.src([
    'frontend/*.html',
    '!frontend/_head.html'
  ])
    .pipe($.include())
    .pipe(gulp.dest('public'));
});

gulp.task('assets', function() {
  $.fancyLog("-> Copy assets");

  return gulp.src([
    'frontend/**',
    '!frontend/*.html',
    '!frontend/js/**',
    '!frontend/css/**',
  ])
    .pipe($.cached('assets'))
    .pipe(gulp.dest('public'));
});

// Clean & Build Public

gulp.task('clean-public', function() {
  $.fancyLog("-> Clean");

  return $.del('public');
});

gulp.task('build-public', 
  gulp.series(
    'clean-public',
    'vendor',
    'public-scripts',
    gulp.parallel('public-styles', 'html', 'assets'),
    'manifest'
  )
);

gulp.task('public', function(done) {
  done();

  public = true;

  gulp.series('build-public')();
});

// Dev

gulp.task('watch', function() {
  $.fancyLog("-> Run watch");

  gulp.watch('frontend/js/vendor/**', gulp.series('vendor'));
  gulp.watch([
    'frontend/js/**',
    '!frontend/js/vendor/**'
  ], gulp.series('public-scripts'));
  gulp.watch('frontend/css/**', gulp.series('public-styles'));
  gulp.watch('frontend/*.html', gulp.series('html'));
  gulp.watch([
    'frontend/**',
    '!frontend/*.html',
    '!frontend/js/**',
    '!frontend/css/**',
  ], gulp.series('assets'));
});

gulp.task('server', function() {
  $.browserSync.init({
    server: {
      baseDir: 'public/'
    }
  })

  $.browserSync.watch('public/**/*.*').on('change', $.browserSync.reload);
});

gulp.task('dev', function(done) {
  done();

  public = false;

  gulp.series(
    'build-public',
    gulp.parallel('watch', 'server')
  )();
});