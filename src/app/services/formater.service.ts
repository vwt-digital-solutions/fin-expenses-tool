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
    // return ((numb).toFixed(2)).toString().replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  }

  static decimalFormatter(amounts) {
    return FormaterService.formatNumber(amounts.value);
  }

  static getCorrectDate(date) {
    const d = new Date(date);
    return d.getDate() + '-' + (d.getMonth() + 1) + '-' + d.getFullYear() + ' ' + ('0' + d.getHours()).substr(-2) + ':' +
      ('0' + d.getMinutes()).substr(-2) + ':' + ('0' + d.getSeconds()).substr(-2);
  }

}
