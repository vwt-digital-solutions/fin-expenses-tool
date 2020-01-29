import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { NgForm } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

import { EnvService } from 'src/app/services/env.service';
import { ExpensesConfigService } from 'src/app/services/config.service';
import { DeviceDetectorService } from 'ngx-device-detector';
import { IdentityService } from '../../services/identity.service';
import { DefaultImageService } from '../../services/default-image.service';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent implements  OnInit {
  public formNote: any;
  public formCostTypeMessage = { short: '', long: '' };
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
  public wantsNext = 0;
  public wantsSubmit = 0;
  public expenseID: number;
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

  private successfulClaim(form: NgForm) {
    this.addClaimSuccess.success = true;
    this.loadingThings = false;

    if (this.wantsNext > 0) {
      form.reset();
      this.attachmentList = [];
      this.locatedFile = [];

      setTimeout(() => {
         this.addClaimSuccess = { success: false, wrong: false }
      }, 4000);
    } else {
        setTimeout(() => {
        this.router.navigate(['/']);
      }, 1000);
    }
  }

  private wrongfulClaim(text = null) {
    if (text !== null) {
      this.formError = text;
    }
    this.addClaimSuccess.wrong = true;
    this.loadingThings = false;
  }

  ngOnInit(): void {
    this.route.data.pipe(
      map(data => data.costTypes)
    ).subscribe(costTypes => this.typeOptions = [...costTypes]);

    if (this.identityService.isTesting()) {
      this.locatedFile.push(this.defaultImageService.getDefaultImageForTest());
    }
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
    if (this.identityService.isTesting()) {
      nattachment = { invalid: false }
    }

    return this.expensesNote === false || this.expensesAmount === false || this.expenseType === false || this.expenseTransDate === false ||
      this.expenseAttachment === false || nnote.invalid || namount.invalid || ntype.invalid || ntransdate.invalid ||
      nattachment.invalid || this.addClaimSuccess.wrong === true;
  }

  onFileInput(file: FileList) {
    if (file[0].type.split('/')[0] !== 'image' && file[0].type !== 'application/pdf') {
      alert('Graag alleen een pdf of afbeelding toevoegen');
      return;
    } else if (/msie\s|trident\/|edge\//i.test(window.navigator.userAgent)) {
      alert('Please use Chrome or Firefox to use this ');
    } else if (!(file[0] === undefined || file[0] === null)) {
      this.attachmentList.push(file);
      const reader = new FileReader();
      reader.readAsDataURL(file[0]);
      reader.onload = () => {
        this.locatedFile.push(reader.result);
      };
    }
  }

  claimForm(event: Event, form: NgForm) {
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

      this.expenses.createExpenses(obj).subscribe(
        response => {
          this.expenseID = response;
          console.log('>> POST EXPENSE SUCCESS', response);
          this.afterPostExpense(response, form);
        }, error => {
          if (error.status === 403) {
            this.wrongfulClaim('Je bent niet bekend bij de personeelsadministratie. Neem contact op met je manager.');
            if (ExpensesComponent.getNavigator()) {
              alert('Je bent niet bekend bij de personeelsadministratie. Neem contact op met je manager.');
            }
          } else if (error.status === 400) {
            this.wrongfulClaim(error.error);
          } else {
            this.wrongfulClaim();
          }
          console.error('>> POST EXPENSE FAILED', error.message);
        });
    }
  }

  bulkAttachmentUpload(expenseID: number) {
    const fileRequests = [];
    for (const count in this.locatedFile) {
      fileRequests.push(
        this.expenses.uploadSingleAttachment(expenseID, {
          name: count.toString(),
          content: this.locatedFile[count]
        })
      );
    }

    return forkJoin(fileRequests);
  }

  afterPostExpense(expenseID: number, form: NgForm) {
    if (this.locatedFile.length > 0) {
      this.bulkAttachmentUpload(expenseID).subscribe(
        responseList => {
          console.log('>> POST ATTACHMENTS SUCCESS', responseList);
          this.afterPostAttachments(expenseID, form);
        }, error => {
          this.wrongfulClaim('Er is iets fout gegaan bij het uploaden van de bestanden, neem contact op met de crediteuren afdeling.');
          console.error('>> POST ATTACHMENTS FAILED', error.message);
          setTimeout(() => {
            this.router.navigate(['home']);
          }, 4000);
        })
    } else {
      this.afterPostAttachments(expenseID, form);
    }
  }

  afterPostAttachments(expenseID: number, form: NgForm) {
    if (this.wantsSubmit > 0) {
      this.expenses.updateExpenseEmployee(
        { status: 'ready_for_manager' }, expenseID
      ).subscribe(
        response => this.successfulClaim(form),
        error => {
          this.wrongfulClaim('Er is iets fout gegaan bij het indienen van de declaratie, neem contact op met de crediteuren afdeling.');
          console.error('>> PUT EXPENSE FAILED', error.message);
          setTimeout(() => {
            this.router.navigate(['home']);
          }, 4000);
        }
      );
    } else {
      this.successfulClaim(form);
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
          this.formCostTypeMessage = type.message['nl'];
        } else {
          this.formCostTypeMessage = { short: '', long: '' };
        }
      }
    }
  }
}
