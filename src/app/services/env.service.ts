import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EnvService {
  // The values that are defined here are the default values that can
  // be overridden by env.js

  // Azure AD
  public loginUrl = '';
  public logoutUrl = '';
  public clientId = '';
  public scope = '';
  public issuer = '';

  // API url
  public apiUrl = '';

  // Ag Grid
  public agGridKey = '';

  constructor() {
  }

}
