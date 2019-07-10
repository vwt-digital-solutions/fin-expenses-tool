import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import {HttpClient, HttpHeaders} from '@angular/common/http';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent {
  public formNote;
  public formAmount;
  public eamount;
  public enote;
  constructor(private http: HttpClient) {
  }
  claimForm(form: NgForm) {
    console.log(form.value);
    // tslint:disable-next-line:max-line-length
    // form.value.amount === null || form.value.note === null || form.value.amount === '' || form.value.note === '' || !isNumber(form.value.amount) || !isString(form.value.note)
    if ((typeof form.value.amount !== 'number') || (form.value.amount < 0.1)) { this.eamount = false; } else { this.eamount = true; }
    if ((typeof form.value.note !== 'string')) { this.enote = false; } else { this.enote = true; }
    if (this.enote && this.eamount) {
      const timeout = 5;
      const obj = JSON.parse('{ "amount":' + form.value.amount + ', "note":"' + form.value.note + ' "}');
      this.http.post('http://192.168.1.49:8080/employees/expenses',
        obj)
        .subscribe(
          (val) => {
            console.log('POST successful and value has been added with API: ',
              val);
          }, response => {
            console.log('POST failed and API has sent as response with error: ', response);
            alert('Something went wrong. Try again later.');
          });
    }
  }
}



