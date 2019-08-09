import {Component, OnInit} from '@angular/core';
import {ExpensesConfigService} from '../../services/config.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {NgForm} from '@angular/forms';
import {OAuthService} from 'angular-oauth2-oidc';

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
  selector: 'app-manager',
  templateUrl: './manager.component.html',
  styleUrls: ['./manager.component.scss']
})
export class ManagerComponent implements OnInit {
  private gridApi;
  private gridColumnApi;
  public rowData;
  public columnDefs;
  private expenseData: object;
  public rowSelection;
  private formSubmitted;
  private showErrors;
  private formErrors;
  private expenseDataRejection: ({ reason: string })[];
  private receiptImage: any;
  private departmentId: number;
  private action: any;
  private OurJaneDoeIs: string;
  public formResponse;

  constructor(
    private modalService: NgbModal,
    private expenses: ExpensesConfigService,
    private oauthService: OAuthService,
  ) {
    this.columnDefs = [
      {
        headerName: 'Afdeling Declaraties Overzicht',
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
            sortable: true, filter: true, width: 225, resizable: true
          },
          {
            headerName: 'Kosten', field: 'amount', valueFormatter: ManagerComponent.decimalFormatter,
            sortable: true, filter: true, width: 150
          },
          {
            headerName: 'Soort', field: 'cost_type',
            sortable: true, filter: true, resizable: true, width: 250,
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
            sortable: true, width: 200
          },
        ]
      }
    ];
    this.rowSelection = 'single';
    this.formResponse = {};
    this.expenseDataRejection = [
      {reason: 'Niet Duidelijk'},
      {reason: 'Kan niet uitbetalen'},
      {reason: 'Image kan beter'},
      {reason: 'Amount klopt niet'}
    ];
  }

  static formatNumber(numb) {
    return ((numb).toFixed(2)).toString().replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  }

  static decimalFormatter(amounts) {
    return '€ ' + ManagerComponent.formatNumber(amounts.value);
  }

  static getUTCOffset(date) {
    return moment(date).utcOffset() / 60;
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
    this.expenseData = selectedRowData;
    this.formSubmitted = false;
    this.showErrors = false;
    this.formErrors = '';
    this.expenses.getExpenseAttachment(selectedRowData.id).subscribe((image: ExpensesIfc) =>
      this.receiptImage = image[0].url);
    this.openExpenseDetailModal(content, selectedRowData);
  }

  ngOnInit() {
  }

  openExpenseDetailModal(content, data) {
    this.modalService.open(content, {centered: true});
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    const claimJaneDoe = this.oauthService.getIdentityClaims() as IClaimRoles;
    this.departmentId = claimJaneDoe.oid;
    this.OurJaneDoeIs = claimJaneDoe.roles[0].split('.')[0];
    // @ts-ignore
    this.expenses.getDepartmentExpenses(this.departmentId).subscribe((data: ExpensesIfc) => this.rowData = [...data]);
  }

  updatingAction(event) {
    this.action = event;
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
