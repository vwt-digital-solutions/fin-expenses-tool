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
const e2eID = Math.random() * 100;

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

  // TODO - Expense Creation Page
  // TODO - Controller Page
  // TODO - Finance Page
  // TODO - Landing Page Load

  it('should get the list of expenses on the landing page (or none)', () => {

    expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
      browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long');
    }));

    expect(browser.wait(until.visibilityOf(element(by.cssContainingText('Small', 'Opensource E2E'))), 10, 'Name is not present'));

    browser.wait(until.visibilityOf(element(by.css('li'))), 20000, 'The API took too long to respond').then(() => {
      const expensesList = element.all(by.css('li'));
      expect(expensesList.count()).toBeGreaterThanOrEqual(1);
    });

  });

  it('should redirect to the expenses page and load cost-types', () => {

    element(by.name('expenses')).click().then(() => {
      expect(browser.wait(until.visibilityOf(element(by.cssContainingText('h5', ' Declaratie indienen '))),
        20000, 'The redirect took too long').then(() => {
        browser.wait(until.visibilityOf(element(by.css('option'))), 20000, 'The API took too long to respond').then(() => {
          expect(element.all(by.css('option')).count()).toEqual(29);
        });
      }));
    });

  });

  it('should fill the expenseform', () => {

    element(by.id('amountinput')).sendKeys(100.99);

    const typeList = element(by.id('typeinput')).all(by.tagName('option'));
    typeList.count().then(numberOfItems => Math.floor(Math.random() * (numberOfItems - 1))).then(randomNumber => {
      typeList.get(randomNumber + 1).click();
    });

    const today = new Date();
    element(by.id('dateinput'))
      .sendKeys(today.getMonth() + 1 + '-' + today.getDate() + '-' + today.getUTCFullYear());

    element(by.id('noteinput')).sendKeys('E2E Addition ' + e2eID);

    const path = require('path');
    const file = 'assets/betaald.png';
    const absolutePath = path.resolve(__dirname, file);
    element(by.id('attachmentinput')).sendKeys(absolutePath);

    expect(browser.wait(until.invisibilityOf(element(by.id('amountinputFill'))), 10, 'Amount input went wrong'));

    expect(browser.wait(until.invisibilityOf(element(by.id('typeinputFill'))), 10, 'Type input went wrong'));

    expect(browser.wait(until.invisibilityOf(element(by.id('dateinputFill'))), 10, 'Date input went wrong'));

    expect(browser.wait(until.invisibilityOf(element(by.id('noteinputFill'))), 10, 'Note input went wrong'));

    expect(browser.wait(until.invisibilityOf(element(by.id('attachmentinputFill'))), 10, 'Attachment input went wrong'));

    element(by.id('submit-click')).click().then(() => {
      expect(browser.wait(until.visibilityOf(element(by.id('success-alert'))), 10000, 'Expense creation took too long'));
    });

  });

  it('should redirect to the manager page and load the expenses', () => {

    browser.wait(until.visibilityOf(element(by.name('expenses/manage'))), 200000, 'Not on the home page').then(() => {
      expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
        browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
          element(by.name('expenses/manage')).click().then(() => {
            expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
              browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
                expect(element.all(by.css('.ag-row')).count()).toBeGreaterThanOrEqual(1);
              });
            }));
          });
        });
      }));
    });

  });

  it('should open the expense and see the attachment', () => {

    expect(browser.wait(until.visibilityOf(element(by.cssContainingText(`[role='gridcell'][col-id='note']`, 'E2E Addition ' + e2eID))),
      10, 'Attachment is not shown on the manager page').then(() => {
      element(by.cssContainingText(`[role='gridcell'][col-id='note']`, 'E2E Addition ' + e2eID)).click().then(() => {
        expect(browser.wait(until.visibilityOf(element(by.css('li'))), 20000, 'No attachments are shown').then(() => {
          const attachmentList = element.all(by.css('.click-stop'));
          expect(attachmentList.count()).toBeGreaterThanOrEqual(1);
        }));
      });
    }));

  });


  it('should approve the expense', () => {


    expect(browser.wait(until.visibilityOf(element(by.id('thumbs-up'))),
      10, 'Approve button is not shown on the manager modal').then(() => {
      element(by.id('thumbs-up')).click().then(() => {
        expect(browser.wait(until.invisibilityOf(element(by.css('.modal-content'))), 20000, 'Expense rejection took too long'));
      });
    }));

  });
  // it('should get expenses on controller page', () => {
  //   browser.get('/home');
  //   expect(browser.wait(until.urlContains('/home'), 20000, 'Redirect took too long'));
  //   browser.sleep(1000);
  //   element(by.name('expenses/controller')).click();
  //   expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long'));
  //   browser.sleep(1000);
  //   expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long'));
  //   const expenseList = element.all(by.css('.ag-row'));
  //   expect(expenseList.count()).toBeGreaterThanOrEqual(1);
  // });
  //
  // it('should see the expense on the controller page', () => {
  //   element(by.css('div[col-id=claim_date]')).click(); // Once
  //   browser.sleep(500);
  //   element(by.css('div[col-id=claim_date]')).click(); // Twice
  //   browser.sleep(500);
  //   element(by.cssContainingText(`[role='gridcell'][col-id='employee']`, 'E2E, Opensource')).click();
  //   expect(browser.wait(until.visibilityOf(element(by.css('.modal-content'))), 20000, 'Expense modal didn\'t open'));
  //   element(by.id('expenseModalClose')).click();
  // });
  //
  // it('should get expenses on process', () => {
  //   browser.get('/home');
  //   expect(browser.wait(until.urlContains('/home'), 20000, 'Redirect took too long'));
  //   browser.sleep(1000);
  //   element(by.name('expenses/process')).click();
  //   expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long'));
  //   browser.sleep(1000);
  //   expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long'));
  //   const expenseList = element.all(by.css('.ag-row'));
  //   expect(expenseList.count()).toBeGreaterThanOrEqual(1);
  // });
  //
  // it('should get the process attachments', () => {
  //   element(by.css('div[col-id=claim_date]')).click(); // Once
  //   browser.sleep(500);
  //   element(by.css('div[col-id=claim_date]')).click(); // Twice
  //   element(by.cssContainingText(`[role='gridcell'][col-id='note']`, 'E2E Addition ' + e2eID)).click().then( () => {
  //     expect(browser.wait(until.visibilityOf(element(by.css('.modal-content'))), 20000, 'Expense modal didn\'t open').then(() => {
  //       const attachmentList = element.all(by.css('.click-stop'));
  //       expect(attachmentList.count()).toBeGreaterThanOrEqual(1);
  //     }));
  //   });
  // });
  //
  // it('should reject the expense', () => {
  //   element(by.id('thumbs-down')).click();
  //   const elem = element(by.id('thumbs-down-rejecting'));
  //   browser.wait(until.visibilityOf(elem), 20000, 'Expense rejection form took too long to load').then(() => {
  //     elem.click();
  //   });
  //   expect(browser.wait(until.invisibilityOf(element(by.css('.modal-content'))), 20000, 'Expense rejection took too long'));
  //   expect(true);
  // });
});
