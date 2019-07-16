import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import {AppRoutingModule} from '../../app-routing.module';
import {CommonModule} from '@angular/common';
import { FinanceComponent } from './finance.component';
import {HttpClientModule} from '@angular/common/http';
import {FormsModule} from '@angular/forms';

@NgModule({
  declarations: [
    FinanceComponent
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
    FinanceComponent
  ],
  providers: [],
  bootstrap: [FinanceComponent]
})
export class FinanceModule { }
