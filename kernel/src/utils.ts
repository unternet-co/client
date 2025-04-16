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
  UriComponents,
} from './types';

// ACTIONS

/**
 * Decompose an action URI string into its components.
 *
 * @param encodedActionURI The action URI string.
 * @returns The components extracted from the URI.
 */
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

/**
 * Create an action URI.
 *
 * @param uriComponents The components to encode into an action URI.
 * @returns The action URI string.
 */
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

// `ai` PKG MESSAGES

/**
 * Utility function to create an `ai` assistant message.
 *
 * @param content Message content.
 * @returns The assistant message.
 */
export function createAssistantMessage(content: string) {
  return {
    role: 'assistant',
    content,
  } as CoreAssistantMessage;
}

/**
 * Utility function to create an `ai` user message.
 *
 * @param content Message content.
 * @returns The user message.
 */
export function createUserMessage(content: string) {
  return {
    role: 'user',
    content,
  } as CoreUserMessage;
}

/**
 * Translates a set of interactions and prompts into messages.
 * These messages can be used with the `ai` SDK.
 *
 * @param interactions The interactions to translate.
 * @param prompts Additional prompts to translate into user messages.
 * @returns An array of messages.
 */
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

/**
 * Translate `FileInput` into an appropriate `ai` message.
 * Text files are translated into a `TextPart`,
 * images into a `ImagePart`, and other files into a `FilePart`.
 *
 * @param file The file input to translate.
 * @returns The appropriate part.
 */
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

// INTERACTIONS

/**
 * Utility function to create an `Interaction`
 * based on a `InteractionInput` or a regular string.
 *
 * @param input The input for the interaction.
 * @returns The interaction.
 */
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

// MISC

/**
 * Make a copy of an object.
 *
 * @param obj Any Javascript object (not just a record)
 * @returns The copy.
 */
export function clone(obj: Object) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Creates an action dictionary indexed by the action URIs
 * from the given resources.
 *
 * @param resources
 * @returns Action dictionary/record/map.
 */
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

/**
 * Creates a protocol-handlers dictionary indexed by the protocol scheme.
 *
 * @param protocols
 * @returns Protocol dictionary/record/map.
 */
export function createProtocolHandlers(protocols: Protocol[]) {
  const handlers: Record<string, ProtocolHandler> = {};
  for (const protocol of protocols) {
    handlers[protocol.scheme] = protocol.handler;
  }
  return handlers;
}
