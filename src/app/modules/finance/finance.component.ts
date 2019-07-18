import {Component, OnInit} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { EnvService } from 'src/app/services/env.service';

@Component({
  selector: 'app-expenses',
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.scss']
})
export class FinanceComponent implements OnInit {
  public formTransDate;
  public addBooking;
  columnDefs = [
    {headerName: 'Werknemer', field: 'employee.full_name', sortable: true, filter: true },
    {headerName: 'Email', field: 'employee.email', sortable: true, filter: true },
    {headerName: 'Kosten', field: 'amount', sortable: true, filter: true },
    {headerName: 'Soort', field: 'cost_type', sortable: true, filter: true },
    {headerName: 'Beschrijving', field: 'note', filter: true }
  ];

  rowData = null;
  constructor(
    private httpClient: HttpClient,
    private env: EnvService,
  ) {
    this.addBooking = { success: false, wrong: false};
  }
  ngOnInit() {
    this.rowData = this.httpClient.get(this.env.apiUrl + '/employees/expenses');
  }
  successfulDownload() {
    return this.addBooking.success = true;
  }
  noExpenses() {
    return this.addBooking.wrong = true;
  }
  createBookingFile() {
    this.successfulDownload();
    this.download('test.txt', 'this is my content');
    // this.httpClient.post(this.env.apiUrl + '/finance/expenses/documents', '')
    //   .subscribe(
    //     (val) => {
    //       this.successfulDownload();
    //       console.log('>> POST SUCCESS', val);
    //     }, response => {
    //       this.noExpenses();
    //       console.error('>> POST FAILED', response.message);
    //     });
  }
  download(filename, text) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }
  searchHistory() {
    const dataDate = document.getElementById('historylist').getElementsByTagName('li');
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < dataDate.length; i++) {
      const a = dataDate[i].getElementsByTagName('a')[0];
      const txtValue = a.textContent || a.innerText;
      if (txtValue.indexOf(this.formTransDate) > -1) {
        dataDate[i].style.display = '';
      } else {
        dataDate[i].style.display = 'none';
      }
    }
  }
}
