import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { EnvService } from 'src/app/services/env.service';

@Component({
  selector: 'app-expenses',
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.scss']
})
export class FinanceComponent {
  constructor(
    private httpClient: HttpClient,
    private env: EnvService,
  ) {
  }
  getExpensesData() {
    this.httpClient.get(this.env.apiUrl + '/employees/expenses')
      .subscribe(
            (val) => {
              console.log('>> GET SUCCESS', val);
            });
  }
}
