import {Component} from '@angular/core';
import {NgForm} from '@angular/forms';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {EnvService} from 'src/app/services/env.service';

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
  public formAttachment;
  public expensesAmount;
  public expensesNote;
  public expenseType;
  public expenseTransDate;
  public expenseAttachment;
  public addClaimSuccess;
  public typeOptions;
  public today;
  public notaData;
  public transdateNotFilledMessage = 'Graag een geldige datum invullen';
  public locatedFile;
  public loadingThings;

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
    this.addClaimSuccess = {success: false, wrong: false};
    this.today = new Date();
    this.notaData = 'Toevoegen';
    this.loadingThings = false;
  }

  // Classes Logic
  notFilledClass(setClass) {
    let starBool;
    if (setClass.name === 'amount') {
      starBool = this.expensesAmount === false;
    }
    if (setClass.name === 'note') {
      starBool = this.expensesNote === false;
    }
    if (setClass.name === 'cost_type') {
      starBool = this.expenseType === false;
    }
    if (setClass.name === 'date_of_transaction') {
      starBool = this.expenseTransDate === false;
    }
    if (setClass.name === 'attachment') {
      starBool = this.expenseAttachment === false;
    }
    return starBool || (setClass.invalid && (setClass.dirty || setClass.touched));
  }

  successfulClaim() {
    return this.addClaimSuccess.success = true;
  }

  wrongfulClaim() {
    return this.addClaimSuccess.wrong = true;
  }

  submitButtonController(nnote, namount, ntype, ntransdate, nattachment) {
    return this.expensesNote === false || this.expensesAmount === false || this.expenseType === false || this.expenseTransDate === false ||
      this.expenseAttachment === false || nnote.invalid || namount.invalid || ntype.invalid || ntransdate.invalid ||
      nattachment.invalid || this.addClaimSuccess.success === true;
  }

  // End Classes Logic

  onFileInput(file) {
    if (file[0] === undefined || file[0] === null)  {
      this.locatedFile = '';
      this.notaData = 'Toevoegen';
    } else {
      const reader = new FileReader();
      reader.readAsDataURL(file[0]);
      reader.onload = () => {
        this.locatedFile = reader.result;
        this.notaData = '';
      };
    }
  }

  claimForm(form: NgForm) {
    // Check Form Data
    form.value.attachment = this.locatedFile;
    this.expensesAmount = !((typeof form.value.amount !== 'number') || (form.value.amount < 0.01));
    this.expensesNote = !((typeof form.value.note !== 'string') || form.value.note === '');
    this.expenseType = !(form.value.cost_type === undefined);
    this.expenseTransDate = !(form.value.date_of_transaction === undefined || new Date(form.value.date_of_transaction) > this.today);
    this.expenseAttachment = !(form.value.attachment === undefined || form.value.attachment === null);
    if (form.value.date_of_transaction !== undefined) {
      if (form.value.date_of_transaction.length > 8) {
        this.transdateNotFilledMessage = 'Declaraties kunnen alleen gedaan worden na de aankoop';
      }
    }
    if (this.expensesNote && this.expensesAmount && this.expenseType && this.expenseTransDate && this.expenseAttachment
      && this.addClaimSuccess.success === false) {
      this.loadingThings = true;
      // End Check Form Data
      // Format Values
      form.value.amount = Number((form.value.amount).toFixed(2));
      form.value.date_of_transaction = (new Date(form.value.date_of_transaction).getTime()) / 1000;

      const obj = JSON.parse(JSON.stringify(form.value));
      // End Format Values
      // Send Claim
      this.httpClient.post(this.env.apiUrl + '/employees/expenses',
        obj)
        .subscribe(
          (val) => {
            this.successfulClaim();
            this.loadingThings = false;
            console.log('>> POST SUCCESS', val);
          }, response => {
            this.wrongfulClaim();
            this.loadingThings = false;
            console.error('>> POST FAILED', response.message);
          });
    }
  }
}
