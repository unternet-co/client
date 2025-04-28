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
export type ActionDict = { [id: string]: ActionDefinition };

/**
 * A resource is anything that a model might use to get information
 * or perform an action in response to an input.
 *
 * Or, in other words, it specifies how a `Protocol` could be consumed,
 * along with some additional (optional) metadata.
 */
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
    protocol: urlObject.protocol.replace(':', ''),
    ...init,
  };

  return resource;
}
