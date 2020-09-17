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
  public OurJaneDoeIs: string[] = [];
  public claimJaneDoe: ClaimRoles;
  public personID: string;
  public displayPersonName = 'Onbekend';

  constructor(private oauthService: OAuthService) {
    this.claimJaneDoe = this.allClaims();

    for (const role of this.claimJaneDoe.roles) {
      this.OurJaneDoeIs.push(role.split('.')[0]);
    }

    if (this.claimJaneDoe.name) {
      const name = this.claimJaneDoe.name.split(',');
      this.displayPersonName = (`${name[1]} ${name[0]}`).substring(1);
    }
  }

  whoAmI(): string {
    const claimJaneDoe = this.allClaims();
    return claimJaneDoe.roles[0].split('.')[0];
  }

  allRoles() {
    const claims = this.oauthService.getIdentityClaims() as ClaimRoles;
    const roles = [];

    if (!claims.roles) {
      claims.roles = ['.'];
    }

    for (const role of claims.roles) {
      roles.push(role.split('.')[0]);
    }
    return roles;
  }

  allClaims(): ClaimRoles {
    const claims = this.oauthService.getIdentityClaims() as ClaimRoles;
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
