import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {HttpClientModule, HTTP_INTERCEPTORS} from '@angular/common/http';

import {TokenInterceptor} from './auth/token.interceptor';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {AuthGuard} from './auth/auth.guard';

import {HeaderComponent} from './components/header/header.component';
import {ExpensesModule} from './modules/expenses/expenses.module';
import {FinanceModule} from './modules/finance/finance.module';
import {ManagerModule} from './modules/manager/manager.module';
import {ControllerModule} from './modules/controller/controller.module';
import {LandingModule} from './modules/landing/landing.module';
import {EnvServiceProvider} from './services/env.service.provider';
import {OAuthModule, OAuthService} from 'angular-oauth2-oidc';
import {AuthComponent} from './auth/auth.component';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {ExpensesConfigService} from './services/config.service';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    AuthComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    OAuthModule.forRoot(),
    AppRoutingModule,
    ExpensesModule,
    FinanceModule,
    ManagerModule,
    ControllerModule,
    LandingModule,
    NgbDropdownModule,
  ],

  exports: [
    HeaderComponent
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
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
