import { Component, input, linkedSignal, output } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import type { NewTask } from '@contracts/NewTask';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';

/** Les points de validation sont saisis un par ligne. */
const EMPTY = { title: '', description: '', points: '' };

/**
 * Saisie d'une tâche : vide en mode ajout, pré-remplie avec `task` en mode modification.
 * N'appelle pas l'API : émet les valeurs saisies, le parent décide quoi en faire.
 */
@Component({
  selector: 'app-task-form',
  host: { class: 'block' },
  imports: [FormField, HlmButtonImports, HlmInputImports, HlmTextareaImports],
  templateUrl: './form.html',
  styleUrl: './form.scss',
})
export class TaskForm {
  readonly task = input<NewTask | null>(null);
  readonly submitted = output<NewTask>();
  readonly cancelled = output();

  private model = linkedSignal(() => {
    const t = this.task();
    return t ? { title: t.title, description: t.description, points: t.validation_points.join('\n') } : EMPTY;
  });
  protected form = form(this.model, (f) => required(f.title));

  protected save(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) return;
    const { title, description, points } = this.model();
    const validation_points = points
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);
    this.submitted.emit({ title: title.trim(), description, validation_points });
    this.form().reset(EMPTY);
  }
}
