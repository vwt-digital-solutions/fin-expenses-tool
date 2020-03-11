import { TestBed } from '@angular/core/testing';

import {OAuthLogger, OAuthService, UrlHelperService} from 'angular-oauth2-oidc';
import {HttpClient, HttpHandler} from '@angular/common/http';
import {EnvService} from './env.service';

describe('EnvService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers : [OAuthService, HttpClient, HttpHandler, UrlHelperService, OAuthLogger]
  }));

  it('should be created', () => {
    const service: EnvService = TestBed.inject(EnvService);
    expect(service).toBeTruthy();
  });
});
