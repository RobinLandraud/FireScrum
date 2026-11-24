import { Component, computed, input, model, signal } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { HlmLabelImports } from '@spartan-ng/helm/label';

let nextId = 0;
/** Share of the pointer's offset from the nearest number that the dragged ball follows (0 = snaps, 1 = free). */
const MAGNET = 0.4;

/**
 * Picks one of a few numbers (e.g. a Fibonacci scale): embossed numbers in a groove, and a ball
 * that slides to the chosen one. Click, drag the ball, or use the arrow keys (native radios).
 * Plugs into `[formField]`; disabled by an enclosing `<fieldset disabled>`.
 */
@Component({
  selector: 'app-step-picker',
  host: { class: 'grid gap-2' },
  imports: [HlmLabelImports],
  templateUrl: './template.html',
  styleUrl: './template.scss',
})
export class AppStepPicker implements FormValueControl<number> {
  readonly value = model(0);
  readonly values = input.required<readonly number[]>();
  /** Visible label, also the accessible name of the group. */
  readonly label = input.required<string>();

  protected id = `step-picker-${nextId++}`;

  /** Position of the ball: index of the chosen value. */
  private step = computed(() => Math.max(0, this.values().indexOf(this.value())));
  /** While the ball is dragged: its fractional position, following the pointer; `null` otherwise. */
  protected dragStep = signal<number | null>(null);
  protected ballStep = computed(() => this.dragStep() ?? this.step());

  private pressed = false;

  protected dragStart(event: PointerEvent) {
    // `:disabled` also covers a disabled ancestor fieldset (the `disabled` property does not).
    this.pressed = !(event.currentTarget as HTMLElement).querySelector('input:disabled');
  }

  /**
   * The pointer is captured only once it moves: a plain click stays on its radio,
   * which then checks itself natively.
   */
  protected dragMove(event: PointerEvent) {
    if (!this.pressed) return;
    const track = event.currentTarget as HTMLElement;
    if (!track.hasPointerCapture(event.pointerId)) track.setPointerCapture(event.pointerId);
    const values = this.values();
    const rect = track.getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(track).paddingLeft);
    const column = (rect.width - 2 * pad) / values.length;
    const step = Math.min(values.length - 1, Math.max(0, (event.clientX - rect.left - pad) / column - 0.5));
    // Magnet: the ball only covers part of the way from the nearest number to the pointer.
    const nearest = Math.round(step);
    this.dragStep.set(nearest + (step - nearest) * MAGNET);
    this.value.set(values[nearest]);
  }

  /** Release: the ball snaps onto the nearest value. */
  protected dragEnd() {
    this.pressed = false;
    this.dragStep.set(null);
  }
}
