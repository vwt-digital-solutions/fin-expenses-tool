import {Component, OnInit} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {EnvService} from 'src/app/services/env.service';
import {ModalDismissReasons, NgbModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-expenses',
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.scss']
})
export class FinanceComponent implements OnInit {
  closeResult: string;

  constructor(
    private httpClient: HttpClient,
    private env: EnvService,
    private modalService: NgbModal
  ) {
    this.addBooking = {success: false, wrong: false, error: false};
  }

  public addBooking;
  columnDefs = [
    {
      headerName: 'Declaratiedatum', field: 'date_of_claim',
      sortable: true, filter: true
    },
    {
      headerName: 'Werknemer', field: 'employee.full_name',
      sortable: true, filter: true
    },
    {
      headerName: 'Kosten', field: 'amount', valueFormatter: FinanceComponent.decimalFormatter,
      sortable: true, filter: true
    },
    {
      headerName: 'Soort', field: 'cost_type',
      sortable: true, filter: true
    },
    {
      headerName: 'Beschrijving', field: 'note',
      filter: true
    },
    {
      headerName: 'Verwervingsdatum', field: 'date_of_transaction',
      sortable: true, filter: true
    },
    {
      headerName: 'Status', field: 'status.text',
      sortable: true
    }
  ];
  historyColumnDefs = [
    {
      headerName: 'Grootboekhistorie', field: 'date_exported',
      sortable: true, filter: true, cellStyle: {cursor: 'pointer'},
      suppressMovable: true, width: 215
    },
    {
      headerName: '', field: '', cellStyle: {cursor: 'pointer'},
      template: '<i class="fa fa-tags" style="color: #4eb7da; font-size: 20px"></i>', width: 50
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

  ngOnInit() {
    this.rowData = this.httpClient.get(this.env.apiUrl + '/finances/expenses');
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
    console.log(fileData);
    this.httpClient.get(this.env.apiUrl + '/finances/expenses/documents/' + fileData + '/kinds/payment_file',
      {responseType: 'blob'})
      .subscribe(
        (response) => {
          const blob = new Blob([response], {type: 'application/xml'});
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
