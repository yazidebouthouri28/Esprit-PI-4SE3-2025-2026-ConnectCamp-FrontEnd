// sum-by.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'sumBy', standalone: true })
export class SumByPipe implements PipeTransform {
  transform(items: any[], field: string): number {
    if (!Array.isArray(items)) return 0;
    return items.reduce((acc, item) => acc + (Number(item[field]) || 0), 0);
  }
}
