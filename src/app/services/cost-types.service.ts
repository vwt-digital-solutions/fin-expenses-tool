import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CostType } from '../models/cost-type';
import { EnvService } from './env.service';
import { Observable } from 'rxjs';
import { ExpensesConfigService } from './config.service';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CostTypesService {

  constructor(private http: HttpClient,
              private env: EnvService) { }

  getAllCostTypes(): Observable<CostType[]> {
    return this.http.get<CostType[]>(this.env.apiUrl + '/employees/cost-types')
    .pipe(
      ExpensesConfigService.retry(2),
      catchError(ExpensesConfigService.handleError)
    );
}
}
