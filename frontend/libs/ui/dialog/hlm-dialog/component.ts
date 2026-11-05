import { ChangeDetectionStrategy, Component, forwardRef } from '@angular/core';
import { BrnDialog, provideBrnDialogDefaultOptions } from '@spartan-ng/brain/dialog';
import { HlmDialogOverlay } from '../hlm-dialog-overlay/directive';

@Component({
	selector: 'hlm-dialog',
	exportAs: 'hlmDialog',
	imports: [HlmDialogOverlay],
	providers: [
		{
			provide: BrnDialog,
			useExisting: forwardRef(() => HlmDialog),
		},
		provideBrnDialogDefaultOptions({
			// add custom options here
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './template.html',
	styleUrl: './template.scss',
})
export class HlmDialog extends BrnDialog {}
