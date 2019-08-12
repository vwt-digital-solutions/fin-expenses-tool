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
  public displayPersonName;
  public personID;
  public declarationData;

  constructor(
    private oauthService: OAuthService,
    private httpClient: HttpClient,
    private env: EnvService,
  ) {
  }

  static formatNumber(numb) {
    return ((numb).toFixed(2)).toString().replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  }

  decimalFormatter(amount) {
    return '€ ' + LandingComponent.formatNumber(amount);
  }

  dateFormatter(firstDate) {
    const date = new Date(firstDate);
    return date.getDate() + '-' + date.getMonth() + '-' + date.getFullYear() + ' ' + date.toLocaleTimeString('nl-NL');
  }

  statusFormatter(status) {
    if (status === 'to_be_approved') {
      return ['In behandeling', 0];
    } else if (status.includes('rejected')) {
      return ['Afgekeurd', 1];
    } else if (status === 'payable') {
      return ['Goedgekeurd', 2];
    } else if (status === 'exported') {
      return ['Betaald', 2];
    }
  }

  ngOnInit() {
    const claimJaneDoe = this.oauthService.getIdentityClaims() as IClaimRoles;
    // @ts-ignore
    this.displayPersonName = claimJaneDoe.name.split(',');
    this.displayPersonName = (this.displayPersonName[1] + ' ' + this.displayPersonName [0]).substring(1);
    this.OurJaneDoeIs = claimJaneDoe.roles[0].split('.')[0];
    // @ts-ignore
    this.personID = claimJaneDoe.email.split('@')[0];
    this.declarationCall();
  }

  declarationCall() {
    // @ts-ignore
    this.httpClient.get(this.env.apiUrl + '/employees/' + this.personID + '/expenses')
      .subscribe(
        val => {
          this.declarationData = val;
          console.log('>> GET SUCCESS', val);
        }, response => {
          console.error('>> GET FAILED', response.message);
        });
  }

  handleLinking(event) {
    window.location.href = window.location.protocol + '//' + window.location.host + '/' + event.target.name;
  }
}
