import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';

export interface ClaimRoles {
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

  whoAmI() {
    const whoAmI = {name: 'Onbekend', id: null};
    const claimJaneDoe = this.allClaims();

    whoAmI.id = claimJaneDoe.email ? claimJaneDoe.email.split('@')[0].toLowerCase() : 'UNDEFINED';
    if (claimJaneDoe.name) {
      const name = claimJaneDoe.name.split(',');
      whoAmI.name = (`${name[1]} ${name[0]}`).substring(1);
    }

    return whoAmI;
  }

  allRoles() {
    const claims = this.oauthService.getIdentityClaims() as ClaimRoles;
    const roles = [];

    if (claims && claims['roles']) {
      for (const role of claims['roles']) {
        roles.push(role.split('.')[0]);
      }
    }
    return roles;
  }

  allClaims(): ClaimRoles {
    const claims = this.oauthService.getIdentityClaims() as ClaimRoles;
    if (claims) {
      // handle non-privileged employee => roles array is absent
      if (!claims.roles) {
        claims.roles = ['.'];
      }
      return claims;
    } else {
      return null;
    }
  }

  isTesting(): boolean {
    return this.allClaims().email.split('@')[0] === 'opensource.e2e';
  }
}
