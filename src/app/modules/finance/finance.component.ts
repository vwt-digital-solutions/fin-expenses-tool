import {Component, OnInit} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {EnvService} from 'src/app/services/env.service';
import {ModalDismissReasons, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ExpensesConfigService} from '../../config/config.service';
import {Observable} from 'rxjs';
import * as moment from 'moment';

@Component({
  selector: 'app-expenses',
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.scss']
})
export class FinanceComponent implements OnInit {
  closeResult: string;
  expensesData: Observable<any>;

  private gridApi;
  private gridColumnApi;
  private columnDefs;

  constructor(
    private httpClient: HttpClient,
    private env: EnvService,
    private expenses: ExpensesConfigService,
    private modalService: NgbModal
  ) {
      this.columnDefs = [
    {
      headerName: 'Process Expenses',
      children: [
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
      this.addBooking = {success: false, wrong: false, error: false};
  }

  public addBooking;


  historyColumnDefs = [
    {
      headerName: 'Grootboekhistorie', field: 'date_exported',
      sortable: true, filter: true, cellStyle: {cursor: 'pointer'},
      suppressMovable: true, width: 215
    },
    {
      headerName: 'Betaal', field: '', cellStyle: {cursor: 'pointer'},
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

  historyHit(event) {
    if (event.colDef.template === undefined) {
      this.downloadFromHistory(event);
    } else {
      this.downloadPaymentFile(event);
    }
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    // params.api.sizeColumnsToFit();
  }

  ngOnInit() {
    const api = [];
    this.expensesData = this.expenses.getExpenses();
    this.expenses.getExpenses().subscribe(data => {
      // console.log('Observable:', data);
      data.map(
        item => api.push({
          date_of_claim: moment(item.date_of_claim).format('LLL'),
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

    // this.rowData = api;
    this.callHistoryRefresh();
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

  open(content) {
    this.modalService.open(content, {ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }
}
