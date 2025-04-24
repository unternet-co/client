import { JSONSchemaDefinition } from '../shared/types';

export interface ResourceIcon {
  src: string;
  purpose?: string;
  sizes?: string;
  type?: string;
}

export interface ActionMap {
  [id: string]: ActionDefinition;
}

export interface ActionDefinition {
  description?: string;
  params_schema?: JSONSchemaDefinition;
}

export type ActionRecord = { [id: string]: ActionDefinition };

export interface Resource {
  uri: string;
  protocol: string;
  name?: string;
  short_name?: string;
  icons?: ResourceIcon[];
  description?: string;
  actions?: ActionMap;
}

type ResourceInit = { uri: string } & Partial<Resource>;

export function resource(init: ResourceInit): Resource {
  let urlObject: URL;
  try {
    urlObject = new URL(init.uri);
  } catch (e) {
    throw new Error(`Resource URI is invalid.`);
  }

  const resource: Resource = {
    uri: init.uri,
    protocol: urlObject.protocol,
    ...init,
  };

  return resource;
}
