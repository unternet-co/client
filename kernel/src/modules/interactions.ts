import { UserContent } from 'ai';
import { Message } from '../shared-types.js';

/* Top-level type */

export interface Interaction {
  input: InteractionInput;
  outputs: InteractionOutput[];
}

/* Input & Output */

export type InteractionInput = FileInput | ImageInput | TextInput;

export interface FileInput {
  file: Uint8Array;
}

export interface ImageInput {
  image: Uint8Array;
}

export interface TextInput {
  text: string;
}

/* Output */

export type InteractionOutput = FileOutput | ImageOutput | TextOutput;

export interface FileOutput {
  type: 'file';
  content: Uint8Array;
}

export interface ImageOutput {
  type: 'image';
  content: Uint8Array;
}

export interface TextOutput {
  type: 'text';
  content: string;
}

/* Constructors */

export function createInteraction(input: InteractionInput): Interaction {
  return {
    input,
    outputs: [],
  };
}

export function createTextOutput(text: string): InteractionOutput {
  return {
    type: 'text',
    content: text,
  };
}

/* Interaction → Message */

export function interactionsToMessages(interactions: Interaction[]): Message[] {
  let messages: Message[] = [];

  for (let interaction of interactions) {
    // User message
    const content = interactionInputToMessageContent(interaction.input);
    if (content) messages.push({ role: 'user', content });

    // Assistant message
    for (let output of interaction?.outputs || []) {
      if (output.type === 'text') {
        const textOutput = output as TextOutput;
        messages.push({
          role: 'assistant',
          content: textOutput.content,
        });
      }
    }
  }

  return messages;
}

function interactionInputToMessageContent(
  input: InteractionInput
): UserContent {
  const prop = typeof input === 'object' ? Object.keys(input)[0] : undefined;

  switch (prop) {
    case 'file': {
      const bytes = (input as FileInput).file;
      return [
        {
          type: 'file',
          data: bytes,
          filename: undefined,
          mimeType: undefined,
        },
      ];
    }
    case 'image': {
      const bytes = (input as ImageInput).image;
      return [{ type: 'image', image: bytes, mimeType: undefined }];
    }
    case 'text': {
      return (input as TextInput).text;
    }
  }
}
