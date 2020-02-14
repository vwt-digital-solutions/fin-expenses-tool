import {Injectable} from '@angular/core';
import {formatDate} from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class FormatterService {

  constructor() {}

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
    if (isNaN(timestamp) === false) {
      return formatDate(new Date(timestamp), dateFormat, 'nl');
    } else {
      return 'N/A';
    }
  }

  static getCorrectDateTime(date) {
    return this.parseDate(date, 'dd-MM-yyyy HH:mm:ss');
  }

  static getCorrectDate(date) {
    return this.parseDate(date, 'dd-MM-yyyy');
  }

  getStatusClassing(status: string) {
    if (status.includes('rejected')) {
      return 'badge badge-pill badge-warning';
    } else if (status.includes('cancelled')) {
      return 'badge badge-pill badge-danger';
    } else if (status === 'draft') {
      return 'badge badge-pill badge-secondary';
    } else if (status === 'approved') {
      return 'badge badge-pill badge-success';
    } else if (status === 'exported') {
      return 'badge badge-pill badge-success';
    } else {
      return 'badge badge-pill badge-primary';
    }
  }

  getStatusFormatter(status: string) {
    if (status.includes('rejected')) {
      return 'Aanpassing vereist';
    } else if (status.includes('cancelled')) {
      return 'Geannuleerd';
    } else if (status === 'draft') {
      return 'Concept';
    } else if (status === 'approved') {
      return 'Goedgekeurd';
    } else if (status === 'exported') {
      return 'Afgerond';
    } else {
      return 'In behandeling';
    }
  }
}
