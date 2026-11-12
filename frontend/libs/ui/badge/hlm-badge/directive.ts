import { Directive, input } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';
import { type VariantProps, cva } from 'class-variance-authority';

const badgeVariants = cva(
	[
		// layout
		'group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden',
		'whitespace-nowrap h-6 px-2.5 py-0.5 has-data-[icon=inline-end]:pe-1.5',
		'has-data-[icon=inline-start]:ps-1.5',
		// shape and text
		'rounded-4xl border border-transparent text-xs font-medium transition-all',
		// icons
		'[&>ng-icon]:pointer-events-none [&>ng-icon]:text-[length:--spacing(3)]',
		// focus
		'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
		// invalid
		'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
		'dark:aria-invalid:ring-destructive/40',
	],
	{
		variants: {
			variant: {
				default: 'bg-accent text-accent-foreground [a]:hover:bg-accent/80',
				secondary: 'bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80',
				destructive: [
					// colors
					'bg-destructive/10 text-destructive dark:bg-destructive/20 [a]:hover:bg-destructive/20',
					// focus
					'focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
				],
				outline: 'border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground',
				ghost: 'hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50',
				link: 'text-primary underline-offset-4 hover:underline',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;

@Directive({
	selector: '[hlmBadge],hlm-badge',
	exportAs: 'hlmBadge',
	host: {
		'data-slot': 'badge',
		'[attr.data-variant]': 'variant()',
	},
})
export class HlmBadge {
	public readonly variant = input<BadgeVariants['variant']>('default');

	constructor() {
		classes(() => badgeVariants({ variant: this.variant() }));
	}
}
