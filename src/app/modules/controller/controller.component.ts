import {Component, OnInit} from '@angular/core';
import {ExpensesConfigService} from '../../services/config.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {OAuthService} from 'angular-oauth2-oidc';
import {DomSanitizer} from '@angular/platform-browser';
import {ManagerComponent} from '../manager/manager.component';

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
    private modalService: NgbModal,
    private oauthService: OAuthService,
    private sanitizer: DomSanitizer,
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
            cellRenderer: params => {
              return ManagerComponent.getCorrectDate(params.value);
            },
          },
          {
            headerName: 'Werknemer', field: 'employee',
            sortable: true, filter: true, width: 200, resizable: true
          },
          {
            headerName: 'Kosten', field: 'amount', valueFormatter: ManagerComponent.decimalFormatter,
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
            cellRenderer: params => {
              return this.fixDate(params.value);
            }
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
  public isMobile;
  public today;
  public denySelection;
  public isLoading;
  public expenseData: object;
  private receiptFiles;

  rowData = null;

  static formatNumber(numb) {
    return ((numb).toFixed(2)).toString().replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  }

  static decimalFormatter(amounts) {
    return '€ ' + ControllerComponent.formatNumber(amounts.value);
  }

  static getCorrectDate(date) {
    const d = new Date(date);
    return d.getDate() + '-' + (d.getMonth() + 1) + '-' + d.getFullYear() + ' ' + ('0' + d.getHours()).substr(-2) + ':' +
      ('0' + d.getMinutes()).substr(-2) + ':' + ('0' + d.getSeconds()).substr(-2);
  }

  fixDate(date) {
    const stepDate = new Date(date);
    return stepDate.getDate() + ' ' + this.monthNames[(stepDate.getMonth())] + ' ' + stepDate.getFullYear();
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
      if (navigator.userAgent.match(/Android/i)
        || navigator.userAgent.match(/webOS/i)
        || navigator.userAgent.match(/iPhone/i)
        || navigator.userAgent.match(/iPad/i)
        || navigator.userAgent.match(/iPod/i)
        || navigator.userAgent.match(/BlackBerry/i)
        || navigator.userAgent.match(/Windows Phone/i)) {
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
    this.isMobile = (navigator.userAgent.match(/Android/i)
      || navigator.userAgent.match(/webOS/i)
      || navigator.userAgent.match(/iPhone/i)
      || navigator.userAgent.match(/iPad/i)
      || navigator.userAgent.match(/iPod/i)
      || navigator.userAgent.match(/BlackBerry/i)
      || navigator.userAgent.match(/Windows Phone/i));
    this.today = new Date();
    this.denySelection = false;
    this.monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
    ];
    // const claimJaneDoe = this.oauthService.getIdentityClaims() as IClaimRoles;
    // this.OurJaneDoeIs = claimJaneDoe.roles[0].split('.')[0];
  }

  onBtExport() {
    const params1 = {
      allColumns: true,
    };
    this.gridApi.exportDataAsExcel(params1);
  }

  onGridReady(params: any) {
    this.gridApi = params.api;

    // @ts-ignore
    this.expenses.getControllerExpenses().subscribe((data: ExpensesIfc) => this.rowData = [...data]);
  }

  toggleMobile() {
    if (this.isMobile) {
      if (this.isLoading) {
        document.getElementById('mobile-loader').style.visibility = 'visible';
        document.getElementById('mobile-loader-button').style.visibility = 'hidden';
      } else {
        document.getElementById('mobile-loader').style.visibility = 'hidden';
        document.getElementById('mobile-loader-button').style.visibility = 'visible';
      }
    } else {
      return;
    }
  }

  regOff() {
    if (this.isMobile) {
      document.getElementById('mobile-loader-button').style.visibility = 'hidden';
      document.getElementById('mobile-loader').style.visibility = 'hidden';
    } else {
      return;
    }
  }

  onRowClicked(event, content) {
    if (!this.isLoading) { // Stalls click spam
      this.isLoading = true;
      this.toggleMobile();
      this.gridApi = event.api;
      this.expenseData = event.data;
      this.expenses.getFinanceAttachment(event.data.id).subscribe((image: ExpensesIfc) => { // CHANGE TO CONTROLLER
        this.receiptFiles = [];
        // @ts-ignore
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < image.length; i++) {
          if (!(this.receiptFiles.includes(image[i]))) { // Stalls multiple attachments on mobile
            this.receiptFiles.push(image[i]);
          }
        }
        this.isLoading = false;
        this.toggleMobile();
        this.modalService.open(content, {centered: true}).result.then((result) => {
          this.regOff();
          this.gridApi.deselectAll();
        }, (reason) => {
          this.regOff();
          this.gridApi.deselectAll();
        });
      });
    }
  }
}
