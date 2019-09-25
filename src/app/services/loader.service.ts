import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  isLoading$ = new BehaviorSubject<boolean>(false);
  pendingLoadCount = 0;

  show() {
    if (++this.pendingLoadCount === 1) {
      this.isLoading$.next(true);
    }
  }

  hide() {
    if (--this.pendingLoadCount === 0) {
      this.isLoading$.next(false);
    }
  }
}
