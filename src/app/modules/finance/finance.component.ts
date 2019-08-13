import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {EnvService} from 'src/app/services/env.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {NgForm} from '@angular/forms';
import {OAuthService} from 'angular-oauth2-oidc';
import {ExpensesConfigService} from '../../services/config.service';
import * as moment from 'moment';

moment.locale('nl');


interface ExpensesIfc {
  ['body']: any;
}

interface IClaimRoles {
  roles: any;
}

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
  private submitingStart: boolean;
  private action: any;
  private OurJaneDoeIs: string;
  private expenseDataRejection: ({ reason: string })[];
  private receiptImage: any;
  private receiptFiles;
  private isRejecting;

  constructor(
    private httpClient: HttpClient,
    private env: EnvService,
    private expenses: ExpensesConfigService,
    private modalService: NgbModal,
    private oauthService: OAuthService,
  ) {
    this.columnDefs = [
      {
        headerName: 'Declaraties Overzicht',
        children: [
          {
            headerName: '',
            field: 'id',
            width: 65,
            colId: 'id',
            cellRenderer: params => {
              const infoIcon = '<i id="information-icon" class="fa fa-edit"></i>';
              return `<span style="color: #008BB8" id="${params.value}">${infoIcon}</span>`;
            },
          },
          {
            headerName: 'Declaratiedatum',
            field: 'date_of_claim',
            sortable: true,
            filter: true,
            cellRenderer: params => {
              return moment(params.value).add(
                FinanceComponent.getUTCOffset(params.value), 'hours').format('LLL');
            },
          },
          {
            headerName: 'Werknemer', field: 'employee',
            sortable: true, filter: true, width: 200, resizable: true
          },
          {
            headerName: 'Kosten', field: 'amount', valueFormatter: FinanceComponent.decimalFormatter,
            sortable: true, filter: true, width: 150
          },
          {
            headerName: 'Soort', field: 'cost_type',
            sortable: true, filter: true, resizable: true, width: 200,
            cellRenderer: params => {
              return params.value.split(':')[0];
            }
          },
          {
            headerName: 'Beschrijving', field: 'note', resizable: true
          },
          {
            headerName: 'Bondatum', field: 'date_of_transaction',
            sortable: true, filter: true, width: 150
          },
          {
            headerName: 'Status', field: 'status.text',
            sortable: true, width: 250
          },
        ]
      }
    ];
    this.expenseDataRejection = [
      {reason: 'Niet Duidelijk'},
      {reason: 'Kan niet uitbetalen'}
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
      headerName: '',
      children: [
        {
          headerName: 'Geschiedenis', field: 'date_exported',
          sortable: true, filter: true, cellStyle: {cursor: 'pointer'},
          suppressMovable: true
        },
        {
          headerName: '', field: '', cellStyle: {cursor: 'pointer'}, width: 100,
          template: '<i class="fas fa-file-powerpoint" style="color: #4eb7da; font-size: 20px;"></i>'
        }
      ]
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

  getFileName(name) {
    return (name.split('/')).slice(-1)[0];
  }

  historyHit(event) {
    if (event.colDef.template === undefined) {
      this.downloadFromHistory(event);
    } else {
      this.downloadPaymentFile(event);
    }
  }

  openExpenseDetailModal(content, data) {
    this.receiptFiles = [];
    this.isRejecting = false;
    this.modalService.open(content, {centered: true});
  }

  updatingAction(event) {
    this.action = event;
    if (event === 'rejecting') {
      this.isRejecting = true;
    }
  }

  getNextExpense() {
    console.log('Next');
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    // @ts-ignore
    this.expenses.getExpenses().subscribe((data: ExpensesIfc) => this.rowData = [...data]);
    const claimJaneDoe = this.oauthService.getIdentityClaims() as IClaimRoles;
    this.OurJaneDoeIs = claimJaneDoe.roles[0].split('.')[0];
  }

  onSelectionChanged(event, content) {
    const selectedRows = event.api.getSelectedRows();
    const selectedRowData = {
      id: undefined
    };
    selectedRows.map((selectedRow, index) => {
      index !== 0 ?
        console.log('No selection') : Object.assign(selectedRowData, selectedRow);
    });
    this.expenses.getExpenseAttachment(selectedRowData.id).subscribe((image: ExpensesIfc) => {
      this.receiptImage = image[0].url;
      this.receiptFiles.push(this.receiptImage);
    });
    this.expenseData = selectedRowData;
    console.log('EXPENSEDATA: ', this.expenseData);
    this.formSubmitted = false;
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

  dismissExpenseModal() {
    const api = this.gridApi;
    api.deselectAll();
    setTimeout(() => {
      this.modalService.dismissAll();
    }, 200);
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
    const dataVerified = {};
    const data = form.value;
    for (const prop in data) {
      if (data[prop].length !== 0) {
        dataVerified[prop] = data[prop];
      }
    }
    const action = this.action;
    dataVerified[`status`] = action === 'approving' ? `approved_by_${this.OurJaneDoeIs}` :
      action === 'rejecting' ? `rejected_by_${this.OurJaneDoeIs}` : null;

    Object.keys(dataVerified).length !== 0 || this.formSubmitted === true ?
      this.expenses.updateExpense(dataVerified, expenseId)
        .subscribe(
          result => {
            // @ts-ignore
            this.expenses.getExpenses().subscribe((response: ExpensesIfc) => this.rowData = [...response]);
            this.showErrors = false;
            this.formSubmitted = !form.ngSubmit.hasError;
          },
          error => {
            this.showErrors = true;
            Object.assign(this.formResponse, JSON.parse(error));
          })
      : (this.showErrors = true, this.formErrors = 'Geen gegevens geüpdatet');

  }
}
