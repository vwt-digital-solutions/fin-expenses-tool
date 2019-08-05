import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {EnvService} from './env.service';
import { throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import {Endpoint} from '../models/endpoint.enum';

@Injectable()
export class ExpensesConfigService {
  public errorsReceived;
  constructor(
    private http: HttpClient,
    private env: EnvService,
  ) {
    this.errorsReceived = [];
  }

  handleError(error: HttpErrorResponse) {
    const errors = {};
    if (error.error instanceof ErrorEvent) {
      Object.assign(errors, error.error);
      this.errorsReceived = errors;
      console.error('An error occurred:', error.error.message);
    } else {
      Object.assign(errors, error.error);
      this.errorsReceived = errors;
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error.detail}`);
    }
    return throwError(
      `${JSON.stringify(errors)}`);
  }

  public getExpenses() {
    return this.http.get<any[]>(this.env.apiUrl + Endpoint.finance)
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  public getCostTypes() {
    return this.http.get<any []>(this.env.apiUrl + '/employees/cost-types')
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  public updateExpense(data, expenseId) {
    return this.http.post<any []>(this.env.apiUrl + Endpoint.finance + `/${expenseId}`, data)
      .pipe(
        catchError(this.handleError)
      );
  }
}
