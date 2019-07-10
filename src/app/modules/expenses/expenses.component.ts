import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import {isNumber, isString} from 'util';
import {HttpClient, HttpHeaders} from '@angular/common/http';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent {
  public formNote;
  public formAmount;
  constructor(private http: HttpClient) {
  }
  claimForm(form: NgForm) {
    console.log(form.value);
    const obj = JSON.parse('{ "amount":' + form.value.amount + ', "note":"' + form.value.note + ' "}');
    // tslint:disable-next-line:max-line-length
    if (form.value.amount === null || form.value.amount === '' || form.value.note === '' || !isNumber(form.value.amount) || !isString(form.value.note)) {
      // Change this validation with a better function
      alert('Wrong data'); // Testing Alert
    } else {
      this.http.post('http://192.168.1.49:8080/employees/expenses',
        obj)
        .subscribe(
          (val) => {
            console.log('POST call successful value returned in body',
              val);
          },
          response => {
            console.log('POST call in error', response);
          },
          () => {
            console.log('The POST observable is now completed.');
          });
    }
  }
}



