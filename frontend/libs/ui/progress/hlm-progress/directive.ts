import { Directive } from '@angular/core';
import { BrnProgress } from '@spartan-ng/brain/progress';
import { classes } from '@spartan-ng/helm/utils';

@Directive({
	selector: 'hlm-progress,[hlmProgress]',
	exportAs: 'hlmProgress',
	hostDirectives: [{ directive: BrnProgress, inputs: ['value', 'max', 'getValueLabel'] }],
	host: { 'data-slot': 'progress' },
})
export class HlmProgress {
	constructor() {
		// inset rail (neumorphic, spec 012)
		classes(() => 'bg-muted shadow-inset-sm h-2 rounded-full relative inline-flex w-full overflow-hidden');
	}
}
