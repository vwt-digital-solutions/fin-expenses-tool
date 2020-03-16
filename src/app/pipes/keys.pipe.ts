import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'keys'})
export class KeysPipe implements PipeTransform {
  transform(value: any) {
    const keys: any = [];
    for (const key in value) {
      if (key in value) {
        keys.push(value[key]);
      }
    }
    return keys;
  }
}
