import { ActionDict, Resource } from './resources';

export type ProcessDisplayMode = 'inline' | 'snippet' | 'auto';

/**
 * An instruction of how an action should be consumed.
 */
export interface ActionProposal {
  uri: string;
  actionId: string;
  args?: Record<string, any>;
  display: ProcessDisplayMode;
}

/**
 * Creates an action dictionary indexed by the action handle
 * from the given resources.
 *
 * @param resources
 * @returns Action dictionary/record/map.
 */
export function createActionDict(resources: Resource[]): ActionDict {
  const actions: ActionDict = {};

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

/**
 * Create a full tool ID that incorporates the resource
 * for use ONLY by the model.
 *
 * @param uri The action-directive URI.
 * @param actionId The id belonging to the action.
 * @returns The action handle.
 */
export function encodeActionHandle(uri: string, actionId: string) {
  // https://my-applet.example.com->action_id
  if (actionId) return `${uri}->${actionId}`;
  return uri;
}

/**
 * Decompose an action handle into its components.
 *
 * @param actionHandle The action handle.
 * @returns The components extracted from the URI.
 */
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
