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

export interface Resource {
  uri: string;
  protocol: string;
  name?: string;
  short_name?: string;
  icons?: ResourceIcon[];
  description?: string;
  actions?: ResourceActionMap;
}

export class ResourceMap extends Map<string, Resource> {
  add(resource: Resource) {
    this.set(resource.uri, resource);
  }

  isEmpty() {
    return this.size === 0;
  }

  toTools(): ToolSet {
    const tools: ToolSet = {};
    if (this.isEmpty()) return tools;

    for (const resource of this.values()) {
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
