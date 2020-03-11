import { TestBed } from '@angular/core/testing';

import {OAuthLogger, OAuthService, UrlHelperService} from 'angular-oauth2-oidc';
import {HttpClient, HttpHandler} from '@angular/common/http';
import {DefaultImageService} from './default-image.service';

describe('DefaultImageService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers : [OAuthService, HttpClient, HttpHandler, UrlHelperService, OAuthLogger]
  }));

  it('should be created', () => {
    const service: DefaultImageService = TestBed.inject(DefaultImageService);
    expect(service).toBeTruthy();
  });
});
