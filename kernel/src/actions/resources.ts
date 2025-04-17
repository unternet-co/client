import { JSONSchemaDefinition } from '../shared/types';

export interface ResourceIcon {
  src: string;
  purpose?: string;
  sizes?: string;
  type?: string;
}

export interface ActionDefinition {
  description?: string;
  params_schema?: JSONSchemaDefinition;
}

export type ActionRecord = { [id: string]: ActionDefinition };

export interface Resource {
  uri: string;
  name?: string;
  short_name?: string;
  icons?: ResourceIcon[];
  description?: string;
  actions?: Record<string, ActionDefinition>;
}
