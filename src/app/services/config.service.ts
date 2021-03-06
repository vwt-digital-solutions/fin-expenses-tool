import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse} from '@angular/common/http';
import {EnvService} from './env.service';
import {Observable, throwError, interval, of, forkJoin} from 'rxjs';
import {catchError, retryWhen, flatMap, count} from 'rxjs/operators';
import {Endpoint} from '../models/endpoint.enum';
import {Expense} from '../models/expense';
import {Attachment} from '../models/attachment';

interface ExpensesIfc {
  clone: any;
  headers: HttpHeaders;
  status: number;
  statusText: string;
  body: any;
  type: number;
  ok: any;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExpensesConfigService {
  constructor(
    private http: HttpClient,
    private env: EnvService,
  ) {
  }

  static handleError(error: HttpErrorResponse) {
    const errorMessage = error.error['detail'] ? error.error['detail'].nl : error.error;
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', errorMessage);
    } else {
      console.error(
        `Backend returned code ${error.status}, body was: ${errorMessage}`);
    }
    return throwError(error);
  }

  static retry(maxRetry = 5, delayMs = 2000) {
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

  // BEGIN FINANCE

  public getExpenses(): Observable<HttpResponse<ExpensesIfc>> {
    return this.http.get<ExpensesIfc>(this.env.apiUrl + Endpoint.finance)
      .pipe(
        catchError(ExpensesConfigService.handleError)
      );
  }

  public getFinanceAttachment(expenseId): Observable<HttpResponse<any[]>> {
    return this.http.get<any>(this.env.apiUrl + Endpoint.finance + '/' + expenseId + '/attachments')
      .pipe(
        catchError(ExpensesConfigService.handleError)
      );
  }

  public updateExpenseFinance(data, expenseId): Observable<HttpResponse<ExpensesIfc>> {
    return this.http.put<ExpensesIfc>(this.env.apiUrl + Endpoint.finance + `/${expenseId}`, data)
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

  public createDataExport(options: any): Observable<any[]> {
    const response1 = this.http.get(
      this.env.apiUrl + '/finances/expenses?expenses_list=expenses_all', options);
    const response2 = this.http.get(
      this.env.apiUrl + '/finances/expenses/journals', options);
    return forkJoin([response1, response2]);
  }

  // END FINANCE
  // BEGIN MANAGER

  public getManagerExpenses(): Observable<HttpResponse<ExpensesIfc>> {
    return this.http.get<ExpensesIfc>(this.env.apiUrl + Endpoint.manager)
      .pipe(
        catchError(ExpensesConfigService.handleError)
      );
  }

  public getManagerAttachment(expenseId): Observable<HttpResponse<ExpensesIfc>> {
    return this.http.get<any>(this.env.apiUrl + Endpoint.manager + '/' + expenseId + '/attachments')
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

  // END MANAGER
  // BEGIN CONTROLLER

  public getControllerExpenses(): Observable<HttpResponse<ExpensesIfc>> {
    return this.http.get<ExpensesIfc>(this.env.apiUrl + Endpoint.controller)
      .pipe(
        catchError(ExpensesConfigService.handleError)
      );
  }

  public getControllerAttachment(expenseId): Observable<HttpResponse<any[]>> {
    return this.http.get<any>(this.env.apiUrl + Endpoint.controller + '/' + expenseId + '/attachments')
      .pipe(
        catchError(ExpensesConfigService.handleError)
      );
  }

  // END CONTROLLER
  // BEGIN EMPLOYEE

  public getExpenseAttachment(expenseId): Observable<HttpResponse<ExpensesIfc>> {
    return this.http.get<any>(this.env.apiUrl + Endpoint.employee + '/' + expenseId + '/attachments')
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
    return this.http.post(this.env.apiUrl + Endpoint.employee + `/${expenseId}/attachments`, data)
      .pipe(
        catchError(ExpensesConfigService.handleError)
      );
  }

  public createExpenses(form: any): Observable<any> {
    return this.http.post(this.env.apiUrl + Endpoint.employee, form)
      .pipe(
        catchError(ExpensesConfigService.handleError)
      );
  }

  // END EMPLOYEE
}
