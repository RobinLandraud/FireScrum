import type { BooleanInput } from '@angular/cdk/coercion';
import type { ComponentType } from '@angular/cdk/portal';
import { NgComponentOutlet } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';

import { classes } from '@spartan-ng/helm/utils';
import { HlmDialogClose } from '../hlm-dialog-close/directive';

type HlmDialogContentContext = {
	$component?: ComponentType<unknown>;
	$dynamicComponentClass?: string;
	$showCloseButton?: boolean;
	$closeLabel?: string;
};

@Component({
	selector: 'hlm-dialog-content',
	exportAs: 'hlmDialogContent',
	imports: [NgComponentOutlet, HlmButton, HlmDialogClose, NgIcon],
	providers: [provideIcons({ lucideX })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'data-slot': 'dialog-content',
		'[attr.data-state]': 'state()',
	},
	templateUrl: './template.html',
	styleUrl: './template.scss',
})
export class HlmDialogContent {
	private readonly _dialogRef = inject(BrnDialogRef);
	private readonly _dialogContext = injectBrnDialogContext<HlmDialogContentContext | null>({ optional: true });

	public readonly showCloseButton = input<boolean, BooleanInput>(this._dialogContext?.$showCloseButton ?? true, {
		transform: booleanAttribute,
	});
	public readonly closeLabel = input<string>(this._dialogContext?.$closeLabel ?? 'Close');

	public readonly state = computed(() => this._dialogRef?.state() ?? 'closed');

	public readonly component = this._dialogContext?.$component;
	private readonly _dynamicComponentClass = this._dialogContext?.$dynamicComponentClass;

	constructor() {
		classes(() => [
			// colors and frame
			'bg-popover text-popover-foreground border border-border shadow-xl rounded-3xl outline-none',
			// open / close animation
			'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 duration-100',
			'data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
			// layout
			'relative flex flex-col p-6 sm:p-8 text-sm',
			// size: same for every modal
			'w-[calc(100vw-2rem)] max-w-[calc(100%-2rem)] sm:max-w-5xl h-[85dvh] mx-auto sm:mx-0',
			this._dynamicComponentClass,
		]);
	}
}
