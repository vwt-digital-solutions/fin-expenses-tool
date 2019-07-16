import {Component, OnInit} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { EnvService } from 'src/app/services/env.service';

@Component({
  selector: 'app-expenses',
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.scss']
})
export class FinanceComponent implements OnInit {
  columnDefs = [
    {headerName: 'Werknemer', field: 'employee.full_name' },
    {headerName: 'Email', field: 'employee.email' },
    {headerName: 'Kosten', field: 'amount' },
    {headerName: 'Soort', field: 'cost_type' },
    {headerName: 'Beschrijving', field: 'note'}
  ];

  rowData = null;
  constructor(
    private httpClient: HttpClient,
    private env: EnvService,
  ) {
  }
  ngOnInit() {
    this.rowData = this.httpClient.get(this.env.apiUrl + '/employees/expenses');
  }
  getExpensesData() {
    this.httpClient.get(this.env.apiUrl + '/employees/expenses')
      .subscribe(
        (val) => {
          console.log('>> GET SUCCESS', val);
        });
  }
}
