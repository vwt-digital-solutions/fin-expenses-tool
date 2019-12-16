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
  public declarationData: Expense[];
  public expenseData: Expense;
  public today: Date;
  public hasNoExpenses: boolean;
  public managerAmount: number;

  public wantsNewModal;
  public forceViewer;

  constructor(
    private identityService: IdentityService,
    private modalService: NgbModal,
    private expenses: ExpensesConfigService,
  ) {
    this.wantsNewModal = false;
  }

  decimalFormatter(amount: any) {
    return FormatterService.decimalFormatter(amount);
  }

  dateFormatter(firstDate) {
    return FormatterService.getCorrectDate(firstDate);
  }

  statusClassing(status: string) {
    if (status.includes('rejected')) {
      return 'badge badge-pill badge-warning';
    } else if (status.includes('cancelled')) {
      return 'badge badge-pill badge-danger';
    } else if (status === 'approved') {
      return 'badge badge-pill badge-success';
    } else if (status === 'exported') {
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
    this.personID = claimJaneDoe.email ? claimJaneDoe.email.split('@')[0].toLowerCase() : 'UNDEFINED';
    this.displayPersonName = claimJaneDoe.name ? claimJaneDoe.name.split(',') : ['UNDEFINED', 'UNDEFINED'];
    this.displayPersonName = (this.displayPersonName[1] + ' ' + this.displayPersonName[0]).substring(1);

    // Control the manager button
    this.expenses.getManagerExpenses()
      .subscribe(val => {
        // @ts-ignore
        this.managerAmount = val.length;
      });
    this.declarationCall();
    this.today = new Date();
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

  clickExpense(item: any) {
    this.expenseData = item;
    this.wantsNewModal = true;
    this.forceViewer = !this.isRejected(item);
  }

  receiveMessage(message) {
    this.wantsNewModal = false;
    if (message) {
      this.declarationCall();
    }
  }

  isRejected(item) {
    return item.status.text.toString().includes('rejected');
  }
}
