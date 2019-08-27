import {Component, OnInit, Pipe, PipeTransform} from '@angular/core';
import {OAuthService} from 'angular-oauth2-oidc';
import {HttpClient} from '@angular/common/http';
import {EnvService} from '../../services/env.service';
import {NgForm} from '@angular/forms';
import {ExpensesConfigService} from '../../services/config.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {isEmpty} from 'rxjs/operators';
import {DomSanitizer, SafeResourceUrl, SafeUrl} from '@angular/platform-browser';


interface IClaimRoles {
  oid: any;
  roles: any;
}

interface ExpensesIfc {
  ['body']: any;
}

@Component({
  selector: 'app-manager',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {

  public OurJaneDoeIs: string;
  public displayPersonName;
  public personID;
  public declarationData;
  public expenseData: object;
  public showErrors;
  public formErrors;
  public formResponse;
  public formSubmitted;
  public typeOptions;
  private receiptImage: any;
  private receiptFiles;
  public today;
  public hasNoExpenses;

  constructor(
    private oauthService: OAuthService,
    private httpClient: HttpClient,
    private env: EnvService,
    private modalService: NgbModal,
    private expenses: ExpensesConfigService,
    private sanitizer: DomSanitizer,
  ) {
  }

  static formatNumber(numb) {
    return ((numb).toFixed(2)).toString().replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  }

  decimalFormatter(amount) {
    return '€' + LandingComponent.formatNumber(amount);
  }

  dateFormatter(firstDate) {
    const date = new Date(firstDate);
    return date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear() + ' ' + date.toLocaleTimeString('nl-NL');
  }

  openSanitizeFile(type, file) {
    const win = window.open();
    // @ts-ignore
    // tslint:disable-next-line:max-line-length no-unused-expression
    win.document.write('<iframe src="' + this.sanitizer.bypassSecurityTrustUrl('data:' + type + ';base64,' + encodeURI(file)).changingThisBreaksApplicationSecurity  + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
  }

  statusClassing(status) {
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

  statusFormatter(status) {
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
    const claimJaneDoe = this.oauthService.getIdentityClaims() as IClaimRoles;
    // @ts-ignore
    this.displayPersonName = claimJaneDoe.name.split(',');
    this.displayPersonName = (this.displayPersonName[1] + ' ' + this.displayPersonName [0]).substring(1);
    try {
      this.OurJaneDoeIs = claimJaneDoe.roles[0].split('.')[0];
    } catch (e) {
      this.OurJaneDoeIs = 'employee.write';
    }
    // @ts-ignore
    this.personID = claimJaneDoe.email.split('@')[0];
    this.declarationCall();
    this.today = new Date();

    this.expenses.getCostTypes()
      .subscribe(
        val => {
          this.typeOptions = val;
        });
  }

  declarationCall() {
    this.hasNoExpenses = true;
    // @ts-ignore
    // this.httpClient.get(this.env.apiUrl + '/employees/' + this.personID + '/expenses')
    //   .subscribe(
    //     val => {
    //       this.declarationData = val;
    //       // @ts-ignore
    //       this.hasNoExpenses = (val.length < 1);
    //       console.log('>> GET SUCCESS', val);
    //     }, response => {
    //       console.error('>> GET FAILED', response.message);
    //     });
  }

  handleLinking(event) {
    window.location.href = window.location.protocol + '//' + window.location.host + '/' + event.target.name;
  }

  clickExpense(content, item) {
    if (this.isClickable(item)) {
      this.expenses.getExpenseAttachment(item.id).subscribe((image: ExpensesIfc) => {
        // @ts-ignore
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < image.length; i++) {
          this.receiptFiles.push(image[i]);
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

  removeFromAttachmentList(item) {
    let i;
    for (i = 0; i < this.receiptFiles.length; i++) {
      if (this.receiptFiles[i] === item) {
        this.receiptFiles.splice(i, 1);
      }
    }
  }

  submitButtonController(nnote, namount, ntype, ntransdate) {
    return nnote.invalid || namount.invalid || ntype.invalid
      || ntransdate.invalid || (new Date(ntransdate.viewModel)
        > this.today) || namount.viewModel < 0.01;
  }

  openExpenseDetailModal(content, data) {
    this.receiptFiles = [];
    this.modalService.open(content, {centered: true});
  }

  onFileInput(file) {
    if (!(file[0] === undefined || file[0] === null)) {
      const reader = new FileReader();
      reader.readAsDataURL(file[0]);
      reader.onload = () => {
        this.receiptFiles.push(reader.result);
      };
    }
  }

  claimUpdateForm(form: NgForm, expenseId, instArray) {
    if (!this.submitButtonController(instArray[0], instArray[1], instArray[2], instArray[3])) {
      let fileString = '';
      let i;
      // @ts-ignore
      for (i = 0; i < this.receiptFiles.length; i++) {
        if (fileString === '') {
          fileString = this.receiptFiles[i];
        } else {
          fileString = fileString + '.' + this.receiptFiles[i];
        }
      }
      form.value.attachment = fileString;
      const dataVerified = {};
      const data = form.value;
      data.amount = Number((data.amount).toFixed(2));
      data.date_of_transaction = (new Date(data.date_of_transaction).getTime());
      for (const prop in data) {
        if (prop.length !== 0) {
          dataVerified[prop] = data[prop];
        }
      }
      dataVerified[`status`] = 'ready_for_manager';
      Object.keys(dataVerified).length !== 0 || this.formSubmitted === true ?
        this.expenses.updateExpenseEmployee(dataVerified, expenseId)
          .subscribe(
            result => {
              this.showErrors = false;
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
}
