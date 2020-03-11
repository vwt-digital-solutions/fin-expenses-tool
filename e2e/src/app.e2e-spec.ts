import {browser, protractor, by, element} from 'protractor/built';
import { ExpensesForm } from './app.po';

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
const today = new Date();
const todayDay = today.getUTCDate() < 10 ? '0' + today.getUTCDate() : today.getUTCDate();
const todayMonth = today.getUTCMonth() + 1 < 10 ? `0${today.getUTCMonth() + 1}` : today.getUTCMonth() + 1;
const todayYear = today.getUTCFullYear();

let expensesListCount;
let updateType;
const isOnBuild = process.env.isOnBuild || false;

let e2eList = [];
let expenseForm: ExpensesForm;

describe('ExpenseApp:', () => {
  let originalTimeout;

  afterEach(() => {
    console.log(e2eID);
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
    browser.manage().window().setSize(1600, 1200);
    browser.waitForAngularEnabled(false);
    expenseForm = new ExpensesForm();
  });

  it('should login and authenticate', () => {
    // TODO - Call to API and check if page loads without authentication
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

  it('E1: should get the list of expenses on the landing page (or none)', () => {

    expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
      browser.sleep(1000);
      browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long');
    }));

    expect(browser.wait(until.visibilityOf(element(by.cssContainingText('Small', 'Opensource E2E'))), 10, 'Name is not present'));

    browser.wait(until.visibilityOf(element(by.css('li.expenses-list-item'))), 20000, 'The API took too long to respond').then(() => {
      const expensesList = element.all(by.css('li.expenses-list-item'));
      expensesListCount = expensesList.count();
      if (expensesListCount === 1) {
        expensesListCount = 0;
      }
      expect(expensesList.count()).toBeGreaterThanOrEqual(1);
    });

  });

  // START OF GREEN

  it('E1: should redirect to the expenses page and load cost-types', () => {

    element(by.name('expenses')).click().then(() => {
      expect(browser.wait(until.visibilityOf(element(by.cssContainingText('h3', 'Declaratie indienen'))),
        20000, 'The redirect took too long').then(() => {
        browser.wait(until.visibilityOf(element(by.css('option'))), 20000, 'The API took too long to respond').then(() => {
          expect(element.all(by.css('option')).count()).toEqual(18);
        });
      }));
    });

  });

  it('E1: should fill the expenseform for the creditor', () => {

    element(by.id('amountinput')).sendKeys(1.99);

    const typeList = element(by.id('typeinput')).all(by.tagName('option'));
    typeList.count().then(
      numberOfItems => Math.floor(Math.random() * (numberOfItems - 1))).then(
        randomNumber => {
          const type = typeList.get(randomNumber + 1);
          type.getText().then(option => {
            if (!option.toLowerCase().includes('brandstofkosten')) {
              typeList.get(randomNumber + 1).click();
            } else {
              typeList.get(randomNumber + 2).click();
            }
          });
        });

    element(by.id('dateinput'))
      .sendKeys(`${todayMonth}/${todayDay}/${todayYear}`);

    e2eID = Math.random() * 100;
    element(by.id('noteinput')).sendKeys('E2E Addition ' + e2eID);
    e2eList.push(e2eID);

    element(by.id('submit-save-submit')).click().then(async () => {
      await expenseForm.acceptAlertBox();

      expect(browser.wait(until.invisibilityOf(element(by.id('amountinputFill'))), 10, 'Amount input went wrong'));
      expect(browser.wait(until.invisibilityOf(element(by.id('typeinputFill'))), 10, 'Type input went wrong'));
      expect(browser.wait(until.invisibilityOf(element(by.id('dateinputFill'))), 10, 'Date input went wrong'));
      expect(browser.wait(until.invisibilityOf(element(by.id('noteinputFill'))), 10, 'Note input went wrong'));
      expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
        browser.sleep(1000);
        browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long');
      }));
    });

  });

  it('E1: list of landing page should be bigger than last time', () => {
    expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
      browser.sleep(1000);
      browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long');
    }));

    expect(browser.wait(until.visibilityOf(element(by.cssContainingText('Small', 'Opensource E2E'))), 10, 'Name is not present'));

    browser.wait(until.visibilityOf(element(by.css('li.expenses-list-item'))), 20000, 'The API took too long to respond').then(() => {
      const expensesList = element.all(by.css('li.expenses-list-item'));
      expect(expensesList.count()).toBeGreaterThanOrEqual(expensesListCount);
      expensesListCount = expensesList.count();
    });

  });

  it('E1: should open the expense and check the data', () => {

    element.all(by.css('li.expenses-list-item.processing')).first().click().then(() => {
      expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
        browser.sleep(1000);
        browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
          expect(element(by.id('employeeText')).getText()).toEqual('E2E, Opensource');
          element(by.id('expenseNote')).getAttribute('value').then((value) => {
            expect(value).toEqual('E2E Addition ' + e2eID);
          });
          browser.sleep(1000);
          const attachments = element.all(by.css('.file-list-item'));
          expect(attachments.count()).toEqual(1);
        });
      }));
    });

  });

  it('CG1: should close the expense on the landing page, go to the process page and load the expense(s)', () => {

    element(by.id('modalClose')).click();
    browser.wait(until.visibilityOf(element(by.name('expenses/process'))), 20000, 'Not on the home page or not a creditor')
      .then(() => {
        expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
          browser.sleep(1000);
          browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
            element(by.name('expenses/process')).click().then(() => {
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

  it('CG1: should see the created expense on the process page', () => {

    element(by.css('div[col-id=claim_date]')).click(); // Once
    browser.sleep(500);
    element(by.css('div[col-id=claim_date]')).click(); // Twice
    browser.sleep(500);
    expect(browser.wait(until.visibilityOf(element(by.cssContainingText(`[role='gridcell'][col-id='note']`,
      'E2E Addition ' + e2eID))), 10000, 'Expense not present'));

  });

  it('CG1: should open the expense on the process page and check the data', () => {

    element(by.cssContainingText(`[role='gridcell'][col-id='note']`,
      'E2E Addition ' + e2eID)).click().then(() => {
      browser.sleep(1000);
      expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
        browser.sleep(1000);
        browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {

          if (isOnBuild) {
            element(by.cssContainingText(`[role='gridcell'][col-id='note']`,
              'E2E Addition ' + e2eID)).click().then(() => {
              browser.sleep(1000);
              expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
                browser.sleep(1000);
                browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
                  expect(element(by.id('maxModal')).isDisplayed());
                });
              }));
            });
          }

          expect(element(by.id('employeeText')).getText()).toEqual('E2E, Opensource');
          element(by.id('expenseNote')).getAttribute('value').then((value) => {
            expect(value).toEqual('E2E Addition ' + e2eID);
          });
          browser.sleep(1000);
          const attachments = element.all(by.css('.file-list-item'));
          expect(attachments.count()).toEqual(1);
        });
      }));
    });

  });

  it('CG1: should change the cost type and approve', () => {

    const typeList = element(by.id('expenseCostType')).all(by.tagName('option'));
    typeList.first().getText().then((ret) => {
      const step = ret.split(': ');
      selection();

      function selection() {
        typeList.count().then(numberOfItems => Math.floor(Math.random() * (numberOfItems - 1))).then(randomNumber => {
          // tslint:disable-next-line:no-shadowed-variable
          typeList.get(randomNumber + 1).getText().then((ret) => {
            if (ret === step[1]) {
              selection();
            } else {
              typeList.get(randomNumber + 1).getText().then((value) => {
                updateType = value.trim();
              });
              typeList.get(randomNumber + 1).click();
            }
          });
        });
      }
    });
    expect(element(by.id('thumbs-up')).isDisplayed());
    element(by.id('thumbs-up')).click().then(() => {
      expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
        browser.sleep(1000);
        browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
          browser.get('/home');
        });
      }));
    });

  });

  it('E2: should see that the expense has been approved', () => {

    browser.wait(until.visibilityOf(element(by.css('li.expenses-list-item.approved'))), 20000, 'Return to landing took too long').then(() => {
      expect(element.all(by.css('li.expenses-list-item.approved')).first().element(by.css('.status-pill .badge')).getText()).toEqual('Goedgekeurd');
    });

  });


  it('E2: should open the expense and check the data', () => {

    browser.wait(until.visibilityOf(element(by.css('li.expenses-list-item.approved'))), 20000, 'Return to landing took too long').then(() => {
      element.all(by.css('li.expenses-list-item.approved')).first().click().then(() => {
        expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
          browser.sleep(1000);
          browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
            expect(element(by.id('employeeText')).getText()).toEqual('E2E, Opensource');
            element(by.id('expenseNote')).getAttribute('value').then((value) => {
              expect(value).toEqual('E2E Addition ' + e2eID);
            });
            element(by.id('expenseCostType')).getAttribute('value').then((value) => {
              expect(value).toContain(updateType);
            });
            const attachments = element.all(by.css('.file-list-item'));
            expect(attachments.count()).toEqual(1);
          });
        }));
      });
    });

  });

  it('MG1: should redirect to the expenses page and load cost-types', () => {

    element(by.id('modalClose')).click();
    element(by.name('expenses')).click().then(() => {
      expect(browser.wait(until.visibilityOf(element(by.cssContainingText('h3', 'Declaratie indienen'))),
        20000, 'The redirect took too long').then(() => {
        browser.wait(until.visibilityOf(element(by.css('option'))), 20000, 'The API took too long to respond').then(() => {
          expect(element.all(by.css('option')).count()).toEqual(18);
        });
      }));
    });

  });

  it('MG1: should fill the expenseform for the manager', () => {

    element(by.id('amountinput')).sendKeys(100.99);

    const typeList = element(by.id('typeinput')).all(by.tagName('option'));
    typeList.count().then(numberOfItems => Math.floor(Math.random() * (numberOfItems - 1))).then(randomNumber => {
      typeList.get(randomNumber + 1).click();
    });

    element(by.id('dateinput'))
      .sendKeys(`${todayMonth}/${todayDay}/${todayYear}`);

    e2eID = Math.random() * 100;
    element(by.id('noteinput')).sendKeys('E2E Addition ' + e2eID);
    e2eList.push(e2eID);

    element(by.id('submit-save-submit')).click().then(async () => {
      await expenseForm.acceptAlertBox();

      expect(browser.wait(until.invisibilityOf(element(by.id('amountinputFill'))), 10, 'Amount input went wrong'));
      expect(browser.wait(until.invisibilityOf(element(by.id('typeinputFill'))), 10, 'Type input went wrong'));
      expect(browser.wait(until.invisibilityOf(element(by.id('dateinputFill'))), 10, 'Date input went wrong'));
      expect(browser.wait(until.invisibilityOf(element(by.id('noteinputFill'))), 10, 'Note input went wrong'));
      expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
        browser.sleep(1000);
        browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long');
      }));
    });

  });

  it('E3: list of landing page should be bigger than last time', () => {
    expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
      browser.sleep(1000);
      browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long');
    }));

    expect(browser.wait(until.visibilityOf(element(by.cssContainingText('Small', 'Opensource E2E'))), 10, 'Name is not present'));

    browser.wait(until.visibilityOf(element(by.css('li.expenses-list-item'))), 20000, 'The API took too long to respond').then(() => {
      const expensesList = element.all(by.css('li.expenses-list-item'));
      expect(expensesList.count()).toBeGreaterThan(expensesListCount);
    });

  });

  it('E3: should open the expense and check the data', () => {

    element.all(by.css('li.expenses-list-item.processing')).first().click().then(() => {
      expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
        browser.sleep(1000);
        browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
          expect(element(by.id('employeeText')).getText()).toEqual('E2E, Opensource');
          element(by.id('expenseNote')).getAttribute('value').then((value) => {
            expect(value).toEqual('E2E Addition ' + e2eID);
          });
          browser.sleep(1000);
          const attachments = element.all(by.css('.file-list-item'));
          expect(attachments.count()).toEqual(1);
        });
      }));
    });

  });

  it('MG2: should close the expense on the landing page, go to the manager page and load the expense(s)', () => {

    element(by.id('modalClose')).click();
    browser.wait(until.visibilityOf(element(by.name('expenses/manage'))), 20000, 'Not on the home page or not a manager')
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

  it('MG2: should see the created expense on the manager page', () => {

    element(by.css('div[col-id=claim_date]')).click(); // Once
    browser.sleep(500);
    element(by.css('div[col-id=claim_date]')).click(); // Twice
    browser.sleep(500);
    expect(browser.wait(until.visibilityOf(element(by.cssContainingText(`[role='gridcell'][col-id='note']`,
      'E2E Addition ' + e2eID))), 10000, 'Expense not present'));

  });

  it('MG2: should open the expense on the manager page and check the data', () => {

    element(by.cssContainingText(`[role='gridcell'][col-id='note']`,
      'E2E Addition ' + e2eID)).click().then(() => {
      browser.sleep(1000);
      expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
        browser.sleep(1000);
        browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {

          if (isOnBuild) {
            element(by.cssContainingText(`[role='gridcell'][col-id='note']`,
              'E2E Addition ' + e2eID)).click().then(() => {
              browser.sleep(1000);
              expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
                browser.sleep(1000);
                browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
                  expect(element(by.id('maxModal')).isDisplayed());
                });
              }));
            });
          }

          expect(element(by.id('employeeText')).getText()).toEqual('E2E, Opensource');
          element(by.id('expenseNote')).getAttribute('value').then((value) => {
            expect(value).toEqual('E2E Addition ' + e2eID);
          });
          browser.sleep(1000);
          const attachments = element.all(by.css('.file-list-item'));
          expect(attachments.count()).toEqual(1);
        });
      }));
    });

  });

  it('MG2: should approve the expense on the manager page', () => {

    expect(element(by.id('thumbs-up')).isDisplayed());
    element(by.id('thumbs-up')).click().then(() => {
      expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
        browser.sleep(1000);
        browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
          browser.get('/home');
        });
      }));
    });

  });

  it('CG2: should go to the process page and load the expense(s)', () => {

    browser.wait(until.visibilityOf(element(by.name('expenses/process'))), 20000, 'Not on the home page or not a creditor')
      .then(() => {
        expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
          browser.sleep(1000);
          browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
            element(by.name('expenses/process')).click().then(() => {
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

  it('CG2: should see the created expense on the process page', () => {

    element(by.css('div[col-id=claim_date]')).click(); // Once
    browser.sleep(500);
    element(by.css('div[col-id=claim_date]')).click(); // Twice
    browser.sleep(500);
    expect(browser.wait(until.visibilityOf(element(by.cssContainingText(`[role='gridcell'][col-id='note']`,
      'E2E Addition ' + e2eID))), 10000, 'Expense not present'));

  });

  it('CG2: should open the expense on the process page and check the data', () => {

    element(by.cssContainingText(`[role='gridcell'][col-id='note']`,
      'E2E Addition ' + e2eID)).click().then(() => {
      browser.sleep(1000);
      expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
        browser.sleep(1000);
        browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {

          if (isOnBuild) {
            element(by.cssContainingText(`[role='gridcell'][col-id='note']`,
              'E2E Addition ' + e2eID)).click().then(() => {
              browser.sleep(1000);
              expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
                browser.sleep(1000);
                browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
                  expect(element(by.id('maxModal')).isDisplayed());
                });
              }));
            });
          }

          expect(element(by.id('employeeText')).getText()).toEqual('E2E, Opensource');
          element(by.id('expenseNote')).getAttribute('value').then((value) => {
            expect(value).toEqual('E2E Addition ' + e2eID);
          });
          browser.sleep(1000);
          const attachments = element.all(by.css('.file-list-item'));
          expect(attachments.count()).toEqual(1);
        });
      }));
    });

  });

  it('CG2: should approve the expense on the process page', () => {

    expect(element(by.id('thumbs-up')).isDisplayed());
    element(by.id('thumbs-up')).click().then(() => {
      expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
        browser.sleep(1000);
        browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
          browser.get('/home');
        });
      }));
    });

  });

  it('E4: should see that the expense has been approved', () => {

    browser.wait(until.visibilityOf(element(by.css('li.expenses-list-item.approved'))), 20000, 'Return to landing took too long').then(() => {
      expect(element.all(by.css('li.expenses-list-item.approved')).first().element(by.css('.status-pill .badge')).getText()).toEqual('Goedgekeurd');
    });

  });

  // END OF GREEN

  // START OF RED

  it('E5: should redirect to the expenses page and load cost-types', () => {

    element(by.name('expenses')).click().then(() => {
      expect(browser.wait(until.visibilityOf(element(by.cssContainingText('h3', 'Declaratie indienen'))),
        20000, 'The redirect took too long').then(() => {
        browser.wait(until.visibilityOf(element(by.css('option'))), 20000, 'The API took too long to respond').then(() => {
          expect(element.all(by.css('option')).count()).toEqual(18);
        });
      }));
    });

  });

  it('E5: should fill the expenseform for the manager', () => {

    element(by.id('amountinput')).sendKeys(100.99);

    const typeList = element(by.id('typeinput')).all(by.tagName('option'));
    typeList.count().then(numberOfItems => Math.floor(Math.random() * (numberOfItems - 1))).then(randomNumber => {
      typeList.get(randomNumber + 1).click();
    });

    element(by.id('dateinput'))
      .sendKeys(`${todayMonth}/${todayDay}/${todayYear}`);

    e2eID = Math.random() * 100;
    element(by.id('noteinput')).sendKeys('E2E Addition ' + e2eID);
    e2eList.push(e2eID);

    element(by.id('submit-save-submit')).click().then(async () => {
      await expenseForm.acceptAlertBox();

      expect(browser.wait(until.invisibilityOf(element(by.id('amountinputFill'))), 10, 'Amount input went wrong'));
      expect(browser.wait(until.invisibilityOf(element(by.id('typeinputFill'))), 10, 'Type input went wrong'));
      expect(browser.wait(until.invisibilityOf(element(by.id('dateinputFill'))), 10, 'Date input went wrong'));
      expect(browser.wait(until.invisibilityOf(element(by.id('noteinputFill'))), 10, 'Note input went wrong'));
      expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
        browser.sleep(1000);
        browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long');
      }));
    });

  });

  it('E5: list of landing page should be bigger than last time', () => {
    expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
      browser.sleep(1000);
      browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long');
    }));

    expect(browser.wait(until.visibilityOf(element(by.cssContainingText('Small', 'Opensource E2E'))), 10, 'Name is not present'));

    browser.wait(until.visibilityOf(element(by.css('li.expenses-list-item'))), 20000, 'The API took too long to respond').then(() => {
      const expensesList = element.all(by.css('li.expenses-list-item'));
      expect(expensesList.count()).toBeGreaterThan(expensesListCount);
      expensesListCount = expensesList.count();
    });

  });

  it('E5: should open the expense and check the data', () => {

    element.all(by.css('li.expenses-list-item.processing')).first().click().then(() => {
      expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
        browser.sleep(1000);
        browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
          expect(element(by.id('employeeText')).getText()).toEqual('E2E, Opensource');
          element(by.id('expenseNote')).getAttribute('value').then((value) => {
            expect(value).toEqual('E2E Addition ' + e2eID);
          });
          browser.sleep(1000);
          const attachments = element.all(by.css('.file-list-item'));
          expect(attachments.count()).toEqual(1);
        });
      }));
    });

  });

  it('MR1: should close the expense on the landing page, go to the manager page and load the expense(s)', () => {

    element(by.id('modalClose')).click();
    browser.wait(until.visibilityOf(element(by.name('expenses/manage'))), 20000, 'Not on the home page or not a creditor')
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

  it('MR1: should see the created expense on the manager page', () => {

    element(by.css('div[col-id=claim_date]')).click(); // Once
    browser.sleep(500);
    element(by.css('div[col-id=claim_date]')).click(); // Twice
    browser.sleep(500);
    expect(browser.wait(until.visibilityOf(element(by.cssContainingText(`[role='gridcell'][col-id='note']`,
      'E2E Addition ' + e2eID))), 10000, 'Expense not present'));

  });

  it('MR1: should open the expense on the manager page and check the data', () => {

    element(by.cssContainingText(`[role='gridcell'][col-id='note']`,
      'E2E Addition ' + e2eID)).click().then(() => {
      browser.sleep(1000);
      expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
        browser.sleep(1000);
        browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {

          if (isOnBuild) {
            element(by.cssContainingText(`[role='gridcell'][col-id='note']`,
              'E2E Addition ' + e2eID)).click().then(() => {
              browser.sleep(1000);
              expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
                browser.sleep(1000);
                browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
                  expect(element(by.id('maxModal')).isDisplayed());
                });
              }));
            });
          }

          expect(element(by.id('employeeText')).getText()).toEqual('E2E, Opensource');
          element(by.id('expenseNote')).getAttribute('value').then((value) => {
            expect(value).toEqual('E2E Addition ' + e2eID);
          });
          browser.sleep(1000);
          const attachments = element.all(by.css('.file-list-item'));
          expect(attachments.count()).toEqual(1);
        });
      }));
    });

  });

  it('MR1: should reject', () => {

    expect(element(by.id('thumbs-down')).isDisplayed());
    element(by.id('thumbs-down')).click().then(() => {
      element(by.id('thumbs-down-rejecting')).click().then(() => {
        browser.sleep(1000);
        expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
          browser.sleep(1000);
          browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
            browser.get('/home');
          });
        }));
      });
    });

  });

  it('E6: should see that the expense has been rejected', () => {

    browser.wait(until.visibilityOf(element(by.css('li.expenses-list-item.rejected'))), 20000, 'Return to landing took too long').then(() => {
      expect(element.all(by.css('li.expenses-list-item.rejected')).first().element(by.css('.status-pill .badge')).getText()).toEqual('Aanpassing vereist');
    });

  });


  it('E6: should open the expense, remove one attachment, add two and submit', () => {

    browser.wait(until.visibilityOf(element(by.css('li.expenses-list-item.rejected'))), 20000, 'Return to landing took too long').then(() => {
      element.all(by.css('li.expenses-list-item.rejected')).first().click().then(() => {
        expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
          browser.sleep(1000);
          browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
            expect(element(by.id('employeeText')).getText()).toEqual('E2E, Opensource');
            element(by.id('expenseNote')).getAttribute('value').then((value) => {
              expect(value).toEqual('E2E Addition ' + e2eID);
            });
            let attachments = element.all(by.css('.file-list-item'));
            expect(attachments.count()).toEqual(1);
            element(by.css('.fa-trash')).click().then(() => {
              browser.sleep(2000);
              attachments = element.all(by.css('.file-list-item'));
              expect(attachments.count()).toEqual(2);
              element(by.id('submit-update-button')).click().then(async () => {
                await expenseForm.acceptAlertBox();

                expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
                  browser.sleep(1000);
                  browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
                    expect(element(by.css('.status-pill .badge')).getText()).toEqual('In behandeling');
                    browser.sleep(1000);
                  });
                }));
              });
            });
          });
        }));
      });
    });

  });

  it('E6: should open the expense and check the data after submit', () => {

    element.all(by.css('li.expenses-list-item.processing')).first().click().then(() => {
      expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
        browser.sleep(1000);
        browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
          expect(element(by.id('employeeText')).getText()).toEqual('E2E, Opensource');
          element(by.id('expenseNote')).getAttribute('value').then((value) => {
            expect(value).toEqual('E2E Addition ' + e2eID);
          });
          browser.sleep(1000);
          const attachments = element.all(by.css('.file-list-item'));
          expect(attachments.count()).toEqual(2);
        });
      }));
    });

  });

  it('MR2: should close the expense on the landing page, go to the manager page and load the expense(s)', () => {

    element(by.id('modalClose')).click();
    browser.driver.navigate().refresh().then(() => {
      browser.wait(until.visibilityOf(element(by.name('expenses/manage'))), 20000, 'Not on the home page or not a manager')
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

  });

  it('MR2: should see the created expense on the manager page', () => {

    element(by.css('div[col-id=claim_date]')).click(); // Once
    browser.sleep(500);
    element(by.css('div[col-id=claim_date]')).click(); // Twice
    browser.sleep(500);
    expect(browser.wait(until.visibilityOf(element(by.cssContainingText(`[role='gridcell'][col-id='note']`,
      'E2E Addition ' + e2eID))), 10000, 'Expense not present'));

  });

  it('MR2: should open the expense on the manager page and check the data', () => {

    element(by.cssContainingText(`[role='gridcell'][col-id='note']`,
      'E2E Addition ' + e2eID)).click().then(() => {
      browser.sleep(1000);
      expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
        browser.sleep(1000);
        browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {

          if (isOnBuild) {
            element(by.cssContainingText(`[role='gridcell'][col-id='note']`,
              'E2E Addition ' + e2eID)).click().then(() => {
              browser.sleep(1000);
              expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
                browser.sleep(1000);
                browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
                  expect(element(by.id('maxModal')).isDisplayed());
                });
              }));
            });
          }

          expect(element(by.id('employeeText')).getText()).toEqual('E2E, Opensource');
          element(by.id('expenseNote')).getAttribute('value').then((value) => {
            expect(value).toEqual('E2E Addition ' + e2eID);
          });
          browser.sleep(1000);
          const attachments = element.all(by.css('.file-list-item'));
          expect(attachments.count()).toEqual(2);
        });
      }));
    });

  });

  it('MR2: should approve', () => {

    expect(element(by.id('thumbs-up')).isDisplayed());
    element(by.id('thumbs-up')).click().then(() => {
      browser.sleep(1000);
      expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
        browser.sleep(1000);
        browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
          browser.get('/home');
        });
      }));
    });

  });

  it('CR1: should go to the process page and load the expense(s)', () => {

    browser.wait(until.visibilityOf(element(by.name('expenses/process'))), 20000, 'Not on the home page or not a creditor')
      .then(() => {
        expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
          browser.sleep(1000);
          browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
            element(by.name('expenses/process')).click().then(() => {
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

  it('CR1: should see the created expense on the process page', () => {

    element(by.css('div[col-id=claim_date]')).click(); // Once
    browser.sleep(500);
    element(by.css('div[col-id=claim_date]')).click(); // Twice
    browser.sleep(500);
    expect(browser.wait(until.visibilityOf(element(by.cssContainingText(`[role='gridcell'][col-id='note']`,
      'E2E Addition ' + e2eID))), 10000, 'Expense not present'));

  });

  it('CR1: should open the expense on the process page and check the data', () => {

    element(by.cssContainingText(`[role='gridcell'][col-id='note']`,
      'E2E Addition ' + e2eID)).click().then(() => {
      browser.sleep(1000);
      expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
        browser.sleep(1000);
        browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {

          if (isOnBuild) {
            element(by.cssContainingText(`[role='gridcell'][col-id='note']`,
              'E2E Addition ' + e2eID)).click().then(() => {
              browser.sleep(1000);
              expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
                browser.sleep(1000);
                browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
                  expect(element(by.id('maxModal')).isDisplayed());
                });
              }));
            });
          }

          expect(element(by.id('employeeText')).getText()).toEqual('E2E, Opensource');
          element(by.id('expenseNote')).getAttribute('value').then((value) => {
            expect(value).toEqual('E2E Addition ' + e2eID);
          });
          browser.sleep(1000);
          const attachments = element.all(by.css('.file-list-item'));
          expect(attachments.count()).toEqual(2);
        });
      }));
    });

  });

  it('CR1: should reject the expense on the process page', () => {

    expect(element(by.id('thumbs-down')).isDisplayed());
    element(by.id('thumbs-down')).click().then(() => {
      element(by.id('thumbs-down-rejecting')).click().then(() => {
        browser.sleep(1000);
        expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
          browser.sleep(1000);
          browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
            browser.get('/home');
          });
        }));
      });
    });

  });

  it('E7: should see that the expense has been rejected', () => {

    browser.wait(until.visibilityOf(element(by.css('li.expenses-list-item.rejected'))), 20000, 'Return to landing took too long').then(() => {
      expect(element.all(by.css('li.expenses-list-item.rejected')).first().element(by.css('.status-pill .badge')).getText()).toEqual('Aanpassing vereist');
    });

  });

  it('E7: should open the expense and cancel', () => {

    browser.wait(until.visibilityOf(element(by.css('li.expenses-list-item'))), 20000, 'Return to landing took too long').then(() => {
      element.all(by.css('li.expenses-list-item.rejected')).first().click().then(() => {
        expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
          browser.sleep(1000);
          browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
            expect(element(by.id('employeeText')).getText()).toEqual('E2E, Opensource');
            element(by.id('expenseNote')).getAttribute('value').then((value) => {
              expect(value).toEqual('E2E Addition ' + e2eID);
            });
            const attachments = element.all(by.css('.file-list-item'));
            expect(attachments.count()).toEqual(2);
            element(by.id('cancel-update-button')).click().then(() => {
              browser.sleep(1000);
              browser.switchTo().alert().accept();
              browser.sleep(1000);
            });
          });
        }));
      });
    });

  });

  it('E7: should see if the expense has been cancelled', () => {

    expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
      browser.sleep(1000);
      browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
        expect(element(by.css('.status-pill .badge')).getText()).toEqual('Geannuleerd');
        browser.sleep(1000);
      });
    }));

  });

  // END OF RED

  it('C1: should go to the creditor page and create booking/payment files', () => {

    browser.wait(until.visibilityOf(element(by.name('expenses/process'))), 20000, 'Not on the home page or not a creditor')
      .then(() => {
        expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
          browser.sleep(1000);
          browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
            element(by.name('expenses/process')).click().then(() => {
              expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
                browser.sleep(1000);
                browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
                  element(by.id('createBookingFile')).click().then(() => {
                    browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
                      expect(element(by.css(`.alert-success`)).isDisplayed());
                    });
                  });
                });
              }));
            });
          });
        }));
      });

  });

  it('C2: should create journal and total expenses files', () => {

    expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
      browser.sleep(1000);
      browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
        element(by.id('dropdownForm')).click().then(() => {
          element(by.id('startDate')).sendKeys(`${todayMonth}/${todayDay}/${todayYear}`);
          element(by.id('endDate')).sendKeys(`${todayMonth}/${todayDay}/${todayYear}`);

          browser.sleep(1000);

          element(by.cssContainingText('.btn-secondary', 'Exporteren')).click().then(() => {
            browser.sleep(4000);
            browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
              expect(element(by.css('.btn.has-exported')).isPresent()).toBe(true);
              browser.get('/home');
            });
          });
        });
      });
    }));

  });

  it('CON1: should go to the controller page and load the expense(s)', () => {

    browser.wait(until.visibilityOf(element(by.name('expenses/controller'))), 20000, 'Not on the home page or not a controller')
      .then(() => {
        expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
          browser.sleep(1000);
          browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
            element(by.name('expenses/controller')).click().then(() => {
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

  it('CON1: should see all the expenses on the controller page', () => {

    element(by.css('div[col-id=claim_date]')).click(); // Once
    browser.sleep(500);
    element(by.css('div[col-id=claim_date]')).click(); // Twice
    browser.sleep(500);
    const expenses = element.all(by.cssContainingText(`[role='gridcell'][col-id='employee']`,
      'E2E, Opensource'));
    // tslint:disable-next-line
    e2eList = e2eList.reverse();
    for (let i = 0; i < e2eList.length; ++i) {
      expenses.get(i).click().then(() => {
        browser.sleep(1000);
        expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
          browser.sleep(1000);
          browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {

            if (isOnBuild) {
              expenses.get(i).click().then(() => {
                browser.sleep(1000);
                expect(browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
                  browser.sleep(1000);
                  browser.wait(until.invisibilityOf(element(by.css('.overlay'))), 20000, 'The loader is showing too long').then(() => {
                    expect(element(by.id('maxModal')).isDisplayed());
                  });
                }));
              });
            }

            expect(element(by.id('employeeText')).getText()).toEqual('E2E, Opensource');
            element(by.id('expenseNote')).getAttribute('value').then((value) => {
              expect(value).toEqual('E2E Addition ' + e2eList[i]);
            });
            browser.sleep(1000);
            const attachments = element.all(by.css('.file-list-item'));
            expect(attachments.count()).toBeGreaterThanOrEqual(1);
          });
        }));
      });
      element(by.id('modalClose')).click().then(() => {
        browser.sleep(500);
      });
    }
  });

});
