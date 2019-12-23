import {Component} from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {ExpensesConfigService} from '../../services/config.service';
import {FormatterService} from 'src/app/services/formatter.service';
import {Expense} from '../../models/expense';
import {saveAs} from 'file-saver';
import {formatDate} from '@angular/common';

@Component({
  selector: 'app-expenses',
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.scss']
})

export class FinanceComponent {
  private gridApi;
  private historyGridApi;
  public columnDefs;
  public rowSelection;
  private currentRowIndex: number;
  private wantsNewModal: boolean;

  private readonly paymentfilecoldef = '<i class="fas fa-credit-card" style="color: #4eb7da; font-size: 20px;"></i>';

  constructor(
    private expenses: ExpensesConfigService,
    private http: HttpClient,
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
            sortable: true, filter: true, width: 180, resizable: true
          },
          {
            headerName: 'Kosten', field: 'amount', valueFormatter: FormatterService.decimalFormatter,
            sortable: true, filter: true, width: 120, cellStyle: {'text-align': 'right'}
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
            sortable: true, width: 180
          },
        ]
      }
    ];
    this.rowSelection = 'single';
    this.addBooking = {success: false, wrong: false, error: false};
  }

  public expenseData: Expense;
  public addBooking;
  public dataExport = 'invisible';

  historyColumnDefs = [
    {
      headerName: '',
      children: [
        {
          headerName: '', field: 'export_date',
          sortable: true, filter: true,
          suppressMovable: true, width: 170,
          cellRenderer: params => {
            return FormatterService.getCorrectDateTime(params.value);
          }
        },
        {
          headerName: '', field: '', cellStyle: {cursor: 'pointer'}, width: 75,
          template: '<i class="fas fa-book" style="color: #4eb7da; font-size: 20px;"></i>'
        },
        {
          headerName: '', field: '', cellStyle: {cursor: 'pointer'}, width: 75,
          template: this.paymentfilecoldef
        }
      ]
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
          a.download = FormatterService.getCorrectDateTime(event.data.export_date) + downloadType;
          a.click();
          window.URL.revokeObjectURL(url);
          console.log('>> GET SUCCESS');
        }, response => {
          this.errorBooking();
          console.error('>> GET FAILED', response.message);
        });
  }

  onRowClicked(event) {
    if (event === null || event === undefined) {
      return false;
    }
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
        this.onRowClicked(rowNode);
      } else {
        // tslint:disable-next-line:no-shadowed-variable
        const rowNode = this.getNextNode(0, 'ready_for_creditor');
        if (rowNode != null && 'rowIndex' in rowNode) {
          this.onRowClicked(rowNode);
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
          if (response.body.hasOwnProperty('Info')) {
            this.noExpenses();
          } else {
            // @ts-ignore
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

  createDataExport() {
    this.dataExport = 'warning';
    this.expenses.createDataExport({observe: 'response', responseType: 'blob' as 'csv'})
      .subscribe(
        responseList => {
          const timestamp = new Date().getTime();
          const dateFormat = formatDate(timestamp, 'yyyyMMddTHHmmss', 'nl');
          saveAs(responseList[0].body, `expenses_${dateFormat}.csv`);
          saveAs(responseList[1].body, `expenses_journal_${dateFormat}.csv`);

          this.dataExport = 'success';
          setTimeout(() => {
            this.dataExport = '';
          }, 2000);
        }, error => {
          this.dataExport = 'danger';
          console.error('>> GET FAILED', error.message);
        });
  }
}
