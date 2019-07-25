import { browser, logging, protractor, by, element, Capabilities, Key } from 'protractor';
import { AppPage } from './app.po';
const request = require('request');
const fs = require('fs');
const requestOptions = {
  method: 'GET',
  url: browser.params.login.token,
  headers: {
    'content-type': 'application/x-www-form-urlencoded'
  },
  form: {
    grant_type: 'client_credentials',
    client_id: browser.params.login.clientId,
    client_secret: browser.params.login.clientSecret,
    scope: browser.params.login.scope
  }
};
const get = (options: any): any => {
  const defer = protractor.promise.defer();

  request(options, (error, message) => {
    console.log(JSON.stringify(error));
    console.log(JSON.stringify(message));
    if (error || message.statusCode >= 400) {
      defer.reject({ error, message });
    } else {
      defer.fulfill(message);
    }
  });
  return defer.promise;
};
const EC = protractor.ExpectedConditions;


// tslint:disable-next-line:only-arrow-functions
describe('ExpenseApp:', function() {
  afterEach(() => {
    browser.manage().logs().get('browser').then((messages) => {
      messages.forEach((message) => {
        console.log(JSON.stringify(message));
      });
    });
  });

  it('should login and authenticate', () => {
    browser.waitForAngularEnabled(false);
    const setupCommon = (): any => {
      return get(requestOptions);
    };
    const flow = protractor.promise.controlFlow();
    flow.execute(setupCommon).then((response) => {
      const responseBody = JSON.parse((response as any).body);
      browser.get('/auth/' + encodeURI(JSON.stringify(responseBody))).then((() => {
          browser.getPageSource().then((text: string) => {
            fs.writeFile('index.html', text, ((err: any) => {
              if (err) { fail(err); }
            }));
          });
        }),
        ((reason: any) => {
          console.log(reason);
        }));
    });
  });

  it('should have claim heading ', () => {
    browser.get('/').then((value: any) => {
      // browser.wait(EC.titleContains('Purchase2Pay'));
      expect(element(by.cssContainingText('h5', 'Declaratie Indienen ')));
      browser.getPageSource().then((text: string) => {
        fs.writeFile('index.html', text, ((err: any) => {
          if (err) { fail(err); }
        }));
        expect(element(by.css('input[name=amount]')));
      });
    },
      (reason: any) => {
        console.log('Failure');
        fail(reason);
      });
  });
});
