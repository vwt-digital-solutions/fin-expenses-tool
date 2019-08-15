import {Component, OnInit} from '@angular/core';
import {OAuthService} from 'angular-oauth2-oidc';
import {HttpClient} from '@angular/common/http';
import {EnvService} from '../../services/env.service';
import {NgForm} from '@angular/forms';
import {ExpensesConfigService} from '../../services/config.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';


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

  constructor(
    private oauthService: OAuthService,
    private httpClient: HttpClient,
    private env: EnvService,
    private modalService: NgbModal,
    private expenses: ExpensesConfigService,
  ) {
  }

  static formatNumber(numb) {
    return ((numb).toFixed(2)).toString().replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  }

  decimalFormatter(amount) {
    return '€ ' + LandingComponent.formatNumber(amount);
  }

  dateFormatter(firstDate) {
    const date = new Date(firstDate);
    return date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear() + ' ' + date.toLocaleTimeString('nl-NL');
  }

  getFileName(name) {
    return (name.split('/')).slice(-1)[0];
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
    this.OurJaneDoeIs = claimJaneDoe.roles[0].split('.')[0];
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
    // @ts-ignore
    this.httpClient.get(this.env.apiUrl + '/employees/' + this.personID + '/expenses')
      .subscribe(
        val => {
          this.declarationData = val;
          console.log('>> GET SUCCESS', val);
        }, response => {
          console.error('>> GET FAILED', response.message);
        });
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
          this.receiptFiles.push(image[i].url);
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

  submitButtonController(nnote, namount, ntype, ntransdate) {
    return nnote.invalid || namount.invalid || ntype.invalid
      || ntransdate.invalid || (new Date(ntransdate.viewModel)
        > this.today) || namount.viewModel < 0.01;
  }

  openExpenseDetailModal(content, data) {
    this.receiptFiles = [];
    this.modalService.open(content, {centered: true});
  }

  claimUpdateForm(form: NgForm, expenseId, instArray) {
    if (!this.submitButtonController(instArray[0], instArray[1], instArray[2], instArray[3])) {
      const dataVerified = {};
      const data = form.value;
      data.amount = Number((data.amount).toFixed(2));
      for (const prop in data) {
        if (data[prop].length !== 0) {
          dataVerified[prop] = data[prop];
        }
      }
      dataVerified[`status`] = 'to_be_reviewed';
      Object.keys(dataVerified).length !== 0 || this.formSubmitted === true ?
        this.expenses.updateExpense(dataVerified, expenseId)
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
