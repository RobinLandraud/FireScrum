import { HlmTabs } from './hlm-tabs/directive';
import { HlmTabsContent } from './hlm-tabs-content/directive';
import { HlmTabsContentLazy } from './hlm-tabs-content-lazy/directive';
import { HlmTabsList } from './hlm-tabs-list/directive';
import { HlmTabsPaginatedList } from './hlm-tabs-paginated-list/component';
import { HlmTabsTrigger } from './hlm-tabs-trigger/directive';

export * from './hlm-tabs/directive';
export * from './hlm-tabs-content/directive';
export * from './hlm-tabs-content-lazy/directive';
export * from './hlm-tabs-list/directive';
export * from './hlm-tabs-paginated-list/component';
export * from './hlm-tabs-trigger/directive';

export const HlmTabsImports = [
	HlmTabs,
	HlmTabsList,
	HlmTabsTrigger,
	HlmTabsContent,
	HlmTabsContentLazy,
	HlmTabsPaginatedList,
] as const;
