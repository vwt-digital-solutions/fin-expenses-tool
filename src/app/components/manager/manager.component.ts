import {Component} from '@angular/core';
import {ExpensesConfigService} from '../../services/config.service';
import {Expense} from '../../models/expense';
import { map } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { CostTypePipe } from 'src/app/pipes/cost-type.pipe';


@Component({
  selector: 'app-expenses',
  templateUrl: './manager.component.html',
  styleUrls: ['./manager.component.scss'],
  providers: [DatePipe, CurrencyPipe, CostTypePipe]
})

export class ManagerComponent {

  public columnDefs;
  public rowSelection;
  public expenseData: Expense;
  public moveDirection = 'move-up';
  public overlayNoRowsTemplate = '<span>Geen declaraties gevonden</span>';

  public wantsNewModal;
  private gridApi;
  private typeOptions: any;

  constructor(
    private expenses: ExpensesConfigService,
    private route: ActivatedRoute,
    private datePipe: DatePipe,
    private currencyPipe: CurrencyPipe,
    private costTypePipe: CostTypePipe
  ) {
    this.route.data.pipe(map(data => data.costTypes)).subscribe(costTypes => this.typeOptions = costTypes);

    this.columnDefs = [
      {
        headerName: 'Declaraties Overzicht',
        children: [
          {
            headerName: 'Declaratiedatum',
            field: 'claim_date',
            sortable: true,
            filter: true,
            sort: 'asc',
            valueFormatter: (params: any) => {
              if (!isNaN(Date.parse(params.value))) {
                return datePipe.transform(params.value, 'dd-MM-yyyy HH:mm');
              } else {
                return 'N/B';
              }
            }
          },
          {
            headerName: 'Werknemer', field: 'employee',
            sortable: true, filter: true, width: 200, resizable: true
          },
          {
            headerName: 'Kosten', field: 'amount', cellRenderer: (params: any) => currencyPipe.transform(params.value, 'EUR', '&euro;'),
            sortable: true, filter: true, width: 150, cellStyle: {'text-align': 'right'}
          },
          {
            headerName: 'Soort', field: 'cost_type',
            sortable: true, filter: true, resizable: true, width: 200,
            valueFormatter: params => {
              const splitValue = params.value.split(':');
              if (splitValue.length > 1) {
                return splitValue[0];
              } else if (splitValue.length === 1) {
                return costTypePipe.transform(splitValue[0], this.typeOptions);
              } else {
                return 'Onbekend';
              }
            }
          },
          {
            headerName: 'Beschrijving', field: 'note', resizable: true
          },
          {
            headerName: 'Bondatum', field: 'transaction_date',
            sortable: true, filter: true, width: 150,
            valueFormatter: (params: any) => {
              if (!isNaN(Date.parse(params.value))) {
                return datePipe.transform(params.value, 'dd-MM-yyyy');
              } else {
                return 'N/B';
              }
            }
          }
        ]
      }
    ];
    this.rowSelection = 'single';
  }

  rowData = null;

  onRowClicked(event: any, direct= false) {
    if (event === null || event === undefined) {
      return false;
    }
    this.moveDirection = direct ? 'move-left' : 'move-up';
    this.expenseData = event.data;
    this.wantsNewModal = true;
    if (event.api !== null && event.api !== undefined) {
      this.gridApi = event.api;
    }
  }

  getNextExpense() {
    setTimeout(() => {
      this.onRowClicked(this.gridApi.getDisplayedRowAtIndex(0), true);
    }, 100);
  }

  receiveMessage(message) {
    this.wantsNewModal = false;
    if (message[0]) {
      this.expenses.getManagerExpenses().subscribe((response) => {
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
    params.api.showLoadingOverlay();

    this.expenses.getManagerExpenses().subscribe((data) => {
      this.rowData = data;

      if (params.api.getDisplayedRowCount() <= 0 ) {
        params.api.showNoRowsOverlay();
      } else {
        params.api.hideOverlay();
      }
    });
  }
}
