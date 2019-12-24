import {Component} from '@angular/core';
import {ExpensesConfigService} from '../../services/config.service';
import {FormatterService} from 'src/app/services/formatter.service';
import {Expense} from '../../models/expense';

@Component({
  selector: 'app-manager',
  templateUrl: './controller.component.html',
  styleUrls: ['./controller.component.scss']
})

export class ControllerComponent {

  private gridApi: any;
  public columnDefs;
  public expenseData: Expense;
  public wantsNewModal;

  constructor(
    private expenses: ExpensesConfigService
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
              return FormatterService.getCorrectDateTime(params.value);
            },
          },
          {
            headerName: 'Werknemer', field: 'employee',
            sortable: true, filter: true, width: 200, resizable: true
          },
          {
            headerName: 'Kosten', field: 'amount', valueFormatter: FormatterService.decimalFormatter,
            sortable: true, filter: true, width: 150, cellStyle: {'text-align': 'right'}
          },
          {
            headerName: 'SoortGL', field: 'cost_type',
            sortable: true, filter: true, resizable: true, width: 130,
            cellRenderer: params => {
              return params.value.split(':')[1];
            }
          },
          {
            headerName: 'Soort', field: 'cost_type',
            sortable: true, filter: true, resizable: true, width: 200,
            cellRenderer: params => {
              return params.value.split(':')[0];
            }
          },
          // {
          //   headerName: 'Beschrijving', field: 'note', resizable: true
          // },
          {
            headerName: 'Bondatum', field: 'transaction_date',
            sortable: true, filter: true, width: 130,
            cellRenderer: params => {
              return FormatterService.getCorrectDate(params.value);
            },
          },
          {
            headerName: 'Status', field: 'status.text',
            sortable: true, width: 250
          },
        ]
      }
    ];
  }

  rowData = null;

  static processExcelCellCallback(param) {
    if (param.column.colDef.cellRenderer) {
      return (param.column.colDef.cellRenderer(param));
    } else {
      return param.value;
    }
  }

  onRowClicked(event: any) {
    if (event === null || event === undefined) {
      return false;
    }
    this.expenseData = event.data;
    this.wantsNewModal = true;
    if (event.api !== null && event.api !== undefined) {
      this.gridApi = event.api;
    }
  }

  receiveMessage(message) {
    this.wantsNewModal = false;
  }

  onGridReady(params: any) {
    // @ts-ignore
    this.expenses.getControllerExpenses().subscribe((data) => this.rowData = [...data]);
  }

  onBtExport() {
    const params1 = {
      allColumns: true,
      processCellCallback: ControllerComponent.processExcelCellCallback.bind(this)
    };
    this.gridApi.exportDataAsExcel(params1);
  }
}
