import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'expenseStatus' })
export class ExpenseStatusPipe implements PipeTransform {
  transform(status: string, type: string): any {
    if (type === 'class') {
      return getStatusClassing(status);
    } else if (type === 'text') {
      return getStatusFormatter(status);
    } else {
      return status;
    }
  }
}

function getStatusClassing(status: string) {
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

function getStatusFormatter(status: string) {
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
