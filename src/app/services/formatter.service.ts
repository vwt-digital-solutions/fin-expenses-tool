import {Injectable} from '@angular/core';
import {formatDate} from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class FormatterService {

  constructor() {
  }

  static formatNumber(numb) {
    return (numb).toLocaleString('nl-NL',
      {minimumFractionDigits: 2, maximumFractionDigits: 2, style: 'currency', currency: 'EUR'})
      .replace(',', ';').replace(/\./g, ',').replace(';', '.');
  }

  static decimalFormatter(amounts) {
    try {
      return FormatterService.formatNumber(amounts.value);
    } catch (e) {
      return FormatterService.formatNumber(amounts);
    }
  }

  static parseDate(date, dateFormat = 'dd-MM-yyyy') {
    const timestamp = Date.parse(date);
    if (isNaN(timestamp) == false) {
      return formatDate(new Date(timestamp), dateFormat, 'nl');
    } else {
      return 'N/A';
    };
  }

  static getCorrectDateTime(date) {
    return this.parseDate(date, 'dd-MM-yyyy HH:mm:ss');
  }

  static getCorrectDate(date) {
    return this.parseDate(date, 'dd-MM-yyyy');
  }
}
