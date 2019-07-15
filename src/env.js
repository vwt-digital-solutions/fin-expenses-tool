(function (window) {
  window.__env = window.__env || {};

  // Azure AD
  window.__env.loginUrl = 'https://login.microsoftonline.com/be36ab0a-ee39-47de-9356-a8a501a9c832/oauth2/v2.0/authorize';
  window.__env.logoutUrl = 'https://login.microsoftonline.com/be36ab0a-ee39-47de-9356-a8a501a9c832/oauth2/v2.0/logout';
  window.__env.clientId = '10dac03f-996d-429a-9915-d0633151b79c';
  window.__env.scope = 'https://vwt-d-gew1-fin-expenses/employee openid profile email';
  window.__env.issuer = 'https://login.microsoftonline.com/be36ab0a-ee39-47de-9356-a8a501a9c832/v2.0';

  // API url
  window.__env.apiUrl = 'http://localhost:4200';
}(this));
