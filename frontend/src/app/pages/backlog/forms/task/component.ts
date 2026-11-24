import { Component, input, linkedSignal, output } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import type { NewTask } from '@contracts/NewTask';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';

/** Validation points are entered one per line. */
const EMPTY = { title: '', description: '', points: '' };

/**
 * Task input: empty in add mode, prefilled with `task` in edit mode.
 * Does not call the API: emits the entered values, the parent decides what to do with them.
 */
@Component({
  selector: 'app-task-form',
  host: { class: 'block' },
  imports: [FormField, HlmButtonImports, HlmInputImports, HlmTextareaImports],
  templateUrl: './template.html',
  styleUrl: './template.scss',
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
