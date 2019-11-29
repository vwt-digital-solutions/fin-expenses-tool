import { TestBed } from '@angular/core/testing';

import {OAuthLogger, OAuthService, UrlHelperService} from 'angular-oauth2-oidc';
import {HttpClient, HttpHandler} from '@angular/common/http';
import {CostTypesService} from './cost-types.service';

describe('CostTypesService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers : [OAuthService, HttpClient, HttpHandler, UrlHelperService, OAuthLogger]
  }));

  it('should be created', () => {
    const service: CostTypesService = TestBed.get(CostTypesService);
    expect(service).toBeTruthy();
  });
});
