import {Component} from '@angular/core';
import {ExpensesConfigService} from '../../services/config.service';
import {FormatterService} from 'src/app/services/formatter.service';
import {Expense} from '../../models/expense';


@Component({
  selector: 'app-expenses',
  templateUrl: './manager.component.html',
  styleUrls: ['./manager.component.scss']
})

export class ManagerComponent {

  public columnDefs;
  public rowSelection;
  public expenseData: Expense;

  public wantsNewModal;
  private gridApi;

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
              return FormatterService.getCorrectDate(params.value);
            }
          },
          {
            headerName: 'Status', field: 'status.text',
            sortable: true, width: 250
          },
        ]
      }
    ];
    this.rowSelection = 'single';
  }

  rowData = null;

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

  getNextExpense() {
    setTimeout(() => {
      this.onRowClicked(this.gridApi.getDisplayedRowAtIndex(0));
    }, 100);
  }

  receiveMessage(message) {
    this.wantsNewModal = false;
    if (message[0]) {
      this.expenses.getManagerExpenses().subscribe((response) => {
        // @ts-ignore
        this.rowData = [...response];
        if (message[1]) {
          this.getNextExpense();
        }
      });
    } else if (message[1]) {
      this.getNextExpense();
    }
  }

  onGridReady(params: any) {
    // @ts-ignore
    this.expenses.getManagerExpenses().subscribe((data) => this.rowData = [...data]);
  }
}
