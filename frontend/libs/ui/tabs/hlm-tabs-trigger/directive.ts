import { Directive, input } from '@angular/core';
import { BrnTabsTrigger } from '@spartan-ng/brain/tabs';
import { classes } from '@spartan-ng/helm/utils';

@Directive({
	selector: '[hlmTabsTrigger]',
	exportAs: 'hlmTabsTrigger',
	hostDirectives: [{ directive: BrnTabsTrigger, inputs: ['brnTabsTrigger: hlmTabsTrigger', 'disabled'] }],
	host: {
		'data-slot': 'tabs-trigger',
	},
})
export class HlmTabsTrigger {
	public readonly triggerFor = input.required<string>({ alias: 'hlmTabsTrigger' });
	constructor() {
		classes(() => [
			// layout
			'relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 whitespace-nowrap',
			'rounded-md border border-transparent px-2 py-1',
			// text
			'text-sm font-medium text-muted-foreground hover:text-foreground transition-all',
			// vertical tabs
			'group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start',
			// active tab raised out of the inset bar
			'group-data-[variant=default]/tabs-list:data-active:shadow-raised-sm',
			'group-data-[variant=line]/tabs-list:data-active:shadow-none',
			// icons
			'[&_ng-icon]:pointer-events-none [&_ng-icon]:shrink-0',
			"[&_ng-icon:not([class*='text-'])]:text-[length:--spacing(4)]",
			// focus
			'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
			'focus-visible:outline-1 focus-visible:outline-ring',
			// disabled
			'disabled:pointer-events-none disabled:opacity-50',
			// line variant: no background
			'group-data-[variant=line]/tabs-list:bg-transparent',
			'group-data-[variant=line]/tabs-list:data-active:bg-transparent',
			'dark:group-data-[variant=line]/tabs-list:data-active:border-transparent',
			'dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent',
			// active tab: transparent, takes the surface of its panel (spec 013)
			'data-active:bg-transparent data-active:text-accent-foreground',
			// underline of the line variant
			'after:absolute after:bg-foreground after:opacity-0 after:transition-opacity',
			'group-data-[variant=line]/tabs-list:data-active:after:opacity-100',
			// underline below horizontal tabs
			'group-data-[orientation=horizontal]/tabs:after:inset-x-0',
			'group-data-[orientation=horizontal]/tabs:after:bottom-[-5px]',
			'group-data-[orientation=horizontal]/tabs:after:h-0.5',
			// underline beside vertical tabs
			'group-data-[orientation=vertical]/tabs:after:inset-y-0',
			'group-data-[orientation=vertical]/tabs:after:-right-1',
			'group-data-[orientation=vertical]/tabs:after:w-0.5',
		]);
	}
}
