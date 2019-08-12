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

  public OurJaneDoeIs: string;
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
    return date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear() + ' ' + date.toLocaleTimeString('nl-NL');
  }

  statusClassing(status) {
    if (status.includes('rejected')) {
      return 'badge badge-pill badge-warning';
    } else if (status.includes('cancelled')) {
      return 'badge badge-pill badge-danger';
    } else if (status === 'approved') {
      return 'badge badge-pill badge-success';
    } else if (status === 'payed') {
      return 'badge badge-pill badge-success';
    } else {
      return 'badge badge-pill badge-info';
    }
  }

  statusFormatter(status) {
    if (status.includes('rejected')) {
      return 'Aanpassing vereist';
    } else if (status.includes('cancelled')) {
      return 'Geannuleerd';
    } else if (status === 'approved') {
      return 'Goedgekeurd';
    } else if (status === 'payed') {
      return 'Uitbetaald';
    } else {
      return 'In behandeling';
    }
  }

  ngOnInit() {
    const claimJaneDoe = this.oauthService.getIdentityClaims() as IClaimRoles;
    // @ts-ignore
    this.displayPersonName = claimJaneDoe.name.split(',');
    this.displayPersonName = (this.displayPersonName[1] + ' ' + this.displayPersonName [0]).substring(1);
    this.OurJaneDoeIs = claimJaneDoe.roles[0].split('.')[0];
    console.log(claimJaneDoe);
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
