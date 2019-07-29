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
  public today;
  public transdateNotFilledMessage = 'Graag een geldige verwervingsdatum invullen';
  public locatedFile;
  constructor(
    private httpClient: HttpClient,
    private env: EnvService,
  ) {
    this.httpClient.get(this.env.apiUrl + '/employees/cost-types')
      .subscribe(
        (val) => {
          this.typeOptions = val;
          console.log('>> GET SUCCESS');
        }, response => {
          console.error('>> GET FAILED', response.message);
        });
    this.addClaimSuccess = { success: false, wrong: false };
    this.today = new Date();
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

  onFileInput(file) {
    const reader = new FileReader();
    reader.readAsDataURL(file[0]);
    reader.onload = () => {
      this.locatedFile = reader.result;
    };
  }
  claimForm(form: NgForm) {
    // Check Form Data
    this.expensesAmount = !((typeof form.value.amount !== 'number') || (form.value.amount < 0.01));
    this.expensesNote = !((typeof form.value.note !== 'string') || form.value.note === '');
    this.expenseType = !(form.value.cost_type === undefined);
    this.expenseTransDate = !(form.value.date_of_transaction === undefined || new Date(form.value.date_of_transaction) > this.today);
    if (form.value.date_of_transaction !== undefined) { if (form.value.date_of_transaction.length > 8) {
      this.transdateNotFilledMessage = 'Declaraties kunnen alleen gedaan worden na de verwerving';
    }}
    if (this.expensesNote && this.expensesAmount && this.expenseType && this.expenseTransDate && this.addClaimSuccess.success === false) {
      // End Check Form Data
      // Format Values
      form.value.amount = Number((form.value.amount).toFixed(2));
      const formattedDate = new Date(form.value.date_of_transaction);
      form.value.date_of_transaction = formattedDate.getDate() + '-' + (formattedDate.getMonth() + 1) + '-' + formattedDate.getFullYear();
      const obj = JSON.parse(JSON.stringify(form.value));
      // End Format Values
      // Send Claim
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
