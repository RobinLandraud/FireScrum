import { Directive, input, signal } from '@angular/core';
import { BrnButton } from '@spartan-ng/brain/button';
import { classes } from '@spartan-ng/helm/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ClassValue } from 'clsx';
import { injectBrnButtonConfig } from './token';

export const buttonVariants = cva(
	[
		// layout
		'group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap',
		// shape and text
		'rounded-lg border border-transparent bg-clip-padding text-sm font-medium transition-all outline-none',
		'select-none',
		// icons
		'[&_ng-icon]:pointer-events-none [&_ng-icon]:shrink-0',
		"[&_ng-icon:not([class*='text-'])]:text-[length:--spacing(4)]",
		// focus
		'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3',
		// pressed and disabled
		'active:not-aria-[haspopup]:translate-y-px data-disabled:pointer-events-none data-disabled:opacity-50',
		// invalid
		'data-[matches-spartan-invalid=true]:border-destructive data-[matches-spartan-invalid=true]:ring-3',
		'data-[matches-spartan-invalid=true]:ring-destructive/20',
		'dark:data-[matches-spartan-invalid=true]:border-destructive/50',
		'dark:data-[matches-spartan-invalid=true]:ring-destructive/40',
	],
	{
		variants: {
			variant: {
				// Neumorphic (spec 012): solid buttons are raised and press in; surface buttons sink on click.
				default: 'bg-primary text-primary-foreground shadow-raised-sm hover:bg-primary/90 active:shadow-pressed',
				outline: [
					// colors: surface colour, raised, no border
					'bg-background text-foreground shadow-raised-sm hover:shadow-raised',
					// pressed and open menu
					'active:shadow-inset aria-expanded:shadow-inset',
				],
				secondary: [
					// colors
					'bg-secondary text-secondary-foreground shadow-raised-sm hover:shadow-raised',
					// pressed and open menu
					'active:shadow-inset aria-expanded:shadow-inset',
				],
				ghost: [
					// colors: flat, raised on hover only
					'hover:text-foreground hover:shadow-raised-sm',
					// pressed and open menu
					'active:shadow-inset aria-expanded:shadow-raised-sm aria-expanded:text-foreground',
				],
				destructive: [
					// colors
					'bg-destructive text-destructive-foreground shadow-raised-sm hover:bg-destructive/90 active:shadow-pressed',
					// focus
					'focus-visible:border-destructive/40 focus-visible:ring-destructive/50',
				],
				link: 'text-primary underline-offset-4 hover:underline',
			},
			size: {
				default: [
					// size
					'h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
					// in a button group
					'in-data-[slot=button-group]:rounded-md',
				],
				xs: [
					// size
					'h-6 gap-1 rounded-[min(var(--radius-md),8px)] px-2 text-xs has-data-[icon=inline-end]:pr-1.5',
					'has-data-[icon=inline-start]:pl-1.5',
					// in a button group
					'in-data-[slot=button-group]:rounded-md',
					// icons
					"[&_ng-icon:not([class*='text-'])]:text-[length:--spacing(3)]",
				],
				sm: [
					// size
					'h-9 gap-1 rounded-[min(var(--radius-md),10px)] px-3 has-data-[icon=inline-end]:pr-1.5',
					'has-data-[icon=inline-start]:pl-1.5',
					// in a button group
					'in-data-[slot=button-group]:rounded-md',
				],
				lg: 'h-11 gap-1.5 px-5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
				icon: 'size-9',
				'icon-xs': [
					// size
					'size-6 rounded-[min(var(--radius-md),8px)]',
					// in a button group
					'in-data-[slot=button-group]:rounded-md',
					// icons
					"[&_ng-icon:not([class*='text-'])]:text-[length:--spacing(3)]",
				],
				'icon-sm': 'size-8 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-md',
				'icon-lg': 'size-10',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

@Directive({
	selector: 'button[hlmBtn], a[hlmBtn]',
	exportAs: 'hlmBtn',
	hostDirectives: [{ directive: BrnButton, inputs: ['disabled'] }],
	host: { 'data-slot': 'button' },
})
export class HlmButton {
	private readonly _config = injectBrnButtonConfig();

	private readonly _additionalClasses = signal<ClassValue>('');

	public readonly variant = input<ButtonVariants['variant']>(this._config.variant);

	public readonly size = input<ButtonVariants['size']>(this._config.size);

	constructor() {
		classes(() => [buttonVariants({ variant: this.variant(), size: this.size() }), this._additionalClasses()]);
	}

	setClass(classes: string): void {
		this._additionalClasses.set(classes);
	}
}
