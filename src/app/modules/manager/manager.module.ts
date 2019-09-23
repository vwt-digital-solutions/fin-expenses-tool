import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from '../../app-routing.module';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AgGridModule } from 'ag-grid-angular';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ManagerComponent } from './manager.component';

@NgModule({
  declarations: [
    ManagerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
    AgGridModule.withComponents([]),
    NgbModule,
  ],
  exports: [
    CommonModule,
    ManagerComponent,
  ],
  providers: [],
  bootstrap: [ManagerComponent]
})
export class ManagerModule { }
