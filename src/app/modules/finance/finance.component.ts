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
    this.addBooking = { success: false, wrong: false, error: false};
  }
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
      sortable: true, filter: true },
    {headerName: 'Status', field: 'status.text',
      sortable: true }
  ];
  historyColumnDefs = [
    {headerName: 'Grootboekhistorie', field: 'date_exported',
      sortable: true, filter: true, cellStyle: {cursor: 'pointer'},
      suppressMovable: true, width: 215},
    {headerName: '', field: '', cellStyle: {cursor: 'pointer'},
      template: '<i class="fa fa-file-excel"></i>', width: 35}
  ];

  rowData = null;
  historyRowData = null;
  ngOnInit() {
    this.rowData = this.httpClient.get(this.env.apiUrl + '/finances/expenses');
    this.callHistoryRefresh();
  }
  callHistoryRefresh() {
    this.historyRowData = this.httpClient.get(this.env.apiUrl + '/finances/expenses/bookings');
  }
  successfulDownload() {
    return this.addBooking.success = true;
  }
  noExpenses() {
    return this.addBooking.wrong = true;
  }
  errorBooking() {
    return this.addBooking.error = true;
  }
  downloadFromHistory(event) {
    const fileData = event.data.file_name.split('/').slice(2).join('_');
    this.httpClient.get(this.env.apiUrl + '/finances/expenses/bookings/' + fileData + '/booking-files',
      {responseType: 'blob'})
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
    // tslint:disable-next-line:max-line-length
    this.httpClient.post('http://localhost:8080' + '/finances/expenses/bookings', '', {responseType: 'blob', observe: 'response', withCredentials: true})
      .subscribe(
        (response) => {
          if (response.body.type === 'application/json') {
            this.noExpenses();
            console.log('>> GET EMPTY', response);
          } else {
            const blob = new Blob([response.body], { type: 'text/csv' });
            const a = document.createElement('a');
            document.body.appendChild(a);
            const url = window.URL.createObjectURL(blob);
            a.href = url;
            console.log(response.headers);
            a.download = 'Nieuw_Grootboek.csv';
            a.click();
            window.URL.revokeObjectURL(url);
            this.successfulDownload();
            console.log('>> GET SUCCESS', response);
          }
        }, response => {
          this.errorBooking();
          console.log(response);
          console.error('>> GET FAILED', response.message);
        });
  }
}
