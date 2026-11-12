import { Directive } from '@angular/core';
import { BrnFieldControlDescribedBy } from '@spartan-ng/brain/field';
import { BrnInput } from '@spartan-ng/brain/input';
import { classes } from '@spartan-ng/helm/utils';

@Directive({
	selector: '[hlmInput]',
	exportAs: 'hlmInput',
	hostDirectives: [{ directive: BrnInput, inputs: ['id', 'forceInvalid'] }, BrnFieldControlDescribedBy],
	host: { 'data-slot': 'input' },
})
export class HlmInput {
	constructor() {
		classes(
			() =>
				[
					// size and frame
					'h-11 w-full min-w-0 rounded-lg border border-input bg-transparent px-4 py-1 shadow-xs outline-none',
					'transition-[color,box-shadow] dark:bg-input/30',
					// text
					'text-base md:text-sm placeholder:text-muted-foreground',
					// file input
					'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
					'file:text-foreground',
					// focus
					'focus-visible:border-ring focus-visible:ring-primary/10 focus-visible:ring-3',
					// invalid
					'data-[matches-spartan-invalid=true]:border-destructive data-[matches-spartan-invalid=true]:ring-3',
					'data-[matches-spartan-invalid=true]:ring-destructive/20',
					'dark:data-[matches-spartan-invalid=true]:border-destructive/50',
					'dark:data-[matches-spartan-invalid=true]:ring-destructive/40',
					// disabled
					'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
				],
		);
	}
}
