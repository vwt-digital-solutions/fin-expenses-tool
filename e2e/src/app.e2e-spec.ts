import { browser, protractor, by, element, Capabilities, Key } from 'protractor';
import { AppPage } from './app.po';
const request = require('request');

// tslint:disable-next-line:only-arrow-functions
describe('ExpenseApp:', function() {
  let page: AppPage;
  beforeEach(() => {
    page = new AppPage();
    browser.get('employees/expenses');
  });
  // tslint:disable-next-line:only-arrow-functions
  it('Should have a solid Title', function() {
    console.log('BROWSERTITLE: ' + page.getTitle());
    console.log('BROWSERURL: ' + browser.getTitle());
    expect(browser.getTitle).toEqual('Purchase2Pay: Expenses Tool');
  });
});
