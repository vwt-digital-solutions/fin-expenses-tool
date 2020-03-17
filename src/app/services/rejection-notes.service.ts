import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EnvService } from './env.service';
import { Observable } from 'rxjs';
import { ExpensesConfigService } from './config.service';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RejectionNotesService {

  constructor(private http: HttpClient,
              private env: EnvService) { }

  getAllRejectionNotes(): Observable<any> {
    return this.http.get(this.env.apiUrl + '/managers/rejection-notes')
    .pipe(
      ExpensesConfigService.retry(2),
      catchError(ExpensesConfigService.handleError)
    );
}
}
