import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'costType' })
export class CostTypePipe implements PipeTransform {
  transform(costType: string, costTypes: object): string {
    if (costType in costTypes) {
      return costTypes[costType].ctype;
    }
    return 'Onbekend';
  }
}
