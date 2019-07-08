import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import {AppRoutingModule} from '../../app-routing.module';
import {CommonModule} from '@angular/common';
import { ExpensesComponent } from './expenses.component';

@NgModule({
  declarations: [
    ExpensesComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CommonModule,

  ],
  exports: [
    CommonModule,
    ExpensesComponent
  ],
  providers: [],
  bootstrap: [ExpensesComponent]
})
export class ExpensesModule { }
