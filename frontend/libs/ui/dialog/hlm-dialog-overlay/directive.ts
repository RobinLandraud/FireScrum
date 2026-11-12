import { computed, Directive, effect, input, untracked } from '@angular/core';
import { injectCustomClassSettable } from '@spartan-ng/brain/core';
import { BrnDialogOverlay } from '@spartan-ng/brain/dialog';
import { hlm } from '@spartan-ng/helm/utils';
import type { ClassValue } from 'clsx';

export const hlmDialogOverlayClass = hlm([
	// open / close animation
	'data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 duration-100',
	// dimmed, blurred backdrop
	'isolate bg-gray-900/50 supports-backdrop-filter:backdrop-blur-xs',
]);

@Directive({
	selector: '[hlmDialogOverlay],hlm-dialog-overlay',
	exportAs: 'hlmDialogOverlay',
	hostDirectives: [BrnDialogOverlay],
})
export class HlmDialogOverlay {
	private readonly _classSettable = injectCustomClassSettable({ optional: true, host: true });

	public readonly userClass = input<ClassValue>('', { alias: 'class' });
	protected readonly _computedClass = computed(() => hlm(hlmDialogOverlayClass, this.userClass()));

	constructor() {
		effect(() => {
			const newClass = this._computedClass();
			untracked(() => this._classSettable?.setClassToCustomElement(newClass));
		});
	}
}
