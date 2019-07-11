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
  constructor(
    private httpClient: HttpClient,
    private env: EnvService,
  ) {
  }
  claimForm(form: NgForm) {
    this.expensesAmount = !((typeof form.value.amount !== 'number') || (form.value.amount < 0.1));
    this.expensesNote = !((typeof form.value.note !== 'string') || form.value.note === '');
    if (this.expensesNote && this.expensesAmount) {
      const obj = JSON.parse('{ "amount":' + form.value.amount + ', "note":"' + form.value.note + ' "}');
      this.httpClient.post(this.env.apiUrl + '/employees/expenses',
        obj)
        .subscribe(
          (val) => {
            console.log('>> POST SUCCESS',
              val);
          }, response => {
            console.error('>> POST FAILED', response.message);
          });
    }
  }
}
