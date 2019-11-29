import { TestBed } from '@angular/core/testing';

import {OAuthLogger, OAuthService, UrlHelperService} from 'angular-oauth2-oidc';
import {HttpClient, HttpHandler} from '@angular/common/http';
import {ExpensesConfigService} from './config.service';

describe('ExpensesConfigService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers : [OAuthService, HttpClient, HttpHandler, UrlHelperService, OAuthLogger]
  }));

  it('should be created', () => {
    const service: ExpensesConfigService = TestBed.get(ExpensesConfigService);
    expect(service).toBeTruthy();
  });
});
