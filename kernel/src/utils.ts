import {
  ActionRecord,
  Interaction,
  InteractionOutput,
  Message,
  Resource,
  Strategy,
} from './types.js';

export function createStrategyRecord(...strategies: Array<Strategy>) {
  const strategyRecord: Record<string, Strategy> = {};
  for (const strategy of strategies) {
    strategyRecord[strategy.name] = strategy;
  }
  return strategyRecord;
}

export function createStrategy(init: Strategy) {
  return init as Strategy;
}

export function createActions(resources: Resource[]): ActionRecord {
  const actions: ActionRecord = {};

  for (const resource of resources) {
    for (const actionId in resource.actions) {
      const action = resource.actions[actionId];

      const actionUri = encodeActionUri({
        protocol: resource.protocol,
        resourceUri: resource.uri,
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
        const textOutput = output as InteractionOutput;
        messages.push({
          role: 'assistant',
          content: textOutput.content,
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
  resourceUri: string;
  actionId: string;
}

export function encodeActionUri({
  protocol,
  resourceUri,
  actionId,
}: UriComponents) {
  // <protocol>:<resource_uri>#<action_id>
  let uriString = '';
  if (protocol) uriString += `${protocol}:`;
  uriString += resourceUri;
  if (actionId) uriString += `#${actionId}`;
  return uriString;
}

export function decodeActionUri(encodedActionURI: string): UriComponents {
  let [protocol, ...rest] = encodedActionURI.split(':');
  let [resourceUri, actionId] = rest.join(':').split('#');

  if (resourceUri.startsWith('//')) {
    // This is an internet protocol, not a resource protocol, so it's part of the resource URI
    resourceUri = `${protocol}:${resourceUri}`;
    protocol = undefined;
  }

  return {
    protocol,
    resourceUri,
    actionId: actionId,
  };
}
