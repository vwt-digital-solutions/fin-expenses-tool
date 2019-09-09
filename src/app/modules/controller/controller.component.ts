import {Component, OnInit} from '@angular/core';
import * as moment from '../finance/finance.component';
import {ExpensesConfigService} from '../../services/config.service';
import {HttpClient} from '@angular/common/http';
import {EnvService} from '../../services/env.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {OAuthService} from 'angular-oauth2-oidc';

interface ExpensesIfc {
  ['body']: any;
}

@Component({
  selector: 'app-manager',
  templateUrl: './controller.component.html',
  styleUrls: ['./controller.component.scss']
})

export class ControllerComponent implements OnInit {
  constructor(
    private expenses: ExpensesConfigService,
  ) {
    this.columnDefs = [
      {
        headerName: 'Overzicht',
        children: [
          {
            headerName: 'Declaratiedatum',
            field: 'date_of_claim',
            sortable: true,
            filter: true,
          },
          {
            headerName: 'Werknemer', field: 'employee',
            sortable: true, filter: true, width: 200, resizable: true
          },
          {
            headerName: 'Kosten', field: 'amount', valueFormatter: ControllerComponent.decimalFormatter,
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
          },
          {
            headerName: 'Status', field: 'status.text',
            sortable: true, width: 250
          },
        ]
      }
    ];
  }
  private monthNames;
  private gridApi;
  public columnDefs;

  rowData = null;

  static formatNumber(numb) {
    return ((numb).toFixed(2)).toString().replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  }

  static decimalFormatter(amounts) {
    return '€ ' + ControllerComponent.formatNumber(amounts.value);
  }

  ngOnInit() {
    this.monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
    ];
  }

  onBtExport() {
    const params1 = {
      allColumns: true,
    };
    this.gridApi.exportDataAsExcel(params1);
  }

  onGridReady(params: any) {
    console.log(params);
    this.gridApi = params.api;

    // @ts-ignore
    this.expenses.getControllerExpenses().subscribe((data: ExpensesIfc) => this.rowData = [...data]);
  }
}
