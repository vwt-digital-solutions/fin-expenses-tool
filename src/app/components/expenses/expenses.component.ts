import {Component, OnInit} from '@angular/core';
import {NgForm} from '@angular/forms';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {EnvService} from 'src/app/services/env.service';
import {Router, ActivatedRoute} from '@angular/router';
import {map, catchError} from 'rxjs/operators';
import {ExpensesConfigService} from 'src/app/services/config.service';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent implements OnInit {

  constructor(
    private httpClient: HttpClient,
    private env: EnvService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.addClaimSuccess = {success: false, wrong: false};
    this.today = new Date();
    this.notaData = 'Toevoegen';
    this.loadingThings = false;
    this.wantsList = true;
    this.wantsNext = 'No';
    this.locatedFile = [];
    this.attachmentList = [];
    this.formError = 'Er is iets fout gegaan. Probeer het later opnieuw.';
  }

  public formNote: any;
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
  public transdateNotFilledMessage = 'Graag een geldige datum invullen';
  public locatedFile: any[] | (string | ArrayBuffer)[];
  public loadingThings: boolean;
  public wantsList: boolean;
  public attachmentList: any[];
  public wantsNext: string;
  public expenseID: string | number;

  ngOnInit(): void {
    this.route.data.pipe(
      map(data => data.costTypes)
    ).subscribe(costTypes => this.typeOptions = [...costTypes]);
  }

  // Classes Logic
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
    if (setClass.name === 'date_of_transaction') {
      starBool = this.expenseTransDate === false;
    }
    if (setClass.name === 'attachment') {
      starBool = this.expenseAttachment === false;
      return starBool;
    }
    return starBool || (setClass.invalid && (setClass.dirty || setClass.touched));
  }

  successfulClaim() {
    return this.addClaimSuccess.success = true;
  }

  wrongfulClaim(text = null) {
    if (text !== null) {
      this.formError = text;
    }
    return this.addClaimSuccess.wrong = true;
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

  // End Classes Logic

  onFileInput(file: any[]) {
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

  splitCheck() {
    return (this.expensesNote && this.expensesAmount && this.expenseType && this.expenseTransDate && this.expenseAttachment
      && this.addClaimSuccess.wrong === false);
  }

  claimForm(form: NgForm) {
    this.expensesAmount = !((typeof form.value.amount !== 'number') || (form.value.amount < 0.01));
    this.expensesNote = !((typeof form.value.note !== 'string') || form.value.note === '');
    this.expenseType = !(form.value.cost_type === undefined);
    this.expenseTransDate = !(form.value.date_of_transaction === undefined || new Date(form.value.date_of_transaction) > this.today);
    this.expenseAttachment = !(this.locatedFile.length < 1);
    if (form.value.date_of_transaction !== undefined) {
      if (form.value.date_of_transaction.length > 8) {
        this.transdateNotFilledMessage = 'Declaraties kunnen alleen gedaan worden na de aankoop';
      }
    }
    if (this.splitCheck()) {
      this.loadingThings = true;
      // Format Values
      form.value.amount = Number((form.value.amount).toFixed(2));
      form.value.date_of_transaction = (new Date(form.value.date_of_transaction).getTime());
      form.value.transaction_date = new Date(form.value.date_of_transaction).toISOString();

      const obj = JSON.parse(JSON.stringify(form.value));
      // End Format Values
      // Send Claim
      this.httpClient.post<string>(this.env.apiUrl + '/employees/expenses', obj)
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
              if (navigator.userAgent.match(/Android/i)
                || navigator.userAgent.match(/webOS/i)
                || navigator.userAgent.match(/iPhone/i)
                || navigator.userAgent.match(/iPad/i)
                || navigator.userAgent.match(/iPod/i)
                || navigator.userAgent.match(/BlackBerry/i)
                || navigator.userAgent.match(/Windows Phone/i)) {
                alert('Je bent niet bekend bij de personeelsadministratie. Neem contact op met je manager.');
              }
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

  private uploadSingleAttachment(form: NgForm) {
    if (this.locatedFile.length > 0) {
      const file = this.locatedFile.splice(0, 1)[0];
      this.httpClient.post(this.env.apiUrl + `/employees/expenses/${this.expenseID}/attachments`, {
        name: '' + this.locatedFile.length,
        content: file
      }).pipe(catchError(ExpensesConfigService.handleError))
        .subscribe(() => {
          this.uploadSingleAttachment(form);
        });
    } else {
      if (this.wantsNext === 'Yes') {
        form.reset();
        this.attachmentList = [];
        this.locatedFile = [];
      } else {
        const that = this;
        setTimeout(() => {
          that.router.navigate(['/']);
        }, 1000);
      }
    }
  }
}
