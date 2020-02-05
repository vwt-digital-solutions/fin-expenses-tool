import {Component, OnInit} from '@angular/core';
import {ExpensesConfigService} from '../../services/config.service';
import {Expense} from '../../models/expense';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {IdentityService} from 'src/app/services/identity.service';
import {FormatterService} from '../../services/formatter.service';


@Component({
  selector: 'app-manager',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {

  public OurJaneDoeIs: any[] | string[];
  public displayPersonName: string | string[];
  public personID: string;
  public declarationData: Expense[] = [];
  public expenseData: Expense;
  public today: Date;
  public hasNoExpenses = true;
  public managerAmount: number;

  public wantsNewModal;
  public forceViewer;

  constructor(
    private identityService: IdentityService,
    private modalService: NgbModal,
    private expenses: ExpensesConfigService,
    public formatter: FormatterService
  ) {
    this.wantsNewModal = false;
  }

  decimalFormatter(amount: any) {
    return FormatterService.decimalFormatter(amount);
  }

  dateFormatter(firstDate) {
    return FormatterService.getCorrectDate(firstDate);
  }

  ngOnInit() {
    this.OurJaneDoeIs = [];
    const claimJaneDoe = this.identityService.allClaims();
    for (const role of claimJaneDoe.roles) {
      this.OurJaneDoeIs.push(role.split('.')[0]);
    }
    this.personID = claimJaneDoe.email ? claimJaneDoe.email.split('@')[0].toLowerCase() : 'UNDEFINED';
    this.displayPersonName = claimJaneDoe.name ? claimJaneDoe.name.split(',') : ['UNDEFINED', 'UNDEFINED'];
    this.displayPersonName = (this.displayPersonName[1] + ' ' + this.displayPersonName[0]).substring(1);

    // Control the manager button
    this.expenses.getManagerExpenses()
      .subscribe(val => {
        // @ts-ignore
        this.managerAmount = val ? val.length : 0;
      });
    this.declarationCall();
    this.today = new Date();
  }

  declarationCall() {
    this.expenses.getEmployeeExpenses(this.personID)
      .subscribe(
        response => {
          this.declarationData = [];
          const newResponse = response;
          for (var i = newResponse.length; i--;) {
            if (newResponse[i].status.text.toString().includes('rejected')) {
              this.declarationData.push(newResponse[i]);
              newResponse.splice(i, 1);
            }
          }
          this.declarationData = this.declarationData.concat(newResponse);
          this.hasNoExpenses = (response.length < 1);
          console.log('>> GET SUCCESS', response);
        }, error => {
          console.error('>> GET FAILED', error.message);
        });
  }

  clickExpense(item: any) {
    this.expenseData = item;
    this.wantsNewModal = true;
    this.forceViewer = this.isRejected(item) || this.isDraft(item) ? false : true;
  }

  receiveMessage(message) {
    this.wantsNewModal = false;
    if (message[0]) {
      this.declarationCall();
    }
  }

  isRejected(item) {
    return item.status.text.toString().includes('rejected');
  }
  isDraft(item) {
    return item.status.text.toString() === "draft";
  }
  setClassStatus(item) {
    if (item.status.text.toString().includes('rejected')) {
      return 'rejected';
    } else if (item.status.text.toString() === 'draft') {
      return 'draft';
    } else if (item.status.text.toString() === 'cancelled') {
      return 'cancelled';
    } else if (item.status.text.toString() === 'approved') {
      return 'approved';
    }else if (item.status.text.toString() === 'exported') {
      return 'exported';
    } else {
      return 'processing';
    }
  }
}
