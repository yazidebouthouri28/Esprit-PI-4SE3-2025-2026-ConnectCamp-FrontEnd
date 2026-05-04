import { Directive, Input } from '@angular/core';

/**
 * Minimal compatibility shim for `ng2-charts`'s `BaseChartDirective`.
 *
 * This keeps the app compiling on Angular 19 without pulling `ng2-charts`,
 * which currently requires Angular CDK >= 21.
 *
 * It does not render charts; it only satisfies template bindings.
 */
@Directive({
  selector: 'canvas[baseChart]',
  standalone: true,
})
export class BaseChartDirective {
  @Input() data: unknown;
  @Input() options: unknown;
  @Input() type: unknown;
  @Input() legend: unknown;
  @Input() plugins: unknown;
}

