import { Directive } from '@angular/core';
import { BrnFieldControlDescribedBy } from '@spartan-ng/brain/field';
import { BrnTextarea } from '@spartan-ng/brain/textarea';
import { classes } from '@spartan-ng/helm/utils';

@Directive({
	selector: '[hlmTextarea]',
	exportAs: 'hlmTextarea',
	hostDirectives: [{ directive: BrnTextarea, inputs: ['id', 'forceInvalid'] }, BrnFieldControlDescribedBy],
	host: { 'data-slot': 'textarea' },
})
export class HlmTextarea {
	constructor() {
		classes(
			() =>
				[
					// size and frame: grows with its content
					'flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-4 py-2.5',
					'shadow-xs outline-none transition-[color,box-shadow] dark:bg-input/30',
					// text
					'text-base md:text-sm placeholder:text-muted-foreground',
					// focus
					'focus-visible:border-ring focus-visible:ring-primary/10 focus-visible:ring-3',
					// invalid
					'data-[matches-spartan-invalid=true]:border-destructive data-[matches-spartan-invalid=true]:ring-3',
					'data-[matches-spartan-invalid=true]:ring-destructive/20',
					'dark:data-[matches-spartan-invalid=true]:border-destructive/50',
					'dark:data-[matches-spartan-invalid=true]:ring-destructive/40',
					// disabled
					'disabled:cursor-not-allowed disabled:opacity-50',
				],
		);
	}
}
