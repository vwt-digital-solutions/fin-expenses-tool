import { TestBed, async, inject } from '@angular/core/testing';

import { AuthGuard } from './auth.guard';
import { OAuthService, UrlHelperService, OAuthLogger } from 'angular-oauth2-oidc';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

describe('AuthGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule
      ],
      providers: [
        HttpClient,
        OAuthService,
        UrlHelperService,
        OAuthLogger,
        AuthGuard,
        { provide: Router, useValue: '' }
      ]
    });
  });

  it('should be created', () => {
    const service: AuthGuard = TestBed.get(AuthGuard);
    expect(service).toBeTruthy();
  });

  it('should check the access_token', inject([OAuthService], (oauthService: OAuthService) => {
    sessionStorage.setItem('access_token', 'abcde');
    expect(oauthService.hasValidAccessToken()).toBeTruthy();
  }));
});
