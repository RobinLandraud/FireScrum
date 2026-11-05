import { Component, computed, input } from '@angular/core';
import { HlmProgressImports } from '@spartan-ng/helm/progress';

/**
 * Barre de progression (adapter du Progress de Spartan) : les pages ne passent que `value` et `max`.
 * Affiche le pourcentage arrondi ; verte à 100 %.
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
  /** Nom annoncé aux lecteurs d'écran. */
  readonly label = input('Avancement');
  protected percent = computed(() => (this.max() > 0 ? Math.round((this.value() / this.max()) * 100) : 0));
}
