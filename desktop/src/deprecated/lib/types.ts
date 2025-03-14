import { AppletActionDescriptor } from '@web-applets/sdk';
import { Workspace } from '../kernel/workspaces';

export interface IndexedAction {
  key: string;
  appletUrl: string;
  action: AppletActionDescriptor;
}

export interface JSONSchema {
  type:
    | 'object'
    | 'string'
    | 'number'
    | 'integer'
    | 'array'
    | 'boolean'
    | 'null';
  description?: string;
  properties?: {
    [key: string]: JSONSchema;
  };
  required?: string[];
  additionalProperties?: boolean;
}

export interface ActionChoice {
  url: string;
  protocol: string;
  actionId: string;
  arguments: any;
}

export interface InputOptions {
  workspaceId: Workspace['id'];
}
