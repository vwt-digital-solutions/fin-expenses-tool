import { TestBed } from '@angular/core/testing';

import { FormaterService } from './formater.service';

describe('FormaterService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FormaterService = TestBed.get(FormaterService);
    expect(service).toBeTruthy();
  });
});
