import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Expense} from '../../models/expense';
import {CostType} from '../../models/cost-type';
import {ActivatedRoute} from '@angular/router';
import {map} from 'rxjs/operators';
import {Attachment} from '../../models/attachment';
import {ExpensesConfigService} from '../../services/config.service';

@Component({
  selector: 'app-maxmodal',
  templateUrl: './maxmodal.component.html',
  styleUrls: ['./maxmodal.component.scss']
})
export class MaxModalComponent implements OnInit {

  @Input() expenseData: Expense;
  @Input() forceViewer: boolean;
  @Output() messageEvent = new EventEmitter<boolean[]>();

  protected safeNote: string;
  protected typeOptions: CostType[];
  protected receiptFiles: Attachment[];
  protected errorMessage: string;
  private readonly today: Date;
  private action: string;
  private selectedRejection: any;
  public isCreditor: boolean;
  public isManager: boolean;
  public isViewer: boolean;
  public isEditor: boolean;
  public isRejecting: boolean;
  public rejectionNote: boolean;

  constructor(private expensesConfigService: ExpensesConfigService, private route: ActivatedRoute) {
    if (window.location.pathname === '/home' || window.location.pathname === '/') {
      this.isEditor = true;
    } else if (window.location.pathname === '/expenses/manage') {
      this.isManager = true;
    } else if (window.location.pathname === '/expenses/process') {
      this.isCreditor = true;
    } else {
      this.isViewer = true;
    }

    this.selectedRejection = 'Deze kosten kun je declareren via Regweb (PSA)';

    window.onmousedown = event => {
      if (event.target === document.getElementById('maxModal')) {
        this.closeModal(false, false);
      }
    };
    this.route.data.pipe(
      map(data => data.costTypes)
    ).subscribe(costTypes => this.typeOptions = [...costTypes]);
    this.today = new Date();
  }

  ngOnInit(): void {
    if (this.forceViewer) {
      this.isViewer = true;
      this.isEditor = false;
      this.isManager = false;
      this.isCreditor = false;
    }
    if (this.isCreditor) {
      this.expensesConfigService.getFinanceAttachment(this.expenseData.id).subscribe((image: any) => {
        this.receiptFiles = [];
        for (const img of image) {
          this.receiptFiles.push({
            content: `${img.content}`,
            content_type: img.content_type,
            from_db: true,
            db_name: img.name,
            expense_id: this.expenseData.id
          });
        }
      });
    } else if (this.isManager) {
      this.expensesConfigService.getManagerAttachment(this.expenseData.id).subscribe((image: any) => {
        this.receiptFiles = [];
        for (const img of image) {
          this.receiptFiles.push({
            content: `${img.content}`,
            content_type: img.content_type,
            from_db: true,
            db_name: img.name,
            expense_id: this.expenseData.id
          });
        }
      });
    } else if (this.isViewer) {
      this.expensesConfigService.getControllerAttachment(this.expenseData.id).subscribe((image: any) => {
        this.receiptFiles = [];
        for (const img of image) {
          this.receiptFiles.push({
            content: `${img.content}`,
            content_type: img.content_type,
            from_db: true,
            db_name: img.name,
            expense_id: this.expenseData.id
          });
        }
      });
    } else if (this.isEditor) {
      this.expensesConfigService.getExpenseAttachment(this.expenseData.id).subscribe((image: any) => {
        this.receiptFiles = [];
        for (const img of image) {
          this.receiptFiles.push({
            content: `${img.content}`,
            content_type: img.content_type,
            from_db: true,
            db_name: img.name,
            expense_id: this.expenseData.id
          });
        }
      });
    }
  }

  private uploadSingleAttachment(expenseId: any) {
    if (this.receiptFiles.length > 0) {
      const file: Attachment = this.receiptFiles.splice(0, 1)[0];
      if (!file.from_db) {
        this.expensesConfigService.uploadSingleAttachment(expenseId, {
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

  protected submitButtonController(nNote: { invalid: any; },
                                   nAmount: { invalid: any; viewModel: number; },
                                   nType: { invalid: any; },
                                   nTransDate: { invalid: any; viewModel: string | number | Date; },
                                   rNote: { invalid: boolean }) {
    if (this.isEditor) {
      return nNote.invalid || nAmount.invalid || nType.invalid
        || nTransDate.invalid || (new Date(nTransDate.viewModel)
          > this.today) || nAmount.viewModel < 0.01;
    } else if (this.isManager) {
      if (this.rejectionNote) {
        return rNote.invalid;
      }
    } else if (this.isCreditor) {
      if (this.rejectionNote) {
        return nType.invalid || rNote.invalid;
      } else {
        return nType.invalid;
      }
    }
  }

  protected claimUpdateForm(form, expenseId: any, instArray: any[]): void {
    if (!this.submitButtonController(instArray[0], instArray[1], instArray[2], instArray[3], instArray[4])) {
      const dataVerified = {};
      const data = form.value;
      if (this.isEditor) {
        data.amount = Number((data.amount).toFixed(2));
        data.transaction_date = new Date(data.transaction_date).toISOString();
        for (const prop in data) {
          if (prop.length !== 0) {
            dataVerified[prop] = data[prop];
          }
        }
        dataVerified[`status`] = 'ready_for_manager';
        Object.keys(dataVerified).length !== 0 ?
          this.expensesConfigService.updateExpenseEmployee(dataVerified, expenseId)
            .subscribe(
              result => {
                this.uploadSingleAttachment(expenseId);
                this.closeModal(true);
              },
              error => {
                console.log(error);
                this.errorMessage = error.error.detail !== undefined ? error.error.detail : error.error;
              })
          : (this.errorMessage = 'Declaratie niet aangepast. Probeer het later nog eens.');
      } else if (this.isManager) {
        dataVerified[`rnote`] = data.rnote;
        if (!(this.rejectionNote) && this.action === 'rejecting') {
          dataVerified[`rnote`] = this.selectedRejection;
        }
        dataVerified[`status`] = this.action === 'approving' ? `ready_for_creditor` :
          this.action === 'rejecting' ? `rejected_by_manager` : null;
        Object.keys(dataVerified).length !== 0 ?
          this.expensesConfigService.updateExpenseManager(dataVerified, expenseId)
            .subscribe(
              result => {
                this.closeModal(true);
              },
              error => {
                console.log(error);
                this.errorMessage = error.error.detail !== undefined ? error.error.detail : error.error;
              })
          : (this.errorMessage = 'Declaratie niet aangepast. Probeer het later nog eens.');
      }
    }
  }

  protected rejectionHit(event: any) {
    this.rejectionNote = (event.target.value === 'note');
    this.selectedRejection = event.target.value;
    if (this.rejectionNote) {
      document.getElementById('rejection-note-group').style.visibility = 'visible';
      document.getElementById('rejection-note-group').style.display = 'block';
    } else {
      document.getElementById('rejection-note-group').style.visibility = 'hidden';
      document.getElementById('rejection-note-group').style.display = 'none';
    }
  }

  protected cancelExpense() {
    const dataVerified = {};
    const expenseId = this.expenseData.id;
    dataVerified[`status`] = 'cancelled';
    this.expensesConfigService.updateExpenseEmployee(dataVerified, expenseId)
      .subscribe(
        result => {
          this.closeModal(true);
        },
        error => {
          this.errorMessage = error.error.detail !== undefined ? error.error.detail : error.error;
        });
  }

  protected closeModal(reload, next = true): void {
    document.getElementById('max-modal').className = 'move-bottom';
    setTimeout(() => {
      this.messageEvent.emit([reload, next]);
    }, 300);
  }

  protected updatingAction(event) {
    this.action = event;
    if (event === 'rejecting') {
      this.isRejecting = true;
    }
  }

  protected openFile(type, content): void {
    console.log(type, content);
  }

  protected removeFromAttachmentList(item): void {
    for (let i = 0; i < this.receiptFiles.length; i++) {
      if (this.receiptFiles[i] === item) {
        if (item.from_db) {
          this.expensesConfigService.deleteAttachment(item)
            .subscribe(() => {
              this.receiptFiles.splice(i, 1);
            });
        } else {
          this.receiptFiles.splice(i, 1);
        }
      }
    }
  }

  // Messy functions from here on. Will be moved or changed in other stories.
  private getNavigator() {
    return navigator.userAgent.match(/Android/i)
      || navigator.userAgent.match(/webOS/i)
      || navigator.userAgent.match(/iPhone/i)
      || navigator.userAgent.match(/iPad/i)
      || navigator.userAgent.match(/iPod/i)
      || navigator.userAgent.match(/BlackBerry/i)
      || navigator.userAgent.match(/Windows Phone/i);
  }

  protected openSanitizeFile(type: string, file: string) {
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
      if (this.getNavigator()) {
        win.document.write('<p>Problemen bij het weergeven van het bestand? Gebruik Edge Mobile of Samsung Internet.</p>');
      } else if (!isChrome) {
        win.document.write('<p>Problemen bij het weergeven van het bestand? Gebruik Chrome of Firefox.</p>');
      }
      const dataContent = 'data:' + type + ';base64,' + encodeURI(file);
      // tslint:disable-next-line:max-line-length no-unused-expression
      win.document.write('<iframe src="' + dataContent + '" frameborder="0" style="border:0; top:auto; left:0; bottom:0; right:0; width:100%; height:100%;" allowfullscreen></iframe>');
    }
  }

  // File Input, structured to limit file size and check if input would work.
  protected onFileInput(file) {
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
              }, reader.onerror = Error => console.error(Error);
            }
          }
        };
      }
    }
  }
}
