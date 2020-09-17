import {Component} from '@angular/core';
import {HttpClient, HttpResponse, HttpParams} from '@angular/common/http';
import {ExpensesConfigService} from '../../services/config.service';
import {Expense} from '../../models/expense';
import {saveAs} from 'file-saver';
import {formatDate, DatePipe, CurrencyPipe} from '@angular/common';
import {EnvService} from '../../services/env.service';
import {FormGroup, FormControl, Validators, AbstractControl} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CostTypePipe } from 'src/app/pipes/cost-type.pipe';
import { map } from 'rxjs/operators';
import { GridOptions } from 'ag-grid-community';

@Component({
  selector: 'app-expenses',
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.scss'],
  providers: [DatePipe, CurrencyPipe, CostTypePipe]
})

export class FinanceComponent {
  private gridApi;
  private historyGridApi;
  public gridOptions: GridOptions;
  public columnDefs;
  private currentRowIndex: number;
  private typeOptions: any;
  public wantsNewModal: boolean;
  public dataExport = 'secondary';
  public moveDirection = 'move-up';

  public dateExportForm;
  public dateExportFormExported = false;
  public dateExportFormReponse = [];

  private readonly paymentfilecoldef = '<i class="fas fa-credit-card" style="color: #4eb7da; font-size: 20px;"></i>';

  constructor(
    private expenses: ExpensesConfigService,
    private http: HttpClient,
    private env: EnvService,
    private route: ActivatedRoute,
    private datePipe: DatePipe,
    private currencyPipe: CurrencyPipe,
    private costTypePipe: CostTypePipe
  ) {
    this.route.data.pipe(map(data => data.costTypes)).subscribe(costTypes => this.typeOptions = costTypes);
    this.setUpForm();

    this.gridOptions = {
      defaultColDef: {
        sortable: true,
        filter: true,
        editable: false,
        resizable: true,
        minWidth: 100
      },
      domLayout: 'autoHeight',
      paginationPageSize: 25,
      pagination: true,
      enableBrowserTooltips: true,
      rowSelection: 'single',
      statusBar: {
        statusPanels: [
          { statusPanel: 'agTotalRowCountComponent', align: 'left' },
          { statusPanel: 'agFilteredRowCountComponent', align: 'left' }
        ]
      }
    };

    this.columnDefs = [
      {
        headerName: 'Declaratiedatum',
        field: 'claim_date',
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
      },
      {
        headerName: 'Kosten', field: 'amount', cellStyle: {'text-align': 'right'},
        cellRenderer: (params: any) => currencyPipe.transform(params.value, 'EUR', '&euro;')
      },
      {
        headerName: 'Soort', field: 'cost_type',
        tooltipField: 'cost_type', valueGetter: params => {
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
        headerName: 'Beschrijving', field: 'note', tooltipField: 'note'
      },
      {
        headerName: 'Bondatum', field: 'transaction_date',
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
        valueFormatter: (params: any) => params.value.replace(/_/g, ' ')
      },
      {
        headerName: 'Automatisch goedgekeurd', field: 'auto_approved',
        valueFormatter: (params: any) => (
          params.value.toLowerCase() === 'yes') ? 'Ja' : 'Nee'
      },
      { headerName: 'Bedrijfsnaam', field: 'company_name' },
      { headerName: 'Afdelingscode', field: 'department_code' },
      {
        headerName: 'Afdelingsomschrijving', field: 'department_descr',
        width: 300, tooltipField: 'department_descr'
      }
    ];

    this.addBooking = {success: false, wrong: false, error: false};
  }

  public expenseData: Expense;
  public addBooking;

  historyColumnDefs = [
    {
      headerName: 'Export datum',
      children: [
        {
          headerName: 'Datum',
          field: 'export_date',
          sort: 'desc',
          suppressMovable: true,
          valueFormatter: (params: any) => {
            if (!isNaN(Date.parse(params.value))) {
              return this.datePipe.transform(params.value, 'dd-MM-yyyy');
            } else {
              return 'N/B';
            }
          }
        },
        {
          headerName: 'Tijdstip',
          field: 'export_date',
          sort: 'desc',
          suppressMovable: true,
          valueFormatter: (params: any) => {
            if (!isNaN(Date.parse(params.value))) {
              return this.datePipe.transform(params.value, 'HH:mm:ss');
            } else {
              return 'N/B';
            }
          }
        }
      ]
    },
    {
      headerName: 'Boekingsbestand', field: '', cellStyle: {cursor: 'pointer'},
      template: '<i class="fas fa-book" style="color: #4eb7da; font-size: 20px;"></i>'
    },
    {
      headerName: 'Betaalbestand', field: '', cellStyle: {cursor: 'pointer'},
      template: this.paymentfilecoldef
    }
  ];

  rowData = null;
  historyRowData = null;

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
          a.download = this.datePipe.transform(event.data.export_date, 'dd-MM-yyyy HH:mm:ss') + downloadType;
          a.click();
          window.URL.revokeObjectURL(url);
          console.log('>> GET SUCCESS');
        }, response => {
          this.errorBooking();
          console.error('>> GET FAILED', response.message);
        });
  }

  onRowClicked(event, direct= false) {
    if (event === null || event === undefined) {
      return false;
    }
    this.moveDirection = direct ? 'move-left' : 'move-up';
    this.expenseData = event.data;
    this.wantsNewModal = true;
    if (event.api !== null && event.api !== undefined) {
      this.gridApi = event.api;
    }
    this.currentRowIndex = event.rowIndex;
  }

  getNextNode(currentIndex: number, status: string) {
    let newNode = null;
    this.gridApi.forEachNodeAfterFilterAndSort((rowNode, index) => {
      if (newNode === null && index >= currentIndex && rowNode.data.status.text.includes(status)) {
        newNode = rowNode;
      }
    });
    return newNode;
  }

  getNextExpense(next: boolean) {
    setTimeout(() => {
      let rowNode = null;
      if (next) {
        rowNode = this.getNextNode(this.currentRowIndex + 1, 'ready_for_creditor');
      }

      if (rowNode != null && 'rowIndex' in rowNode) {
        this.onRowClicked(rowNode, true);
      } else {
        // tslint:disable-next-line:no-shadowed-variable
        const rowNode = this.getNextNode(0, 'ready_for_creditor');
        if (rowNode != null && 'rowIndex' in rowNode) {
          this.onRowClicked(rowNode, true);
        }
      }
    }, 100);
  }

  receiveMessage(message) {
    this.wantsNewModal = false;
    if (message[0]) {
      this.expenses.getExpenses().subscribe((response) => {
        // @ts-ignore
        this.rowData = [...response];
        if (message[1]) {
          this.getNextExpense(true);
        }
      });
    } else if (message[1]) {
      this.getNextExpense(false);
    }
  }

  onHistoryGridReady(params: any) {
    this.historyGridApi = params.api;
    this.expenses.getDocumentsList()
      .subscribe(result => this.historyRowData = [...result.file_list]);
  }

  onGridReady(params: any) {
    // @ts-ignore
    this.expenses.getExpenses().subscribe((data) => this.rowData = [...data]);
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
          if (response.status === 204) {
            this.noExpenses();
          } else {
            this.historyRowData.unshift(response.body.file_list[0]);
            this.historyGridApi.setRowData(this.historyRowData);
            this.successfulDownload();
          }
          console.log('>> POST SUCCESS');
        }, response => {
          this.errorBooking();
          console.error('>> POST FAILED', response.message);
        });
  }

  createDataExport(startDate: string, endDate: string) {
    const params = new HttpParams().set('date_from', startDate).set('date_to', endDate);

    const httpOptions = {
      observe: 'response',
      responseType: 'blob' as 'csv',
      headers: { Accept: 'text/csv' },
      params
    };

    this.dataExport = 'warning';
    this.dateExportFormReponse = [];
    this.expenses.createDataExport(httpOptions)
      .subscribe(
        responseList => {
          const timestamp = new Date().getTime();
          const dateFormat = formatDate(timestamp, 'yyyyMMddTHHmmss', 'nl');
          const emptyResponseStatuses = [];

          for (const response of responseList) {
            if (response.status === 200 && 'body' in response) {
              const fileName = response.url.includes('journals') ?
                `expenses_journals_${dateFormat}.csv` :
                `expenses_${dateFormat}.csv`;
              saveAs(response.body, fileName);
            } else {
              emptyResponseStatuses.push(
                response.url.includes('journals') ? 'logboek' : 'declaraties');
            }
          }

          if (emptyResponseStatuses.length > 0) {
            this.dateExportFormReponse = emptyResponseStatuses;
            this.dataExport = '';
          } else {
            this.dataExport = 'success';
            this.dateExportFormExported = true;
            setTimeout(() => {
              this.dataExport = '';
            }, 2000);
          }
        }, error => {
          this.dataExport = 'danger';
          console.error('>> GET FAILED', error.message);
        });
  }

  setUpForm() {
    const currentDate = new Date();
    const currentEndDate = formatDate(currentDate, 'yyyy-MM-dd', 'nl');
    const currentStartDate = formatDate(currentDate.setDate(
      currentDate.getDate() - 7), 'yyyy-MM-dd', 'nl');

    this.dateExportForm = new FormGroup({
      startDate: new FormControl(
        currentStartDate, [Validators.required, this.validDateFormat]),
      endDate: new FormControl(
        currentEndDate, [Validators.required, this.validDateFormat])
    }, { validators: this.checkIfEndDateAfterStartDate });

    this.dateExportForm.valueChanges.subscribe(val => {
      this.dateExportFormReponse = [];
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.dateExportForm.valid) {
      this.createDataExport(
        this.dateExportForm.value.startDate,
        this.dateExportForm.value.endDate
      );
    } else {
      this.validateAllFormFields(this.dateExportForm);
    }
  }

  validDateFormat(control: FormControl) {
    let validDateFormat = false;

    const timestamp = Date.parse(control.value);
    const validTime = new Date('1970-01-01').getTime();
    const validFormat = control.value.search(
      /([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/g);

    if (isNaN(timestamp) === false && timestamp > validTime && validFormat === 0) {
      validDateFormat = true;
    }

    return !validDateFormat ? { validDateFormat: true } : null;
  }

  checkIfEndDateAfterStartDate(control: AbstractControl) {
    let validDateOrder = false;
    const startDate = control.get('startDate');
    const endDate = control.get('endDate');

    if (new Date(startDate.value).getTime() <= new Date(endDate.value).getTime()) {
      validDateOrder = true;
    }

    return !validDateOrder ? { validDateOrder: true } : null;
  }

  validateAllFormFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      control.markAsTouched({ onlySelf: true });
    });
  }
}
