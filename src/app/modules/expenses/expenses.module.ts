import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import {AppRoutingModule} from '../../app-routing.module';
import {CommonModule} from '@angular/common';
import { ExpensesComponent } from './expenses.component';
import {HttpClientModule} from '@angular/common/http';

@NgModule({
  declarations: [
    ExpensesComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    HttpClientModule,

  ],
  exports: [
    CommonModule,
    ExpensesComponent
  ],
  providers: [],
  bootstrap: [ExpensesComponent]
})
export class ExpensesModule { }
