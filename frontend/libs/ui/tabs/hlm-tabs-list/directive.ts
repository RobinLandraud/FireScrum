import { Directive, input } from '@angular/core';
import { BrnTabsList } from '@spartan-ng/brain/tabs';
import { classes } from '@spartan-ng/helm/utils';
import { type VariantProps, cva } from 'class-variance-authority';

export const listVariants = cva(
	[
		// frame
		'group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-1',
		'text-muted-foreground data-[variant=line]:rounded-none',
		// horizontal / vertical tabs
		'group-data-horizontal/tabs:h-10 group-data-[orientation=vertical]/tabs:h-fit',
		'group-data-[orientation=vertical]/tabs:flex-col',
	],
	{
		variants: {
			variant: {
				// inset bar (neumorphic, spec 012)
				default: 'bg-muted shadow-inset',
				line: 'gap-1 bg-transparent',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
);
type ListVariants = VariantProps<typeof listVariants>;

@Directive({
	selector: '[hlmTabsList],hlm-tabs-list',
	exportAs: 'hlmTabsList',
	hostDirectives: [BrnTabsList],
	host: {
		'data-slot': 'tabs-list',
		'[attr.data-variant]': 'variant()',
	},
})
export class HlmTabsList {
	public readonly variant = input<ListVariants['variant']>('default');

	constructor() {
		classes(() => listVariants({ variant: this.variant() }));
	}
}
