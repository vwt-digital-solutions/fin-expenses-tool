import {browser, logging, protractor, by, element, Capabilities, Key} from 'protractor';
import {AppPage} from './app.po';
import {config} from 'rxjs';
import {url} from 'inspector';

const request = require('request');
const fs = require('fs');
const requestOptions = {
  method: 'GET',
  url: browser.params.login.token,
  headers: {
    'content-type': 'application/json'
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
      defer.reject({error, message});
    } else {
      defer.fulfill(message);
    }
  });
  return defer.promise;
};
const EC = protractor.ExpectedConditions;
const until = protractor.ExpectedConditions;
let expenseID;

describe('ExpenseApp:', () => {
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
              if (err) {
                fail(err);
              }
            }));
          });
        }),
        ((reason: any) => {
          console.log(reason);
        }));
    });
  });

  it('should open the landing page', () => {
    browser.waitForAngularEnabled(false);
    expect(element(by.css('h1')).getText()).toEqual('MIJN DECLARATIES');
    browser.sleep(1000);
  });

  it('should get the open expenses', () => {
    browser.waitForAngularEnabled(false);
    browser.sleep(1000);
    const expenseList = element.all(by.css('li'));
    expect(expenseList.count()).toBeGreaterThanOrEqual(1);
  });

  it('should get the cost-types', () => {
    browser.waitForAngularEnabled(false);
    element(by.name('expenses')).click();
    browser.sleep(1000);
    const typeList = element.all(by.css('option'));
    expect(typeList.count()).toEqual(29 + 1); // 29 Types + 1 Text
  });

  it('should create an expense', () => {
    browser.waitForAngularEnabled(false);
    element(by.id('amountinput')).sendKeys(Math.floor(Math.random() * 50));
    const typeList = element(by.id('typeinput')).all(by.tagName('option'));
    typeList.count().then(numberOfItems => Math.floor(Math.random() * (numberOfItems - 1))).then(randomNumber => {
      typeList.get(randomNumber + 1).click();
    });
    const today = new Date();
    element(by.id('dateinput')).sendKeys(today.getDate(), today.getMonth(), today.getFullYear());
    element(by.id('noteinput')).sendKeys('E2E Addition');
    const path = require('path');
    // tslint:disable-next-line:one-variable-per-declaration
    const file = 'assets/betaald.png',
      absolutePath = path.resolve(__dirname, file);
    element(by.id('attachmentinput')).sendKeys(absolutePath);
    element(by.id('submit-click')).click();
    const elem = element(by.id('succes-alert'));
    browser.wait(until.visibilityOf(elem), 10000, 'Expense creation took too long').then(() => {
      elem.getText().then(text => {
        expenseID = text.split(' ').slice(-1)[0];
      });
    });
    expect(elem.isDisplayed()).toBe(true);
  });

  it('should get expenses on process', () => {
    browser.waitForAngularEnabled(false);
    expect(browser.wait(until.urlContains('/home'), 10000, 'Redirect took too long'));
    element(by.name('expenses/process')).click();
    browser.sleep(1000);
    const expenseList = element.all(by.id('information-icon'));
    expect(expenseList.count()).toBeGreaterThanOrEqual(1);
  });

  it('should get the attachments', () => {
    browser.waitForAngularEnabled(false);
    element(by.id(expenseID.toString())).element(by.xpath('ancestor::div')).click();
    browser.sleep(2000);
    const attachmentList = element.all(by.css('.click-stop'));
    expect(attachmentList.count()).toBeGreaterThanOrEqual(1);
  });

  it('should reject the expense', () => {
    browser.waitForAngularEnabled(false);
    element(by.id('thumbs-down')).click();
    browser.sleep(500);
    element(by.id('thumbs-down-rejecting')).click();
    expect(browser.wait(until.invisibilityOf(element(by.css('.modal-content'))), 10000, 'Expense rejection took too long'));
    // expect(element(by.css('.modal-content')).isDisplayed()).toBe(false);
  });
});
