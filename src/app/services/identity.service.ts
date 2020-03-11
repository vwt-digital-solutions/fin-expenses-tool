import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';

export interface IClaimRoles {
  roles: string[];
  email?: string;
  name?: string;
  oid?: number;
}


@Injectable({
  providedIn: 'root'
})
export class IdentityService {

  constructor(private oauthService: OAuthService) { }

  whoAmI(): string {
    const claimJaneDoe = this.allClaims();
    return claimJaneDoe.roles[0].split('.')[0];
  }

  allRoles() {
    const claims = this.oauthService.getIdentityClaims() as IClaimRoles;
    const roles = [];

    if (!claims.roles) {
      claims.roles = ['.'];
    }

    for (const role of claims.roles) {
      roles.push(role.split('.')[0]);
    }
    return roles;
  }

  allClaims(): IClaimRoles {
    const claims = this.oauthService.getIdentityClaims() as IClaimRoles;
    // handle non-privileged employee => roles array is absent
    if (!claims.roles) {
      claims.roles = ['.'];
    }
    return claims;
  }

  isTesting(): boolean {
    return this.allClaims().email.split('@')[0] === 'opensource.e2e';
  }
}
