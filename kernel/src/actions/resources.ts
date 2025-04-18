import { JSONSchemaDefinition } from '../shared/types';

export interface ResourceIcon {
  src: string;
  purpose?: string;
  sizes?: string;
  type?: string;
}

/**
 * A definition of an action.
 *
 * Lets the assistant know what inputs can be given
 * in order to do something.
 *
 * {@link ActionDirective} Passing action parameters around.
 * {@link Protocol} Processing actions.
 */
export interface ActionDefinition {
  description?: string;
  params_schema?: JSONSchemaDefinition;
}

/**
 * Action dictionary, indexed by the action id.
 */
export type ActionRecord = { [id: string]: ActionDefinition };

/**
 * The properties needed to create a resource.
 *
 * A resource is anything that a model might use to get information
 * or perform an action in response to an input.
 *
 * Or, in other words, it specifies how a `Protocol` could be consumed,
 * along with some additional (optional) metadata.
 */
interface ResourceInit {
  uri?: string;
  protocol?: string;
  name?: string;
  short_name?: string;
  icons?: ResourceIcon[];
  description?: string;
  actions?: ActionRecord;
}

/**
 * A resource is anything that a model might use to get information
 * or perform an action in response to an input.
 *
 * Or, in other words, it specifies how a `Protocol` could be consumed,
 * along with some additional (optional) metadata.
 */
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
  actions?: ActionRecord;

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
