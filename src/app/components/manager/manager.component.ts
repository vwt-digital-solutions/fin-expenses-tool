import {Component, OnInit} from '@angular/core';
import {NgbModal, ModalDismissReasons} from '@ng-bootstrap/ng-bootstrap';
import {NgForm} from '@angular/forms';
import {ExpensesConfigService} from '../../services/config.service';
import {DomSanitizer} from '@angular/platform-browser';
import {IdentityService} from 'src/app/services/identity.service';
import {FormaterService} from 'src/app/services/formater.service';
import {ActivatedRoute} from '@angular/router';
import {map} from 'rxjs/operators';
import {Expense} from '../../models/expense';
import {Attachment} from '../../models/attachment';
import {EnvService} from '../../services/env.service';


@Component({
  selector: 'app-expenses',
  templateUrl: './manager.component.html',
  styleUrls: ['./manager.component.scss']
})

export class ManagerComponent implements OnInit {

  private gridApi;
  private gridColumnApi;
  public columnDefs;
  public rowSelection;
  public typeOptions;
  public formSubmitted;
  public showErrors;
  public formErrors;
  public formResponse;
  private action: any;
  private departmentId: number;
  private OurJaneDoeIs: string;
  private receiptFiles: Attachment[];
  private isRejecting;
  public wantsRejectionNote;
  public selectedRejection;
  public today;
  public noteData;
  public expenseData: Expense;
  public addBooking;
  private modalDefinition;

  constructor(
    private expenses: ExpensesConfigService,
    private modalService: NgbModal,
    private identityService: IdentityService,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private env: EnvService
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
              return FormaterService.getCorrectDateTime(params.value);
            },
          },
          {
            headerName: 'Werknemer', field: 'employee',
            sortable: true, filter: true, width: 200, resizable: true
          },
          {
            headerName: 'Kosten', field: 'amount', valueFormatter: FormaterService.decimalFormatter,
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
            headerName: 'Bondatum', field: 'transaction_date',
            sortable: true, filter: true, width: 150,
            cellRenderer: params => {
              return FormaterService.getCorrectDate(params.value);
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

  static getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  static getNavigator() {
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
      if (ManagerComponent.getNavigator()) {
        win.document.write('<p>Problemen bij het weergeven van het bestand? Gebruik Edge Mobile of Samsung Internet.</p>');
      } else if (!isChrome) {
        win.document.write('<p>Problemen bij het weergeven van het bestand? Gebruik Chrome of Firefox.</p>');
      }
      const dataContent = 'data:' + type + ';base64,' + encodeURI(file);
      // tslint:disable-next-line:max-line-length no-unused-expression
      win.document.write('<iframe src="' + dataContent + '" frameborder="0" style="border:0; top:auto; left:0; bottom:0; right:0; width:100%; height:100%;" allowfullscreen></iframe>');
    }
  }

  onRowClicked(event, content) {
    if (event === null || event === undefined) {
      this.dismissModal();
    } else {
      this.modalDefinition = content;
      if (event.api !== null && event.api !== undefined) {
        this.gridApi = event.api;
      }
      this.formSubmitted = false;
      this.showErrors = false;
      this.formErrors = '';
      this.isRejecting = false;
      this.wantsRejectionNote = false;
      this.expenseData = event.data;
      this.selectedRejection = 'Deze kosten kun je declareren via Regweb (PSA)';
      this.expenses.getManagerAttachment(event.data.id).subscribe((image: any) => {
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
          console.log(`Dismissed ${ManagerComponent.getDismissReason(reason)}`);
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
      this.onRowClicked(this.gridApi.getDisplayedRowAtIndex(0), this.modalDefinition);
    }, 100);
  }

  dismissModal() {
    this.modalService.dismissAll();
  }

  onGridReady(params: any) {
    this.gridColumnApi = params.columnApi;
    const claimJaneDoe = this.identityService.allClaims();
    this.departmentId = claimJaneDoe.oid;
    this.OurJaneDoeIs = claimJaneDoe.roles[0].split('.')[0];
    // @ts-ignore
    this.expenses.getManagerExpenses().subscribe((data) => this.rowData = [...data]);
  }

  ngOnInit() {
    this.today = new Date();
    this.route.data.pipe(
      map(data => data.costTypes)
    ).subscribe(costTypes => this.typeOptions = [...costTypes]);
  }

  submitButtonController(rnote: { invalid: boolean }) {
    if (this.wantsRejectionNote) {
      return rnote.invalid;
    }
  }

  claimUpdateForm(form: NgForm, expenseId, note) {
    if (!this.submitButtonController(note)) {
      const dataVerified = {};
      const data = form.value;
      if (!(this.wantsRejectionNote) && dataVerified[`status`] === 'rejecting') {
        data.rnote = this.selectedRejection;
      }
      for (const prop in data) {
        if (prop.length !== 0) {
          dataVerified[prop] = data[prop];
        }
      }
      const action = this.action;
      dataVerified[`status`] = action === 'approving' ? `ready_for_creditor` :
        action === 'rejecting' ? `rejected_by_manager` : null;

      Object.keys(dataVerified).length !== 0 || this.formSubmitted === true ?
        this.expenses.updateExpenseManager(dataVerified, expenseId)
          .subscribe(
            result => {
              this.expenses.getManagerExpenses().subscribe((response) => {
                // @ts-ignore
                this.rowData = [...response];
                this.getNextExpense();
              });
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
