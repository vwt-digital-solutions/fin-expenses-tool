import {Component, OnInit} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import { EnvService } from 'src/app/services/env.service';

@Component({
  selector: 'app-expenses',
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.scss']
})
export class FinanceComponent implements OnInit {
  constructor(
    private httpClient: HttpClient,
    private env: EnvService,
  ) {
    this.addBooking = { success: false, wrong: false};
  }
  public formTransDate;
  public addBooking;
  columnDefs = [
    {headerName: 'Declaratiedatum', field: 'date_of_claim',
      sortable: true, filter: true },
    {headerName: 'Werknemer', field: 'employee.full_name',
      sortable: true, filter: true },
    {headerName: 'Kosten', field: 'amount',
      sortable: true, filter: true },
    {headerName: 'Soort', field: 'cost_type',
      sortable: true, filter: true },
    {headerName: 'Beschrijving', field: 'note',
      filter: true },
    {headerName: 'Verwervingsdatum', field: 'date_of_transaction',
      sortable: true, filter: true }
  ];
  historyColumnDefs = [
    {headerName: 'Grootboekhistorie', field: 'date_exported',
      sortable: true, filter: true,
      suppressMovable: true, width: 215},
    {headerName: '', field: '',
      template: '<i class="fa fa-file-excel"></i>', width: 35}
  ];

  rowData = null;
  historyRowData = null;
  ngOnInit() {
    this.rowData = this.httpClient.get(this.env.apiUrl + '/employees/expenses');
    this.historyRowData = this.httpClient.get('http://localhost:8080/finance/expenses/bookings/documents/exports?date_id=' + 'all');
  }
  successfulDownload() {
    return this.addBooking.success = true;
  }
  noExpenses() {
    return this.addBooking.wrong = true;
  }
  downloadFromHistory(event) {
    console.log(event.data.date_exported);
    this.httpClient.get('http://localhost:8080/finance/expenses/bookings/documents/exports?date_id='
      + event.data.date_exported, {responseType: 'blob'})
      .subscribe(
        (response) => {
          const blob = new Blob([response], { type: 'text/csv' });
          const a = document.createElement('a');
          document.body.appendChild(a);
          const url = window.URL.createObjectURL(blob);
          a.href = url;
          a.download = event.data.date_exported;
          a.click();
          window.URL.revokeObjectURL(url);
          console.log('>> GET SUCCESS', response);
        }, response => {
          console.error('>> GET FAILED', response.message);
        });
  }
  createBookingFile() {
    this.httpClient.get('http://localhost:8080/finance/expenses/bookings/documents', {responseType: 'blob'})
      .subscribe(
        (response) => {
          if (response.type === 'application/json') {
            this.noExpenses();
          } else {
            const blob = new Blob([response], { type: 'text/csv' });
            this.successfulDownload();
            // FinanceComponent.download('test.csv', blob);
            const a = document.createElement('a');
            document.body.appendChild(a);
            const url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = 'grootboek.csv';
            a.click();
            window.URL.revokeObjectURL(url);
          }
          console.log('>> GET SUCCESS', response);
        }, response => {
          this.noExpenses();
          console.error('>> GET FAILED', response.message);
        });
  }
  // searchHistory() {
  //   const dataDate = document.getElementById('historylist').getElementsByTagName('li');
  //   // tslint:disable-next-line:prefer-for-of
  //   for (let i = 0; i < dataDate.length; i++) {
  //     const a = dataDate[i].getElementsByTagName('a')[0];
  //     const txtValue = a.textContent || a.innerText;
  //     if (txtValue.indexOf(this.formTransDate) > -1) {
  //       dataDate[i].style.display = '';
  //     } else {
  //       dataDate[i].style.display = 'none';
  //     }
  //   }
  // }
}
