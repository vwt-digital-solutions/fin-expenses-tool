import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, RouterStateSnapshot, CanActivate, Router} from '@angular/router';

import {OAuthService} from 'angular-oauth2-oidc';

interface ClaimRoles {
  roles: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private oauthService: OAuthService,
    private router: Router
  ) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // console.log('Invoke auth guard');
    this.oauthService.tryLogin()
      .catch(err => {
        console.error(err);
      })
      .then(() => {
        // console.log('Check for valid access token');
        if (!this.oauthService.hasValidAccessToken()) {
          // console.log('No valid access token present, start implicit flow');
          this.oauthService.initImplicitFlow();
          // console.log('Implicit flow initialized');
        }
      });

    // console.log('Checking necessary roles');
    const claims = this.oauthService.getIdentityClaims() as ClaimRoles;
    if (route.data.roles && claims.roles) {
      let isAuthorisedRoute = false;
      for (const role of claims.roles) {
        if (route.data.roles.indexOf(role) > -1) {
          isAuthorisedRoute = true;
          // console.log('Requested role present');
          return true;
        }
      }

      if (!isAuthorisedRoute) {
        console.log('Requested role not granted');
        this.router.navigate(['/home']);
        return false;
      }
    }
    console.log('No role requested');
    return true;
  }
}
