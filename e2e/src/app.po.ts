import {browser, protractor} from 'protractor';

export class ExpensesForm {
  async acceptAlertBox() {
    await browser.wait(
      protractor.ExpectedConditions.alertIsPresent(), 10000).then(() => {
        browser.switchTo().alert().then(alert => alert.accept());
    }).catch((error) => console.log(error));
    await browser.sleep(1000);
  }
}
