import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from '../../app-routing.module';
import { CommonModule } from '@angular/common';
import { ExpensesComponent } from './expenses.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    ExpensesComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    HttpClientModule,
    FormsModule
  ],
  exports: [
    CommonModule,
    ExpensesComponent
  ],
  providers: [],
  bootstrap: [ExpensesComponent]
})
export class ExpensesModule {
}
