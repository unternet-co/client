import { ActionDict } from './actions';

export interface ResourceIcon {
  src: string;
  purpose?: string;
  sizes?: string;
  type?: string;
}

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
  actions?: ActionDict;
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
