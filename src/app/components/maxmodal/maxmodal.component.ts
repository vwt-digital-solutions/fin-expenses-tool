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
  @Output() messageEvent = new EventEmitter<boolean>();

  protected typeOptions: CostType[];
  protected receiptFiles: Attachment[];
  private readonly today: Date;
  private readonly wantsNext: boolean;
  public isCreditor: boolean;
  public isManager: boolean;
  public isViewer: boolean;
  public isEditor: boolean;

  constructor(private expensesConfigService: ExpensesConfigService, private route: ActivatedRoute) {
    if (window.location.pathname === '/home' || window.location.pathname === '/') {
      this.isEditor = true;
    } else if (window.location.pathname === 'expense/manage') {
      this.isManager = true;
    } else if (window.location.pathname === 'expenses/process') {
      this.isCreditor = true;
    } else {
      this.isViewer = true;
    }

    window.onmousedown = event => {
      if (event.target === document.getElementById('maxModal')) {
        this.wantsNext ? this.getNext() : this.closeModal(false);
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
                                   nTransDate: { invalid: any; viewModel: string | number | Date; }) {
    return nNote.invalid || nAmount.invalid || nType.invalid
      || nTransDate.invalid || (new Date(nTransDate.viewModel)
        > this.today) || nAmount.viewModel < 0.01;
  }

  protected claimUpdateForm(form, expenseId: any, instArray: any[]): void {
    if (!this.submitButtonController(instArray[0], instArray[1], instArray[2], instArray[3])) {
      const dataVerified = {};
      const data = form.value;
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
              console.error('SOMETHING HAPPENED');
            })
        : (console.log('SOMETHING HAPPENED'));
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
          console.error('SOMETHING HAPPENED');
        });
  }

  protected closeModal(reload): void {
    document.getElementById('max-modal').className = 'move-bottom';
    setTimeout(() => {
      this.messageEvent.emit(reload);
    }, 300);
  }

  protected getNext(): void {
    document.getElementById('max-modal').className = 'move-right';
    setTimeout(() => {
      this.messageEvent.emit();
    }, 300);
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
              }, reader.onerror = Error => console.log(Error);
            }
          }
        };
      }
    }
  }
}
