import { Interaction as KernelInteraction } from '@unternet/kernel';

/* Tabs */

export interface Tab {
  id: string;
  title: string;
  type: 'workspace' | 'home';
  workspaceId?: string;
}

/* Workspaces */

export interface Workspace {
  id: string;
}

/* Interactions */

export interface Interaction extends KernelInteraction {
  id: string;
  workspaceId: string;
}

export {
  type InteractionInput,
  type InteractionOutput,
} from '@unternet/kernel';
