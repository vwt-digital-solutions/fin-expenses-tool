import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {EnvService} from 'src/app/services/env.service';
import {NgbModal, ModalDismissReasons} from '@ng-bootstrap/ng-bootstrap';
import {NgForm} from '@angular/forms';
import {OAuthService} from 'angular-oauth2-oidc';
import {ExpensesConfigService} from '../../services/config.service';
import * as moment from 'moment';

moment.locale('nl');


interface ExpensesIfc {
  ['body']: any;
}

interface IClaimRoles {
  oid: any;
  roles: any;
}

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
  private submitingStart: boolean;
  private action: any;
  private departmentId: number;
  private OurJaneDoeIs: string;
  private expenseDataRejection: ({ reason: string })[];
  private receiptFiles;
  private isRejecting;
  private monthNames;
  private denySelection;
  public today;

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
                ManagerComponent.getUTCOffset(params.value), 'hours').format('LLL');
            },
          },
          {
            headerName: 'Werknemer', field: 'employee',
            sortable: true, filter: true, width: 200, resizable: true
          },
          {
            headerName: 'Kosten', field: 'amount', valueFormatter: ManagerComponent.decimalFormatter,
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
    return '€ ' + ManagerComponent.formatNumber(amounts.value);
  }

  static getUTCOffset(date) {
    return moment(date).utcOffset() / 60;
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

  fixDate(date) {
    const stepDate = new Date(date);
    return stepDate.getDate() + ' ' + this.monthNames[(stepDate.getMonth())] + ' ' + stepDate.getFullYear();
  }

  getFileName(name) {
    return (name.split('/')).slice(-1)[0];
  }

  openExpenseDetailModal(content) {
    this.receiptFiles = [];
    this.isRejecting = false;
    this.modalService.open(content, {centered: true}).result.then((result) => {
      this.gridApi.deselectAll();
      this.denySelection = true;
      console.log(`Closed with: ${result}`);
    }, (reason) => {
      this.gridApi.deselectAll();
      this.denySelection = true;
      console.log(`Dismissed ${ManagerComponent.getDismissReason(reason)}`);
    });
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
    const claimJaneDoe = this.oauthService.getIdentityClaims() as IClaimRoles;
    this.departmentId = claimJaneDoe.oid;
    this.OurJaneDoeIs = claimJaneDoe.roles[0].split('.')[0];
    // @ts-ignore
    this.expenses.getDepartmentExpenses(this.departmentId).subscribe((data: ExpensesIfc) => this.rowData = [...data]);
  }

  onSelectionChanged(event, content) {
    if (!this.denySelection) {
      this.gridApi = event.api;
      const selectedRows = event.api.getSelectedRows();
      const selectedRowData = {
        id: undefined
      };
      selectedRows.map((selectedRow, index) => {
        index !== 0 ?
          console.log('No selection') : Object.assign(selectedRowData, selectedRow);
      });
      this.expenses.getExpenseAttachment(selectedRowData.id).subscribe((image: ExpensesIfc) => {
        // @ts-ignore
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < image.length; i++) {
          this.receiptFiles.push(image[i].url);
        }
      });
      this.expenseData = selectedRowData;
      this.formSubmitted = false;
      this.showErrors = false;
      this.formErrors = '';
      this.openExpenseDetailModal(content);
    } else {
      this.denySelection = false;
    }
  }

  ngOnInit() {
    this.today = new Date();
    this.denySelection = false;
    this.monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
    ];
    this.expenses.getCostTypes()
      .subscribe(
        val => {
          this.typeOptions = val;
        });
  }

  submitButtonController(namount, ntype, ntransdate, rejectionNote) {
    if (this.isRejecting) {
      return rejectionNote.invalid || namount.invalid || ntype.invalid
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
      for (const prop in data) {
        if (prop.length !== 0) {
          dataVerified[prop] = data[prop];
        }
      }
      const action = this.action;
      dataVerified[`status`] = action === 'approving' ? `ready_for_creditor` :
        action === 'rejecting' ? `rejected` : null;

      Object.keys(dataVerified).length !== 0 || this.formSubmitted === true ?
        this.expenses.updateExpense(dataVerified, expenseId)
          .subscribe(
            result => {
              this.getNextExpense();
              // @ts-ignore
              this.expenses.getDepartmentExpenses(this.departmentId).subscribe((response: ExpensesIfc) => this.rowData = [...response]);
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
