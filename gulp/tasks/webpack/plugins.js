import ExtractTextPlugin from 'extract-text-webpack-plugin';
import webpack from 'webpack';

export default function(opts) {
  const {DEBUG, TEST, file, release} = opts;
  let cssBundle = 'css/[name].css';

  let plugins = [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jquery': 'jquery'
    }),
    new webpack.NoErrorsPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(DEBUG || TEST ? 'development' : 'production'),
        TEST_FILE: file ? JSON.stringify(file) : null
      }
    }),
    new ExtractTextPlugin(cssBundle, {
      allChunks: true
    })
  ];

  let prodPlugins = [
    new webpack.optimize.DedupePlugin()
  ];

  let releasePlugins = [
    new webpack.BannerPlugin(
      'try{require("source-map-support").install();}\ncatch(err) {}',
      { raw: true, entryOnly: false }
    )
  ];

  if (!DEBUG || !TEST) {
    plugins.push(...prodPlugins);
  }

  if (release) {
    plugins.push(...releasePlugins);
  }

  return plugins;
}


