import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { CostTypesService } from './cost-types.service';
import { tap } from 'rxjs/operators';
import { CostType } from '../models/cost-type';

@Injectable({
    providedIn: 'root'
})
export class CostTypesResolver implements Resolve<Observable<CostType[]>> {

    private costTypesCache: CostType[] = undefined;

    constructor(
        private costTypesService: CostTypesService
    ) {
    }

    public resolve(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<CostType[]> {
        if (this.costTypesCache) {
            return of(this.costTypesCache);
        }
        return this.costTypesService.getAllCostTypes().pipe(tap(costTypes => this.costTypesCache = [...costTypes]));
    }
}
