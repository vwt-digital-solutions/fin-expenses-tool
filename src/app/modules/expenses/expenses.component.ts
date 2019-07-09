import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent {
  public title;
  constructor() {
    this.title = 'This is the Expenses Tool';
  }
  claimForm(form: NgForm) {
    console.log(form.value);
  }
}

