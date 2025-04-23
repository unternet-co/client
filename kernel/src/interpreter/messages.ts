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
import { encodeActionHandle } from '../runtime/actions';

export type Message =
  | CoreSystemMessage
  | CoreUserMessage
  | CoreAssistantMessage;

export function createUserMessage(content: string) {
  return {
    role: 'user',
    content,
  } as Message;
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
        const { directive, process, content } = output as ActionOutput;
        const actionUri = encodeActionHandle(directive.uri, directive.actionId);
        let messageStr = `Action called: ${actionUri}.\n`;
        const outputStr = JSON.stringify(
          process ? process.describe() : content
        );
        messageStr += `Output: ${outputStr}`;
        console.log(messageStr);
        messages.push(createAssistantMessage(messageStr));
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
