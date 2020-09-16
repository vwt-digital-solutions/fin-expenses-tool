import {Component} from '@angular/core';
import {ExpensesConfigService} from '../../services/config.service';
import {Expense} from '../../models/expense';
import { map } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';

import { DatePipe, CurrencyPipe } from '@angular/common';
import { CostTypePipe } from 'src/app/pipes/cost-type.pipe';

@Component({
  selector: 'app-manager',
  templateUrl: './controller.component.html',
  styleUrls: ['./controller.component.scss'],
  providers: [DatePipe, CurrencyPipe, CostTypePipe]
})

export class ControllerComponent {

  private gridApi: any;
  private typeOptions: any;
  public columnDefs;
  public expenseData: Expense;
  public wantsNewModal;

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
            sort: 'desc',
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
            headerName: 'SoortGL', field: 'cost_type',
            sortable: true, filter: true, resizable: true, width: 130,
            valueFormatter: params => {
              const splitValue = params.value.split(':');
              const value = splitValue.length > 1 ? splitValue[1] : splitValue[0];

              return !isNaN(Number(value)) ? value : 'N/A';
            }
          },
          {
            headerName: 'Soort', field: 'cost_type',
            sortable: true, filter: true, resizable: true, width: 200,
            valueGetter: params => {
              const splitValue = params.data.cost_type.split(':');
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
            headerName: 'Bondatum', field: 'transaction_date',
            sortable: true, filter: true, width: 130,
            valueFormatter: (params: any) => {
              if (!isNaN(Date.parse(params.value))) {
                return datePipe.transform(params.value, 'dd-MM-yyyy');
              } else {
                return 'N/B';
              }
            }
          },
          {
            headerName: 'Status', field: 'status.text',
            sortable: true, width: 250
          },
          {
            headerName: 'Bedrijfsnaam', field: 'company_name',
            sortable: true, filter: true, resizable: true
          },
          {
            headerName: 'Afdelingscode', field: 'department_code',
            sortable: true, filter: true, resizable: true
          },
          {
            headerName: 'Afdelingsomschrijving', field: 'department_descr',
            sortable: true, filter: true, width: 300, resizable: true
          }
        ]
      }
    ];
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

  receiveMessage(message) {
    this.wantsNewModal = false;
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    // @ts-ignore
    this.expenses.getControllerExpenses().subscribe((data) => this.rowData = [...data]); // eslint-disable-line
  }

  onBtExport() {
    const params1 = {
      allColumns: true
    };
    this.gridApi.exportDataAsExcel(params1);
  }
}
