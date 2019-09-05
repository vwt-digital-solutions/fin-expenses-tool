import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import {AppRoutingModule} from '../../app-routing.module';
import {CommonModule} from '@angular/common';
import {HttpClientModule} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {ControllerComponent} from './controller.component';
import {AgGridModule} from 'ag-grid-angular';

@NgModule({
  declarations: [
    ControllerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
    AgGridModule.withComponents([]),
    NgbModule
  ],
  exports: [
    CommonModule,
    ControllerComponent
  ],
  providers: [],
  bootstrap: [ControllerComponent]
})
export class ControllerModule { }
