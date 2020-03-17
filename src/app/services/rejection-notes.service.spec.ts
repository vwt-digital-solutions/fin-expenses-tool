import { TestBed } from '@angular/core/testing';

import {OAuthLogger, OAuthService, UrlHelperService} from 'angular-oauth2-oidc';
import {HttpClient, HttpHandler} from '@angular/common/http';
import {RejectionNotesService} from './rejection-notes.service';

describe('RejectionNotesService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers : [OAuthService, HttpClient, HttpHandler, UrlHelperService, OAuthLogger]
  }));

  it('should be created', () => {
    const service: RejectionNotesService = TestBed.inject(RejectionNotesService);
    expect(service).toBeTruthy();
  });
});
