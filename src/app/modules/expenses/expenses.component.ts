import {Component} from '@angular/core';
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
  public formType;
  public formTransDate;
  public expensesAmount;
  public expensesNote;
  public expenseType;
  public expenseTransDate;
  public addClaimSuccess;
  public typeOptions;

  constructor(
    private httpClient: HttpClient,
    private env: EnvService,
  ) {
    this.httpClient.get(this.env.apiUrl + '/employees/cost_types')
      .subscribe(
        (val) => {
          this.typeOptions = val;
          console.log('>> GET SUCCESS');
        }, response => {
          console.error('>> GET FAILED', response.message);
        });
    this.addClaimSuccess = { success: false, wrong: false };
  }
  // Classes Logic

  notFilledClass(setClass) {
    let starBool;
    if (setClass.name === 'amount') {starBool = this.expensesAmount === false; }
    if (setClass.name === 'note') {starBool = this.expensesNote === false; }
    if (setClass.name === 'cost_type') {starBool = this.expenseType === false; }
    if (setClass.name === 'date_of_transaction') {starBool = this.expenseTransDate === false; }
    return starBool || (setClass.invalid && (setClass.dirty || setClass.touched));
  }

  successfulClaim() {
    return this.addClaimSuccess.success = true;
  }

  wrongfulClaim() {
    return this.addClaimSuccess.wrong = true;
  }
  submitButtonController(nnote, namount, ntype, ntransdate) {
    return this.expensesNote === false || this.expensesAmount === false || this.expenseType === false || this.expenseTransDate === false ||
      nnote.invalid || namount.invalid || ntype.invalid || ntransdate.invalid || this.addClaimSuccess.success === true;
  }
  // End Classes Logic

  claimForm(form: NgForm) {
    this.expensesAmount = !((typeof form.value.amount !== 'number') || (form.value.amount < 0.01));
    this.expensesNote = !((typeof form.value.note !== 'string') || form.value.note === '');
    this.expenseType = !(form.value.cost_type === undefined);
    this.expenseTransDate = !(form.value.date_of_transaction === undefined);
    if (this.expensesNote && this.expensesAmount && this.expenseType && this.expenseTransDate && this.addClaimSuccess.success === false) {
      const obj = JSON.parse(JSON.stringify(form.value));
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
