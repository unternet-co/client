import { ActionRecord, Resource } from './resources';

export interface ActionDirective {
  protocol: string;
  resourceId?: string;
  actionId?: string;
  args?: Record<string, any>;
}

export function createActionRecord(resources: Resource[]): ActionRecord {
  const actions: ActionRecord = {};

  for (const resource of resources) {
    for (const id in resource.actions) {
      const action = resource.actions[id];
      const actionUri = `${resource.uri}#${id}`;
      actions[actionUri] = action;
    }
  }

  return actions;
}

// interface UriComponents {
//   uri,
//   actionId?: string;
// }

// export function encodeActionUri({
//   protocol,
//   resourceId,
//   actionId,
// }: UriComponents) {
//   // <protocol>:<resource_uri>#<action_id>
//   let uriString = '';
//   if (protocol) uriString += `${protocol}:`;
//   if (resourceId) uriString += encodeURIComponent(resourceId);
//   if (actionId) uriString += `#${actionId}`;
//   return uriString;
// }

// export function decodeActionUri(encodedActionURI: string): UriComponents {
//   let [protocol, ...rest] = encodedActionURI.split(':');
//   let [resourceId, actionId] = rest.join(':').split('#');

//   if (!resourceId || resourceId === 'undefined') {
//     resourceId = undefined;
//   } else {
//     resourceId = decodeURIComponent(resourceId);
//   }
//   if (!actionId || actionId === 'undefined') actionId = undefined;

//   return {
//     protocol,
//     resourceId,
//     actionId,
//   };
// }
