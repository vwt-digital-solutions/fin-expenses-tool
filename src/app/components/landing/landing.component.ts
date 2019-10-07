import {Component, OnInit} from '@angular/core';
import {NgForm} from '@angular/forms';
import {ExpensesConfigService} from '../../services/config.service';
import {Expense} from '../../models/expense';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {DomSanitizer} from '@angular/platform-browser';
import {IdentityService} from 'src/app/services/identity.service';
import {catchError, map} from 'rxjs/operators';
import {Attachment} from 'src/app/models/attachment';
import {ActivatedRoute} from '@angular/router';


@Component({
  selector: 'app-manager',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {

  public OurJaneDoeIs: any[] | string[];
  public displayPersonName: string | string[];
  public personID: string;
  public declarationData: Expense[];
  public expenseData: Expense;
  public showErrors: boolean;
  public formErrors: string;
  public formResponse: any;
  public formSubmitted: boolean;
  private receiptFiles: Attachment[];
  public today: Date;
  public hasNoExpenses: boolean;
  public typeOptions: Expense[];

  constructor(
    private identityService: IdentityService,
    private modalService: NgbModal,
    private expenses: ExpensesConfigService,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute
  ) {
  }

  static formatNumber(numb: any) {
    return ((numb).toFixed(2)).toString().replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  }

  decimalFormatter(amount: any) {
    return '€' + LandingComponent.formatNumber(amount);
  }

  dateFormatter(firstDate: string | number | Date) {
    const date = new Date(firstDate);
    return date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear() + ' ' + date.toLocaleTimeString('nl-NL');
  }

  openSanitizeFile(type: string, file: string) {
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
      const dataContent = 'data:' + type + ';base64,' + encodeURI(file);
      // tslint:disable-next-line:max-line-length no-unused-expression
      win.document.write('<iframe src="' + dataContent + '" frameborder="0" style="border:0; top:auto; left:0; bottom:0; right:0; width:100%; height:100%;" allowfullscreen></iframe>');
    }
  }

  statusClassing(status: string) {
    if (status.includes('rejected')) {
      return 'badge badge-pill badge-warning';
    } else if (status.includes('cancelled')) {
      return 'badge badge-pill badge-danger';
    } else if (status === 'approved') {
      return 'badge badge-pill badge-success';
    } else if (status === 'payed') {
      return 'badge badge-pill badge-success';
    } else {
      return 'badge badge-pill badge-info';
    }
  }

  statusFormatter(status: string) {
    if (status.includes('rejected')) {
      return 'Aanpassing vereist';
    } else if (status.includes('cancelled')) {
      return 'Geannuleerd';
    } else if (status === 'approved') {
      return 'Goedgekeurd';
    } else if (status === 'exported') {
      return 'Afgerond';
    } else {
      return 'In behandeling';
    }
  }

  ngOnInit() {
    this.OurJaneDoeIs = [];
    const claimJaneDoe = this.identityService.allClaims();
    for (const role of claimJaneDoe.roles) {
      this.OurJaneDoeIs.push(role.split('.')[0]);
    }
    this.personID = claimJaneDoe.email ? claimJaneDoe.email.split('@')[0] : 'UNDEFINED';
    this.displayPersonName = claimJaneDoe.name ? claimJaneDoe.name.split(',') : ['UNDEFINED', 'UNDEFINED'];
    this.displayPersonName = (this.displayPersonName[1] + ' ' + this.displayPersonName[0]).substring(1);
    this.route.data.pipe(
      map(data => data.costTypes)
    ).subscribe(costTypes => this.typeOptions = [...costTypes]);
    this.declarationCall();
    this.today = new Date();
  }

  getManagerExpensesList() {
    this.expenses.getManagerExpenses()
      .subscribe(
        result => {
          console.log(result);
        },
        error => {
          console.error('>> GET FAILED', error.message);
        });
  }

  declarationCall() {
    this.expenses.getEmployeeExpenses(this.personID)
      .subscribe(
        val => {
          this.declarationData = val;
          this.hasNoExpenses = (val.length < 1);
          console.log('>> GET SUCCESS', val);
        }, response => {
          console.error('>> GET FAILED', response.message);
        });
  }

  clickExpense(content: any, item: any) {
    if (this.isClickable(item)) {
      this.expenses.getExpenseAttachment(item.id).subscribe((image: any) => {
        for (const img of image) {// data:image/png;base64,
          this.receiptFiles.push({
            content: `data:${img.content_type};base64,${img.content}`,
            content_type: img.content_type,
            from_db: true,
            db_name: img.name,
            expense_id: item.id
          });
        }
      });
      this.formSubmitted = false;
      this.expenseData = item;
      this.showErrors = false;
      this.formErrors = '';
      this.openExpenseDetailModal(content, item);
    }
  }

  isClickable(item) {
    return item.status.text.toString().includes('rejected');
  }

  // Modal
  dismissExpenseModal() {
    setTimeout(() => {
      this.modalService.dismissAll();
    }, 200);
  }

  removeFromAttachmentList(item: any) {
    for (let i = 0; i < this.receiptFiles.length; i++) {
      if (this.receiptFiles[i] === item) {
        if (item.from_db) {
          this.expenses.deleteAttachment(item)
            .subscribe(() => {
              this.receiptFiles.splice(i, 1);
            });
        } else {
          this.receiptFiles.splice(i, 1);
        }
      }
    }
  }

  submitButtonController(nnote: { invalid: any; },
                         namount: { invalid: any; viewModel: number; },
                         ntype: { invalid: any; },
                         ntransdate: { invalid: any; viewModel: string | number | Date; }) {
    return nnote.invalid || namount.invalid || ntype.invalid
      || ntransdate.invalid || (new Date(ntransdate.viewModel)
        > this.today) || namount.viewModel < 0.01;
  }

  openExpenseDetailModal(content: any, data: any) {
    this.receiptFiles = [];
    this.modalService.open(content, {centered: true});
  }

  onFileInput(file) {
    if (file[0].type.split('/')[0] !== 'image' && file[0].type !== 'application/pdf') {
      alert('Graag alleen een pdf of afbeelding toevoegen');
      return;
    }
    const isIEOrEdge = /msie\s|trident\/|edge\//i.test(window.navigator.userAgent);
    if (isIEOrEdge) {
      alert('Please use Chrome or Firefox to use this ');
    } else {
      if (!(file[0] === undefined || file[0] === null)) {
        const reader = new FileReader();
        reader.readAsDataURL(file[0]);
        reader.onload = () => {
          if (file[0].type === 'application/pdf') {
            this.receiptFiles.push({
              content: reader.result,
              content_type: 'application/pdf',
              from_db: false
            });
          } else if (file[0].type.split('/')[0] === 'image') {
            const img = new Image();
            if (typeof reader.result === 'string') {
              img.src = reader.result;
              img.onload = () => {
                const canvas = document.createElement('canvas');
                let width: number;
                if (img.width > 600) {
                  width = 600;
                } else {
                  width = img.width;
                }
                const scaleFactor = width / img.width;
                canvas.width = width;
                canvas.height = img.height * scaleFactor;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, img.height * scaleFactor);
                ctx.canvas.toBlob(blob => {
                  const filla = new File([blob], file[0].name, {
                    type: file[0].type,
                    lastModified: this.today.getTime()
                  });
                  reader.readAsDataURL(filla);
                  reader.onload = () => {
                    this.receiptFiles.push({
                      content: reader.result,
                      content_type: file[0].type,
                      from_db: false
                    });
                  };
                }, file[0].type, 1);
              }, reader.onerror = Error => console.log(Error);
            }
          }
        };
      }
    }
  }

  claimUpdateForm(form: NgForm, expenseId: any, instArray: any[]) {
    if (!this.submitButtonController(instArray[0], instArray[1], instArray[2], instArray[3])) {
      // Check Form Data
      const dataVerified = {};
      const data = form.value;
      data.amount = Number((data.amount).toFixed(2));
      data.date_of_transaction = (new Date(data.date_of_transaction).getTime());
      for (const prop in data) {
        if (prop.length !== 0) {
          dataVerified[prop] = data[prop];
        }
      }
      dataVerified[`status`] = 'ready_for_manager'; // This needs to be done on the backend
      Object.keys(dataVerified).length !== 0 || this.formSubmitted === true ?
        this.expenses.updateExpenseEmployee(dataVerified, expenseId)
          .subscribe(
            result => {
              this.showErrors = false;
              this.uploadSingleAttachment(expenseId);
              this.formSubmitted = !form.ngSubmit.hasError;
              this.declarationCall();
              this.dismissExpenseModal();
            },
            error => {
              this.showErrors = true;
              Object.assign(this.formResponse, JSON.parse(error));
            })
        : (this.showErrors = true, this.formErrors = 'Geen gegevens geüpdatet');
    }
  }

  cancelExpense() {
    const dataVerified = {};
    // @ts-ignore
    const expenseId = this.expenseData.id;

    dataVerified[`status`] = 'cancelled';

    this.expenses.updateExpenseEmployee(dataVerified, expenseId)
      .subscribe(
        result => {
          this.showErrors = false;
          this.declarationCall();
          this.dismissExpenseModal();
        },
        error => {
          this.showErrors = true;
          Object.assign(this.formResponse, JSON.parse(error));
        });
  }

  private uploadSingleAttachment(expenseId: any) {
    if (this.receiptFiles.length > 0) {
      const file = this.receiptFiles.splice(0, 1)[0];
      if (!file.from_db) {
        this.expenses.uploadSingleAttachment(expenseId, {
          name: '' + this.receiptFiles.length,
          content: file.content
        }).subscribe(() => {
          this.uploadSingleAttachment(expenseId);
        });
      } else {
        this.uploadSingleAttachment(expenseId);
      }
    }
  }
}
