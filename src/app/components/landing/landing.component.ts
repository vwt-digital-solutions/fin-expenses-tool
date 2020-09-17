import {Component, OnInit} from '@angular/core';
import {ExpensesConfigService} from '../../services/config.service';
import {Expense} from '../../models/expense';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {IdentityService} from 'src/app/services/identity.service';
import { map } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-manager',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {

  public declarationData: Expense[] = [];
  public typeOptions: any;
  public expenseData: Expense;
  public today: Date;
  public hasNoExpenses = true;
  public managerAmount: number;

  public wantsNewModal;
  public forceViewer;

  constructor(
    public identityService: IdentityService,
    private modalService: NgbModal,
    private expenses: ExpensesConfigService,
    private route: ActivatedRoute
  ) {
    this.wantsNewModal = false;

    this.route.data.pipe(map(data => data.costTypes)).subscribe(costTypes => this.typeOptions = costTypes);
  }

  ngOnInit() {
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
    this.expenses.getEmployeeExpenses(this.identityService.personID)
      .subscribe(
        response => {
          console.log('>> GET SUCCESS', response);
          this.declarationData = [];
          const newResponse = response;
          for (let i = newResponse.length; i--;) {
            if ('cost_type' in newResponse[i]) {
              newResponse[i]['cost_type'] = newResponse[i]['cost_type'].split(':').pop();
            }
            if (newResponse[i].status.text.toString().includes('rejected')) {
              this.declarationData.push(newResponse[i]);
              newResponse.splice(i, 1);
            }
          }
          this.declarationData = this.declarationData.concat(newResponse);
          this.hasNoExpenses = (response.length < 1);
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
    return item.status.text.toString() === 'draft';
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
    } else if (item.status.text.toString() === 'exported') {
      return 'exported';
    } else {
      return 'processing';
    }
  }
}
