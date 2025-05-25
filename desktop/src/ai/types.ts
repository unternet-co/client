import { AI_MODEL_PROVIDERS } from '../constants';

export type AIModelProviderId = keyof typeof AI_MODEL_PROVIDERS;

export interface AIModelDescriptor {
  name: string;
  provider: AIModelProviderId;
  description?: string;
}
