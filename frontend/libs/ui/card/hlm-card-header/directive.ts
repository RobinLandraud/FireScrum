import { Directive } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';

@Directive({
	selector: '[hlmCardHeader],hlm-card-header',
	exportAs: 'hlmCardHeader',
	host: { 'data-slot': 'card-header' },
})
export class HlmCardHeader {
	constructor() {
		classes(
			() =>
				[
					// layout: title, description and action
					'group/card-header @container/card-header grid auto-rows-min items-start gap-1',
					'has-data-[slot=card-action]:grid-cols-[1fr_auto]',
					'has-data-[slot=card-description]:grid-rows-[auto_auto]',
					// spacing
					'rounded-t-xl px-(--card-spacing) [.border-b]:pb-(--card-spacing)',
				],
		);
	}
}
