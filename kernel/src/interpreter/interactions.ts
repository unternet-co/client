import { ActionDirective } from '../actions/actions';

export interface Interaction {
  input: InteractionInput;
  outputs: InteractionOutput[];
}

export interface InteractionInput {
  text?: string;
  files?: FileInput[];
}

export interface FileInput {
  data: Uint8Array;
  filename?: string;
  mimeType?: string;
}

export type InteractionOutput = TextOutput | ActionOutput;

export interface TextOutput {
  type: 'text';
  content: string;
}

export interface ActionOutput {
  type: 'action';
  directive: ActionDirective;
  content: any;
}

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
