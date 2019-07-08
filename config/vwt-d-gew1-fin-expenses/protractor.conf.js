// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

const { SpecReporter } = require('jasmine-spec-reporter');

exports.config = {
  allScriptsTimeout: 11000,
  specs: [
    './src/**/*.e2e-spec.ts'
  ],
  capabilities: {
    browserName: 'chrome',
    chromeOptions: {
      args: ["--no-sandbox", "--headless", "--hide-scrollbars", "--disable-gpu"]
    }
  },
  params: {
    login: {
      // loginUrl: 'https://login.microsoftonline.com/be36ab0a-ee39-47de-9356-a8a501a9c832/oauth2/v2.0/authorize',
      // token: 'https://login.microsoftonline.com/be36ab0a-ee39-47de-9356-a8a501a9c832/oauth2/v2.0/token',
      // clientSecret: 'clientSecret',
      // clientId: '7c8c8b4e-7ea4-40f7-964f-60147ece444d',
      scope: 'https://vwt-d-gew1-fin-expenses-e2e/.default'
    }
  },
  directConnect: true,
  baseUrl: 'http://localhost:4200/',
  seleniumAddress: 'http://localhost:4200/',
  framework: 'jasmine',
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000,
    print: function() {}
  },
  onPrepare() {
    require('ts-node').register({
      project: require('path').join(__dirname, './tsconfig.e2e.json')
    });
    jasmine.getEnv().addReporter(new SpecReporter({ spec: { displayStacktrace: true } }));
  }
};
