import {Component, OnInit} from '@angular/core';
import {NgForm} from '@angular/forms';
import {HttpResponse} from '@angular/common/http';
import {EnvService} from 'src/app/services/env.service';
import {Router, ActivatedRoute} from '@angular/router';
import {map} from 'rxjs/operators';
import {ExpensesConfigService} from 'src/app/services/config.service';
import {DeviceDetectorService} from 'ngx-device-detector';
import {IdentityService} from '../../services/identity.service';
import {DefaultImageService} from '../../services/default-image.service';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent implements OnInit {

  public formNote: any;
  public formNoteLicensePlate = false;
  public formAmount: any;
  public formType: any;
  public formError: string;
  public formTransDate: any;
  public formAttachment: any;
  public expensesAmount: boolean;
  public expensesNote: boolean;
  public expenseType: boolean;
  public expenseTransDate: boolean;
  public expenseAttachment: boolean;
  public addClaimSuccess: { success: any; wrong: any; };
  public typeOptions: any[];
  public today: Date;
  public notaData: string;
  public transdateNotFilledMessage;
  public locatedFile: any[] | (string | ArrayBuffer)[];
  public loadingThings: boolean;
  public attachmentList: any[];
  public wantsNext: number;
  public expenseID: string | number;
  public isDesktopDevice = null;

  constructor(
    private expenses: ExpensesConfigService,
    private env: EnvService,
    private router: Router,
    private route: ActivatedRoute,
    private deviceService: DeviceDetectorService,
    private identityService: IdentityService,
    private defaultImageService: DefaultImageService,
  ) {
    this.isDesktopDevice = this.deviceService.isDesktop();

    this.addClaimSuccess = {success: false, wrong: false};
    this.today = new Date();
    this.notaData = 'Toevoegen';
    this.loadingThings = false;
    this.wantsNext = 0;
    this.locatedFile = [];
    this.attachmentList = [];
    this.transdateNotFilledMessage = 'Graag een geldige datum invullen';
    this.formError = 'Er is iets fout gegaan. Probeer het later opnieuw.';
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

  private splitSet(form: NgForm) {
    this.expensesAmount = !((typeof form.value.amount !== 'number') || (form.value.amount < 0.01));
    this.expensesNote = !((typeof form.value.note !== 'string') || form.value.note === '');
    this.expenseType = !(form.value.cost_type === undefined || form.value.cost_type === null);
    this.expenseTransDate = !((form.value.transaction_date === undefined
      || form.value.transaction_date === null) || new Date(form.value.transaction_date) > this.today);
    this.expenseAttachment = !(this.locatedFile.length < 1);
    if (this.identityService.isTesting()) {
      this.expenseAttachment = true;
    }
  }

  private splitCheck() {
    return (this.expensesNote && this.expensesAmount && this.expenseType && this.expenseTransDate && this.expenseAttachment
      && this.addClaimSuccess.wrong === false);
  }

  private successfulClaim() {
    return this.addClaimSuccess.success = true;
  }

  private wrongfulClaim(text = null) {
    if (text !== null) {
      this.formError = text;
    }
    return this.addClaimSuccess.wrong = true;
  }

  private uploadSingleAttachment(form: NgForm) {
    if (this.identityService.isTesting()) {
      this.locatedFile.push(this.defaultImageService.getDefaultImageForTest());
    }
    if (this.locatedFile.length > 0) {
      const file = this.locatedFile.splice(0, 1)[0];
      this.expenses.uploadSingleAttachment(this.expenseID, {
        name: '' + this.locatedFile.length, content: file
      }).subscribe(
        (response: HttpResponse<any>) => {
          console.log('>> POST SUCCESS');
          if (!this.identityService.isTesting()) {
            this.uploadSingleAttachment(form);
          } else {
            setTimeout(() => {
              this.router.navigate(['/']);
            }, 1000);
          }
        }, response => {
          console.error('>> POST FAILED', response.message);
        });
    } else {
      if (this.wantsNext > 0) {
        form.reset();
        this.attachmentList = [];
        this.locatedFile = [];
      } else {
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1000);
      }
    }
  }

  ngOnInit(): void {
    this.route.data.pipe(
      map(data => data.costTypes)
    ).subscribe(costTypes => this.typeOptions = [...costTypes]);
  }

  notFilledClass(setClass: { name: string; invalid: any; dirty: any; touched: any; }) {
    let starBool: boolean;
    if (setClass.name === 'amount') {
      starBool = this.expensesAmount === false;
    }
    if (setClass.name === 'note') {
      starBool = this.expensesNote === false;
    }
    if (setClass.name === 'cost_type') {
      starBool = this.expenseType === false;
    }
    if (setClass.name === 'transaction_date') {
      starBool = this.expenseTransDate === false;
    }
    if (setClass.name === 'attachment') {
      starBool = this.expenseAttachment === false;
      return starBool;
    }
    return starBool || (setClass.invalid && (setClass.dirty || setClass.touched));
  }

  submitButtonController(nnote: { invalid: any; },
                         namount: { invalid: any; },
                         ntype: { invalid: any; },
                         ntransdate: { invalid: any; },
                         nattachment: { invalid: any; }) {
    return this.expensesNote === false || this.expensesAmount === false || this.expenseType === false || this.expenseTransDate === false ||
      this.expenseAttachment === false || nnote.invalid || namount.invalid || ntype.invalid || ntransdate.invalid ||
      nattachment.invalid || this.addClaimSuccess.wrong === true;
  }

  onFileInput(file: FileList) {
    if (file[0].type.split('/')[0] !== 'image' && file[0].type !== 'application/pdf') {
      alert('Graag alleen een pdf of afbeelding toevoegen');
      return;
    }
    const isIEOrEdge = /msie\s|trident\/|edge\//i.test(window.navigator.userAgent);
    if (isIEOrEdge) {
      alert('Please use Chrome or Firefox to use this ');
    } else {
      if (!(file[0] === undefined || file[0] === null)) {
        this.attachmentList.push(file);
        const reader = new FileReader();
        reader.readAsDataURL(file[0]);
        reader.onload = () => {
          if (file[0].type === 'application/pdf') {
            this.locatedFile.push(reader.result);
          } else if (file[0].type.split('/')[0] === 'image') {
            const img = new Image();
            if (typeof reader.result === 'string') {
              img.src = reader.result;
              img.onload = () => {
                const canvas = document.createElement('canvas');
                let width: number;
                if (img.width > 1000) {
                  width = 1000; // Limit images to 1000 as width (should be readable)
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
                    this.locatedFile.push(reader.result);
                  };
                }, file[0].type, 1);
              }, reader.onerror = Error => console.log(Error);
            }
          }
        };
      }
    }
  }

  claimForm(form: NgForm) {
    this.splitSet(form);
    if (form.value.transaction_date !== undefined && form.value.transaction_date !== null) {
      if (form.value.transaction_date.length > 8) {
        this.transdateNotFilledMessage = 'Declaraties kunnen alleen gedaan worden na de aankoop';
      }
    }
    if (this.splitCheck()) {
      this.loadingThings = true;
      // Format Values
      form.value.amount = Number((form.value.amount).toFixed(2));
      form.value.transaction_date = new Date(form.value.transaction_date).toISOString();
      const obj = JSON.parse(JSON.stringify(form.value));
      // End Format Values

      this.expenses.createExpenses(obj)
        .subscribe(
          (val) => {
            this.successfulClaim();
            this.loadingThings = false;
            console.log('>> POST SUCCESS', val);
            this.expenseID = val;
            this.uploadSingleAttachment(form);
          }, response => {
            if (response.status === 403) {
              this.wrongfulClaim('Je bent niet bekend bij de personeelsadministratie. Neem contact op met je manager.');
              if (ExpensesComponent.getNavigator()) {
                alert('Je bent niet bekend bij de personeelsadministratie. Neem contact op met je manager.');
              }
            } else if (response.status === 400) {
              this.wrongfulClaim(response.error);
            } else {
              this.wrongfulClaim();
            }
            this.loadingThings = false;
            console.error('>> POST FAILED', response.message);
          });
    }
  }

  removeFromAttachmentList(item: any) {
    for (let i = 0; i < this.attachmentList.length; i++) {
      if (this.attachmentList[i] === item) {
        this.attachmentList.splice(i, 1);
        this.locatedFile.splice(i, 1);
      }
    }
    this.formAttachment = null;
  }

  onChangeType(event: Event) {
    this.expenseType = true;
    for (const type of this.typeOptions) {
      if (event.target['value'].includes(type.cid)) {
        if (type.managertype === 'leasecoordinator') {
          this.formNoteLicensePlate = true;
        } else {
          this.formNoteLicensePlate = false;
        }
      }
    }
  }
}
