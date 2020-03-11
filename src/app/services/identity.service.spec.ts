import { TestBed } from '@angular/core/testing';

import { IdentityService } from './identity.service';
import {OAuthLogger, OAuthService, UrlHelperService} from 'angular-oauth2-oidc';
import {HttpClient, HttpHandler} from '@angular/common/http';

describe('IdentityService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers : [OAuthService, HttpClient, HttpHandler, UrlHelperService, OAuthLogger]
  }));

  it('should be created', () => {
    const service: IdentityService = TestBed.inject(IdentityService);
    expect(service).toBeTruthy();
  });
});
