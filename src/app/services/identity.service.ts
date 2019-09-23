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

  allClaims(): IClaimRoles {
    return this.oauthService.getIdentityClaims() as IClaimRoles;
  }
}
