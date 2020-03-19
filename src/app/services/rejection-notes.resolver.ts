import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { RejectionNotesService } from './rejection-notes.service';
import { tap, map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class RejectionNotesResolver implements Resolve<Observable<any>> {

    private rejectionNotesCache: any = undefined;

    constructor(
        private rejectionNotesService: RejectionNotesService
    ) {
    }

    public resolve(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<any> {
        if (this.rejectionNotesCache) {
            return of(this.rejectionNotesCache);
        }
        return this.rejectionNotesService.getAllRejectionNotes().pipe(
          tap(rejectionNotes => this.rejectionNotesCache = rejectionNotes)
        );
    }
}
