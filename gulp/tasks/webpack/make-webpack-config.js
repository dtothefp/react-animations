import {includePaths, utils as pantSuitUtils} from '@hfa/pantsuit';
import makeEslintConfig from '@hfa/eslint-config';
import {assign, merge, omit} from 'lodash';
import {join} from 'path';
import webpack from 'webpack';
import autoprefixer from 'autoprefixer-core';
import formatter from 'eslint-friendly-formatter';
import makeLoaders from './loaders';
import makePlugins from './plugins';
import getCommonjsMods from './gather-commonjs-mods.js';

export default function(config) {
  const {
    ENV,
    file,
    release,
    quick,
    sources,
    isMainTask,
    utils,
    environment,
    publicPath
  } = config;
  const {
    entry,
    srcDir,
    buildDir,
    hotPort,
    devHost,
    libraryName,
    globalBundleName,
    mainBundleName
  } = sources;
  const {isDev} = environment;
  const apConfig = pantSuitUtils.autoprefixer(isDev);
  const {addbase} = utils;
  const DEBUG = ENV === 'development';
  const TEST = ENV === 'test';
  const filename = '[name].js';
  let externals = {
    jquery: 'window.jQuery'
  };

  const {rules, configFile} = makeEslintConfig({
    isDev,
    lintEnv: 'web'
  });

  const expose = entry.main.map( fp => {
    return {
      libraryName,
      test: addbase(srcDir, fp)
    };
  })[0];

  const {preLoaders, loaders} = makeLoaders({
    DEBUG,
    TEST,
    expose,
    extract: !isMainTask,
    includePaths,
    quick
  });

  const plugins = makePlugins({
    DEBUG,
    TEST,
    file,
    release
  });

  const defaultConfig = {
    externals: release ? assign({}, externals, getCommonjsMods()) : externals,
    resolve: {
      extensions: [
        '',
        '.js',
        '.json',
        '.jsx',
        '.html',
        '.css',
        '.scss',
        '.yaml',
        '.yml'
      ]
    },
    node: {
      dns: 'mock',
      net: 'mock',
      fs: 'empty'
    }
  };

  const configFn = {
    development(isProd) {
      let devPlugins = [
        new webpack.HotModuleReplacementPlugin()
      ];
      let hotEntry = [
        `webpack-dev-server/client?${devHost}:${hotPort}`,
        'webpack/hot/dev-server',
        'webpack/hot/only-dev-server'
      ];
      let taskEntry;

      if (isMainTask) {
        let {main} = omit(entry, globalBundleName);

        if (!isProd) {
          main.push(...hotEntry);
          plugins.push(...devPlugins);
        }
        taskEntry = assign({}, {main});
      } else {
        taskEntry = omit(entry, mainBundleName);
      }

      let devConfig = {
        context: addbase(srcDir),
        cache: DEBUG,
        debug: DEBUG,
        entry: taskEntry,
        output: {
          path: addbase(buildDir),
          publicPath,
          filename: join('js', filename)
        },
        eslint: {
          rules,
          configFile,
          formatter,
          emitError: true,
          emitWarning: true,
          failOnWarning: false,
          failOnError: false
        },
        module: {
          preLoaders: preLoaders,
          loaders: loaders
        },
        plugins,
        postcss: [
          autoprefixer(apConfig)
        ],
        devtool: 'source-map'
      };

      return merge({}, defaultConfig, devConfig);
    },

    production() {
      let makeDevConfig = this.development;
      let prodConfig = merge({}, makeDevConfig(true), {
        output: {
          library: libraryName,
          libraryTarget: 'umd'
        }
      });

      if (!quick) {
        prodConfig.plugins.push(
          new webpack.optimize.UglifyJsPlugin({
            output: {
              comments: false
            },
            compress: {
              warnings: false
            }
          })
        );
      }

      return prodConfig;
    },

    test() {
      let testConfig = {
        module: {
          loaders
        },
        plugins,
        watch: true,
        devtool: 'inline-source-map'
      };

      return merge({}, defaultConfig, testConfig);
    },

    ci() {
      let ciConfig = {
        // allow getting rid of the UglifyJsPlugin
        // https://github.com/webpack/webpack/issues/1079
        module: {
          loaders,
          postLoaders: [
            {
              test: /\.js$/,
              loader: 'uglify',
              exclude: /\-spec\.js$/
            }
          ]
        },
        plugins,
        'uglify-loader': {
          compress: {warnings: false}
        }
      };

      return merge({}, defaultConfig, ciConfig);
    }
  };

  return configFn[ENV]();
}
