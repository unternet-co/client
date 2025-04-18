import { ActionRecord, Resource } from './resources';

export interface ActionDirective {
  uri: string;
  actionId: string;
  args?: Record<string, any>;
}

export function createActionRecord(resources: Resource[]): ActionRecord {
  const actions: ActionRecord = {};

  for (const resource of resources) {
    for (const id in resource.actions) {
      const action = resource.actions[id];
      const actionHandle = encodeActionHandle(resource.uri, id);
      actions[actionHandle] = action;
    }
  }

  return actions;
}

interface UriComponents {
  uri: string;
  actionId: string;
}

// Create a full tool ID that incorporates the resource
// for use ONLY by the model
export function encodeActionHandle(uri: string, actionId: string) {
  // https://my-applet.example.com->action_id
  if (actionId) uri += `->${actionId}`;
  return uri;
}

export function decodeActionHandle(actionHandle: string): UriComponents {
  let [uri, actionId] = actionHandle.split('->');

  if (!actionId || !uri) {
    throw new Error(`Invalid action URI: ${uri}.`);
  }

  return {
    uri,
    actionId,
  };
}
