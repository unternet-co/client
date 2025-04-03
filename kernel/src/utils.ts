import {
  ActionOutput,
  ActionRecord,
  Interaction,
  InteractionInput,
  Message,
  Protocol,
  ProtocolHandler,
  Resource,
  TextOutput,
} from './types';

export function createInteraction(
  input: InteractionInput | string
): Interaction {
  if (typeof input === 'string') {
    const text = input;
    input = { text };
  }

  return {
    input,
    outputs: [],
  };
}

export function createProtocolHandlers(protocols: Protocol[]) {
  const handlers: Record<string, ProtocolHandler> = {};
  for (const protocol of protocols) {
    handlers[protocol.scheme] = protocol.handler;
  }
  return handlers;
}

export function createActionRecord(resources: Resource[]): ActionRecord {
  const actions: ActionRecord = {};

  for (const resource of resources) {
    for (const actionId in resource.actions) {
      const action = resource.actions[actionId];

      const actionUri = encodeActionUri({
        protocol: resource.protocol,
        resourceId: resource.id,
        actionId,
      });

      actions[actionUri] = action;
    }
  }

  return actions;
}

export function createMessages(
  interactions: Interaction[],
  prompt?: string
): Message[] {
  let messages: Message[] = [];

  for (let interaction of interactions) {
    messages.push({
      role: 'user',
      content: interaction.input.text,
    });

    if (!interaction.outputs) continue;

    for (let output of interaction.outputs) {
      if (output.type === 'text') {
        const textOutput = output as TextOutput;
        messages.push({
          role: 'assistant',
          content: textOutput.content,
        });
      } else if (output.type === 'action') {
        const actionOutput = output as ActionOutput;

        const actionUri = encodeActionUri(actionOutput.directive);
        messages.push({
          role: 'system',
          content: `Action called: ${actionUri}.\nOutput:${JSON.stringify(actionOutput.content)}`,
        });
      }
    }
  }

  if (prompt) {
    messages.push({
      role: 'system',
      content: prompt,
    });
  }

  return messages;
}

interface UriComponents {
  protocol: string;
  resourceId?: string;
  actionId?: string;
}

export function encodeActionUri({
  protocol,
  resourceId,
  actionId,
}: UriComponents) {
  // <protocol>:<resource_uri>#<action_id>
  let uriString = '';
  if (protocol) uriString += `${protocol}:`;
  uriString += resourceId;
  if (actionId) uriString += `#${actionId}`;
  return uriString;
}

export function decodeActionUri(encodedActionURI: string): UriComponents {
  let [protocol, ...rest] = encodedActionURI.split(':');
  let [resourceId, actionId] = rest.join(':').split('#');

  if (!resourceId || resourceId === 'undefined') resourceId = undefined;
  if (!actionId || actionId === 'undefined') actionId = undefined;

  return {
    protocol,
    resourceId,
    actionId,
  };
}
