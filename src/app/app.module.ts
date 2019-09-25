import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { TokenInterceptor } from './auth/token.interceptor';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthGuard } from './auth/auth.guard';

import { HeaderComponent } from './components/header/header.component';
import { EnvServiceProvider } from './services/env.service.provider';
import { OAuthModule, OAuthService } from 'angular-oauth2-oidc';
import { AuthComponent } from './auth/auth.component';
import { ExpensesConfigService } from './services/config.service';
import { LoaderService } from './services/loader.service';
import { LoaderInterceptor } from './services/loader.interceptor';
import { LoaderComponent } from './components/loader/loader.component';
import { LandingComponent } from './components/landing/landing.component';
import { FinanceComponent } from './components/finance/finance.component';
import { ControllerComponent } from './components/controller/controller.component';
import { ManagerComponent } from './components/manager/manager.component';
import { ExpensesComponent } from './components/expenses/expenses.component';
import { CommonModule } from '@angular/common';
import { AgGridModule } from 'ag-grid-angular';


@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    AuthComponent,
    LoaderComponent,
    LandingComponent,
    FinanceComponent,
    ControllerComponent,
    ManagerComponent,
    ExpensesComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    CommonModule,
    HttpClientModule,
    OAuthModule.forRoot(),
    AppRoutingModule,
    AgGridModule.withComponents([]),
    NgbDropdownModule,
    NgbModule
  ],

  exports: [
    HeaderComponent,
    LandingComponent
  ],
  providers: [
    EnvServiceProvider,
    ExpensesConfigService,
    AuthGuard,
    OAuthService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    },
    LoaderService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoaderInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
