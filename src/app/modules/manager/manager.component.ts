import {Component, OnInit} from '@angular/core';
import {ExpensesConfigService} from '../../services/config.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

import * as moment from 'moment';

moment.locale('nl');


interface ExpensesIfc {
  ['body']: any;
}

@Component({
  selector: 'app-manager',
  templateUrl: './manager.component.html',
  styleUrls: ['./manager.component.scss']
})
export class ManagerComponent implements OnInit {
  private gridApi;
  private gridColumnApi;
  private rowData;
  private columnDefs;
  private expenseData: object;
  private rowSelection;
  private formSubmitted;
  private showErrors;
  private formErrors;
  private expenseDataRejection: ({ reason: string })[];
  private receiptImage: any;

  constructor(
    private modalService: NgbModal,
    private expenses: ExpensesConfigService,
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
            // cellRenderer: params => {
            //   return moment(params.value).add(
            //     ManagerComponent.getUTCOffset(params.value), 'hours').format('LLL');
            // },
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
  }

  static formatNumber(numb) {
    return ((numb).toFixed(2)).toString().replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  }

  static decimalFormatter(amounts) {
    return '€ ' + ManagerComponent.formatNumber(amounts.value);
  }

  // static getUTCOffset(date) {
  //   return moment(date).utcOffset() / 60;
  // }

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
    this.openExpenseDetailModal(content, selectedRowData);
    this.expenses.getExpenseAttachment(selectedRowData.id).subscribe((image: ExpensesIfc) => this.receiptImage = image);
  }

  ngOnInit() {
  }

  openExpenseDetailModal(content, data) {
    this.modalService.open(content, {centered: true});
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    // @ts-ignore
    this.expenses.getExpenses().subscribe((data: ExpensesIfc) => this.rowData = [...data]);
  }

}
