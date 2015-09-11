import gulp from 'gulp';
import {tasks, config, plugins as $} from './gulp/config/make-gulp-config';

const {sources, utils, environment} = config;
const {isDev} = environment;
const {testDir, buildDir} = sources;
const {addbase} = utils;

gulp.task('browser-sync', tasks.browserSync);
gulp.task('clean', tasks.clean);
gulp.task('lint:test', tasks.eslint);
gulp.task('lint:build', tasks.eslint);
gulp.task('lint', ['lint:test', 'lint:build']);
gulp.task('webpack:global', tasks.webpack);
gulp.task('webpack:main', tasks.webpack);
gulp.task('webpack', ['webpack:global', 'webpack:main']);
gulp.task('karma', tasks.karma);
gulp.task('selenium', tasks.selenium);
gulp.task('selenium:tunnel', tasks.selenium);
gulp.task('selenium:tunnel:live', tasks.selenium);

gulp.task('build', (cb) => {
  if (isDev) {
    $.sequence(
      ['clean', 'lint'],
      'webpack',
      'browser-sync',
      cb
    );
  } else {
    $.sequence(
      ['clean', 'lint'],
      'webpack',
      cb
    );
  }
});

gulp.task('test:integration', (cb) => {
  $.sequence(
    'lint',
    'karma',
    cb
  );
});

gulp.task('test:e2e', (cb) => {
  $.sequence(
    'lint',
    'selenium',
    cb
  );
});

gulp.task('test:tunnel', (cb) => {
  $.sequence(
    'lint',
    'selenium:tunnel',
    cb
  );
});

gulp.task('test:tunnel:live', (cb) => {
  $.sequence(
    'lint',
    'selenium:tunnel:live',
    cb
  );
});

gulp.task('default', ['build']);

gulp.task('watch', ['build'], () => {
  gulp.watch(addbase(buildDir, '{js/,css/,}**/*.{js,css,html}'), $.browserSync.reload);
  gulp.watch([
    addbase(testDir, '**/*.js'),
    addbase(buildDir, '**/*.js')
  ], ['lint']);
});
