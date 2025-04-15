import {
  CoreAssistantMessage,
  CoreUserMessage,
  FilePart,
  ImagePart,
  TextPart,
} from 'ai';
import {
  ActionOutput,
  ActionRecord,
  FileInput,
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

export function clone(obj: Object) {
  return JSON.parse(JSON.stringify(obj));
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

export function createUserMessage(content: string) {
  return {
    role: 'user',
    content,
  } as CoreUserMessage;
}

export function createAssistantMessage(content: string) {
  return {
    role: 'assistant',
    content,
  } as CoreAssistantMessage;
}

export function createMessages(
  interactions: Interaction[],
  ...prompts: string[] | undefined
): Message[] {
  let messages: Message[] = [];

  for (let interaction of interactions) {
    if (interaction.input.text)
      messages.push(createUserMessage(interaction.input.text));

    if (interaction.input.files?.length) {
      const parts: Array<TextPart | ImagePart | FilePart> =
        interaction.input.files.map(fileMessage);

      messages.push({
        role: 'user',
        content: parts,
      });
    }

    if (!interaction.outputs) continue;

    for (let output of interaction.outputs) {
      if (output.type === 'text') {
        const textOutput = output as TextOutput;
        messages.push(createAssistantMessage(textOutput.content));
      } else if (output.type === 'action') {
        console.log(output);
        const actionOutput = output as ActionOutput;

        const actionUri = encodeActionUri(output.directive);
        messages.push(
          createAssistantMessage(
            `Action called: ${actionUri}.\nOutput:${JSON.stringify(actionOutput.content)}`
          )
        );
      }
    }
  }

  if (prompts) {
    for (const prompt of prompts) {
      messages.push({
        role: 'user',
        content: prompt,
      });
    }
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
  if (resourceId) uriString += encodeURIComponent(resourceId);
  if (actionId) uriString += `#${actionId}`;
  return uriString;
}

export function decodeActionUri(encodedActionURI: string): UriComponents {
  let [protocol, ...rest] = encodedActionURI.split(':');
  let [resourceId, actionId] = rest.join(':').split('#');

  if (!resourceId || resourceId === 'undefined') {
    resourceId = undefined;
  } else {
    resourceId = decodeURIComponent(resourceId);
  }
  if (!actionId || actionId === 'undefined') actionId = undefined;

  return {
    protocol,
    resourceId,
    actionId,
  };
}

export function fileMessage(file: FileInput): TextPart | ImagePart | FilePart {
  if (file.mimeType.startsWith('text/') || file.mimeType === 'application/json')
    return {
      type: 'text',
      text: new TextDecoder().decode(file.data),
    };

  if (file.mimeType.startsWith('image/'))
    return {
      type: 'image',
      image: file.data,
      mimeType: file.mimeType,
    };

  return {
    type: 'file',
    data: file.data,
    filename: file.filename,
    mimeType: file.mimeType,
  };
}
