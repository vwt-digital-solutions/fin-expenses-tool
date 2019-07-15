import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { EnvService } from 'src/app/services/env.service';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent {
  public formNote;
  public formAmount;
  public expensesAmount;
  public expensesNote;
  public addClaimSuccess;
  constructor(
    private httpClient: HttpClient,
    private env: EnvService,
  ) {
    this.addClaimSuccess = { success: false, wrong: false };
  }

  // Classes Logic

  notFilledClass(setClass) {
    let starBool;
    if (setClass.name === 'amount') {
      starBool = this.expensesAmount === false;
    } else if (setClass.name === 'note') {
      starBool = this.expensesNote === false;
    }
    return starBool || (setClass.invalid && (setClass.dirty || setClass.touched));
  }

  successfulClaim() {
    return this.addClaimSuccess.success = true;
  }

  wrongfulClaim() {
    return this.addClaimSuccess.wrong = true;
  }
  submitButtonController(nnote, namount) {
    return this.expensesNote === false || this.expensesAmount === false ||
      nnote.invalid || namount.invalid || this.addClaimSuccess.success === true;
  }

  // End Classes Logic


  claimForm(form: NgForm) {
    this.expensesAmount = !((typeof form.value.amount !== 'number') || (form.value.amount < 0.01));
    this.expensesNote = !((typeof form.value.note !== 'string') || form.value.note === '');
    if (this.expensesNote && this.expensesAmount && this.addClaimSuccess.success === false) {
      const obj = JSON.parse('{ "amount":' + form.value.amount + ', "note":"' + form.value.note + ' "}');
      this.httpClient.post(this.env.apiUrl + '/employees/expenses',
        obj)
        .subscribe(
          (val) => {
            this.successfulClaim();
            console.log('>> POST SUCCESS', val);
          }, response => {
            this.wrongfulClaim();
            console.error('>> POST FAILED', response.message);
          });
    }
  }
}
