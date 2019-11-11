import {browser, protractor, by, element} from 'protractor/built';
import {ExpensesConfigService} from '../../src/app/services/config.service';

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
    if (error || message.statusCode >= 400) {
      defer.reject({error, message});
    } else {
      defer.fulfill(message);
    }
  });
  return defer.promise;
};
const until = protractor.ExpectedConditions;
let e2eID;

describe('ExpenseApp:', () => {
  let originalTimeout;

  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;

    browser.manage().logs().get('browser').then((messages) => {
      messages.forEach((message) => {
        console.log(JSON.stringify(message));
      });
    });
  });

  beforeEach(() => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;
    browser.manage().window().setSize(1600, 1000);
    browser.waitForAngularEnabled(false);
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
    browser.sleep(3000); // Wait for angular and loader
    expect(element(by.css('h1')).getText()).toEqual('MIJN DECLARATIES');
    browser.sleep(1000);
  });

  it('should get the open expenses', () => {
    browser.sleep(1000);
    browser.wait(until.visibilityOf(element(by.css('li'))), 20000, 'The API took too long to respond').then(() => {
      const expenseList = element.all(by.css('li'));
      expect(expenseList.count()).toBeGreaterThanOrEqual(1);
    });
  });

  it('should get the cost-types', () => {
    browser.sleep(1000);
    element(by.name('expenses')).click();
    browser.sleep(1000);
    expect(element.all(by.css('option')).count()).toEqual(29);
  });

  it('should create an expense', () => {
    element(by.id('amountinput')).sendKeys(100.99);
    browser.sleep(500);
    const typeList = element(by.id('typeinput')).all(by.tagName('option'));
    typeList.count().then(numberOfItems => Math.floor(Math.random() * (numberOfItems - 1))).then(randomNumber => {
      typeList.get(randomNumber + 1).click();
    });
    browser.sleep(500);
    const today = new Date();
    element(by.id('dateinput'))
      .sendKeys(today.getMonth() + 1 + '-' + today.getDate() + '-' + today.getUTCFullYear());
    e2eID = Math.random() * 100;
    browser.sleep(500);
    element(by.id('noteinput')).sendKeys('E2E Addition ' + e2eID);
    browser.sleep(500);
    const path = require('path');
    // tslint:disable-next-line:one-variable-per-declaration
    const file = 'assets/betaald.png',
      absolutePath = path.resolve(__dirname, file);
    element(by.id('attachmentinput')).sendKeys(absolutePath);
    browser.sleep(500);
    element(by.id('submit-click')).click();
    browser.wait(until.visibilityOf(element(by.id('succes-alert'))), 20000, 'Expense creation took too long');
    const elem = element(by.id('succes-alert'));
    expect(elem.isDisplayed()).toBe(true);
  });

  it('should get expenses on manager page', () => {
    browser.sleep(1000);
    expect(browser.wait(until.urlContains('/home'), 20000, 'Redirect took too long'));
    browser.sleep(1000);
    element(by.name('expenses/manage')).click();
    expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long'));
    browser.sleep(1000);
    expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long'));
    const expenseList = element.all(by.css('.ag-row'));
    expect(expenseList.count()).toBeGreaterThanOrEqual(1);
  });

  it('should get the manager attachments', () => {
    browser.sleep(3000);
    expect(browser.wait(until.visibilityOf(element(by.cssContainingText(`[role='gridcell'][col-id='note']`, 'E2E Addition ' + e2eID))),
      20000, 'Expense isn\'t shown on manager page'));
    element(by.cssContainingText(`[role='gridcell'][col-id='note']`, 'E2E Addition ' + e2eID)).click();
    browser.sleep(2000);
    expect(browser.wait(until.visibilityOf(element(by.css('.modal-content'))), 20000, 'Expense modal didn\'t open').then(() => {
      browser.sleep(2000);
      const attachmentList = element.all(by.css('.click-stop'));
      expect(attachmentList.count()).toBeGreaterThanOrEqual(1);
    }));
  });

  it('should approve the expense', () => {
    browser.sleep(1000);
    const elem = element(by.id('thumbs-up'));
    browser.wait(until.visibilityOf(elem), 20000, 'Expense approval form took too long to load').then(() => {
      elem.click();
    });
    expect(browser.wait(until.invisibilityOf(element(by.css('.modal-content'))), 20000, 'Expense approval took too long'));
    // expect(element(by.css('.modal-content')).isDisplayed()).toBe(false);
  });

  it('should get expenses on controller page', () => {
    browser.sleep(1000);
    browser.get('/home');
    expect(browser.wait(until.urlContains('/home'), 20000, 'Redirect took too long'));
    browser.sleep(3000);
    element(by.name('expenses/controller')).click();
    expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long'));
    browser.sleep(1000);
    expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long'));
    const expenseList = element.all(by.css('.ag-row'));
    expect(expenseList.count()).toBeGreaterThanOrEqual(1);
  });

  it('should see the expense on the controller page', () => {
    browser.sleep(1000);
    element(by.css('div[col-id=claim_date]')).click(); // Once
    browser.sleep(500);
    element(by.css('div[col-id=claim_date]')).click(); // Twice
    browser.sleep(500);
    element(by.cssContainingText(`[role='gridcell'][col-id='employee']`, 'E2E, Opensource')).click();
    expect(browser.wait(until.visibilityOf(element(by.css('.modal-content'))), 20000, 'Expense modal didn\'t open'));
    element(by.id('expenseModalClose')).click();
  });

  it('should get expenses on process', () => {
    browser.sleep(1000);
    browser.sleep(1000);
    browser.get('/home');
    expect(browser.wait(until.urlContains('/home'), 20000, 'Redirect took too long'));
    browser.sleep(1000);
    element(by.name('expenses/process')).click();
    browser.sleep(1000);
    expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long'));
    browser.sleep(1000);
    expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long'));
    const expenseList = element.all(by.css('.ag-row'));
    expect(expenseList.count()).toBeGreaterThanOrEqual(1);
  });

  it('should get the process attachments', () => {
    browser.sleep(1000);
    element(by.css('div[col-id=claim_date]')).click(); // Once
    browser.sleep(500);
    element(by.css('div[col-id=claim_date]')).click(); // Twice
    browser.sleep(1000);
    element(by.cssContainingText(`[role='gridcell'][col-id='note']`, 'E2E Addition ' + e2eID)).click();
    expect(browser.wait(until.visibilityOf(element(by.css('.modal-content'))), 20000, 'Expense modal didn\'t open').then(() => {
      browser.sleep(2000);
      const attachmentList = element.all(by.css('.click-stop'));
      expect(attachmentList.count()).toBeGreaterThanOrEqual(1);
    }));
  });

  it('should reject the expense', () => {
    element(by.id('thumbs-down')).click();
    const elem = element(by.id('thumbs-down-rejecting'));
    browser.wait(until.visibilityOf(elem), 20000, 'Expense rejection form took too long to load').then(() => {
      elem.click();
    });
    expect(browser.wait(until.invisibilityOf(element(by.css('.modal-content'))), 20000, 'Expense rejection took too long'));
  });
});
