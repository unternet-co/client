import {
  CoreAssistantMessage,
  CoreSystemMessage,
  CoreUserMessage,
  FilePart,
  ImagePart,
  TextPart,
} from 'ai';
import {
  ActionOutput,
  FileInput,
  Interaction,
  TextOutput,
} from './interactions';
import { encodeActionHandle } from '../actions/actions';

export type Message =
  | CoreSystemMessage
  | CoreUserMessage
  | CoreAssistantMessage;

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
  } as Message;
}

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

        const actionUri = encodeActionHandle(output.directive.uri, 'TODO');
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
  if (
    file.mimeType?.startsWith('text/') ||
    file.mimeType === 'application/json'
  )
    return {
      type: 'text',
      text: new TextDecoder().decode(file.data),
    };

  if (file.mimeType?.startsWith('image/'))
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
