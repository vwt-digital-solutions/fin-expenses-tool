import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {EnvService} from 'src/app/services/env.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {NgForm} from '@angular/forms';

import {ExpensesConfigService} from '../../services/config.service';
import * as moment from 'moment';

moment.locale('nl');


@Component({
  selector: 'app-expenses',
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.scss']
})

export class FinanceComponent implements OnInit {
  private gridApi;
  private gridColumnApi;
  public columnDefs;
  public rowSelection;
  public typeOptions;
  public formSubmitted;
  public showErrors;
  public formErrors;
  public formResponse;

  constructor(
    private httpClient: HttpClient,
    private env: EnvService,
    private expenses: ExpensesConfigService,
    private modalService: NgbModal
  ) {
    this.columnDefs = [
      {
        headerName: 'Declaraties Overzicht',
        children: [
          {
            headerName: '',
            field: 'info',
            width: 65,
            cellRenderer: params => {
              const infoIcon = '<i id="information-icon" class="fa fa-info-circle"></i>';
              return `<span style="color: #008BB8" id="${params.value}">${infoIcon}</span>`;
            },
          },
          {
            headerName: 'Declaratiedatum',
            field: 'date_of_claim',
            sortable: true,
            filter: true,
          },
          {
            headerName: 'Werknemer', field: 'employee_full_name',
            sortable: true, filter: true, width: 150
          },
          {
            headerName: 'Kosten', field: 'amount', valueFormatter: FinanceComponent.decimalFormatter,
            sortable: true, filter: true, width: 150
          },
          {
            headerName: 'Soort', field: 'cost_type',
            sortable: true, filter: true, resizable: true, width: 300
          },
          {
            headerName: 'Beschrijving', field: 'note', resizable: true
          },
          {
            headerName: 'Verwervingsdatum', field: 'date_of_transaction',
            sortable: true, filter: true, width: 150
          },
          {
            headerName: 'Status', field: 'status_text',
            sortable: true, width: 250
          },
        ]
      }
    ];
    this.formSubmitted = false;
    this.showErrors = false;
    this.formResponse = {};
    this.rowSelection = 'single';
    this.addBooking = {success: false, wrong: false, error: false};
  }
  public expenseData: object;
  public addBooking;

  historyColumnDefs = [
    {
      headerName: 'Grootboekbestand', field: 'date_exported',
      sortable: true, filter: true, cellStyle: {cursor: 'pointer'},
      suppressMovable: true, width: 215
    },
    {
      headerName: 'Betaalbestand', field: '', cellStyle: {cursor: 'pointer'},
      template: '<i class="fa fa-file-alt" style="color: #4eb7da; font-size: 20px"></i>'
    }
  ];

  rowData = null;
  historyRowData = null;

  static formatNumber(numb) {
    return ((numb).toFixed(2)).toString().replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  }

  static decimalFormatter(amounts) {
    return '€ ' + FinanceComponent.formatNumber(amounts.value);
  }

  static getUTCOffset(date) {
    return moment(date).utcOffset() / 60;
  }

  historyHit(event) {
    if (event.colDef.template === undefined) {
      this.downloadFromHistory(event);
    } else {
      this.downloadPaymentFile(event);
    }
  }

  openExpenseDetailModal(content, data) {
    this.modalService.open(content, { centered: true });
  }

  getNextExpense() {
    console.log('Next');
  }

  onGridReady(params: any) {
    const api = [];
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    this.expenses.getExpenses().subscribe(data => {
      data.map(
        item => api.push({
          info: item.id,
          date_of_claim: moment(item.date_of_claim).add(
            FinanceComponent.getUTCOffset(item.date_of_claim), 'hours').format('LLL'),
          employee_full_name: item.employee.full_name,
          amount: item.amount,
          cost_type: item.cost_type,
          note: item.note,
          date_of_transaction: item.date_of_transaction,
          status_text: item.status.text
        })
      );
      this.rowData = api;
    });
  }

  onSelectionChanged(event, content) {
    const selectedRows = event.api.getSelectedRows();
    const selectedRowData = {};
    selectedRows.map((selectedRow, index) => {
      index !== 0 ?
        console.log('No selection') : Object.assign(selectedRowData, selectedRow);
    });
    this.expenseData = selectedRowData;
    this.showErrors = false;
    this.formErrors = '';
    this.openExpenseDetailModal(content, selectedRowData);
  }

  ngOnInit() {
    this.callHistoryRefresh();
    this.expenses.getCostTypes()
      .subscribe(
        val => {
          this.typeOptions = val;
        });
  }

  callHistoryRefresh() {
    this.historyRowData = this.httpClient.get(this.env.apiUrl + '/finances/expenses/booking_file/files');
  }

  resetPopups() {
    this.addBooking.success = false;
    this.addBooking.wrong = false;
    this.addBooking.error = false;
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

  downloadPaymentFile(event) {
    this.resetPopups();
    const fileData = event.data.file_name.split('/').slice(2).join('_').slice(5).split('.')[0];
    this.httpClient.get(this.env.apiUrl + '/finances/expenses/documents/' + fileData + '/kinds/payment_file',
      {responseType: 'blob'})
      .subscribe(
        (response) => {
          console.log(fileData);
          const blob = new Blob([response], {type: 'application/xml'});
          const a = document.createElement('a');
          document.body.appendChild(a);
          const url = window.URL.createObjectURL(blob);
          a.href = url;
          a.download = fileData.split('_')[2] + '.xml';
          a.click();
          window.URL.revokeObjectURL(url);
          console.log('>> GET SUCCESS', response);
        }, response => {
          this.errorBooking();
          console.error('>> GET FAILED', response.message);
        });
  }

  downloadFromHistory(event) {
    this.resetPopups();
    const fileData = event.data.file_name.split('/').slice(2).join('_').slice(5);
    this.httpClient.get(this.env.apiUrl + '/finances/expenses/documents/' + fileData + '/kinds/booking_file',
      {responseType: 'blob'})
      .subscribe(
        (response) => {
          const blob = new Blob([response], {type: 'text/csv'});
          const a = document.createElement('a');
          document.body.appendChild(a);
          const url = window.URL.createObjectURL(blob);
          a.href = url;
          a.download = event.data.date_exported;
          a.click();
          window.URL.revokeObjectURL(url);
          console.log('>> GET SUCCESS', response);
        }, response => {
          this.errorBooking();
          console.error('>> GET FAILED', response.message);
        });
  }

  createBookingFile() {
    this.resetPopups();
    this.httpClient.post(this.env.apiUrl + '/finances/expenses/booking_file/files', '', {responseType: 'blob', observe: 'response'})
      .subscribe(
        (response) => {
          if (response.body.type === 'application/json') {
            this.noExpenses();
            console.log('>> GET EMPTY', response);
          } else {
            const contentDispositionHeader = response.headers.get('Content-Disposition');
            const result = contentDispositionHeader.split('=')[1].split(';')[0];
            const blob = new Blob([response.body], {type: 'text/csv'});
            const a = document.createElement('a');
            document.body.appendChild(a);
            const url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = result;
            a.click();
            window.URL.revokeObjectURL(url);
            this.successfulDownload();
            this.callHistoryRefresh();
            console.log('>> GET SUCCESS', response);
            this.createPaymentFile(contentDispositionHeader);
          }
        }, response => {
          this.errorBooking();
          console.error('>> GET FAILED', response.message);
        });
  }

  createPaymentFile(event) {
    this.resetPopups();
    const fileData = event.split('=')[2];
    // tslint:disable-next-line:max-line-length
    this.httpClient.post(this.env.apiUrl + '/finances/expenses/payment_file/files?name=' + fileData, '', {
      responseType: 'blob',
      observe: 'response'
    })
      .subscribe(
        (response) => {
          console.log('>> GET SUCCESS', response);
        }, response => {
          console.error('>> GET FAILED', response.message);
        });
  }

  claimUpdateForm(form: NgForm, expenseId) {
    console.log(form.value, expenseId, form.valid);
    const dataVerified = {};
    const data = form.value;
    for (const prop in data) {
      if (data[prop].length !== 0) {
        dataVerified[prop] = data[prop];
      }
    }
    Object.keys(dataVerified).length !== 0 ?
      this.expenses.updateExpense(dataVerified, expenseId)
        .subscribe(
          result => this.showErrors = false,
          error => { this.showErrors = true, Object.assign(this.formResponse, JSON.parse(error)); })
   : (this.showErrors = true, this.formErrors = 'Geen gegevens geüpdatet');
    console.log(this.formResponse);

}
}
