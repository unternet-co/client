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

interface ResourceInit {
  uri?: string;
  protocol?: string;
  name?: string;
  short_name?: string;
  icons?: ResourceIcon[];
  description?: string;
  actions?: Record<string, ActionDefinition>;
}

export class Resource {
  uri: string;
  protocol: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  name?: string;
  short_name?: string;
  icons?: ResourceIcon[];
  description?: string;
  actions?: Record<string, ActionDefinition>;

  constructor(init: ResourceInit) {
    let urlObject: URL;
    try {
      urlObject = new URL(init.uri);
    } catch (e) {
      throw new Error(`Resource URI is invalid.`);
    }

    this.uri = init.uri;
    this.protocol = urlObject.protocol;
    this.hostname = urlObject.hostname;
    this.port = urlObject.port;
    this.pathname = urlObject.pathname;
    this.search = urlObject.search;
    this.hash = urlObject.hash;
    this.name = init.name;
    this.short_name = init.short_name;
    this.icons = init.icons;
    this.description = init.description;
    this.actions = init.actions;
  }
}
