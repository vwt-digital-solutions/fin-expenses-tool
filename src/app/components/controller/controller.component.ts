import {Component, OnInit} from '@angular/core';
import {ExpensesConfigService} from '../../services/config.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {DomSanitizer} from '@angular/platform-browser';
import {FormaterService} from 'src/app/services/formater.service';

interface ExpensesIfc {
  ['body']: any;
}

@Component({
  selector: 'app-manager',
  templateUrl: './controller.component.html',
  styleUrls: ['./controller.component.scss']
})

export class ControllerComponent implements OnInit {

  private gridApi;
  public columnDefs;
  public today;
  public denySelection;
  public expenseData: object;
  private receiptFiles;

  constructor(
    private expenses: ExpensesConfigService,
    private modalService: NgbModal,
    private sanitizer: DomSanitizer
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
              return FormaterService.getCorrectDateTime(params.value);
            },
          },
          {
            headerName: 'Werknemer', field: 'employee',
            sortable: true, filter: true, width: 200, resizable: true
          },
          {
            headerName: 'Kosten', field: 'amount', valueFormatter: FormaterService.decimalFormatter,
            sortable: true, filter: true, width: 150, cellStyle: {'text-align': 'right'}
          },
          {
            headerName: 'SoortGL', field: 'cost_type',
            sortable: true, filter: true, resizable: true, width: 150,
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
            sortable: true, filter: true, width: 250,
            cellRenderer: params => {
              return FormaterService.getCorrectDate(params.value);
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

  static getNavigator() {
    return navigator.userAgent.match(/Android/i)
      || navigator.userAgent.match(/webOS/i)
      || navigator.userAgent.match(/iPhone/i)
      || navigator.userAgent.match(/iPad/i)
      || navigator.userAgent.match(/iPod/i)
      || navigator.userAgent.match(/BlackBerry/i)
      || navigator.userAgent.match(/Windows Phone/i);
  }

  openSanitizeFile(type, file) {
    const isIEOrEdge = /msie\s|trident\/|edge\//i.test(window.navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    if (isIEOrEdge) {
      if (type === 'application/pdf') {
        alert('Please use Chrome or Firefox to view this file');
      } else {
        const win = window.open();
        // @ts-ignore
        // tslint:disable-next-line:max-line-length
        win.document.write('<img src="' + this.sanitizer.bypassSecurityTrustUrl('data:' + type + ';base64,' + encodeURI(file)).changingThisBreaksApplicationSecurity + '" alt="">');
      }
    } else {
      const win = window.open();
      if (ControllerComponent.getNavigator()) {
        win.document.write('<p>Problemen bij het weergeven van het bestand? Gebruik Edge Mobile of Samsung Internet.</p>');
      } else if (!isChrome) {
        win.document.write('<p>Problemen bij het weergeven van het bestand? Gebruik Chrome of Firefox.</p>');
      }
      // @ts-ignore
      // tslint:disable-next-line:max-line-length no-unused-expression
      win.document.write('<iframe src="' + this.sanitizer.bypassSecurityTrustUrl('data:' + type + ';base64,' + encodeURI(file)).changingThisBreaksApplicationSecurity + '" frameborder="0" style="border:0; top:auto; left:0; bottom:0; right:0; width:100%; height:100%;" allowfullscreen></iframe>');
    }
  }

  ngOnInit() {
    this.today = new Date();
    this.denySelection = false;
  }

  onBtExport() {
    const params1 = {
      allColumns: true,
      processCellCallback: ControllerComponent.processExcelCellCallback.bind(this)
    };
    this.gridApi.exportDataAsExcel(params1);
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    // @ts-ignore
    this.expenses.getControllerExpenses().subscribe((data: ExpensesIfc) => this.rowData = [...data]);
  }

  onRowClicked(event, content) {
    this.gridApi = event.api;
    this.expenseData = event.data;
    this.expenses.getControllerAttachment(event.data.id).subscribe((image: any) => {
      this.receiptFiles = [];
      for (const img of image) {
        if (!(this.receiptFiles.includes(img))) {
          this.receiptFiles.push(img);
        }
      }
      this.modalService.open(content, {centered: true}).result.then((result) => {
        this.gridApi.deselectAll();
      }, (reason) => {
        this.gridApi.deselectAll();
      });
    });
  }
}
