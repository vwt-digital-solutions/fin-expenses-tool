import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FormaterService {

  constructor() {
  }

  static formatNumber(numb) {
    return (numb).toLocaleString('nl-NL',
      {minimumFractionDigits: 2, maximumFractionDigits: 2, style: 'currency', currency: 'EUR'})
      .replace(',', ';').replace(/\./g, ',').replace(';', '.');
  }

  static decimalFormatter(amounts) {
    try {
      return FormaterService.formatNumber(amounts.value);
    } catch (e) {
      return FormaterService.formatNumber(amounts);
    }
  }

  static getCorrectDateTime(date) {
    const d = new Date(date);
    return d.getDate() + '-' + (d.getMonth() + 1) + '-' + d.getFullYear() + ' ' + ('0' + d.getHours()).substr(-2) + ':' +
      ('0' + d.getMinutes()).substr(-2) + ':' + ('0' + d.getSeconds()).substr(-2);
  }

  static getCorrectDate(date) {
    const d = new Date(date);
    return d.getDate() + '-' + (d.getMonth() + 1) + '-' + d.getFullYear();
  }
}
