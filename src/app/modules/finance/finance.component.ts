import {Component, OnInit, ChangeDetectorRef} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {EnvService} from 'src/app/services/env.service';
import {NgbModal, ModalDismissReasons} from '@ng-bootstrap/ng-bootstrap';
import {NgForm} from '@angular/forms';
import {OAuthService} from 'angular-oauth2-oidc';
import {ExpensesConfigService} from '../../services/config.service';
import * as moment from 'moment';
import {DomSanitizer} from '@angular/platform-browser';

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
  private receiptFiles;
  private isRejecting;
  private monthNames;
  private denySelection;
  public today;
  public wantsRejectionNote;
  public selectedRejection;
  public noteData;
  public isLoading;

  constructor(
    private httpClient: HttpClient,
    private env: EnvService,
    private expenses: ExpensesConfigService,
    private modalService: NgbModal,
    private oauthService: OAuthService,
    private sanitizer: DomSanitizer,
    private detect: ChangeDetectorRef,
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
              return FinanceComponent.getCorrectDate(params.value);
            },
          },
          {
            headerName: 'Werknemer', field: 'employee',
            sortable: true, filter: true, width: 200, resizable: true
          },
          {
            headerName: 'Kosten', field: 'amount', valueFormatter: FinanceComponent.decimalFormatter,
            sortable: true, filter: true, width: 150, cellStyle: {'text-align': 'right'}
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
            sortable: true, filter: true, width: 150,
            cellRenderer: params => {
              return this.fixDate(params.value);
            }
          },
          {
            headerName: 'Status', field: 'status.text',
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
      headerName: '',
      children: [
        {
          headerName: '', field: 'date_exported',
          sortable: true, filter: true, cellStyle: {cursor: 'pointer'},
          suppressMovable: true, width: 180
        },
        {
          headerName: '', field: '', cellStyle: {cursor: 'pointer'}, width: 65,
          template: '<i class="fas fa-file-excel" style="color: #4eb7da; font-size: 20px;"></i>'
        },
        {
          headerName: '', field: '', cellStyle: {cursor: 'pointer'}, width: 65,
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

  static getCorrectDate(date) {
    const d = new Date(date);
    return d.getDate() + '-' + (d.getMonth() + 1) + '-' + d.getFullYear() + ' ' + ('0' + d.getHours()).substr(-2) + ':' +
      ('0' + d.getMinutes()).substr(-2) + ':' + ('0' + d.getSeconds()).substr(-2);
  }

  static getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  openSanitizeFile(type, file) {
    const isIEOrEdge = /msie\s|trident\/|edge\//i.test(window.navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    if (isIEOrEdge) {
      if (type === 'application/pdf') {
        alert('Please use Chrome or Firefox to view this file');
      } else {
        const win = window.open();
        // @ts-ignore
        // tslint:disable-next-line:max-line-length
        win.document.write('<img src="' + this.sanitizer.bypassSecurityTrustUrl('data:' + type + ';base64,' + encodeURI(file)).changingThisBreaksApplicationSecurity + '" alt="">');
      }
    } else {
      const win = window.open();
      if (navigator.userAgent.match(/Android/i)
        || navigator.userAgent.match(/webOS/i)
        || navigator.userAgent.match(/iPhone/i)
        || navigator.userAgent.match(/iPad/i)
        || navigator.userAgent.match(/iPod/i)
        || navigator.userAgent.match(/BlackBerry/i)
        || navigator.userAgent.match(/Windows Phone/i)) {
        win.document.write('<p>Problemen bij het weergeven van het bestand? Gebruik Edge Mobile of Samsung Internet.</p>');
      } else if (!isChrome) {
        win.document.write('<p>Problemen bij het weergeven van het bestand? Gebruik Chrome of Firefox.</p>');
      }
      // @ts-ignore
      // tslint:disable-next-line:max-line-length no-unused-expression
      win.document.write('<iframe src="' + this.sanitizer.bypassSecurityTrustUrl('data:' + type + ';base64,' + encodeURI(file)).changingThisBreaksApplicationSecurity + '" frameborder="0" style="border:0; top:auto; left:0; bottom:0; right:0; width:100%; height:100%;" allowfullscreen></iframe>');
    }
  }

  fixDate(date) {
    const stepDate = new Date(date);
    return stepDate.getDate() + ' ' + this.monthNames[(stepDate.getMonth())] + ' ' + stepDate.getFullYear();
  }

  getFileName(name) {
    return (name.split('/')).slice(-1)[0];
  }

  historyHit(event) {
    if (event.colDef.template !== '<i class="fas fa-file-powerpoint" style="color: #4eb7da; font-size: 20px;"></i>') {
      this.downloadFromHistory(event);
    } else {
      this.downloadPaymentFile(event);
    }
  }

  onRowClicked(event, content) {
    if (!this.isLoading) { // Stalls click spam
      this.isLoading = true;
      this.gridApi = event.api;
      this.formSubmitted = false;
      this.showErrors = false;
      this.formErrors = '';
      this.isRejecting = false;
      this.wantsRejectionNote = false;
      this.expenseData = event.data;
      this.selectedRejection = 'Deze kosten kun je declareren via Regweb (PSA)';
      this.expenses.getFinanceAttachment(event.data.id).subscribe((image: ExpensesIfc) => {
        this.receiptFiles = [];
        // @ts-ignore
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < image.length; i++) {
          if (!(this.receiptFiles.includes(image[i]))) { // Stalls multiple attachments on mobile
            this.receiptFiles.push(image[i]);
          }
        }
        this.isLoading = false;
        this.modalService.open(content, {centered: true}).result.then((result) => {
          this.gridApi.deselectAll();
          this.denySelection = true;
          this.wantsRejectionNote = false;
          console.log(`Closed with: ${result}`);
        }, (reason) => {
          this.gridApi.deselectAll();
          this.denySelection = true;
          console.log(`Dismissed ${FinanceComponent.getDismissReason(reason)}`);
        });
      });
    }
  }

  rejectionHit(event) {
    this.wantsRejectionNote = (event.target.value === 'note');
    this.selectedRejection = event.target.value;
    this.noteData = '';
  }

  updatingAction(event) {
    this.action = event;
    if (event === 'rejecting') {
      this.isRejecting = true;
    }
  }

  getNextExpense() {
    this.modalService.dismissAll();
  }

  onGridReady(params: any) {
    this.gridColumnApi = params.columnApi;
    // @ts-ignore
    this.expenses.getExpenses().subscribe((data: ExpensesIfc) => this.rowData = [...data]);
    const claimJaneDoe = this.oauthService.getIdentityClaims() as IClaimRoles;
    this.OurJaneDoeIs = claimJaneDoe.roles[0].split('.')[0];
  }

  ngOnInit() {
    this.today = new Date();
    this.denySelection = false;
    this.monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
    ];
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
          const contentDispositionHeader = response.headers.get('Content-Disposition');
          const result = contentDispositionHeader.split('=')[1].split(';')[0];
          const blob = new Blob([response.body], {type: 'text/xml'});
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
        }, response => {
          console.error('>> GET FAILED', response.message);
        });
  }

  // tslint:disable-next-line:variable-name
  submitButtonController(namount, ntype, ntransdate, rnote) {
    if (this.wantsRejectionNote) {
      return rnote.invalid || namount.invalid || ntype.invalid
        || ntransdate.invalid || (new Date(ntransdate.viewModel)
          > this.today) || namount.viewModel < 0.01;
    } else {
      return namount.invalid || ntype.invalid
        || ntransdate.invalid || (new Date(ntransdate.viewModel)
          > this.today) || namount.viewModel < 0.01;
    }
  }

  claimUpdateForm(form: NgForm, expenseId, instArray) {
    if (!this.submitButtonController(instArray[0], instArray[1], instArray[2], instArray[3])) {
      const dataVerified = {};
      const data = form.value;
      data.amount = Number((data.amount).toFixed(2));
      data.date_of_transaction = (new Date(data.date_of_transaction).getTime());
      if (!(this.wantsRejectionNote)) {
        data.rnote = this.selectedRejection;
      }
      for (const prop in data) {
        if (prop.length !== 0) {
          dataVerified[prop] = data[prop];
        }
      }
      const action = this.action;
      dataVerified[`status`] = action === 'approving' ? `approved` :
        action === 'rejecting' ? `rejected_by_creditor` : null;
      Object.keys(dataVerified).length !== 0 || this.formSubmitted === true ?
        this.expenses.updateExpenseFinance(dataVerified, expenseId)
          .subscribe(
            result => {
              this.getNextExpense();
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
}
