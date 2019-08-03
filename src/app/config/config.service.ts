import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {EnvService} from '../services/env.service';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

@Injectable()
export class ExpensesConfigService {
  constructor(
    private http: HttpClient,
    private env: EnvService,
  ) { }

  static handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    return throwError(
      'Something bad happened; please try again later.');
  }

  public getExpenses() {
    return this.http.get<any[]>(this.env.apiUrl + '/finances/expenses')
    .pipe(
      retry(2),
      catchError(ExpensesConfigService.handleError)
    );
  }
}
