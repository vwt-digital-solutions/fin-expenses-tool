import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'costTypeActiveFilter' })
export class CostTypeActiveFilterPipe implements PipeTransform {
  transform(costTypes: any, active: boolean): string {
    return active ? costTypes.filter((ctype: object) => ctype['active'] === active) : costTypes;
  }
}
