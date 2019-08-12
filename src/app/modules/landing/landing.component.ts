import {Component, OnInit} from '@angular/core';
import {OAuthService} from 'angular-oauth2-oidc';
import {HttpClient} from '@angular/common/http';
import {EnvService} from '../../services/env.service';

interface IClaimRoles {
  oid: any;
  roles: any;
}

@Component({
  selector: 'app-manager',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {

  private OurJaneDoeIs: string;
  private displayPersonName;
  private declarationData;

  constructor(
    private oauthService: OAuthService,
    private httpClient: HttpClient,
    private env: EnvService,
  ) {
  }

  ngOnInit() {
    const claimJaneDoe = this.oauthService.getIdentityClaims() as IClaimRoles;
    // @ts-ignore
    this.displayPersonName = claimJaneDoe.name.split(',');
    this.displayPersonName = (this.displayPersonName[1] + ' ' + this.displayPersonName [0]).substring(1);
    this.OurJaneDoeIs = claimJaneDoe.roles[0].split('.')[0];
    console.log(claimJaneDoe);
    this.declarationCall();
  }

  declarationCall() {
    // @ts-ignore
    this.httpClient.get(this.env.apiUrl + '/employees/' + 'm.vanderweide' + '/expenses')
      .subscribe(
        val => {
          console.log(val);
        });
  }

  handleLinking(event) {
    window.location.href = window.location.protocol + '//' + window.location.host + '/' + event.target.name;
  }
}
