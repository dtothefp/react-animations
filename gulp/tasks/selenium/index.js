import {join} from 'path';
import {assign, isArray} from 'lodash';
import BrowserStackTunnel from 'browserstacktunnel-wrapper';
import selenium from 'selenium-standalone';
import install from './install';
import spawn from './spawn-process';

export default function(gulp, plugins, config) {
  const SELENIUM_VERSION = '2.47.0';
  const {gutil} = plugins;
  const {PluginError} = gutil;
  const {ENV, file, sources, environment, utils, browser, pkg} = config;
  const {name, version} = pkg;
  const {devHost, devPort, hotPort} = sources;
  const {getTaskName} = utils;
  const {isDev} = environment;
  const specGlob = '**/*-spec';
  const specs = [ join('test/e2e/', `${file || specGlob}.js`) ];
  const caps = [
    {
      browserName: 'firefox'
    },
    {
      browserName: 'chrome'
    }
  ];
  const capabilities = browser ?
    caps.filter( cap => cap.browserName === browser) :
    caps;

  const groupConfig = {
    project: name,
    build: version,
    name: file || 'e2e'
  };

  const baseConfig = {
    browser,
    ENV,
    specs,
    capabilities,
    baseUrl: `${devHost}:${devPort}`
  };

  function runWebdriver(opts, task) {
    gutil.log(gutil.colors.magenta(`Starting Parallel Tests for ${task}`));
    return spawn(opts);
  }

  function addCaps(opts) {
    let bsOpts = {
      host: 'hub.browserstack.com',
      port: 80,
      user: process.env.BROWSERSTACK_USERNAME,
      key: process.env.BROWSERSTACK_API,
      logLevel: 'silent'
    };

    let capabilities = baseConfig.capabilities.map(cap => {
      return assign({}, cap, opts.capabilities, groupConfig);
    });

    return assign({}, baseConfig, bsOpts, opts, {capabilities});
  }

  const tunnelConfig = {
    capabilities: {
      'browserstack.local': 'true',
      'browserstack.debug': 'true'
    },
    baseUrl: `${devHost}:${devPort}`
  };

  const remoteConfig = {
    capabilities: {
      'browserstack.debug': 'true'
    },
    baseUrl: 'http://hrc.dev.thegroundwork.com'
  };

  return (cb) => {
    let taskName = gulp.currentTask;
    let split = getTaskName(taskName);
    let task, suffix;

    if (isArray(split)) {
      task = split[0];
      suffix = split[1];
    } else {
      task = split;
    }

    if (task === 'tunnel') {
      let options = addCaps(tunnelConfig);
      /**
       * gulp selenium:tunnel
       * Start a Browserstack tunnel to allow using local IP's for
       * Browserstack tests (Automate) and live viewing (Live)
       */
      let browserStackTunnel = new BrowserStackTunnel({
        key: process.env.BROWSERSTACK_API,
        hosts: [
          {
            name: devHost,
            port: devPort,
            sslFlag: 0
          },
          {
            name: devHost,
            port: hotPort,
            sslFlag: 0
          }
        ],
        v: true,
        //important to omit identifier
        //localIdentifier: 'my_tunnel', // optionally set the -localIdentifier option
        forcelocal: true
      });

      browserStackTunnel.on('started', () => {
        gutil.log(browserStackTunnel.stdoutData);
      });

      browserStackTunnel.start(function(error) {
        if (error) {
          gutil.log('[tunnel start]', error);
        } else {
          if (suffix && suffix === 'live') {
            gutil.log('Visit BrowserStack Live to QA: https://www.browserstack.com/start');
          } else {
            let cp = runWebdriver(options, task);

            cp.on('close', (code) => {
              browserStackTunnel.stop((err) => {
                if (err) {
                  gutil.log(err);
                }
                console.log(`Child process closed status: ${code}`);
                cp.kill();
                process.exit(code);
              });
            });
          }
        }
      });
    } else if (isDev) {
      let options = baseConfig;

      install({
        version: SELENIUM_VERSION
      }, () => {
        selenium.start({
          spawnOptions: {
            version: SELENIUM_VERSION,
            stdio: 'ignore'
          }
        }, (err, child) => {
          if (err) {
            throw new PluginError({
              plugin: '[selenium]',
              message: `${err.message} => ps aux | grep selenium and kill process id`
            });
          }

          let cp = runWebdriver(options, 'local');

          cp.on('close', (code) => {
            console.log(`Child process closed status: ${code}`);
            child.kill();
            process.exit(code);
          });
        });
      });
    } else {
      let options = addCaps(remoteConfig);
      let cp = runWebdriver(options, 'remote');

      cp.on('close', (code) => {
        console.log(`Child process closed status: ${code}`);
        cb();
      });
    }
  };
}
