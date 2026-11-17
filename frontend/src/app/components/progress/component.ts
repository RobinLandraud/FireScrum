import { Component, computed, input } from '@angular/core';
import { HlmProgressImports } from '@spartan-ng/helm/progress';

/**
 * Progress bar (adapter of Spartan's Progress): pages only pass `value` and `max`.
 * Shows the rounded percentage; green at 100%.
 */
@Component({
  selector: 'app-progress',
  host: { class: 'flex items-center gap-2' },
  imports: [HlmProgressImports],
  templateUrl: './template.html',
  styleUrl: './template.scss',
})
export class AppProgress {
  readonly value = input.required<number>();
  readonly max = input.required<number>();
  /** Name announced to screen readers. */
  readonly label = input('Avancement');
  protected percent = computed(() => (this.max() > 0 ? Math.round((this.value() / this.max()) * 100) : 0));
}
