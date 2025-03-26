import { encodeActionUri } from '../uri-encoder.js';
import { JSONSchemaDefinition } from '../shared-types.js';
import { tool, ToolSet, jsonSchema } from 'ai';

export interface ResourceIcon {
  src: string;
  purpose?: string;
  sizes?: string;
  type?: string;
}

export type ResourceActionMap = { [id: string]: ResourceAction };

export interface ResourceAction {
  description?: string;
  params_schema?: JSONSchemaDefinition;
}

export class Resource {
  uri: string;
  protocol: string;
  name?: string;
  short_name?: string;
  icons?: ResourceIcon[];
  description?: string;
  actions?: ResourceActionMap;

  static toTools(resourceMap?: ResourceMap): ToolSet {
    const tools: ToolSet = {};
    if (!resourceMap || resourceMap.isEmpty()) return tools;

    for (const resource of resourceMap.values()) {
      for (const actionId in resource.actions) {
        const action = resource.actions[actionId];

        const actionUri = encodeActionUri({
          protocol: resource.protocol,
          resourceUri: resource.uri,
          actionId,
        });

        tools[actionUri] = tool({
          description: action.description,
          parameters: jsonSchema(action.params_schema),
        });
      }
    }

    return tools;
  }
}

export class ResourceMap extends Map<string, Resource> {
  add(resource: Resource) {
    this.set(resource.uri, resource);
  }

  isEmpty() {
    return this.size === 0;
  }
}
