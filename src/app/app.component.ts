import { Component } from '@angular/core';
import { OAuthService, AuthConfig } from 'angular-oauth2-oidc';
import { EnvService } from './services/env.service';
import { LicenseManager } from 'ag-grid-enterprise';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {

  public isMobile;

  constructor(
    private env: EnvService,
    private oauthService: OAuthService
  ) {
    const config = new AuthConfig();
    config.loginUrl = env.loginUrl;
    config.redirectUri = window.location.origin + '/home';
    config.logoutUrl = env.logoutUrl;
    config.clientId = env.clientId;
    config.scope = env.scope;
    config.issuer = env.issuer;
    config.silentRefreshRedirectUri = window.location.origin + '/silent-refresh.html';
    this.oauthService.configure(config);
    this.oauthService.setupAutomaticSilentRefresh();
    this.oauthService.tryLogin({});
    LicenseManager.setLicenseKey(this.env.agGridKey);
  }

  get hasValidAccessToken() {
    return this.oauthService.hasValidAccessToken();
  }

  onInit() {
    this.isMobile = (navigator.userAgent.match(/Android/i)
      || navigator.userAgent.match(/webOS/i)
      || navigator.userAgent.match(/iPhone/i)
      || navigator.userAgent.match(/iPad/i)
      || navigator.userAgent.match(/iPod/i)
      || navigator.userAgent.match(/BlackBerry/i)
      || navigator.userAgent.match(/Windows Phone/i));
  }

  regOff() {
    if (this.isMobile) {
      document.getElementById('mobile-loader-button').style.visibility = 'hidden';
      document.getElementById('mobile-loader').style.visibility = 'hidden';
    } else {
      return;
    }
  }

}
