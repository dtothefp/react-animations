import {assign, isFunction} from 'lodash';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import makeConfig from './make-webpack-config';

export default function(gulp, plugins, config) {
  const {sources, utils, environment} = config;
  const {isDev} = environment;
  const {addbase, getTaskName} = utils;
  const {mainBundleName, buildDir, hotPort, devPort, devHost} = sources;
  const {gutil} = plugins;

  return (cb) => {
    const task = getTaskName(gulp.currentTask);
    const isMainTask = task === mainBundleName;
    const publicPath = isDev && task === 'global' ? `http://${devHost}:${devPort}` : '';
    const webpackConfig = makeConfig(assign({}, config, {isMainTask, publicPath}));
    const compiler = webpack(webpackConfig);

    function logger(err, stats) {
      if (err) {
        throw new new gutil.PluginError({
          plugin: `[webpack]`,
          message: err.message
        });
      }

      if (!isDev) {
        gutil.log(stats.toString());
      }
    }

    compiler.plugin('compile', () => {
      gutil.log(`Webpack Bundling ${task} bundle`);
    });

    compiler.plugin('done', (stats) => {
      gutil.log(`Webpack Bundled ${task} bundle in ${stats.endTime - stats.startTime}ms`);

      if (stats.hasErrors() || stats.hasWarnings()) {
        const {errors, warnings} = stats.toJson({errorDetails: true});

        [errors, warnings].forEach((stat, i) => {
          let type = i ? 'warning' : 'error';
          if (stat.length) {
            gutil.log(`[webpack: ${task} bundle ${type}]`, stats.toString());
          }
        });

        if (!isDev) {
          process.exit(1);
        }
      }

      //avoid multiple calls of gulp callback
      if (isFunction(cb)) {
        let gulpCb = cb;
        cb = null;

        gulpCb();
      }
    });

    if (isDev) {
      if (task === 'global') {
        compiler.watch({
          aggregateTimeout: 300,
          poll: true
        }, logger);
      } else {
        new WebpackDevServer(compiler, {
          contentBase: addbase(buildDir),
          // TODO: figure out why can't use publicPath as absolute path when proxying wepback dev server
          publicPath,
          hot: true,
          quiet: false,
          noInfo: true,
          watchOptions: {
            aggregateTimeout: 300,
            poll: 1000
          },
          headers: { 'X-Custom-Header': 'yes' },
          stats: { colors: true }
        }).listen(hotPort, devHost, () => {});
      }
    } else {
      compiler.run(logger);
    }
  };
}
