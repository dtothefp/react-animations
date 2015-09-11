require('babel/register')({
  experimental: true
});

var assign = require('lodash').assign;
var options = JSON.parse(process.env.WDIO_CONFIG);
var config = {
  coloredLogs: true,
  waitforTimeout: 10000,
  framework: 'mocha',
  reporter: 'spec',
  reporterOptions: {
    outputDir: './'
  },
  mochaOpts: {
    ui: 'bdd'
  },

  /**
   * hooks
   */
  onPrepare: function() {
    console.log('WDIO CLI test runner starting');
  },
  onComplete: function() {
    console.log('WDIO CLI test runner finished');
  }
};

exports.config = assign({}, config, options);
