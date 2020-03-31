import {Component, OnInit, ChangeDetectorRef} from '@angular/core';
import { LoaderService } from 'src/app/services/loader.service';

interface ClaimsEmail {
  email: any;
}

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss']
})
export class LoaderComponent {

  isLoading = false;

  constructor(public loaderService: LoaderService, private cdRef: ChangeDetectorRef) {
    this.loaderService.isLoading$.subscribe(loding => this.isLoading = loding);
   }
}
