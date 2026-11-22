import { HlmProgress } from './hlm-progress/directive';
import { HlmProgressIndicator } from './hlm-progress-indicator/directive';

export * from './hlm-progress/directive';
export * from './hlm-progress-indicator/directive';

export const HlmProgressImports = [HlmProgress, HlmProgressIndicator] as const;
