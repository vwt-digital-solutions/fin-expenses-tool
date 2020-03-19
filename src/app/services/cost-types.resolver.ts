import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { CostTypesService } from './cost-types.service';
import { tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class CostTypesResolver implements Resolve<Observable<any>> {

    private costTypesCache: any = undefined;

    constructor(
        private costTypesService: CostTypesService
    ) {
    }

    public resolve(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<any> {
        if (this.costTypesCache) {
            return of(this.costTypesCache);
        }
        return this.costTypesService.getAllCostTypes().pipe(tap(costTypes => this.costTypesCache = costTypes));
    }
}
