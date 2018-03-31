const gulp = require('gulp'),
      $ = require('gulp-load-plugins')({
        pattern: ['*'],
        scope: ['devDependencies']
      });

module.exports = function (gulp, plugins) {
  return function () { 
    return gulp.src('frontend/images/icon/ui/sprite/*.svg')
      .pipe($.svgSprites(
          {
            common: 'svg-sp',
            selector: 'svg-sp_%f',
            preview: false,
            svg: {
              sprite: 'sprite.svg'
            },
            svgPath: '../images/icon/ui/sprite.svg',
            pngPath: '',
            cssFile: 'sprite.scss'
          }
      ))
      .pipe($.if('*.scss', gulp.dest('frontend/css/'), gulp.dest('frontend/images/icon/ui/')));
  }
};