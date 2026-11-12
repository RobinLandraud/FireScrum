import { Directive, input } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';
import { HlmCardConfig, injectHlmCardConfig } from './token';

@Directive({
	selector: '[hlmCard],hlm-card',
	exportAs: 'hlmCard',
	host: {
		'data-slot': 'card',
		'[attr.data-size]': 'size()',
	},
})
export class HlmCard {
	private readonly _defaultConfig = injectHlmCardConfig();
	public readonly size = input<HlmCardConfig['size']>(this._defaultConfig.size);

	constructor() {
		classes(() => [
			// frame
			'group/card flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-sm',
			'text-card-foreground',
			// spacing, smaller with size="sm"
			'[--card-spacing:--spacing(6)] data-[size=sm]:[--card-spacing:--spacing(4)] gap-(--card-spacing)',
			'py-(--card-spacing)',
			// image at the top or bottom
			'has-[>img:first-child]:pt-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl',
		]);
	}
}
