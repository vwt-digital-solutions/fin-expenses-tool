import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpResponse} from '@angular/common/http';
import {EnvService} from './env.service';
import {Observable, throwError, interval, of} from 'rxjs';
import {catchError, retryWhen, flatMap, count} from 'rxjs/operators';
import {Endpoint} from '../models/endpoint.enum';
import {Expense} from '../models/expense';
import {Attachment} from '../models/attachment';

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

  static retry(maxRetry: number = 5, delayMs: number = 2000) {
    return (src: Observable<any>) => src.pipe(
      retryWhen(_ => {
        console.log(`Retyring ${count} of ${maxRetry}`);
        return interval(delayMs).pipe(
          // tslint:disable-next-line: no-shadowed-variable
          flatMap(count => count === maxRetry ? throwError('Max retries reached with no success') : of(count))
        );
      })
    );
  }

  public getExpenses(): Observable<HttpResponse<ExpensesIfc>> {
    return this.http.get<ExpensesIfc>(this.env.apiUrl + Endpoint.finance)
      .pipe(
        ExpensesConfigService.retry(2),
        catchError(ExpensesConfigService.handleError)
      );
  }

  public getManagerExpenses(): Observable<HttpResponse<ExpensesIfc>> {
    return this.http.get<ExpensesIfc>(this.env.apiUrl + Endpoint.manager)
      .pipe(
        ExpensesConfigService.retry(2),
        catchError(ExpensesConfigService.handleError)
      );
  }

  public getControllerExpenses(): Observable<HttpResponse<ExpensesIfc>> {
    return this.http.get<ExpensesIfc>(this.env.apiUrl + Endpoint.controller)
      .pipe(
        ExpensesConfigService.retry(2),
        catchError(ExpensesConfigService.handleError)
      );
  }

  public getExpenseAttachment(expenseId): Observable<HttpResponse<ExpensesIfc>> {
    return this.http.get<any>(this.env.apiUrl + Endpoint.employee + '/' + expenseId + '/attachments')
      .pipe(
        ExpensesConfigService.retry(2),
        catchError(ExpensesConfigService.handleError)
      );
  }

  public getFinanceAttachment(expenseId): Observable<HttpResponse<any[]>> {
    return this.http.get<any>(this.env.apiUrl + Endpoint.finance + '/' + expenseId + '/attachments')
      .pipe(
        ExpensesConfigService.retry(2),
        catchError(ExpensesConfigService.handleError)
      );
  }

  public getControllerAttachment(expenseId): Observable<HttpResponse<any[]>> {
    return this.http.get<any>(this.env.apiUrl + Endpoint.controller + '/' + expenseId + '/attachments')
      .pipe(
        ExpensesConfigService.retry(2),
        catchError(ExpensesConfigService.handleError)
      );
  }

  public getManagerAttachment(expenseId): Observable<HttpResponse<ExpensesIfc>> {
    return this.http.get<any>(this.env.apiUrl + Endpoint.manager + '/' + expenseId + '/attachments')
      .pipe(
        ExpensesConfigService.retry(2),
        catchError(ExpensesConfigService.handleError)
      );
  }

  public getCostTypes(): Observable<HttpResponse<ExpensesIfc>> {
    return this.http.get<ExpensesIfc>(this.env.apiUrl + '/employees/cost-types')
      .pipe(
        ExpensesConfigService.retry(2),
        catchError(ExpensesConfigService.handleError)
      );
  }

  public updateExpenseFinance(data, expenseId): Observable<HttpResponse<ExpensesIfc>> {
    return this.http.put<ExpensesIfc>(this.env.apiUrl + Endpoint.finance + `/${expenseId}`, data)
      .pipe(
        catchError(ExpensesConfigService.handleError)
      );
  }

  public updateExpenseEmployee(data, expenseId): Observable<HttpResponse<ExpensesIfc>> {
    return this.http.put<ExpensesIfc>(this.env.apiUrl + Endpoint.employee + `/${expenseId}`, data)
      .pipe(
        catchError(ExpensesConfigService.handleError)
      );
  }

  public updateExpenseManager(data, expenseId): Observable<HttpResponse<ExpensesIfc>> {
    return this.http.put<ExpensesIfc>(this.env.apiUrl + Endpoint.manager + `/${expenseId}`, data)
      .pipe(
        catchError(ExpensesConfigService.handleError)
      );
  }

  public getEmployeeExpenses(employeeId): Observable<Expense[]> {
    return this.http.get<Expense[]>(this.env.apiUrl + '/employees/' + employeeId + '/expenses')
      .pipe(
        catchError(ExpensesConfigService.handleError)
      );
  }

  public deleteAttachment(item: Attachment): Observable<any> {
    return this.http.delete(`${this.env.apiUrl}/employees/expenses/${item.expense_id}/attachments/${item.db_name}`)
      .pipe(
        catchError(ExpensesConfigService.handleError)
      );
  }

  public uploadSingleAttachment(expenseId, data: { name: string; content: any }): Observable<any> {
    return this.http.post(this.env.apiUrl + `/employees/expenses/${expenseId}/attachments`, data)
      .pipe(
        catchError(ExpensesConfigService.handleError)
      );
  }

  public getDocumentsList() {
    return this.http.get<any>(this.env.apiUrl + '/finances/documents')
      .pipe(
        catchError(ExpensesConfigService.handleError)
      );
  }

  public createBookingFile(options: any): Observable<HttpResponse<any> | ArrayBuffer> {
    return this.http.post(this.env.apiUrl + '/finances/documents', '', options)
      .pipe(
        catchError(ExpensesConfigService.handleError)
      );
  }

  public createBookingFileV2(options: any): Observable<HttpResponse<any> | ArrayBuffer> {
    return this.http.post(this.env.apiUrl + '/v2/finances/documents', '', options)
      .pipe(
        catchError(ExpensesConfigService.handleError)
      );
  }
}
