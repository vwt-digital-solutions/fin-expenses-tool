import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import {EnvService} from './env.service';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import {Endpoint} from '../models/endpoint.enum';
import {debug} from 'util';

interface ExpensesIfc {
  clone: any;
  headers: any;
  status: any;
  statusText: any;
  body: any;
  type: any;
  ok: any;
  url: any;
}

@Injectable()
export class ExpensesConfigService {
  constructor(
    private http: HttpClient,
    private env: EnvService,
  ) {
  }

  static handleError(error: HttpErrorResponse) {
    const errors = {};
    if (error.error instanceof ErrorEvent) {
      Object.assign(errors, error.error);
      console.error('An error occurred:', error.error.message);
    } else {
      Object.assign(errors, error.error);
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error.detail}`);
    }
    return throwError(
      `${JSON.stringify(errors)}`);
  }

  public getExpenses(): Observable<HttpResponse<ExpensesIfc>> {
    return this.http.get<ExpensesIfc>(this.env.apiUrl + Endpoint.finance)
      .pipe(
        retry(2),
        catchError(ExpensesConfigService.handleError)
      );
  }

  public getDepartmentExpenses(departmentId): Observable<HttpResponse<ExpensesIfc>> {
    return this.http.get<ExpensesIfc>(this.env.apiUrl + Endpoint.department + '/' + departmentId + '/expenses')
      .pipe(
        retry(2),
        catchError(ExpensesConfigService.handleError)
      );
  }

  public getExpenseAttachment(expenseId): Observable<HttpResponse<ExpensesIfc>> {
    return this.http.get<any>(this.env.apiUrl + Endpoint.finance + '/' + expenseId + '/attachments')
      .pipe(
        retry(2),
        catchError(ExpensesConfigService.handleError)
      );
  }

  public getCostTypes(): Observable<HttpResponse<ExpensesIfc>> {
    return this.http.get<ExpensesIfc>(this.env.apiUrl + '/employees/cost-types')
      .pipe(
        // retry(2),
        catchError(ExpensesConfigService.handleError)
      );
  }

  public updateExpenseFinance(data, expenseId): Observable<HttpResponse<ExpensesIfc>>  {
    return this.http.put<ExpensesIfc>(this.env.apiUrl + Endpoint.finance + `/${expenseId}`, data)
      .pipe(
        catchError(ExpensesConfigService.handleError)
      );
  }

    public updateExpenseEmployee(data, expenseId): Observable<HttpResponse<ExpensesIfc>>  {
    return this.http.put<ExpensesIfc>(this.env.apiUrl + Endpoint.employee + `/${expenseId}`, data)
      .pipe(
        catchError(ExpensesConfigService.handleError)
      );
  }

    public updateExpenseManager(data, expenseId): Observable<HttpResponse<ExpensesIfc>>  {
    return this.http.put<ExpensesIfc>(this.env.apiUrl + Endpoint.manager + `/${expenseId}`, data)
      .pipe(
        catchError(ExpensesConfigService.handleError)
      );
  }
}
