import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EnvService } from './env.service';
import { Observable } from 'rxjs';
import { ExpensesConfigService } from './config.service';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CostTypesService {

  constructor(private http: HttpClient,
              private env: EnvService) { }

  getAllCostTypes(): Observable<any> {
    return this.http.get(this.env.apiUrl + '/employees/cost-types')
    .pipe(
      map(costTypes => {
        const costTypesObject = {};
        for (const type in costTypes) {
          if (type in costTypes) {
            costTypesObject[costTypes[type].cid] = costTypes[type];
          }
        }
        return costTypesObject;
      }),
      ExpensesConfigService.retry(2),
      catchError(ExpensesConfigService.handleError)
    );
}
}
