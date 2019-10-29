import {Component, OnInit} from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {NgbModal, ModalDismissReasons} from '@ng-bootstrap/ng-bootstrap';
import {NgForm} from '@angular/forms';
import {ExpensesConfigService} from '../../services/config.service';
import * as moment from 'moment';
import {DomSanitizer} from '@angular/platform-browser';
import {FormaterService} from 'src/app/services/formater.service';
import {ActivatedRoute} from '@angular/router';
import {map} from 'rxjs/operators';

moment.locale('nl');


@Component({
  selector: 'app-expenses',
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.scss']
})

export class FinanceComponent implements OnInit {
  private gridApi;
  private historyGridApi;
  public columnDefs;
  public rowSelection;
  public typeOptions;
  public formSubmitted;
  public showErrors;
  public formErrors;
  public formResponse;
  private action: any;
  private receiptFiles;
  private isRejecting;
  private monthNames;
  public today;
  public wantsRejectionNote;
  public selectedRejection;
  public noteData;
  private currentRowIndex: number;

  private readonly paymentfilecoldef = '<i class="fas fa-credit-card" style="color: #4eb7da; font-size: 20px;"></i>';
  modalDefinition: any;

  constructor(
    private expenses: ExpensesConfigService,
    private modalService: NgbModal,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {
    this.columnDefs = [
      {
        headerName: 'Declaraties Overzicht',
        children: [
          {
            headerName: 'Declaratiedatum',
            field: 'claim_date',
            sortable: true,
            filter: true,
            cellRenderer: params => {
              return FormaterService.getCorrectDate(params.value);
            },
          },
          {
            headerName: 'Werknemer', field: 'employee',
            sortable: true, filter: true, width: 180, resizable: true
          },
          {
            headerName: 'Kosten', field: 'amount', valueFormatter: FormaterService.decimalFormatter,
            sortable: true, filter: true, width: 120, cellStyle: {'text-align': 'right'}
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
            headerName: 'Bondatum', field: 'transaction_date',
            sortable: true, filter: true, width: 150,
            cellRenderer: params => {
              return this.fixDate(params.value);
            }
          },
          {
            headerName: 'Status', field: 'status.text',
            sortable: true, width: 180
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
          headerName: '', field: 'export_date',
          sortable: true, filter: true,
          suppressMovable: true, width: 170,
          cellRenderer: params => {
            return FormaterService.getCorrectDate(params.value);
          }
        },
        {
          headerName: '', field: '', cellStyle: {cursor: 'pointer'}, width: 75,
          template: '<i class="fas fa-book" style="color: #4eb7da; font-size: 20px;"></i>'
        },
        {
          headerName: '', field: '', cellStyle: {cursor: 'pointer'}, width: 75,
          template: this.paymentfilecoldef
        }
      ]
    }
  ];

  rowData = null;
  historyRowData = null;

  static getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  private static getNavigator() {
    return navigator.userAgent.match(/Android/i)
      || navigator.userAgent.match(/webOS/i)
      || navigator.userAgent.match(/iPhone/i)
      || navigator.userAgent.match(/iPad/i)
      || navigator.userAgent.match(/iPod/i)
      || navigator.userAgent.match(/BlackBerry/i)
      || navigator.userAgent.match(/Windows Phone/i);
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
      if (FinanceComponent.getNavigator()) {
        win.document.write('<p>Problemen bij het weergeven van het bestand? Gebruik Edge Mobile of Samsung Internet.</p>');
      } else if (!isChrome) {
        win.document.write('<p>Problemen bij het weergeven van het bestand? Gebruik Chrome of Firefox.</p>');
      }
      const sanitizedExpr = 'data:' + type + ';base64,' + encodeURI(file);
      // tslint:disable-next-line:max-line-length no-unused-expression
      win.document.write('<iframe src="' + sanitizedExpr + '" frameborder="0" style="border:0; top:auto; left:0; bottom:0; right:0; width:100%; height:100%;" allowfullscreen></iframe>');
    }
  }

  fixDate(date) {
    const stepDate = new Date(date);
    return stepDate.getDate() + ' ' + this.monthNames[(stepDate.getMonth())] + ' ' + stepDate.getFullYear();
  }

  historyHit(event) {
    if (event.colDef.field === 'export_date') {
      return;
    }
    let blobType = 'application/xml';
    let downloadType = '.xml';
    let eventType = event.data.payment_file;
    if (event.colDef.template !== this.paymentfilecoldef) {
      blobType = 'text/csv';
      downloadType = '.csv';
      eventType = event.data.booking_file;
    }
    this.resetPopups();
    this.http.get(eventType, {responseType: 'text'})
      .subscribe(
        (response) => {
          const blob = new Blob([response], {type: blobType});
          const a = document.createElement('a');
          document.body.appendChild(a);
          const url = window.URL.createObjectURL(blob);
          a.href = url;
          a.download = FormaterService.getCorrectDate(event.data.export_date) + downloadType;
          a.click();
          window.URL.revokeObjectURL(url);
          console.log('>> GET SUCCESS');
        }, response => {
          this.errorBooking();
          console.error('>> GET FAILED', response.message);
        });
  }

  onRowClicked(event, content) {
    if (event === null || event === undefined) {
      this.dismissModal();
    } else {

      if (event.api !== null && event.api !== undefined) {
        this.gridApi = event.api;
      }
      this.formSubmitted = false;
      this.showErrors = false;
      this.formErrors = '';
      this.isRejecting = false;
      this.wantsRejectionNote = false;
      this.expenseData = event.data;
      this.modalDefinition = content;
      this.currentRowIndex = event.rowIndex;
      this.selectedRejection = 'Deze kosten kun je declareren via Regweb (PSA)';
      this.expenses.getFinanceAttachment(event.data.id).subscribe((image: any) => {
        this.receiptFiles = [];
        for (const img of image) {
          if (!(this.receiptFiles.includes(img))) {
            this.receiptFiles.push(img);
          }
        }
        this.modalService.open(content, {centered: true}).result.then((result) => {
          this.gridApi.deselectAll();
          this.wantsRejectionNote = false;
          console.log(`Closed with: ${result}`);
        }, (reason) => {
          this.gridApi.deselectAll();
          console.log(`Dismissed ${FinanceComponent.getDismissReason(reason)}`);
        });
      });
    }
  }

  rejectionHit(event) {
    this.wantsRejectionNote = (event.target.value === 'note');
    this.selectedRejection = event.target.value;
    this.noteData = '';
    if (this.wantsRejectionNote) {
      document.getElementById('rejection-note-group').style.visibility = 'visible';
      document.getElementById('rejection-note-group').style.display = 'block';
    } else {
      document.getElementById('rejection-note-group').style.visibility = 'hidden';
      document.getElementById('rejection-note-group').style.display = 'none';
    }
  }

  updatingAction(event) {
    this.action = event;
    if (event === 'rejecting') {
      this.isRejecting = true;
    }
  }

  getNextExpense() {
    this.dismissModal();
    setTimeout(() => {
      this.onRowClicked(this.gridApi.getDisplayedRowAtIndex(this.currentRowIndex + 1), this.modalDefinition);
    }, 100);
  }

  dismissModal() {
    this.modalService.dismissAll();
  }

  onHistoryGridReady(params: any) {
    this.historyGridApi = params.api;
  }

  ngOnInit() {
    this.today = new Date();
    this.monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
    ];
    this.callHistoryRefresh();
    this.route.data.pipe(
      map(data => data.costTypes)
    ).subscribe(costTypes => this.typeOptions = [...costTypes]);
    this.expenses.getExpenses().subscribe((data: any) => this.rowData = [...data]);
  }

  callHistoryRefresh() {
    this.expenses.getDocumentsList()
      .subscribe(result => this.historyRowData = [...result.file_list]);
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

  createBookingFile() {
    this.resetPopups();
    this.expenses.createBookingFile({observe: 'response'})
      .subscribe(
        (response: HttpResponse<any>) => {
          if (response.body.hasOwnProperty('Info')) {
            this.noExpenses();
          } else {
            // @ts-ignore
            this.historyRowData.unshift(response.body.file_list[0]);
            this.historyGridApi.setRowData(this.historyRowData);
            this.successfulDownload();
          }
          console.log('>> POST SUCCES');
        }, response => {
          this.errorBooking();
          console.error('>> POST FAILED', response.message);
        });
  }

  submitButtonController(ntype: { invalid: boolean }) {
    return ntype.invalid;
  }

  claimUpdateForm(form: NgForm, expenseId, type) {
    if (!this.submitButtonController(type)) {
      const dataVerified = {};
      const data = form.value;
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
              this.expenses.getExpenses().subscribe((response: any) => {
                this.rowData = [...response];
                this.getNextExpense();
              });
              this.showErrors = false;
              this.formSubmitted = !form.ngSubmit.hasError;
              console.log('>> PUT SUCCESS', result);
            },
            error => {
              this.showErrors = true;
              Object.assign(this.formResponse, JSON.parse(error));
              console.error('>> PUT FAILED', error.message);
            })
        : (this.showErrors = true, this.formErrors = 'Geen gegevens geüpdatet');
    }
  }
}
