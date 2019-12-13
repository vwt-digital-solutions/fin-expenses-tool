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


function writeScreenShot(data, filename) {
  const stream = fs.createWriteStream(filename);
  stream.write(new Buffer(data, 'base64'));
  stream.end();
}


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

  it('should get the list of expenses on the landing page (or none)', () => {

    expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
      browser.sleep(1000);
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

  it('should fill the expenseform for the manager', () => {

    element(by.id('amountinput')).sendKeys(100.99);

    const typeList = element(by.id('typeinput')).all(by.tagName('option'));
    typeList.count().then(numberOfItems => Math.floor(Math.random() * (numberOfItems - 1))).then(randomNumber => {
      typeList.get(randomNumber + 1).click();
    });

    const today = new Date();
    element(by.id('dateinput'))
      .sendKeys(today.getMonth() + 1 + '-' + today.getDate() + '-' + today.getUTCFullYear());

    element(by.id('noteinput')).sendKeys('E2E Addition ' + e2eID);

    element(by.id('submit-click')).click().then(() => {
      browser.sleep(1000);
      expect(browser.wait(until.invisibilityOf(element(by.id('amountinputFill'))), 10, 'Amount input went wrong'));
      expect(browser.wait(until.invisibilityOf(element(by.id('typeinputFill'))), 10, 'Type input went wrong'));
      expect(browser.wait(until.invisibilityOf(element(by.id('dateinputFill'))), 10, 'Date input went wrong'));
      expect(browser.wait(until.invisibilityOf(element(by.id('noteinputFill'))), 10, 'Note input went wrong'));
      expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
        browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long');
      }));
    });

  });

  it('should get the list of expenses on the landing page again', () => {

    expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
      browser.sleep(1000);
      browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long');
    }));

    expect(browser.wait(until.visibilityOf(element(by.cssContainingText('Small', 'Opensource E2E'))), 10, 'Name is not present'));

    browser.wait(until.visibilityOf(element(by.css('li'))), 20000, 'The API took too long to respond').then(() => {
      const expensesList = element.all(by.css('li'));
      expect(expensesList.count()).toBeGreaterThanOrEqual(1);
    });

  });

  it('should redirect to the manager page and load the expenses', () => {

    browser.wait(until.visibilityOf(element(by.name('expenses/manage'))), 20000, 'Not on the home page or expense was not created')
      .then(() => {
        expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
          browser.sleep(1000);
          browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
            element(by.name('expenses/manage')).click().then(() => {
              expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
                browser.sleep(1000);
                browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
                  expect(element.all(by.css('.ag-row')).count()).toBeGreaterThanOrEqual(1);
                });
              }));
            });
          });
        }));
      });

  });

  it('should see the created expense on the manager page', () => {

    element(by.css('div[col-id=claim_date]')).click(); // Once
    browser.sleep(500);
    element(by.css('div[col-id=claim_date]')).click(); // Twice
    browser.sleep(500);
    expect(browser.wait(until.visibilityOf(element(by.cssContainingText(`[role='gridcell'][col-id='note']`,
      'E2E Addition ' + e2eID))), 10000, 'Expense not present'));

  });

  it('this step does not want to work', () => {

    browser.sleep(5000);
    element(by.cssContainingText(`[role='gridcell'][col-id='note']`,
      'E2E Addition ' + e2eID)).click().then(() => {
      browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
        return browser.getPageSource().then( (source) => {
          console.log(source);
        });
      }).then( () => {
        expect(element(by.css('.employee-text')).getText()).toEqual('E2E, Opensource');
      });
    });

  });

  it('should see the expense attachment on the manager page', () => {

    browser.wait(until.visibilityOf(element(by.css('.click-stop'))), 20000, 'The attachments are not loading').then(() => {
      expect(element.all(by.css('.click-stop')).count()).toBeGreaterThanOrEqual(1);
    });

  });

  it('should reject the expense on the manager page', () => {

    element(by.id('thumbs-down')).click();
    expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
      browser.sleep(1000);
      browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
        element(by.id('information-icon-down-rejecting')).click();
        expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
          browser.sleep(1000);
          browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
            browser.get('/home');
          });
        }));
      });
    }));

  });


  it('should get the list of expenses on the landing page again', () => {

    expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
      browser.sleep(1000);
      browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long');
    }));

    expect(browser.wait(until.visibilityOf(element(by.cssContainingText('Small', 'Opensource E2E'))), 10, 'Name is not present'));

    browser.wait(until.visibilityOf(element(by.css('li'))), 20000, 'The API took too long to respond').then(() => {
      const expensesList = element.all(by.css('li'));
      expect(expensesList.count()).toBeGreaterThanOrEqual(1);
    });

  });

  it('should submit the expense with a lower amount', () => {

    element(by.cssContainingText('li', ' Aanpassing vereist')).click().then(() => {
      expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
        browser.sleep(1000);
        browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
          element(by.id('expenseAmount')).clear().then(() => {
            element(by.id('expenseAmount')).sendKeys(1.99);
            element(by.id('submit-update-button')).click();
            browser.sleep(3000); // Should remove this
          });
        });
      }));
    });

  });
  //
  //
  // it('should redirect to the creditor page and load the expenses', () => {
  //
  //   browser.wait(until.visibilityOf(element(by.name('expenses/manage'))), 20000, 'Not on the home page or blocked')
  //     .then(() => {
  //       expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
  //         browser.sleep(1000);
  //         browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
  //           element(by.name('expenses/process')).click().then(() => {
  //             expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000,
  //             'The loader is showing too long').then(() => {
  //               browser.sleep(1000);
  //               browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
  //                 expect(element.all(by.css('.ag-row')).count()).toBeGreaterThanOrEqual(1);
  //               });
  //             }));
  //           });
  //         });
  //       }));
  //     });
  //
  // });
  //
  // it('should see the created expense on the creditor page', () => {
  //
  //   element(by.css('div[col-id=claim_date]')).click(); // Once
  //   browser.sleep(500);
  //   element(by.css('div[col-id=claim_date]')).click(); // Twice
  //   browser.sleep(500);
  //   expect(browser.wait(until.visibilityOf(element(by.cssContainingText(`[role='gridcell'][col-id='note']`,
  //     'E2E Addition ' + e2eID))), 10000, 'Expense not present'));
  //   element(by.cssContainingText(`[role='gridcell'][col-id='note']`,
  //     'E2E Addition ' + e2eID)).click();
  // });
  //
  // it('should get the list of expenses on the landing page again', () => {
  //
  //   element(by.id('home-button')).click();
  //   expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
  //     browser.sleep(1000);
  //     browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long');
  //   }));
  //
  //   expect(browser.wait(until.visibilityOf(element(by.cssContainingText('Small', 'Opensource E2E'))), 10, 'Name is not present'));
  //
  //   browser.wait(until.visibilityOf(element(by.css('li'))), 20000, 'The API took too long to respond').then(() => {
  //     const expensesList = element.all(by.css('li'));
  //     expect(expensesList.count()).toBeGreaterThanOrEqual(1);
  //   });
  //
  // });
});
